import type { Request, Response } from "express";
import { answerVoiceQuestion } from "../lib/claude.js";
import { assertTtsTextSafe } from "../lib/deepgram.js";
import { extractExplanationText } from "../lib/explanation-text.js";
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
    const result = await answerVoiceQuestion(redacted_text, targetLanguage, question, []);
    const answer = result.answer;

    assertTtsTextSafe(answer);
    const ttsText = extractExplanationText(answer) || answer;
    assertTtsTextSafe(ttsText);

    res.json({
      ok: true,
      answer_text: answer,
      tts_text: ttsText,
      from_cache: false,
      memory_turns: 0,
      agent_memory: false,
      langcache: false,
    });
  } catch (err) {
    captureExternalError("voice-question", err, { sessionId });
    res.status(502).json({ ok: false, fallback: FALLBACK });
  }
}
