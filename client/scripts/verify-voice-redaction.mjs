/**
 * Voice transcript redaction — token map stays in browser memory only (no Redis).
 * Run: npm run verify:voice-redaction --prefix client
 */
import { prepareVoiceQuestion } from "../src/lib/prepare-voice-question.ts";
import { detectPii } from "../src/lib/detect.ts";

const EXISTING_DOC_TOKENS = {
  "⟦PII:A_NUMBER:1⟧": "A123456789",
  "⟦PII:NAME:1⟧": "Maria Gonzalez",
};

const TOKEN_PATTERN = /⟦PII:[A-Z_]+:\d+⟧/g;

function extractTokens(text) {
  return text.match(TOKEN_PATTERN) ?? [];
}

const fetchLog = [];

function installFetchMock() {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    fetchLog.push({ url: String(url), body: init?.body ?? null });
    return realFetch(url, init);
  };
}

function assert(cond, msg) {
  if (!cond) {
    console.error("  FAIL:", msg);
    process.exitCode = 1;
    return false;
  }
  console.log("  OK:", msg);
  return true;
}

async function runRedactionCase({ title, rawTranscript, rawValuesToBan, expectLeak = false }) {
  console.log(`\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}`);

  fetchLog.length = 0;
  const { redacted, newTokens } = await prepareVoiceQuestion(rawTranscript, EXISTING_DOC_TOKENS, {
    includeNer: false,
  });

  const postBodyJson = JSON.stringify({
    transcript: redacted,
    session_id: "local-only",
    redacted_text: "⟦PII:NAME:1⟧ Request for Evidence excerpt…",
    target_language: "Spanish",
  });

  for (const raw of rawValuesToBan) {
    const leaked = redacted.includes(raw) || postBodyJson.includes(raw);
    if (expectLeak) {
      if (leaked) console.log(`  EXPECTED LEAK: "${raw}" (known gap)`);
      else assert(false, `expected leak of "${raw}"`);
    } else {
      assert(!redacted.includes(raw), `redacted excludes "${raw}"`);
      assert(!postBodyJson.includes(raw), `POST JSON excludes "${raw}"`);
    }
  }

  const redisWrite = fetchLog.find(
    (e) => String(e.url).includes("upstash") || String(e.url).includes("mock-upstash"),
  );
  assert(!redisWrite, "voice redaction should not write to Upstash (translate registers session separately)");

  return { redacted, postBodyJson, newTokens };
}

async function main() {
  installFetchMock();

  const FAKE_A = "A123456789";
  await runRedactionCase({
    title: "CASE A — spoken A-number",
    rawTranscript: `my A-number is ${FAKE_A}, what does this letter mean`,
    rawValuesToBan: [FAKE_A],
  });

  const conversationalDob =
    "my birthday is March fourteenth nineteen ninety one, what does this letter mean";
  await runRedactionCase({
    title: "CASE B1 — conversational DOB (known gap)",
    rawTranscript: conversationalDob,
    rawValuesToBan: ["March fourteenth nineteen ninety one"],
    expectLeak: true,
  });

  const sttWrittenDob = "my birthday is March 14, 1991, what does this letter mean";
  const caseB2 = await runRedactionCase({
    title: "CASE B2 — written DOB tokenized",
    rawTranscript: sttWrittenDob,
    rawValuesToBan: ["March 14, 1991"],
  });

  assert(extractTokens(caseB2.redacted).some((t) => t.includes("DOB")), "DOB token present");

  void detectPii;

  console.log("\n", process.exitCode ? "VERIFY FAILED" : "VERIFY PASSED");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
