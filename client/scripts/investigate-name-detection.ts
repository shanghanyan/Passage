/**
 * Part 1 investigation: name detection gaps across formats.
 * Run: npx tsx client/scripts/investigate-name-detection.ts
 */
import { detectRegexOnly, detectPiiWithStatus, mergeSpansWithDropped } from "../src/lib/detect.ts";
import { redact } from "../src/lib/redact.ts";
import { SYNTHETIC_DOCS } from "../src/data/synthetic-docs.ts";

const NAME_CASES: Array<{ id: string; text: string; expectedName: string }> = [
  {
    id: "hyphenated",
    text: "Re: Ana-Maria Rodriguez, A-123456789 must respond by April 30, 2024.",
    expectedName: "Ana-Maria Rodriguez",
  },
  {
    id: "all-caps",
    text: "Applicant: GARCIA, MARIA ELENA\nA-Number: A123456789",
    expectedName: "GARCIA, MARIA ELENA",
  },
  {
    id: "uncommon-label",
    text: "Attention — holder of record Li Wei Chen — submit Form I-765 by June 1, 2024.",
    expectedName: "Li Wei Chen",
  },
  {
    id: "second-occurrence",
    text: "Dear Maria Gonzalez,\n\nThis notice confirms receipt for Maria Gonzalez (A-123456789).",
    expectedName: "Maria Gonzalez",
  },
  {
    id: "middle-initial",
    text: "Beneficiary John Q. Public, A987654321, DOB 01/15/1980.",
    expectedName: "John Q. Public",
  },
  {
    id: "sentence-start",
    text: "Maria Gonzalez submitted evidence on March 1, 2024.",
    expectedName: "Maria Gonzalez",
  },
  {
    id: "paragraph-end",
    text: "Please contact the office regarding beneficiary Carlos Mendez.",
    expectedName: "Carlos Mendez",
  },
];

function nameInSpans(spans: { start: number; end: number; type: string; value: string }[], expected: string, text: string) {
  const hits = spans.filter((s) => s.type === "NAME" && text.slice(s.start, s.end).includes(expected.split(" ")[0]));
  return hits;
}

function classifyGap(
  regexSpans: ReturnType<typeof detectRegexOnly>,
  nerSpans: { type: string; start: number; end: number; value: string; source?: string }[],
  merged: ReturnType<typeof mergeSpansWithDropped>,
  expectedName: string,
  text: string,
) {
  const nerHit = nerSpans.some(
    (s) => s.type === "NAME" && (s.value.includes(expectedName.split(/[\s,]+/)[0]) || expectedName.includes(s.value.trim())),
  );
  const mergedHit = merged.kept.some(
    (s) => s.type === "NAME" && text.slice(s.start, s.end).length > 0 && expectedName.includes(text.slice(s.start, s.end).trim().split(",")[0].split(" ")[0]),
  );

  if (nerHit && !mergedHit) return "MERGE bug (NER detected, dropped in merge)";
  if (!nerHit && regexSpans.every((s) => s.type !== "NAME")) return "NER gap (names are NER-only; regex has no NAME pattern)";
  if (nerHit && mergedHit) return "OK";
  return "NER gap (names are NER-only; regex has no NAME pattern)";
}

async function analyzeCase(id: string, text: string, expectedName: string) {
  const regexOnly = detectRegexOnly(text);
  const { spans: fullSpans, nerError } = await detectPiiWithStatus(text);
  const nerOnly = fullSpans.filter((s) => s.source === "ner");
  const merged = mergeSpansWithDropped([...regexOnly, ...nerOnly]);
  const { redacted } = redact(text, merged.kept);
  const plainLeak = redacted.includes(expectedName) || (expectedName.split(" ").some((w) => w.length > 2 && redacted.includes(w)) && !redacted.includes("⟦PII:NAME:"));

  console.log("\n" + "=".repeat(72));
  console.log(`CASE: ${id}`);
  console.log("INPUT:", JSON.stringify(text));
  console.log("EXPECTED NAME:", expectedName);
  console.log("REGEX spans:", JSON.stringify(regexOnly.map((s) => ({ type: s.type, value: s.value, source: s.source })), null, 2));
  console.log("NER spans:", JSON.stringify(nerOnly.map((s) => ({ type: s.type, value: s.value, confidence: s.confidence })), null, 2));
  if (nerError) console.log("NER ERROR:", nerError);
  console.log("MERGE kept NAME:", merged.kept.filter((s) => s.type === "NAME").map((s) => s.value));
  console.log("MERGE dropped:", merged.dropped.filter((s) => s.type === "NAME").map((s) => ({ value: s.value, type: s.type })));
  console.log("CLASSIFICATION:", classifyGap(regexOnly, nerOnly, merged, expectedName, text));
  console.log("REDACTED:", redacted);
  console.log("PLAIN TEXT LEAK?", plainLeak ? "YES — FAIL" : "no");
  return { id, plainLeak, classification: classifyGap(regexOnly, nerOnly, merged, expectedName, text) };
}

async function analyzeSynthetic(docId: string) {
  const doc = SYNTHETIC_DOCS.find((d) => d.id === docId);
  if (!doc) return;
  const expectedNames = doc.labeledSpans.filter((s) => s.type === "NAME").map((s) => s.value);
  const { spans, nerError } = await detectPiiWithStatus(doc.text);
  const { redacted } = redact(doc.text, spans);
  console.log("\n" + "-".repeat(72));
  console.log(`SYNTHETIC: ${doc.id} — ${doc.title}`);
  if (nerError) console.log("NER ERROR:", nerError);
  for (const name of expectedNames) {
    const detected = spans.some((s) => s.type === "NAME" && s.value === name);
    const leaked = redacted.includes(name);
    console.log(`  NAME "${name}": detected=${detected}, plain in redacted=${leaked}`);
  }
}

async function main() {
  console.log("NAME DETECTION INVESTIGATION");
  console.log("Note: regex pipeline has NO NAME patterns — names depend entirely on NER (Xenova/bert-base-NER)\n");

  const results = [];
  for (const c of NAME_CASES) {
    results.push(await analyzeCase(c.id, c.text, c.expectedName));
  }

  console.log("\n\n=== SYNTHETIC DOC REGRESSION CHECK ===");
  for (const doc of SYNTHETIC_DOCS.filter((d) => !d.plantedDetectionFailure)) {
    await analyzeSynthetic(doc.id);
  }

  console.log("\n\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`${r.id}: ${r.plainLeak ? "LEAK" : "ok"} — ${r.classification}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
