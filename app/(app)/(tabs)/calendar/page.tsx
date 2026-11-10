"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, PlusIcon } from "@/components/icons";
import { AssignSheet } from "@/components/tasks/assign-sheet";
import { addMonths, MonthGrid, monthCells, monthOf, monthRange } from "@/components/tasks/month-grid";
import type { Task } from "@/components/tasks/when";
import { PRIORITY_LABEL } from "@/components/ui-todo";
import { api } from "@/convex/_generated/api";
import { useToday } from "@/hooks/use-today";
import { clockLabel, fromDay, lengthLabel, shortDate } from "@/lib/day";

const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const;

/** Month shown and day picked. Null until the user moves, so both follow today across midnight. */
type View = { month: string; selected: string };

/** The day a task sits on in the calendar: the day it was put on, else the day it was picked for Today. */
function calendarDay(task: { plannedDay?: string; todayDay?: string }) {
  return task.plannedDay ?? task.todayDay ?? "";
}

export default function CalendarPage() {
  const { today } = useToday();
  const [view, setView] = useState<View | null>(null);
  const [assigning, setAssigning] = useState(false);
  const month = view?.month ?? monthOf(today);
  const selected = view?.selected ?? today;
  const planned = useQuery(api.tasks.inRange, monthRange(month));
  const cells = monthCells({ month, today, selected, busyDays: new Set(planned?.map(calendarDay)) });
  const dayTasks = planned?.filter((t) => calendarDay(t) === selected);
  const timed = dayTasks?.filter((t) => t.startTime) ?? [];
  const untimed = (dayTasks?.filter((t) => !t.startTime) ?? []).sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order,
  );
  const canAdd = selected >= today;
  const date = fromDay(month);

  function goMonth(n: number) {
    const next = addMonths(month, n);
    setView({ month: next, selected: next === monthOf(today) ? today : next });
  }

  return (
    <>
      <header className="head">
        <div>
          <p className="eyebrow">{date.getFullYear()}</p>
          <h1 className="h1">{date.toLocaleDateString("en-US", { month: "long" })}</h1>
        </div>
        <div className="head-actions">
          <button type="button" className="iconbtn" aria-label="Previous month" onClick={() => goMonth(-1)}>
            <ChevronLeft />
          </button>
          <button type="button" className="iconbtn" aria-label="Next month" onClick={() => goMonth(1)}>
            <ChevronRight />
          </button>
        </div>
      </header>

      <main className="scroll cols" style={{ gridTemplateAreas: "'cal day'" }}>
        <section className="card" style={{ gridArea: "cal", padding: "14px 10px 10px" }}>
          <MonthGrid month={month} cells={cells} onSelect={(day) => setView({ month: monthOf(day), selected: day })} />
        </section>

        <section style={{ gridArea: "day" }} aria-live="polite">
          <h2 className="label">
            <span>{shortDate(selected)}</span>
            {dayTasks && dayTasks.length > 0 && <span className="num">{dayTasks.length}</span>}
          </h2>
          {dayTasks === undefined ? (
            <div className="card" style={{ height: 112 }} aria-busy="true" />
          ) : dayTasks.length === 0 ? (
            <div className="card" style={{ padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
              <CalendarIcon size={32} style={{ color: "var(--tx3)" }} />
              <p style={{ margin: 0, fontSize: 16 }}>{canAdd ? "Nothing on this day yet" : "Nothing on this day"}</p>
              {canAdd && (
                <button type="button" className="btn pri sm" style={{ marginTop: 4 }} onClick={() => setAssigning(true)}>
                  <PlusIcon size={18} style={{ strokeWidth: 2.4 }} />
                  Add from All tasks
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="card">
                {timed.map((t) => (
                  <TimedRow key={t._id} task={t} />
                ))}
                {untimed.map((t) => (
                  <Link key={t._id} className={`task${t.done ? " done" : ""}`} href={`/task/${t._id}`} style={{ textDecoration: "none" }}>
                    <span className={`pri ${t.priority}`} aria-hidden="true" style={{ margin: "0 31px 0 4px" }} />
                    <div className="t">
                      <div className="tt">{t.title}</div>
                      <div className="m">{PRIORITY_LABEL[t.priority]}</div>
                    </div>
                  </Link>
                ))}
              </div>
              {canAdd && (
                <button type="button" className="btn sec full" style={{ marginTop: 12 }} onClick={() => setAssigning(true)}>
                  <PlusIcon />
                  Add from All tasks
                </button>
              )}
            </>
          )}
        </section>
      </main>

      <AssignSheet day={selected} today={today} open={assigning} onOpenChange={setAssigning} />
    </>
  );
}

function TimedRow({ task }: { task: Task }) {
  const meta = [task.kind === "meeting" ? "Meeting" : PRIORITY_LABEL[task.priority], lengthLabel(task.lengthMin)].filter(Boolean).join(" · ");
  return (
    <Link className={`task slot${task.done ? " done" : ""}`} href={`/task/${task._id}`} style={{ textDecoration: "none" }}>
      <span className="time">{clockLabel(task.startTime!)}</span>
      <div className="t">
        <div className="tt">{task.title}</div>
        <div className="m">{meta}</div>
      </div>
    </Link>
  );
}
