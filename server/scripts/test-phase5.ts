/**
 * Observability + recall scoring tests
 * Run: npm run test:phase5
 */
import "../src/instrumentation.js";
import "dotenv/config";
import { getObservabilityTarget } from "../src/lib/observability/index.js";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function testObservabilityBackend() {
  const target = getObservabilityTarget();

  if (target === "phoenix") {
    const url = process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006";
    const res = await fetch(url);
    assert(res.ok, `Phoenix not reachable at ${url} — run: docker compose -f docker-compose.phoenix.yml up -d`);
    console.log(`✓ Phoenix UI reachable at ${url}`);
    return;
  }

  assert(process.env.ARIZE_SPACE_ID, "ARIZE_SPACE_ID required for ax mode");
  assert(process.env.ARIZE_API_KEY, "ARIZE_API_KEY required for ax mode");
  console.log(`✓ Arize AX configured (project: ${process.env.ARIZE_PROJECT_NAME ?? "immigration-redaction-demo"})`);
}

async function testScoreRedactionApi() {
  const res = await fetch("http://localhost:3001/api/score-redaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doc_id: "test-rfe-standard",
      session_id: `obs-test-${Date.now()}`,
      recall: 0.83,
      detected_count: 5,
      labeled_count: 6,
      run_id: "obs-api-test",
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
  execSync("npm run score:redaction -- obs-run-a", { stdio: "inherit", cwd: process.cwd() });
  execSync("npm run score:redaction -- obs-run-b", { stdio: "inherit", cwd: process.cwd() });
  console.log("✓ Two batch scoring runs logged (compare redaction.run_id in observability UI)");
}

async function main() {
  await testObservabilityBackend();
  await testScoreRedactionApi();
  await testBatchScoringRuns();
  const target = getObservabilityTarget();
  if (target === "phoenix") {
    console.log("\nObservability tests passed. Open http://localhost:6006 → filter span name 'redaction-check'");
  } else {
    console.log("\nObservability tests passed. Open Arize AX dashboard → filter span name 'redaction-check'");
  }
}

main().catch((err) => {
  console.error("\nObservability test failed:", err.message);
  process.exit(1);
});
