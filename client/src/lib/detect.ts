import { findPassportSpans, PII_PATTERNS } from "./patterns";
import { detectNerSpans } from "./ner";
import type { DetectedSpan, PiiType } from "./types";

function regexSpans(text: string, pattern: RegExp, type: PiiType): DetectedSpan[] {
  const spans: DetectedSpan[] = [];
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    spans.push({
      type,
      start: match.index,
      end: match.index + match[0].length,
      value: match[0],
    });
  }
  return spans;
}

function overlaps(a: DetectedSpan, b: DetectedSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Prefer longer span when two detections overlap. */
export function mergeSpans(spans: DetectedSpan[]): DetectedSpan[] {
  const sorted = [...spans].sort((a, b) =>
    a.start !== b.start ? a.start - b.start : b.end - a.end - (a.end - a.start),
  );
  const merged: DetectedSpan[] = [];

  for (const span of sorted) {
    const conflict = merged.findIndex((existing) => overlaps(existing, span));
    if (conflict === -1) {
      merged.push(span);
      continue;
    }
    const existing = merged[conflict];
    const spanLen = span.end - span.start;
    const existingLen = existing.end - existing.start;
    if (spanLen > existingLen) merged[conflict] = span;
  }

  return merged.sort((a, b) => a.start - b.start);
}

export async function detectPii(text: string): Promise<DetectedSpan[]> {
  const regexResults: DetectedSpan[] = [
    ...regexSpans(text, PII_PATTERNS.A_NUMBER, "A_NUMBER"),
    ...regexSpans(text, PII_PATTERNS.SSN, "SSN"),
    ...regexSpans(text, PII_PATTERNS.DOB_NUMERIC, "DOB"),
    ...regexSpans(text, PII_PATTERNS.DOB_TEXT, "DOB"),
    ...regexSpans(text, PII_PATTERNS.STREET, "ADDRESS"),
    ...findPassportSpans(text).map((s) => ({ ...s, type: "PASSPORT" as const })),
  ];

  const nerResults = await detectNerSpans(text);
  return mergeSpans([...regexResults, ...nerResults]);
}
