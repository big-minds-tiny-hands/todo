"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CheckIcon, ChevronRight, ClockIcon, ExpandIcon, FlameIcon, PlusIcon, UndoIcon } from "@/components/icons";
import { SwipeRow, type SwipeAction } from "@/components/swipe-row";
import { Check } from "@/components/ui-todo";
import { clockLabel, longDate } from "@/lib/day";
import { reward, showToast, type RewardPrefs } from "@/lib/reward";
import { checklistLabel, clockOf, isNow, pickMeta, slotMeta, type GoalRow, type Task } from "./view";

export function TodayHeader({ today, title = "Today", children }: { today: string; title?: string; children: ReactNode }) {
  return (
    <header className="head">
      <div>
        <p className="eyebrow">{longDate(today)}</p>
        <h1 className="h1">{title}</h1>
      </div>
      <div className="head-actions">{children}</div>
    </header>
  );
}

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="iconbtn" aria-label="Add a task" onClick={onClick}>
      <PlusIcon />
    </button>
  );
}

export function StreakPill({ streak, short, style }: { streak: number; short?: boolean; style?: CSSProperties }) {
  if (streak <= 0) return null;
  return (
    <Link className="pill amber" href="/wins" aria-label={`${streak}-day streak. See your wins`} style={{ textDecoration: "none", ...style }}>
      <FlameIcon />
      {short ? streak : `${streak}-day streak`}
    </Link>
  );
}

type CheckProps = {
  onCheck: (task: Task, done: boolean) => void;
  pending: ReadonlySet<Id<"tasks">>;
  justChecked: Id<"tasks"> | null;
};

function focusMeta(task: Task, { pending, justChecked }: Omit<CheckProps, "onCheck">): ReactNode {
  if (pending.has(task._id) && typeof navigator !== "undefined" && !navigator.onLine) {
    return (
      <>
        <ClockIcon />
        Waiting to save
      </>
    );
  }
  if (task.done) return justChecked === task._id ? "Done just now" : task.doneAt ? `Done ${clockOf(task.doneAt)}` : "Done";
  if (task.checklist.length > 0) return checklistLabel(task);
  if (task.priority === "high") return "High priority";
  if (task.startTime) return clockLabel(task.startTime);
  return null;
}

export function FocusSection({ focus, streak, footer, ...props }: { focus: Task[]; streak: number; footer?: ReactNode } & CheckProps) {
  const done = focus.filter((t) => t.done).length;
  const fresh = props.justChecked !== null && focus.some((t) => t._id === props.justChecked);
  return (
    <section className="focus" aria-label="Focus set" style={{ gridArea: "focus", position: "relative" }}>
      <div className="focus-head">
        <div>
          <h2 className="h3">Focus</h2>
          <div className={fresh ? "small num" : "small muted num"} style={{ marginTop: 2, color: fresh ? "var(--lime-tx)" : undefined }}>
            {done} of {focus.length} done
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <StreakPill streak={streak} />
          <Link className="iconbtn ghost" href="/focus" aria-label="Open focus mode" style={{ margin: "-8px -8px -8px 0" }}>
            <ExpandIcon />
          </Link>
        </div>
      </div>
      <div className="bar" style={{ margin: "0 14px 6px" }}>
        <i style={{ width: `${focus.length ? (done / focus.length) * 100 : 0}%` }} />
      </div>
      {focus.map((task) => {
        const glow = task._id === props.justChecked && task.done;
        const meta = focusMeta(task, props);
        return (
          <SwipeRow key={task._id} right={completeAction(task, props.onCheck)}>
            <div className={["task", task.done && "done", glow && "glow"].filter(Boolean).join(" ")} style={glow ? { position: "relative" } : undefined}>
              <Check size="lg" checked={task.done} onChange={(next) => props.onCheck(task, next)} label={`${task.done ? "Undo" : "Complete"} ${task.title}`} />
              <div className="t">
                <div className="tt">{task.title}</div>
                {meta && <div className="m">{meta}</div>}
              </div>
              {glow && (
                <span className="plus1" aria-hidden="true" style={{ left: 34, top: -14 }}>
                  +1
                </span>
              )}
            </div>
          </SwipeRow>
        );
      })}
      {footer}
    </section>
  );
}

/** Swipe right on an open Today task to complete it, with the same reward as its check. */
function completeAction(task: Task, onCheck: CheckProps["onCheck"]): SwipeAction | undefined {
  if (task.done) return undefined;
  return { label: "Done", icon: <CheckIcon />, tone: "lime", run: () => onCheck(task, true) };
}

/**
 * The rest of Today below a running focus set. Tapping the row opens the tasks in place, with the same check and
 * swipe as the focus set, instead of leaving the screen.
 */
