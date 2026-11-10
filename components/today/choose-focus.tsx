"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LoadingBody } from "@/components/frames";
import { CloseIcon } from "@/components/icons";
import { PriorityDot } from "@/components/ui-todo";
import { useToday } from "@/hooks/use-today";
import { byPriority, openToday, pickMeta, type Task } from "./view";

/** Tasks picked for a focus set, in pick order. Picks that leave `available` drop out on their own. */
export function usePicks(available: Task[], limit: number, preset: Id<"tasks">[] = []) {
  const [chosen, setChosen] = useState<Id<"tasks">[] | null>(null);
  const ids = new Set(available.map((t) => t._id));
  const picks = (chosen ?? preset).filter((id) => ids.has(id)).slice(0, limit);
  function toggle(id: Id<"tasks">) {
    if (picks.includes(id)) setChosen(picks.filter((p) => p !== id));
    else if (picks.length < limit) setChosen([...picks, id]);
  }
  return { picks, toggle };
}

export function ChooseFocus() {
  const { today, yesterday } = useToday();
  const data = useQuery(api.tasks.today, { today, yesterday });
  if (!data) return <LoadingBody />;
  return <ChooseFocusBody tasks={openToday(data).sort(byPriority)} preset={data.focus.filter((t) => !t.done).map((t) => t._id)} limit={data.settings.focusSize} today={today} />;
}

function ChooseFocusBody({ tasks, preset, limit, today }: { tasks: Task[]; preset: Id<"tasks">[]; limit: number; today: string }) {
  const router = useRouter();
  const startFocus = useMutation(api.tasks.startFocus);
  const { picks, toggle } = usePicks(tasks, limit, preset);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      await startFocus({ ids: picks, today });
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bar-top">
        <Link className="iconbtn ghost" href="/" aria-label="Close">
          <CloseIcon />
        </Link>
        <span className="pill num">
          {picks.length} of {limit}
        </span>
        <span style={{ width: 44 }} />
      </div>
      <header style={{ padding: "8px 20px 20px" }}>
        <h1 className="h1">What comes first?</h1>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 16 }}>
          Pick up to {limit}. Finish them before anything else.
        </p>
      </header>

      <main className="scroll">
        {tasks.length > 0 && (
          <div className="card">
            {tasks.map((task) => {
              const n = picks.indexOf(task._id) + 1;
              return (
                <div key={task._id} className={n ? "task sel" : "task"}>
                  <PriorityDot priority={task.priority} />
                  <div className="t">
                    <div className="tt">{task.title}</div>
                    <div className="m">{pickMeta(task, today)}</div>
                  </div>
                  <button
                    type="button"
                    className={n ? "mark on" : "mark"}
                    aria-pressed={n > 0}
                    aria-label={`Focus on ${task.title}`}
                    disabled={!n && picks.length >= limit}
                    onClick={() => toggle(task._id)}
                  >
                    <span>{n || ""}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="cta" style={{ paddingBottom: 34 }}>
        <button type="button" className="btn pri full" disabled={picks.length === 0 || busy} onClick={start}>
          Start focus set
        </button>
        <Link className="btn text full" href="/">
          Skip for now
        </Link>
      </div>
    </>
  );
}
