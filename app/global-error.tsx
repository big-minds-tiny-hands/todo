"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <h2>Todo stopped working on this screen.</h2>
        <p>Your saved tasks are safe. Try again, or reload the page.</p>
        <button onClick={() => retry()}>Try again</button>
      </body>
    </html>
  );
}
