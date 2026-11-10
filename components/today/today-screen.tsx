"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { AddTaskSheet } from "@/components/add-task-sheet";
import { Celebration } from "@/components/celebration";
import { LoadingBody } from "@/components/frames";
import { CheckIcon, ListIcon, PlusIcon, RepeatIcon, SunIcon } from "@/components/icons";
import { PriorityGroups } from "@/components/tasks/priority-groups";
import { SwipeRow } from "@/components/swipe-row";
import { Avatar, Ring, RowAction, SendToToday } from "@/components/ui-todo";
import { useAddToToday } from "@/components/tasks/task-actions-menu";
import { useLinger } from "@/components/tasks/use-linger";
import { useToday } from "@/hooks/use-today";
import { lastDays, weekday, weekOf } from "@/lib/day";
import { usePicks } from "./choose-focus";
import {
  AddButton,
  completeAction,
  DoneToday,
  FocusSection,
  GoalsSection,
  MoreToday,
  NewDayBanner,
  OpenTaskRow,
  ScheduleSection,
  StreakPill,
  TodayHeader,
} from "./parts";
import { TimeCheck, useDismissedSlots } from "./time-check";
import { useCheck } from "./use-check";
import { useMoment } from "./use-moment";
import { byPriority } from "@/lib/placement";
import { deriveView, pickMeta, slotToCheck, type GoalRow, type Task, type TodayData } from "./view";

type When = "today" | "later";

