# Tiny ToDo

A to-do app that helps you finish what matters today. Dump every task into All tasks, pick today's work by priority, commit to a small focus set, and check it off. Daily goals and time slots sit on the same screen. Dark theme, phone and computer.

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
- Capture: session replay masks all page text and input values and records no network headers or bodies. Autocapture keeps no element text or attributes. Sentry sends no default PII. Add `data-ph-block` to an element to keep it out of replays entirely.

## Sign-in

Email and password, plus Google and Microsoft when their credentials are set. Anyone can make an account at `/sign-up`, by any method. To make an account for someone, run `bunx convex run admin:createUser '{"email":"…","password":"…","name":"…"}'`. A Google or Microsoft account with the same email links to it.

Convex env vars (set with `bunx convex env set NAME value`, add `--prod` for production):

| Name | Required | Value |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32`, a different value per deployment |
| `SITE_URL` | yes | The app origin: `http://localhost:3001` on dev, `https://todo-kappa-eight-48.vercel.app` on production |
| `TRUSTED_ORIGINS` | no | Other origins allowed to call auth, comma separated, such as a Vercel preview URL. `node scripts/check-auth-origin.mjs <origin>...` checks that an origin reaches auth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | From a Google Cloud OAuth client (Web application). Authorized redirect URI: `<SITE_URL>/api/auth/callback/google` |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | no | From a Microsoft Entra app registration (Web platform). Redirect URI: `<SITE_URL>/api/auth/callback/microsoft` |
| `MICROSOFT_TENANT_ID` | no | `common` (default) allows any Microsoft account. The Big Minds Tiny Hands tenant ID allows only work accounts |
| `DEV_TOOLS` | dev only | `true` turns on the dev data dock presets. Never set it on production |

Show the buttons by setting `NEXT_PUBLIC_AUTH_PROVIDERS` (for example `google,microsoft`) in `.env.local` and in the Vercel env.

Auth hardening: rate limits stored in the component database (sign-in 5 a minute, password reset 3 per 5 minutes), encrypted OAuth tokens, 60-day sessions renewed daily, and audit lines in the Convex logs for each new session and linked account. Password reset links go to the Convex logs until an email provider is added (OPS-46).

## License

MIT. See [LICENSE](LICENSE). Report security issues privately as described in [SECURITY.md](SECURITY.md).
