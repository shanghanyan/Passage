/** Hand-written PII patterns — no NPM pattern libraries per build plan. */
export const PII_PATTERNS = {
  A_NUMBER: /\bA-?\d{7,9}\b/gi,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  DOB_NUMERIC: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
  DOB_TEXT:
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(19|20)\d{2}\b/gi,
} as const;

const STREET_SUFFIX =
  "Street|St\\.|Avenue|Ave\\.|Road|Rd\\.|Boulevard|Blvd\\.|Lane|Ln\\.|Drive|Dr\\.|Court|Ct\\.|Way|" +
  "Place|Pl\\.|Terrace|Terr\\.|Circle|Cir\\.|Highway|Hwy\\.|Parkway|Pkwy\\.|Apt|Apartment|Unit|Suite|Ste\\.|Ste\\b";

/** US street-shape heuristic — requires house number + suffix (no bare "St" false positives). */
export const ADDRESS_STREET_PATTERN = new RegExp(
  `\\b\\d{1,6}\\s+[A-Za-z0-9][A-Za-z0-9'\\-.\\s]{0,48}\\s(?:${STREET_SUFFIX})(?:\\s+(?:#\\s*)?[A-Za-z0-9-]+)?\\b`,
  "gi",
);

/** Apt/Unit + city/state/zip shapes that may survive partial redaction. */
export const ADDRESS_APT_UNIT_PATTERN =
  /\b(?:Apt|Unit)\s*#?\s*[A-Za-z0-9-]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}\b/gi;

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

export function detectAddressStreetShape(text: string): Array<{ start: number; end: number; value: string }> {
  const spans: Array<{ start: number; end: number; value: string }> = [];
  ADDRESS_STREET_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(ADDRESS_STREET_PATTERN)) {
    if (match.index === undefined) continue;
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      value: match[0],
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
  ADDRESS_STREET_PATTERN.lastIndex = 0;
  if (ADDRESS_STREET_PATTERN.test(text)) leaks.push("ADDRESS");
  ADDRESS_APT_UNIT_PATTERN.lastIndex = 0;
  if (ADDRESS_APT_UNIT_PATTERN.test(text)) leaks.push("ADDRESS_APT");
  for (const span of findPassportSpans(text)) {
    if (text.includes(span.value)) leaks.push("PASSPORT");
    break;
  }
  return [...new Set(leaks)];
}
