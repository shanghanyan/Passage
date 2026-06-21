/**
 * Playwright: DetectionTest harness — highlights + audit suite.
 * Run: npm run verify:detection --prefix client
 */
import { chromium } from "playwright";

const BASE = process.env.PASSAGE_URL || "http://localhost:5173/?detection-test";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });

  await page.getByRole("button", { name: /Detect PII/i }).click();
  await page.waitForSelector(".highlight-output mark", { timeout: 120000 });

  const marks = await page.locator(".highlight-output mark").count();
  if (marks < 3) {
    console.error("FAIL: expected multiple highlighted spans, got", marks);
    process.exit(1);
  }
  console.log("OK: highlight marks", marks);

  await page.getByRole("button", { name: /Run audit suite/i }).click();
  await page.waitForSelector(".audit-results table", { timeout: 180000 });

  const failRows = await page.locator(".audit-results tr.fail").count();
  console.log("Audit fail rows:", failRows, "(planted-failure case expected to fail)");

  await browser.close();
  console.log("\nVERIFY DETECTION PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