export function TodayScreen() {
  const { today, yesterday, minutes } = useToday();
  const data = useQuery(api.tasks.today, { today, yesterday });
  const goals = useQuery(api.goals.forDay, { today, weekday: weekday(today) });
  const wins = useQuery(api.stats.wins, { days: lastDays(today, 60), week: weekOf(today), monthPrefix: today.slice(0, 7) });
  const user = useQuery(api.auth.getCurrentUser);
  const updateSettings = useMutation(api.settings.update);
  const [planning, setPlanning] = useState(false);
  const [adding, setAdding] = useState<When | null>(null);
  const { dismissed, dismiss } = useDismissedSlots(today);
  const { moment, after, clear } = useMoment(data, wins, today);
  const { check, pending, justChecked } = useCheck(data, today, clear);

  const view = deriveView(data, goals, today, planning);
  const streak = wins?.streak ?? 0;
  const avatar = <Avatar name={user?.name} />;
  const add = () => setAdding("today");

  function onCheck(task: Task, done: boolean) {
    after(check(task, done));
  }

  function markBannerSeen() {
    void updateSettings({ newDayBannerSeen: today });
  }

  let body: ReactNode;
  switch (view.kind) {
    case "loading":
      return <LoadingBody />;
    case "firstRun":
      body = (
        <>
          <TodayHeader today={today}>{avatar}</TodayHeader>
          <main className="empty">
            <div className="empty-art">
              <SunIcon />
            </div>
            <h2 className="h2">Put everything on your plate here</h2>
            <p className="muted" style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>
              Every task goes in All tasks. Each day, you pick a few to finish first.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 16 }}>
              <button type="button" className="btn pri full" onClick={() => setAdding("later")}>
                <PlusIcon style={{ strokeWidth: 2.4 }} />
                Add your first task
              </button>
              <Link className="btn sec full" href="/settings/goals/new">
                <RepeatIcon />
                Set a daily goal
              </Link>
            </div>
          </main>
        </>
      );
      break;
    case "newDay":
      body = (
        <>
          <TodayHeader today={today}>
            <StreakPill streak={streak} short />
            <AddButton onClick={add} />
            {avatar}
          </TodayHeader>
          <main className="scroll cols" style={{ gridTemplateAreas: "'banner goals' 'plan goals'" }}>
            <NewDayBanner count={view.data.returnedCount} onSeen={markBannerSeen} />
            <section style={{ gridArea: "plan", display: "flex", flexDirection: "column", gap: 12 }}>
              {view.planned.length > 0 && (
                <>
                  <h2 className="label" style={{ marginBottom: 0 }}>
                    <span>Planned for today</span>
                    <span className="num">{view.planned.length}</span>
                  </h2>
                  <div className="card">
                    {view.planned.map((task) => (
                      <OpenTaskRow key={task._id} task={task} meta={pickMeta(task, today)} onCheck={onCheck} />
                    ))}
                  </div>
                </>
              )}
              <button type="button" className="btn pri full" onClick={markBannerSeen}>
                Plan today
              </button>
            </section>
            <GoalsSection goals={view.goals} today={today} prefs={view.data.settings} />
          </main>
        </>
      );
      break;
    case "plan":
      body = (
        <>
          <TodayHeader today={today} title="Plan today" progress={<Ring done={view.data.doneToday.length} target={view.data.settings.dailyTarget} href="/wins" />}>
            <AddButton onClick={add} />
            {avatar}
          </TodayHeader>
          <PlanBody
            today={today}
            onToday={[...view.today].sort(byPriority)}
            done={view.data.doneToday}
            onCheck={onCheck}
            goals={<GoalsSection goals={view.goals} today={today} prefs={view.data.settings} invite />}
          />
        </>
      );
      break;
    case "focus":
      body = (
        <>
          <TodayHeader today={today} progress={<Ring done={view.data.doneToday.length} target={view.data.settings.dailyTarget} href="/wins" />}>
            <AddButton onClick={add} />
            {avatar}
          </TodayHeader>
          <main className="scroll cols" style={{ gridTemplateAreas: "'focus sched' 'focus goals' 'more goals'" }}>
            <FocusSection
              focus={view.data.focus}
              streak={streak}
              onCheck={onCheck}
              pending={pending}
              justChecked={justChecked}
            />
            <ScheduleSection schedule={view.data.schedule} minutes={minutes} onCheck={onCheck} />
            <GoalsSection goals={view.goals} today={today} prefs={view.data.settings} />
            <div style={{ gridArea: "more", display: "flex", flexDirection: "column", gap: 10 }}>
              <MoreToday tasks={view.data.rest} today={today} onCheck={onCheck} />
              <DoneToday tasks={view.data.doneToday.filter((t) => !view.data.focus.some((f) => f._id === t._id) && !view.data.schedule.some((f) => f._id === t._id))} onCheck={onCheck} />
            </div>
          </main>
        </>
      );
      break;
    case "nextSet":
      body = (
        <>
          <TodayHeader today={today} progress={<Ring done={view.data.doneToday.length} target={view.data.settings.dailyTarget} href="/wins" />}>
            <AddButton onClick={add} />
            {avatar}
          </TodayHeader>
          <NextSetBody data={view.data} open={[...view.open].sort(byPriority)} today={today} onCheck={onCheck} />
        </>
      );
      break;
    case "dayWon":
      body = (
        <>
          <TodayHeader today={today}>
            <AddButton onClick={add} />
            {avatar}
          </TodayHeader>
          <DayWonBody
            data={view.data}
            goals={view.goals}
            today={today}
            streak={streak}
            week={wins?.week}
            onPlanMore={() => setPlanning(true)}
            onCheck={onCheck}
          />
        </>
      );
      break;
  }

  const slot = data && moment === null ? slotToCheck(data, minutes, dismissed) : undefined;
  return (
    <>
      {body}
      {moment && data && (
        <Celebration
          moment={moment}
          confetti={data.settings.confetti}
          onLeave={clear}
          onClose={clear}
        />
      )}
      {slot && <TimeCheck key={slot._id} task={slot} today={today} onDone={(task) => onCheck(task, true)} onDismiss={dismiss} />}
      <AddTaskSheet open={adding !== null} onOpenChange={(open) => !open && setAdding(null)} today={today} defaultWhen={adding ?? "today"} />
    </>
  );
}

