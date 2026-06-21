/**
 * Forces validation failure via mocked translate response; checks fail-closed UI.
 * Run: npm run verify:sentry-browser --prefix client
 */
import { chromium } from "playwright";

const BASE = process.env.PASSAGE_URL || "http://localhost:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route("**/api/translate", async (route) => {
    const req = route.request();
    const body = JSON.parse(req.postData() || "{}");
    const res = await route.fetch();
    const json = await res.json();
    if (json.ok && json.translated_text) {
      json.translated_text = json.translated_text.replace("⟦PII:NAME:1⟧", "⟦PII:NAME:99⟧");
    }
    await route.fulfill({ response: res, json });
  });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("button", { name: /Analyze & redact/i }).click();
  await page.waitForSelector(".token-highlight", { timeout: 120000 });
  await page.getByRole("button", { name: /Send for translation/i }).click();
  await page.waitForSelector(".validation-failure", { timeout: 180000 });

  const hasFailure = await page.locator(".validation-failure").isVisible();
  const hasSplit = await page.locator(".split").count();

  await browser.close();
  if (!hasFailure || hasSplit > 0) process.exit(1);
  console.log("VERIFY SENTRY BROWSER PASSED — fail-closed, no tokenized output shown");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
