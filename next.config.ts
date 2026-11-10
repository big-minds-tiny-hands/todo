import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { SENTRY_ORG, SENTRY_PROJECT, SENTRY_TUNNEL_ROUTE } from "./lib/sentry";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_APP_ENVIRONMENT:
      process.env.NEXT_PUBLIC_APP_ENVIRONMENT || process.env.VERCEL_ENV || "development",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  org: SENTRY_ORG,
  project: SENTRY_PROJECT,
  silent: !process.env.CI,
  telemetry: false,
  sourcemaps: { disable: !uploadSourceMaps },
  release: { create: uploadSourceMaps },
  tunnelRoute: SENTRY_TUNNEL_ROUTE,
});
