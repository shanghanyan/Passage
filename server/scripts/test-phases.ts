/**
 * Phase 1–4 automated checks (regex/redaction/validation — no NER in Node).
 * Run: npx tsx scripts/test-phases.ts
 */
import "dotenv/config";
import { validateTokenPreservation, translateRedactedText } from "../src/lib/claude.js";
import { initSentry, captureValidationMismatch } from "../src/lib/sentry.js";

const TOKEN = /⟦PII:[A-Z_]+:\d+⟧/g;

function redact(text: string, spans: Array<{ type: string; start: number; end: number; value: string }>) {
  const sorted = [...spans].sort((a, b) => b.start - a.start);
  const tokenMap: Record<string, string> = {};
  const counters: Record<string, number> = {};
  let redacted = text;
  for (const span of sorted) {
    counters[span.type] = (counters[span.type] ?? 0) + 1;
    const token = `⟦PII:${span.type}:${counters[span.type]}⟧`;
    tokenMap[token] = span.value;
    redacted = redacted.slice(0, span.start) + token + redacted.slice(span.end);
  }
  return { redacted, tokenMap };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testTranslateRoundTrip() {
  const sample =
    "Beneficiary ⟦PII:NAME:1⟧ with A-number ⟦PII:A_NUMBER:1⟧ must respond by April 30, 2024.";
  const { text } = await translateRedactedText(sample, "Spanish");
  const validation = validateTokenPreservation(sample, text, "test-session");
  assert(validation.ok, `Token preservation failed: expected validation ok, got ${JSON.stringify(validation)}`);
  assert(text.includes("⟦PII:NAME:1⟧"), "NAME token preserved");
  assert(text.includes("⟦PII:A_NUMBER:1⟧"), "A_NUMBER token preserved");
  console.log("✓ Phase 3: Claude translate preserves tokens (Spanish)");
}

async function testTranslateSecondLanguage() {
  const sample = "Notice for ⟦PII:NAME:1⟧ regarding evidence at ⟦PII:ADDRESS:1⟧.";
  const { text } = await translateRedactedText(sample, "Vietnamese");
  const validation = validateTokenPreservation(sample, text, "test-session-vi");
  assert(validation.ok, "Vietnamese token preservation");
  console.log("✓ Phase 3: Claude translate preserves tokens (Vietnamese)");
}

async function testValidationFailure() {
  initSentry();
  const input = "Hello ⟦PII:NAME:1⟧ and ⟦PII:SSN:1⟧";
  const badOutput = "Hello ⟦PII:NAME:1⟧"; // missing SSN token
  const validation = validateTokenPreservation(input, badOutput, "planted-test");
  assert(!validation.ok, "Should detect missing token");
  if (!validation.ok) {
    captureValidationMismatch({
      expected: validation.expected,
      found: validation.found,
      sessionId: "planted-test",
    });
  }
  console.log("✓ Phase 4: validation blocks missing token + Sentry capture invoked");
}

async function testPlantedFailureEndpoint() {
  const redacted =
    "Beneficiary ⟦PII:NAME:1⟧ A-number ⟦PII:A_NUMBER:1⟧ SSN ⟦PII:SSN:1⟧ DOB ⟦PII:DOB:1⟧.";
  const res = await fetch("http://localhost:3001/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      redacted_text: redacted,
      target_language: "Spanish",
      session_id: "planted-failure-demo",
      planted_validation_failure: true,
    }),
  });
  const data = await res.json();
  assert(data.ok === false, "Planted failure should return ok:false");
  assert(typeof data.fallback === "string", "Fallback message returned");
  console.log("✓ Phase 4: planted validation failure returns fallback (no partial output)");
}

function testRegexPatterns() {
  const text = "A1234567 A12345678 A-123456789 SSN 123-45-6789 DOB 03/22/1988";
  assert(/\bA-?\d{7,9}\b/gi.test(text), "A-number variants");
  assert(/\b\d{3}-\d{2}-\d{4}\b/g.test(text), "SSN");
  assert(/\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g.test(text), "DOB numeric");
  console.log("✓ Phase 1: regex patterns match variants");
}

async function main() {
  testRegexPatterns();

  await testTranslateRoundTrip();
  await testTranslateSecondLanguage();
  await testValidationFailure();
  await testPlantedFailureEndpoint();

  console.log("\nAll phase 0–4 automated checks passed.");
  console.log("(Token maps stay in browser memory only — no Upstash persistence test.)");
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  process.exit(1);
});
