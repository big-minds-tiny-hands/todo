/**
 * Where an open task sits on a given day. Convex and the client both import this file, so it stays free of
 * framework imports. Days are "YYYY-MM-DD", so string order is date order.
 */

export type Place = { kind: "today" } | { kind: "planned"; day: string } | { kind: "pool" };

type Placed = { todayDay?: string; focusDay?: string; plannedDay?: string };

/** A planned day in the past counts as the pool: a missed day returns quietly to All tasks. */
export function placeOf(task: Placed, today: string): Place {
  if (task.todayDay === today || task.focusDay === today || task.plannedDay === today) return { kind: "today" };
  if (task.plannedDay !== undefined && task.plannedDay > today) return { kind: "planned", day: task.plannedDay };
  return { kind: "pool" };
}

/** The day a task sits on, or undefined for the pool. */
export function dayOf(task: Placed, today: string): string | undefined {
  const place = placeOf(task, today);
  if (place.kind === "today") return today;
  if (place.kind === "planned") return place.day;
  return undefined;
}

export const PRIORITIES = ["high", "normal", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

const PRIORITY_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

type Ranked = { priority: Priority; order: number };

export function byPriority(a: Ranked, b: Ranked) {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order;
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Planned tasks: by day, then start time (untimed last), then priority. */
export function byPlannedDay(a: Ranked & Placed & { startTime?: string }, b: Ranked & Placed & { startTime?: string }) {
  return (
    compare(a.plannedDay ?? "", b.plannedDay ?? "") ||
    compare(a.startTime ?? "99:99", b.startTime ?? "99:99") ||
    byPriority(a, b)
  );
}
