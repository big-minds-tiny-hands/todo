"use client";

import { useEffect } from "react";
import { showToast } from "@/lib/reward";

/** Registers the service worker and offers a reload when a new version is waiting. */
export function Pwa() {
  useEffect(() => {
    // A dev service worker fights Turbopack HMR.
    if (process.env.NODE_ENV === "development" || !("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;
    let registration: ServiceWorkerRegistration | undefined;
    let prompted = false;
    // The first install also fires controllerchange, so reload only after the user asked.
    let accepted = false;

    function promptUpdate() {
      if (prompted || !sw.controller) return;
      prompted = true;
      showToast("A new version of Todo is ready", {
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            accepted = true;
            registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
          },
        },
      });
    }

    function onUpdateFound() {
      const worker = registration?.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") promptUpdate();
      });
    }

    function onControllerChange() {
      if (accepted) window.location.reload();
    }

    // An app left open for days never navigates, so check for a new worker on each return.
    function onVisible() {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    }

    let cancelled = false;
    sw.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        if (cancelled) return;
        registration = reg;
        if (reg.waiting) promptUpdate();
        reg.addEventListener("updatefound", onUpdateFound);
      })
      .catch(() => {});

    sw.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      registration?.removeEventListener("updatefound", onUpdateFound);
      sw.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
