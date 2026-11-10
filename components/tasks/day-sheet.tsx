"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Sheet } from "@/components/ui-todo";
import { addDays, shortDate } from "@/lib/day";
import { addMonths, MonthGrid, monthCells, monthLabel, monthOf, monthRange } from "@/components/tasks/month-grid";
import { nextMonday, taskDay, type Task } from "@/components/tasks/when";

type DayProps = { task: Task; today: string };

export function DaySheet({ open, onOpenChange, ...props }: DayProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Put on a day">
      {open && <DayForm {...props} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

function DayForm({ task, today, onDone }: DayProps & { onDone: () => void }) {
  const update = useMutation(api.tasks.update);
  const removeFromToday = useMutation(api.tasks.removeFromToday);
  const current = taskDay(task, today) ?? null;
  const [selected, setSelected] = useState<string | null>(current);
  const [month, setMonth] = useState(monthOf(current ?? today));
  const [busy, setBusy] = useState(false);
  const planned = useQuery(api.tasks.inRange, monthRange(month));
  const cells = monthCells({ month, today, selected, busyDays: new Set(planned?.map((t) => t.plannedDay ?? "")) });

  const quick = [
    { label: "Today", day: today },
    { label: "Tomorrow", day: addDays(today, 1) },
    { label: "Next Monday", day: nextMonday(today) },
    { label: "No day", day: null },
  ];

  function pick(day: string | null) {
    setSelected(day);
    if (day) setMonth(monthOf(day));
  }

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    if (busy) return;
    if (selected === current) return onDone();
    setBusy(true);
    try {
      const pickedForToday = task.todayDay === today || task.focusDay === today;
      if (pickedForToday && selected !== today) await removeFromToday({ id: task._id, today });
      await update({ id: task._id, plannedDay: selected });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="chips">
        {quick.map((q) => {
          const on = selected === q.day;
          return (
            <button key={q.label} type="button" className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => pick(q.day)}>
              {q.label}
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="h3">{monthLabel(month)}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button type="button" className="iconbtn ghost" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <ChevronLeft />
            </button>
            <button type="button" className="iconbtn ghost" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight />
            </button>
          </div>
        </div>
        <MonthGrid month={month} cells={cells} onSelect={pick} disablePast dayStyle={{ height: 42 }} />
      </div>

      <button type="submit" className="btn pri full" disabled={busy || (selected === null && current === null)}>
        {selected ? `Put on ${shortDate(selected)}` : current ? "Remove day" : "Pick a day"}
      </button>
    </form>
  );
}
