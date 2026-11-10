import * as Sentry from "@sentry/nextjs";
import { posthogConfig, posthogInitOptions } from "./lib/posthog";
import { sentryConfig, sentryInitOptions } from "./lib/sentry";

const sentry = sentryConfig();
if (sentry) Sentry.init(sentryInitOptions(sentry));

// posthog-js loads only when PostHog is on, and stays out of the first bundle.
const posthog = posthogConfig();
if (posthog) {
  // Content blockers match the file names PostHog lazy-loads (posthog-recorder.js,
  // dead-clicks-autocapture.js) even through /ingest, so session replay never
  // started. Bundled, they ship in hashed app chunks instead.
  void Promise.all([
    import("posthog-js"),
    import("posthog-js/dist/posthog-recorder"),
    import("posthog-js/dist/dead-clicks-autocapture"),
  ]).then(([{ default: client }]) => {
    client.init(posthog.token, posthogInitOptions(posthog));
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
