import * as Sentry from "@sentry/node";
import { scrubSentryExtra, scrubSentryText } from "./sentry-scrub.js";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.message) event.message = scrubSentryText(event.message);
      if (event.extra) event.extra = scrubSentryExtra(event.extra as Record<string, unknown>);
      return event;
    },
  });
  initialized = true;
}

export function captureExternalError(scope: string, err: unknown, extra?: Record<string, unknown>): void {
  initSentry();
  Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
    tags: { scope },
    extra: extra ? scrubSentryExtra(extra) : undefined,
  });
}

export function captureValidationMismatch(extra: Record<string, unknown>): void {
  initSentry();
  Sentry.captureMessage("Redaction token mismatch — unsafe output blocked", {
    level: "error",
    extra: scrubSentryExtra(extra),
  });
}

export { Sentry };
