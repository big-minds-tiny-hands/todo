"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { AddTaskSheet } from "@/components/add-task-sheet";
import { ChevronRight, ListIcon, PlusIcon, SunIcon, TrashIcon } from "@/components/icons";
import { RecentlyDeleted } from "@/components/tasks/recently-deleted";
import { SwipeRow } from "@/components/swipe-row";
import { DaySheet } from "@/components/tasks/day-sheet";
import { TaskActionsMenu, useAddToToday, useDeleteTask } from "@/components/tasks/task-actions-menu";
import { TimeSheet } from "@/components/tasks/time-sheet";
import { creationDay, daysBetween, type Task } from "@/components/tasks/when";
import { Avatar, PRIORITY_LABEL, PriorityDot } from "@/components/ui-todo";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useToday } from "@/hooks/use-today";
import { authClient } from "@/lib/auth-client";
import { clockLabel, shortDate } from "@/lib/day";

const PRIORITIES = ["high", "normal", "low"] as const;

/** Which task's actions are open, and which surface: the menu or one of its sheets. */
type Active = { id: Id<"tasks">; anchor: Element; panel: "menu" | "day" | "time" };

function addedLabel(task: Task, today: string) {
  const days = daysBetween(creationDay(task), today);
  if (days <= 0) return "Added today";
  if (days === 1) return "Added yesterday";
  if (days < 7) return `Added ${days} days ago`;
  if (days < 14) return "Added last week";
  if (days < 31) return `Added ${Math.floor(days / 7)} weeks ago`;
  return "Added over a month ago";
}

function metaFor(task: Task, today: string, yesterday: string) {
  if (task.plannedDay) return [shortDate(task.plannedDay), task.startTime && clockLabel(task.startTime)].filter(Boolean).join(" · ");
  if (task.missedDay) return task.missedDay === yesterday ? "Missed yesterday" : task.missedDay === today ? "Missed today" : `Missed ${shortDate(task.missedDay)}`;
  if (task.todayDay === yesterday) return "Back from yesterday";
  if (task.checklist.length > 0) return `Checklist ${task.checklist.filter((s) => s.done).length}/${task.checklist.length}`;
  return addedLabel(task, today);
}

export default function AllTasksPage() {
  const { today, yesterday } = useToday();
  const data = useQuery(api.tasks.all, { today });
  const { data: session } = authClient.useSession();
  const [adding, setAdding] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const name = session?.user.name;
  // Keyed so the open sheet survives the switch between the empty and the list layout, keeping what was typed.
  const addSheet = <AddTaskSheet key="add-task" open={adding} onOpenChange={setAdding} today={today} />;

  if (data === undefined) return <AllTasksLoading name={name} />;

  if (data.tasks.length === 0) {
    return (
      <>
        <header className="head">
          <div>
            <p className="eyebrow">{data.hasAnyTask ? "All clear" : "Start here"}</p>
            <h1 className="h1">All tasks</h1>
          </div>
          <div className="head-actions">
            <Avatar name={name} />
          </div>
        </header>
        <main className="empty">
          <div className="empty-art">
            <ListIcon />
          </div>
          {data.hasAnyTask ? (
            <>
              <h2 className="h2">Nothing waiting</h2>
              <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
                Every task is planned or done.
              </p>
            </>
          ) : (
            <>
              <h2 className="h2">Everything you need to do goes here</h2>
              <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
                Add it all, big or small. Each day you pick a few for Today, and the rest waits here by priority.
              </p>
            </>
          )}
          <button type="button" className="btn pri" style={{ marginTop: 12, minWidth: 220 }} onClick={() => setAdding(true)}>
            <PlusIcon style={{ strokeWidth: 2.4 }} />
            Add a task
          </button>
          <div style={{ width: "100%", textAlign: "left", marginTop: 12 }}>
            <RecentlyDeleted />
          </div>
        </main>
        {addSheet}
      </>
    );
  }

  const groups = PRIORITIES.map((priority) => ({ priority, items: data.tasks.filter((t) => t.priority === priority) })).filter(
    (g) => g.items.length > 0,
  );
  const activeTask = active ? data.tasks.find((t) => t._id === active.id) : undefined;
  const activeGroup = activeTask ? groups.find((g) => g.priority === activeTask.priority)?.items : undefined;
  const close = (open: boolean) => {
    if (!open) setActive(null);
  };

  return (
    <>
      <header className="head">
        <div>
          <p className="eyebrow num">
            {data.tasks.length} {data.tasks.length === 1 ? "task" : "tasks"}
          </p>
          <h1 className="h1">All tasks</h1>
        </div>
        <div className="head-actions">
          <Avatar name={name} />
        </div>
      </header>

      <main className="scroll">
        <button type="button" className="card row" style={{ minHeight: 56, color: "var(--tx3)" }} onClick={() => setAdding(true)}>
          <PlusIcon style={{ color: "var(--lime-tx)" }} />
          <span className="t" style={{ color: "var(--tx3)" }}>
            Add a task
          </span>
        </button>

        <Link className="card row" href="/">
          <SunIcon style={{ color: "var(--lime-tx)" }} />
          <span className="t">On Today</span>
          <span className="v num">{data.onTodayCount}</span>
          <ChevronRight style={{ color: "var(--tx3)" }} />
        </Link>

        {groups.map((g) => (
          <section key={g.priority}>
            <h2 className="label">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <PriorityDot priority={g.priority} />
                {PRIORITY_LABEL[g.priority]}
              </span>
              <span className="num">{g.items.length}</span>
            </h2>
            <div className="card">
              {g.items.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  today={today}
                  meta={metaFor(task, today, yesterday)}
                  highlighted={active?.id === task._id && active.panel === "menu"}
                  onActions={(anchor) => setActive({ id: task._id, anchor, panel: "menu" })}
                />
              ))}
            </div>
          </section>
        ))}

        <RecentlyDeleted />
      </main>

      {active && activeTask && (
        <>
          <TaskActionsMenu
            task={activeTask}
            today={today}
            open={active.panel === "menu"}
            onOpenChange={close}
            anchor={active.anchor}
            onPickDay={() => setActive({ ...active, panel: "day" })}
            onPickTime={() => setActive({ ...active, panel: "time" })}
            canMoveUp={activeGroup?.[0]?._id !== activeTask._id}
            canMoveDown={activeGroup?.[activeGroup.length - 1]?._id !== activeTask._id}
          />
          <DaySheet task={activeTask} today={today} open={active.panel === "day"} onOpenChange={close} />
          <TimeSheet task={activeTask} open={active.panel === "time"} onOpenChange={close} />
        </>
      )}
      {addSheet}
    </>
  );
}

