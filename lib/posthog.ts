import type { PostHogConfig as PostHogInitOptions } from "posthog-js";

/** PostHog project 548413 is shared with other BMTH apps. Every event carries this tag. */
export const POSTHOG_APP = "todo";
export const POSTHOG_PROXY_PATH = "/ingest";

export type PostHogConfig = { token: string; environment: string };

type PostHogEnv = { token?: string; nodeEnv?: string; environment?: string };

/** Direct `process.env.X` reads, so Next.js inlines them into the client bundle. */
function readEnv(): PostHogEnv {
  return {
    token: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    nodeEnv: process.env.NODE_ENV,
    environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT,
  };
}

/** Null means PostHog stays off: no project token or a dev build. */
export function posthogConfig(env: PostHogEnv = readEnv()): PostHogConfig | null {
  if (env.nodeEnv !== "production" || !env.token || !/^phc_[A-Za-z0-9]+$/.test(env.token)) {
    return null;
  }
  return { token: env.token, environment: env.environment || "development" };
}

/**
 * The shared project holds PHI for another app, and task titles can name
 * children, so autocapture and replay never record page text or input values.
 */
export function posthogInitOptions(config: PostHogConfig): Partial<PostHogInitOptions> {
  return {
    api_host: POSTHOG_PROXY_PATH,
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    person_profiles: "identified_only",
    // Sentry owns errors.
    capture_exceptions: false,
    mask_all_text: true,
    mask_all_element_attributes: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "*",
      recordHeaders: false,
      recordBody: false,
    },
    loaded: (posthog) => {
      posthog.register({ app: POSTHOG_APP, environment: config.environment });
    },
  };
}

/** Static assets first: the catch-all would shadow them. */
export const posthogRewrites = [
  {
    source: `${POSTHOG_PROXY_PATH}/static/:path*`,
    destination: "https://us-assets.i.posthog.com/static/:path*",
  },
  {
    source: `${POSTHOG_PROXY_PATH}/array/:path*`,
    destination: "https://us-assets.i.posthog.com/array/:path*",
  },
  {
    source: `${POSTHOG_PROXY_PATH}/:path*`,
    destination: "https://us.i.posthog.com/:path*",
  },
];
