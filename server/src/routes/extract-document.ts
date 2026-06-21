import type { Request, Response } from "express";
import { extractTextFromDocument } from "../lib/document-extract.js";
import { assertRateLimit, RateLimitError } from "../lib/session-store.js";
import { captureExternalError } from "../lib/sentry.js";

/** Server fallback only — primary path is client-side pdf.js + Tesseract.js. */
export async function postExtractDocument(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ ok: false, error: "No file uploaded" });
    return;
  }

  const sessionId = typeof req.headers["x-session-id"] === "string" ? req.headers["x-session-id"] : "extract-fallback";

  try {
    await assertRateLimit(sessionId, "extract-document");
  } catch (err) {
    if (err instanceof RateLimitError) {
      res.status(429).json({ ok: false, error: err.message });
      return;
    }
  }

  res.setHeader("X-Passage-Extract-Path", "server-fallback");

  try {
    const result = await extractTextFromDocument(file.buffer, file.mimetype, file.originalname);
    console.warn(
      `Server extract fallback used (${result.method}, ${result.charCount} chars) — prefer client-side extraction`,
    );
    res.json({
      ok: true,
      text: result.text,
      method: result.method,
      char_count: result.charCount,
      fallback: true,
    });
  } catch (err) {
    captureExternalError("extract-document", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    res.status(422).json({ ok: false, error: message });
  }
}
