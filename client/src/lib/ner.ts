import { pipeline, type TokenClassificationPipeline } from "@huggingface/transformers";
import type { DetectedSpan } from "./types";

let nerPipeline: TokenClassificationPipeline | null = null;
let loadPromise: Promise<TokenClassificationPipeline> | null = null;

export async function loadNerModel(): Promise<TokenClassificationPipeline> {
  if (nerPipeline) return nerPipeline;
  if (!loadPromise) {
    loadPromise = pipeline("token-classification", "Xenova/bert-base-NER", {
      dtype: "q8",
    }) as Promise<TokenClassificationPipeline>;
  }
  nerPipeline = await loadPromise;
  return nerPipeline;
}

/** Minimum NER score to keep — recall-first: under-redaction leaks a name; over-redaction costs a token. */
export const RECALL_BIAS_NER_MIN_SCORE = 0.35;

/** Map NER entity labels to our PII types. */
function mapEntityLabel(label: string): "NAME" | "ADDRESS" | null {
  const normalized = label.replace(/^B-|^I-/, "");
  if (normalized === "PER") return "NAME";
  if (normalized === "LOC") return "ADDRESS";
  return null;
}

export async function detectNerSpans(text: string): Promise<DetectedSpan[]> {
  const classifier = await loadNerModel();
  const raw = await classifier(text, { aggregation_strategy: "simple" });
  const spans: DetectedSpan[] = [];

  for (const entity of raw) {
    const type = mapEntityLabel(entity.entity_group ?? entity.entity ?? "");
    if (!type) continue;
    if (entity.start === undefined || entity.end === undefined) continue;
    const score = typeof entity.score === "number" ? entity.score : 1;
    if (score < RECALL_BIAS_NER_MIN_SCORE) continue;
    spans.push({
      type,
      start: entity.start,
      end: entity.end,
      value: text.slice(entity.start, entity.end),
      confidence: score,
      source: "ner",
    });
  }

  return spans;
}