export function MoreToday({ tasks, today, onCheck }: { tasks: Task[]; today: string; onCheck: CheckProps["onCheck"] }) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;
  return (
    <section style={{ gridArea: "more" }}>
      <button type="button" className="card row more-toggle" aria-expanded={open} aria-controls="more-today" onClick={() => setOpen(!open)}>
        <span className="t">
          {tasks.length} more {tasks.length === 1 ? "task" : "tasks"} today
        </span>
        <ChevronRight className="more-chevron" />
      </button>
      <div id="more-today" className="more-panel" data-open={open || undefined} inert={!open}>
        <div>
          <div className="card" style={{ marginTop: 10 }}>
            {tasks.map((task) => (
              <SwipeRow key={task._id} right={completeAction(task, onCheck)}>
                <div className={["task", task.done && "done"].filter(Boolean).join(" ")}>
                  <Check checked={task.done} onChange={(next) => onCheck(task, next)} label={`${task.done ? "Undo" : "Complete"} ${task.title}`} />
                  <div className="t">
                    <div className="tt">{task.title}</div>
                    <div className="m">{pickMeta(task, today)}</div>
                  </div>
                </div>
              </SwipeRow>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ScheduleSection({ schedule, minutes, onCheck }: { schedule: Task[]; minutes: number; onCheck: CheckProps["onCheck"] }) {
  if (schedule.length === 0) return null;
  return (
    <section style={{ gridArea: "sched" }}>
      <h2 className="label">
        <span>Schedule</span>
        <span className="num">{schedule.length}</span>
      </h2>
      <div className="card">
        {schedule.map((task) => {
          const now = !task.done && isNow(task, minutes);
          return (
            <SwipeRow key={task._id} right={completeAction(task, onCheck)}>
              <div className={["task slot", now && "now", task.done && "done"].filter(Boolean).join(" ")}>
                <span className="time">{clockLabel(task.startTime!)}</span>
                <div className="t">
                  <div className="tt">{task.title}</div>
                  <div className="m">{slotMeta(task, now)}</div>
                </div>
                <Check checked={task.done} onChange={(next) => onCheck(task, next)} label={`${task.done ? "Undo" : "Complete"} ${task.title}`} />
              </div>
            </SwipeRow>
          );
        })}
      </div>
    </section>
  );
}

export function GoalsSection({ goals, today, prefs }: { goals: GoalRow[]; today: string; prefs: RewardPrefs }) {
  const setMet = useMutation(api.goals.setMet).withOptimisticUpdate((store, { id, today: day, met }) => {
    for (const { args, value } of store.getAllQueries(api.goals.forDay)) {
      if (!value || args.today !== day) continue;
      store.setQuery(api.goals.forDay, args, value.map((r) => (r.goal._id === id ? { ...r, met } : r)));
    }
  });
  if (goals.length === 0) return null;
  const metCount = goals.filter((r) => r.met).length;

  function check({ goal }: GoalRow, met: boolean) {
    if (met) {
      const allMet = metCount + 1 === goals.length;
      reward(prefs, allMet);
      showToast(allMet ? "Every daily goal met today." : `Goal met: ${goal.title}`, {
        lime: true,
        icon: <CheckIcon size={20} style={{ strokeWidth: 2.6 }} />,
        duration: 3000,
      });
    }
    void setMet({ id: goal._id, today, met });
  }

  return (
    <section style={{ gridArea: "goals" }}>
      <h2 className="label">
        <span>Daily goals</span>
        {metCount === goals.length ? (
          <b className="num" style={{ color: "var(--lime-tx)" }}>
            {metCount} of {goals.length} met
          </b>
        ) : (
          <span className="num">
            {metCount} of {goals.length} met
          </span>
        )}
      </h2>
      <div className="card">
        {goals.map((row) => (
          <div key={row.goal._id} className="goal">
            <div className="t" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16 }}>{row.goal.title}</div>
              {row.goal.detail && (
                <div className="small muted" style={{ marginTop: 2 }}>
                  {row.goal.detail}
                </div>
              )}
            </div>
            <Check checked={row.met} onChange={(next) => check(row, next)} label={`${row.met ? "Undo" : "Mark"} ${row.goal.title} done`} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function NewDayBanner({ count, onSeen }: { count: number; onSeen: () => void }) {
  return (
    <div className="banner" role="status" style={{ gridArea: "banner" }}>
      <UndoIcon style={{ color: "var(--tx2)" }} />
      <span style={{ flex: 1, fontSize: 15 }}>
        {count} unfinished {count === 1 ? "task" : "tasks"} went back to All tasks
      </span>
      <Link className="btn sec sm" href="/tasks" onClick={onSeen}>
        View
      </Link>
    </div>
  );
}
