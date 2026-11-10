# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Todo is a product for anyone who has more to do than one day holds and wants to finish what matters instead of managing a list.

Its first real user runs operations at Big Minds Tiny Hands. She works mostly from her phone between calls, tours and staffing work, and on a computer at her desk. Her day mixes tasks, meetings at set times, and things to do every day, such as staffing a case or getting two tours. Her needs set the bar until other users are confirmed.

## Product Purpose

Todo helps a person pick what matters today, finish it, and feel that the day was won. Success is a user who comes back each day because finishing feels good and the list never punishes her for yesterday.

## Positioning

- Everything goes into All tasks, sorted by priority. Today is a small part of it that the user picks.
- A focus set of a few tasks (3 by default) comes first. When it is done, she picks the next set.
- Unfinished Today tasks go back to All tasks at the end of the day. They never pile onto tomorrow, so there is no overdue list and no guilt carried over.
- Finishing is rewarded on purpose: each check, each finished focus set, each won day, each streak and milestone gets a response sized to it.

## Operating Context

- Phone first, installed as a PWA, with full layouts for iPad and desktop.
- Used in short bursts during a working day: open, check something off, plan the next set, close.
- Time slots are start times, not deadlines. After a slot starts, Todo asks whether it happened.
- Daily goals are single checks that come back each day on chosen weekdays, separate from tasks. They carry no counts: "Get 2 tours" is the goal's name.
- Checks save while offline and sync on reconnect.

## Capabilities and Constraints

- Shipped: All tasks with priorities, Today, focus sets, focus mode, time slots and meetings with a "Did you do this?" check, a calendar of planned days, checklists and notes in a task, daily goals, Wins with streaks and milestones, light and dark themes, sounds, haptics and confetti that each switch off, email and password sign-in, password reset, and Google and Microsoft sign-in once their credentials are set.
- Terminology lives in `GLOSSARY.md`: Task, All tasks, Today, Focus set, Back to All tasks, Win, Daily goal, Time slot, Planned day, Calendar.
- Stack: Next.js with Bun, Convex, Better Auth, shadcn/ui on Base UI, Vercel.
- Tasks are private to their owner. There is no sharing between users.
- Sign-up is open to anyone with an email, Google or Microsoft account.
- Not decided: pricing, a public launch, and any team or shared features.

## Brand Commitments

- The name is Todo.
- The finished experience must feel rewarding enough to come back to every day (the brief's words: "dopaminergic", "she should become addicted"), without nagging or guilt.
- Copy is plain and short, in the product's own terms from `GLOSSARY.md`.
- The design canvas made for this project is the visual reference the build matches, in both light and dark.

## Evidence on Hand

- The kickoff meeting notes with the first user (9 Nov 2026, kept privately) are the source of the requirements.
- There are no testimonials, customer quotes, usage numbers or press. Do not invent any.

## Product Principles

1. Today stays small. Every feature protects the focus set from turning back into a long list.
2. Never punish the past. Unfinished work returns to All tasks quietly; nothing is overdue.
3. Reward finishing in proportion. Routine checks feel certain; won days, streaks and milestones feel earned.
4. Fast on a phone. The common actions take one tap or one swipe, and each swipe also has a button.
5. Private by default. Task text can name children and families, so it never leaves the owner's account.

## Accessibility & Inclusion

- Every gesture has a visible button or menu alternative, and every control has an accessible name.
- Reduced motion keeps feedback as fades instead of movement.
- Sounds, haptics and confetti each have their own switch in Settings.
- Phone tap targets are at least 44 by 44 px.
