import type { Request, Response } from "express";
import { getVoiceSessionTurns, isAgentMemoryConfigured, saveVoiceExchange } from "../lib/agent-memory.js";
import { answerVoiceQuestion } from "../lib/claude.js";
import { assertTtsTextSafe } from "../lib/deepgram.js";
import { extractExplanationText } from "../lib/explanation-text.js";
import {
  buildVoiceCachePrompt,
  getLangCacheStats,
  isLangCacheConfigured,
  searchVoiceCache,
  storeVoiceCache,
} from "../lib/lang-cache.js";
import { assertRateLimit, RateLimitError } from "../lib/session-store.js";
import { captureExternalError } from "../lib/sentry.js";

const FALLBACK = "We couldn't safely process this section — try again or review manually.";

export async function postVoiceQuestion(req: Request, res: Response): Promise<void> {
  const { transcript, session_id, redacted_text, target_language } = req.body ?? {};

  if (typeof transcript !== "string" || !transcript.trim()) {
    res.status(400).json({ error: "transcript required" });
    return;
  }
  if (typeof redacted_text !== "string" || !redacted_text.trim()) {
    res.status(400).json({ error: "redacted_text required" });
    return;
  }

  const sessionId = typeof session_id === "string" ? session_id : "unknown";
  const targetLanguage = typeof target_language === "string" ? target_language.trim() : "Spanish";
  const question = transcript.trim();

  try {
    await assertRateLimit(sessionId, "voice");
  } catch (err) {
    if (err instanceof RateLimitError) {
      res.status(429).json({ ok: false, fallback: err.message });
      return;
    }
    throw err;
  }

  try {
    const cachePrompt = buildVoiceCachePrompt(redacted_text, question);
    let answer: string;
    let fromCache = false;
    let cacheSimilarity: number | null = null;
    let memoryTurns = 0;

    const cached = await searchVoiceCache(cachePrompt);
    if (cached) {
      answer = cached.response;
      fromCache = true;
      cacheSimilarity = cached.similarity;
    } else {
      const priorTurns = await getVoiceSessionTurns(sessionId);
      memoryTurns = priorTurns.length;

      const claudeTurns = priorTurns.map((turn) => ({
        role: turn.role,
        content: turn.text,
      }));

      const result = await answerVoiceQuestion(redacted_text, targetLanguage, question, claudeTurns);
      answer = result.answer;

      void storeVoiceCache(cachePrompt, answer).catch((err) =>
        console.warn("LangCache store skipped:", (err as Error).message),
      );
    }

    assertTtsTextSafe(answer);
    const ttsText = extractExplanationText(answer) || answer;
    assertTtsTextSafe(ttsText);

    if (isAgentMemoryConfigured()) {
      void saveVoiceExchange(sessionId, question, answer).catch((err) =>
        console.warn("Agent memory save skipped:", (err as Error).message),
      );
    }

    const cacheStats = getLangCacheStats();

    res.json({
      ok: true,
      answer_text: answer,
      tts_text: ttsText,
      from_cache: fromCache,
      cache_similarity: cacheSimilarity,
      langcache_hit_rate: cacheStats.hitRate,
      memory_turns: memoryTurns,
      agent_memory: isAgentMemoryConfigured(),
      langcache: isLangCacheConfigured(),
    });
  } catch (err) {
    captureExternalError("voice-question", err, { sessionId });
    res.status(502).json({ ok: false, fallback: FALLBACK });
  }
}
