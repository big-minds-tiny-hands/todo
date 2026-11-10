"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon, CloseIcon, PhoneIcon } from "@/components/icons";

export type StartStep = 1 | 2 | 3;

/** The three steps to a first win. A step is done once the user's real data shows it, not when a tour says so. */
export function GettingStartedSteps({ step, focusSize }: { step: StartStep; focusSize: number }) {
  const steps = [
    { title: "Put your tasks in All tasks", detail: "Add everything you need to do. Nothing is due yet." },
    { title: "Pick today's focus set", detail: `Bring a few tasks into Today, then choose up to ${focusSize} to do first.` },
    { title: "Finish it", detail: "Check them off. That's your first win." },
  ];
  return (
    <ol className="steps">
      {steps.map((s, i) => {
        const n = (i + 1) as StartStep;
        const state = n < step ? "done" : n === step ? "now" : "later";
        return (
          <li key={s.title} className={`step ${state}`} aria-current={state === "now" ? "step" : undefined}>
            <span className="step-mark" aria-hidden="true">
              {state === "done" ? <CheckIcon size={16} style={{ strokeWidth: 2.8 }} /> : n}
            </span>
            <span className="step-text">
              <span className="step-title">
                {s.title}
                {state === "done" && <span className="sr-only"> (done)</span>}
              </span>
              {state === "now" && <span className="step-detail">{s.detail}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The steps in a card on the plan screen, until the first focus set is finished or the user hides it. */
export function GettingStartedCard({ step, focusSize, onHide }: { step: StartStep; focusSize: number; onHide: () => void }) {
  return (
    <section className="card start-card" aria-labelledby="start-title">
      <div className="start-head">
        <div>
          <h2 className="h3" id="start-title">
            Get started
          </h2>
          <p className="small muted" style={{ margin: "2px 0 0" }}>
            3 steps, about a minute
          </p>
        </div>
        <button type="button" className="btn text sm" onClick={onHide}>
          Hide
        </button>
      </div>
      <GettingStartedSteps step={step} focusSize={focusSize} />
    </section>
  );
}

function readFlag(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage can be blocked; the hint then shows again next visit, which is harmless.
  }
}

/** True on a touch-first device. Swipes are offered there; a mouse keeps buttons and menus. */
const coarse = () => window.matchMedia("(pointer: coarse)").matches;

/**
 * A one-line tip shown once per device on touch screens. It goes away for good when dismissed, or as soon as the
 * user performs what it teaches (a swipe fires "todo:swiped").
 */
export function OnceHint({ id, icon, children }: { id: string; icon?: ReactNode; children: ReactNode }) {
  const key = `todo:hint:${id}`;
  const [shown, setShown] = useState(() => coarse() && !readFlag(key));
  useEffect(() => {
    if (!shown) return;
    const done = () => {
      writeFlag(key);
      setShown(false);
    };
    window.addEventListener("todo:swiped", done);
    return () => window.removeEventListener("todo:swiped", done);
  }, [shown, key]);
  if (!shown) return null;
  return (
    <p className="hint" role="note">
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      <button
        type="button"
        className="iconbtn ghost"
        aria-label="Dismiss tip"
        onClick={() => {
          writeFlag(key);
          setShown(false);
        }}
      >
        <CloseIcon size={18} />
      </button>
    </p>
  );
}

/** After the first finished focus set, on a phone browser where Todo is not installed yet: one suggestion to install. */
export function InstallNudge() {
  const key = "todo:hint:install";
  const [shown, setShown] = useState(() => coarse() && !window.matchMedia("(display-mode: standalone)").matches && !readFlag(key));
  if (!shown) return null;
  const dismiss = () => {
    writeFlag(key);
    setShown(false);
  };
  return (
    <div className="banner" role="note" style={{ gridArea: "install" }}>
      <PhoneIcon style={{ color: "var(--lime-tx)" }} />
      <span style={{ flex: 1, fontSize: 15 }}>Put Todo on your home screen. It opens in one tap.</span>
      <Link className="btn sec sm" href="/install" onClick={dismiss}>
        Install
      </Link>
      <button type="button" className="iconbtn ghost" aria-label="Not now" onClick={dismiss}>
        <CloseIcon size={18} />
      </button>
    </div>
  );
}
