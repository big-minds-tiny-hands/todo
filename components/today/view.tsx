import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { clockLabel, lengthLabel, minutesOf, toDay } from "@/lib/day";
import { PRIORITY_LABEL } from "@/components/ui-todo";

export type Task = Doc<"tasks">;
export type TodayData = FunctionReturnType<typeof api.tasks.today>;
export type GoalRow = FunctionReturnType<typeof api.goals.forDay>[number];

/** The one screen Today shows. Overlays (set done, time-slot check) sit on top of it. */
export type TodayView =
  | { kind: "loading" }
  | { kind: "firstRun" }
  | { kind: "newDay"; data: TodayData; goals: GoalRow[]; planned: Task[] }
  | { kind: "plan"; data: TodayData; goals: GoalRow[]; today: Task[] }
  | { kind: "focus"; data: TodayData; goals: GoalRow[] }
  | { kind: "nextSet"; data: TodayData; open: Task[] }
  | { kind: "dayWon"; data: TodayData; goals: GoalRow[] };

/** Open tasks on Today. The query returns focus, schedule and rest as disjoint lists. */
export function openToday(data: TodayData): Task[] {
  return [...data.focus, ...data.schedule, ...data.rest].filter((t) => !t.done);
}

/**
 * Before the first focus set of the day, Today stays on the plan: tasks finished from it never jump the screen
 * to "Next focus set". That view is only for after a finished set. With nothing open, the day is won at the
 * daily target and back to the plan below it.
 */
export function deriveView(
  data: TodayData | undefined,
  goals: GoalRow[] | undefined,
  today: string,
  planning: boolean,
): TodayView {
  if (!data || !goals) return { kind: "loading" };
  if (!data.hasAnyTask && goals.length === 0) return { kind: "firstRun" };
  const open = openToday(data);
  if (data.focus.some((t) => !t.done)) return { kind: "focus", data, goals };
  if (planning) return { kind: "plan", data, goals, today: open };
  const fresh = data.focusSet === 0 && data.doneToday.length === 0;
  if (fresh && data.returnedCount > 0 && data.settings.newDayBannerSeen !== today) {
    return { kind: "newDay", data, goals, planned: open };
  }
  if (open.length === 0) {
    return data.doneToday.length < data.settings.dailyTarget ? { kind: "plan", data, goals, today: open } : { kind: "dayWon", data, goals };
  }
  if (data.focusSet === 0) return { kind: "plan", data, goals, today: open };
  return { kind: "nextSet", data, open };
}

export function checklistLabel(task: Task) {
  const done = task.checklist.filter((s) => s.done).length;
  return `Checklist ${done}/${task.checklist.length}`;
}

/** "High · 9:00 AM · Checklist 0/5 · from calendar". Lists grouped by priority leave the priority out. */
export function pickMeta(task: Task, today: string, { priority = true } = {}) {
  const parts: string[] = priority ? [PRIORITY_LABEL[task.priority]] : [];
  if (task.startTime) parts.push(clockLabel(task.startTime));
  if (task.checklist.length > 0) parts.push(checklistLabel(task));
  if (task.plannedDay === today && task.todayDay !== today) parts.push("from calendar");
  return parts.join(" · ");
}

export function clockOf(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Minutes since midnight when the time slot ends. A slot with no length ends when it starts. */
export function slotEnd(task: Task) {
  return task.startTime ? minutesOf(task.startTime) + (task.lengthMin ?? 0) : Infinity;
}

export function isNow(task: Task, minutes: number) {
  return !!task.startTime && minutesOf(task.startTime) <= minutes && minutes < slotEnd(task);
}

export function slotMeta(task: Task, now: boolean) {
  const length = lengthLabel(task.lengthMin);
  const parts = task.kind === "meeting" ? ["Meeting", length] : [length, now ? "now" : ""];
  return parts.filter(Boolean).join(" · ");
}

/** Picked for Today only after its time slot had ended, so there is nothing to ask about. */
function pickedLate(task: Task, today: string) {
  if (task.pickedAt === undefined) return false;
  const picked = new Date(task.pickedAt);
  return toDay(picked) === today && picked.getHours() * 60 + picked.getMinutes() >= slotEnd(task);
}

/** The first time slot that has passed without a check, for the "Did you do this?" sheet. */
export function slotToCheck(data: TodayData, today: string, minutes: number, dismissed: ReadonlySet<string>) {
  return data.schedule.find((t) => !t.done && !dismissed.has(t._id) && slotEnd(t) <= minutes && !pickedLate(t, today));
}
