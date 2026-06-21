import * as Sentry from "@sentry/react";
import { scrubSentryExtra } from "./sentry-scrub";
import type { LeakCheckResult, TokenCheckResult, ValidationResult } from "./types";

const TOKEN_PATTERN = /⟦PII:[A-Z_]+:\d+⟧/g;

function extractTokens(text: string): string[] {
  return text.match(TOKEN_PATTERN) ?? [];
}

export function validateTranslationTokens(
  tokenMap: Record<string, string>,
  response: string,
): TokenCheckResult {
  const expectedKeys = Object.keys(tokenMap);
  const expectedSet = new Set(expectedKeys);
  const responseTokens = extractTokens(response);
  const foundKeys = [...new Set(responseTokens)];
  const unexpected = foundKeys.filter((k) => !expectedSet.has(k));
  const missing = expectedKeys.filter((k) => !response.includes(k));

  if (unexpected.length === 0 && missing.length === 0) {
    return { ok: true };
  }

  let reason: string;
  if (unexpected.length > 0) {
    reason = `unexpected token(s) not in tokenMap: ${unexpected.join(", ")}`;
  } else {
    reason = `missing tokenMap key(s): ${missing.join(", ")}`;
  }

  return { ok: false, unexpected, missing, reason };
}

/** Voice answers only need to avoid inventing tokens and leaking raw values — not repeat every doc token. */
export function validateVoiceAnswerTokens(
  tokenMap: Record<string, string>,
  response: string,
): TokenCheckResult {
  const expectedSet = new Set(Object.keys(tokenMap));
  const foundKeys = [...new Set(extractTokens(response))];
  const unexpected = foundKeys.filter((k) => !expectedSet.has(k));

  if (unexpected.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    unexpected,
    reason: `unexpected token(s) not in tokenMap: ${unexpected.join(", ")}`,
  };
}

export function noRawPiiLeak(tokenMap: Record<string, string>, response: string): LeakCheckResult {
  for (const raw of Object.values(tokenMap)) {
    if (raw.length >= 4 && response.includes(raw)) {
      return { ok: false, reason: `raw value leaked: "${raw}"` };
    }
  }
  return { ok: true };
}

/** Fail-closed validation — output stays tokenized; raw values never reinserted or persisted. */
export function validateTranslationOutput(
  claudeOutput: string,
  tokenMap: Record<string, string>,
  sessionId: string,
): ValidationResult {
  const tokenCheck = validateTranslationTokens(tokenMap, claudeOutput);
  const leakCheck = noRawPiiLeak(tokenMap, claudeOutput);

  if (!tokenCheck.ok || !leakCheck.ok) {
    Sentry.captureMessage("Redaction token mismatch — unsafe output blocked", {
      level: "error",
      extra: scrubSentryExtra({
        sessionId,
        tokenCheck,
        leakCheck,
      }),
    });
    return {
      ok: false,
      fallback: "We couldn't safely process this section — try again or review manually.",
      tokenCheck,
      leakCheck,
    };
  }

  return { ok: true, text: claudeOutput };
}

/** Fail-closed for voice Q&A — no unexpected tokens, no raw leaks; missing doc tokens is OK. */
export function validateVoiceAnswer(
  claudeOutput: string,
  tokenMap: Record<string, string>,
  sessionId: string,
): ValidationResult {
  const tokenCheck = validateVoiceAnswerTokens(tokenMap, claudeOutput);
  const leakCheck = noRawPiiLeak(tokenMap, claudeOutput);

  if (!tokenCheck.ok || !leakCheck.ok) {
    Sentry.captureMessage("Voice answer validation failed", {
      level: "error",
      extra: scrubSentryExtra({
        sessionId,
        tokenCheck,
        leakCheck,
      }),
    });
    return {
      ok: false,
      fallback: "We couldn't safely process this section — try again or review manually.",
      tokenCheck,
      leakCheck,
    };
  }

  return { ok: true, text: claudeOutput };
}

/** @deprecated Use validateTranslationOutput — reinsertion removed for privacy. */
export const validateAndReinsert = validateTranslationOutput;
