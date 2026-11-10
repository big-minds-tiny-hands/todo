"use client";

import { createPortal } from "react-dom";
import { CheckIcon, FlameIcon } from "@/components/icons";

const PIECES: [number, number, number, number, number, string][] = [
  [12, 14, 10, 4, 18, "var(--lime)"], [78, 10, 8, 8, -24, "var(--amber)"], [30, 22, 6, 14, 40, "var(--tx)"],
  [88, 26, 12, 4, 60, "var(--lime)"], [8, 36, 8, 8, 12, "var(--amber)"], [64, 18, 5, 12, -40, "var(--lime)"],
  [46, 8, 10, 4, 75, "var(--amber)"], [20, 62, 10, 4, -15, "var(--amber)"], [84, 58, 6, 14, 28, "var(--lime)"],
  [6, 72, 7, 7, 45, "var(--tx)"], [92, 72, 10, 4, -60, "var(--amber)"], [70, 66, 8, 8, 20, "var(--lime)"],
  [38, 74, 5, 12, -30, "var(--lime)"], [56, 30, 6, 6, 0, "var(--tx)"],
];

export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map(([x, y, w, h, r, c], i) => (
        <i
          key={i}
          style={{ left: `${x}%`, top: `${y}%`, width: w, height: h, background: c, transform: `rotate(${r}deg)`, animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

/** Full-screen moment when a focus set is finished. */
export function FocusDone({
  doneToday,
  streak,
  confetti,
  onNext,
  onClose,
}: {
  doneToday: number;
  streak: number;
  confetti: boolean;
  onNext: () => void;
  onClose: () => void;
}) {
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="focus-done-title" style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)", overflow: "auto" }}>
      {confetti && <Confetti />}
      <div className="phone center" style={{ background: "transparent" }}>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 28px 24px", gap: 18, position: "relative" }}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: "50%",
              background: "var(--lime)",
              color: "var(--lime-ink)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 0 14px rgba(200, 242, 90, 0.12), 0 0 0 30px rgba(200, 242, 90, 0.05)",
              animation: "check-pop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.3)",
            }}
          >
            <CheckIcon size={64} style={{ strokeWidth: 2.6 }} />
          </div>
          <p className="eyebrow num" style={{ margin: "18px 0 0" }}>
            Set done · {time}
          </p>
          <h1 className="h1" id="focus-done-title" style={{ fontSize: 40 }}>
            Focus set done
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {streak > 0 && (
              <span className="pill amber">
                <FlameIcon />
                {streak}-day streak
              </span>
            )}
            <span className="pill num">{doneToday} done today</span>
          </div>
        </main>
        <div className="cta" style={{ paddingBottom: 34, position: "relative" }}>
          <button className="btn pri full" onClick={onNext} autoFocus>
            Pick the next set
          </button>
          <button className="btn text full" onClick={onClose}>
            Take a break
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
