"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AlertIcon, Logo, SpinnerIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(error.status === 401 || error.status === 400 ? "Email or password is wrong." : (error.message ?? "Could not sign in. Try again."));
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
  }

  return (
    <div className="phone center">
      <main className="narrow" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "72px 24px 40px", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <span style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Todo</span>
        </div>

        <h1 className="h1">Sign in</h1>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }} aria-busy={busy}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              disabled={busy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              className={`input${error ? " err" : ""}`}
              id="pw"
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
                <AlertIcon size={18} />
                {error}
              </p>
            )}
          </div>
          <button className="btn pri full" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? (
              <>
                <SpinnerIcon />
                Signing in
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <Link className="link" href="/forgot-password" style={{ alignSelf: "center" }}>
          Forgot password?
        </Link>
      </main>
    </div>
  );
}
