"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CheckIcon } from "@/components/icons";
import { PRIORITY_LABEL, PriorityDot, Sheet } from "@/components/ui-todo";
import { shortDate } from "@/lib/day";
import { showToast } from "@/lib/reward";
import { dayLabel } from "@/components/tasks/when";

type AssignProps = { day: string; today: string };

/** Pick tasks from All tasks and put them on one calendar day. */
export function AssignSheet({ open, onOpenChange, ...props }: AssignProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} eyebrow="From All tasks" title={`Add to ${shortDate(props.day)}`}>
      {open && <AssignForm {...props} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

function AssignForm({ day, today, onDone }: AssignProps & { onDone: () => void }) {
  const all = useQuery(api.tasks.all, { today });
  const update = useMutation(api.tasks.update);
  const [picked, setPicked] = useState<ReadonlySet<Id<"tasks">>>(new Set());
  const [busy, setBusy] = useState(false);
  const tasks = all && [...all.pool, ...all.planned].filter((t) => t.plannedDay !== day);

  function toggle(id: Id<"tasks">) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    if (picked.size === 0 || busy) return;
    setBusy(true);
    try {
      await Promise.all([...picked].map((id) => update({ id, plannedDay: day })));
      showToast(`Added to ${dayLabel(day, today)}`, { icon: <CheckIcon size={18} style={{ strokeWidth: 2.6 }} />, duration: 2000 });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card" style={{ background: "var(--s2)" }}>
        {tasks === undefined ? (
          <div style={{ height: 168 }} aria-busy="true" />
        ) : tasks.length === 0 ? (
          <p className="muted" style={{ margin: 0, padding: "20px 16px", fontSize: 15 }}>
            Nothing waiting in All tasks.
          </p>
        ) : (
          tasks.map((t) => {
            const on = picked.has(t._id);
            return (
              <label key={t._id} className="task" style={{ cursor: "pointer" }}>
                <span className={`check${on ? " on" : ""}`} aria-hidden="true">
                  <span>
                    <CheckIcon />
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(t._id)}
                  aria-label={t.title}
                  style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
                />
                <div className="t">
                  <div className="tt">{t.title}</div>
                  <div className="m">
                    <PriorityDot priority={t.priority} />
                    {PRIORITY_LABEL[t.priority]}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
      <button type="submit" className="btn pri full" disabled={picked.size === 0 || busy}>
        {picked.size === 0 ? "Add tasks" : `Add ${picked.size} ${picked.size === 1 ? "task" : "tasks"}`}
      </button>
    </form>
  );
}
