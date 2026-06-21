/** Hand-written PII patterns — no NPM pattern libraries per build plan. */
export const PII_PATTERNS = {
  A_NUMBER: /\bA-?\d{7,9}\b/gi,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  DOB_NUMERIC: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
  DOB_TEXT:
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(19|20)\d{2}\b/gi,
  STREET: /\d+\s+[\w\s]+(?:St|Ave|Blvd|Rd|Dr|Ln|Ct|Way)\b/gi,
} as const;

const PASSPORT_LABEL = /(?:Passport No\.|Document Number)\s*[:.]?\s*/gi;

/** Label-anchor only — never bare-regex an alphanumeric run. */
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

/** Pre-send guard: block if raw PII patterns remain after redaction. */
export function scanForLeakage(text: string): string[] {
  const leaks: string[] = [];
  for (const [name, pattern] of Object.entries(PII_PATTERNS)) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) leaks.push(name);
  }
  for (const span of findPassportSpans(text)) {
    if (text.includes(span.value)) leaks.push("PASSPORT");
    break;
  }
  return [...new Set(leaks)];
}
