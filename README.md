# Todo

A to-do app for Melina at Big Minds Tiny Hands. She dumps every task into All tasks and picks today's work by priority. She commits to a small focus set and checks it off. Daily goals and time slots sit on the same screen. Dark theme, phone and computer.

- Plan and status: [Linear project "Todo"](https://linear.app/big-minds-tiny-hands/project/todo-892e0b5657a8) (ENG-3168 to ENG-3183)
- Open product decisions: [ENG-3168](https://linear.app/big-minds-tiny-hands/issue/ENG-3168)
- Source meeting: [Granola, 9 Nov 2026](https://notes.granola.ai/d/81b0f3b5-ad1b-429c-8da2-ddb42353e911)
- Terms: [GLOSSARY.md](./GLOSSARY.md)

## Stack

Bun, Next.js 16 (App Router), Convex, Better Auth (`@convex-dev/better-auth`), shadcn/ui (Base UI), Tailwind 4, Vercel.

## Run

The code lives on the dev box at `~/Projects/todo`. The lane port is 3012, which forwards to the Mac.

```bash
bun install
bunx convex dev        # syncs functions to the bmth/todo dev deployment
bun run dev -- -p 3012
```

Convex dev dashboard: https://dashboard.convex.dev/t/bmth/todo/artful-mastiff-968
