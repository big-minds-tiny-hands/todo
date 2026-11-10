"use client";

import { Drawer } from "@base-ui/react/drawer";
import { useMutation } from "convex/react";
import { useReducer } from "react";
import { api } from "@/convex/_generated/api";
import { CheckIcon, ClockIcon } from "@/components/icons";
import { SheetFrame } from "@/components/ui-todo";
import { clockLabel, lengthLabel } from "@/lib/day";
import { showToast } from "@/lib/reward";
import type { Task } from "./view";

// "Not yet" holds for the rest of the day on this device, across reloads and app launches.
const dismissedByDay = new Map<string, Set<string>>();
const storageKey = (day: string) => `todo:not-yet:${day}`;

function dismissedOn(day: string): Set<string> {
  let set = dismissedByDay.get(day);
  if (!set) {
    set = new Set<string>();
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey(day)) ?? "[]");
      if (Array.isArray(saved)) saved.forEach((id) => typeof id === "string" && set!.add(id));
    } catch {
      // Storage can be blocked (private mode). The in-memory set still works for this visit.
    }
    dismissedByDay.set(day, set);
  }
  return set;
}

export function useDismissedSlots(day: string) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const set = typeof window === "undefined" ? new Set<string>() : dismissedOn(day);
  return {
    dismissed: set as ReadonlySet<string>,
    dismiss: (id: string) => {
      set.add(id);
      try {
        window.localStorage.setItem(storageKey(day), JSON.stringify([...set]));
      } catch {
        // Ignored: see dismissedOn.
      }
      rerender();
    },
  };
}

/** "Did you do this?" after a time slot passes. Meetings ask whether they happened. */
export function TimeCheck({
  task,
  today,
  onDone,
  onDismiss,
}: {
  task: Task;
  today: string;
  onDone: (task: Task) => void;
  onDismiss: (id: string) => void;
}) {
  const removeFromToday = useMutation(api.tasks.removeFromToday);
  const markMissed = useMutation(api.tasks.markMissed);
  const meeting = task.kind === "meeting";
  const when = [clockLabel(task.startTime!), lengthLabel(task.lengthMin)].filter(Boolean).join(" · ");

  function moveToAllTasks() {
    onDismiss(task._id);
    void removeFromToday({ id: task._id, today });
    showToast("Moved to All tasks", { duration: 2000 });
  }

  function missed() {
    onDismiss(task._id);
    void markMissed({ id: task._id, today });
  }

  return (
    <SheetFrame open onOpenChange={(open) => !open && onDismiss(task._id)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 6 }}>
            <span className="pill num" style={{ alignSelf: "flex-start" }}>
              <ClockIcon />
              {when}
            </span>
            <Drawer.Title className="h1" style={{ fontSize: 30 }}>
              {task.title}
            </Drawer.Title>
            <Drawer.Description className="muted" style={{ margin: 0, fontSize: 17 }}>
              {meeting ? "Did this happen?" : "Did you do this?"}
            </Drawer.Description>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="btn pri full" style={{ height: 58, fontSize: 17 }} onClick={() => onDone(task)} autoFocus>
              <CheckIcon style={{ strokeWidth: 2.6 }} />
              {meeting ? "It happened" : "Yes, done"}
            </button>
            {meeting ? (
              <button type="button" className="btn sec full" onClick={missed}>
                Missed it
              </button>
            ) : (
              <>
                <button type="button" className="btn sec full" onClick={() => onDismiss(task._id)}>
                  Not yet
                </button>
                <button type="button" className="btn text full" onClick={moveToAllTasks}>
                  Move to All tasks
                </button>
              </>
            )}
          </div>
    </SheetFrame>
  );
}
