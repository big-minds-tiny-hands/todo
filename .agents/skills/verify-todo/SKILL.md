---
name: verify-todo
description: Launch, drive and prove Todo (the Next.js + Convex daily planner) in a real browser with e2e. Use it to check a UI or backend change in the running app, reproduce a bug, or collect proof that a user flow works, before you call the change done.
---

# Verify Todo

Todo is a web app, used first on a phone. Prove behavior by driving the real app at a phone viewport with [e2e](../e2e/SKILL.md): a live `e2e mcp` session to look and act, and e2e tests to record proof. This skill holds what is true of Todo. Read the e2e skill for the runner itself.

Everything runs on the dev box (`ssh devbox`), in the checkout you work in. The helper is `.agents/skills/verify-todo/verify.sh`. Run it from inside the checkout.

## Facts that shape every run

- App: `http://localhost:3001`, the repo's dev box lane port. Port 3000 belongs to the user. Never start anything there.
- Data: Convex dev deployment `artful-mastiff-968`, shared by every checkout and session. Production is `giddy-eagle-641`. The helper refuses to run against it.
- Account: one test account, `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env.local`. e2e reads them as `credentials.user('user')`. Never type them into a prompt or a file.
- Data reset: the dev data dock (`Dev data` button, bottom right, dev builds only) wipes and reseeds the signed-in account: `Demo`, `Worst case`, `Empty`, `One`, `1,000`.
- Isolation: none. Two runs share the deployment and the account, and a reseed in one run wipes the other's data. Run one verification at a time. If another agent is driving the app, wait or ask.
- Model: agent steps use Claude Sonnet 5.5 through `ANTHROPIC_API_KEY` in `.env.local`. Exact steps and the replay cache need no model call.

## Launch

```bash
.agents/skills/verify-todo/verify.sh launch
```

It checks `.env.local`, refuses a production deployment, installs dependencies when missing, pushes Convex functions and schema to the dev deployment, creates the test account when it does not exist, then reuses or starts `next dev` on port 3001. Ready means `verify: ready at http://localhost:3001`: the auth route answers and `/sign-in` renders.

A dev server the helper did not start is reused, never killed. The e2e config also has `reuseExisting: true`, so `e2e run` and `e2e mcp` attach to it.

## Doctor

Run it first, and again whenever anything looks off. It is read-only.

```bash
.agents/skills/verify-todo/verify.sh doctor
```

It prints the checkout and commit, the deployment, and one `ok` or `FAIL` line per check: dev deployment, server answering, who started the server, test account keys, `ANTHROPIC_API_KEY`, `DEV_TOOLS=true` and the test email on `ALLOWED_EMAILS` in Convex, and e2e installed. It prints no secret values. Exit code 1 means at least one check failed. Fix that before you drive.

## Drive

Two ways, both through e2e. Use stable handles: roles and accessible names, labels, route paths. Never use coordinates.

**Look and act live.** Use the `e2e` MCP server from `.mcp.json` (`bunx e2e mcp`). Open a session with the saved sign-in: `open_session` on the setup test, or start signed out at `/sign-in` and fill the form with `type_secret`. Then `navigate` straight to the route under test. Every action prints the test line that repeats it. Copy those lines into the test you write.

**Record proof with a test.** Tests live in `tests/*.e2e.ts`. `tests/auth.setup.e2e.ts` signs in once and saves the session `user`. A test that declares `{ session: 'user' }` starts signed in.

```bash
bunx e2e run tests/focus-set.e2e.ts --retries 0 --action-timeout 8000   # while you fix a test
bunx e2e run tests/focus-set.e2e.ts --no-cache                          # once green: the live agent reaches every goal
```

Start each test from known data. Open `/tasks`, tap `Dev data`, tap a preset, then tap the `Today` tab. Do not reload. See Gotchas.

Exploratory runs fan out from the feature map. Each feature file ends with an `e2e explore` charter:

```bash
bunx e2e explore "<charter from the feature file>" --session user --max-steps 6
```

Explore findings are the model's claims. Read each `actual` against its screenshot before you report a bug.

## Evidence

```bash
.agents/skills/verify-todo/verify.sh proof tests/focus-set.e2e.ts focus-set
```

It runs one test with `--trace on` and `--retries 0` into `.e2e/proof/<YYYYMMDD-HHMMSS>-<label>/`. Each test directory holds `trace.md` (every step, what it hit, console errors, failed requests, the screen at the end), screenshots, and the screen dump. `.e2e/proof/` is gitignored and survives cleanup.

A proof meets these standards:

- It drives the real user path: taps, typing and navigation in the browser. It never calls a Convex mutation directly or uses a test-only route. The dev data dock is the one exception, used only to set the starting data.
- It captures the action and the resulting state, such as the task checked and the `Focus set done` screen, not only the last screen.
- It checks the side effect from a second view: reload, or open another screen that reads the same data, such as the task on `All tasks` after an add, or the ring count after a check.
- It names the feature and the entry point used. An entry point you did not drive is not verified, even if another path to the same feature passed.

## Cleanup

```bash
.agents/skills/verify-todo/verify.sh cleanup
```

It stops only the dev server this helper started, found by the pid in `.e2e/verify/dev.pid`. It never kills by process name. It keeps `.e2e/proof/`. The test account keeps whatever data the last run left. The next run resets it from the dock.

## Gotchas

- A full page load (`app.open`) right after a dock reseed or any other mutation can trip Convex's unsaved-changes guard: `APP_NOT_OPEN: unhandled beforeunload dialog`. Navigate inside the app instead, such as the `Today` tab.
- Today opens a "Did you do this?" dialog over everything when a task's time slot has passed. With `Demo` or `Worst case` data it opens on load and hides the page. Reseed from `/tasks` or `/settings`, which never show it.
- `/settings` has two `Today` links: the back link and the tab. Use the tab from `/tasks`, which has one, or scope to the navigation named `Main`.
- The Next.js dev tools button sits at the bottom left in dev builds. An error badge on it covers the `Today` tab. If a tap fails with `nextjs-portal ... intercepts pointer events`, read the dev server log for the error and fix it. Do not hide the overlay.
- Days are the browser's local dates. A run that crosses midnight sees Today empty out. That is the product rule: unfinished tasks go back to All tasks.
- Each `e2e run` signs in once. Sign-in is rate limited to 5 a minute, so rapid reruns fail the setup with "Too many tries. Wait a minute, then try again." Wait a minute and rerun. Do not raise the limit.
- e2e runs one test at a time (`workers: 1`): every test reseeds the same account. Never run two e2e commands at once.
- The browser pane in the desktop app pauses animation frames while it is hidden. Motion finishes drags on frames, so synthetic swipes there can stick mid-gesture. Prove gestures with `tests/gestures.e2e.ts`, whose headless browser runs frames.
- Sign-up accepts only emails and `@domains` on the Convex `ALLOWED_EMAILS` list. Use a made-up `@bigmindstinyhands.com` address to prove an allowed sign-up and `@todo.test` for a refused one. Every sign-up adds a real account to the dev deployment.

## Feature map

[features/README.md](features/README.md) indexes the user-facing features, with one recipe per feature. When you prove a change, drive every entry point the feature file lists. Keep the map honest as the app changes: `/pstack:maintain-verification-skill`.
