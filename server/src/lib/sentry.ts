import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    beforeSend(event) {
      if (event.message) {
        event.message = event.message
          .replace(/\bA-?\d{7,9}\b/gi, "[REDACTED_A_NUMBER]")
          .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
      }
      return event;
    },
  });
  initialized = true;
}

export function captureExternalError(scope: string, err: unknown, extra?: Record<string, unknown>): void {
  initSentry();
  Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
    tags: { scope },
    extra,
  });
}

export function captureValidationMismatch(extra: Record<string, unknown>): void {
  initSentry();
  Sentry.captureMessage("Redaction token mismatch — unsafe output blocked", {
    level: "error",
    extra,
  });
}

export { Sentry };
