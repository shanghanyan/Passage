const DATE_NUMERIC = /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g;
const DATE_TEXT =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(19|20)\d{2}\b/gi;
const DAY_COUNT = /\b(within|in)\s+(\d+)\s+(calendar\s+)?days?\b/gi;
const TOKEN_PATTERN = /⟦PII:[A-Z_]+:\d+⟧/g;

function normalizeDate(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function extractCriticalDates(text: string): string[] {
  const dates = new Set<string>();
  for (const match of text.matchAll(DATE_NUMERIC)) dates.add(normalizeDate(match[0]));
  for (const match of text.matchAll(DATE_TEXT)) dates.add(normalizeDate(match[0]));
  return [...dates];
}

export function extractDayCountDeadlines(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(DAY_COUNT)) {
    found.push(normalizeDate(match[0]));
  }
  return found;
}

/** Compare redacted source vs back-translated English for date/deadline drift. */
export function verifyTranslationMeaning(
  redactedSource: string,
  backTranslatedEnglish: string,
): { ok: true } | { ok: false; reason: string; missingDates: string[]; missingDeadlines: string[] } {
  const sourceDates = extractCriticalDates(redactedSource);
  const backDates = extractCriticalDates(backTranslatedEnglish);
  const sourceDeadlines = extractDayCountDeadlines(redactedSource);
  const backDeadlines = extractDayCountDeadlines(backTranslatedEnglish);

  const backDateSet = new Set(backDates);
  const missingDates = sourceDates.filter((d) => !backDateSet.has(d));

  const backDeadlineSet = new Set(backDeadlines);
  const missingDeadlines = sourceDeadlines.filter((d) => !backDeadlineSet.has(d));

  if (missingDates.length === 0 && missingDeadlines.length === 0) {
    return { ok: true };
  }

  const parts: string[] = [];
  if (missingDates.length) parts.push(`dates missing after back-translation: ${missingDates.join(", ")}`);
  if (missingDeadlines.length) parts.push(`deadline phrases missing: ${missingDeadlines.join(", ")}`);

  return {
    ok: false,
    reason: parts.join("; "),
    missingDates,
    missingDeadlines,
  };
}

export function stripTokensForCompare(text: string): string {
  return text.replace(TOKEN_PATTERN, "[TOKEN]").replace(/\s+/g, " ").trim();
}
