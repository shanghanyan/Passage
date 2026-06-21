/**
 * Targeted name redaction tests (regex layer; NER-independent).
 * Non-Latin cases document known detection gaps — measured via per-type recall.
 * Run: npm run verify:name-detection --prefix client
 */
import { detectRegexOnly } from "../src/lib/detect.ts";
import { redact } from "../src/lib/redact.ts";
import { SYNTHETIC_DOCS } from "../src/data/synthetic-docs.ts";

const WESTERN_CASES = [
  {
    id: "hyphenated-re-line",
    text: "Re: Ana-Maria Rodriguez, A-123456789 must respond by April 30, 2024.",
    name: "Ana-Maria Rodriguez",
    expectDetected: true,
  },
  {
    id: "all-caps-comma",
    text: "Applicant: GARCIA, MARIA ELENA\nA-Number: A123456789",
    name: "GARCIA, MARIA ELENA",
    expectDetected: true,
  },
  {
    id: "dear-repeat",
    text: "Dear Maria Gonzalez,\n\nThis notice confirms receipt for Maria Gonzalez (A-123456789).",
    name: "Maria Gonzalez",
    expectDetected: true,
  },
  {
    id: "sentence-start-action",
    text: "Maria Gonzalez submitted evidence on March 1, 2024.",
    name: "Maria Gonzalez",
    expectDetected: true,
  },
];

/** Non-Latin-script names — regex/CoNLL NER gaps; tracked in per-type recall metrics. */
const NON_LATIN_CASES = [
  {
    id: "vietnamese-name",
    text: "Beneficiary: Nguyễn Thị Lan\nA-Number: A123456789\nRespond by June 15, 2025.",
    name: "Nguyễn Thị Lan",
    expectDetected: false,
  },
  {
    id: "korean-name",
    text: "Applicant: 김민준\nA-Number: A987654321\nBiometrics scheduled.",
    name: "김민준",
    expectDetected: false,
  },
  {
    id: "arabic-name",
    text: "Name: فاطمة الحسن\nA-87654321\nPlease appear for interview.",
    name: "فاطمة الحسن",
    expectDetected: false,
  },
  {
    id: "tagalog-name",
    text: "Dear Maria Santos,\nYour case A-11223344 requires additional evidence.",
    name: "Maria Santos",
    expectDetected: true,
  },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("verify-name-detection\n");

function runCases(cases, label) {
  for (const c of cases) {
    const spans = detectRegexOnly(c.text);
    const nameSpans = spans.filter((s) => s.type === "NAME");
    const { redacted } = redact(c.text, spans);

    console.log(`--- ${label}/${c.id} ---`);
    console.log("NAME spans:", nameSpans.map((s) => `"${s.value}"`).join(", ") || "(none)");

    if (c.expectDetected) {
      assert(nameSpans.length > 0, `${c.id}: expected NAME span`);
      assert(!redacted.includes(c.name), `${c.id}: plain name still visible`);
      assert(redacted.includes("⟦PII:NAME:"), `${c.id}: expected NAME token`);
      console.log("OK (detected)\n");
    } else {
      const detected = nameSpans.some((s) => s.value.includes(c.name) || c.name.includes(s.value));
      if (detected) {
        console.log("OK (bonus detection)\n");
      } else {
        console.log("OK (known gap — per-type recall tracks this)\n");
      }
    }
  }
}

runCases(WESTERN_CASES, "western");
runCases(NON_LATIN_CASES, "non-latin");

for (const doc of SYNTHETIC_DOCS.filter((d) => !d.plantedDetectionFailure)) {
  const names = doc.labeledSpans.filter((s) => s.type === "NAME").map((s) => s.value);
  const { redacted } = redact(doc.text, detectRegexOnly(doc.text));
  for (const name of names) {
    assert(!redacted.includes(name), `synthetic ${doc.id}: "${name}" leaked in redacted text`);
  }
  console.log(`OK synthetic ${doc.id}`);
}

console.log("\nverify-name-detection PASSED");
