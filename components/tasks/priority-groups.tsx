import { Fragment, type ReactNode } from "react";
import { PRIORITY_LABEL, PriorityDot } from "@/components/ui-todo";
import { PRIORITIES, type Priority } from "@/lib/placement";

/** Tasks split by priority, each group under a dot, label and count. Empty groups are left out. */
export function PriorityGroups<T extends { _id: string; priority: Priority }>({
  tasks,
  heading: Heading = "h2",
  children,
}: {
  tasks: T[];
  heading?: "h2" | "h3";
  children: (task: T) => ReactNode;
}) {
  return PRIORITIES.map((priority) => {
    const items = tasks.filter((t) => t.priority === priority);
    if (items.length === 0) return null;
    return (
      <section key={priority}>
        <Heading className="label">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PriorityDot priority={priority} />
            {PRIORITY_LABEL[priority]}
          </span>
          <span className="num">{items.length}</span>
        </Heading>
        <div className="card">
          {items.map((task) => (
            <Fragment key={task._id}>{children(task)}</Fragment>
          ))}
        </div>
      </section>
    );
  });
}
