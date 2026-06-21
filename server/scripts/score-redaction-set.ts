import "../src/instrumentation.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeRecall, detectPiiRegex } from "../src/lib/detection-patterns.js";
import { scoreRedaction } from "../src/lib/score-redaction.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SyntheticDoc {
  id: string;
  title: string;
  text: string;
  labeledSpans: Array<{ type: string; value: string }>;
  plantedValidationFailure?: boolean;
  plantedDetectionFailure?: boolean;
}

const docs = JSON.parse(
  readFileSync(join(__dirname, "../src/data/synthetic-docs.json"), "utf8"),
) as SyntheticDoc[];

const runId = process.argv[2] ?? `run-${new Date().toISOString().slice(0, 16)}`;

console.log(`Scoring ${docs.length} synthetic docs → observability (run_id: ${runId})\n`);

for (const doc of docs) {
  const detected = detectPiiRegex(doc.text);
  const recall = computeRecall(detected, doc.labeledSpans);
  const sessionId = `score-${doc.id}-${Date.now()}`;

  scoreRedaction({
    docId: doc.id,
    sessionId,
    recall,
    detectedCount: detected.length,
    labeledCount: doc.labeledSpans.length,
    runId,
    detector: "regex-script",
  });

  console.log(
    `${doc.id.padEnd(32)} recall=${(recall * 100).toFixed(0)}%  (${detected.length} detected / ${doc.labeledSpans.length} labeled)`,
  );
}

console.log("\nDone. Filter spans by name 'redaction-check' or attribute redaction.run_id =", runId);
