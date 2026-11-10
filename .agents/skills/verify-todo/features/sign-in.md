# Sign in and sign up

A user signs in with email and password, or with Google or Microsoft when those are configured. Anyone can create an account. She can reset a forgotten password and sign out.

## Sub-features

- `signin-ok` the right email and password open Today.
- `signin-wrong` a wrong password shows "That email and password don't match. Try again, or reset your password." under the password field.
- `signin-next` a signed-out visit to a deep route sends her to `/sign-in?next=<route>` and back there after sign-in.
- `signup` a new email creates the account and opens the first-run Today.
- `signup-taken` an email that already has an account shows "This email already has an account. Sign in instead." under the email field.
- `reset-request` `/forgot-password` sends a reset link and shows `Check your email`.
- `signout` Settings, `Sign out`, returns to `/sign-in`.

## How to get to it (user POV)

- Open any app route while signed out. `AuthGate` redirects to `/sign-in`.
- `/sign-in` links to `/forgot-password` (`Forgot password?`) and `/sign-up` (`Create an account`).
- `/sign-up` links back with `Sign in`.
- Settings (the avatar link named `Settings`) has `Sign out`.

## Driving it with e2e

Preconditions:

- Baseline preconditions from the index, but start signed out: no `session` on the test, or `app.clearState()` first.

- **Sign in.** Run `await app.open('/sign-in')`, `await screen.getByLabel('Email').fill(user.username)`, `await screen.getByLabel('Password').fill(user.password)`, `await screen.getByRole('button', 'Sign in').tap()` with `const user = credentials.user('user')`. The URL becomes `/` and the `Sign in` heading is gone.
- **Wrong password.** Fill the test email and the password `wrong-password-1`, tap `Sign in`. An alert under the password field reads "That email and password don't match". The URL stays `/sign-in`.
- **Deep link.** Signed out, run `await app.open('/calendar')`. The URL becomes `/sign-in?next=%2Fcalendar`. Sign in. The URL becomes `/calendar`.
- **Sign-up.** Run `await app.open('/sign-up')`, fill `Name` with `Sam Rivera`, `Email` with a made-up `todo-signup-<stamp>@todo.test`, `Password` with `probe-pass-91x`, tap `Create account`. The heading `Put everything on your plate here` shows.
- **Taken email.** Same, with the test email. The email field shows "This email already has an account" and no account is made.
- **Sign out.** Signed in, open `/settings`, tap `Sign out`. The URL becomes `/sign-in`.
- **Proof.** `verify.sh proof tests/auth.setup.e2e.ts sign-in` covers `signin-ok` only. The other sub-features have no test yet: drive them in an MCP session and keep its screenshots.
- **Explore charter.** `bunx e2e explore "Try to get into Todo without a valid account: wrong passwords, taken sign-up emails, reset links, and deep links while signed out" --max-steps 6`

## Gotchas

- Sign-in is rate limited to 5 tries a minute per IP, and sign-up to 5 per 5 minutes. A tight loop of wrong passwords gets "Too many tries. Wait a minute, then try again." Wait out the window.
- Every sign-up creates a real account on the shared dev deployment. Use a stamped address so reruns do not hit "This email already has an account."
- Reset emails are not sent in dev. The server logs the link as `[password reset] <email>: <url>` in the Convex logs (`bunx convex logs`). Never paste the link into a prompt.
- Google and Microsoft buttons show only when `NEXT_PUBLIC_AUTH_PROVIDERS` is set and the OAuth apps exist. Dev has neither, so those entry points are unreachable today.
