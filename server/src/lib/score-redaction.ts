import { trace } from "@opentelemetry/api";

export interface ScoreRedactionInput {
  docId: string;
  sessionId: string;
  recall: number;
  detectedCount: number;
  labeledCount: number;
  recallByType?: Record<string, number>;
  runId?: string;
  detector?: "browser" | "regex-script";
}

/**
 * Emit a redaction-check span to Phoenix — metrics only, never raw PII values.
 */
export function scoreRedaction(input: ScoreRedactionInput): void {
  const tracer = trace.getTracer("passage-redaction");
  const span = tracer.startSpan("redaction-check");

  span.setAttribute("redaction.recall", input.recall);
  span.setAttribute("redaction.doc_id", input.docId);
  span.setAttribute("redaction.session_id", input.sessionId);
  span.setAttribute("redaction.detected_count", input.detectedCount);
  span.setAttribute("redaction.labeled_count", input.labeledCount);
  if (input.runId) span.setAttribute("redaction.run_id", input.runId);
  if (input.detector) span.setAttribute("redaction.detector", input.detector);

  if (input.recallByType) {
    for (const [type, value] of Object.entries(input.recallByType)) {
      span.setAttribute(`redaction.recall.${type.toLowerCase()}`, value);
    }
  }

  span.end();
}
