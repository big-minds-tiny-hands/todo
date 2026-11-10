import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const DAY = 60 * 60 * 24;

export const authComponent = createClient<DataModel>(components.betterAuth);

function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** A provider turns on only when both of its credentials are set on the deployment. */
function socialProviders(): BetterAuthOptions["socialProviders"] {
  const env = process.env;
  return {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account" as const } }
      : {}),
    ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
            tenantId: env.MICROSOFT_TENANT_ID || "common",
            prompt: "select_account" as const,
          },
        }
      : {}),
  };
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    appName: "Todo",
    baseURL: process.env.SITE_URL,
    // SITE_URL is trusted already. Add Vercel preview or extra origins as a comma list.
    trustedOrigins: list(process.env.TRUSTED_ORIGINS),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        // No email provider yet (OPS-46). Until then the reset link goes to the Convex logs.
        console.log(`[password reset] ${user.email}: ${url}`);
      },
    },
    socialProviders: socialProviders(),
    account: {
      // One person, one account: Google or Microsoft with the same verified email joins the existing account.
      accountLinking: { enabled: true, trustedProviders: ["google", "microsoft", "email-password"] },
      encryptOAuthTokens: true,
    },
    session: {
      // Stay signed in on the phone: 60 days, renewed once a day while in use.
      expiresIn: 60 * DAY,
      updateAge: DAY,
    },
    rateLimit: {
      enabled: true,
      // Convex functions keep no memory between requests, so counts live in the component's rateLimit table.
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 300, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
        "/reset-password": { window: 300, max: 5 },
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            console.log(`[auth] session created user=${session.userId} ip=${session.ipAddress ?? "?"}`);
          },
        },
      },
      account: {
        create: {
          after: async (account) => {
            console.log(`[auth] account linked user=${account.userId} provider=${account.providerId}`);
          },
        },
      },
    },
    plugins: [convex({ authConfig })],
  });

export const getCurrentUser = query({
  args: {},
  returns: v.union(v.null(), v.object({ id: v.string(), name: v.string(), email: v.string() })),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return null;
    return { id: user._id, name: user.name, email: user.email };
  },
});
