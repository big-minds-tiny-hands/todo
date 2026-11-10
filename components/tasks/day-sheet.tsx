"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Sheet } from "@/components/ui-todo";
import { addDays, shortDate } from "@/lib/day";
import { DayPicker } from "@/components/tasks/day-picker";
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
  const [busy, setBusy] = useState(false);

  const quick = [
    { label: "Today", day: today },
    { label: "Tomorrow", day: addDays(today, 1) },
    { label: "Next Monday", day: nextMonday(today) },
    { label: "No day", day: null },
  ];

  const pick = setSelected;

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

      <DayPicker value={selected} onChange={pick} today={today} />

      <button type="submit" className="btn pri full" disabled={busy || (selected === null && current === null)}>
        {selected ? `Put on ${shortDate(selected)}` : current ? "Remove day" : "Pick a day"}
      </button>
    </form>
  );
}
