"use client";

import { Menu } from "@base-ui/react/menu";
import { useMutation } from "convex/react";
import type { ReactElement } from "react";
import { api } from "@/convex/_generated/api";
import { ArrowDown, ArrowUp, CalendarIcon, CheckIcon, ClockIcon, MinusIcon, SunIcon, TrashIcon } from "@/components/icons";
import { PRIORITY_LABEL, PriorityDot } from "@/components/ui-todo";
import { showToast } from "@/lib/reward";
import { isOnToday, type Task } from "@/components/tasks/when";

/** Soft delete with an Undo toast. */
export function useDeleteTask() {
  const remove = useMutation(api.tasks.remove);
  const restore = useMutation(api.tasks.restore);
  return async (task: Task) => {
    await remove({ id: task._id });
    showToast(`Deleted “${task.title}”`, {
      action: { label: "Undo", onClick: () => void restore({ id: task._id }) },
    });
  };
}

export function useAddToToday() {
  const addToToday = useMutation(api.tasks.addToToday);
  return async (task: Task, today: string) => {
    await addToToday({ id: task._id, today });
    showToast("Added to Today", { icon: <CheckIcon size={18} style={{ strokeWidth: 2.6 }} />, duration: 2000 });
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
  const onToday = isOnToday(task, today);

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
