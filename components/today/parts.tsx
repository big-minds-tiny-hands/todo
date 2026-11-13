"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CheckIcon, ChevronRight, ClockIcon, ExpandIcon, FlameIcon, ListIcon, MinusIcon, PencilIcon, PlusIcon, UndoIcon } from "@/components/icons";
import { SwipeRow, type SwipeAction } from "@/components/swipe-row";
import { Check, RowAction } from "@/components/ui-todo";
import { clockLabel, longDate } from "@/lib/day";
import { reward, showToast, type RewardPrefs } from "@/lib/reward";
import { useFocusEdit } from "./use-focus-edit";
import { checklistLabel, clockOf, isNow, pickMeta, slotEnd, slotMeta, type GoalRow, type Task } from "./view";

/** `progress` sits under the title, where it has room for its words on a phone. */
export function TodayHeader({ today, title = "Today", progress, children }: { today: string; title?: string; progress?: ReactNode; children: ReactNode }) {
  return (
    <header className="head">
      <div>
        <p className="eyebrow">{longDate(today)}</p>
        <h1 className="h1">{title}</h1>
        {progress}
      </div>
      <div className="head-actions">{children}</div>
    </header>
  );
}

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn sec add" onClick={onClick}>
      <PlusIcon />
      Add task
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

/**
 * The focus set. Each open row finishes on its check, opens on its title, and swipes left back to All tasks.
 * Edit takes tasks out, sends them back, and fills the free slots from the rest of Today.
 */
