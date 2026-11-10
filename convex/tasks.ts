import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { byPlannedDay, byPriority, placeOf } from "../lib/placement";
import { day, ownTask, readSettings, requireUserId, settingsValue, taskDoc, type Task } from "./lib";
import { priority, taskKind } from "./schema";

async function openTasks(ctx: Parameters<typeof requireUserId>[0], userId: string) {
  const rows = await ctx.db
    .query("tasks")
    .withIndex("by_user_done", (q) => q.eq("userId", userId).eq("done", false))
    .collect();
  return rows.filter((t) => !t.deletedAt);
}

async function doneOn(ctx: Parameters<typeof requireUserId>[0], userId: string, today: string) {
  const rows = await ctx.db
    .query("tasks")
    .withIndex("by_user_doneDay", (q) => q.eq("userId", userId).eq("doneDay", today))
    .collect();
  return rows.filter((t) => !t.deletedAt);
}

function currentFocusSet(tasks: Task[], today: string) {
  return tasks.reduce((max, t) => (t.focusDay === today && t.focusSet ? Math.max(max, t.focusSet) : max), 0);
}

/** A task already on Today keeps the moment it arrived. */
function pickedAt(task: Task, today: string) {
  return placeOf(task, today).kind === "today" ? task.pickedAt : Date.now();
}

function byTime(a: Task, b: Task) {
  return (a.startTime ?? "").localeCompare(b.startTime ?? "");
}

/** Everything the Today screen shows, in one subscription. */
export const today = query({
  args: { today: day, yesterday: day },
  returns: v.object({
    focus: v.array(taskDoc),
    focusSet: v.number(),
    schedule: v.array(taskDoc),
    rest: v.array(taskDoc),
    doneToday: v.array(taskDoc),
    returnedCount: v.number(),
    allTasksCount: v.number(),
    hasAnyTask: v.boolean(),
    settings: settingsValue,
  }),
  handler: async (ctx, { today, yesterday }) => {
    const userId = await requireUserId(ctx);
    const open = await openTasks(ctx, userId);
    const doneToday = (await doneOn(ctx, userId, today)).sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0));
    const onToday = open.filter((t) => placeOf(t, today).kind === "today");
    const everything = [...onToday, ...doneToday];
    const focusSet = currentFocusSet(everything, today);
    const focus = everything
      .filter((t) => t.focusDay === today && t.focusSet === focusSet && focusSet > 0)
      .sort((a, b) => (a.focusSlot ?? 0) - (b.focusSlot ?? 0));
    const focusIds = new Set(focus.map((t) => t._id));
    const schedule = everything.filter((t) => t.startTime && !focusIds.has(t._id)).sort(byTime);
    const rest = onToday.filter((t) => !t.startTime && !focusIds.has(t._id)).sort(byPriority);
    const returnedCount = open.filter((t) => t.todayDay === yesterday && placeOf(t, today).kind !== "today").length;
    return {
      focus,
      focusSet,
      schedule,
      rest,
      doneToday,
      returnedCount,
      allTasksCount: open.filter((t) => placeOf(t, today).kind === "pool").length,
      hasAnyTask: open.length + doneToday.length > 0,
      settings: await readSettings(ctx, userId),
    };
  },
});

/** Open tasks off Today: the pool by priority, and tasks planned for a later day. */
export const all = query({
  args: { today: day },
  returns: v.object({
    pool: v.array(taskDoc),
    planned: v.array(taskDoc),
    // Old installed clients read `tasks` until they reload onto this release. Remove after it has been live a day.
    tasks: v.array(taskDoc),
    onTodayCount: v.number(),
    hasAnyTask: v.boolean(),
  }),
  handler: async (ctx, { today }) => {
    const userId = await requireUserId(ctx);
    const open = await openTasks(ctx, userId);
    const at = (kind: "today" | "planned" | "pool") => open.filter((t) => placeOf(t, today).kind === kind);
    // Tells a first visit (nothing ever added) from a cleared list, so each gets its own empty state.
    const anyTask = open.length > 0 || (await ctx.db.query("tasks").withIndex("by_user_done", (q) => q.eq("userId", userId)).first()) !== null;
    const pool = at("pool").sort(byPriority);
    const planned = at("planned").sort(byPlannedDay);
    return {
      pool,
      planned,
      tasks: [...pool, ...planned],
      onTodayCount: at("today").length,
      hasAnyTask: anyTask,
    };
  },
});

/** Finished tasks, newest first. */
export const completed = query({
  args: {},
  returns: v.array(taskDoc),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("tasks")
      .withIndex("by_user_doneDay", (q) => q.eq("userId", userId).gte("doneDay", ""))
      .order("desc")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .take(100);
    return rows.sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  },
});

