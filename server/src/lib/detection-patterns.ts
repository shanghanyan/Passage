/** Regex-only detection for server-side recall scoring scripts (no NER). */
export const PII_PATTERNS = {
  A_NUMBER: /\bA-?\d{7,9}\b/gi,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  DOB_NUMERIC: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
  DOB_TEXT:
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(19|20)\d{2}\b/gi,
  STREET: /\d+\s+[\w\s]+(?:St|Ave|Blvd|Rd|Dr|Ln|Ct|Way)\b/gi,
} as const;

const PASSPORT_LABEL = /(?:Passport No\.|Document Number)\s*[:.]?\s*/gi;

export interface DetectedSpan {
  type: string;
  start: number;
  end: number;
  value: string;
}

export function findPassportSpans(text: string): Array<{ start: number; end: number; value: string }> {
  const spans: Array<{ start: number; end: number; value: string }> = [];
  for (const match of text.matchAll(PASSPORT_LABEL)) {
    const searchStart = match.index! + match[0].length;
    const window = text.slice(searchStart, searchStart + 30);
    const valueMatch = window.match(/^([A-Z0-9]{6,12})/i);
    if (!valueMatch) continue;
    spans.push({
      start: searchStart,
      end: searchStart + valueMatch[1].length,
      value: valueMatch[1],
    });
  }
  return spans;
}

function regexSpans(text: string, pattern: RegExp, type: string): DetectedSpan[] {
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
    if (span.end - span.start > existing.end - existing.start) merged[conflict] = span;
  }

  return merged.sort((a, b) => a.start - b.start);
}

/** Regex-only pipeline — browser scoring also includes NER names. */
export function detectPiiRegex(text: string): DetectedSpan[] {
  return mergeSpans([
    ...regexSpans(text, PII_PATTERNS.A_NUMBER, "A_NUMBER"),
    ...regexSpans(text, PII_PATTERNS.SSN, "SSN"),
    ...regexSpans(text, PII_PATTERNS.DOB_NUMERIC, "DOB"),
    ...regexSpans(text, PII_PATTERNS.DOB_TEXT, "DOB"),
    ...regexSpans(text, PII_PATTERNS.STREET, "ADDRESS"),
    ...findPassportSpans(text).map((s) => ({ ...s, type: "PASSPORT" })),
  ]);
}

export interface LabeledSpan {
  type: string;
  value: string;
}

export function computeRecall(detectedSpans: DetectedSpan[], labeledSpans: LabeledSpan[]): number {
  if (labeledSpans.length === 0) return 1;

  const normalize = (s: string) => s.toLowerCase().trim();
  let matched = 0;

  for (const truth of labeledSpans) {
    const hit = detectedSpans.some((d) => {
      const dv = normalize(d.value);
      const tv = normalize(truth.value);
      return dv === tv || dv.includes(tv) || tv.includes(dv);
    });
    if (hit) matched++;
  }

  return matched / labeledSpans.length;
}
