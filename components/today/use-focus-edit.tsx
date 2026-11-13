"use client";

import type { OptimisticLocalStore } from "convex/browser";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { UndoIcon } from "@/components/icons";
import { showToast } from "@/lib/reward";
import type { Task, TodayData } from "./view";

type Edit = (data: TodayData, task: Task) => TodayData;

/** Where a task that leaves the focus set but stays on Today shows: by its time slot, or with the rest. */
function withoutFocus(data: TodayData, task: Task): TodayData {
  const out = { ...task, focusDay: undefined, focusSet: undefined, focusSlot: undefined };
  const focus = data.focus.filter((t) => t._id !== task._id);
  if (task.startTime) return { ...data, focus, schedule: [...data.schedule, out].sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")) };
  return { ...data, focus, rest: [...data.rest, out] };
}

function offToday(data: TodayData, task: Task): TodayData {
  const keep = (list: Task[]) => list.filter((t) => t._id !== task._id);
  return { ...data, focus: keep(data.focus), schedule: keep(data.schedule), rest: keep(data.rest), allTasksCount: data.allTasksCount + 1 };
}

function intoFocus(data: TodayData, task: Task): TodayData {
  const keep = (list: Task[]) => list.filter((t) => t._id !== task._id);
  const slot = data.focus.reduce((max, t) => Math.max(max, (t.focusSlot ?? -1) + 1), 0);
  return { ...data, focus: [...data.focus, { ...task, focusSlot: slot }], schedule: keep(data.schedule), rest: keep(data.rest) };
}

/** Applies one edit to every cached Today query that holds the task, so the set changes before the server answers. */
function patchToday(store: OptimisticLocalStore, id: Id<"tasks">, edit: Edit) {
  for (const { args, value } of store.getAllQueries(api.tasks.today)) {
    const task = value && [...value.focus, ...value.schedule, ...value.rest].find((t) => t._id === id);
    if (value && task) store.setQuery(api.tasks.today, args, edit(value, task));
  }
}

/** Changes to a running focus set (number `set`). Each step that removes a task offers Undo. */
export function useFocusEdit(today: string, set: number) {
  const takeOut = useMutation(api.tasks.removeFromFocus).withOptimisticUpdate((store, { id }) => patchToday(store, id, withoutFocus));
  const sendBack = useMutation(api.tasks.removeFromToday).withOptimisticUpdate((store, { id }) => patchToday(store, id, offToday));
  const pick = useMutation(api.tasks.addToFocus).withOptimisticUpdate((store, { id }) => patchToday(store, id, intoFocus));

  function undoable(message: string, removing: Promise<null>, id: Id<"tasks">) {
    showToast(message, {
      icon: <UndoIcon size={18} />,
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () =>
          void removing
            .then(() => pick({ id, today, set }))
            .catch(() => showToast("Could not put it back. The focus set may be full.", { duration: 5000 })),
      },
    });
  }

  return {
    takeOut: (task: Task) => undoable("Moved to More today", takeOut({ id: task._id }), task._id),
    sendBack: (task: Task) => undoable("Back to All tasks", sendBack({ id: task._id, today }), task._id),
    pick: (task: Task) => void pick({ id: task._id, today, set }),
  };
}
