import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const priority = v.union(v.literal("high"), v.literal("normal"), v.literal("low"));
export const taskKind = v.union(v.literal("task"), v.literal("meeting"));
export const checklistStep = v.object({ id: v.string(), title: v.string(), done: v.boolean() });

/** Days are local calendar dates as "YYYY-MM-DD", sent by the client. */
export const taskFields = {
  userId: v.string(),
  title: v.string(),
  notes: v.optional(v.string()),
  priority,
  order: v.number(),
  kind: taskKind,
  done: v.boolean(),
  doneAt: v.optional(v.number()),
  doneDay: v.optional(v.string()),
  /** Picked for Today on this day. On any later day the task is simply back in All tasks. */
  todayDay: v.optional(v.string()),
  /** Put on this day from the calendar or the day picker. */
  plannedDay: v.optional(v.string()),
  /** In focus set number `focusSet` on `focusDay`, at position `focusSlot`. */
  focusDay: v.optional(v.string()),
  focusSet: v.optional(v.number()),
  focusSlot: v.optional(v.number()),
  /** Time slot: start time "HH:MM" (24h) and an optional length in minutes. */
  startTime: v.optional(v.string()),
  lengthMin: v.optional(v.number()),
  /** A meeting whose time passed without happening. */
  missedDay: v.optional(v.string()),
  checklist: v.array(checklistStep),
  deletedAt: v.optional(v.number()),
};

export const goalFields = {
  userId: v.string(),
  title: v.string(),
  detail: v.optional(v.string()),
  /** Weekdays the goal applies, 0 = Sunday. */
  days: v.array(v.number()),
  paused: v.boolean(),
  order: v.number(),
};

export const settingsFields = {
  userId: v.string(),
  focusSize: v.number(),
  dailyTarget: v.number(),
  sounds: v.boolean(),
  haptics: v.boolean(),
  confetti: v.boolean(),
  newDayBannerSeen: v.optional(v.string()),
  /** The user hid the getting-started steps on Today. */
  gettingStartedHidden: v.optional(v.boolean()),
};

export default defineSchema({
  tasks: defineTable(taskFields)
    .index("by_user_done", ["userId", "done"])
    .index("by_user_doneDay", ["userId", "doneDay"])
    .index("by_user_plannedDay", ["userId", "plannedDay"]),
  dailyGoals: defineTable(goalFields).index("by_user", ["userId"]),
  /** One row per goal per day it was met. No row means not met. */
  goalLogs: defineTable({
    userId: v.string(),
    goalId: v.id("dailyGoals"),
    day: v.string(),
  })
    .index("by_goal_day", ["goalId", "day"])
    .index("by_user_day", ["userId", "day"]),
  settings: defineTable(settingsFields).index("by_user", ["userId"]),
});
