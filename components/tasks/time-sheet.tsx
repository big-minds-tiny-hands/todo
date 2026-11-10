"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { TimeField } from "@/components/time-field";
import { api } from "@/convex/_generated/api";
import { CheckIcon, PeopleIcon } from "@/components/icons";
import { Sheet } from "@/components/ui-todo";
import { clockLabel } from "@/lib/day";
import type { Task } from "@/components/tasks/when";

const STARTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
const LENGTHS = [
  { label: "None", minutes: null },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
];
const KINDS = [
  { kind: "task", label: "Task", Icon: CheckIcon },
  { kind: "meeting", label: "Meeting", Icon: PeopleIcon },
] as const;

export function TimeSheet({ task, open, onOpenChange }: { task: Task; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Time slot">
      {open && <TimeForm task={task} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}

function TimeForm({ task, onDone }: { task: Task; onDone: () => void }) {
  const update = useMutation(api.tasks.update);
  const [start, setStart] = useState<string | null>(task.startTime ?? null);
  const [other, setOther] = useState(!!task.startTime && !STARTS.includes(task.startTime));
  const [length, setLength] = useState<number | null>(task.lengthMin ?? null);
  const [kind, setKind] = useState(task.kind);
  const [busy, setBusy] = useState(false);

  async function save(fields: Omit<Parameters<typeof update>[0], "id">) {
    if (busy) return;
    setBusy(true);
    try {
      await update({ id: task._id, ...fields });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (start) void save({ startTime: start, lengthMin: length, kind });
      }}
      style={{ display: "flex", flexDirection: "column", gap: 18 }}
    >
      <div className="field">
        <span className="fl">Starts at</span>
        <div className="chips" role="radiogroup" aria-label="Start time">
          {STARTS.map((time) => {
            const on = !other && start === time;
            return (
              <button
                key={time}
                type="button"
                className={`chip${on ? " on" : ""}`}
                role="radio"
                aria-checked={on}
                style={{ minWidth: 84, justifyContent: "center" }}
                onClick={() => {
                  setStart(time);
                  setOther(false);
                }}
              >
                {clockLabel(time)}
              </button>
            );
          })}
          <button
            type="button"
            className={`chip${other ? " on" : ""}`}
            role="radio"
            aria-checked={other}
            style={other ? undefined : { color: "var(--tx2)" }}
            onClick={() => {
              setOther(true);
              setStart((current) => current ?? "09:00");
            }}
          >
            Other
          </button>
        </div>
        {other && <TimeField value={start ?? "09:00"} onChange={setStart} label="Start time" />}
      </div>

      <div className="field">
        <span className="fl">Length</span>
        <div className="seg" role="radiogroup" aria-label="Length">
          {LENGTHS.map((l) => (
            <button
              key={l.label}
              type="button"
              role="radio"
              aria-checked={length === l.minutes}
              className={length === l.minutes ? "on" : undefined}
              onClick={() => setLength(l.minutes)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="fl">Type</span>
        <div className="seg" role="radiogroup" aria-label="Type">
          {KINDS.map(({ kind: k, label, Icon }) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? "on" : undefined} onClick={() => setKind(k)}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          className="btn sec"
          style={{ flex: 1 }}
          disabled={busy || !task.startTime}
          onClick={() => void save({ startTime: null, lengthMin: null })}
        >
          Remove time
        </button>
        <button type="submit" className="btn pri" style={{ flex: 2 }} disabled={busy || !start}>
          {start ? `Set ${clockLabel(start)}` : "Set time"}
        </button>
      </div>
    </form>
  );
}
