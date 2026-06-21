/**
 * Client-side verify: extracted document text must be redacted before translate payload.
 * Run: node client/scripts/verify-upload-redaction.mjs
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function loadModule(rel) {
  return import(pathToFileURL(path.join(ROOT, rel)).href);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const { PII_PATTERNS, scanForLeakage } = await loadModule("src/lib/patterns.ts");
  const { redact } = await loadModule("src/lib/redact.ts");

  const extracted =
    "NOTICE OF ACTION\nBeneficiary MARIA ELENA GARCIA\nA-Number: A123456789\nSSN: 123-45-6789\nDOB: 03/22/1988";

  const spans = [];
  for (const match of extracted.matchAll(PII_PATTERNS.A_NUMBER)) {
    if (match.index === undefined) continue;
    spans.push({ type: "A_NUMBER", start: match.index, end: match.index + match[0].length, value: match[0], source: "regex" });
  }
  for (const match of extracted.matchAll(PII_PATTERNS.SSN)) {
    if (match.index === undefined) continue;
    spans.push({ type: "SSN", start: match.index, end: match.index + match[0].length, value: match[0], source: "regex" });
  }
  for (const match of extracted.matchAll(PII_PATTERNS.DOB_NUMERIC)) {
    if (match.index === undefined) continue;
    spans.push({ type: "DOB", start: match.index, end: match.index + match[0].length, value: match[0], source: "regex" });
  }

  assert(spans.length >= 3, "Should detect multiple PII spans in OCR/extract output");

  const { redacted, tokenMap } = redact(extracted, spans);
  assert(Object.keys(tokenMap).length >= 3, "Token map should be populated");
  assert(!redacted.includes("123-45-6789"), "SSN must not appear raw in redacted text");
  assert(!redacted.includes("A123456789"), "A-number must not appear raw");
  assert(scanForLeakage(redacted).length === 0, "scanForLeakage must pass before translate");

  // Simulate translate payload — only redacted text leaves the browser.
  const translatePayload = {
    redacted_text: redacted,
    target_language: "Spanish",
    session_id: "upload-redaction-test",
  };
  assert(!translatePayload.redacted_text.includes("123-45-6789"), "Translate payload must not contain raw SSN");
  assert(!translatePayload.redacted_text.includes("A123456789"), "Translate payload must not contain raw A-number");

  console.log("✓ verify-upload-redaction: extract → detect → redact → translate-safe payload");
}

main().catch((err) => {
  console.error("verify-upload-redaction failed:", err.message);
  process.exit(1);
});
