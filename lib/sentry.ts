export const SENTRY_ORG = "big-minds-tiny-hands";
export const SENTRY_PROJECT = "todo";
export const SENTRY_TUNNEL_ROUTE = "/monitoring";
const SENTRY_INGEST_HOST = "o4511112272347136.ingest.us.sentry.io";
const SENTRY_PROJECT_ID = "4512404980236288";

export type SentryConfig = { dsn: string; environment: string };

type SentryEnv = { dsn?: string; nodeEnv?: string; environment?: string };

/** Direct `process.env.X` reads, so Next.js inlines them into the client bundle. */
function readEnv(): SentryEnv {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    nodeEnv: process.env.NODE_ENV,
    environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT,
  };
}

/** Null means Sentry stays off: no DSN, a dev build, or a DSN for another project. */
export function sentryConfig(env: SentryEnv = readEnv()): SentryConfig | null {
  if (env.nodeEnv !== "production" || !env.dsn) return null;
  try {
    const url = new URL(env.dsn);
    if (
      url.protocol !== "https:" ||
      url.hostname !== SENTRY_INGEST_HOST ||
      url.pathname !== `/${SENTRY_PROJECT_ID}`
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return { dsn: env.dsn, environment: env.environment || "development" };
}

export function sentryInitOptions(config: SentryConfig) {
  return {
    dsn: config.dsn,
    environment: config.environment,
    sendDefaultPii: false,
    tracesSampleRate: 1,
  };
}
