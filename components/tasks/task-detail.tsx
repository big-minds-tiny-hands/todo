"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CalendarIcon, CheckIcon, ChevronLeft, ClockIcon, MoreIcon, PeopleIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { DaySheet } from "@/components/tasks/day-sheet";
import { TaskActionsMenu, useDeleteTask } from "@/components/tasks/task-actions-menu";
import { TimeSheet } from "@/components/tasks/time-sheet";
import { dayLabel, slotLabel, type Task } from "@/components/tasks/when";
import { dayOf } from "@/lib/placement";
import { Check, PrioritySeg } from "@/components/ui-todo";
import { useToday } from "@/hooks/use-today";
import { clockLabel, minutesOf } from "@/lib/day";

type Panel = "menu" | "day" | "time" | null;

export function TaskDetail({ id }: { id: Id<"tasks"> }) {
  const task = useQuery(api.tasks.get, { id });
  const { today, minutes } = useToday();
  if (task === undefined) return <DetailLoading />;
  if (task === null) return <NotFound />;
  return <TaskView key={task._id} task={task} today={today} minutes={minutes} />;
}

/** A meeting on Today whose slot has ended without being checked off. */
function isMissed(task: Task, today: string, minutes: number) {
  if (task.kind !== "meeting" || task.done || !task.startTime || dayOf(task, today) !== today) return false;
  return minutes >= minutesOf(task.startTime) + (task.lengthMin ?? 0);
}

function TaskView({ task, today, minutes }: { task: Task; today: string; minutes: number }) {
  const router = useRouter();
  const update = useMutation(api.tasks.update);
  const setDone = useMutation(api.tasks.setDone);
  const markMissed = useMutation(api.tasks.markMissed);
  const deleteTask = useDeleteTask();
  const [panel, setPanel] = useState<Panel>(null);
  const day = dayOf(task, today);
  const back = day === today ? { href: "/", label: "Today" } : { href: "/tasks", label: "All tasks" };
  const missed = isMissed(task, today, minutes);
  const slot = slotLabel(task);
  const close = (open: boolean) => {
    if (!open) setPanel(null);
  };

  const whenCard = (
    <div className="card">
      <button type="button" className="row" onClick={() => setPanel("day")}>
        <CalendarIcon style={{ color: "var(--tx2)" }} />
        <span className="t">Day</span>
        <span className="v" style={day ? { color: "var(--tx)" } : undefined}>
          {day ? dayLabel(day, today) : "Add day"}
        </span>
      </button>
      <button type="button" className="row" onClick={() => setPanel("time")}>
        <ClockIcon style={{ color: "var(--tx2)" }} />
        <span className="t">Time</span>
        <span className="v" style={slot ? { color: "var(--tx)" } : undefined}>
          {slot || "Add time"}
        </span>
      </button>
    </div>
  );

  return (
    <>
      <div className="bar-top">
        <Link className="link" href={back.href} style={{ padding: "0 8px" }}>
          <ChevronLeft />
          {back.label}
        </Link>
        <TaskActionsMenu
          task={task}
          today={today}
          open={panel === "menu"}
          onOpenChange={(open) => setPanel(open ? "menu" : null)}
          trigger={
            <button type="button" className="iconbtn ghost" aria-label="More actions">
              <MoreIcon />
            </button>
          }
          onPickDay={() => setPanel("day")}
          onPickTime={() => setPanel("time")}
          onDeleted={() => router.push(back.href)}
        />
      </div>

      {missed ? (
        <main className="scroll" style={{ gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 4px 0" }}>
            <span className="pill" style={{ alignSelf: "flex-start" }}>
              <PeopleIcon />
              Meeting
            </span>
            <h1 className="h2" style={{ fontSize: 26 }}>
              {task.title}
            </h1>
          </div>

          <section className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14, borderColor: "var(--amber-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ClockIcon style={{ color: "var(--amber)" }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>{clockLabel(task.startTime!)} has passed</span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 15 }}>
              Did it happen?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn pri"
                style={{ flex: 1 }}
                onClick={async () => {
                  await setDone({ id: task._id, done: true, today });
                  router.push("/");
                }}
              >
                <CheckIcon style={{ strokeWidth: 2.6 }} />
                It happened
              </button>
              <button
                type="button"
                className="btn sec"
                style={{ flex: 1 }}
                onClick={async () => {
                  await markMissed({ id: task._id, today });
                  router.push("/");
                }}
              >
                Missed it
              </button>
            </div>
          </section>

          {whenCard}
          <NotesField task={task} />
        </main>
      ) : (
        <main className="scroll" style={{ gap: 22 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "4px 4px 0" }}>
            <span style={{ display: "flex", margin: "-4px -4px 0 -6px" }}>
              <Check
                size="lg"
                checked={task.done}
                label={`Complete ${task.title}`}
                onChange={(done) => void setDone({ id: task._id, done, today })}
              />
            </span>
            <h1 className="sr-only">{task.title}</h1>
            <TitleField task={task} onSave={(title) => void update({ id: task._id, title })} />
          </div>

          <div className="field">
            <span className="fl">Priority</span>
            <PrioritySeg value={task.priority} onChange={(priority) => void update({ id: task._id, priority })} />
          </div>

          {whenCard}
          <Checklist task={task} />
          <NotesField task={task} />

          <button
            type="button"
            className="btn danger"
            style={{ alignSelf: "flex-start", padding: "0 4px" }}
            onClick={async () => {
              await deleteTask(task);
              router.push(back.href);
            }}
          >
            <TrashIcon />
            Delete task
          </button>
        </main>
      )}

      <DaySheet task={task} today={today} open={panel === "day"} onOpenChange={close} />
      <TimeSheet task={task} open={panel === "time"} onOpenChange={close} />
    </>
  );
}

/** Edits in place and saves on blur. Enter saves; an empty title snaps back. */
function TitleField({ task, onSave }: { task: Task; onSave: (title: string) => void }) {
  return (
    <textarea
      key={task.title}
      className="h2"
      aria-label="Title"
      rows={1}
      defaultValue={task.title}
      enterKeyHint="done"
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => {
        const title = event.currentTarget.value.trim();
        if (!title) event.currentTarget.value = task.title;
        else if (title !== task.title) onSave(title);
      }}
      style={{
        flex: 1,
        minWidth: 0,
        fontSize: 26,
        padding: "2px 0 0",
        background: "none",
        border: 0,
        color: "var(--tx)",
        resize: "none",
        fieldSizing: "content",
      }}
    />
  );
}

function Checklist({ task }: { task: Task }) {
  const addStep = useMutation(api.tasks.addStep);
  const setStep = useMutation(api.tasks.setStep);
  const done = task.checklist.filter((s) => s.done).length;

  return (
    <section>
      <h2 className="label">
        <span>Checklist</span>
        {task.checklist.length > 0 && (
          <b className="num">
            {done}/{task.checklist.length}
          </b>
        )}
      </h2>
      <div className="card">
        {task.checklist.map((step) => (
          <div key={step.id} className={`task${step.done ? " done" : ""}`} style={{ minHeight: 50 }}>
            <Check
              size="sm"
              checked={step.done}
              label={`Step: ${step.title}`}
              onChange={(next) => void setStep({ id: task._id, stepId: step.id, done: next })}
            />
            <div className="t">
              <div className="tt" style={{ fontSize: 15 }}>
                {step.title}
              </div>
            </div>
          </div>
        ))}
        <div className="task" style={{ minHeight: 50 }}>
          <PlusIcon style={{ color: "var(--lime-tx)", margin: "0 4px 0 2px" }} />
          <label htmlFor="step" className="sr-only">
            Add a step
          </label>
          <input
            id="step"
            placeholder="Add a step"
            autoComplete="off"
            enterKeyHint="done"
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const title = event.currentTarget.value.trim();
              if (!title) return;
              event.currentTarget.value = "";
              void addStep({ id: task._id, title });
            }}
            style={{ flex: 1, background: "none", border: 0, outline: "none", fontSize: 15, height: 40, color: "var(--tx)" }}
          />
        </div>
      </div>
    </section>
  );
}

