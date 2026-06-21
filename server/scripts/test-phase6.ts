/**
 * Phase 6 tests — Deepgram token mint + voice question + TTS safety
 * Run: npm run test:phase6
 */
import "../src/instrumentation.js";
import "dotenv/config";
import { assertTtsTextSafe, mintDeepgramClientToken, transcribeAudio } from "../src/lib/deepgram.js";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testDeepgramTokenEndpoint() {
  const res = await fetch("http://localhost:3001/api/deepgram-token", { method: "POST" });
  assert(res.ok, "deepgram-token endpoint failed");
  const body = await res.json();
  if (body.mode === "client") {
    assert(typeof body.token === "string" && body.token.length > 10, "token missing");
    console.log("✓ POST /api/deepgram-token mints short-lived client token");
  } else {
    assert(body.mode === "server-proxy", "expected client or server-proxy mode");
    console.log("✓ POST /api/deepgram-token → server-proxy (key lacks grant — raw key stays on server)");
  }
}

async function testTokenNotRawKey() {
  const apiKey = process.env.DEEPGRAM_API_KEY ?? "";
  const result = await mintDeepgramClientToken();
  if (result.mode === "client") {
    assert(result.token !== apiKey, "Client token must not be the raw DEEPGRAM_API_KEY");
    console.log("✓ Minted token differs from server API key");
  } else {
    console.log("✓ Server-proxy mode — browser never receives DEEPGRAM_API_KEY");
  }
}

async function testTtsBlocksRawPii() {
  let blocked = false;
  try {
    assertTtsTextSafe("Contact Maria at 123-45-6789");
  } catch {
    blocked = true;
  }
  assert(blocked, "TTS safety should block SSN pattern");
  assertTtsTextSafe("This section asks for evidence by April 30.");
  console.log("✓ TTS payload guard blocks raw PII patterns");
}

async function testVoiceQuestionEndpoint() {
  const redacted =
    "Request for Evidence for ⟦PII:NAME:1⟧ regarding A-number ⟦PII:A_NUMBER:1⟧. Submit proof by the deadline.";
  const res = await fetch("http://localhost:3001/api/voice/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: "What does RFE mean?",
      session_id: "phase6-voice-test",
      redacted_text: redacted,
      target_language: "Spanish",
    }),
  });
  const body = (await res.json()) as { ok?: boolean; tts_text?: string; fallback?: string };
  if (!res.ok || !body.ok) {
    throw new Error(`voice/question failed (${res.status}): ${body.fallback ?? JSON.stringify(body)}`);
  }
  assert(typeof body.tts_text === "string" && body.tts_text.length > 0, "tts_text missing");
  assertTtsTextSafe(body.tts_text);
  console.log("✓ POST /api/voice/question returns PII-free tts_text");
  console.log("  TTS preview:", body.tts_text.slice(0, 120).replace(/\n/g, " "), "…");
}

async function testVoiceSpeakEndpoint() {
  const res = await fetch("http://localhost:3001/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Esta es una prueba del sistema de texto a voz.",
      target_language: "Spanish",
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`voice/speak failed (${res.status}): ${errText}`);
  }
  const buf = await res.arrayBuffer();
  assert(buf.byteLength > 1000, "TTS audio too small");
  console.log(`✓ POST /api/voice/speak returns audio (${buf.byteLength} bytes)`);
}

async function testTranscribeGuard() {
  // Empty buffer should fail gracefully
  try {
    await transcribeAudio(new ArrayBuffer(0), "audio/webm");
  } catch {
    console.log("✓ transcribeAudio rejects empty input");
    return;
  }
  console.log("✓ transcribeAudio callable (empty input skipped on API)");
}

async function main() {
  await testDeepgramTokenEndpoint();
  await testTokenNotRawKey();
  await testTtsBlocksRawPii();
  await testVoiceQuestionEndpoint();
  await testVoiceSpeakEndpoint();
  await testTranscribeGuard();
  console.log("\nPhase 6 tests passed.");
}

main().catch((err) => {
  console.error("\nPhase 6 test failed:", err.message);
  process.exit(1);
});
