"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AlertIcon, Logo, SpinnerIcon } from "@/components/icons";
import { SocialSignIn, socialErrorMessage } from "@/components/social-sign-in";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

/** `noAccount` adds a way to sign-up: a wrong password and an email with no account look the same here. */
type SignInError = { message: string; noAccount?: boolean };

function signInError(status: number): SignInError {
  if (status === 401 || status === 400) return { message: "That email and password don't match. Try again, or reset your password.", noAccount: true };
  if (status === 429) return { message: "Too many tries. Wait a minute, then try again." };
  return { message: "Could not reach Tiny ToDo. Check your connection and try again." };
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<SignInError | null>(() => {
    const message = socialErrorMessage(params.get("error"));
    return message ? { message } : null;
  });
  const [busy, setBusy] = useState(false);
  const passwordChanged = params.get("reset") === "1";
  const nextParam = params.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(signInError(error.status));
      return;
    }
    router.replace(next);
  }

  return (
    <div className="phone center">
      <main className="narrow" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "72px 24px 40px", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <span style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Tiny ToDo</span>
        </div>

        <h1 className="h1">Sign in</h1>

        {passwordChanged && !error && (
          <p className="banner" role="status" style={{ margin: 0 }}>
            Password changed. Sign in with your new password.
          </p>
        )}

        <SocialSignIn next={next} />

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }} aria-busy={busy}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              spellCheck={false}
              autoComplete="email"
              inputMode="email"
              required
              disabled={busy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com…"
            />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              className={`input${error ? " err" : ""}`}
              id="pw"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={busy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-invalid={!!error}
              aria-describedby={error ? "pw-err" : undefined}
            />
            {error && (
              <p className="err-text" id="pw-err" role="alert">
                <AlertIcon size={18} style={{ flex: "none" }} />
                <span>
                  {error.message}
                  {error.noAccount && (
                    <>
                      {" "}No account yet?{" "}
                      <Link className="link" href={email.trim() ? `/sign-up?email=${encodeURIComponent(email.trim())}` : "/sign-up"} style={{ display: "inline", fontSize: "inherit", color: "inherit", fontWeight: 600, textDecoration: "underline" }}>
                        Create one
                      </Link>
                    </>
                  )}
                </span>
              </p>
            )}
          </div>
          <button className="btn pri full" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy && <SpinnerIcon />}
            Sign in
          </button>
        </form>

        <Link className="link" href="/forgot-password" style={{ alignSelf: "center" }}>
          Forgot password?
        </Link>

        <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
          New to Tiny ToDo?{" "}
          <Link className="link" href="/sign-up" style={{ display: "inline" }}>
            Create an account
          </Link>
        </p>
      </main>
    </div>
  );
}
