"use client";

import type { OptimisticUpdate } from "convex/browser";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CheckIcon } from "@/components/icons";
import { cheer, reward, showToast } from "@/lib/reward";
import type { Task, TodayData } from "./view";

/** Shows a check on Today at once, so it feels instant and still shows while offline. */
const showDoneAtOnce: OptimisticUpdate<FunctionArgs<typeof api.tasks.setDone>> = (store, { id, done, today }) => {
  for (const { args, value } of store.getAllQueries(api.tasks.today)) {
    if (!value || args.today !== today) continue;
    const task = [...value.focus, ...value.schedule, ...value.rest, ...value.doneToday].find((t) => t._id === id);
    if (!task) continue;
    const updated = { ...task, done, doneAt: done ? Date.now() : undefined, doneDay: done ? today : undefined };
    const swap = (t: Task) => (t._id === id ? updated : t);
    const others = value.doneToday.filter((t) => t._id !== id);
    store.setQuery(api.tasks.today, args, {
      ...value,
      focus: value.focus.map(swap),
      schedule: value.schedule.map(swap),
      rest: done ? value.rest.filter((t) => t._id !== id) : value.rest,
      doneToday: done ? [...others, updated] : others,
    });
  }
};

export type CheckResult = { focusLeft: number | null; doneToday: number };

/**
 * Check or uncheck a Today task with the full reward: pop, haptic, chime and a lime toast with Undo.
 * `pending` holds checks the server has not confirmed yet, shown as "Waiting to save".
 */
export function useCheck(data: TodayData | undefined, today: string, onUndo?: () => void) {
  const setDone = useMutation(api.tasks.setDone).withOptimisticUpdate(showDoneAtOnce);
  const [pending, setPending] = useState<ReadonlySet<Id<"tasks">>>(() => new Set());
  const [justChecked, setJustChecked] = useState<Id<"tasks"> | null>(null);

  function save(id: Id<"tasks">, done: boolean) {
    setPending((s) => new Set(s).add(id));
    void setDone({ id, done, today }).finally(() =>
      setPending((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      }),
    );
  }

  function check(task: Task, done: boolean): CheckResult | null {
    if (!data) return null;
    save(task._id, done);
    if (!done) {
      setJustChecked(null);
      return null;
    }
    const doneToday = data.doneToday.filter((t) => t._id !== task._id).length + 1;
    const target = data.settings.dailyTarget;
    const inFocus = data.focus.some((t) => t._id === task._id);
    const focusLeft = inFocus ? data.focus.filter((t) => !t.done && t._id !== task._id).length : null;
    reward(data.settings, focusLeft === 0 || doneToday === target);
    setJustChecked(task._id);
    window.setTimeout(() => setJustChecked((id) => (id === task._id ? null : id)), 4000);
    showToast(cheer(doneToday, target, focusLeft), {
      lime: true,
      icon: <CheckIcon size={20} style={{ strokeWidth: 2.6 }} />,
      action: {
        label: "Undo",
        onClick: () => {
          save(task._id, false);
          setJustChecked(null);
          onUndo?.();
        },
      },
    });
    return { focusLeft, doneToday };
  }

  return { check, pending, justChecked };
}
