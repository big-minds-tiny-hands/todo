"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertIcon, Logo, SpinnerIcon } from "@/components/icons";
import { SocialSignIn } from "@/components/social-sign-in";
import { authClient } from "@/lib/auth-client";

type SignUpError = { field: "email" | "password" | "form"; message: string };

function signUpError(status: number, code: string | undefined): SignUpError {
  if (status === 403 || code === "SIGN_UP_NOT_ALLOWED")
    return { field: "email", message: "This email can't sign up for Todo. Use your Big Minds Tiny Hands email, or ask Fardin to add this one." };
  if (status === 422 || code?.startsWith("USER_ALREADY_EXISTS")) return { field: "email", message: "This email already has an account. Sign in instead." };
  if (code === "PASSWORD_TOO_SHORT") return { field: "password", message: "Use at least 8 characters for your password." };
  if (status === 429) return { field: "form", message: "Too many tries. Wait a few minutes, then try again." };
  return { field: "form", message: "Could not reach Todo. Check your connection and try again." };
}

function ErrorText({ id, message }: { id: string; message: string }) {
  return (
    <p className="err-text" id={id} role="alert">
      <AlertIcon size={18} />
      {message}
    </p>
  );
}

/** The server decides who may sign up: emails and domains in ALLOWED_EMAILS. */
export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<SignUpError | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(signUpError(error.status, error.code));
      return;
    }
    router.replace("/");
  }

  return (
    <div className="phone center">
      <main className="narrow" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "72px 24px 40px", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo />
          <span style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Todo</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1 className="h1">Create your account</h1>
          <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
            Use your Big Minds Tiny Hands email.
          </p>
        </div>

        <SocialSignIn next="/" />

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }} aria-busy={busy}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input className="input" id="name" name="name" autoComplete="name" placeholder="Sam Rivera…" required disabled={busy} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              className={`input${error?.field === "email" ? " err" : ""}`}
              id="email"
              name="email"
              type="email"
              spellCheck={false}
              placeholder="you@example.com…"
              autoComplete="email"
              inputMode="email"
              required
              disabled={busy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error?.field === "email"}
              aria-describedby={error?.field === "email" ? "email-err" : undefined}
            />
            {error?.field === "email" && <ErrorText id="email-err" message={error.message} />}
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              className={`input${error?.field === "password" ? " err" : ""}`}
              id="pw"
              name="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={busy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error?.field === "password"}
              aria-describedby={error?.field === "password" ? "pw-err pw-hint" : "pw-hint"}
            />
            <p className="small muted" id="pw-hint" style={{ margin: 0 }}>
              At least 8 characters.
            </p>
            {error?.field === "password" && <ErrorText id="pw-err" message={error.message} />}
          </div>
          <button className="btn pri full" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy && <SpinnerIcon />}
            Create account
          </button>
          {error?.field === "form" && <ErrorText id="form-err" message={error.message} />}
        </form>

        <p className="muted" style={{ margin: 0, alignSelf: "center" }}>
          Have an account?{" "}
          <Link className="link" href="/sign-in" style={{ display: "inline" }}>
            Sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
