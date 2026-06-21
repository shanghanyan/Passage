import * as Sentry from "@sentry/react";
import { scrubSentryExtra, scrubSentryText } from "./sentry-scrub";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_CLIENT_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.message) event.message = scrubSentryText(event.message);
      if (event.extra) event.extra = scrubSentryExtra(event.extra as Record<string, unknown>);
      return event;
    },
  });
}

export { Sentry };
