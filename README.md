# Todo

A to-do app for Melina at Big Minds Tiny Hands. She dumps every task into All tasks and picks today's work by priority. She commits to a small focus set and checks it off. Daily goals and time slots sit on the same screen. Dark theme, phone and computer.

- Code: [big-minds-tiny-hands/todo](https://github.com/big-minds-tiny-hands/todo) (private)
- Plan and status: [Linear project "Todo"](https://linear.app/big-minds-tiny-hands/project/todo-892e0b5657a8) (OPS-28 to OPS-47)
- Open product decisions: [OPS-28](https://linear.app/big-minds-tiny-hands/issue/OPS-28)
- Source meeting: [Granola, 9 Nov 2026](https://notes.granola.ai/d/81b0f3b5-ad1b-429c-8da2-ddb42353e911)
- Terms: [GLOSSARY.md](./GLOSSARY.md)

## Stack

Bun, Next.js 16 (App Router), Convex, Better Auth (`@convex-dev/better-auth`), shadcn/ui (Base UI), Tailwind 4, Vercel.

## Run

The code lives on the dev box at `~/Projects/todo`. The lane port is 3001, which forwards to the Mac.

```bash
bun install
bunx convex dev        # syncs functions to the bmth/todo dev deployment
bun run dev -- -p 3001
```

Convex dev dashboard: https://dashboard.convex.dev/t/bmth/todo/artful-mastiff-968

## Deploy

Each merge to main deploys production on Vercel (project `todo`, team big-minds-tiny-hands). Vercel runs `bun run build:vercel`.

- Production: the env holds `CONVEX_DEPLOY_KEY`, `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. With the key set, `convex deploy` builds Next.js against the Convex production deployment, then pushes the Convex functions.
- Preview: there is no deploy key, so the build is plain `bun run build`. `NEXT_PUBLIC_CONVEX_URL` points it at the Convex dev deployment. Preview builds do not deploy Convex.

## Telemetry

Sentry reports errors and PostHog reports product usage. Both are off in `next dev` and turn on in a production build once their variable is set. See `.env.example`.

- Sentry: set `NEXT_PUBLIC_SENTRY_DSN` to the `todo` project DSN in `.env.example`. `SENTRY_AUTH_TOKEN` at build time uploads source maps. Browser events go through `/monitoring`.
- PostHog: set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`. Events go to the shared US project 548413 through `/ingest`, each tagged `app: "todo"`.
- Capture: nothing is masked. Session replay records page text, input values, images, console logs and network headers and bodies. Sentry sends default PII. Password fields stay masked by the recorder. Add `data-ph-block` to an element to keep it out of replays.