/** Saves a moment after typing stops, on blur, and when the page closes. */
function NotesField({ task }: { task: Task }) {
  const update = useMutation(api.tasks.update);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = task._id;

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    if (pending.current === null) return;
    const notes = pending.current;
    pending.current = null;
    void update({ id, notes });
  }, [id, update]);

  useEffect(() => flush, [flush]);

  return (
    <div className="field">
      <label htmlFor="notes">Notes</label>
      <textarea
        className="input"
        id="notes"
        rows={2}
        placeholder="Add notes"
        defaultValue={task.notes ?? ""}
        onChange={(event) => {
          pending.current = event.target.value;
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(flush, 700);
        }}
        onBlur={flush}
        style={{ height: "auto", minHeight: 54, padding: "14px 16px", lineHeight: 1.45, resize: "vertical" }}
      />
    </div>
  );
}

function DetailLoading() {
  return (
    <>
      <div className="bar-top">
        <span className="skel" style={{ width: 96, height: 20, marginLeft: 8 }} />
      </div>
      <main className="scroll" style={{ gap: 22 }} aria-busy="true" aria-label="Loading">
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 4px 0" }}>
          <span className="skel" style={{ width: 36, height: 36, borderRadius: "50%", flex: "none" }} />
          <span className="skel" style={{ width: "70%", height: 26 }} />
        </div>
        <span className="skel" style={{ width: "100%", height: 50 }} />
        <div className="card" style={{ height: 112 }} />
      </main>
    </>
  );
}

function NotFound() {
  return (
    <>
      <div className="bar-top">
        <Link className="link" href="/tasks" style={{ padding: "0 8px" }}>
          <ChevronLeft />
          All tasks
        </Link>
      </div>
      <main className="empty">
        <h1 className="h2">Task not found</h1>
        <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
          It may have been deleted.
        </p>
      </main>
    </>
  );
}
