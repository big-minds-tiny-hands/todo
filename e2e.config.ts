import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { anthropic } from "@ai-sdk/anthropic";

// The runner loads no .env file. .env.local holds the test account and, for agent steps, the model key.
try {
  process.loadEnvFile('.env.local');
} catch {
  // CI sets the same variables in its environment.
}

export default {
  agents: {
    default: {
      // Reads ANTHROPIC_API_KEY.
      model: anthropic("claude-sonnet-5-5"),
      system: 'You are a thorough QA agent testing Todo, a daily planner. Verify every outcome on screen.',
    },
  },
  // Every test signs in as the one dev test account and reseeds its data, so tests must not run side by side.
  workers: 1,
  targets: [
    {
      // Melina uses Todo on her phone first, so tests run at a phone viewport.
      engine: web({ viewport: { width: 390, height: 844 } }),
      app: {
        url: 'http://localhost:3001',
        // The dev box lane port for this repo. reuseExisting attaches to a dev server that is already up.
        command: {
          executable: 'bun',
          args: ['x', 'next', 'dev', '--port', '{port}'],
          startupTimeout: 120_000,
          reuseExisting: true,
          log: '.e2e/logs/app.log',
        },
      },
    },
  ],
  credentials: {
    // The dev test account. Its email must be on the Convex dev ALLOWED_EMAILS list.
    user: { username: process.env.TEST_USER_EMAIL ?? '', password: () => process.env.TEST_USER_PASSWORD ?? '' },
  },
} satisfies E2EConfig;
