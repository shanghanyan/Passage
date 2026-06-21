import Anthropic from "@anthropic-ai/sdk";
import { captureExternalError } from "./sentry.js";

const SYSTEM_PROMPT = `You are translating and explaining a U.S. immigration document for someone who does
not read English fluently. The text has had personal identifiers replaced with
placeholder tokens of the form ⟦PII:TYPE:n⟧ (e.g. ⟦PII:NAME:1⟧, ⟦PII:A_NUMBER:1⟧).

Rules:
1. Never guess, infer, or fill in what a placeholder token represents.
2. Reproduce every placeholder token exactly, in its original position, in your output.
3. Translate the surrounding text into {{target_language}} and add a short
   plain-language explanation of what each section is asking for or telling the person.
4. Explain what is being asked. Do not advise the person on how to answer it —
   that's legal advice, and out of scope.
5. If a sentence can't be understood without knowing what a token represents,
   describe the field type generally rather than guessing the value.`;

export async function translateRedactedText(
  redactedText: string,
  targetLanguage: string,
): Promise<{ text: string; traceId: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT.replace("{{target_language}}", targetLanguage),
      messages: [{ role: "user", content: redactedText }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected Claude response shape");

    return { text: block.text, traceId: message.id };
  } catch (err) {
    captureExternalError("claude", err, { targetLanguage });
    throw err;
  }
}

const VOICE_ADDENDUM = `

The user is asking a follow-up question about the redacted document below.
Answer in {{target_language}} using the same rules as before.
Use only the redacted document context — never guess token values.
Keep the answer concise and suitable for text-to-speech (no markdown tables).`;

export async function answerVoiceQuestion(
  redactedText: string,
  targetLanguage: string,
  transcript: string,
): Promise<{ answer: string; traceId: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });
  const system =
    SYSTEM_PROMPT.replace("{{target_language}}", targetLanguage) +
    VOICE_ADDENDUM.replace("{{target_language}}", targetLanguage);

  const userContent = `Redacted document:\n${redactedText}\n\nUser question: ${transcript}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: userContent }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected Claude response shape");

    return { answer: block.text, traceId: message.id };
  } catch (err) {
    captureExternalError("claude-voice", err, { targetLanguage });
    throw err;
  }
}

const TOKEN_PATTERN = /⟦PII:[A-Z_]+:\d+⟧/g;

function uniqueTokens(text: string): string[] {
  return [...new Set(text.match(TOKEN_PATTERN) ?? [])];
}

export function validateTokenPreservation(
  redactedInput: string,
  claudeOutput: string,
  _sessionId: string,
): { ok: true } | { ok: false; expected: number; found: number } {
  const inputTokens = uniqueTokens(redactedInput);
  const outputTokens = claudeOutput.match(TOKEN_PATTERN) ?? [];

  for (const token of inputTokens) {
    if (!claudeOutput.includes(token)) {
      return { ok: false, expected: inputTokens.length, found: outputTokens.length };
    }
  }

  return { ok: true };
}

/** Deterministic demo failure — strips every occurrence of the last input token. */
export function simulatePlantedValidationFailure(claudeOutput: string, redactedInput: string): string {
  const tokens = uniqueTokens(redactedInput);
  if (tokens.length === 0) return claudeOutput;
  const last = tokens[tokens.length - 1];
  return claudeOutput.split(last).join("[removed-for-demo]");
}
