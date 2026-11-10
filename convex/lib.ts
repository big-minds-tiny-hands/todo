import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";
import { goalFields, settingsFields, taskFields } from "./schema";

export const day = v.string();

export const taskDoc = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  ...taskFields,
});

export const goalDoc = v.object({
  _id: v.id("dailyGoals"),
  _creationTime: v.number(),
  ...goalFields,
});

export const settingsValue = v.object({
  focusSize: settingsFields.focusSize,
  dailyTarget: settingsFields.dailyTarget,
  sounds: settingsFields.sounds,
  haptics: settingsFields.haptics,
  confetti: settingsFields.confetti,
  newDayBannerSeen: settingsFields.newDayBannerSeen,
});

export const SETTINGS_DEFAULTS = {
  focusSize: 3,
  dailyTarget: 3,
  sounds: true,
  haptics: true,
  confetti: true,
};

export type Task = Doc<"tasks">;

/** Every function reads and writes only the signed-in user's rows. */
export async function requireUserId(ctx: QueryCtx): Promise<string> {
  const user = await authComponent.safeGetAuthUser(ctx);
  if (!user) throw new ConvexError("Not signed in");
  return user._id;
}

export async function ownTask(ctx: QueryCtx, userId: string, id: Doc<"tasks">["_id"]) {
  const task = await ctx.db.get(id);
  if (!task || task.userId !== userId || task.deletedAt) throw new ConvexError("Task not found");
  return task;
}

export async function readSettings(ctx: QueryCtx, userId: string) {
  const row = await ctx.db
    .query("settings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!row) return { ...SETTINGS_DEFAULTS, newDayBannerSeen: undefined };
  return {
    focusSize: row.focusSize,
    dailyTarget: row.dailyTarget,
    sounds: row.sounds,
    haptics: row.haptics,
    confetti: row.confetti,
    newDayBannerSeen: row.newDayBannerSeen,
  };
}

export const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

export function byPriority(a: Task, b: Task) {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order;
}

export function isOnDay(task: Task, today: string) {
  return task.todayDay === today || task.plannedDay === today || task.focusDay === today;
}
