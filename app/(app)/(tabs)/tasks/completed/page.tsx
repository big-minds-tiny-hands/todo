"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { BackLink } from "@/components/settings/controls";
import type { Task } from "@/components/tasks/when";
import { clockOf } from "@/components/today/view";
import { Check } from "@/components/ui-todo";
import { api } from "@/convex/_generated/api";
import { useToday } from "@/hooks/use-today";
import { shortDate } from "@/lib/day";
import { placeOf } from "@/lib/placement";
import { showToast } from "@/lib/reward";

function doneDayLabel(day: string, today: string, yesterday: string) {
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return shortDate(day);
}

/** Tasks in runs of one done day each, keeping the newest-first order. */
function byDoneDay(tasks: Task[]) {
  const days = new Map<string, Task[]>();
  for (const task of tasks) days.set(task.doneDay!, [...(days.get(task.doneDay!) ?? []), task]);
  return [...days];
}

export default function CompletedPage() {
  const { today, yesterday } = useToday();
  const tasks = useQuery(api.tasks.completed);
  const setDone = useMutation(api.tasks.setDone);

  function reopen(task: Task) {
    void setDone({ id: task._id, done: false, today });
    // A task finished on its Today day reopens on Today; one from an earlier day goes back to All tasks.
    showToast(placeOf(task, today).kind === "today" ? "Back on Today" : "Back in All tasks", { duration: 3000 });
  }

  return (
    <>
      <header className="head">
        <div>
          <BackLink href="/tasks" label="All tasks" />
          <h1 className="h1">Completed</h1>
        </div>
      </header>

      <main className="scroll" aria-busy={tasks === undefined}>
        {tasks?.length === 0 && (
          <div className="empty">
            <div className="empty-art">
              <CheckIcon />
            </div>
            <h2 className="h2">Nothing completed yet</h2>
          </div>
        )}
        {tasks &&
          byDoneDay(tasks).map(([day, done]) => (
            <section key={day}>
              <h2 className="label">
                <span>{doneDayLabel(day, today, yesterday)}</span>
                <span className="num">{done.length}</span>
              </h2>
              <div className="card">
                {done.map((task) => (
                  <div key={task._id} className="task done">
                    <Check checked onChange={() => reopen(task)} label={`Undo ${task.title}`} />
                    <Link className="t" href={`/task/${task._id}`} style={{ textDecoration: "none" }}>
                      <div className="tt">{task.title}</div>
                      <div className="m">{task.doneAt ? `Done ${clockOf(task.doneAt)}` : "Done"}</div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </main>
    </>
  );
}
