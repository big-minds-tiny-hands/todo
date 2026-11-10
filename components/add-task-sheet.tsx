"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CalendarIcon, CheckIcon, ClockIcon, SunIcon } from "@/components/icons";
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
  const titleRef = useRef<HTMLInputElement>(null);

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    if (!title.trim() || busy) return;
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
          className="input"
          id="new-task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          autoComplete="off"
          autoFocus
          enterKeyHint="done"
          style={{ height: 58, fontSize: 18 }}
        />
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
        {when === "day" && <input className="input" type="date" aria-label="Day" value={day} min={today} onChange={(e) => setDay(e.target.value)} />}
      </div>
      <div className="field">
        <label htmlFor="new-time" className="fl" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ClockIcon size={16} />
          Time (optional)
        </label>
        <input className="input" id="new-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <button className="btn pri full" type="submit" disabled={!title.trim() || busy} style={{ marginTop: 4 }}>
        Add task
      </button>
    </form>
  );
}
