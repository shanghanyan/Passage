/**
 * Demo happy-path network audit — no raw PII in API bodies.
 * Run: npm run verify:demo-network --prefix client
 */
import { chromium } from "playwright";

const BASE = process.env.PASSAGE_URL || "http://localhost:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleLines = [];
  const apiCalls = [];
  const PII = ["Maria Gonzalez", "A123456789", "123-45-6789", "03/14/1991"];

  page.on("console", (msg) => {
    consoleLines.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on("request", (req) => {
    const url = req.url();
    if (!url.includes("/api/") || url.includes("huggingface")) return;
    const body = req.postData() ?? "";
    const hasRawPii = PII.some((p) => body.includes(p));
    apiCalls.push({ method: req.method(), url: url.replace(BASE, ""), hasRawPii });
  });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });

  await page.getByRole("button", { name: /Analyze & redact/i }).click();
  await page.waitForSelector(".workflow-scrubbed, .token-highlight", { timeout: 120000 });

  await page.getByRole("button", { name: /Send for translation/i }).click();
  await page.waitForSelector(".split, .result-failure", { timeout: 180000 });

  const errors = consoleLines.filter((l) => l.startsWith("[error]") || l.startsWith("[warning]"));

  console.log("=== Demo network audit ===\n");
  for (const c of apiCalls) {
    console.log(`  ${c.method} ${c.url}${c.hasRawPii ? " *** RAW PII ***" : ""}`);
  }

  const piiLeaks = apiCalls.filter((c) => c.hasRawPii);
  const ok = piiLeaks.length === 0 && errors.length === 0;
  console.log("\n", ok ? "PASS — token-only API payloads" : "REVIEW NEEDED");

  await browser.close();
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
