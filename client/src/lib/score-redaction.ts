import type { DetectedSpan, PiiType } from "./types";

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

export async function reportRedactionScore(params: {
  docId: string;
  sessionId: string;
  recall: number;
  detectedCount: number;
  labeledCount: number;
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
      run_id: params.runId,
      detector: "browser",
    }),
  });
}
