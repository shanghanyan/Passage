import type { DetectedSpan, PiiType } from "./types";

/** On overlap, higher-priority type wins (PASSPORT > A_NUMBER > … > ADDRESS). */
export const OVERLAP_PRIORITY: Record<PiiType, number> = {
  PASSPORT: 60,
  A_NUMBER: 55,
  SSN: 50,
  DOB: 45,
  NAME: 40,
  ADDRESS: 30,
};

function spansOverlap(a: DetectedSpan, b: DetectedSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

function spanPriority(span: DetectedSpan): number {
  return OVERLAP_PRIORITY[span.type] ?? 0;
}

export function mergeSpansWithDropped(spans: DetectedSpan[]): {
  kept: DetectedSpan[];
  dropped: DetectedSpan[];
} {
  const sorted = [...spans].sort((a, b) => {
    const priA = spanPriority(a);
    const priB = spanPriority(b);
    if (priA !== priB) return priB - priA;
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });

  const kept: DetectedSpan[] = [];

  for (const candidate of sorted) {
    const overlapsKept = kept.some((k) => spansOverlap(candidate, k));
    if (!overlapsKept) kept.push(candidate);
  }

  kept.sort((a, b) => a.start - b.start);

  const keptSet = new Set(kept);
  const dropped = spans.filter((s) => !keptSet.has(s));

  return { kept, dropped };
}

export function mergeSpans(spans: DetectedSpan[]): DetectedSpan[] {
  return mergeSpansWithDropped(spans).kept;
}
