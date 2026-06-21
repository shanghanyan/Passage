import Anthropic from "@anthropic-ai/sdk";
import { captureExternalError } from "./sentry.js";
import { IMMIGRATION_GLOSSARY } from "./immigration-glossary.js";
import { verifyTranslationMeaning } from "./translation-verify.js";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT_BASE = `You are translating and explaining a U.S. immigration document for someone who does
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
   describe the field type generally rather than guessing the value.
6. Preserve all dates, deadlines, and day-count phrases exactly — these are legally critical.

${IMMIGRATION_GLOSSARY}`;

const TRANSLATION_TOOL: Anthropic.Tool = {
  name: "submit_translation",
  description:
    "Submit the tokenized translation and plain-language explanation. Never advise how to respond — explain only.",
  input_schema: {
    type: "object",
    properties: {
      translation: {
        type: "string",
        description: "Full document translated into the target language with every ⟦PII:…⟧ token preserved exactly",
      },
      explanation: {
        type: "string",
        description: "Plain-language explanation of what each section is asking for (no legal advice)",
      },
      critical_dates: {
        type: "array",
        items: { type: "string" },
        description: "Every date found in the source (MM/DD/YYYY or Month DD, YYYY), unchanged",
      },
      critical_deadlines: {
        type: "array",
        items: { type: "string" },
        description: 'Day-count deadlines verbatim, e.g. "within 30 days"',
      },
    },
    required: ["translation", "explanation"],
    additionalProperties: false,
  },
};

function systemBlocks(targetLanguage: string): Anthropic.Messages.MessageCreateParams["system"] {
  return [
    {
      type: "text",
      text: SYSTEM_PROMPT_BASE.replace(/\{\{target_language\}\}/g, targetLanguage),
      cache_control: { type: "ephemeral" },
    },
  ];
}

function formatStructuredOutput(input: {
  translation: string;
  explanation: string;
}): string {
  return `## Translation\n${input.translation.trim()}\n\n---\n\n## Explanation\n${input.explanation.trim()}`;
}

function parseToolTranslation(message: Anthropic.Message): string | null {
  for (const block of message.content) {
    if (block.type !== "tool_use" || block.name !== "submit_translation") continue;
    const input = block.input as {
      translation?: string;
      explanation?: string;
    };
    if (!input.translation?.trim() || !input.explanation?.trim()) return null;
    return formatStructuredOutput({
      translation: input.translation,
      explanation: input.explanation,
    });
  }
  return null;
}

export interface TranslateResult {
  text: string;
  traceId: string;
  meaningCheck: { ok: true } | { ok: false; reason: string };
}

export async function translateRedactedText(
  redactedText: string,
  targetLanguage: string,
  options: { skipMeaningCheck?: boolean } = {},
): Promise<TranslateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1800,
      system: systemBlocks(targetLanguage),
      tools: [TRANSLATION_TOOL],
      tool_choice: { type: "tool", name: "submit_translation" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: redactedText,
              cache_control: { type: "ephemeral" },
            },
          ],
        },
      ],
    });

    let text = parseToolTranslation(message);
    if (!text) {
      const fallback = message.content.find((b) => b.type === "text");
      if (fallback?.type !== "text") throw new Error("Unexpected Claude response shape");
      text = fallback.text;
    }

    let meaningCheck: TranslateResult["meaningCheck"] = { ok: true };
    if (!options.skipMeaningCheck) {
      meaningCheck = await verifyBackTranslation(anthropic, text, redactedText, targetLanguage);
    }

    return { text, traceId: message.id, meaningCheck };
  } catch (err) {
    captureExternalError("claude", err, { targetLanguage });
    throw err;
  }
}

async function verifyBackTranslation(
  anthropic: Anthropic,
  translatedOutput: string,
  redactedSource: string,
  targetLanguage: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!extractCriticalDatesFromEither(redactedSource)) {
    return { ok: true };
  }

  try {
    const backMessage = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: [
        {
          type: "text",
          text: `Translate the following ${targetLanguage} immigration document text back into English.
Preserve every ⟦PII:TYPE:n⟧ token exactly. Preserve all dates and "within N days" deadlines verbatim.`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: translatedOutput }],
    });

    const block = backMessage.content[0];
    if (block.type !== "text") return { ok: true };

    const verification = verifyTranslationMeaning(redactedSource, block.text);
    if (!verification.ok) {
      return { ok: false, reason: verification.reason };
    }
    return { ok: true };
  } catch (err) {
    captureExternalError("claude-back-translate", err, { targetLanguage });
    return { ok: true };
  }
}

function extractCriticalDatesFromEither(text: string): boolean {
  return /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/.test(text) ||
    /\b(within|in)\s+\d+\s+(calendar\s+)?days?\b/i.test(text);
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
  priorTurns: Array<{ role: "user" | "assistant"; content: string }> = [],
): Promise<{ answer: string; traceId: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });
  const system: Anthropic.Messages.MessageCreateParams["system"] = [
    {
      type: "text",
      text:
        SYSTEM_PROMPT_BASE.replace(/\{\{target_language\}\}/g, targetLanguage) +
        VOICE_ADDENDUM.replace(/\{\{target_language\}\}/g, targetLanguage),
      cache_control: { type: "ephemeral" },
    },
  ];

  const messages: Anthropic.MessageParam[] = [
    ...priorTurns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: "user" as const,
      content: [
        {
          type: "text" as const,
          text: `Redacted document:\n${redactedText}\n\nUser question: ${transcript}`,
          cache_control: { type: "ephemeral" },
        },
      ],
    },
  ];

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      system,
      messages,
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
): { ok: true } | { ok: false; expected: number; found: number; unexpected?: string[]; missing?: string[] } {
  const inputTokens = uniqueTokens(redactedInput);
  const inputSet = new Set(inputTokens);
  const outputTokens = claudeOutput.match(TOKEN_PATTERN) ?? [];
  const foundKeys = [...new Set(outputTokens)];

  const unexpected = foundKeys.filter((k) => !inputSet.has(k));
  const missing = inputTokens.filter((k) => !claudeOutput.includes(k));

  if (unexpected.length === 0 && missing.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    expected: inputTokens.length,
    found: foundKeys.length,
    unexpected,
    missing,
  };
}

/** Deterministic demo failure — strips every occurrence of the last input token. */
export function simulatePlantedValidationFailure(claudeOutput: string, redactedInput: string): string {
  const tokens = uniqueTokens(redactedInput);
  if (tokens.length === 0) return claudeOutput;
  const last = tokens[tokens.length - 1];
  return claudeOutput.split(last).join("[removed-for-demo]");
}
