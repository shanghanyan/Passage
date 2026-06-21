/** Hand-written PII patterns — no NPM pattern libraries per build plan. */
export const PII_PATTERNS = {
  A_NUMBER: /\bA-?\d{7,9}\b/gi,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  DOB_NUMERIC: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
  DOB_TEXT:
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(19|20)\d{2}\b/gi,
} as const;

/** Immigration-document name labels — anchor regex (NER complements + covers NER-offline cases). */
const NAME_LABEL =
  /\b(?:Re|Beneficiary|Applicant(?:\s+Name)?|Respondent|Petitioner|Recipient|Name|Dear)\s*:\s*/gi;

const NAME_AFTER_LABEL = new RegExp(
  String.raw`^(` +
    String.raw`[A-Z][A-Z]+(?:-[A-Z]+)?,\s+[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)?` + // ALL CAPS LAST, FIRST
    String.raw`|[A-Za-z][\u2019'A-Za-z-]+(?:\s+[A-Z]\.?)?(?:\s+[A-Za-z][\u2019'A-Za-z-]+)+` + // Title Case + hyphen
    String.raw`|[A-Z][A-Z]{2,}` + // single-token ALL CAPS e.g. MADHAV
    String.raw`)`,
);

const NAME_CAPS_COMMA = /\b([A-Z][A-Z]+(?:-[A-Z]+)?,\s+[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)?)\b/g;

const NAME_HONORIFIC =
  /\b(Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;

const NAME_BENEFICIARY_TAIL = /\bbeneficiary\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/gi;

const NAME_ATTENTION_HOLDER =
  /\bAttention\s*[-—]\s*holder\s+of\s+record\s+([A-Za-z][\u2019'A-Za-z-]+(?:\s+[A-Za-z][\u2019'A-Za-z-]+)+)/gi;

const NAME_FOR_TAIL = /\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi;

const NAME_DEAR = /\bDear\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;

const NAME_ACTION_LEAD =
  /\b([A-Z][a-z]+(?:\s+(?:[A-Z]\.\s+)?[A-Z][a-z]+)+)\s+(?:submitted|filed|must|appeared|signed|received)\b/g;

const MONTH_WORDS = new Set([
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
]);

function isLikelyName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  const firstWord = trimmed.split(/\s+/)[0]?.replace(/,$/, "").toLowerCase() ?? "";
  if (MONTH_WORDS.has(firstWord)) return false;
  if (/^(form|notice|dear|date|uscis|department|section|page|named|above|holder|record)$/i.test(firstWord)) return false;
  if (/^\d/.test(trimmed)) return false;
  return /[A-Za-z]/.test(trimmed);
}

function pushNameSpan(
  spans: Array<{ start: number; end: number; value: string }>,
  text: string,
  start: number,
  end: number,
) {
  const value = text.slice(start, end);
  if (!isLikelyName(value)) return;
  if (spans.some((s) => s.start === start && s.end === end)) return;
  spans.push({ start, end, value });
}

/** Expand each detected name to every case-insensitive occurrence in the document. */
export function expandNameOccurrences(
  text: string,
  seeds: Array<{ start: number; end: number; value: string }>,
): Array<{ start: number; end: number; value: string }> {
  const all = [...seeds];
  const seenValues = new Set<string>();

  for (const seed of seeds) {
    const normalized = seed.value.trim();
    if (!normalized || seenValues.has(normalized.toLowerCase())) continue;
    seenValues.add(normalized.toLowerCase());

    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    for (const match of text.matchAll(re)) {
      if (match.index === undefined) continue;
      pushNameSpan(all, text, match.index, match.index + match[0].length);
    }
  }

  return all.sort((a, b) => a.start - b.start);
}

/** Label-anchored + common immigration name shapes (regex layer; NER adds recall). */
export function detectNameSpans(text: string): Array<{ start: number; end: number; value: string }> {
  const spans: Array<{ start: number; end: number; value: string }> = [];

  for (const match of text.matchAll(NAME_CAPS_COMMA)) {
    if (match.index === undefined || !match[1]) continue;
    pushNameSpan(spans, text, match.index, match.index + match[1].length);
  }

  for (const match of text.matchAll(NAME_HONORIFIC)) {
    if (match.index === undefined || !match[2]) continue;
    const start = match.index + match[0].indexOf(match[2]);
    pushNameSpan(spans, text, start, start + match[2].length);
  }

  for (const match of text.matchAll(NAME_BENEFICIARY_TAIL)) {
    if (match.index === undefined || !match[1]) continue;
    const start = match.index + match[0].indexOf(match[1]);
    pushNameSpan(spans, text, start, start + match[1].length);
  }

  for (const match of text.matchAll(NAME_ATTENTION_HOLDER)) {
    if (match.index === undefined || !match[1]) continue;
    const start = match.index + match[0].indexOf(match[1]);
    pushNameSpan(spans, text, start, start + match[1].length);
  }

  for (const match of text.matchAll(NAME_FOR_TAIL)) {
    if (match.index === undefined || !match[1]) continue;
    const start = match.index + match[0].indexOf(match[1]);
    pushNameSpan(spans, text, start, start + match[1].length);
  }

  for (const match of text.matchAll(NAME_DEAR)) {
    if (match.index === undefined || !match[1]) continue;
    const start = match.index + match[0].indexOf(match[1]);
    pushNameSpan(spans, text, start, start + match[1].length);
  }

  for (const match of text.matchAll(NAME_ACTION_LEAD)) {
    if (match.index === undefined || !match[1]) continue;
    pushNameSpan(spans, text, match.index, match.index + match[1].length);
  }

  NAME_LABEL.lastIndex = 0;
  for (const labelMatch of text.matchAll(NAME_LABEL)) {
    if (labelMatch.index === undefined) continue;
    const searchStart = labelMatch.index + labelMatch[0].length;
    const window = text.slice(searchStart, searchStart + 80).split(/\r?\n/)[0] ?? "";
    const nameMatch = window.match(NAME_AFTER_LABEL);
    if (!nameMatch?.[1]) continue;
    const name = nameMatch[1].replace(/[,;.\s]+$/, "").trim();
    if (!name) continue;
    const start = searchStart + window.indexOf(name);
    pushNameSpan(spans, text, start, start + name.length);
  }

  return expandNameOccurrences(text, spans);
}

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
