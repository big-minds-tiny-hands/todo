"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronLeft, MailIcon, SpinnerIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    const address = email.trim();
    // Always show "sent", so the screen never reveals which emails have accounts.
    await authClient.requestPasswordReset({ email: address, redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    setSentTo(address);
  }

  if (sentTo) {
    return (
      <div className="phone center">
        <main className="narrow" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 28px", gap: 16 }}>
          <div className="empty-art">
            <MailIcon />
          </div>
          <h1 className="h1" style={{ fontSize: 30 }}>Check your email</h1>
          <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
            If <span style={{ color: "var(--tx)", overflowWrap: "anywhere" }}>{sentTo}</span> has an account, a reset link is on its way. It
            works for one hour.
          </p>
          <Link className="btn sec full" href="/sign-in" style={{ marginTop: 16 }}>
            Back to sign in
          </Link>
          <button className="btn text" onClick={() => send()} disabled={busy}>
            Send the link again
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="phone center">
      <main className="narrow" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 24px 40px", gap: 32 }}>
        <Link className="link" href="/sign-in" style={{ alignSelf: "flex-start", marginLeft: -4 }}>
          <ChevronLeft />
          Sign in
        </Link>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          <h1 className="h1">Reset your password</h1>
          <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
            We&apos;ll email you a link to set a new one.
          </p>
        </div>
        <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input className="input" id="email" name="email" spellCheck={false} placeholder="you@example.com…" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn pri full" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? <SpinnerIcon /> : null}
            Send reset link
          </button>
        </form>
      </main>
    </div>
  );
}
