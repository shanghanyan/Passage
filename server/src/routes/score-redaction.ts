import type { Request, Response } from "express";
import { scoreRedaction } from "../lib/score-redaction.js";
import { captureRecallDrop, shouldAlertRecall } from "../lib/sentry.js";

/**
 * Accepts pre-computed recall metrics from the browser — no raw span values.
 */
export function postScoreRedaction(req: Request, res: Response): void {
  const { doc_id, session_id, recall, detected_count, labeled_count, recall_by_type, run_id, detector } =
    req.body ?? {};

  if (typeof doc_id !== "string" || !doc_id.trim()) {
    res.status(400).json({ error: "doc_id required" });
    return;
  }
  if (typeof session_id !== "string" || !session_id.trim()) {
    res.status(400).json({ error: "session_id required" });
    return;
  }
  if (typeof recall !== "number" || Number.isNaN(recall)) {
    res.status(400).json({ error: "recall must be a number" });
    return;
  }
  if (typeof detected_count !== "number" || typeof labeled_count !== "number") {
    res.status(400).json({ error: "detected_count and labeled_count required" });
    return;
  }

  const recallByType =
    recall_by_type && typeof recall_by_type === "object"
      ? (recall_by_type as Record<string, number>)
      : undefined;

  scoreRedaction({
    docId: doc_id.trim(),
    sessionId: session_id.trim(),
    recall,
    detectedCount: detected_count,
    labeledCount: labeled_count,
    recallByType,
    runId: typeof run_id === "string" ? run_id : undefined,
    detector: detector === "browser" ? "browser" : detector === "regex-script" ? "regex-script" : "browser",
  });

  if (shouldAlertRecall(recall, recallByType)) {
    captureRecallDrop({
      docId: doc_id.trim(),
      sessionId: session_id.trim(),
      recall,
      recallByType,
    });
  }

  res.json({ ok: true, recall, doc_id: doc_id.trim() });
}
