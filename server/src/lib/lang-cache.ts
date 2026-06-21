/**
 * Redis LangCache — semantic cache for voice FAQ (PII-free prompts/responses only).
 */
import { createHash } from "node:crypto";
import { assertMemoryTextSafe } from "./agent-memory.js";

interface LangCacheConfig {
  baseUrl: string;
  cacheId: string;
  apiKey: string;
}

export interface LangCacheHit {
  response: string;
  similarity: number;
}

let cacheHits = 0;
let cacheMisses = 0;

export function getLangCacheStats(): { hits: number; misses: number; hitRate: number | null } {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: total > 0 ? cacheHits / total : null,
  };
}

function getConfig(): LangCacheConfig | null {
  const baseUrl = (process.env.LANGCACHE_URL ?? "").replace(/\/$/, "");
  const cacheId = process.env.LANGCACHE_CACHE_ID ?? "";
  const apiKey = process.env.LANGCACHE_API_KEY ?? "";
  if (!baseUrl || !cacheId || !apiKey) return null;
  return { baseUrl, cacheId, apiKey };
}

export function isLangCacheConfigured(): boolean {
  return getConfig() !== null;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function buildVoiceCachePrompt(redactedText: string, question: string): string {
  const docFingerprint = createHash("sha256").update(redactedText).digest("hex").slice(0, 16);
  return `[passage:${docFingerprint}]\nQ: ${question.trim()}`;
}

export async function searchVoiceCache(prompt: string): Promise<LangCacheHit | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  try {
    assertMemoryTextSafe(prompt);

    const res = await fetch(`${cfg.baseUrl}/v1/caches/${cfg.cacheId}/entries/search`, {
      method: "POST",
      headers: authHeaders(cfg.apiKey),
      body: JSON.stringify({ prompt, numResults: 1 }),
    });

    if (!res.ok) {
      cacheMisses += 1;
      return null;
    }

    const data = (await res.json()) as {
      data?: Array<{ response?: string; similarity?: number }>;
    };

    const hit = data.data?.[0];
    if (!hit?.response) {
      cacheMisses += 1;
      return null;
    }
    assertMemoryTextSafe(hit.response);
    cacheHits += 1;
    return {
      response: hit.response,
      similarity: typeof hit.similarity === "number" ? hit.similarity : 1,
    };
  } catch {
    cacheMisses += 1;
    return null;
  }
}

export async function storeVoiceCache(prompt: string, response: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;

  assertMemoryTextSafe(prompt);
  assertMemoryTextSafe(response);

  const res = await fetch(`${cfg.baseUrl}/v1/caches/${cfg.cacheId}/entries`, {
    method: "POST",
    headers: authHeaders(cfg.apiKey),
    body: JSON.stringify({ prompt, response }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LangCache store failed (${res.status}): ${detail}`);
  }
}