export const inRange = query({
  args: { from: day, to: day },
  returns: v.array(taskDoc),
  handler: async (ctx, { from, to }) => {
    const userId = await requireUserId(ctx);
    const planned = await ctx.db
      .query("tasks")
      .withIndex("by_user_plannedDay", (q) => q.eq("userId", userId).gte("plannedDay", from).lte("plannedDay", to))
      .collect();
    // Tasks picked for Today carry todayDay, not plannedDay, but still belong on that day's calendar cell.
    const inWindow = (d?: string) => d !== undefined && d >= from && d <= to;
    const picked = (await openTasks(ctx, userId)).filter((t) => inWindow(t.todayDay));
    const doneOnDays = (
      await ctx.db
        .query("tasks")
        .withIndex("by_user_doneDay", (q) => q.eq("userId", userId).gte("doneDay", from).lte("doneDay", to))
        .collect()
    ).filter((t) => inWindow(t.todayDay));
    const byId = new Map([...planned, ...picked, ...doneOnDays].filter((t) => !t.deletedAt).map((t) => [t._id, t]));
    return [...byId.values()].sort(byTime);
  },
});

export const get = query({
  // A string, not v.id, so a malformed id from the URL reads as "not found" instead of throwing.
  args: { id: v.string() },
  returns: v.union(v.null(), taskDoc),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const id = ctx.db.normalizeId("tasks", args.id);
    if (!id) return null;
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId || task.deletedAt) return null;
    return task;
  },
});

async function nextOrder(ctx: Parameters<typeof requireUserId>[0], userId: string) {
  const open = await openTasks(ctx, userId);
  return open.reduce((max, t) => Math.max(max, t.order), 0) + 1;
}

