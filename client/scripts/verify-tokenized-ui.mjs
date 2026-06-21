/**
 * Tokenized translation UI after happy path (translation pane stays tokenized; explanation may reinsert locally).
 * Run: npm run verify:tokenized-ui --prefix client
 */
import { chromium } from "playwright";

const BASE = process.env.PASSAGE_URL || "http://localhost:5173";
const PII = ["Maria Gonzalez", "A123456789", "123-45-6789"];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120000 });

  await page.getByRole("button", { name: /Analyze & redact/i }).click();
  await page.waitForSelector(".token-highlight", { timeout: 120000 });
  await page.getByRole("button", { name: /Send for translation/i }).click();
  await page.waitForSelector(".split", { timeout: 180000 });

  const translatedPane = await page.locator(".split .doc-pane").nth(1).innerText();
  const hasToken = translatedPane.includes("⟦PII:");
  const hasRaw = PII.some((p) => translatedPane.includes(p));

  console.log("Translated pane has tokens:", hasToken);
  console.log("Translated pane has raw PII:", hasRaw);

  await browser.close();
  if (!hasToken || hasRaw) process.exit(1);
  console.log("\nVERIFY TOKENIZED UI PASSED");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
