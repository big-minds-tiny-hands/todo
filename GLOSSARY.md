# Tiny ToDo

A personal planner for one person's workday. Its purpose is to help a user pick what matters most each day and feel that the day was won.

## Language

### Tasks and where they live

**Task**:
One thing the user intends to do, with a title and a priority. It can hold a checklist and a start time.
_Avoid_: To-do, item, card

**All tasks**:
Every open task, sorted by priority. Today is a part of it.
_Avoid_: Later, pool, backlog, inbox, list, someday

**Priority**:
The rank of a task in All tasks: High, Normal or Low.
_Avoid_: Importance, urgency, flag

**Completed**:
The tasks the user has finished, newest first, grouped by the day they were done. Unchecking one reopens it.
_Avoid_: Done list, archive, history, logbook

**Checklist**:
An ordered list of steps inside one task.
_Avoid_: Subtasks, children

### The day

**Today**:
The tasks the user has picked, or placed on today's date, to work on today.
_Avoid_: Daily list, agenda, my day

**Focus set**:
The few tasks from Today the user commits to finish before anything else. The default size is 3.
_Avoid_: Top 3, priorities, MITs, big rocks

**Back to All tasks**:
What happens to an open Today task when the day ends. It leaves Today, stays in All tasks at its priority, and is not moved to tomorrow.
_Avoid_: Back to Later, return to pool, roll over, carry over, snooze, overdue

**Win**:
A day on which the user finishes at least the daily target (default 3 tasks). Wins in a row make a streak.
_Avoid_: Points, score, XP

**Daily goal**:
Something the user does once on each of its days and checks off, such as "Get 2 tours". It has no count: the name says what done means. It is separate from tasks and comes back each day.
_Avoid_: Habit, recurring task, repeat, routine

**Time slot**:
A start time placed on a task, with an optional length. It is not a deadline and not a timer.
_Avoid_: Due time, deadline, appointment, timer

### Planning ahead

**Planned day**:
A future date placed on a task. Until then the task shows under Planned in All tasks, not with the tasks to pick from. On that date it shows in Today. If the date passes, the task returns quietly to All tasks.
_Avoid_: Due date, scheduled date, start date

**Calendar**:
The view of tasks placed on days. It is not a general calendar of events.
_Avoid_: Schedule, agenda
