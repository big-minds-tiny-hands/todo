"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UndoIcon } from "@/components/icons";
import { Disclosure } from "@/components/today/parts";
import { PRIORITY_LABEL, PriorityDot } from "@/components/ui-todo";
import { showToast } from "@/lib/reward";

/** Deleted tasks with Restore, so a delete stays reversible after its toast. Hidden when nothing is deleted. */
export function RecentlyDeleted() {
  const deleted = useQuery(api.tasks.recentlyDeleted);
  const restore = useMutation(api.tasks.restore);
  if (!deleted || deleted.length === 0) return null;
  return (
    <Disclosure id="recently-deleted" label={`Recently deleted (${deleted.length})`}>
      {deleted.map((task) => (
        <div key={task._id} className="task dim-text">
          <PriorityDot priority={task.priority} />
          <div className="t">
            <div className="tt">{task.title}</div>
            <div className="m">{PRIORITY_LABEL[task.priority]}</div>
          </div>
          <button
            type="button"
            className="btn sec sm"
            aria-label={`Restore ${task.title}`}
            onClick={() => {
              void restore({ id: task._id });
              showToast("Restored to All tasks", { duration: 2000 });
            }}
          >
            <UndoIcon size={18} />
            Restore
          </button>
        </div>
      ))}
    </Disclosure>
  );
}
