import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { day, goalDoc, requireUserId } from "./lib";

async function ownGoal(ctx: QueryCtx, userId: string, id: Id<"dailyGoals">) {
  const goal = await ctx.db.get(id);
  if (!goal || goal.userId !== userId) throw new ConvexError("Goal not found");
  return goal;
}

async function listGoals(ctx: QueryCtx, userId: string) {
  const goals = await ctx.db
    .query("dailyGoals")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return goals.sort((a, b) => a.order - b.order);
}

/** Goals that apply on this day, with today's count. */
export const forDay = query({
  args: { today: day, weekday: v.number() },
  returns: v.array(v.object({ goal: goalDoc, count: v.number() })),
  handler: async (ctx, { today, weekday }) => {
    const userId = await requireUserId(ctx);
    const goals = (await listGoals(ctx, userId)).filter((g) => !g.paused && g.days.includes(weekday));
    const logs = await ctx.db
      .query("goalLogs")
      .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("day", today))
      .collect();
    return goals.map((goal) => ({ goal, count: logs.find((l) => l.goalId === goal._id)?.count ?? 0 }));
  },
});

/** Every goal, with which of the given days it was met. */
export const list = query({
  args: { days: v.array(day) },
  returns: v.array(v.object({ goal: goalDoc, met: v.array(v.number()), streak: v.number() })),
  handler: async (ctx, { days }) => {
    const userId = await requireUserId(ctx);
    const goals = await listGoals(ctx, userId);
    const result = [];
    for (const goal of goals) {
      const counts: number[] = [];
      for (const d of days) {
        const log = await ctx.db
          .query("goalLogs")
          .withIndex("by_goal_day", (q) => q.eq("goalId", goal._id).eq("day", d))
          .unique();
        counts.push(log?.count ?? 0);
      }
      // Streak: met days in a row, newest last, ignoring today if not met yet.
      let streak = 0;
      for (let i = counts.length - 1; i >= 0; i--) {
        if (counts[i] >= goal.target) streak++;
        else if (i === counts.length - 1) continue;
        else break;
      }
      result.push({ goal, met: counts, streak });
    }
    return result;
  },
});

export const get = query({
  args: { id: v.id("dailyGoals") },
  returns: v.union(v.null(), goalDoc),
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const goal = await ctx.db.get(id);
    return goal && goal.userId === userId ? goal : null;
  },
});

const goalInput = {
  title: v.string(),
  detail: v.optional(v.string()),
  target: v.number(),
  days: v.array(v.number()),
  paused: v.boolean(),
};

function cleanGoal(input: { title: string; target: number; days: number[] }) {
  const title = input.title.trim();
  if (!title) throw new ConvexError("A goal needs a name");
  if (input.target < 1 || input.target > 20) throw new ConvexError("Target must be 1 to 20");
  if (input.days.length === 0) throw new ConvexError("Pick at least one day");
  return { title, target: Math.round(input.target), days: [...new Set(input.days)].sort() };
}

export const create = mutation({
  args: goalInput,
  returns: v.id("dailyGoals"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await listGoals(ctx, userId);
    return await ctx.db.insert("dailyGoals", {
      userId,
      ...cleanGoal(args),
      detail: args.detail?.trim() || undefined,
      paused: args.paused,
      order: existing.length,
    });
  },
});

export const update = mutation({
  args: { id: v.id("dailyGoals"), ...goalInput },
  returns: v.null(),
  handler: async (ctx, { id, ...args }) => {
    const userId = await requireUserId(ctx);
    await ownGoal(ctx, userId, id);
    await ctx.db.patch(id, { ...cleanGoal(args), detail: args.detail?.trim() || undefined, paused: args.paused });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("dailyGoals") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    await ownGoal(ctx, userId, id);
    const logs = await ctx.db
      .query("goalLogs")
      .withIndex("by_goal_day", (q) => q.eq("goalId", id))
      .collect();
    for (const log of logs) await ctx.db.delete(log._id);
    await ctx.db.delete(id);
    return null;
  },
});

/** Add or take away one for today. Stays between 0 and the target. */
export const bump = mutation({
  args: { id: v.id("dailyGoals"), today: day, delta: v.union(v.literal(1), v.literal(-1)) },
  returns: v.number(),
  handler: async (ctx, { id, today, delta }) => {
    const userId = await requireUserId(ctx);
    const goal = await ownGoal(ctx, userId, id);
    const log = await ctx.db
      .query("goalLogs")
      .withIndex("by_goal_day", (q) => q.eq("goalId", id).eq("day", today))
      .unique();
    const count = Math.max(0, Math.min(goal.target, (log?.count ?? 0) + delta));
    if (log) await ctx.db.patch(log._id, { count });
    else await ctx.db.insert("goalLogs", { userId, goalId: id, day: today, count });
    return count;
  },
});
