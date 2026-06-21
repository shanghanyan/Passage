/** Strip common PII patterns from strings before Sentry export. */
export function scrubSentryText(value: string): string {
  return value
    .replace(/\bA-?\d{7,9}\b/gi, "[REDACTED_A_NUMBER]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
    .replace(/\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g, "[REDACTED_DOB]")
    .replace(/\bPassport\s*(?:No\.?|#)?\s*[A-Z0-9]{6,12}\b/gi, "[REDACTED_PASSPORT]")
    .replace(
      /\b\d{1,5}\s+[A-Za-z0-9.\s-]{8,}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
      "[REDACTED_ADDRESS]",
    );
}

export function scrubSentryExtra(extra: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(extra)) {
    if (typeof val === "string") out[key] = scrubSentryText(val);
    else if (Array.isArray(val)) {
      out[key] = val.map((item) => (typeof item === "string" ? scrubSentryText(item) : item));
    } else out[key] = val;
  }
  return out;
}
