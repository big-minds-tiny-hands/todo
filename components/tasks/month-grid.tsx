"use client";

import type { CSSProperties } from "react";
import { addDays, fromDay, toDay, weekday } from "@/lib/day";

/** One square of the month grid. `past` and `!inMonth` both render dimmed, as in the design. */
export type MonthCell = {
  day: string;
  n: number;
  inMonth: boolean;
  past: boolean;
  isToday: boolean;
  hasTasks: boolean;
  selected: boolean;
};

/** A month is named by its first day, "YYYY-MM-01". */
export function monthOf(day: string) {
  return `${day.slice(0, 7)}-01`;
}

export function addMonths(month: string, n: number) {
  const date = fromDay(month);
  return toDay(new Date(date.getFullYear(), date.getMonth() + n, 1));
}

export function monthLabel(month: string) {
  return fromDay(month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Every day the grid shows: whole weeks, Sunday first, 5 or 6 rows. */
export function monthDays(month: string): string[] {
  const first = fromDay(month);
  const lead = weekday(month);
  const length = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const start = addDays(month, -lead);
  return Array.from({ length: Math.ceil((lead + length) / 7) * 7 }, (_, i) => addDays(start, i));
}

export function monthRange(month: string) {
  const days = monthDays(month);
  return { from: days[0], to: days[days.length - 1] };
}

export function monthCells({
  month,
  today,
  selected,
  busyDays,
}: {
  month: string;
  today: string;
  selected: string | null;
  busyDays: ReadonlySet<string>;
}): MonthCell[] {
  const prefix = month.slice(0, 7);
  return monthDays(month).map((day) => ({
    day,
    n: Number(day.slice(8)),
    inMonth: day.startsWith(prefix),
    past: day < today,
    isToday: day === today,
    hasTasks: busyDays.has(day),
    selected: day === selected,
  }));
}

const DOWS = ["S", "M", "T", "W", "T", "F", "S"];

function cellLabel(cell: MonthCell) {
  const name = fromDay(cell.day).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return cell.hasTasks ? `${name}, has tasks` : name;
}

export function MonthGrid({
  month,
  cells,
  onSelect,
  disablePast,
  dayStyle,
}: {
  month: string;
  cells: MonthCell[];
  onSelect: (day: string) => void;
  disablePast?: boolean;
  dayStyle?: CSSProperties;
}) {
  return (
    <div className="cal" role="grid" aria-label={monthLabel(month)}>
      {DOWS.map((d, i) => (
        <span key={i} className="dow" aria-hidden="true">
          {d}
        </span>
      ))}
      {cells.map((cell) => {
        const className = [
          "day",
          (!cell.inMonth || cell.past) && "out",
          cell.isToday && "today",
          cell.hasTasks && "has",
          cell.selected && "sel",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={cell.day}
            type="button"
            className={className}
            aria-label={cellLabel(cell)}
            aria-pressed={cell.selected}
            aria-current={cell.isToday ? "date" : undefined}
            disabled={disablePast && cell.past}
            style={dayStyle}
            onClick={() => onSelect(cell.day)}
          >
            <span>{cell.n}</span>
            <i />
          </button>
        );
      })}
    </div>
  );
}
