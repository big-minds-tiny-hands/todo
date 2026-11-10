import { v } from "convex/values";
import { query } from "./_generated/server";
import { day, readSettings, requireUserId } from "./lib";

/**
 * Wins: a win is a day with at least `dailyTarget` tasks done.
 * The client sends `days`: the last 60 local dates, oldest first, ending today.
 */
export const wins = query({
  args: { days: v.array(day), week: v.array(day), monthPrefix: v.string() },
  returns: v.object({
    target: v.number(),
    doneToday: v.number(),
    streak: v.number(),
    best: v.number(),
    week: v.array(v.object({ day, count: v.number() })),
    weekTotal: v.number(),
    monthDone: v.number(),
    monthFocusSets: v.number(),
    goalTotals: v.array(v.object({ title: v.string(), total: v.number() })),
    totalDone: v.number(),
    firstFocusSetDay: v.union(v.null(), v.string()),
  }),
  handler: async (ctx, { days, week, monthPrefix }) => {
    const userId = await requireUserId(ctx);
    const { dailyTarget } = await readSettings(ctx, userId);
    const done = (
      await ctx.db
        .query("tasks")
        .withIndex("by_user_done", (q) => q.eq("userId", userId).eq("done", true))
        .collect()
    ).filter((t) => !t.deletedAt && t.doneDay);

    const perDay = new Map<string, number>();
    for (const t of done) perDay.set(t.doneDay!, (perDay.get(t.doneDay!) ?? 0) + 1);
    const won = (d: string) => (perDay.get(d) ?? 0) >= dailyTarget;

    // Current streak: today counts if won; an unfinished today does not break it.
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (won(days[i])) streak++;
      else if (i === days.length - 1) continue;
      else break;
    }
    let best = 0;
    let run = 0;
    for (const d of days) {
      run = won(d) ? run + 1 : 0;
      best = Math.max(best, run);
    }

    // Focus sets finished: every task in (focusDay, focusSet) is done.
    const sets = new Map<string, { day: string; total: number; done: number }>();
    const focusTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user_done", (q) => q.eq("userId", userId))
      .collect();
    for (const t of focusTasks) {
      if (t.deletedAt || !t.focusDay || !t.focusSet) continue;
      const key = `${t.focusDay}#${t.focusSet}`;
      const entry = sets.get(key) ?? { day: t.focusDay, total: 0, done: 0 };
      entry.total++;
      if (t.done) entry.done++;
      sets.set(key, entry);
    }
    const finishedSets = [...sets.values()].filter((s) => s.done === s.total).sort((a, b) => a.day.localeCompare(b.day));

    const goals = await ctx.db
      .query("dailyGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const goalTotals = [];
    for (const goal of goals.sort((a, b) => a.order - b.order)) {
      const logs = await ctx.db
        .query("goalLogs")
        .withIndex("by_goal_day", (q) => q.eq("goalId", goal._id))
        .collect();
      goalTotals.push({
        title: goal.title,
        total: logs.filter((l) => l.day.startsWith(monthPrefix)).reduce((sum, l) => sum + l.count, 0),
      });
    }

    const weekRows = week.map((d) => ({ day: d, count: perDay.get(d) ?? 0 }));
    return {
      target: dailyTarget,
      doneToday: perDay.get(days[days.length - 1]) ?? 0,
      streak,
      best: Math.max(best, streak),
      week: weekRows,
      weekTotal: weekRows.reduce((sum, r) => sum + r.count, 0),
      monthDone: done.filter((t) => t.doneDay!.startsWith(monthPrefix)).length,
      monthFocusSets: finishedSets.filter((s) => s.day.startsWith(monthPrefix)).length,
      goalTotals,
      totalDone: done.length,
      firstFocusSetDay: finishedSets[0]?.day ?? null,
    };
  },
});
