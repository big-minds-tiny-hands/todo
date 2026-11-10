"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConvexProviderWithAuth client={convex} useAuth={useBetterAuth}>
        {children}
      </ConvexProviderWithAuth>
    </ThemeProvider>
  );
}

const MAX_RETRY_MS = 30_000;

/**
 * Convex auth backed by the Better Auth session.
 *
 * The session lasts 60 days, but the Convex token lasts 15 minutes. A phone pauses the refresh timer
 * while the app sleeps, so the token is stale on wake and the first refresh often runs before the
 * network is back. Convex treats a null token as signed out and never asks again, so only a 401
 * (no session) returns null. Any other failure waits and tries again.
 */
function useBetterAuth() {
  const { data, isPending } = authClient.useSession();
  const sessionId = data?.session.id;
  const cached = useRef<{ sessionId: string; token: string } | null>(null);
  const pending = useRef<{ sessionId: string; promise: Promise<string | null> } | null>(null);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken = false }: { forceRefreshToken?: boolean } = {}) => {
      if (!sessionId) return null;
      if (pending.current?.sessionId === sessionId) return pending.current.promise;
      if (!forceRefreshToken && cached.current?.sessionId === sessionId) return cached.current.token;

      const promise = fetchConvexToken().then((token) => {
        if (pending.current?.promise === promise) pending.current = null;
        cached.current = token ? { sessionId, token } : null;
        return token;
      });
      pending.current = { sessionId, promise };
      return promise;
    },
    [sessionId],
  );

  return useMemo(
    () => ({ isLoading: isPending && !data, isAuthenticated: Boolean(data), fetchAccessToken }),
    [isPending, data, fetchAccessToken],
  );
}

async function fetchConvexToken(): Promise<string | null> {
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await authClient.convex
      .token({ fetchOptions: { throw: false } })
      .catch(() => ({ data: null, error: { status: 0 } }));
    if (data?.token) return data.token;
    if (error?.status === 401 || error?.status === 403 || (!error && !data?.token)) return null;
    await waitToRetry(Math.min(1000 * 2 ** attempt, MAX_RETRY_MS));
  }
}

/** Waits `ms`, or less when the device comes back online or the app comes back to the front. */
function waitToRetry(ms: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener("online", done);
      document.removeEventListener("visibilitychange", onVisible);
      resolve();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") done();
    };
    // Offline, a short timer only burns requests: wait for the network, with the longest wait as a fallback.
    const timer = setTimeout(done, navigator.onLine ? ms : MAX_RETRY_MS);
    window.addEventListener("online", done);
    document.addEventListener("visibilitychange", onVisible);
  });
}
