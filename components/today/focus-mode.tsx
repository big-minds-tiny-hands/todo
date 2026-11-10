"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Celebration } from "@/components/celebration";
import { LoadingBody } from "@/components/frames";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { Check } from "@/components/ui-todo";
import { useToday } from "@/hooks/use-today";
import { lastDays, weekOf } from "@/lib/day";
import { reward } from "@/lib/reward";
import { StreakPill } from "./parts";
import { useCheck } from "./use-check";
import { useMoment } from "./use-moment";
import type { Task, TodayData } from "./view";

/** One focus task at a time, its checklist, and a big Done. */
export function FocusMode() {
  const router = useRouter();
  const { today, yesterday } = useToday();
  const data = useQuery(api.tasks.today, { today, yesterday });
  const wins = useQuery(api.stats.wins, { days: lastDays(today, 60), week: weekOf(today), monthPrefix: today.slice(0, 7) });
  const { moment, after, clear, leaveTo } = useMoment(data, wins, today);
  const { check } = useCheck(data, today, clear);
  const current = data?.focus.find((t) => !t.done);
  const streak = wins?.streak ?? 0;
  const leave = data !== undefined && !current && moment === null;

  useEffect(() => {
    if (leave) router.replace("/");
  }, [leave, router]);

  if (moment && data) {
    return (
      <Celebration
        moment={moment}
        confetti={data.settings.confetti}
        onNext={() => leaveTo("/focus/choose")}
        onWins={() => leaveTo("/wins")}
        onClose={() => leaveTo("/")}
      />
    );
  }
  if (!data || !current) return <LoadingBody />;

  function done(task: Task) {
    after(check(task, true));
  }

  return <FocusTask data={data} task={current} streak={streak} onDone={done} />;
}

function FocusTask({ data, task, streak, onDone }: { data: TodayData; task: Task; streak: number; onDone: (task: Task) => void }) {
  const setStep = useMutation(api.tasks.setStep).withOptimisticUpdate((store, { id, stepId, done }) => {
    for (const { args, value } of store.getAllQueries(api.tasks.today)) {
      if (!value) continue;
      const patch = (t: Task) =>
        t._id === id ? { ...t, checklist: t.checklist.map((s) => (s.id === stepId ? { ...s, done: done ?? s.done } : s)) } : t;
      store.setQuery(api.tasks.today, args, { ...value, focus: value.focus.map(patch) });
    }
  });
  const { focus } = data;
  const index = focus.findIndex((t) => t._id === task._id);
  const upNext = focus.find((t) => !t.done && t._id !== task._id);
  const steps = task.checklist;
  const stepsDone = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

  return (
    <>
      <div className="bar-top">
        <Link className="iconbtn ghost" href="/" aria-label="Leave focus mode">
          <CloseIcon />
        </Link>
        <div style={{ display: "flex", gap: 6 }} role="img" aria-label={`Task ${index + 1} of ${focus.length} in this focus set`}>
          {focus.map((t) => (
            <span
              key={t._id}
              style={{
                width: 28,
                height: 6,
                borderRadius: 3,
                background: t.done ? "var(--lime)" : t._id === task._id ? "var(--tx)" : "var(--s3)",
              }}
            />
          ))}
        </div>
        {streak > 0 ? <StreakPill streak={streak} short style={{ marginRight: 8 }} /> : <span style={{ width: 44 }} />}
      </div>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, padding: "24px 24px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="eyebrow" style={{ margin: 0, color: "var(--lime-tx)" }}>
            Focus · {index + 1} of {focus.length}
          </p>
          <h1 className="h1" style={{ fontSize: 40, lineHeight: 1.05 }}>
            {task.title}
          </h1>
        </div>

        {steps.length > 0 && (
          <section className="card" aria-label="Checklist">
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px 8px" }}>
              <div className="bar" style={{ flex: 1 }}>
                <i style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
              </div>
              <span className="small muted num">
                {stepsDone}/{steps.length}
              </span>
            </div>
            {steps.map((step) => {
              const isNext = step.id === nextStep?.id;
              return (
                <div key={step.id} className={["task", step.done && "done", isNext && "glow"].filter(Boolean).join(" ")} style={{ minHeight: 50 }}>
                  <Check
                    checked={step.done}
                    label={`Step: ${step.title}`}
                    onChange={(next) => {
                      if (next) reward(data.settings);
                      void setStep({ id: task._id, stepId: step.id, done: next });
                    }}
                  />
                  <div className="t">
                    <div className="tt" style={{ fontSize: 15 }}>
                      {step.title}
                    </div>
                  </div>
                  {isNext && <span className="pill lime">Next</span>}
                </div>
              );
            })}
          </section>
        )}
      </main>

      <div className="cta" style={{ paddingBottom: 34, gap: 8 }}>
        <button type="button" className="btn pri full lg" onClick={() => onDone(task)}>
          <CheckIcon style={{ width: 24, height: 24, strokeWidth: 2.6 }} />
          Done
        </button>
        {upNext && (
          <p className="small muted" style={{ margin: "4px 0 0", textAlign: "center" }}>
            Up next: {upNext.title}
          </p>
        )}
      </div>
    </>
  );
}
