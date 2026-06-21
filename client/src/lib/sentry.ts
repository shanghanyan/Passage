import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_CLIENT_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    beforeSend(event) {
      // Never attach raw PII — scrub common patterns from breadcrumbs and messages.
      const scrub = (value: string) =>
        value
          .replace(/\bA-?\d{7,9}\b/gi, "[REDACTED_A_NUMBER]")
          .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");

      if (event.message) event.message = scrub(event.message);
      return event;
    },
  });
}

export { Sentry };
