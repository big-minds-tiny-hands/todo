import * as Sentry from "@sentry/nextjs";
import { posthogConfig, posthogInitOptions } from "./lib/posthog";
import { sentryConfig, sentryInitOptions } from "./lib/sentry";

const sentry = sentryConfig();
if (sentry) Sentry.init(sentryInitOptions(sentry));

// posthog-js loads only when PostHog is on, and stays out of the first bundle.
const posthog = posthogConfig();
if (posthog) {
  void import("posthog-js").then(({ default: client }) => {
    client.init(posthog.token, posthogInitOptions(posthog));
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