function PlanBody({
  today,
  onToday,
  done,
  onCheck,
  goals,
}: {
  today: string;
  onToday: Task[];
  done: Task[];
  onCheck: (task: Task, done: boolean) => void;
  goals: ReactNode;
}) {
  const all = useQuery(api.tasks.all, { today });
  const addToToday = useAddToToday();
  const removeFromToday = useMutation(api.tasks.removeFromToday);
  const { hold, withHeld } = useLinger<Task>();
  const { rows: pool, isHeld } = withHeld(all?.pool ?? [], "pool", byPriority);
  return (
    <>
      <main className="scroll">
        {onToday.length > 0 && (
          <section className="stack">
            <h2 className="stitle">
              <span>Today</span>
              <span className="num">{onToday.length}</span>
            </h2>
            <PriorityGroups tasks={onToday} heading="h3">
              {(task) => (
                <SwipeRow
                  right={completeAction(task, onCheck)}
                  left={{ label: "All tasks", icon: <ListIcon />, tone: "neutral", leaves: true, run: () => void removeFromToday({ id: task._id, today }) }}
                >
                  <OpenTaskRow task={task} meta={pickMeta(task, today, { priority: false })} onCheck={onCheck}>
                    <RowAction name={`Not today: ${task.title}`} onClick={() => void removeFromToday({ id: task._id, today })}>
                      Not today
                    </RowAction>
                  </OpenTaskRow>
                </SwipeRow>
              )}
            </PriorityGroups>
          </section>
        )}
        {pool.length > 0 && (
          <section className="stack">
            <h2 className="stitle">
              <span>From All tasks</span>
              <span className="num">{all?.pool.length}</span>
            </h2>
            <PriorityGroups tasks={pool} heading="h3">
              {(task) => {
                const meta = pickMeta(task, today, { priority: false });
                const sent = isHeld(task._id);
                return (
                  <SwipeRow right={sent ? undefined : { label: "Today", icon: <SunIcon />, tone: "lime", leaves: true, run: () => void addToToday(task, today) }}>
                    <div className="task">
                      <Link className="t" href={`/task/${task._id}`} style={{ textDecoration: "none" }}>
                        <div className="tt">{task.title}</div>
                        {meta && <div className="m">{meta}</div>}
                      </Link>
                      <SendToToday
                        title={task.title}
                        sent={sent}
                        onSend={() => {
                          hold(task, "pool");
                          void addToToday(task, today);
                        }}
                      />
                    </div>
                  </SwipeRow>
                );
              }}
            </PriorityGroups>
          </section>
        )}
        <DoneToday tasks={done} onCheck={onCheck} />
        {goals}
      </main>
      <div className="cta">
        {onToday.length > 0 || pool.length > 0 ? (
          <Link className="btn pri full" href="/focus/choose">
            Choose a focus set
          </Link>
        ) : (
          <button type="button" className="btn pri full" disabled>
            Choose a focus set
          </button>
        )}
      </div>
    </>
  );
}

