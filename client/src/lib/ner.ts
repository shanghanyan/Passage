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
    spans.push({
      type,
      start: entity.start,
      end: entity.end,
      value: text.slice(entity.start, entity.end),
      confidence: entity.score,
    });
  }

  return spans;
}
