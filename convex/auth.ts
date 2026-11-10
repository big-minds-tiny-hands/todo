import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const DAY = 60 * 60 * 24;

export const authComponent = createClient<DataModel>(components.betterAuth);

/** Sign-up is invite only: an account can be created only for an email in ALLOWED_EMAILS. */
function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.SITE_URL,
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
    session: {
      // Stay signed in on the phone: 60 days, renewed once a day while in use.
      expiresIn: 60 * DAY,
      updateAge: DAY,
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!allowedEmails().includes(user.email.toLowerCase())) {
              throw new Error("Sign-up is invite only.");
            }
            return { data: user };
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
