import type { Metadata } from "next";
import { OfflineIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="phone center">
      <div className="empty">
        <div className="empty-art">
          <OfflineIcon />
        </div>
        <h1 className="h2">You&apos;re offline</h1>
        <p className="muted">Today will load when the connection is back.</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full page load works with no client JS cached and goes through the service worker */}
        <a className="btn pri" href="/">
          Try again
        </a>
      </div>
    </main>
  );
}
