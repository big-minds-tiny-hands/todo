"use client";

import { useParams } from "next/navigation";
import { TaskDetail } from "@/components/tasks/task-detail";
import type { Id } from "@/convex/_generated/dataModel";

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  return <TaskDetail id={id as Id<"tasks">} />;
}