export function FocusSection({ focus, candidates, size, today, ...props }: { focus: Task[]; candidates: Task[]; size: number; today: string } & CheckProps) {
  const [editing, setEditing] = useState(false);
  const edit = useFocusEdit(today);
  const left = focus.filter((t) => !t.done).length;
  const free = size - focus.length;
  return (
    <section className="focus" aria-label="Focus set" data-editing={editing || undefined} style={{ gridArea: "focus", position: "relative" }}>
      <div className="focus-head">
        <div>
          <h2 className="h3">Focus</h2>
          <div className="small muted num" style={{ marginTop: 2 }}>
            {editing ? `${focus.length} of ${size} picked` : `${left} left`}
          </div>
        </div>
        <div className="focus-actions">
          {editing ? (
            <button type="button" className="btn pri act" onClick={() => setEditing(false)}>
              Done
            </button>
          ) : (
            <>
              <button type="button" className="btn sec act" aria-label="Edit focus set" onClick={() => setEditing(true)}>
                <PencilIcon />
                Edit
              </button>
              <Link className="btn sec act" href="/focus" aria-label="Open focus mode">
                <ExpandIcon />
                Focus mode
              </Link>
            </>
          )}
        </div>
      </div>
      {!editing && (
        <div className="bar" style={{ margin: "0 14px 6px" }}>
          <i style={{ width: `${focus.length ? ((focus.length - left) / focus.length) * 100 : 0}%` }} />
        </div>
      )}
      {focus.map((task) =>
        editing && !task.done ? (
          <div key={task._id} className="task">
            <button type="button" className="mark out" aria-label={`Take ${task.title} out of focus`} onClick={() => edit.takeOut(task)}>
              <span>
                <MinusIcon />
              </span>
            </button>
            <TaskLink task={task} meta={focusMeta(task, props)} />
            <RowAction name={`Not today: ${task.title}`} onClick={() => edit.sendBack(task)}>
              Not today
            </RowAction>
          </div>
        ) : (
          <FocusRow key={task._id} task={task} {...props} onSendBack={editing ? undefined : () => edit.sendBack(task)} />
        ),
      )}
      {editing && free > 0 && (
        <div className="focus-pick">
          {Array.from({ length: free }, (_, i) => (
            <div key={i} className="slot-empty">
              <span className="mark" aria-hidden="true" style={{ margin: "0 -6px" }}>
                <span>{focus.length + i + 1}</span>
              </span>
              {candidates.length > 0 ? "Pick from Today" : "Nothing else on Today"}
            </div>
          ))}
          {candidates.map((task) => (
            <div key={task._id} className="task">
              <TaskLink task={task} meta={pickMeta(task, today, { priority: task.priority === "high" })} />
              <RowAction name={`Pick ${task.title}`} onClick={() => edit.pick(task)}>
                Pick
              </RowAction>
            </div>
          ))}
          {candidates.length === 0 && (
            <Link className="link" href="/tasks" style={{ margin: "0 14px" }}>
              <PlusIcon size={18} />
              Pick from All tasks
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function TaskLink({ task, meta }: { task: Task; meta: ReactNode }) {
  return (
    <Link className="t" href={`/task/${task._id}`} style={{ textDecoration: "none" }}>
      <div className="tt">{task.title}</div>
      {meta && <div className="m">{meta}</div>}
    </Link>
  );
}

function FocusRow({ task, onSendBack, ...props }: { task: Task; onSendBack?: () => void } & CheckProps) {
  const glow = task._id === props.justChecked && task.done;
  const back: SwipeAction | undefined =
    onSendBack && !task.done ? { label: "All tasks", icon: <ListIcon />, tone: "neutral", leaves: true, run: onSendBack } : undefined;
  return (
    <SwipeRow right={completeAction(task, props.onCheck)} left={back}>
      <div className={["task", task.done && "done", glow && "glow"].filter(Boolean).join(" ")} style={glow ? { position: "relative" } : undefined}>
        <Check size="lg" checked={task.done} onChange={(next) => props.onCheck(task, next)} label={`${task.done ? "Undo" : "Complete"} ${task.title}`} />
        <TaskLink task={task} meta={focusMeta(task, props)} />
        {glow && (
          <span className="plus1" aria-hidden="true" style={{ left: 34, top: -14 }}>
            +1
          </span>
        )}
      </div>
    </SwipeRow>
  );
}

/** Swipe right on an open Today task to complete it, with the same reward as its check. */
export function completeAction(task: Task, onCheck: CheckProps["onCheck"]): SwipeAction | undefined {
  if (task.done) return undefined;
  return { label: "Done", icon: <CheckIcon />, tone: "lime", run: () => onCheck(task, true) };
}

/** A row that opens its list in place: a title, an optional summary on the right, and a chevron. */
export function Disclosure({
  id,
  label,
  summary,
  name,
  remember,
  children,
}: {
  id: string;
  label: ReactNode;
  summary?: ReactNode;
  name?: string;
  /** Keep the row open or closed across visits on this device. */
  remember?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => remember === true && readOpen(id));
  function toggle() {
    setOpen(!open);
    if (remember) saveOpen(id, !open);
  }
  return (
    <div>
      <button type="button" className="card row more-toggle" aria-expanded={open} aria-controls={id} aria-label={name} onClick={toggle}>
        <span className="t">{label}</span>
        {summary !== undefined && <span className="more-sum num">{summary}</span>}
        <ChevronRight className="more-chevron" />
      </button>
      <div id={id} className="more-panel" data-open={open || undefined} inert={!open}>
        <div>
          <div className="card" style={{ marginTop: 10 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const openKey = (id: string) => `todo:open:${id}`;
function readOpen(id: string) {
  try {
    return window.localStorage.getItem(openKey(id)) === "1";
  } catch {
    return false;
  }
}
function saveOpen(id: string, open: boolean) {
  try {
    window.localStorage.setItem(openKey(id), open ? "1" : "0");
  } catch {
    // Storage can be blocked. The row then starts closed on the next visit.
  }
}

/** An open Today task: the check finishes it, the title opens it, and `children` add trailing controls. */
export function OpenTaskRow({ task, meta, onCheck, children }: { task: Task; meta: string; onCheck: CheckProps["onCheck"]; children?: ReactNode }) {
  return (
    <div className="task">
      <Check checked={task.done} onChange={(next) => onCheck(task, next)} label={`Complete ${task.title}`} />
      <Link className="t" href={`/task/${task._id}`} style={{ textDecoration: "none" }}>
        <div className="tt">{task.title}</div>
        {meta && <div className="m">{meta}</div>}
      </Link>
      {children}
    </div>
  );
}

/** The rest of Today below a running focus set, with the same check and swipe as the focus set. */
export function MoreToday({ tasks, today, onCheck }: { tasks: Task[]; today: string; onCheck: CheckProps["onCheck"] }) {
  if (tasks.length === 0) return null;
  return (
    <Disclosure id="more-today" label="More today" summary={tasks.length} name={`${tasks.length} more ${tasks.length === 1 ? "task" : "tasks"} today`}>
      {tasks.map((task) => (
        <SwipeRow key={task._id} right={completeAction(task, onCheck)}>
          <OpenTaskRow task={task} meta={pickMeta(task, today)} onCheck={onCheck} />
        </SwipeRow>
      ))}
    </Disclosure>
  );
}

/**
 * Everything finished today, newest first. Unchecking a task here undoes its check at any time, long after the
 * toast's Undo is gone.
 */
export function DoneToday({ tasks, onCheck }: { tasks: Task[]; onCheck: CheckProps["onCheck"] }) {
  if (tasks.length === 0) return null;
  const newestFirst = [...tasks].sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  return (
    <Disclosure id="done-today" label="Done today" summary={tasks.length} name={`${tasks.length} done today`}>
      {newestFirst.map((task) => (
        <div key={task._id} className="task done">
          <Check checked onChange={() => onCheck(task, false)} label={`Undo ${task.title}`} />
          <Link className="t" href={`/task/${task._id}`} style={{ textDecoration: "none" }}>
            <div className="tt">{task.title}</div>
            <div className="m">{task.doneAt ? `Done ${clockOf(task.doneAt)}` : "Done"}</div>
          </Link>
        </div>
      ))}
    </Disclosure>
  );
}

/** On a phone the time slots fold into one row that names the slot now or next. */
export function ScheduleSection({ schedule, minutes, onCheck, compact }: { schedule: Task[]; minutes: number; onCheck: CheckProps["onCheck"]; compact?: boolean }) {
  if (schedule.length === 0) return null;
  const rows = schedule.map((task) => {
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
  });
  if (compact) {
    const next = schedule.find((t) => !t.done && slotEnd(t) > minutes);
    const now = next !== undefined && isNow(next, minutes);
    const done = schedule.filter((t) => t.done).length;
    const summary = next ? `${now ? "Now" : clockLabel(next.startTime!)} · ${next.title}` : `${done} of ${schedule.length} done`;
    return (
      <div style={{ gridArea: "sched" }}>
        <Disclosure id="time-slots" remember label="Time slots" summary={<span className={now ? "now" : undefined}>{summary}</span>}>
          {rows}
        </Disclosure>
      </div>
    );
  }
  return (
    <section style={{ gridArea: "sched" }}>
      <h2 className="label">
        <span>Time slots</span>
        <span className="num">{schedule.length}</span>
      </h2>
      <div className="card">{rows}</div>
    </section>
  );
}

/** With `invite`, a day with no goals shows a link to add one instead of nothing. On a phone, `compact` folds the goals into one row. */
export function GoalsSection({ goals, today, prefs, invite, compact }: { goals: GoalRow[]; today: string; prefs: RewardPrefs; invite?: boolean; compact?: boolean }) {
  const setMet = useMutation(api.goals.setMet).withOptimisticUpdate((store, { id, today: day, met }) => {
    for (const { args, value } of store.getAllQueries(api.goals.forDay)) {
      if (!value || args.today !== day) continue;
      store.setQuery(api.goals.forDay, args, value.map((r) => (r.goal._id === id ? { ...r, met } : r)));
    }
  });
  if (goals.length === 0) {
    if (!invite) return null;
    return (
      <Link className="link" href="/settings/goals/new" style={{ gridArea: "goals", margin: "-8px 4px 0" }}>
        <PlusIcon size={18} />
        Add a daily goal
      </Link>
    );
  }
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

  const rows = goals.map((row) => (
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
  ));

  if (compact) {
    const allMet = metCount === goals.length;
    return (
      <div style={{ gridArea: "goals" }}>
        <Disclosure id="daily-goals" remember label="Daily goals" summary={<span className={allMet ? "now" : undefined}>{`${metCount} of ${goals.length} met`}</span>}>
          {rows}
          <Link className="row" href="/settings/goals">
            <span className="t">Manage daily goals</span>
            <ChevronRight className="more-chevron" />
          </Link>
        </Disclosure>
      </div>
    );
  }

  return (
    <section style={{ gridArea: "goals" }}>
      <h2 className="label">
        <span>Daily goals</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          {metCount === goals.length ? (
            <b className="num" style={{ color: "var(--lime-tx)" }}>
              {metCount} of {goals.length} met
            </b>
          ) : (
            <span className="num">
              {metCount} of {goals.length} met
            </span>
          )}
          <Link className="label-link" href="/settings/goals">
            Manage
          </Link>
        </span>
      </h2>
      <div className="card">{rows}</div>
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
