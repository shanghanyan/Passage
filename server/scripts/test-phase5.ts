/**
 * Phase 5 tests — Phoenix recall scoring per testing-plan.md
 * Run: npm run test:phase5
 */
import "../src/instrumentation.js";
import "dotenv/config";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testPhoenixUp() {
  const url = process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006";
  const res = await fetch(url);
  assert(res.ok, `Phoenix not reachable at ${url} — run: docker compose -f docker-compose.phoenix.yml up -d`);
  console.log(`✓ Phoenix UI reachable at ${url}`);
}

async function testScoreRedactionApi() {
  const res = await fetch("http://localhost:3001/api/score-redaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doc_id: "test-rfe-standard",
      session_id: `phase5-test-${Date.now()}`,
      recall: 0.83,
      detected_count: 5,
      labeled_count: 6,
      run_id: "phase5-api-test",
      detector: "browser",
    }),
  });
  assert(res.ok, "score-redaction API failed");
  const body = await res.json();
  assert(body.ok === true, "score-redaction should return ok");
  console.log("✓ POST /api/score-redaction accepts metrics (no PII in body)");
}

async function testBatchScoringRuns() {
  const { execSync } = await import("node:child_process");
  execSync("npm run score:redaction -- phase5-run-a", { stdio: "inherit", cwd: process.cwd() });
  execSync("npm run score:redaction -- phase5-run-b", { stdio: "inherit", cwd: process.cwd() });
  console.log("✓ Two batch scoring runs logged (compare redaction.run_id in Phoenix UI)");
}

async function main() {
  await testPhoenixUp();
  await testScoreRedactionApi();
  await testBatchScoringRuns();
  console.log("\nPhase 5 tests passed. Open http://localhost:6006 → filter span name 'redaction-check'");
}

main().catch((err) => {
  console.error("\nPhase 5 test failed:", err.message);
  process.exit(1);
});
