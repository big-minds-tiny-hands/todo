"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useToday } from "@/hooks/use-today";

const PRESETS = [
  { id: "demo", label: "Demo" },
  { id: "worst", label: "Worst case" },
  { id: "empty", label: "Empty" },
  { id: "one", label: "One" },
  { id: "huge", label: "1,000" },
] as const;

type Preset = (typeof PRESETS)[number]["id"];

/** Dev-only host for data switches. Replaces the signed-in account's data with a preset. */
export function DevDataDock() {
  const load = useMutation(api.devSeed.load);
  const { today } = useToday();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Preset | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (process.env.NEXT_PUBLIC_APP_ENVIRONMENT !== "development") return null;

  async function choose(preset: Preset) {
    setBusy(preset);
    setError(null);
    try {
      await load({ preset, today });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ position: "fixed", right: 12, bottom: "calc(96px + env(safe-area-inset-bottom))", zIndex: 70, fontFamily: "var(--ff)", maxWidth: "calc(100vw - 24px)" }}>
      {open ? (
        <div className="card" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, boxShadow: "var(--shadow)", width: 340, maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="small" style={{ fontWeight: 600 }}>Dev data</span>
            <button type="button" className="link" style={{ minHeight: 32, fontSize: 13 }} onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="seg" role="group" aria-label="Data preset" style={{ padding: 3 }}>
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => choose(p.id)} disabled={busy !== null} style={{ height: 34, fontSize: 12 }} className={busy === p.id ? "on" : undefined}>
                {p.label}
              </button>
            ))}
          </div>
          {error && <p className="err-text" style={{ fontSize: 12 }}>{error}</p>}
        </div>
      ) : (
        <button type="button" className="pill" onClick={() => setOpen(true)} style={{ border: "1px solid var(--line)", cursor: "pointer", height: 32 }}>
          Dev data
        </button>
      )}
    </div>
  );
}
