"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { DevDataDock } from "@/components/dev-data-dock";
import { OfflineIcon } from "@/components/icons";
import { TabBar } from "@/components/ui-todo";
import { useToday } from "@/hooks/use-today";

/** Sends signed-out visitors to sign-in. Shows the loading skeleton while auth resolves. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(`/sign-in${pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : ""}`);
  }, [isLoading, isAuthenticated, router, pathname]);
  if (!isAuthenticated) {
    return (
      <div className="phone" aria-busy="true">
        <LoadingBody />
      </div>
    );
  }
  return <>{children}</>;
}

/** Tab screens: tab bar on phone, sidebar from 768px. */
export function TabsFrame({ children }: { children: ReactNode }) {
  const { today } = useToday();
  const all = useQuery(api.tasks.all, { today });
  return (
    <div className="phone">
      <OfflineBanner />
      {children}
      <TabBar allTasksCount={all ? all.tasks.length : undefined} />
      <DevDataDock />
    </div>
  );
}

export function FullFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone">
      <OfflineBanner />
      {children}
      <DevDataDock />
    </div>
  );
}

/** Quiet banner while the device is offline. Changes queue and save on reconnect. */
function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <div style={{ padding: "12px 16px 0" }}>
      <div className="banner" role="status">
        <OfflineIcon style={{ color: "var(--amber-tx)" }} />
        <span style={{ flex: 1, fontSize: 15 }}>You&apos;re offline. Changes save when you reconnect.</span>
      </div>
    </div>
  );
}

/** Skeleton for Today while data loads. */
export function LoadingBody() {
  return (
    <>
      <header className="head">
        <div>
          <span className="skel" style={{ display: "block", width: 110, height: 13, marginBottom: 10 }} />
          <span className="skel" style={{ display: "block", width: 140, height: 30 }} />
        </div>
      </header>
      <main className="scroll cols" aria-label="Loading">
        <section className="focus" style={{ padding: "18px 16px 14px", display: "flex", flexDirection: "column", gap: 16 }}>
          <span className="skel" style={{ width: 90, height: 16 }} />
          <span className="skel" style={{ width: "100%", height: 6 }} />
          {[78, 62, 70].map((w) => (
            <div key={w} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="skel" style={{ width: 36, height: 36, borderRadius: "50%", flex: "none" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="skel" style={{ width: `${w}%`, height: 14 }} />
                <span className="skel" style={{ width: `${w / 2}%`, height: 10 }} />
              </div>
            </div>
          ))}
        </section>
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="skel" style={{ width: 80, height: 12, margin: "0 4px" }} />
          <div className="card" style={{ height: 128 }} />
        </section>
      </main>
    </>
  );
}
