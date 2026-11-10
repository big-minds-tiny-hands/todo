import * as Sentry from "@sentry/nextjs";

type AuthError = { status: number; code?: string };

/**
 * The message for an auth error the form has no answer of its own for. No status means the request
 * never got an answer. Any status means the server refused, which is Tiny ToDo's fault, so it goes to
 * Sentry with its code (never the email or password).
 */
export function unexpectedAuthError(action: string, error: AuthError): string {
  if (!error.status) return "Could not reach Tiny ToDo. Check your connection and try again.";
  Sentry.captureMessage(`auth ${action} failed: ${error.status} ${error.code ?? "no code"}`, "error");
  return "Something went wrong on Tiny ToDo's side. Try again in a few minutes.";
}
