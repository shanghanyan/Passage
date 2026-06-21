/**
 * Connection-lost screen — default English locale, no start-over while disconnected.
 * Run with client dev server only (no server on 3001): npx vite --host 127.0.0.1 --port 5173
 * Then: node client/scripts/verify-connection-lost.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PASSAGE_URL || "http://127.0.0.1:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Default langCode is English — do not change the language picker.
  await page.getByRole("heading", { name: "Process killed" }).waitFor({ timeout: 12_000 });

  const startOver = page.getByRole("button", { name: /Start over/i });
  if ((await startOver.count()) > 0) {
    throw new Error("Start over button should not appear on connection-lost screen");
  }

  const retry = page.getByRole("button", { name: /Retry connection/i });
  if ((await retry.count()) !== 1) {
    throw new Error("Expected exactly one Retry connection button");
  }

  const body = await page.locator(".connection-lost-view p").first().textContent();
  if (!body?.includes("Unable to connect")) {
    throw new Error(`English body missing "Unable to connect": ${body}`);
  }

  console.log("✓ verify-connection-lost: English process-killed screen (no start over)");
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
