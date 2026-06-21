/**
 * Capture UI screenshots for visual walkthrough (requires client dev server on :5173).
 * Run: npx tsx client/scripts/capture-screenshots.mjs
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "screenshots-walkthrough");
const BASE = process.env.PASSAGE_URL ?? "http://localhost:5173";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`📸 ${file}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "01-landing-brand-fade-in");

  await page.waitForTimeout(1500);
  await shot(page, "02-landing-with-tagline");

  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForTimeout(1200);
  await shot(page, "03-landing-about-section");

  await page.getByRole("button", { name: /Get started/i }).click();
  await page.waitForTimeout(800);
  await shot(page, "04-tool-language-selector-and-upload");

  await browser.close();
  console.log(`\nScreenshots saved to ${OUT}`);
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err.message);
  console.error("Start client with: cd client && npm run dev");
  process.exit(1);
});
