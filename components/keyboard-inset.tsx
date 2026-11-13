"use client";

import { useEffect } from "react";

const EDITABLE = "input, textarea, [contenteditable='true']";

/**
 * iOS Safari opens the keyboard over the page instead of resizing it, so a fixed bottom sheet and a field near the
 * bottom end up behind the keyboard. This publishes the hidden part of the screen as --kb (and the visible top as
 * --vv-top) for the CSS, and keeps the field being typed in on screen as the keyboard opens and as the text grows.
 */
export function KeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    let lastHeight = viewport.height;

    function focusedField() {
      const el = document.activeElement;
      return el instanceof HTMLElement && el.matches(EDITABLE) ? el : null;
    }

    /** Brings the end of the field, where the typing is, above the keyboard. */
    function reveal(field: HTMLElement) {
      // The sheet already sits above the keyboard and scrolls on its own.
      if (field.closest(".sheet")) return field.scrollIntoView({ block: "nearest" });
      const box = field.getBoundingClientRect();
      // A field taller than the visible part holds the caret somewhere inside; Safari keeps the caret in view itself.
      if (box.height > viewport!.height - 24) return;
      const overlap = box.bottom - (viewport!.offsetTop + viewport!.height - 12);
      if (overlap > 0) window.scrollBy(0, overlap);
    }

    function publish() {
      const next = Math.max(0, Math.round(window.innerHeight - viewport!.height - viewport!.offsetTop));
      root.style.setProperty("--kb", `${next}px`);
      root.style.setProperty("--vv-top", `${Math.round(viewport!.offsetTop)}px`);
    }

    /** Only a resize means the keyboard opened. Scrolling with it open moves the viewport and must not pull back. */
    function onResize() {
      publish();
      const opened = viewport!.height < lastHeight;
      lastHeight = viewport!.height;
      const field = focusedField();
      if (opened && field) requestAnimationFrame(() => reveal(field));
    }

    function onInput(event: Event) {
      const field = event.target;
      if (field instanceof HTMLElement && field.matches(EDITABLE)) reveal(field);
    }

    publish();
    viewport.addEventListener("resize", onResize);
    viewport.addEventListener("scroll", publish);
    document.addEventListener("input", onInput);
    return () => {
      viewport.removeEventListener("resize", onResize);
      viewport.removeEventListener("scroll", publish);
      document.removeEventListener("input", onInput);
    };
  }, []);
  return null;
}
