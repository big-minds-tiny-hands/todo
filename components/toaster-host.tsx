"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

// Sheets and the moment screen put their actions at the bottom, where toasts sit. While one is open,
// toasts move to the top so a cheer or an Undo never covers "It happened" or "Keep going".
const OVERLAY = ".sheet, .moment";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

const overlayOpen = () => document.querySelector(OVERLAY) !== null;

export function ToasterHost() {
  const top = useSyncExternalStore(subscribe, overlayOpen, () => false);
  return (
    <Toaster
      position={top ? "top-center" : "bottom-center"}
      offset={24}
      mobileOffset={top ? { top: 12 } : { bottom: 96 }}
      toastOptions={{ unstyled: true }}
    />
  );
}
