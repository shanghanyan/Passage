/**
 * Redis LangCache — semantic cache for voice FAQ (PII-free prompts/responses only).
 * REST API: https://redis.io/docs/latest/develop/ai/langcache/api-examples/
 */

import { createHash } from "node:crypto";
import { assertMemoryTextSafe } from "./agent-memory.js";

interface LangCacheConfig {
  baseUrl: string;
  cacheId: string;
  apiKey: string;
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

/** Scope cache to redacted doc fingerprint + question — never raw document text. */
export function buildVoiceCachePrompt(redactedText: string, question: string): string {
  const docFingerprint = createHash("sha256").update(redactedText).digest("hex").slice(0, 16);
  return `[passage:${docFingerprint}]\nQ: ${question.trim()}`;
}

export async function searchVoiceCache(prompt: string): Promise<string | null> {
  const cfg = getConfig();
  if (!cfg) return null;

  assertMemoryTextSafe(prompt);

  try {
    const res = await fetch(`${cfg.baseUrl}/v1/caches/${cfg.cacheId}/entries/search`, {
      method: "POST",
      headers: authHeaders(cfg.apiKey),
      body: JSON.stringify({ prompt, numResults: 1 }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: Array<{ response?: string; similarity?: number }>;
    };

    const hit = data.data?.[0];
    if (!hit?.response) return null;
    assertMemoryTextSafe(hit.response);
    return hit.response;
  } catch {
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
