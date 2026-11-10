import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { day, requireUserId, SETTINGS_DEFAULTS } from "./lib";

/**
 * Dev-only data presets for the signed-in account, used by the dev data dock.
 * Enabled only on deployments with DEV_TOOLS=true (the dev deployment), never production.
 */
const preset = v.union(v.literal("demo"), v.literal("worst"), v.literal("empty"), v.literal("one"), v.literal("huge"));

type Priority = "high" | "normal" | "low";
type TaskSeed = {
  title: string;
  priority?: Priority;
  today?: boolean;
  plannedOffset?: number;
  focusSlot?: number;
  done?: boolean;
  doneOffset?: number;
  startTime?: string;
  lengthMin?: number;
  kind?: "task" | "meeting";
  yesterday?: boolean;
  notes?: string;
  steps?: [string, boolean][];
};
/** `met` is today; `history` is the days before it, newest first. */
type GoalSeed = { title: string; detail?: string; met: boolean; days?: number[]; paused?: boolean; history?: boolean[] };

function addDays(base: string, n: number) {
  const [y, m, d] = base.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

const WEEKDAYS = [1, 2, 3, 4, 5];

const DEMO: { tasks: TaskSeed[]; goals: GoalSeed[]; streakDays: number } = {
  streakDays: 4,
  tasks: [
    { title: "Review new provider applications", priority: "high", today: true, focusSlot: 0, done: true },
    { title: "Rebuild case list", priority: "high", today: true, focusSlot: 1, steps: [["Export current cases", true], ["Remove closed cases", true], ["Match providers to open cases", false], ["Flag cases that need staff", false], ["Share with the team", false]], notes: "Use the new intake sheet. Share with the team by Friday." },
    { title: "Send weekly staffing update", priority: "high", today: true, focusSlot: 2 },
    { title: "Read emails", today: true, startTime: "13:00", lengthMin: 60 },
    { title: "Team check-in", today: true, startTime: "15:30", lengthMin: 30, kind: "meeting" },
    { title: "Follow up on intake paperwork", today: true },
    { title: "Call back new family about intake", priority: "high" },
    { title: "Confirm Thursday tour times", plannedOffset: 3 },
    { title: "Update tour calendar" },
    { title: "Send monthly staffing report", priority: "high", plannedOffset: 8 },
    { title: "Clean up shared drive", priority: "low" },
    { title: "Order office supplies", priority: "low" },
  ],
  goals: [
    { title: "Staff a case", detail: "10-hour case", met: false, history: [true, true, true, true] },
    { title: "Get 2 tours", met: false, history: [false, true, true, false] },
  ],
};

const LONG_NOTES =
  "Spoke with the family on Monday. They need coverage Monday to Friday, 8 AM to 6 PM, starting the first week of next month. The mother prefers a provider who speaks Polish and English. ".repeat(12).trim();

const WORST: { tasks: TaskSeed[]; goals: GoalSeed[]; streakDays: number } = {
  streakDays: 31,
  tasks: [
    { title: "Call back Aleksandra Wiśniewska-Kowalczyk about the 10-hour case in Bay Ridge and the Tuesday overlap", priority: "high", today: true, focusSlot: 0, done: true },
    { title: "Email bartholomew.fitzgerald@northwind-industries-holdings.example.com the signed intake forms", priority: "high", today: true, focusSlot: 1, notes: LONG_NOTES, steps: [["Scan forms", true], ["Check every signature line on pages 2, 4 and 7 against the intake checklist", true], ["Benachrichtigungseinstellungen", false], ["Attach Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf", false], ["Jo", false], ["Send", false], ["Wait for reply", false], ["Log in CRM", false], ["Tell the team", false], ["File the paper copies", false], ["Shred duplicates", false], ["Done", false]] },
    { title: "Jo", priority: "high", today: true, focusSlot: 2 },
    { title: "Weekly staffing sync with Christopher Alexander Montgomery III and the whole regional team", today: true, startTime: "09:00", lengthMin: 90, kind: "meeting" },
    { title: "Đặng Thị Ngọc Hân: confirm the Thursday tour", today: true, startTime: "23:30", lengthMin: 30 },
    { title: "<script>alert(1)</script> &amp; **bold** shows as text", today: true },
    { title: "Line one\nLine two", today: true },
    { title: "\u{1F98A} Fox: order supplies", priority: "low" },
    { title: "\u{1F469}\u{1F3FD}\u200D\u{1F4BB} Priya: set up the new laptop", priority: "low" },
    { title: "王秀英提供者申请审核", priority: "normal" },
    { title: "Review Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf", priority: "normal", plannedOffset: 1 },
    { title: "IMG_20250914_183022_HDR_portrait_edited_edited.HEIC upload to the provider file", priority: "normal", plannedOffset: 1 },
    { title: "Benachrichtigungseinstellungen", priority: "normal" },
    { title: "J", priority: "normal" },
    { title: "Seán O'Brien-Ó Súilleabháin wants a call after 6", priority: "high", yesterday: true },
    { title: "نور الهدى عبد الرحمن: intake follow-up", priority: "high", yesterday: true },
    { title: "Ask https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved", priority: "low", yesterday: true },
    { title: "Paramètres de confidentialité et de sécurité", priority: "low", plannedOffset: 14 },
  ],
  goals: [
    { title: "Staff a case", detail: "10-hour case", met: true, history: [true, true, true, true] },
    { title: "Follow up with every family on the waitlist before the end of the day", detail: "At least one call or text per family, logged in the CRM, including the families who asked for evenings", met: false, history: [true, false, true, false] },
    { title: "Get 2 tours", met: false, history: [false, false, false, true] },
  ],
};

const ONE: { tasks: TaskSeed[]; goals: GoalSeed[]; streakDays: number } = {
  streakDays: 1,
  tasks: [
    { title: "Send weekly staffing update", priority: "high", today: true, focusSlot: 0 },
    { title: "Update tour calendar" },
  ],
  goals: [{ title: "Staff a case", met: false, history: [true] }],
};

async function clearAccount(ctx: MutationCtx, userId: string) {
  for (const table of ["tasks", "dailyGoals", "goalLogs", "settings"] as const) {
    const rows =
      table === "goalLogs"
        ? await ctx.db.query("goalLogs").withIndex("by_user_day", (q) => q.eq("userId", userId)).collect()
        : table === "tasks"
          ? await ctx.db.query("tasks").withIndex("by_user_done", (q) => q.eq("userId", userId)).collect()
          : table === "dailyGoals"
            ? await ctx.db.query("dailyGoals").withIndex("by_user", (q) => q.eq("userId", userId)).collect()
            : await ctx.db.query("settings").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const row of rows) await ctx.db.delete(row._id);
  }
}

