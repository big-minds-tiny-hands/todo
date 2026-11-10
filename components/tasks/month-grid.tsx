"use client";

import { animate, motion, useDragControls, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { useLayoutEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
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

const SWIPE_PX = 50;
const SWIPE_VELOCITY = 400;

/**
 * Swipe sideways to change month: the grid pulls against the finger, and on release past the threshold (or on a
 * flick) the next month slides in from the side the finger moved away from. Touch and pen only.
 * Inside a sheet, data-base-ui-swipe-ignore="x" keeps downward drags for closing the sheet.
 */
function useMonthSwipe(month: string, onMonthSwipe?: (delta: 1 | -1) => void) {
  const x = useMotionValue(0);
  const opacity = useMotionValue(1);
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const dragged = useRef(false);
  const entering = useRef<1 | -1 | null>(null);
  // A month that arrived by swipe starts just off to the side it comes from, before paint, then settles in.
  useLayoutEffect(() => {
    const from = entering.current;
    entering.current = null;
    if (from === null) return;
    x.set(reduce ? 0 : from * 48);
    opacity.set(reduce ? 1 : 0);
    animate(x, 0, { type: "spring", bounce: 0, duration: 0.35 });
    animate(opacity, 1, { duration: 0.2 });
  }, [month, x, opacity, reduce]);

  function onDragEnd(_: PointerEvent, info: PanInfo) {
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const delta: 1 | -1 | null = dx < -SWIPE_PX || vx < -SWIPE_VELOCITY ? 1 : dx > SWIPE_PX || vx > SWIPE_VELOCITY ? -1 : null;
    if (delta === null || !onMonthSwipe) {
      animate(x, 0, { type: "spring", velocity: vx, bounce: reduce ? 0 : 0.2, duration: 0.4 });
      return;
    }
    entering.current = delta;
    onMonthSwipe(delta);
  }

  return {
    enabled: Boolean(onMonthSwipe),
    props: {
      style: { x, opacity, touchAction: "pan-y" as const },
      drag: "x" as const,
      dragListener: false,
      dragControls: controls,
      dragMomentum: false,
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.35,
      onPointerDown: (event: ReactPointerEvent) => {
        if (event.pointerType === "mouse") return;
        dragged.current = false;
        controls.start(event);
      },
      onDragStart: () => {
        dragged.current = true;
      },
      onDragEnd,
      onClickCapture: (event: ReactMouseEvent) => {
        if (!dragged.current) return;
        dragged.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}

export function MonthGrid({
  month,
  cells,
  onSelect,
  onMonthSwipe,
  disablePast,
  dayStyle,
}: {
  month: string;
  cells: MonthCell[];
  onSelect: (day: string) => void;
  onMonthSwipe?: (delta: 1 | -1) => void;
  disablePast?: boolean;
  dayStyle?: CSSProperties;
}) {
  const swipe = useMonthSwipe(month, onMonthSwipe);
  return (
    <motion.div className="cal" role="grid" aria-label={monthLabel(month)} data-base-ui-swipe-ignore="x" {...(swipe.enabled ? swipe.props : {})}>
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
    </motion.div>
  );
}
