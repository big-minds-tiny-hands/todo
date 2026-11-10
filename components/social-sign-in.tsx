"use client";

import { useState } from "react";
import { SpinnerIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";

type Provider = "google" | "microsoft";

/** Buttons show only for providers listed in NEXT_PUBLIC_AUTH_PROVIDERS, matching the credentials set on Convex. */
const ENABLED = new Set(
  (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter((p): p is Provider => p === "google" || p === "microsoft"),
);

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.16 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.86-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l3.99-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
      <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  );
}

const PROVIDERS: { id: Provider; label: string; Mark: () => React.ReactElement }[] = [
  { id: "google", label: "Continue with Google", Mark: GoogleMark },
  { id: "microsoft", label: "Continue with Microsoft", Mark: MicrosoftMark },
];

export function SocialSignIn({ next }: { next: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);
  const shown = PROVIDERS.filter((p) => ENABLED.has(p.id));
  if (shown.length === 0) return null;

  async function go(provider: Provider) {
    setBusy(provider);
    const { error } = await authClient.signIn.social({ provider, callbackURL: next, errorCallbackURL: "/sign-in" });
    if (error) setBusy(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {shown.map(({ id, label, Mark }) => (
        <button key={id} type="button" className="btn sec full" onClick={() => go(id)} disabled={busy !== null}>
          {busy === id ? <SpinnerIcon /> : <Mark />}
          {label}
        </button>
      ))}
      <div role="separator" style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--tx3)", fontSize: 13, margin: "8px 0 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        or with email
        <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>
    </div>
  );
}

/** Messages for the error codes Better Auth puts on the sign-in URL after a failed social sign-in. */
export function socialErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (/sign_up_not_allowed|unable_to_create_user|signup_disabled/i.test(code))
    return "This account can't sign up for Todo. Use your Big Minds Tiny Hands account, or ask Fardin to add yours.";
  if (/access_denied/i.test(code)) return "Sign-in was canceled.";
  return "Could not sign in with that account. Try again.";
}
