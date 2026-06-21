import type { Request, Response } from "express";
import {
  simulatePlantedValidationFailure,
  translateRedactedText,
  validateTokenPreservation,
} from "../lib/claude.js";
import { captureExternalError, captureValidationMismatch } from "../lib/sentry.js";

const FALLBACK =
  "We couldn't safely process this section — try again or review manually.";

export async function postTranslate(req: Request, res: Response): Promise<void> {
  const { redacted_text, target_language, session_id, planted_validation_failure } = req.body ?? {};

  if (typeof redacted_text !== "string" || !redacted_text.trim()) {
    res.status(400).json({ ok: false, fallback: "Missing redacted text." });
    return;
  }
  if (typeof target_language !== "string" || !target_language.trim()) {
    res.status(400).json({ ok: false, fallback: "Missing target language." });
    return;
  }

  const sessionId = typeof session_id === "string" ? session_id : "unknown";

  try {
    const { text, traceId } = await translateRedactedText(redacted_text, target_language.trim());

    let output = text;
    if (planted_validation_failure === true) {
      output = simulatePlantedValidationFailure(output, redacted_text);
    }

    const validation = validateTokenPreservation(redacted_text, output, sessionId);
    if (!validation.ok) {
      captureValidationMismatch({
        expected: validation.expected,
        found: validation.found,
        sessionId,
      });
      res.json({ ok: false, fallback: FALLBACK });
      return;
    }

    res.json({ ok: true, translated_text: output, trace_id: traceId });
  } catch (err) {
    captureExternalError("translate", err, { sessionId });
    res.status(502).json({ ok: false, fallback: FALLBACK });
  }
}
