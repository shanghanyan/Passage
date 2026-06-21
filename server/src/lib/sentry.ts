import * as Sentry from "@sentry/node";
import { scrubSentryExtra, scrubSentryText } from "@passage/shared/sentry-scrub.js";

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

export function captureTranslationMeaningFailure(extra: Record<string, unknown>): void {
  initSentry();
  Sentry.captureMessage("Translation meaning verification failed — output blocked", {
    level: "error",
    extra: scrubSentryExtra(extra),
  });
}

const RECALL_ALERT_THRESHOLD = Number(process.env.RECALL_ALERT_THRESHOLD ?? "0.75");

export function captureRecallDrop(extra: Record<string, unknown>): void {
  initSentry();
  Sentry.captureMessage("Redaction recall below threshold", {
    level: "warning",
    extra: scrubSentryExtra(extra),
  });
}

export function shouldAlertRecall(recall: number, recallByType?: Record<string, number>): boolean {
  if (recall < RECALL_ALERT_THRESHOLD) return true;
  const nameRecall = recallByType?.NAME;
  if (nameRecall != null && nameRecall < RECALL_ALERT_THRESHOLD) return true;
  return false;
}

export { Sentry };
