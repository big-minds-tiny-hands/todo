"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Stepper } from "@/components/settings/controls";
import { WEEK } from "@/components/settings/goal-days";
import { AlertIcon, CloseIcon, TrashIcon } from "@/components/icons";
import { Sheet, Toggle } from "@/components/ui-todo";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type GoalDraft = { title: string; detail: string; target: number; days: number[]; paused: boolean };

const NEW_GOAL: GoalDraft = { title: "", detail: "", target: 1, days: [1, 2, 3, 4, 5], paused: false };

function draftOf(goal: Doc<"dailyGoals">): GoalDraft {
  return { title: goal.title, detail: goal.detail ?? "", target: goal.target, days: goal.days, paused: goal.paused };
}

export default function GoalEditPage() {
  return (
    <Suspense fallback={<TopBar title="Goal" />}>
      <GoalEdit />
    </Suspense>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="bar-top">
      <Link className="iconbtn ghost" href="/settings/goals" aria-label="Close">
        <CloseIcon />
      </Link>
      <span className="h3">{title}</span>
      <span style={{ width: 44 }} />
    </div>
  );
}

function GoalEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const goal = useQuery(api.goals.get, isNew ? "skip" : { id: id as Id<"dailyGoals"> });

  if (isNew) return <GoalForm key="new" initial={NEW_GOAL} />;
  if (goal === undefined) return <TopBar title="Edit goal" />;
  if (goal === null) {
    return (
      <>
        <TopBar title="Edit goal" />
        <main className="empty">
          <p className="h3">Goal not found</p>
          <p className="muted" style={{ margin: 0 }}>
            It may have been deleted.
          </p>
          <Link className="btn sec" href="/settings/goals">
            Back to daily goals
          </Link>
        </main>
      </>
    );
  }
  return <GoalForm key={goal._id} goalId={goal._id} initial={draftOf(goal)} />;
}

function GoalForm({ goalId, initial }: { goalId?: Id<"dailyGoals">; initial: GoalDraft }) {
  const router = useRouter();
  const create = useMutation(api.goals.create);
  const update = useMutation(api.goals.update);
  const remove = useMutation(api.goals.remove);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<GoalDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const canSave = draft.title.trim() !== "" && draft.days.length > 0 && !busy;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.replace("/settings/goals");
    } catch (err) {
      setBusy(false);
      setError(err instanceof ConvexError ? String(err.data) : "Could not save this goal. Check your connection and try again.");
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    const fields = { ...draft, detail: draft.detail.trim() || undefined };
    void run(() => (goalId ? update({ id: goalId, ...fields }) : create(fields)));
  }

  function toggleDay(day: number) {
    set({ days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day].sort((a, b) => a - b) });
  }

  return (
    <>
      <TopBar title={goalId ? "Edit goal" : "New goal"} />

      <form id="goal-form" className="scroll" style={{ gap: 24, paddingTop: 12 }} onSubmit={save}>
        <div className="field">
          <label htmlFor="g-name">Goal</label>
          <input className="input" id="g-name" placeholder="Staff a case" value={draft.title} onChange={(e) => set({ title: e.target.value })} autoFocus={!goalId} />
        </div>

        <div className="field">
          <label htmlFor="g-detail">Detail (optional)</label>
          <input className="input" id="g-detail" placeholder="10-hour case" value={draft.detail} onChange={(e) => set({ detail: e.target.value })} />
        </div>

        <div className="field">
          <span className="fl">Target each day</span>
          <Stepper
            value={draft.target}
            min={1}
            max={20}
            unit={draft.target === 1 ? "time" : "times"}
            label="target"
            onChange={(target) => set({ target })}
          />
        </div>

        <div className="field">
          <span className="fl">Days</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }} role="group" aria-label="Days">
            {WEEK.map((d, i) => {
              const on = draft.days.includes(i);
              return (
                <button
                  key={d.name}
                  type="button"
                  className={on ? "chip on" : "chip"}
                  aria-pressed={on}
                  aria-label={d.name}
                  style={{ height: 44, padding: 0, justifyContent: "center" }}
                  onClick={() => toggleDay(i)}
                >
                  {d.letter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="row">
            <span className="t">Pause this goal</span>
            <Toggle on={draft.paused} label="Pause this goal" onChange={(paused) => set({ paused })} />
          </div>
        </div>

        {error && (
          <p className="err-text" role="alert">
            <AlertIcon />
            {error}
          </p>
        )}

        {goalId && (
          <button type="button" className="btn danger" style={{ alignSelf: "flex-start", padding: "0 4px" }} onClick={() => setConfirmDelete(true)}>
            <TrashIcon />
            Delete goal
          </button>
        )}
      </form>

      <div className="cta" style={{ paddingBottom: 34 }}>
        <button type="submit" form="goal-form" className="btn pri full" disabled={!canSave}>
          Save
        </button>
      </div>

      {goalId && (
        <Sheet open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this goal?">
          <p className="muted" style={{ margin: 0 }}>
            Its history is deleted too. You can&apos;t undo this.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              className="btn sec full"
              style={{ color: "var(--red)" }}
              disabled={busy}
              onClick={() => {
                setConfirmDelete(false);
                void run(() => remove({ id: goalId }));
              }}
            >
              <TrashIcon />
              Delete goal
            </button>
            <button type="button" className="btn text full" onClick={() => setConfirmDelete(false)}>
              Keep goal
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
