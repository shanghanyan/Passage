/**
 * Targeted name redaction tests (regex layer; NER-independent).
 * Run: npm run verify:name-detection --prefix client
 */
import { detectRegexOnly } from "../src/lib/detect.ts";
import { redact } from "../src/lib/redact.ts";
import { SYNTHETIC_DOCS } from "../src/data/synthetic-docs.ts";

const CASES = [
  {
    id: "hyphenated-re-line",
    text: "Re: Ana-Maria Rodriguez, A-123456789 must respond by April 30, 2024.",
    name: "Ana-Maria Rodriguez",
  },
  {
    id: "all-caps-comma",
    text: "Applicant: GARCIA, MARIA ELENA\nA-Number: A123456789",
    name: "GARCIA, MARIA ELENA",
  },
  {
    id: "dear-repeat",
    text: "Dear Maria Gonzalez,\n\nThis notice confirms receipt for Maria Gonzalez (A-123456789).",
    name: "Maria Gonzalez",
  },
  {
    id: "sentence-start-action",
    text: "Maria Gonzalez submitted evidence on March 1, 2024.",
    name: "Maria Gonzalez",
  },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("verify-name-detection\n");

for (const c of CASES) {
  const spans = detectRegexOnly(c.text);
  const nameSpans = spans.filter((s) => s.type === "NAME");
  const { redacted } = redact(c.text, spans);

  console.log(`--- ${c.id} ---`);
  console.log("INPUT:", c.text.replace(/\n/g, "\\n"));
  console.log("NAME spans:", nameSpans.map((s) => `"${s.value}"@${s.start}-${s.end} (${s.source})`).join(", ") || "(none)");
  console.log("REDACTED:", redacted.replace(/\n/g, "\\n"));

  assert(nameSpans.length > 0, `${c.id}: expected NAME span`);
  assert(!redacted.includes(c.name), `${c.id}: plain name still visible`);
  assert(redacted.includes("⟦PII:NAME:"), `${c.id}: expected NAME token`);
  console.log("OK\n");
}

for (const doc of SYNTHETIC_DOCS.filter((d) => !d.plantedDetectionFailure)) {
  const names = doc.labeledSpans.filter((s) => s.type === "NAME").map((s) => s.value);
  const { redacted } = redact(doc.text, detectRegexOnly(doc.text));
  for (const name of names) {
    assert(!redacted.includes(name), `synthetic ${doc.id}: "${name}" leaked in redacted text`);
  }
  console.log(`OK synthetic ${doc.id}`);
}

console.log("\nverify-name-detection PASSED");
