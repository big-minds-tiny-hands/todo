#!/usr/bin/env node
// check-no-emoji.mjs -- canonical zero-dependency emoji guard.
//
// Canonical home: big-minds-tiny-hands/.github (the org-default repo). Copies
// vendored into other repos are audited byte-identical to this one, so the rule
// has exactly one logical home. Bans emoji in code, docs, commit messages, and
// PR text. Keeps plain typography -- em/en dashes, the arrows block, the
// middot, curly quotes, the plain check/cross -- and the (c)(r)(tm) marks. This
// file is pure ASCII so it passes its own guard.
//
// Usage: check-no-emoji.mjs <file> [<file> ...]   (scans each file)
//        check-no-emoji.mjs --stdin               (scans stdin, e.g. PR text)
import { readFileSync } from "node:fs";

// Emoji: Extended_Pictographic, regional-indicator letters, the keycap combiner.
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{20E3}]/u;
// Exempt despite matching above: copyright, registered, trademark.
const ALLOW = new Set([0x00a9, 0x00ae, 0x2122]);
// Exempt range: the Arrows block (U+2190-U+21FF) reads cleanly in a diff.
const isAllowed = (cp) => ALLOW.has(cp) || (cp >= 0x2190 && cp <= 0x21ff);

function findInText(text, label) {
  const out = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let col = 0;
    for (const ch of lines[i]) {
      col++;
      const cp = ch.codePointAt(0);
      if (EMOJI.test(ch) && !isAllowed(cp)) {
        out.push(`${label}:${i + 1}:${col}: U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
      }
    }
  }
  return out;
}

const args = process.argv.slice(2);
const findings = [];
if (args.includes("--stdin")) {
  findings.push(...findInText(readFileSync(0, "utf8"), "(stdin)"));
} else {
  for (const file of args) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue; // unreadable / deleted path -- nothing to scan
    }
    findings.push(...findInText(text, file));
  }
}

if (findings.length) {
  console.error("emoji found (banned -- see CRAFT.md writing standard):");
  for (const f of findings) console.error("  " + f);
  process.exit(1);
}
