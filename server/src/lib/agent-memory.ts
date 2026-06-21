/**
 * Redis Cloud Agent Memory — voice session history (PII-free turns only).
 * REST API: https://redis.io/docs/latest/develop/ai/context-engine/agent-memory/api-examples/
 */

export interface VoiceTurn {
  role: "user" | "assistant";
  text: string;
}

interface AgentMemoryConfig {
  baseUrl: string;
  storeId: string;
  apiKey: string;
}

function getConfig(): AgentMemoryConfig | null {
  const baseUrl = (process.env.AGENT_MEMORY_URL ?? process.env.AGENT_MEMORY_ENDPOINT ?? "").replace(
    /\/$/,
    "",
  );
  const storeId = process.env.AGENT_MEMORY_STORE_ID ?? "";
  const apiKey = process.env.AGENT_MEMORY_API_KEY ?? "";
  if (!baseUrl || !storeId || !apiKey) return null;
  return { baseUrl, storeId, apiKey };
}

export function isAgentMemoryConfigured(): boolean {
  return getConfig() !== null;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function eventText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (typeof part === "object" && part && "text" in part ? String(part.text) : ""))
    .join("")
    .trim();
}

/** Block storing raw PII or non-tokenized confidential patterns in agent memory. */
export function assertMemoryTextSafe(text: string): void {
  const patterns = [
    /\bA-?\d{7,9}\b/i,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/,
    /\bPassport\s*(?:No\.?|#)?\s*[A-Z0-9]{6,12}\b/i,
  ];
  for (const p of patterns) {
    if (p.test(text)) throw new Error("Agent memory blocked: raw PII pattern in content");
  }
}

/** Only redacted/tokenized turns may be persisted — never raw STT or reinserted text. */
export function assertMemoryExchangeSafe(userText: string, assistantText: string): void {
  assertMemoryTextSafe(userText);
  assertMemoryTextSafe(assistantText);
  if (/\b\d{1,5}\s+[A-Za-z0-9.\s-]{8,}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Terrace|Court|Ct)\b/i.test(userText)) {
    throw new Error("Agent memory blocked: possible raw address in user turn");
  }
}

export async function getVoiceSessionTurns(sessionId: string, limit = 8): Promise<VoiceTurn[]> {
  const cfg = getConfig();
  if (!cfg) return [];

  try {
    const url = new URL(`${cfg.baseUrl}/v1/stores/${cfg.storeId}/session-memory`);
    url.searchParams.set("sessionId", sessionId);

    const res = await fetch(url, { headers: authHeaders(cfg.apiKey) });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      events?: Array<{ role?: string; content?: unknown }>;
    };

    const turns: VoiceTurn[] = [];
    for (const event of data.events ?? []) {
      const text = eventText(event.content);
      if (!text) continue;
      const role = event.role?.toUpperCase() === "ASSISTANT" ? "assistant" : "user";
      turns.push({ role, text });
    }

    return turns.slice(-limit);
  } catch {
    return [];
  }
}

export async function appendVoiceSessionTurn(
  sessionId: string,
  role: "USER" | "ASSISTANT",
  text: string,
  actorId = "passage-user",
): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;

  assertMemoryTextSafe(text);

  const res = await fetch(`${cfg.baseUrl}/v1/stores/${cfg.storeId}/session-memory/events`, {
    method: "POST",
    headers: authHeaders(cfg.apiKey),
    body: JSON.stringify({
      sessionId,
      actorId: role === "USER" ? actorId : "passage-assistant",
      role,
      content: [{ text }],
      createdAt: new Date().toISOString(),
      metadata: { source: "passage-voice", pii_free: true },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Agent memory write failed (${res.status}): ${detail}`);
  }
}

export async function saveVoiceExchange(
  sessionId: string,
  redactedUserText: string,
  tokenizedAssistantText: string,
): Promise<void> {
  assertMemoryExchangeSafe(redactedUserText, tokenizedAssistantText);
  await appendVoiceSessionTurn(sessionId, "USER", redactedUserText);
  await appendVoiceSessionTurn(sessionId, "ASSISTANT", tokenizedAssistantText);
}
