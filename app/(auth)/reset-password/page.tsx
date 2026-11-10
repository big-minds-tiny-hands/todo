"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AlertIcon, SpinnerIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { unexpectedAuthError } from "@/lib/auth-error";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(token ? null : "This reset link is not complete. Get a new one below.");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (error) {
      if (error.status === 429) setError("Too many tries. Wait a few minutes, then try again.");
      else if (error.status === 400) setError("This reset link has expired or was already used. Get a new one below.");
      else setError(unexpectedAuthError("reset-password", error));
      return;
    }
    router.replace("/sign-in?reset=1");
  }

  return (
    <div className="phone center">
      <main className="narrow" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "72px 24px 40px", gap: 32 }}>
        <h1 className="h1">Set a new password</h1>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label htmlFor="pw">New password</label>
            <input
              className={`input${error ? " err" : ""}`}
              id="pw"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? "pw-err pw-hint" : "pw-hint"}
            />
            <p className="small muted" id="pw-hint" style={{ margin: 0 }}>
              At least 8 characters.
            </p>
            {error && (
              <p className="err-text" id="pw-err" role="alert">
                <AlertIcon size={18} />
                {error}
              </p>
            )}
          </div>
          <button className="btn pri full" type="submit" disabled={busy || !token}>
            {busy ? <SpinnerIcon /> : null}
            Save password
          </button>
        </form>
        {error && (
          <Link className="link" href="/forgot-password" style={{ alignSelf: "center" }}>
            Get a new reset link
          </Link>
        )}
      </main>
    </div>
  );
}
