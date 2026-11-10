import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createAuth } from "./auth";

/**
 * Create an account for someone. Run from the dev box:
 *   bunx convex run admin:createUser '{"email":"…","password":"…","name":"…"}'
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
