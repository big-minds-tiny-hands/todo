#!/usr/bin/env node
// Proves each origin can reach auth: a sign-up with a one-letter password must fail on the
// password (400 PASSWORD_TOO_SHORT), never on the origin (403 INVALID_ORIGIN). No account is made.
// Usage: node scripts/check-auth-origin.mjs https://a.example https://b.example
const origins = process.argv.slice(2);
if (origins.length === 0) {
  console.error("usage: check-auth-origin.mjs <origin>...");
  process.exit(2);
}
let failed = false;
for (const origin of origins) {
  const res = await fetch(new URL("/api/auth/sign-up/email", origin), {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ name: "Origin check", email: "origin-check@todo.test", password: "x" }),
  });
  const body = await res.json().catch(() => ({}));
  const ok = res.status === 400 && body.code === "PASSWORD_TOO_SHORT";
  console.log(`${ok ? "ok  " : "FAIL"} ${origin}: ${res.status} ${body.code ?? ""}`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
