/**
 * Node-only regex detection smoke test.
 * Run: npm run verify:regex --prefix client
 */
import { detectRegexOnly } from "../src/lib/detect.ts";

const SAMPLE = `Name: Maria Gonzalez
A-Number: A123456789
Date of Birth: 03/14/1991
SSN: 123-45-6789`;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("OK:", msg);
  }
}

const spans = detectRegexOnly(SAMPLE);
const types = new Set(spans.map((s) => s.type));
assert(types.has("A_NUMBER"), "A_NUMBER");
assert(types.has("SSN"), "SSN");
assert(types.has("DOB"), "DOB");
assert(types.has("NAME"), "NAME via label-anchored regex");

console.log("Spans:", spans.map((s) => `${s.type}@${s.start}-${s.end}`).join(", "));
console.log(process.exitCode ? "\nVERIFY REGEX FAILED" : "\nVERIFY REGEX PASSED");
