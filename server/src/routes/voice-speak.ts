import type { Request, Response } from "express";
import { synthesizeSpeech } from "../lib/deepgram.js";
import { captureExternalError } from "../lib/sentry.js";

export async function postVoiceSpeak(req: Request, res: Response): Promise<void> {
  const { text, target_language: targetLanguage } = req.body ?? {};
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }

  const language = typeof targetLanguage === "string" && targetLanguage.trim()
    ? targetLanguage.trim()
    : "English";

  try {
    const audio = await synthesizeSpeech(text.trim(), language);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audio));
  } catch (err) {
    captureExternalError("voice-speak", err);
    const message = err instanceof Error ? err.message : "TTS failed";
    res.status(err instanceof Error && message.includes("TTS blocked") ? 400 : 502).json({ error: message });
  }
}
