import type { Doc } from "@/convex/_generated/dataModel";
import { addDays, clockLabel, fromDay, lengthLabel, shortDate, toDay, weekday } from "@/lib/day";

export type Task = Doc<"tasks">;

export function dayLabel(day: string, today: string) {
  if (day === today) return "Today";
  if (day === addDays(today, 1)) return "Tomorrow";
  return shortDate(day);
}

/** "3:30 PM · 30 min", or "" with no start time. */
export function slotLabel(task: Pick<Task, "startTime" | "lengthMin">) {
  if (!task.startTime) return "";
  return [clockLabel(task.startTime), lengthLabel(task.lengthMin)].filter(Boolean).join(" · ");
}

/** The next Monday after today, never today itself. */
export function nextMonday(today: string) {
  return addDays(today, (8 - weekday(today)) % 7 || 7);
}

export function daysBetween(from: string, to: string) {
  return Math.round((fromDay(to).getTime() - fromDay(from).getTime()) / 86_400_000);
}

export function creationDay(task: Task) {
  return toDay(new Date(task._creationTime));
}
