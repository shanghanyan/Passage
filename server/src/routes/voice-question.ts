import type { Request, Response } from "express";
import { answerVoiceQuestion } from "../lib/claude.js";
import { assertTtsTextSafe } from "../lib/deepgram.js";
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

  try {
    const { answer } = await answerVoiceQuestion(redacted_text, targetLanguage, transcript.trim());

    // Voice answers are short — verify no raw PII leaked, not full token preservation
    assertTtsTextSafe(answer);

    res.json({ ok: true, answer_text: answer, tts_text: answer });
  } catch (err) {
    captureExternalError("voice-question", err, { sessionId });
    res.status(502).json({ ok: false, fallback: FALLBACK });
  }
}
