# All tasks

All tasks holds every open task, sorted by priority (High, Normal, Low). A user adds tasks there, moves the ones she wants onto Today, and opens a task to edit its title, priority, checklist, notes, day and time. Deleting a task offers Undo.

## Sub-features

- `tasks-add` the `Add a task` sheet adds a task with a title, priority and When (All tasks, Today, or Pick a day).
- `tasks-sort` open tasks list by priority, then by order.
- `tasks-to-today` `Add <title> to Today` moves a task onto Today. The row then shows under `On Today`.
- `task-open` tapping a row opens `/task/<id>`.
- `task-checklist` `Add a step` adds a step. A step checks off on its own.
- `task-notes` `Add notes` saves free text.
- `task-delete` `Delete task`, or `More actions` then `Delete`, removes the task and shows a toast with `Undo`.
- `tasks-empty` with no open tasks the screen shows `Nothing waiting` and `Add a task`; a brand-new user sees `Everything you need to do goes here` instead.
- `tasks-restore` `Recently deleted (N)` at the bottom of All tasks opens in place; `Restore <title>` brings a deleted task back at any time, after its toast is gone.

## How to get to it (user POV)

- The `All tasks` tab (it shows a count badge), or `/tasks`.
- The `Add a task` button in the Today header also adds a task, defaulting to Today.
- A task page opens from any task row: All tasks, the plan screen, Calendar.

## Driving it with e2e

Preconditions:

- Baseline preconditions from the index.
- Start data `Demo` for a populated list, or `Empty` for `tasks-empty`. Set it from `/tasks`.

- **Add a task.** On `/tasks`, run `await screen.getByRole('button', 'Add a task').tap()`, `await screen.getByLabel('Task').fill('Order classroom paint')`, then `await screen.getByRole('button', 'Add task').tap()` with When left on `All tasks`. A toast `Added to All tasks` shows and the row `Order classroom paint` appears.
- **Move to Today.** Run `await screen.getByRole('button', 'Add Order classroom paint to Today').tap()`. A toast `Added to Today` shows. Open the `Today` tab: the task is listed there.
- **Open and edit.** Tap the row text `Order classroom paint`. The URL becomes `/task/<id>`. Run `await screen.getByRole('button', 'Add a step').tap()`, type a step, press Enter. The `Checklist` section shows `0/1` style progress on the row back on All tasks.
- **Delete and undo.** On the task page, tap `Delete task`. The toast reads `Deleted “Order classroom paint”` (curly quotes) with `Undo`. Tap `Undo` before it leaves: the task is back on All tasks.
- **Restore later.** After the toast is gone, tap `Recently deleted (1)`, then `Restore <title>`. The task is back in All tasks and the row disappears.
- **Proof.** `verify.sh proof tests/undo.e2e.ts all-tasks` covers delete and restore. Add, move to Today and the checklist have no test yet.
- **Explore charter.** `bunx e2e explore "Manage All tasks: add tasks with each priority, move some to Today, edit a task's checklist and notes, delete and undo, and look for ordering or count mistakes" --session user --max-steps 6`

## Gotchas

- The tab badge counts open tasks not on Today. It changes when a task moves to Today, not only on add or delete.
- `Worst case` data has very long titles. Rows clamp at two lines. Match rows by their full accessible name, not visible text.
- The Undo toast lasts about 4 seconds. Tap it right after the delete.
- A deleted task is soft deleted. It disappears from every list but the Undo restores it with its checklist.
