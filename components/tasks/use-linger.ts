"use client";

import { useState } from "react";

const LINGER_MS = 1000;

type Held<T> = { item: T; from: string };

/**
 * Rows sent away by a tap stay in place for a moment, showing where they went. Without it the next row slides
 * under the pointer at once, and a second tap sends that row too.
 */
export function useLinger<T extends { _id: string }>() {
  const [held, setHeld] = useState<Held<T>[]>([]);

  function hold(item: T, from: string) {
    setHeld((h) => [...h.filter((x) => x.item._id !== item._id), { item, from }]);
    window.setTimeout(() => setHeld((h) => h.filter((x) => x.item._id !== item._id)), LINGER_MS);
  }

  /** `list` with the rows held from it put back in `order`. A row back in `list`, as after an Undo, is not held. */
  function withHeld(list: T[], from: string, order: (a: T, b: T) => number) {
    const ids = new Set(list.map((t) => t._id));
    const extra = held.filter((x) => x.from === from && !ids.has(x.item._id)).map((x) => x.item);
    const heldIds = new Set(extra.map((t) => t._id));
    return { rows: extra.length > 0 ? [...list, ...extra].sort(order) : list, isHeld: (id: string) => heldIds.has(id) };
  }

  return { hold, withHeld };
}