async function insertSet(
  ctx: MutationCtx,
  userId: string,
  today: string,
  set: { tasks: TaskSeed[]; goals: GoalSeed[]; streakDays: number },
) {
  let order = 1;
  const now = Date.now();
  for (const t of set.tasks) {
    const doneDay = t.done ? addDays(today, t.doneOffset ?? 0) : undefined;
    await ctx.db.insert("tasks", {
      userId,
      title: t.title,
      notes: t.notes,
      priority: t.priority ?? "normal",
      kind: t.kind ?? "task",
      order: order++,
      done: !!t.done,
      doneAt: t.done ? now - 3600_000 : undefined,
      doneDay,
      todayDay: t.today ? today : t.yesterday ? addDays(today, -1) : undefined,
      plannedDay: t.plannedOffset !== undefined ? addDays(today, t.plannedOffset) : undefined,
      focusDay: t.focusSlot !== undefined ? today : undefined,
      focusSet: t.focusSlot !== undefined ? 1 : undefined,
      focusSlot: t.focusSlot,
      startTime: t.startTime,
      lengthMin: t.lengthMin,
      checklist: (t.steps ?? []).map(([title, done], i) => ({ id: `step-${i}`, title, done })),
    });
  }
  // Past wins: three done tasks per day for the streak, ending yesterday, each from a finished focus set.
  for (let d = 1; d <= set.streakDays; d++) {
    const past = addDays(today, -d);
    for (let k = 0; k < 3; k++) {
      await ctx.db.insert("tasks", {
        userId,
        title: `Done on ${past} (${k + 1})`,
        priority: "normal",
        kind: "task",
        order: order++,
        done: true,
        doneAt: now - d * 86_400_000,
        doneDay: past,
        todayDay: past,
        focusDay: past,
        focusSet: 1,
        focusSlot: k,
        checklist: [],
      });
    }
  }
  for (const [i, g] of set.goals.entries()) {
    const goalId: Id<"dailyGoals"> = await ctx.db.insert("dailyGoals", {
      userId,
      title: g.title,
      detail: g.detail,
      days: g.days ?? WEEKDAYS,
      paused: !!g.paused,
      order: i,
    });
    if (g.met) await ctx.db.insert("goalLogs", { userId, goalId, day: today });
    for (const [j, met] of (g.history ?? []).entries()) {
      if (met) await ctx.db.insert("goalLogs", { userId, goalId, day: addDays(today, -(j + 1)) });
    }
  }
}

export const load = mutation({
  args: { preset, today: day },
  returns: v.null(),
  handler: async (ctx, { preset, today }) => {
    if (process.env.DEV_TOOLS !== "true") throw new ConvexError("Dev tools are off on this deployment");
    const userId = await requireUserId(ctx);
    await clearAccount(ctx, userId);
    if (preset === "empty") return null;
    if (preset === "demo") await insertSet(ctx, userId, today, DEMO);
    if (preset === "one") await insertSet(ctx, userId, today, ONE);
    if (preset === "worst") {
      await insertSet(ctx, userId, today, WORST);
      await ctx.db.insert("settings", { userId, ...SETTINGS_DEFAULTS, focusSize: 5 });
    }
    if (preset === "huge") {
      await insertSet(ctx, userId, today, DEMO);
      const priorities: Priority[] = ["high", "normal", "low"];
      for (let i = 0; i < 1000; i++) {
        await ctx.db.insert("tasks", {
          userId,
          title: `Backlog task ${i + 1}: follow up with family ${1000 - i}`,
          priority: priorities[i % 3],
          kind: "task",
          order: 1000 + i,
          done: false,
          checklist: [],
        });
      }
    }
    return null;
  },
});
