import type { Request, Response } from "express";
import { listRelatedDocuments } from "../lib/related-documents.js";
import { captureExternalError } from "../lib/sentry.js";

export async function postRelatedDocuments(req: Request, res: Response): Promise<void> {
  const { redacted_text, session_id } = req.body ?? {};

  if (typeof redacted_text !== "string" || !redacted_text.trim()) {
    res.status(400).json({ ok: false, error: "redacted_text required" });
    return;
  }

  const sessionId = typeof session_id === "string" ? session_id : "unknown";

  try {
    const result = await listRelatedDocuments(redacted_text.trim());
    res.json({
      ok: true,
      process: result.process,
      documents: result.documents,
      trace_id: result.traceId,
      session_id: sessionId,
    });
  } catch (err) {
    captureExternalError("related-documents-route", err, { sessionId });
    res.status(502).json({ ok: false, error: "Could not generate related documents list" });
  }
}
