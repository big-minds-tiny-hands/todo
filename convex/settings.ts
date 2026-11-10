import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { readSettings, requireUserId, SETTINGS_DEFAULTS, settingsValue } from "./lib";

export const get = query({
  args: {},
  returns: settingsValue,
  handler: async (ctx) => readSettings(ctx, await requireUserId(ctx)),
});

export const update = mutation({
  args: {
    focusSize: v.optional(v.number()),
    dailyTarget: v.optional(v.number()),
    sounds: v.optional(v.boolean()),
    haptics: v.optional(v.boolean()),
    confetti: v.optional(v.boolean()),
    newDayBannerSeen: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, patch) => {
    const userId = await requireUserId(ctx);
    if (patch.focusSize !== undefined && (patch.focusSize < 1 || patch.focusSize > 5)) {
      throw new ConvexError("A focus set holds 1 to 5 tasks");
    }
    if (patch.dailyTarget !== undefined && (patch.dailyTarget < 1 || patch.dailyTarget > 20)) {
      throw new ConvexError("Daily target must be 1 to 20");
    }
    const row = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (row) await ctx.db.patch(row._id, patch);
    else await ctx.db.insert("settings", { userId, ...SETTINGS_DEFAULTS, ...patch });
    return null;
  },
});
