/**
 * Capture UI screenshots for design-system walkthrough (requires client dev server on :5173).
 * Run: npm run dev (client) then npx tsx scripts/capture-screenshots.mjs
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "screenshots-design-system");
const BASE = process.env.PASSAGE_URL ?? "http://localhost:5173";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 ${file}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "01-hero-wordmark-entrance");

  await page.waitForTimeout(1200);
  await shot(page, "02-hero-tagline-visible");

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.85));
  await page.waitForTimeout(800);
  await shot(page, "03-about-section-rise-in");

  await page.getByRole("button", { name: /Get started/i }).click();
  await page.waitForTimeout(600);
  await page.locator("#passage-tool").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot(page, "04-input-language-upload-rise-in");

  const sample = page.getByRole("button", { name: /RFE — standard fields/i });
  if (await sample.isVisible()) {
    await sample.click();
    await page.waitForTimeout(400);
    await shot(page, "05-input-with-sample-loaded");

    await page.getByRole("button", { name: /Analyze & redact/i }).click();
    await page.getByRole("heading", { name: "Scrubbed preview" }).waitFor({ timeout: 45000 });
    await page.waitForTimeout(800);
    await shot(page, "06-privacy-redaction-bars");
  }

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT}`);
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err.message);
  console.error("Start client with: cd client && npm run dev");
  process.exit(1);
});
