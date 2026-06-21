import type { Request, Response } from "express";
import { extractTextFromDocument } from "../lib/document-extract.js";
import { captureExternalError } from "../lib/sentry.js";

export async function postExtractDocument(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ ok: false, error: "No file uploaded" });
    return;
  }

  try {
    const result = await extractTextFromDocument(file.buffer, file.mimetype, file.originalname);
    console.log(
      `Document extract ok (${result.method}, ${result.charCount} chars) — raw file not stored; client must redact before Claude`,
    );
    res.json({
      ok: true,
      text: result.text,
      method: result.method,
      char_count: result.charCount,
    });
  } catch (err) {
    captureExternalError("extract-document", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    res.status(422).json({ ok: false, error: message });
  }
}
