/**
 * Planted apt doc — Send blocked, no translate leak.
 * Run: npm run verify:planted-block --prefix client
 */
import { chromium } from "playwright";

const BASE = process.env.PASSAGE_URL || "http://localhost:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const translateCalls = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/translate")) translateCalls.push(req);
  });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("button", { name: /planted failure|Apt #4B/i }).click();
  await page.getByRole("button", { name: /Analyze & redact/i }).click();
  await page.waitForSelector(".detection-warning", { timeout: 120000 });

  const sendBtn = page.getByRole("button", { name: /Send blocked/i });
  const disabled = await sendBtn.isDisabled();
  console.log("Send blocked disabled:", disabled);
  console.log("Translate API calls:", translateCalls.length);

  await browser.close();
  if (!disabled || translateCalls.length > 0) process.exit(1);
  console.log("\nVERIFY PLANTED BLOCK PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
