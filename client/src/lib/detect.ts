import { findPassportSpans, detectAddressStreetShape, PII_PATTERNS } from "./patterns";
import { detectNerSpans } from "./ner";
import { mergeSpans } from "./merge-spans";
import { validateSpans } from "./validate-spans";
import type { DetectedSpan, PiiType } from "./types";

export { mergeSpans, mergeSpansWithDropped } from "./merge-spans";

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
      source: "regex",
    });
  }
  return spans;
}

export function detectRegexOnly(text: string): DetectedSpan[] {
  const regexResults: DetectedSpan[] = [
    ...regexSpans(text, PII_PATTERNS.A_NUMBER, "A_NUMBER"),
    ...regexSpans(text, PII_PATTERNS.SSN, "SSN"),
    ...regexSpans(text, PII_PATTERNS.DOB_NUMERIC, "DOB"),
    ...regexSpans(text, PII_PATTERNS.DOB_TEXT, "DOB"),
    ...detectAddressStreetShape(text).map((s) => ({
      ...s,
      type: "ADDRESS" as const,
      source: "regex" as const,
    })),
    ...findPassportSpans(text).map((s) => ({ ...s, type: "PASSPORT" as const, source: "regex" as const })),
  ];
  return validateSpans(mergeSpans(regexResults), text);
}

export interface DetectPiiResult {
  spans: DetectedSpan[];
  nerError?: string;
}

/** NER is best-effort — regex-only fallback if the model fails to load or run. */
export async function detectPiiWithStatus(
  text: string,
  options: { includeNer?: boolean } = {},
): Promise<DetectPiiResult> {
  const regexResults = detectRegexOnly(text);

  if (options.includeNer === false) {
    return { spans: regexResults };
  }

  try {
    const nerResults = await detectNerSpans(text);
    return { spans: validateSpans(mergeSpans([...regexResults, ...nerResults]), text) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { spans: regexResults, nerError: `NER unavailable — regex only (${message})` };
  }
}

export async function detectPii(
  text: string,
  options: { includeNer?: boolean } = {},
): Promise<DetectedSpan[]> {
  const { spans } = await detectPiiWithStatus(text, options);
  return spans;
}
