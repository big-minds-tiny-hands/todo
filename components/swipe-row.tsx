"use client";

import { animate, motion, useDragControls, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { useRef, type ReactNode } from "react";

export type SwipeAction = {
  /** Shown on the revealed layer and read by nothing else: every swipe action also has a button or menu item. */
  label: string;
  icon: ReactNode;
  tone: "lime" | "red" | "neutral";
  run: () => void;
  /** The row leaves the list when the action runs, so it slides out instead of springing back. */
  leaves?: boolean;
};

const COMMIT_SHARE = 0.35;
const COMMIT_VELOCITY = 600;

/**
 * A row that follows the finger sideways. Right reveals `right` (toward Today or done), left reveals `left`
 * (away: All tasks or delete). Touch and pen only; a mouse keeps the row's buttons and menus.
 * While the finger is down the row is the finger; on release a spring seeded with its velocity finishes the motion.
 */
export function SwipeRow({ right, left, children }: { right?: SwipeAction; left?: SwipeAction; children: ReactNode }) {
  const x = useMotionValue(0);
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const width = () => box.current?.offsetWidth ?? 360;

  // The action layers are derived from the row's position, so they stay in step mid-gesture and on reversal.
  const rightOpacity = useTransform(x, [0, 24], [0, 1]);
  const leftOpacity = useTransform(x, [-24, 0], [1, 0]);
  const rightScale = useTransform(x, (v) => (v >= width() * COMMIT_SHARE ? 1 : 0.75));
  const leftScale = useTransform(x, (v) => (v <= -width() * COMMIT_SHARE ? 1 : 0.75));

  const spring = (velocity: number) => ({ type: "spring" as const, velocity, bounce: reduce ? 0 : 0.18, duration: 0.45 });

  function release(_: PointerEvent, info: PanInfo) {
    const dx = info.offset.x;
    const vx = info.velocity.x;
    const share = width() * COMMIT_SHARE;
    const action = dx > 0 ? right : left;
    const commits = action && (Math.abs(dx) > share || (Math.abs(vx) > COMMIT_VELOCITY && Math.sign(vx) === Math.sign(dx)));
    if (!action || !commits) {
      animate(x, 0, spring(vx));
      return;
    }
    // Lets one-time swipe tips know the user has found the gesture.
    window.dispatchEvent(new Event("todo:swiped"));
    if (action.leaves) {
      const out = Math.sign(dx) * width() * 1.05;
      void animate(x, out, { type: "spring", velocity: vx, bounce: 0, duration: 0.3 }).then(() => {
        action.run();
        // The list drops the row. If it stays (the save failed or was undone at once), bring it back.
        window.setTimeout(() => animate(x, 0, spring(0)), 1500);
      });
      return;
    }
    action.run();
    animate(x, 0, spring(vx));
  }

  if (!right && !left) return <>{children}</>;

  return (
    <div ref={box} className="swipe">
      {right && (
        <motion.div className={`swipe-act right ${right.tone}`} style={{ opacity: rightOpacity }} aria-hidden="true">
          <motion.span style={{ scale: rightScale }}>{right.icon}</motion.span>
          {right.label}
        </motion.div>
      )}
      {left && (
        <motion.div className={`swipe-act left ${left.tone}`} style={{ opacity: leftOpacity }} aria-hidden="true">
          {left.label}
          <motion.span style={{ scale: leftScale }}>{left.icon}</motion.span>
        </motion.div>
      )}
      <motion.div
        className="swipe-fg"
        style={{ x, touchAction: "pan-y" }}
        drag="x"
        dragListener={false}
        dragControls={controls}
        dragMomentum={false}
        dragElastic={0.12}
        dragConstraints={{ left: left ? -10_000 : 0, right: right ? 10_000 : 0 }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return;
          dragged.current = false;
          controls.start(event);
        }}
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={release}
        onClickCapture={(event) => {
          // A swipe that ends over a link or button is not a tap on it.
          if (!dragged.current) return;
          dragged.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
