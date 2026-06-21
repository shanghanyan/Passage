/**
 * Export synthetic docs as JSONL for Arize AX eval datasets (labeled counts only — no raw PII).
 * Run: npm run export:eval-dataset --prefix server
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const docs = JSON.parse(
  readFileSync(join(__dirname, "../src/data/synthetic-docs.json"), "utf8"),
);

const outPath = join(__dirname, "../eval-dataset.jsonl");

const lines = docs.map((doc) => {
  const byType = {};
  for (const span of doc.labeledSpans) {
    byType[span.type] = (byType[span.type] ?? 0) + 1;
  }
  return JSON.stringify({
    id: doc.id,
    title: doc.title,
    labeled_count: doc.labeledSpans.length,
    labeled_by_type: byType,
    has_planted_failure: doc.id.includes("planted") || doc.title.includes("Planted"),
  });
});

writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${lines.length} eval examples → ${outPath}`);
console.log("Import into Arize AX Datasets; pair with live redaction-check spans (recall_by_type attributes).");
