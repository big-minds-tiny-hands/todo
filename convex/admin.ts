import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createAuth } from "./auth";

/**
 * Create an invited account. Run from the dev box:
 *   bunx convex run admin:createUser '{"email":"…","password":"…","name":"…"}'
 * The email must also be in the ALLOWED_EMAILS Convex env var.
 */
export const createUser = internalAction({
  args: { email: v.string(), password: v.string(), name: v.string() },
  returns: v.object({ userId: v.string() }),
  handler: async (ctx, args) => {
    const auth = createAuth(ctx);
    const result = await auth.api.signUpEmail({ body: args });
    return { userId: result.user.id };
  },
});
