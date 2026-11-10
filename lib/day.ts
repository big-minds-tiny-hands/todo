/** Local calendar dates as "YYYY-MM-DD". The device clock decides what "today" is. */

export function toDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const date = fromDay(day);
  date.setDate(date.getDate() + n);
  return toDay(date);
}

export function weekday(day: string): number {
  return fromDay(day).getDay();
}

/** The last `n` days, oldest first, ending with `day`. */
export function lastDays(day: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(day, i - (n - 1)));
}

/** Sunday to Saturday of the week holding `day`. */
export function weekOf(day: string): string[] {
  const start = addDays(day, -weekday(day));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function longDate(day: string): string {
  return fromDay(day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function shortDate(day: string): string {
  return fromDay(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "13:00" → "1:00 PM" */
export function clockLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function lengthLabel(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hr`;
}

/** Minutes since midnight for "HH:MM". */
export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
