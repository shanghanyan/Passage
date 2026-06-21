import type { DetectedSpan, RedactionResult } from "./types";

/**
 * Replace detected spans with session-scoped tokens right-to-left so indices stay valid.
 * Raw values live only in tokenMap — never sent to our backend.
 */
export function redact(text: string, detectedSpans: DetectedSpan[]): RedactionResult {
  const sorted = [...detectedSpans].sort((a, b) => b.start - a.start);
  const tokenMap: Record<string, string> = {};
  const typeCounters: Record<string, number> = {};
  let redacted = text;

  for (const span of sorted) {
    typeCounters[span.type] = (typeCounters[span.type] ?? 0) + 1;
    const token = `⟦PII:${span.type}:${typeCounters[span.type]}⟧`;
    tokenMap[token] = span.value;
    redacted = redacted.slice(0, span.start) + token + redacted.slice(span.end);
  }

  return { redacted, tokenMap };
}
