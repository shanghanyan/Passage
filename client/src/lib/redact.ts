import type { DetectedSpan, RedactionResult, TokenMeta } from "./types";

function parseTokenIndex(token: string): { type: string; index: number } | null {
  const match = token.match(/^⟦PII:([A-Z_]+):(\d+)⟧$/);
  if (!match) return null;
  return { type: match[1], index: Number(match[2]) };
}

function typeCountersFromExisting(existingTokenMap: Record<string, string>): Record<string, number> {
  const counters: Record<string, number> = {};
  for (const token of Object.keys(existingTokenMap)) {
    const parsed = parseTokenIndex(token);
    if (parsed) {
      counters[parsed.type] = Math.max(counters[parsed.type] ?? 0, parsed.index);
    }
  }
  return counters;
}

/**
 * Replace detected spans with session-scoped tokens left-to-right.
 * When `existingTokenMap` is provided, TYPE:n counters continue within the session.
 */
export function redact(
  text: string,
  detectedSpans: DetectedSpan[],
  existingTokenMap: Record<string, string> = {},
): RedactionResult {
  const valid = [...detectedSpans]
    .filter((span) => span.start >= 0 && span.end <= text.length && span.start < span.end)
    .sort((a, b) => a.start - b.start);

  const typeCounters = typeCountersFromExisting(existingTokenMap);
  const tokenMap: Record<string, string> = {};
  const tokenMeta: Record<string, TokenMeta> = {};
  let cursor = 0;
  const parts: string[] = [];

  for (const span of valid) {
    if (span.start < cursor) continue;

    parts.push(text.slice(cursor, span.start));

    const nextIndex = (typeCounters[span.type] ?? 0) + 1;
    typeCounters[span.type] = nextIndex;
    const token = `⟦PII:${span.type}:${nextIndex}⟧`;
    tokenMap[token] = span.value;
    tokenMeta[token] = {
      type: span.type,
      confidence: span.confidence,
      source: span.source ?? "regex",
    };
    parts.push(token);
    cursor = span.end;
  }

  parts.push(text.slice(cursor));

  return { redacted: parts.join(""), tokenMap, tokenMeta };
}