function NextSetBody({ data, open, today, onCheck }: { data: TodayData; open: Task[]; today: string; onCheck: (task: Task, done: boolean) => void }) {
  const limit = data.settings.focusSize;
  const startFocus = useMutation(api.tasks.startFocus);
  const { picks, toggle } = usePicks(open, limit);
  const picked = picks.map((id) => open.find((t) => t._id === id)!);
  const left = open.filter((t) => !picks.includes(t._id));
  return (
    <>
      <main className="scroll cols" style={{ gridTemplateAreas: "'focus today' 'done today'" }}>
        <section className="focus" aria-label="Next focus set" style={{ gridArea: "focus" }}>
          <div className="focus-head">
            <div>
              <h2 className="h3">Next focus set</h2>
              <div className="small muted num" style={{ marginTop: 2 }}>
                {picks.length} of {limit} picked
              </div>
            </div>
            <span className="pill num">Set {data.focusSet + 1}</span>
          </div>
          {picked.map((task, i) => (
            <div key={task._id} className="task">
              <button type="button" className="mark on" aria-label={`Take ${task.title} out of the next focus set`} onClick={() => toggle(task._id)}>
                <span>{i + 1}</span>
              </button>
              <div className="t">
                <div className="tt">{task.title}</div>
                <div className="m">{pickMeta(task, today)}</div>
              </div>
            </div>
          ))}
          {Array.from({ length: limit - picks.length }, (_, i) => (
            <div key={i} className="slot-empty" style={i === limit - picks.length - 1 ? { marginBottom: 10 } : undefined}>
              <span className="mark" aria-hidden="true" style={{ margin: "0 -6px" }}>
                <span>{picks.length + i + 1}</span>
              </span>
              Pick from Today
            </div>
          ))}
        </section>

        <section className="stack" style={{ gridArea: "today" }}>
          <h2 className="stitle">
            <span>Today</span>
            <span className="num">{left.length} left</span>
          </h2>
          <PriorityGroups tasks={left} heading="h3">
            {(task) => (
              <OpenTaskRow task={task} meta={pickMeta(task, today, { priority: false })} onCheck={onCheck}>
                <RowAction name={`Pick ${task.title}`} disabled={picks.length >= limit} onClick={() => toggle(task._id)}>
                  Pick
                </RowAction>
              </OpenTaskRow>
            )}
          </PriorityGroups>
          <Link className="link" href="/tasks" style={{ margin: "-8px 4px 0" }}>
            <PlusIcon size={18} />
            Pick from All tasks
          </Link>
        </section>

        <div style={{ gridArea: "done" }}>
          <DoneToday tasks={data.doneToday} onCheck={onCheck} />
        </div>
      </main>
      {picks.length > 0 && (
        <div className="cta">
          <button type="button" className="btn pri full" onClick={() => void startFocus({ ids: picks, today })}>
            Start focus set
          </button>
        </div>
      )}
    </>
  );
}

const WEEK_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function DayWonBody({
  data,
  goals,
  today,
  streak,
  week,
  onPlanMore,
  onCheck,
}: {
  data: TodayData;
  goals: GoalRow[];
  today: string;
  streak: number;
  week: { day: string; count: number }[] | undefined;
  onPlanMore: () => void;
  onCheck: (task: Task, done: boolean) => void;
}) {
  const target = data.settings.dailyTarget;
  const wonDays = week?.filter((d) => d.count >= target).length ?? 0;
  return (
    <main className="scroll cols" style={{ gridTemplateAreas: "'won goals' 'won done'" }}>
      <section
        className="card"
        style={{ gridArea: "won", padding: "22px 20px 20px", borderColor: "var(--lime-line)", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="pill lime">
            <CheckIcon style={{ strokeWidth: 2.6 }} />
            Day won
          </span>
          <StreakPill streak={streak} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="num" style={{ fontFamily: "var(--fd)", fontSize: 64, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>
            {data.doneToday.length}
          </span>
          <span className="muted" style={{ fontSize: 17 }}>
            done today
          </span>
        </div>
        {week && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}
            role="img"
            aria-label={`This week: ${wonDays} ${wonDays === 1 ? "day" : "days"} won`}
          >
            {week.map((d, i) => (
              <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: "100%",
                    maxWidth: 36,
                    height: 36,
                    borderRadius: 12,
                    ...(d.count >= target ? { background: "var(--lime)" } : { background: "transparent", border: "1.5px dashed var(--s3)" }),
                  }}
                />
                <span className="small muted">{WEEK_LETTERS[i]}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <GoalsSection goals={goals} today={today} prefs={data.settings} />

      <section style={{ gridArea: "done", display: "flex", flexDirection: "column", gap: 10 }}>
        {data.allTasksCount > 0 && (
          <button type="button" className="card row" onClick={onPlanMore}>
            <span className="t">{data.allTasksCount} more in All tasks</span>
            <span className="btn sec sm">Plan more</span>
          </button>
        )}
        <DoneToday tasks={data.doneToday} onCheck={onCheck} />
      </section>
    </main>
  );
}
