"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { CheckIcon, FlameIcon, TrophyIcon } from "@/components/icons";

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

/** What was just finished. A day won outranks a focus set finished on the same check. */
export type Moment = {
  kind: "focus" | "day";
  doneToday: number;
  /** The streak before and after this moment. They differ only when the day was just won. */
  streakFrom: number;
  streakTo: number;
  focusDoneToo: boolean;
  milestones: string[];
};

/** The streak number rolls from the old count to the new one, so the gain is seen, not only read. */
function StreakTick({ from, to }: { from: number; to: number }) {
  if (from === to) return <>{to}</>;
  return (
    <>
      <span className="tick" aria-hidden="true">
        <span className="out">{from}</span>
        <span className="in">{to}</span>
      </span>
      <span className="sr-only">{to}</span>
    </>
  );
}

/** Full-screen moment when a focus set is finished or the day is won. */
export function Celebration({
  moment,
  confetti,
  onLeave,
  onClose,
}: {
  moment: Moment;
  confetti: boolean;
  /** Runs as a link to another screen is followed, so the moment does not reappear on return. */
  onLeave: () => void;
  onClose: () => void;
}) {
  const day = moment.kind === "day";
  const time = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="moment-title" className="moment" style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)", overflow: "auto" }}>
      {confetti && <Confetti />}
      <div className="phone center" style={{ background: "transparent" }}>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px 28px 24px", gap: 18, position: "relative" }}>
          <div className={`moment-medal${day ? " day" : ""}`}>{day ? <FlameIcon size={60} /> : <CheckIcon size={64} style={{ strokeWidth: 2.6 }} />}</div>
          {day ? (
            <>
              <h1 className="h1" id="moment-title" style={{ fontSize: 44, marginTop: 18 }}>
                Day won
              </h1>
              <p className="moment-streak num">
                <StreakTick from={moment.streakFrom} to={moment.streakTo} />
                -day streak
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow num" style={{ margin: "18px 0 0" }}>
                Finished {time}
              </p>
              <h1 className="h1" id="moment-title" style={{ fontSize: 40 }}>
                Focus set done
              </h1>
            </>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {!day && moment.streakTo > 0 && (
              <span className="pill amber">
                <FlameIcon />
                {moment.streakTo}-day streak
              </span>
            )}
            <span className="pill num">{moment.doneToday} done today</span>
            {day && moment.focusDoneToo && (
              <span className="pill">
                <CheckIcon />
                Focus set done
              </span>
            )}
          </div>
          {moment.milestones.map((title) => (
            <p key={title} className="moment-milestone">
              <TrophyIcon />
              New milestone: {title}
            </p>
          ))}
        </main>
        <div className="cta" style={{ paddingBottom: 34, position: "relative" }}>
          {day ? (
            <>
              <button className="btn pri full" onClick={onClose} autoFocus>
                Keep going
              </button>
              <Link className="btn text full" href="/wins" onClick={onLeave}>
                See your wins
              </Link>
            </>
          ) : (
            <>
              <Link className="btn pri full" href="/focus/choose" onClick={onLeave} autoFocus>
                Pick the next focus set
              </Link>
              <button className="btn text full" onClick={onClose}>
                Take a break
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
