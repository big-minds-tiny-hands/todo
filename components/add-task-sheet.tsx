"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon, CloseIcon, SpinnerIcon, SunIcon } from "@/components/icons";
import { DayPicker } from "@/components/tasks/day-picker";
import { TimeField } from "@/components/time-field";
import { PrioritySeg, Sheet } from "@/components/ui-todo";
import { showToast } from "@/lib/reward";

type When = "later" | "today" | "day";

type AddTaskProps = {
  today: string;
  defaultWhen?: When;
  defaultDay?: string;
};

/** Quick add: type a title, press Enter. Priority defaults to Normal. */
export function AddTaskSheet({
  open,
  onOpenChange,
  ...form
}: AddTaskProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="New task">
      {open && <AddTaskForm {...form} />}
    </Sheet>
  );
}

function AddTaskForm({ today, defaultWhen = "later", defaultDay }: AddTaskProps) {
  const create = useMutation(api.tasks.create);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "normal" | "low">("normal");
  const [when, setWhen] = useState<When>(defaultWhen);
  const [day, setDay] = useState(defaultDay ?? today);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [missingTitle, setMissingTitle] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    if (busy) return;
    if (!title.trim()) {
      setMissingTitle(true);
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await create({
        title,
        priority,
        todayDay: when === "today" ? today : undefined,
        plannedDay: when === "day" ? day : undefined,
        startTime: time || undefined,
      });
      showToast(when === "today" ? "Added to Today" : when === "day" ? "Added to the calendar" : "Added to All tasks", {
        icon: <CheckIcon size={18} style={{ strokeWidth: 2.6 }} />,
        duration: 2000,
      });
      setTitle("");
      setTime("");
      setPriority("normal");
      titleRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="field">
        <label htmlFor="new-task" className="sr-only">
          Task
        </label>
        <input
          ref={titleRef}
          className={`input${missingTitle ? " err" : ""}`}
          id="new-task"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setMissingTitle(false);
          }}
          placeholder="Call back the Lee family…"
          aria-invalid={missingTitle}
          aria-describedby={missingTitle ? "new-task-err" : undefined}
          autoComplete="off"
          autoFocus
          enterKeyHint="done"
          style={{ height: 58, fontSize: 18 }}
        />
        {missingTitle && (
          <p className="err-text" id="new-task-err" role="alert">
            <AlertIcon size={18} />
            Name the task first.
          </p>
        )}
      </div>
      <div className="field">
        <span className="fl">Priority</span>
        <PrioritySeg value={priority} onChange={setPriority} />
      </div>
      <div className="field">
        <span className="fl">When</span>
        <div className="chips">
          <button type="button" className={`chip${when === "later" ? " on" : ""}`} aria-pressed={when === "later"} onClick={() => setWhen("later")}>
            All tasks
          </button>
          <button type="button" className={`chip${when === "today" ? " on" : ""}`} aria-pressed={when === "today"} onClick={() => setWhen("today")}>
            <SunIcon />
            Today
          </button>
          <button type="button" className={`chip${when === "day" ? " on" : ""}`} aria-pressed={when === "day"} onClick={() => setWhen("day")}>
            <CalendarIcon />
            Pick a day
          </button>
        </div>
        {when === "day" && <DayPicker value={day} onChange={setDay} today={today} />}
      </div>
      <div className="field">
        <span className="fl" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ClockIcon size={16} />
          Time (optional)
        </span>
        {time ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TimeField value={time} onChange={setTime} label="Start time" />
            <button type="button" className="iconbtn ghost" aria-label="Remove time" onClick={() => setTime("")}>
              <CloseIcon />
            </button>
          </div>
        ) : (
          <button type="button" className="chip" style={{ alignSelf: "flex-start" }} onClick={() => setTime("09:00")}>
            Add a time
          </button>
        )}
      </div>
      <button className="btn pri full" type="submit" disabled={busy} style={{ marginTop: 4 }}>
        {busy && <SpinnerIcon />}
        Add task
      </button>
    </form>
  );
}
