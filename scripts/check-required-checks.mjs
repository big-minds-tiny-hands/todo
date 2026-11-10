#!/usr/bin/env node
// check-required-checks.mjs -- every required check has a workflow job that
// produces it.
//
// Canonical home: big-minds-tiny-hands/.github. Repositories vendor this file
// byte-identical at scripts/check-required-checks.mjs and run it in their PR
// gate (CI-STANDARD.md).
//
// Required names come from:
//   - branch protection and rulesets on the branch (GitHub API, read access is
//     enough). A check bound to another app (Vercel, Mergify) is external and
//     is listed, not checked.
//   - Mergify: check-success, check-success-or-neutral, and status-success
//     conditions in queue_rules and merge_protections.
//   - --required <name>, repeatable.
// Produced names come from the repository's workflow files, read offline:
// jobs in workflows that run on every pull_request or pull_request_target to
// the branch (no paths filter, branch selected, opened and synchronize types),
// with matrix suffixes and reusable-workflow "caller / job" names. A call into
// another repository cannot be read, so it counts as "caller / *".
//
// Usage: check-required-checks.mjs [--repo owner/name] [--branch main]
//                                  [--required <name>]...
//        check-required-checks.mjs --self-test
// Branch protection is read only with --repo. The token is $GH_TOKEN,
// $GITHUB_TOKEN, or `gh auth token`. Needs the `yaml` package.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ACTIONS_APP_ID = 15368;
const PR_EVENTS = ["pull_request", "pull_request_target"];
const PR_TYPES_NEEDED = ["opened", "synchronize"];
// Mergify reads the first of these it finds.
const MERGIFY_FILES = [".mergify.yml", ".mergify.yaml", ".mergify/config.yml", ".mergify/config.yaml", ".github/mergify.yml", ".github/mergify.yaml"];
const MERGIFY_CHECK = /^(check-success-or-neutral|check-success|status-success)\s*[=:]\s*(.+)$/;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WILDCARD = { display: "*", pattern: ".*" };
const literal = (s) => ({ display: s, pattern: escapeRegex(s) });
const concat = (...parts) => ({
  display: parts.map((p) => p.display).join(""),
  pattern: parts.map((p) => p.pattern).join(""),
});
const isScalar = (v) => v === null || typeof v !== "object";

function nameTemplate(raw, matrixValues = {}) {
  const parts = [];
  let rest = String(raw);
  for (;;) {
    const start = rest.indexOf("${{");
    const end = start < 0 ? -1 : rest.indexOf("}}", start);
    if (end < 0) break;
    parts.push(literal(rest.slice(0, start)));
    const key = /^matrix\.([\w-]+)$/.exec(rest.slice(start + 3, end).trim())?.[1];
    const value = key === undefined ? undefined : matrixValues[key];
    parts.push(value !== undefined && isScalar(value) ? literal(String(value)) : WILDCARD);
    rest = rest.slice(end + 2);
  }
  parts.push(literal(rest));
  return concat(...parts);
}

