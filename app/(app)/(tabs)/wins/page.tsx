"use client";

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { BackLink } from "@/components/settings/controls";
import { WEEK } from "@/components/settings/goal-days";
import { CheckIcon, FlameIcon, LockIcon } from "@/components/icons";
import { api } from "@/convex/_generated/api";
import { useToday } from "@/hooks/use-today";
import { addDays, fromDay, lastDays, weekOf } from "@/lib/day";

type Wins = FunctionReturnType<typeof api.stats.wins>;

type Milestone = {
  id: string;
  title: string;
  kind: "lime" | "amber";
  earned: boolean;
  progress: { value: number; goal: number };
  when?: string;
};

function earnedLabel(day: string | null, today: string) {
  if (!day) return "Earned";
  if (day === today) return "Earned today";
  if (day === addDays(today, -1)) return "Earned yesterday";
  return `Earned ${fromDay(day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function milestones(wins: Wins, today: string): Milestone[] {
  const streakMilestone = (length: 5 | 10): Milestone => {
    const reached = length === 5 ? wins.milestones.streak5 : wins.milestones.streak10;
    return {
      id: `streak-${length}`,
      title: `${length}-day streak`,
      kind: "amber",
      earned: reached !== null,
      progress: { value: Math.min(wins.streak, length), goal: length },
      when: earnedLabel(reached, today),
    };
  };
  return [
    {
      id: "first-focus-set",
      title: "First focus set",
      kind: "lime",
      earned: wins.firstFocusSetDay !== null,
      progress: { value: 0, goal: 1 },
      when: earnedLabel(wins.firstFocusSetDay, today),
    },
    streakMilestone(5),
    streakMilestone(10),
    {
      id: "tasks-100",
      title: "100 tasks done",
      kind: "lime",
      earned: wins.milestones.tasks100 !== null,
      progress: { value: Math.min(wins.totalDone, 100), goal: 100 },
      when: earnedLabel(wins.milestones.tasks100, today),
    },
  ];
}

export default function WinsPage() {
  const { today } = useToday();
  const wins = useQuery(api.stats.wins, { days: lastDays(today, 60), week: weekOf(today), monthPrefix: today.slice(0, 7) });
  return (
    <>
      <header className="head">
        <div>
          <BackLink href="/" label="Today" />
          <h1 className="h1">Your wins</h1>
        </div>
      </header>
      {wins ? <WinsBody wins={wins} today={today} /> : <main className="scroll" aria-busy="true" aria-label="Loading" />}
    </>
  );
}

const SEEN_KEY = "todo:milestones-seen";

/** Milestones earned since the last visit on this device are marked New once, then remembered as seen. */
function useFreshMilestones(earnedIds: string[]) {
  const [seen] = useState<ReadonlySet<string> | null>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "null");
      return Array.isArray(saved) ? new Set(saved.filter((id) => typeof id === "string")) : null;
    } catch {
      return new Set(earnedIds);
    }
  });
  const key = earnedIds.join(",");
  useEffect(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify(key ? key.split(",") : []));
    } catch {
      // Storage can be blocked. Nothing is marked New then.
    }
  }, [key]);
  // A first visit marks nothing New: earlier milestones are not news.
  return (id: string) => seen !== null && !seen.has(id);
}

function WinsBody({ wins, today }: { wins: Wins; today: string }) {
  const miles = milestones(wins, today);
  const isFresh = useFreshMilestones(miles.filter((m) => m.earned).map((m) => m.id));
  const peak = Math.max(6, ...wins.week.map((d) => d.count));
  const nextDay = wins.doneToday >= wins.target ? "tomorrow" : "today";
  const tiles = [
    { label: "done this month", value: wins.monthDone },
    { label: "focus sets", value: wins.monthFocusSets },
    ...wins.goalTotals.map((g) => ({ label: g.title, value: g.total })),
  ];

  return (
    <main className="scroll cols" style={{ gridTemplateAreas: "'streak miles' 'week miles' 'tiles miles'" }}>
      <section className="card" style={{ gridArea: "streak", padding: 20, display: "flex", alignItems: "center", gap: 18, borderColor: "var(--amber-line)" }}>
        <div className="medal amber" style={{ width: 72, height: 72, borderRadius: 22 }}>
          <FlameIcon size={38} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="num" style={{ fontFamily: "var(--fd)", fontSize: 48, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {wins.streak}
            </span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>day streak</span>
          </div>
          <div className="small muted" style={{ marginTop: 6 }}>
            Best {wins.best} · Win {nextDay} for {wins.streak + 1}
          </div>
        </div>
      </section>

      <section style={{ gridArea: "week" }}>
        <h2 className="label">
          <span>This week</span>
          <b className="num">{wins.weekTotal} done</b>
        </h2>
        <div className="card" style={{ padding: "18px 16px 14px" }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8, alignItems: "end", height: 132 }}
            role="img"
            aria-label={`Done per day this week: ${wins.week.map((d, i) => `${WEEK[i].name} ${d.count}`).join(", ")}`}
          >
            {wins.week.map((d, i) => {
              const isToday = d.day === today;
              const fill = d.count === 0 ? "var(--s3)" : d.count >= wins.target ? "var(--lime)" : "var(--ring)";
              return (
                <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 6, height: "100%" }}>
                  <span className="small num" style={isToday ? { color: "var(--lime-tx)", fontWeight: 600 } : { color: "var(--tx2)" }}>
                    {d.count || ""}
                  </span>
                  <span
                    style={{
                      width: "100%",
                      maxWidth: 30,
                      borderRadius: 8,
                      height: Math.max(6, Math.round((d.count / peak) * 78)),
                      background: fill,
                      boxShadow: isToday ? "0 0 0 2px var(--bg), 0 0 0 4px var(--lime-line)" : undefined,
                    }}
                  />
                  <span className="small muted">{WEEK[i].letter}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ gridArea: "tiles", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {tiles.map((tile, i) => (
          <div key={i} className="tile">
            <span className="big">{tile.value}</span>
            <span className="small muted">{tile.label}</span>
          </div>
        ))}
      </section>

      <section style={{ gridArea: "miles" }}>
        <h2 className="label">
          <span>Milestones</span>
          <span className="num">
            {miles.filter((m) => m.earned).length} of {miles.length}
          </span>
        </h2>
        <div className="card">
          {miles.map((m) => (
            <div key={m.id} className="badge-m">
              <span className={`medal${m.earned ? (m.kind === "amber" ? " amber" : "") : " locked"}${m.earned && isFresh(m.id) ? " fresh" : ""}`} aria-hidden="true">
                {m.earned ? <CheckIcon /> : <LockIcon />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {m.title}
                  {m.earned && isFresh(m.id) && <span className="new-pill">New</span>}
                </div>
                {m.earned ? (
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {m.when}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <div className="bar" style={{ flex: 1 }}>
                      <i style={{ width: `${(m.progress.value / m.progress.goal) * 100}%` }} />
                    </div>
                    <span className="small muted num">
                      {m.progress.value}/{m.progress.goal}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
