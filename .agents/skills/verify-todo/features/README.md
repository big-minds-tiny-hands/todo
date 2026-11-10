# Todo verification map

This directory is the maintained source for verifying what a Todo user can do. Read this index before you drive the app, then use the matching feature file as the recipe. Terms follow `GLOSSARY.md`: Task, All tasks, Today, Focus set, Time slot, Daily goal, Planned day.

## Baseline preconditions

- `verify.sh launch` printed `verify: ready at http://localhost:3001`, and `verify.sh doctor` exits 0.
- The browser is signed in as the test account: tests declare `{ session: 'user' }`, MCP sessions start from `tests/auth.setup.e2e.ts`.
- The viewport is a phone, 390x844, as set in `e2e.config.ts`. Check desktop layouts separately at 1280x800 or wider.
- Each recipe sets its own starting data with the dev data dock: open `/tasks`, tap `Dev data`, tap the preset, tap the `Today` tab.
- No other agent is driving the app. The deployment and the account are shared.

## Driving conventions

- Prefer roles and accessible names. The names below are the ones the app renders. Check a new one in an MCP session before you write it.
- Navigate inside the app after a mutation. A full page load can trip the unsaved-changes guard.
- Tap the exact control when the step is one known control. Use `agent.act` for a goal that takes several screens, one goal per call, followed by an `expect`.
- Treat names and commands as literal. Keep quotes and casing unchanged.

## Proof and skip reporting

- Run the proof with `verify.sh proof <test> <feature-id>`. Evidence goes to `.e2e/proof/`.
- Capture the action and the resulting state. Confirm a stored change from a second view: another screen, or after navigating away and back.
- Record the feature ID and the entry point with every artifact.
- Report an unreachable entry point with the attempted step and the unmet precondition. Never report it as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph describing the user-visible behavior, then exactly four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with e2e`, `Gotchas`. `Driving it with e2e` starts with `Preconditions:`, pairs each user action with exact e2e lines and the observable result, and ends with an `e2e explore` charter.

## Features

- [Sign in and sign up](./sign-in.md): email and password sign-in, wrong password, the sign-up allowlist, password reset, sign out.
- [Today and the focus set](./today-focus.md): put tasks on Today, choose a focus set, finish it, the reward, the next set, day won.
- [All tasks](./all-tasks.md): add a task, priorities, add to Today, the task page with checklist and notes, delete with undo.
- [Calendar and planned days](./calendar.md): put a task on a day, see it on the calendar, add tasks to a day.
- [Time slots](./time-slots.md): give a task a start time, the "Did you do this?" check, Not yet, Move to All tasks, meetings.

Not mapped yet: daily goals (`/settings/goals`), Wins (`/wins`), Settings, focus mode (`/focus`), install and offline (`/install`, `/offline`).
