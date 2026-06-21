/**
 * Scan Sentry event JSON for forbidden raw PII strings.
 * Run: node scripts/audit-sentry-payload.mjs [path-to-event.json]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const eventPath = process.argv[2] || path.resolve(__dirname, "../../sentry-event-transmitted.json");

const FORBIDDEN = ["Maria Gonzalez", "123-45-6789", "A123456789", "03/14/1991", "742 Evergreen"];

const raw = readFileSync(eventPath, "utf8");
const hits = FORBIDDEN.filter((s) => raw.includes(s));

if (hits.length) {
  console.error("FAIL: forbidden strings in event:", hits.join(", "));
  process.exit(1);
}

console.log("PASS: no forbidden raw PII in", eventPath);
