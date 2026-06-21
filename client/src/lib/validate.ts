import * as Sentry from "@sentry/react";
import type { ValidationResult } from "./types";

const TOKEN_PATTERN = /⟦PII:[A-Z_]+:\d+⟧/g;

export function validateAndReinsert(
  claudeOutput: string,
  tokenMap: Record<string, string>,
  sessionId: string,
): ValidationResult {
  const expectedTokens = Object.keys(tokenMap);
  const tokensFound = claudeOutput.match(TOKEN_PATTERN) ?? [];

  for (const token of expectedTokens) {
    if (!claudeOutput.includes(token)) {
      Sentry.captureMessage("Redaction token mismatch — unsafe output blocked", {
        level: "error",
        extra: {
          expected: expectedTokens.length,
          found: tokensFound.length,
          sessionId,
          missingToken: token,
        },
      });
      return {
        ok: false,
        fallback: "We couldn't safely process this section — try again or review manually.",
      };
    }
  }

  let result = claudeOutput;
  for (const [token, realValue] of Object.entries(tokenMap)) {
    result = result.replaceAll(token, realValue);
  }

  return { ok: true, text: result };
}
