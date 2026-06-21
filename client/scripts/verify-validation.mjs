/**
 * Unit tests for validateTranslationTokens + noRawPiiLeak.
 * Run: npm run verify:validation --prefix client
 */
import { validateTranslationTokens, validateVoiceAnswerTokens, noRawPiiLeak } from "../src/lib/validate.ts";

const TOKEN_A = "\u27E6PII:NAME:1\u27E7";
const TOKEN_B = "\u27E6PII:DOB:1\u27E7";
const TOKEN_FAKE = "\u27E6PII:NAME:99\u27E7";

const tokenMap = { [TOKEN_A]: "Maria Gonzalez", [TOKEN_B]: "03/14/1991" };

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("OK:", msg);
  }
}

const repeated = `Translation: ${TOKEN_A} and ${TOKEN_B}. Explanation: ${TOKEN_A} again.`;
const ok = validateTranslationTokens(tokenMap, repeated);
assert(ok.ok, "repeated tokens pass");

const missing = validateTranslationTokens(tokenMap, `Only ${TOKEN_A}`);
assert(!missing.ok && missing.missing?.includes(TOKEN_B), "missing key fails");

const unexpected = validateTranslationTokens(tokenMap, `${TOKEN_A} ${TOKEN_FAKE}`);
assert(!unexpected.ok && unexpected.unexpected?.includes(TOKEN_FAKE), "unexpected token fails");

assert(noRawPiiLeak(tokenMap, "hello").ok, "no leak clean");
assert(!noRawPiiLeak(tokenMap, "Maria Gonzalez").ok, "raw name leak detected");

const voiceOk = validateVoiceAnswerTokens(tokenMap, `Solo menciona ${TOKEN_A} en la respuesta.`);
assert(voiceOk.ok, "voice answer passes without all doc tokens");

const voiceMissingOk = validateVoiceAnswerTokens(tokenMap, `Respuesta sin tokens.`);
assert(voiceMissingOk.ok, "voice answer with zero tokens passes");

console.log(process.exitCode ? "\nVERIFY VALIDATION FAILED" : "\nVERIFY VALIDATION PASSED");
