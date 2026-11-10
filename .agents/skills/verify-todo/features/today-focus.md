# Today and the focus set

A user puts tasks on Today, commits to a focus set of the few that come first (3 by default), checks them off one by one with a reward each time, and sees the set finished. Then she picks the next set or stops. Finishing the daily target (3 tasks by default) wins the day.

## Sub-features

- `today-first-run` an account with no tasks shows the first-run screen with `Add your first task` and `Set a daily goal`.
- `today-plan` with tasks on Today and no focus set, the `Plan today` screen lists Today and All tasks by priority.
- `focus-choose` `/focus/choose` picks up to the focus set size and starts the set.
- `focus-check` checking a focus task plays the reward: a toast such as `Nice. 2 more to win the day.` and the ring in the header counts up.
- `focus-done` finishing every task in the set opens `Focus set done` with `Pick the next focus set` and `Take a break`.
- `focus-next` the next set picks from what is left on Today.
- `day-won` reaching the daily target shows `Day won` with the week strip.
- `focus-mode` the expand control opens `/focus`, one task at a time.

## How to get to it (user POV)

- Open Today: the `Today` tab, or `/`.
- Add to Today: `Add your first task` on first run, the `Add a task` button in the Today header, or `Add <title> to Today` on All tasks.
- Choose the set: `Choose a focus set` on the plan screen, or the `<n> more tasks today` row below a running set.
- Check off: the `Complete <title>` button on a focus row, or `Done` in focus mode.

## Driving it with e2e

Preconditions:

- Baseline preconditions from the index.
- Start data `Empty`, set from `/tasks` through the dock.

- **First run.** Run `await screen.getByRole('link', 'Today').tap()` from `/tasks`. The heading `Put everything on your plate here` shows.
- **Add a task to Today.** Run `await screen.getByRole('button', 'Add your first task').tap()`, `await screen.getByLabel('Task').fill('Call the Thursday family back')`, `await screen.getByRole('button', 'Today').tap()`, `await screen.getByRole('button', 'Add task').tap()`. A toast `Added to Today` shows and the plan screen lists the task under `Today`.
- **Choose and start the set.** Run `await agent.act('choose a focus set that holds the task "Call the Thursday family back", then start it')`. The `Focus` heading shows with `await expect(screen.getByRole('button', 'Complete Call the Thursday family back')).toBeVisible()`.
- **Finish the set.** Run `await screen.getByRole('button', 'Complete Call the Thursday family back').tap()`. The heading `Focus set done` and the text `1 done today` show.
- **Second view.** Tap `Take a break`, then check the header ring: `await expect(screen.getByRole('link', '1 of 3 done today. See your wins')).toBeVisible()`. Open the `All tasks` tab: the done task is not listed as open.
- **Proof.** `verify.sh proof tests/focus-set.e2e.ts today-focus`. The test covers `today-first-run`, `focus-choose`, `focus-check` and `focus-done`.
- **Explore charter.** `bunx e2e explore "Plan today from All tasks, run two focus sets in a row, and try to break the focus set flow: skip, remove a task from the set, uncheck a done task" --session user --max-steps 6`

## Gotchas

- `Skip for now` on `/focus/choose` leaves Today with no focus set and no check controls. That is current behavior and an open product question, not a test failure.
- With `Demo` data a passed time slot opens "Did you do this?" over Today on load. Answer it, or start from `Empty`.
- The cheer toast leaves after about 3 seconds. Assert it right after the tap, or assert the ring or `done today` count instead.
- Days are local dates. A run across midnight empties Today by design.
