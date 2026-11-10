import Link from "next/link";
import { CheckIcon, ChevronLeft, MonitorIcon } from "@/components/icons";

const STEPS = [
  { title: "Open Todo in Safari", hint: "On iPhone, use Safari. On Android, use Chrome." },
  { title: "Tap Share, then Add to Home Screen", hint: "On Android: menu, then Install app." },
  { title: "Open Todo from your home screen", hint: "You stay signed in." },
];

export default function InstallPage() {
  return (
    <>
      <div className="bar-top">
        <Link className="link" href="/settings" style={{ padding: "0 8px" }}>
          <ChevronLeft />
          Settings
        </Link>
      </div>

      <main className="scroll" style={{ gap: 28, paddingTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 4px" }}>
          <span
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "var(--lime)",
              color: "var(--lime-ink)",
              display: "grid",
              placeItems: "center",
              flex: "none",
              boxShadow: "0 10px 30px color-mix(in srgb, var(--lime) 25%, transparent)",
            }}
          >
            <CheckIcon size={40} style={{ strokeWidth: 2.8 }} />
          </span>
          <div>
            <h1 className="h2" style={{ fontSize: 26 }}>
              Put Todo on your phone
            </h1>
            <p className="muted small" style={{ margin: "6px 0 0" }}>
              Opens full screen, stays signed in.
            </p>
          </div>
        </div>

        <ol className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {STEPS.map((step, i) => (
            <li key={step.title} className="row" style={{ alignItems: "flex-start", padding: "16px 14px", gap: 14 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--s3)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--fd)",
                  fontWeight: 700,
                  flex: "none",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{step.title}</div>
                <div className="small muted" style={{ marginTop: 4 }}>
                  {step.hint}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="banner">
          <MonitorIcon style={{ color: "var(--tx2)" }} />
          <span style={{ flex: 1, fontSize: 15 }}>On your computer, sign in at the same address.</span>
        </div>
      </main>
    </>
  );
}
