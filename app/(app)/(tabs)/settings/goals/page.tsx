"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { BackLink } from "@/components/settings/controls";
import { daysRule, WEEK } from "@/components/settings/goal-days";
import { FlameIcon, PlusIcon } from "@/components/icons";
import { api } from "@/convex/_generated/api";
import { useToday } from "@/hooks/use-today";
import { weekOf } from "@/lib/day";

const WEEKDAYS = WEEK.slice(1, 6);

function listNames(names: string[]) {
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function weekLabel(met: boolean[]) {
  const days = listNames(WEEKDAYS.filter((_, i) => met[i]).map((d) => d.name));
  return days ? `Met ${days}` : "Not met yet this week";
}

export default function GoalsPage() {
  const { today } = useToday();
  const goals = useQuery(api.goals.list, { days: weekOf(today).slice(1, 6) });
  return (
    <>
      <header className="head">
        <div>
          <BackLink href="/settings" label="Settings" />
          <h1 className="h1">Daily goals</h1>
        </div>
        <div className="head-actions">
          <Link className="iconbtn lime" href="/settings/goals/new" aria-label="Add a goal">
            <PlusIcon />
          </Link>
        </div>
      </header>

      <main className="scroll" aria-busy={!goals}>
        {goals?.map(({ goal, met, streak }) => {
          return (
            <Link
              key={goal._id}
              className="card"
              href={`/settings/goals/${goal._id}`}
              style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16, textDecoration: "none", color: "var(--tx)" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="h3">{goal.title}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {[goal.paused ? "Paused" : daysRule(goal.days), goal.detail].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {streak > 0 && (
                  <span className="pill amber">
                    <FlameIcon />
                    {streak} {streak === 1 ? "day" : "days"}
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }} role="img" aria-label={weekLabel(met)}>
                {WEEKDAYS.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ width: "100%", height: 10, borderRadius: 5, background: met[i] ? "var(--lime)" : "var(--s3)" }} />
                    <span className="small muted">{d.letter}</span>
                  </div>
                ))}
              </div>
            </Link>
          );
        })}

        {goals?.length === 0 && (
          <p className="muted" style={{ margin: "0 4px", fontSize: 16, lineHeight: 1.5 }}>
            A daily goal is something you do every day, like making your calls. It comes back each morning on the days you
            pick, so you can check it off again.
          </p>
        )}
        <Link className="card row" href="/settings/goals/new" style={{ borderStyle: "dashed", background: "none", color: "var(--tx2)" }}>
          <PlusIcon style={{ color: "var(--lime-tx)" }} />
          <span className="t" style={{ color: "var(--tx2)" }}>
            Add a goal
          </span>
        </Link>
      </main>
    </>
  );
}
