import { detectPii } from "./detect";
import { redact } from "./redact";
import { validateSpans } from "./validate-spans";
import type { TokenMeta } from "./types";

export interface PrepareVoiceQuestionResult {
  redacted: string;
  tokenMap: Record<string, string>;
  newTokens: Record<string, string>;
  newTokenMeta: Record<string, TokenMeta>;
}

/**
 * Run full client-side PII detection + tokenization on a voice transcript BEFORE any
 * backend call. Token map stays in browser memory only — never written to Redis.
 */
export async function prepareVoiceQuestion(
  rawTranscript: string,
  existingTokenMap: Record<string, string> = {},
  options: { includeNer?: boolean } = {},
): Promise<PrepareVoiceQuestionResult> {
  const trimmed = rawTranscript.trim();
  if (!trimmed) {
    throw new Error("Transcript is empty");
  }

  let spans;
  try {
    spans = await detectPii(trimmed, { includeNer: options.includeNer ?? true });
  } catch {
    spans = await detectPii(trimmed, { includeNer: false });
  }
  spans = validateSpans(spans, trimmed);

  const { redacted, tokenMap: newTokens, tokenMeta: newTokenMeta } = redact(trimmed, spans, existingTokenMap);
  const mergedMap = { ...existingTokenMap, ...newTokens };

  for (const raw of Object.values(newTokens)) {
    if (raw.length >= 4 && redacted.includes(raw)) {
      throw new Error("Voice redaction failed — raw value survived tokenization");
    }
  }

  return { redacted, tokenMap: mergedMap, newTokens, newTokenMeta };
}
