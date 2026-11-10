#!/usr/bin/env node
// Proves a failed Convex token refresh does not sign anyone out. On every page load Convex fetches a
// token, the server confirms it, then Convex refreshes it at once. This lets the first token request
// through and fails the rest, which is what a phone waking before its network is back looks like.
// Pass: the app stays on screen during the outage and is still signed in after it ends.
// Usage: node scripts/check-token-outage.mjs [app-url] [sign-in-url]
// Needs TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local. Sign-in must use a trusted origin;
// localhost cookies are shared across ports, so app-url may be another local port.
import { createRequire } from "node:module";

const [app = "http://localhost:3001", signIn = app] = process.argv.slice(2);
const { chromium } = createRequire(import.meta.url)("playwright-core");
process.loadEnvFile(".env.local");

const TOKEN = "**/api/auth/convex/token**";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const path = () => new URL(page.url()).pathname;
const nav = () => page.getByRole("navigation", { name: "Main" });

try {
  await page.goto(`${signIn}/sign-in`);
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 20_000 });

  let passed = 0;
  let failed = 0;
  await page.route(TOKEN, (route) => (passed++ < 1 ? route.continue() : (failed++, route.abort("internetdisconnected"))));
  await page.goto(`${app}/tasks`);
  await page.waitForTimeout(10_000);
  const during = path();

  await page.unroute(TOKEN);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  const after = await nav().waitFor({ timeout: 15_000 }).then(() => path(), () => path());

  const ok = !during.startsWith("/sign-in") && !after.startsWith("/sign-in") && (await nav().isVisible());
  console.log(`${ok ? "PASS" : "FAIL"} ${app}: failed token requests=${failed}, during outage=${during}, after=${after}`);
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
