"use client";

import { Menu } from "@base-ui/react/menu";
import type { OptimisticLocalStore } from "convex/browser";
import { useMutation } from "convex/react";
import type { ReactElement } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowDown, ArrowUp, CalendarIcon, CheckIcon, ClockIcon, MinusIcon, SunIcon, TrashIcon } from "@/components/icons";
import { PRIORITY_LABEL, PriorityDot } from "@/components/ui-todo";
import { showToast } from "@/lib/reward";
import type { Task } from "@/components/tasks/when";
import { placeOf } from "@/lib/placement";

/** Takes a task out of All tasks at once, so a swiped or deleted row leaves the list without waiting on the server. */
function leaveAllTasks(store: OptimisticLocalStore, id: Id<"tasks">, onToday: boolean) {
  for (const { args, value } of store.getAllQueries(api.tasks.all)) {
    if (!value || ![...value.pool, ...value.planned].some((t) => t._id === id)) continue;
    store.setQuery(api.tasks.all, args, {
      ...value,
      pool: value.pool.filter((t) => t._id !== id),
      planned: value.planned.filter((t) => t._id !== id),
      onTodayCount: value.onTodayCount + (onToday ? 1 : 0),
    });
  }
}

/** Soft delete with an Undo toast. The toast shows at once; Undo waits for the delete to land, then restores. */
export function useDeleteTask() {
  const remove = useMutation(api.tasks.remove).withOptimisticUpdate((store, { id }) => leaveAllTasks(store, id, false));
  const restore = useMutation(api.tasks.restore);
  return (task: Task) => {
    const removing = remove({ id: task._id });
    showToast(`Deleted “${task.title}”`, {
      action: { label: "Undo", onClick: () => void removing.then(() => restore({ id: task._id })) },
    });
    return removing;
  };
}

/** Puts a task on Today with an Undo toast. Undo waits for the add to land, then takes the task off Today. */
export function useAddToToday() {
  const addToToday = useMutation(api.tasks.addToToday).withOptimisticUpdate((store, { id }) => leaveAllTasks(store, id, true));
  const removeFromToday = useMutation(api.tasks.removeFromToday);
  return (task: Task, today: string) => {
    const adding = addToToday({ id: task._id, today });
    showToast("Added to Today", {
      icon: <CheckIcon size={18} style={{ strokeWidth: 2.6 }} />,
      duration: 4000,
      action: { label: "Undo", onClick: () => void adding.then(() => removeFromToday({ id: task._id, today })) },
    });
    return adding;
  };
}

/**
 * Actions for one task. Opens from a trigger (task detail) or at an anchor element (a long-pressed row).
 * Priority and move keep the menu open so several steps can be taken in a row.
 */
export function TaskActionsMenu({
  task,
  today,
  open,
  onOpenChange,
  anchor,
  trigger,
  onPickDay,
  onPickTime,
  onDeleted,
  canMoveUp = true,
  canMoveDown = true,
}: {
  task: Task;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor?: Element | null;
  trigger?: ReactElement;
  onPickDay: () => void;
  onPickTime: () => void;
  onDeleted?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const update = useMutation(api.tasks.update);
  const move = useMutation(api.tasks.move);
  const removeFromToday = useMutation(api.tasks.removeFromToday);
  const addToToday = useAddToToday();
  const deleteTask = useDeleteTask();
  const onToday = placeOf(task, today).kind === "today";

  return (
    <Menu.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Menu.Trigger render={trigger} />}
      <Menu.Portal>
        <Menu.Backdrop className="scrim" />
        <Menu.Positioner anchor={anchor ?? undefined} side="bottom" align="end" sideOffset={6} collisionPadding={12} style={{ zIndex: 41 }}>
          <Menu.Popup className="menu" aria-label={task.title} style={{ width: 272 }}>
            {onToday ? (
              <Menu.Item className="mi" onClick={() => void removeFromToday({ id: task._id, today })}>
                <MinusIcon />
                Remove from Today
              </Menu.Item>
            ) : (
              <Menu.Item className="mi" onClick={() => void addToToday(task, today)}>
                <SunIcon />
                Add to Today
              </Menu.Item>
            )}
            <Menu.Item className="mi" onClick={onPickDay}>
              <CalendarIcon />
              Put on a day
            </Menu.Item>
            <Menu.Item className="mi" onClick={onPickTime}>
              <ClockIcon />
              Set a time
            </Menu.Item>
            <hr />
            <div className="seg" role="radiogroup" aria-label="Priority" style={{ margin: "4px 6px", background: "var(--s1)" }}>
              {(["high", "normal", "low"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={task.priority === p}
                  className={task.priority === p ? "on" : undefined}
                  onClick={() => void update({ id: task._id, priority: p })}
                >
                  <PriorityDot priority={p} />
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, margin: "4px 6px" }}>
              <button type="button" className="btn sec sm" style={{ flex: 1 }} disabled={!canMoveUp} onClick={() => void move({ id: task._id, direction: "up" })}>
                <ArrowUp size={16} />
                Move up
              </button>
              <button type="button" className="btn sec sm" style={{ flex: 1 }} disabled={!canMoveDown} onClick={() => void move({ id: task._id, direction: "down" })}>
                <ArrowDown size={16} />
                Move down
              </button>
            </div>
            <hr />
            <Menu.Item
              className="mi danger"
              onClick={async () => {
                await deleteTask(task);
                onDeleted?.();
              }}
            >
              <TrashIcon />
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
