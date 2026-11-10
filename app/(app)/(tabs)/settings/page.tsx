"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink, Seg, Stepper, ThemeSeg } from "@/components/settings/controls";
import { ChevronRight, PhoneIcon } from "@/components/icons";
import { Sheet, Toggle } from "@/components/ui-todo";
import { api } from "@/convex/_generated/api";
import { useToday } from "@/hooks/use-today";
import { authClient } from "@/lib/auth-client";
import { weekOf } from "@/lib/day";

const FOCUS_SIZES = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: n }));

const CELEBRATIONS = [
  { key: "sounds", label: "Sounds" },
  { key: "haptics", label: "Haptics" },
  { key: "confetti", label: "Confetti" },
] as const;

const tasksLabel = (n: number) => `${n} task${n === 1 ? "" : "s"}`;

export default function SettingsPage() {
  const router = useRouter();
  const { today } = useToday();
  const settings = useQuery(api.settings.get);
  const user = useQuery(api.auth.getCurrentUser);
  const goals = useQuery(api.goals.list, { days: weekOf(today).slice(1, 6) });
  const update = useMutation(api.settings.update).withOptimisticUpdate((store, patch) => {
    const current = store.getQuery(api.settings.get, {});
    if (current) store.setQuery(api.settings.get, {}, { ...current, ...patch });
  });
  const [targetOpen, setTargetOpen] = useState(false);

  async function signOut() {
    await authClient.signOut();
    router.replace("/sign-in");
  }

  return (
    <>
      <header className="head">
        <div>
          <BackLink href="/" label="Today" />
          <h1 className="h1">Settings</h1>
        </div>
      </header>

      <main className="scroll cols" style={{ gridTemplateAreas: "'focus reward' 'focus appearance' 'goals account'" }} aria-busy={!settings}>
        <section style={{ gridArea: "focus" }}>
          <h2 className="label">
            <span>Focus</span>
          </h2>
          <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <span className="fl">Tasks in a focus set</span>
              <Seg label="Tasks in a focus set" options={FOCUS_SIZES} value={settings?.focusSize} onChange={(focusSize) => update({ focusSize })} />
            </div>
          </div>
          <div className="card" style={{ marginTop: 10 }}>
            <button type="button" className="row" onClick={() => setTargetOpen(true)} disabled={!settings}>
              <span className="t">Daily target</span>
              <span className="v">{settings && tasksLabel(settings.dailyTarget)}</span>
            </button>
            <div className="row">
              <span className="t">Day ends at</span>
              <span className="v">Midnight</span>
            </div>
          </div>
        </section>

        <section style={{ gridArea: "goals" }}>
          <h2 className="label">
            <span>Daily goals</span>
          </h2>
          <div className="card">
            <Link className="row" href="/settings/goals">
              <span className="t">Manage daily goals</span>
              <span className="v num">{goals?.length}</span>
              <ChevronRight style={{ color: "var(--tx3)" }} />
            </Link>
          </div>
        </section>

        <section style={{ gridArea: "reward" }}>
          <h2 className="label">
            <span>Celebrations</span>
          </h2>
          <div className="card">
            {CELEBRATIONS.map(({ key, label }) => (
              <div key={key} className="row">
                <span className="t">{label}</span>
                {settings && <Toggle on={settings[key]} label={label} onChange={(on) => update({ [key]: on })} />}
              </div>
            ))}
          </div>
        </section>

        <section style={{ gridArea: "appearance" }}>
          <h2 className="label">
            <span>Appearance</span>
          </h2>
          <div className="card" style={{ padding: 14 }}>
            <ThemeSeg />
          </div>
        </section>

        <section style={{ gridArea: "account" }}>
          <h2 className="label">
            <span>Account</span>
          </h2>
          <div className="card">
            <div className="row">
              <span className="avatar" aria-hidden="true">
                {user?.name.trim()[0]?.toUpperCase() ?? "·"}
              </span>
              <span className="t">{user?.name}</span>
            </div>
            <Link className="row" href="/install">
              <PhoneIcon style={{ color: "var(--tx2)" }} />
              <span className="t">Install on your phone</span>
              <ChevronRight style={{ color: "var(--tx3)" }} />
            </Link>
          </div>
          <button type="button" className="btn danger" style={{ marginTop: 8, padding: "0 4px" }} onClick={signOut}>
            Sign out
          </button>
        </section>
      </main>

      {settings && (
        <Sheet open={targetOpen} onOpenChange={setTargetOpen} title="Daily target">
          <Stepper
            value={settings.dailyTarget}
            min={1}
            max={20}
            unit={settings.dailyTarget === 1 ? "task" : "tasks"}
            label="daily target"
            onChange={(dailyTarget) => update({ dailyTarget })}
          />
          <p className="muted" style={{ margin: 0, textAlign: "center" }}>
            Finish this many tasks to win the day.
          </p>
          <button type="button" className="btn pri full" onClick={() => setTargetOpen(false)}>
            Done
          </button>
        </Sheet>
      )}
    </>
  );
}
