# Time slots

A user gives a task a start time, with an optional length, and marks it as a task or a meeting. A time slot is not a deadline. Once its start time has passed, Today asks "Did you do this?" (or "Did this happen?" for a meeting) so she can record the outcome.

## Sub-features

- `slot-set` the `Time slot` sheet sets a start (preset chips 9:00 AM to 3:00 PM, or `Other` with a time field), a length (`None`, `30 min`, `1 hr`, more) and a type (`Task` or `Meeting`).
- `slot-schedule` timed tasks list under `Schedule` on Today, in time order, with their time and length.
- `slot-check-task` after the start, a dialog titled with the task asks "Did you do this?" with `Yes, done`, `Not yet` and `Move to All tasks`.
- `slot-check-meeting` for a meeting the dialog asks "Did this happen?" with `It happened` and `Missed it`.
- `slot-not-yet` `Not yet` hides the check for the rest of the day on that device, across reloads.
- `slot-move` `Move to All tasks` takes the task off Today and shows `Moved to All tasks`.
- `slot-remove` `Remove time` clears the slot.

## How to get to it (user POV)

- On a task page, the `Time` row (`Add time` when empty), or `More actions` then `Set a time`.
- When adding a task, `Time (optional)`.
- The check opens on its own on Today when a slot has passed.

## Driving it with e2e

Preconditions:

- Baseline preconditions from the index.
- Start data `Demo`. It has `Read emails` at 1:00 PM (a task) and `Team check-in` at 3:30 PM (a meeting) on Today. Their checks open only after those local times. `Worst case` has a meeting at 9:00 AM.

- **See the check.** After 3:30 PM local time, tap the `Today` tab. A dialog shows with the heading `Team check-in` and the text "Did this happen?". Before 1:00 PM no check opens: report `slot-check-*` as not reachable at that hour.
- **Record a meeting.** Run `await screen.getByRole('button', 'It happened').tap()`. A lime cheer toast shows and the ring counts up. The meeting row under `Schedule` shows as done.
- **Not yet.** When the check for `Read emails` opens, tap `Not yet`. The dialog closes. Reload `/` with no mutation in flight: the same check does not come back that day.
- **Set a slot.** Open a task with no time, tap `Add time`, tap the `9:00 AM` chip, choose `30 min`, tap `Set 9:00 AM`. The task page `Time` row shows `9:00 AM · 30 min`, and the task lists under `Schedule` on Today when it is on Today.
- **Remove a slot.** Reopen `Time`, tap `Remove time`. The row reads `Add time` again.
- **Proof.** No test yet. Write `tests/time-slots.e2e.ts` from an MCP walk, then `verify.sh proof tests/time-slots.e2e.ts time-slots`.
- **Explore charter.** `bunx e2e explore "Use time slots through a day: set start times and lengths, mark a meeting, answer the Did you do this check each way, and look for checks that return or never appear" --session user --max-steps 6`

## Gotchas

- Whether a check opens depends on the browser clock against the slot time. The seed slots are fixed times, so a morning run sees no check. The suite has no clock control yet.
- `Not yet` is stored per device in local storage (`todo:not-yet:<day>`). A fresh e2e browser context forgets it, so each test starts with every check active.
- While a check is open, the rest of Today is hidden from the accessibility tree. Answer or dismiss it before you drive anything else on Today.
- The check is a modal over Today only. Other screens never show it, which is why recipes reseed from `/tasks`.