export const create = mutation({
  args: {
    title: v.string(),
    priority: v.optional(priority),
    kind: v.optional(taskKind),
    todayDay: v.optional(day),
    plannedDay: v.optional(day),
    startTime: v.optional(v.string()),
    lengthMin: v.optional(v.number()),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const title = args.title.trim();
    if (!title) throw new ConvexError("A task needs a title");
    return await ctx.db.insert("tasks", {
      userId,
      title,
      priority: args.priority ?? "normal",
      kind: args.kind ?? "task",
      order: await nextOrder(ctx, userId),
      done: false,
      todayDay: args.todayDay,
      plannedDay: args.plannedDay,
      pickedAt: args.todayDay || args.plannedDay ? Date.now() : undefined,
      startTime: args.startTime,
      lengthMin: args.lengthMin,
      checklist: [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(priority),
    kind: v.optional(taskKind),
    plannedDay: v.optional(v.union(day, v.null())),
    startTime: v.optional(v.union(v.string(), v.null())),
    lengthMin: v.optional(v.union(v.number(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireUserId(ctx);
    await ownTask(ctx, userId, id);
    const patch: Partial<Task> = {};
    if (fields.title !== undefined) {
      const title = fields.title.trim();
      if (!title) throw new ConvexError("A task needs a title");
      patch.title = title;
    }
    if (fields.notes !== undefined) patch.notes = fields.notes;
    if (fields.priority !== undefined) patch.priority = fields.priority;
    if (fields.kind !== undefined) patch.kind = fields.kind;
    if (fields.plannedDay !== undefined) {
      patch.plannedDay = fields.plannedDay ?? undefined;
      if (fields.plannedDay) patch.pickedAt = Date.now();
    }
    if (fields.startTime !== undefined) patch.startTime = fields.startTime ?? undefined;
    if (fields.lengthMin !== undefined) patch.lengthMin = fields.lengthMin ?? undefined;
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const setDone = mutation({
  args: { id: v.id("tasks"), done: v.boolean(), today: day },
  returns: v.null(),
  handler: async (ctx, { id, done, today }) => {
    const userId = await requireUserId(ctx);
    await ownTask(ctx, userId, id);
    await ctx.db.patch(id, done ? { done: true, doneAt: Date.now(), doneDay: today } : { done: false, doneAt: undefined, doneDay: undefined });
    return null;
  },
});

export const addToToday = mutation({
  args: { id: v.id("tasks"), today: day },
  returns: v.null(),
  handler: async (ctx, { id, today }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    await ctx.db.patch(id, { todayDay: today, pickedAt: pickedAt(task, today) });
    return null;
  },
});

/** Take a task off Today. It stays in All tasks at its priority. */
export const removeFromToday = mutation({
  args: { id: v.id("tasks"), today: day },
  returns: v.null(),
  handler: async (ctx, { id, today }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    await ctx.db.patch(id, {
      todayDay: undefined,
      plannedDay: task.plannedDay === today ? undefined : task.plannedDay,
      focusDay: undefined,
      focusSet: undefined,
      focusSlot: undefined,
    });
    return null;
  },
});

/** Start a new focus set from the chosen tasks, in the order given. */
export const startFocus = mutation({
  args: { ids: v.array(v.id("tasks")), today: day },
  returns: v.null(),
  handler: async (ctx, { ids, today }) => {
    const userId = await requireUserId(ctx);
    const settings = await readSettings(ctx, userId);
    if (ids.length === 0) throw new ConvexError("Pick at least one task");
    if (ids.length > settings.focusSize) throw new ConvexError(`Pick up to ${settings.focusSize}`);
    const everything = [...(await openTasks(ctx, userId)), ...(await doneOn(ctx, userId, today))];
    const current = currentFocusSet(everything, today);
    const currentOpen = everything.filter((t) => t.focusDay === today && t.focusSet === current && !t.done);
    // An unfinished set is replaced; a finished set stays on record and the new one gets the next number.
    for (const t of currentOpen) await ctx.db.patch(t._id, { focusDay: undefined, focusSet: undefined, focusSlot: undefined });
    const setNumber = currentOpen.length > 0 ? Math.max(current, 1) : current + 1;
    for (const [slot, id] of ids.entries()) {
      const task = await ownTask(ctx, userId, id);
      await ctx.db.patch(id, { focusDay: today, focusSet: setNumber, focusSlot: slot, todayDay: today, pickedAt: pickedAt(task, today) });
    }
    return null;
  },
});

/** Add one task to the current focus set, or start set 1 with it. */
export const addToFocus = mutation({
  args: { id: v.id("tasks"), today: day },
  returns: v.null(),
  handler: async (ctx, { id, today }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    const settings = await readSettings(ctx, userId);
    const everything = [...(await openTasks(ctx, userId)), ...(await doneOn(ctx, userId, today))];
    let set = currentFocusSet(everything, today);
    let members = everything.filter((t) => t.focusDay === today && t.focusSet === set && set > 0);
    if (set === 0 || members.every((t) => t.done)) {
      set += 1;
      members = [];
    }
    if (members.length >= settings.focusSize) throw new ConvexError(`Your focus set already has ${settings.focusSize}`);
    await ctx.db.patch(id, { focusDay: today, focusSet: set, focusSlot: members.length, todayDay: today, pickedAt: pickedAt(task, today) });
    return null;
  },
});

export const removeFromFocus = mutation({
  args: { id: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    await ownTask(ctx, userId, id);
    await ctx.db.patch(id, { focusDay: undefined, focusSet: undefined, focusSlot: undefined });
    return null;
  },
});

export const markMissed = mutation({
  args: { id: v.id("tasks"), today: day },
  returns: v.null(),
  handler: async (ctx, { id, today }) => {
    const userId = await requireUserId(ctx);
    await ownTask(ctx, userId, id);
    await ctx.db.patch(id, { missedDay: today, todayDay: undefined, plannedDay: undefined });
    return null;
  },
});

/** Soft delete, so Undo can bring it back. */
export const remove = mutation({
  args: { id: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    await ownTask(ctx, userId, id);
    await ctx.db.patch(id, { deletedAt: Date.now() });
    return null;
  },
});

export const restore = mutation({
  args: { id: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) throw new ConvexError("Task not found");
    await ctx.db.patch(id, { deletedAt: undefined });
    return null;
  },
});

/** Deleted tasks, newest first, so a delete can be undone long after its toast. */
export const recentlyDeleted = query({
  args: {},
  returns: v.array(taskDoc),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const mine = await ctx.db
      .query("tasks")
      .withIndex("by_user_done", (q) => q.eq("userId", userId))
      .collect();
    return mine
      .filter((t) => t.deletedAt !== undefined)
      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
      .slice(0, 30);
  },
});

/** Move a task up or down inside its priority group. */
export const move = mutation({
  args: { id: v.id("tasks"), direction: v.union(v.literal("up"), v.literal("down")) },
  returns: v.null(),
  handler: async (ctx, { id, direction }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    const group = (await openTasks(ctx, userId)).filter((t) => t.priority === task.priority).sort(byPriority);
    const index = group.findIndex((t) => t._id === id);
    const other = group[direction === "up" ? index - 1 : index + 1];
    if (!other) return null;
    await ctx.db.patch(task._id, { order: other.order });
    await ctx.db.patch(other._id, { order: task.order });
    return null;
  },
});

export const addStep = mutation({
  args: { id: v.id("tasks"), title: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, title }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    const clean = title.trim();
    if (!clean) return null;
    await ctx.db.patch(id, { checklist: [...task.checklist, { id: crypto.randomUUID(), title: clean, done: false }] });
    return null;
  },
});

export const setStep = mutation({
  args: { id: v.id("tasks"), stepId: v.string(), done: v.optional(v.boolean()), title: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { id, stepId, done, title }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    await ctx.db.patch(id, {
      checklist: task.checklist.map((s) =>
        s.id === stepId ? { ...s, done: done ?? s.done, title: title?.trim() || s.title } : s,
      ),
    });
    return null;
  },
});

export const removeStep = mutation({
  args: { id: v.id("tasks"), stepId: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, stepId }) => {
    const userId = await requireUserId(ctx);
    const task = await ownTask(ctx, userId, id);
    await ctx.db.patch(id, { checklist: task.checklist.filter((s) => s.id !== stepId) });
    return null;
  },
});
