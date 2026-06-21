import type { Request, Response } from "express";
import { transcribeAudio } from "../lib/deepgram.js";
import { captureExternalError } from "../lib/sentry.js";

export async function postVoiceTranscribe(req: Request, res: Response): Promise<void> {
  try {
    const mimeType = typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "audio/webm";
    const buffer = req.body as Buffer;

    if (!buffer?.length) {
      res.status(400).json({ error: "Empty audio body" });
      return;
    }

    const transcript = await transcribeAudio(new Uint8Array(buffer).buffer, mimeType);
    res.json({ transcript });
  } catch (err) {
    captureExternalError("voice-transcribe", err);
    res.status(502).json({ error: "Transcription failed" });
  }
}
