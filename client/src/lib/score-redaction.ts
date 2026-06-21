import type { DetectedSpan, PiiType } from "./types";

const PII_TYPES: PiiType[] = ["NAME", "A_NUMBER", "SSN", "DOB", "PASSPORT", "ADDRESS"];

export type RecallByType = Partial<Record<PiiType, number>>;

export function computeRecall(
  detectedSpans: DetectedSpan[],
  labeledSpans: Array<{ type: PiiType; value: string }>,
): number {
  if (labeledSpans.length === 0) return 1;

  const normalize = (s: string) => s.toLowerCase().trim();
  let matched = 0;

  for (const truth of labeledSpans) {
    const hit = detectedSpans.some((d) => {
      const dv = normalize(d.value);
      const tv = normalize(truth.value);
      return dv === tv || dv.includes(tv) || tv.includes(dv);
    });
    if (hit) matched++;
  }

  return matched / labeledSpans.length;
}

export function computeRecallByType(
  detectedSpans: DetectedSpan[],
  labeledSpans: Array<{ type: PiiType; value: string }>,
): RecallByType {
  const out: RecallByType = {};
  const normalize = (s: string) => s.toLowerCase().trim();

  for (const type of PII_TYPES) {
    const truths = labeledSpans.filter((s) => s.type === type);
    if (truths.length === 0) continue;

    let matched = 0;
    for (const truth of truths) {
      const hit = detectedSpans.some((d) => {
        if (d.type !== type) return false;
        const dv = normalize(d.value);
        const tv = normalize(truth.value);
        return dv === tv || dv.includes(tv) || tv.includes(dv);
      });
      if (hit) matched++;
    }
    out[type] = matched / truths.length;
  }

  return out;
}

const RECALL_ALERT_THRESHOLD = 0.75;

export function shouldAlertRecall(recall: number, recallByType?: RecallByType): boolean {
  if (recall < RECALL_ALERT_THRESHOLD) return true;
  const nameRecall = recallByType?.NAME;
  if (nameRecall != null && nameRecall < RECALL_ALERT_THRESHOLD) return true;
  return false;
}

export async function reportRedactionScore(params: {
  docId: string;
  sessionId: string;
  recall: number;
  detectedCount: number;
  labeledCount: number;
  recallByType?: RecallByType;
  runId?: string;
}): Promise<void> {
  await fetch("/api/score-redaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doc_id: params.docId,
      session_id: params.sessionId,
      recall: params.recall,
      detected_count: params.detectedCount,
      labeled_count: params.labeledCount,
      recall_by_type: params.recallByType,
      run_id: params.runId,
      detector: "browser",
    }),
  });
}
