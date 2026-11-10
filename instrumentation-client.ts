import * as Sentry from "@sentry/nextjs";
import { sentryConfig, sentryInitOptions } from "./lib/sentry";

const sentry = sentryConfig();
if (sentry) Sentry.init(sentryInitOptions(sentry));

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
