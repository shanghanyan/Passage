import type { DetectedSpan } from "./types";

const MAX_NER_NAME_LEN = 80;
const MAX_NER_ADDRESS_LEN = 120;
const MAX_NER_FRACTION = 0.35;

function spanMaxLen(span: DetectedSpan, text: string): number {
  if (span.source === "regex") return text.length;
  if (span.type === "NAME") return MAX_NER_NAME_LEN;
  if (span.type === "ADDRESS") return MAX_NER_ADDRESS_LEN;
  return 80;
}

/** Drop spans with invalid bounds before merge/highlight. */
export function validateSpans(spans: DetectedSpan[], text: string): DetectedSpan[] {
  const len = text.length;
  return spans.filter((s) => {
    if (!Number.isFinite(s.start) || !Number.isFinite(s.end)) return false;
    if (s.start < 0 || s.end > len || s.start >= s.end) return false;
    const spanLen = s.end - s.start;
    if (spanLen > len * MAX_NER_FRACTION && s.source !== "regex") return false;
    if (spanLen > spanMaxLen(s, text)) return false;
    const slice = text.slice(s.start, s.end);
    if (slice.includes("\n") && s.type === "NAME") return false;
    return slice === s.value || slice.toLowerCase() === s.value.toLowerCase();
  });
}