const LONG_PRESS_MS = 500;
/** A finger that moves this far is swiping or scrolling, not pressing. */
const PRESS_SLOP_PX = 8;

/** Tap opens the task. Long-press, right-click, or the context-menu key opens its actions. */
function TaskRow({
  task,
  today,
  meta,
  highlighted,
  onActions,
}: {
  task: Task;
  today: string;
  meta: string;
  highlighted: boolean;
  onActions: (anchor: Element) => void;
}) {
  const addToToday = useAddToToday();
  const deleteTask = useDeleteTask();
  const press = useRef<{ timer?: number; fired: boolean; x: number; y: number }>({ fired: false, x: 0, y: 0 });
  const cancel = () => window.clearTimeout(press.current.timer);

  return (
    <SwipeRow
      right={{ label: "Today", icon: <SunIcon />, tone: "lime", leaves: true, run: () => void addToToday(task, today) }}
      left={{ label: "Delete", icon: <TrashIcon />, tone: "red", leaves: true, run: () => void deleteTask(task) }}
    >
      <div
        className={`task${highlighted ? " sel" : ""}`}
        style={highlighted ? { position: "relative", zIndex: 41, borderRadius: 0 } : undefined}
        onContextMenu={(event) => {
          event.preventDefault();
          onActions(event.currentTarget);
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "touch") return;
          const row = event.currentTarget;
          press.current.fired = false;
          press.current.x = event.clientX;
          press.current.y = event.clientY;
          press.current.timer = window.setTimeout(() => {
            press.current.fired = true;
            onActions(row);
          }, LONG_PRESS_MS);
        }}
        onPointerMove={(event) => {
          if (Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > PRESS_SLOP_PX) cancel();
        }}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onPointerLeave={cancel}
        onClickCapture={(event) => {
          if (!press.current.fired) return;
          press.current.fired = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <Link href={`/task/${task._id}`} className="t" style={{ textDecoration: "none" }}>
          <div className="tt">{task.title}</div>
          <div className="m">{meta}</div>
        </Link>
        <button type="button" className="iconbtn ghost" aria-label={`Add ${task.title} to Today`} onClick={() => void addToToday(task, today)}>
          <SunIcon />
        </button>
      </div>
    </SwipeRow>
  );
}

function AllTasksLoading({ name }: { name?: string }) {
  return (
    <>
      <header className="head">
        <div>
          <span className="skel" style={{ display: "block", width: 64, height: 13, marginBottom: 8 }} />
          <h1 className="h1">All tasks</h1>
        </div>
        <div className="head-actions">
          <Avatar name={name} />
        </div>
      </header>
      <main className="scroll" aria-busy="true" aria-label="Loading">
        <div className="card" style={{ height: 56 }} />
        <div className="card" style={{ height: 56 }} />
        <div className="card" style={{ height: 168 }} />
      </main>
    </>
  );
}
