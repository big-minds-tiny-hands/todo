# Calendar and planned days

A user puts a task on a future day (its planned day). On that day the task shows in Today. The Calendar shows a month with a dot on days that have tasks and lists the tasks of the chosen day, and she can add tasks from All tasks to any day from today on.

## Sub-features

- `cal-month` the month grid marks days with tasks and moves with `Previous month` and `Next month`.
- `cal-day-list` choosing a day lists its tasks: timed ones first with their time, then the rest by priority.
- `cal-assign` `Add from All tasks` on today or a future day opens `Add to <date>` and adds the picked tasks to that day.
- `cal-past` a past day shows `Nothing on this day` with no add button.
- `task-put-on-day` on a task, `Put on a day` sets or clears its planned day: `Today`, `Tomorrow`, `Next Monday`, `No day`, or a date on the grid.
- `planned-shows-today` on its planned day, the task is on Today without being added by hand.

## How to get to it (user POV)

- The `Calendar` tab, or `/calendar`.
- On a task page, the `Day` row, or `More actions` then `Put on a day`.
- When adding a task, `Pick a day` under When.

## Driving it with e2e

Preconditions:

- Baseline preconditions from the index.
- Start data `Demo`, which has open tasks in All tasks and tasks on Today. Set it from `/tasks`.

- **Open the month.** Tap the `Calendar` tab. A grid named for the month shows. Today's cell is selected and the list under it is headed with today's short date.
- **Pick a future day.** Run `await screen.getByRole('button', /^<Month> <day>/).tap()` for a day after today, such as `November 12`. The list shows `Nothing on this day yet` and `Add from All tasks`, or that day's tasks.
- **Add tasks to the day.** Tap `Add from All tasks`. A sheet titled `Add to <date>` lists open tasks as checkboxes named by title. Check one, then tap `Add 1 task`. A toast `Added to <day>` shows and the day's list now holds the task.
- **Second view.** The cell for that day is now named `<Month> <day>, has tasks`. Open the task: its `Day` row shows the date.
- **Clear the day.** On the task page, open `Day`, choose `No day`, confirm with `Remove day`. The calendar cell loses `, has tasks` when no other task is there.
- **Proof.** No test yet. Write `tests/calendar.e2e.ts` from an MCP walk, then `verify.sh proof tests/calendar.e2e.ts calendar`.
- **Explore charter.** `bunx e2e explore "Plan the coming week on the Calendar: put tasks on future days from All tasks and from a task's Day row, move a task between days, clear a day, and check that Today and the Calendar agree" --session user --max-steps 6`

## Gotchas

- Cell names change with state: `November 12` or `November 12, has tasks`. Match with a regular expression on the date.
- Calendar lists a task on its planned day, or on the day it was added to Today. A task added to Today today shows on today's cell.
- Proving `planned-shows-today` for a future day needs the browser clock moved to that day. The suite has no clock control yet, so report that entry point as not verified.
- Days are the browser's local dates. The dev box and the browser run in the same time zone only if you start them that way.
