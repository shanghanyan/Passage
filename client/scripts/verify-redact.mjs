/**
 * Smoke tests for redact() pipeline.
 * Run: npm run verify:redact --prefix client
 */
import { detectRegexOnly } from "../src/lib/detect.ts";
import { mergeSpansWithDropped } from "../src/lib/merge-spans.ts";
import { redact } from "../src/lib/redact.ts";

const SAMPLE = `Notice to Appear

Name: Maria Gonzalez
A-Number: A123456789
Date of Birth: 03/14/1991
SSN: 123-45-6789
Passport No.: XK829104
Address: 742 Evergreen Terrace, Springfield

Also born March 14, 1991 per prior filing.`;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("OK:", msg);
  }
}

const spans = mergeSpansWithDropped(detectRegexOnly(SAMPLE)).kept;
const { redacted, tokenMap } = redact(SAMPLE, spans);

assert(Object.keys(tokenMap).length === spans.length, "tokenMap has one entry per span");
assert(tokenMap["⟦PII:A_NUMBER:1⟧"] === "A123456789", "A_NUMBER token value");
assert(!redacted.includes("A123456789"), "raw A-number not in redacted text");
assert(redacted.includes("⟦PII:A_NUMBER:1⟧"), "A_NUMBER token in redacted text");

const dobTokens = Object.keys(tokenMap).filter((t) => t.includes(":DOB:"));
assert(dobTokens.length === 2, "two DOB tokens");

console.log(process.exitCode ? "\nVERIFY REDACT FAILED" : "\nVERIFY REDACT PASSED");
