import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { sentryConfig, sentryInitOptions } from "./lib/sentry";

const config = sentryConfig();

export function register() {
  if (config) Sentry.init(sentryInitOptions(config));
}

export const onRequestError: Instrumentation.onRequestError = (...args) => {
  if (config) return Sentry.captureRequestError(...args);
};