// A matrix GitHub expands at run time is dynamic: its values are unknown here.
function matrixCombos(matrix) {
  if (matrix === undefined || matrix === null) return { dynamic: false, combos: [] };
  if (typeof matrix !== "object") return { dynamic: true };
  const { include = [], exclude = [], ...base } = matrix;
  if (!Array.isArray(include) || !Array.isArray(exclude)) return { dynamic: true };
  let originals = Object.keys(base).length ? [{}] : [];
  for (const [key, values] of Object.entries(base)) {
    if (!Array.isArray(values)) return { dynamic: true };
    originals = originals.flatMap((c) => values.map((v) => ({ ...c, [key]: v })));
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  originals = originals.filter((c) => !exclude.some((ex) => Object.entries(ex).every(([k, v]) => same(c[k], v))));
  // An include entry extends each original combination whose base values it
  // does not overwrite, or else becomes a combination of its own.
  const added = [];
  for (const inc of include) {
    const onBase = Object.entries(inc).filter(([k]) => k in base);
    const targets = originals.filter((c) => onBase.every(([k, v]) => same(c[k], v)));
    if (targets.length) for (const t of targets) Object.assign(t, inc);
    else added.push({ ...inc });
  }
  return { dynamic: false, combos: [...originals, ...added] };
}

const valueName = (v) => (isScalar(v) ? literal(String(v)) : WILDCARD);

// The names a job reports: its name (or id), with " (a, b)" appended for a
// matrix job whose name does not use the matrix. When the name has other
// expressions, both forms are accepted.
function jobDisplayNames(id, job) {
  const raw = String(job?.name ?? id);
  const matrix = matrixCombos(job?.strategy?.matrix);
  const expressions = [...raw.matchAll(/\$\{\{(.*?)\}\}/g)].map((m) => m[1]);
  const usesMatrix = expressions.some((e) => /\bmatrix\b/.test(e));
  // A dynamic matrix is one combination whose values are all unknown.
  const combos = matrix.dynamic ? [null] : matrix.combos;
  if (!combos.length) return [nameTemplate(raw)];
  return combos.flatMap((combo) => {
    const named = nameTemplate(raw, combo ?? {});
    if (usesMatrix) return [named];
    const values = combo ? Object.values(combo).map(valueName) : [WILDCARD];
    const suffix = concat(literal(" ("), ...values.flatMap((v, i) => (i ? [literal(", "), v] : [v])), literal(")"));
    return expressions.length ? [named, concat(named, suffix)] : [concat(named, suffix)];
  });
}

function eventConfigs(on) {
  if (typeof on === "string") return { [on]: {} };
  if (Array.isArray(on)) return Object.fromEntries(on.map((e) => [e, {}]));
  return on && typeof on === "object" ? on : {};
}

// GitHub filter pattern: * stops at /, ** does not, ? is one character.
const GLOB = { "\\*\\*": ".*", "\\*": "[^/]*", "\\?": "." };
const globRegex = (glob) => new RegExp(`^${escapeRegex(glob).replace(/\\\*\\\*|\\\*|\\\?/g, (m) => GLOB[m])}$`);

function branchSelected(branch, { branches, "branches-ignore": ignored }) {
  if (ignored) return !ignored.some((g) => globRegex(String(g)).test(branch));
  if (!branches) return true;
  let selected = false;
  for (const g of branches.map(String)) {
    if (g.startsWith("!")) {
      if (globRegex(g.slice(1)).test(branch)) selected = false;
    } else if (globRegex(g).test(branch)) selected = true;
  }
  return selected;
}

/**
 * Why a workflow that runs on pull requests skips some to `branch`, or null
 * when it runs on every one. A required check from a workflow that skips some
 * PRs stays pending on those PRs.
 */
export function skipsSomePrs(configs, branch) {
  const reasons = [];
  for (const event of PR_EVENTS) {
    if (!(event in configs)) continue;
    const config = configs[event] ?? {};
    if (!branchSelected(branch, config)) reasons.push(`${event} does not run for ${branch}`);
    else if (config.paths || config["paths-ignore"]) reasons.push(`${event} is filtered by paths`);
    else if (config.types && !PR_TYPES_NEEDED.every((t) => config.types.includes(t)))
      reasons.push(`${event} types omit ${PR_TYPES_NEEDED.filter((t) => !config.types.includes(t)).join(", ")}`);
    else return null;
  }
  return reasons.join("; ");
}

export function producedChecks(workflows, branch = "main") {
  const produced = [];
  const warnings = [];
  const expand = (path, wf, depth) => {
    const out = [];
    for (const [id, job] of Object.entries(wf?.jobs ?? {})) {
      const names = jobDisplayNames(id, job);
      if (typeof job?.uses !== "string") {
        out.push(...names);
        continue;
      }
      const ref = job.uses.replace(/@.*$/, "");
      let inner = [WILDCARD];
      if (ref.startsWith("./")) {
        const target = workflows[ref.slice(2)];
        if (!target) warnings.push(`${path}: jobs.${id} calls ${job.uses}, which is not in this repository`);
        else if (depth >= 10) warnings.push(`${path}: jobs.${id} calls ${job.uses} past GitHub's nesting limit`);
        else inner = expand(ref.slice(2), target, depth + 1);
      } else {
        // Another repository's workflow; a caller's token cannot read a
        // private one, so any job name under the caller counts.
        warnings.push(`${path}: jobs.${id} calls ${job.uses}, so any "${names[0].display} / ..." counts`);
      }
      for (const outer of names) for (const n of inner) out.push(concat(outer, literal(" / "), n));
    }
    return out;
  };
  for (const [path, wf] of Object.entries(workflows)) {
    const configs = eventConfigs(wf?.on);
    if (!PR_EVENTS.some((e) => e in configs)) continue;
    const skips = skipsSomePrs(configs, branch);
    for (const name of expand(path, wf, 0)) {
      produced.push({ ...name, regex: new RegExp(`^${name.pattern}$`), workflow: path, skips });
    }
  }
  return { produced, warnings };
}

export function mergifyRequired(config) {
  // Conditions under `not` are forbidden, not required, so they are skipped.
  const names = (conditions) =>
    [conditions ?? []].flat().flatMap((c) => {
      if (typeof c === "string") {
        const m = MERGIFY_CHECK.exec(c.trim());
        if (!m) return [];
        // "@app-slug/name" binds the check to one app.
        const [, app, name] = /^(?:@([\w.-]+)\/)?(.*)$/.exec(m[2].trim().replace(/^(["'])(.*)\1$/, "$2"));
        return [{ name, app }];
      }
      return c && typeof c === "object" ? [...names(c.and), ...names(c.or)] : [];
    });
  const sources = [
    ...(config?.queue_rules ?? []).flatMap((rule) =>
      ["queue_conditions", "merge_conditions"].map((k) => [rule[k], `Mergify queue_rules[${rule.name}].${k}`]),
    ),
    ...(config?.merge_protections ?? []).map((p) => [p.success_conditions, `Mergify merge_protections[${p.name}]`]),
  ];
  return sources.flatMap(([conditions, source]) => names(conditions).map(({ name, app }) => ({ name, source, app })));
}

/**
 * Check names that GitHub requires on the branch. `branch` is the response of
 * GET /repos/{repo}/branches/{branch}; `rules` of GET .../rules/branches/{branch}.
 * A check bound to an app other than GitHub Actions is external.
 */
export function githubRequired(branch, rules = []) {
  const out = [];
  const add = (name, appId, source) => {
    // GitHub stores "any app may post this check" as null or -1.
    out.push({ name, source, external: appId != null && appId !== -1 && appId !== ACTIONS_APP_ID });
  };
  const rsc = branch?.protection?.required_status_checks;
  if (rsc?.checks?.length) for (const c of rsc.checks) add(c.context, c.app_id, "branch protection");
  else for (const c of rsc?.contexts ?? []) add(c, null, "branch protection");
  for (const rule of rules) {
    if (rule.type !== "required_status_checks") continue;
    for (const c of rule.parameters?.required_status_checks ?? []) {
      add(c.context, c.integration_id, `ruleset ${rule.ruleset_id ?? ""}`.trim());
    }
  }
  return out;
}

const fullyDynamic = (p) => !p.display.replace(/[*\s/()]/g, "");

/**
 * Gives each required check a status: external, missing (no job produces it on
 * every PR), dynamic (only a name built at run time could produce it), or ok.
 * @param {Array<{ name: string, source: string, external?: boolean }>} required
 * @param {Array<{ regex: RegExp, display: string, workflow: string, skips: string | null }>} produced
 * @returns {Array<{ name: string, source: string, status: string, why?: string }>}
 */
export function classify(required, produced) {
  return required.map((r) => {
    if (r.external) return { ...r, status: "external" };
    const producers = produced.filter((p) => p.regex.test(r.name));
    const everyPr = producers.filter((p) => !p.skips);
    if (!everyPr.length) {
      const skips = producers.map((p) => `${p.workflow}: ${p.skips}`);
      return { ...r, status: "missing", why: skips.length ? `runs on some PRs only (${skips.join("; ")})` : "no job produces it" };
    }
    return { ...r, status: everyPr.every(fullyDynamic) ? "dynamic" : "ok" };
  });
}

export function readRepo(root) {
  const workflows = {};
  const dir = join(root, ".github/workflows");
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).sort()) {
      if (!/\.ya?ml$/.test(f)) continue;
      workflows[`.github/workflows/${f}`] = parse(readFileSync(join(dir, f), "utf8"));
    }
  }
  const mergifyPath = MERGIFY_FILES.find((f) => existsSync(join(root, f)));
  const mergify = mergifyPath ? parse(readFileSync(join(root, mergifyPath), "utf8")) : null;
  return { workflows, mergify };
}

function token() {
  const fromEnv = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

async function api(path, auth) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/**
 * @param {{
 *   workflows: Record<string, any>,
 *   mergify: any,
 *   githubChecks?: Array<{ name: string, source: string, external?: boolean }>,
 *   extra?: string[],
 *   branch?: string,
 * }} input
 */
export function check({ workflows, mergify, githubChecks = [], extra = [], branch = "main" }) {
  const { produced, warnings } = producedChecks(workflows, branch);
  // The org base config holds no check conditions (its self-check proves it),
  // so `extends: .github` adds no requirement. Any other base is not read.
  if (mergify?.extends && mergify.extends !== ".github") warnings.push(`.mergify.yml extends ${mergify.extends}, which is not read`);
  // Mergify cannot bind a check to an app; a name that GitHub binds to
  // another app is external here too.
  const externalNames = new Set(githubChecks.filter((c) => c.external).map((c) => c.name));
  const results = classify(
    [
      ...githubChecks,
      ...mergifyRequired(mergify).map(({ app, ...r }) => ({
      ...r,
      external: (app !== undefined && app !== "github-actions") || externalNames.has(r.name),
    })),
      ...extra.map((name) => ({ name, source: "--required" })),
    ],
    produced,
  );
  return { results, produced, warnings, missing: results.filter((r) => r.status === "missing") };
}

function report({ results, produced, warnings, missing }) {
  for (const w of warnings) console.log(`note: ${w}`);
  for (const r of results) console.log(`${r.status.padEnd(8)} ${r.name}  (${r.source})${r.why ? `: ${r.why}` : ""}`);
  if (results.some((r) => r.status === "dynamic")) {
    console.log("note: a dynamic check matches only a job name built at run time; this guard cannot prove it.");
  }
  if (!missing.length) {
    console.log(`check-required-checks: ${results.length} required check(s), each produced or external`);
    return 0;
  }
  console.error(`\n${missing.length} required check(s) are not produced on every pull request, so a PR can wait for them forever.`);
  console.error("Rename the job back, remove its filter, or change the requirement in the same change.");
  console.error("If an app other than GitHub Actions posts the check, bind the requirement to that app.");
  console.error("Jobs that run on pull requests:");
  for (const p of produced) console.error(`  ${p.display}  (${p.workflow}${p.skips ? `; ${p.skips}` : ""})`);
  return 1;
}

function selfTest() {
  const failures = [];
  const eq = (label, got, want) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  };
  const names = (wfs) => producedChecks(wfs).produced.map((p) => p.display);
  const missingNames = (input) => check({ mergify: null, ...input }).missing.map((m) => m.name);

  const ci = parse(`
on: { pull_request: { branches: [main] }, push: { branches: [main] } }
jobs:
  quality: { name: "Quality gate (lint · unit · knip · tsc · build)", runs-on: x }
  e2e: { name: E2E, needs: quality, runs-on: x }
`);
  const hygiene = parse(`
on: { pull_request: { types: [opened, synchronize, reopened, edited] } }
jobs:
  hygiene:
    name: PR hygiene
    uses: big-minds-tiny-hands/.github/.github/workflows/pr-hygiene.yml@main
`);
  const release = parse("on: { push: { branches: [main] } }\njobs:\n  release: { name: Release, runs-on: x }\n");
  const workflows = { ".github/workflows/ci.yml": ci, ".github/workflows/hygiene.yml": hygiene, ".github/workflows/release.yml": release };
  eq("names", names(workflows), ["Quality gate (lint · unit · knip · tsc · build)", "E2E", "PR hygiene / *"]);
  const protection = (...checks) => ({ protection: { required_status_checks: { checks } } });
  const actions = (context) => ({ context, app_id: ACTIONS_APP_ID });
  const before = protection(actions("Quality gate (lint · unit · knip · tsc · build)"), actions("Secret scan (gitleaks)"), { context: "Vercel", app_id: 8329 });
  eq("incident", missingNames({ workflows, githubChecks: githubRequired(before) }), ["Secret scan (gitleaks)"]);
  const now = { protection: { required_status_checks: { contexts: ["Quality gate (lint · unit · knip · tsc · build)", "PR hygiene / checks"] } } };
  eq("fixed", missingNames({ workflows, githubChecks: githubRequired(now) }), []);
  eq("any app is not external", githubRequired(protection({ context: "a", app_id: -1 }, { context: "b", app_id: null })).map((r) => r.external), [false, false]);
  eq("push-only", missingNames({ workflows, extra: ["Release"] }), ["Release"]);

  const filtered = (on) => ({ "f.yml": parse(`on: ${on}\njobs:\n  j: { name: Gate }\n`) });
  eq("other branch", missingNames({ workflows: filtered("{ pull_request: { branches: [develop] } }"), extra: ["Gate"] }), ["Gate"]);
  eq("ignored branch", missingNames({ workflows: filtered("{ pull_request: { branches-ignore: ['ma*'] } }"), extra: ["Gate"] }), ["Gate"]);
  eq("negated branch", missingNames({ workflows: filtered("{ pull_request: { branches: ['**', '!main'] } }"), extra: ["Gate"] }), ["Gate"]);
  eq("glob branch", missingNames({ workflows: filtered("{ pull_request: { branches: ['ma*'] } }"), extra: ["Gate"] }), []);
  eq("paths", missingNames({ workflows: filtered("{ pull_request: { paths: ['docs/**'] } }"), extra: ["Gate"] }), ["Gate"]);
  eq("types", missingNames({ workflows: filtered("{ pull_request: { types: [opened] } }"), extra: ["Gate"] }), ["Gate"]);
  eq("merge_group only", missingNames({ workflows: filtered("merge_group"), extra: ["Gate"] }), ["Gate"]);
  eq("target", missingNames({ workflows: filtered("pull_request_target"), extra: ["Gate"] }), []);

  const mergify = parse(`
queue_rules:
  - name: default
    queue_conditions:
      - base = main
      - "check-success = PR hygiene / checks"
      - "check-success: E2E"
      - or: ["check-success=Lint PR title", "-check-success = ignored"]
      - not: { or: ["check-success = forbidden"] }
merge_protections:
  - name: t
    success_conditions: ["status-success = 'E2E'", "check-success = Vercel", "check-success = @github-actions/Ghost", "check-success = @vercel/Preview"]
`);
  eq("mergify", mergifyRequired(mergify).map((r) => r.name), ["PR hygiene / checks", "E2E", "Lint PR title", "E2E", "Vercel", "Ghost", "Preview"]);
  eq("mergify missing", missingNames({ workflows, mergify, githubChecks: githubRequired(before) }), ["Secret scan (gitleaks)", "Lint PR title", "Ghost"]);

  eq(
    "rulesets",
    githubRequired({}, [
      { type: "required_status_checks", ruleset_id: 7, parameters: { required_status_checks: [{ context: "a" }, { context: "b", integration_id: 8329 }] } },
    ]),
    [
      { name: "a", source: "ruleset 7", external: false },
      { name: "b", source: "ruleset 7", external: true },
    ],
  );

  const matrix = parse(`
on: [pull_request]
jobs:
  build: { strategy: { matrix: { os: [ubuntu, mac], node: [22, 24], exclude: [{ os: mac, node: 22 }] } } }
  verify: { strategy: { matrix: { node: [24] } } }
  named: { name: "test ${"${{ matrix.shard }}"}/2", strategy: { matrix: { shard: [1, 2] } } }
  dyn: { name: "lint ${"${{ inputs.x }}"}" }
  inc: { strategy: { matrix: { include: [{ os: win }] } } }
  fruit: { strategy: { matrix: { fruit: [apple], include: [{ fruit: banana }, { fruit: banana, size: s }] } } }
  obj: { strategy: { matrix: { cfg: [{ os: a }] } } }
  dyninc: { strategy: { matrix: { include: "${"${{ fromJSON(needs.a.outputs.m) }}"}" } } }
  local: { uses: ./.github/workflows/called.yml }
`);
  const called = parse("on: { workflow_call: {} }\njobs:\n  inner: { name: Inner }\n");
  eq("matrix", names({ "m.yml": matrix, ".github/workflows/called.yml": called }), [
    "build (ubuntu, 22)",
    "build (ubuntu, 24)",
    "build (mac, 24)",
    "verify (24)",
    "test 1/2",
    "test 2/2",
    "lint *",
    "inc (win)",
    "fruit (apple)",
    "fruit (banana)",
    "fruit (banana, s)",
    "obj (*)",
    "dyninc (*)",
    "local / Inner",
  ]);
  eq("wildcard", missingNames({ workflows: { "m.yml": matrix }, extra: ["lint anything"] }), []);
  const dynamicOnly = { "d.yml": parse(`on: pull_request\njobs:\n  d: { name: "${"${{ matrix.n }}"}", strategy: { matrix: "${"${{ fromJSON(x) }}"}" } }\n`) };
  eq("dynamic", check({ workflows: dynamicOnly, mergify: null, extra: ["Secret scan (gitleaks)"] }).results.map((r) => r.status), ["dynamic"]);

  if (failures.length) {
    for (const f of failures) console.error(`FAIL ${f}`);
    return 1;
  }
  console.log("check-required-checks self-test: ok");
  return 0;
}

async function main(argv) {
  const root = process.cwd();
  if (argv.includes("--self-test")) return selfTest();
  const arg = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const extra = argv.flatMap((a, i) => (a === "--required" && argv[i + 1] ? [argv[i + 1]] : []));
  const repo = arg("--repo");
  const branchName = arg("--branch") ?? "main";
  const { workflows, mergify } = readRepo(root);
  let githubChecks = [];
  if (repo) {
    const auth = token();
    if (!auth) {
      console.error(`No token to read ${repo} branch protection. Set GH_TOKEN, or drop --repo.`);
      return 2;
    }
    const ref = encodeURIComponent(branchName);
    const [branch, rules] = await Promise.all([
      api(`repos/${repo}/branches/${ref}`, auth),
      api(`repos/${repo}/rules/branches/${ref}?per_page=100`, auth),
    ]);
    githubChecks = githubRequired(branch, rules);
  } else {
    console.log("note: branch protection not read (no --repo)");
  }
  return report(check({ workflows, mergify, githubChecks, extra, branch: branchName }));
}

// Node resolves symlinks in import.meta.url but not in argv[1]; compare both
// resolved, or a run through a symlinked path checks nothing and exits 0.
const isMain = (url) => Boolean(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(url);
if (isMain(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
