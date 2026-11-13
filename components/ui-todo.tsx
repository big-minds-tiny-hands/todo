"use client";

import { Drawer } from "@base-ui/react/drawer";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CalendarIcon, CheckIcon, ListIcon, PlusIcon, SunIcon } from "@/components/icons";

/** Round check from the design: 44px target, 28px ring (36px when large). */
export function Check({
  checked,
  onChange,
  label,
  size,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      className={["check", checked && "on", size, pop && "pop", className].filter(Boolean).join(" ")}
      aria-pressed={checked}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!checked) {
          setPop(true);
          window.setTimeout(() => setPop(false), 420);
        }
        onChange(!checked);
      }}
    >
      <span>
        <CheckIcon />
      </span>
    </button>
  );
}

/** Counts the ring's gains while it stays on screen, so each one can play once. The first render plays nothing. */
function useRingGains(done: number, target: number) {
  const [seen, setSeen] = useState(done);
  const [plus, setPlus] = useState(0);
  const [ping, setPing] = useState(0);
  if (done !== seen) {
    if (done > seen) setPlus((n) => n + 1);
    if (seen < target && done >= target) setPing((n) => n + 1);
    setSeen(done);
  }
  return { plus, ping };
}

/** Daily progress: a small ring and "1 of 3 done", done today against the daily target. */
export function Ring({ done, target, href }: { done: number; target: number; href?: string }) {
  const circumference = 113;
  const offset = circumference * (1 - Math.min(1, target ? done / target : 0));
  const { plus, ping } = useRingGains(done, target);
  const className = `progress${done >= target ? " full" : ""}`;
  const content = (
    <>
      <span className="ring" aria-hidden="true">
        {ping > 0 && <span key={`ping-${ping}`} className="ping" />}
        {plus > 0 && (
          <span key={`plus-${plus}`} className="plus1">
            +1
          </span>
        )}
        <svg viewBox="0 0 44 44">
          <circle className="track" cx="22" cy="22" r="18" />
          <circle className="val" cx="22" cy="22" r="18" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
        </svg>
      </span>
      <span className="num">
        {done} of {target} done today
      </span>
    </>
  );
  return href ? (
    <Link className={className} href={href} aria-label={`${done} of ${target} done today. See your wins`}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}

/**
 * The frame every sheet shares: a bottom sheet on phone that follows a downward drag and closes on distance or a
 * flick, and a centered dialog from 768px. Base UI's Drawer brings focus trapping, Escape and the swipe physics.
 */
export function SheetFrame({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Backdrop className="scrim" />
        <Drawer.Viewport className="sheet-viewport">
          <Drawer.Popup className="sheet">
            <div className="grab" aria-hidden="true" />
            <Drawer.Content className="sheet-content">{children}</Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** A titled sheet with a close button. */
export function Sheet({
  open,
  onOpenChange,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SheetFrame open={open} onOpenChange={onOpenChange}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && <p className="eyebrow" style={{ margin: 0 }}>{eyebrow}</p>}
          <Drawer.Title className="h2">{title}</Drawer.Title>
        </div>
        <Drawer.Close className="iconbtn ghost" aria-label="Close">
          <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Drawer.Close>
      </div>
      {children}
    </SheetFrame>
  );
}

const TABS = [
  { href: "/", label: "Today", Icon: SunIcon, match: (p: string) => p === "/" || p.startsWith("/wins") },
  { href: "/tasks", label: "All tasks", Icon: ListIcon, match: (p: string) => p.startsWith("/tasks") },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon, match: (p: string) => p.startsWith("/calendar") },
];

export function TabBar({ allTasksCount }: { allTasksCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ href, label, Icon, match }) => {
        const on = match(pathname);
        return (
          <Link key={href} className={`tab${on ? " on" : ""}`} href={href} aria-current={on ? "page" : undefined}>
            <Icon />
            {label}
            {href === "/tasks" && allTasksCount ? <span className="badge">{allTasksCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The one small worded button every row action uses. `name` is the accessible name when it says more than the
 * words. It must contain the words, so voice control finds the button by what it shows (WCAG 2.5.3).
 */
export function RowAction({
  children,
  name,
  onClick,
  disabled,
}: {
  children: ReactNode;
  name?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="btn sec act" aria-label={name} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

/** "+ Today" on a row, and a disabled "On Today" for the moment after, while the sent row stays in place. */
export function SendToToday({ title, sent, onSend }: { title: string; sent: boolean; onSend: () => void }) {
  return sent ? (
    <RowAction name={`On Today: ${title}`} disabled onClick={() => {}}>
      <CheckIcon />
      On Today
    </RowAction>
  ) : (
    <RowAction name={`Add ${title} to Today`} onClick={onSend}>
      <PlusIcon />
      Today
    </RowAction>
  );
}

export function PriorityDot({ priority }: { priority: "high" | "normal" | "low" }) {
  return <span className={`pri ${priority}`} aria-hidden="true" />;
}

export const PRIORITY_LABEL = { high: "High", normal: "Normal", low: "Low" } as const;

export function PrioritySeg({
  value,
  onChange,
}: {
  value: "high" | "normal" | "low";
  onChange: (value: "high" | "normal" | "low") => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label="Priority">
      {(["high", "normal", "low"] as const).map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          className={value === p ? "on" : undefined}
          onClick={() => onChange(p)}
        >
          <PriorityDot priority={p} />
          {PRIORITY_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name }: { name?: string }) {
  return (
    <Link className="avatar" href="/settings" aria-label="Settings">
      {(name?.trim()[0] ?? "·").toUpperCase()}
    </Link>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}
