/**
 * Fire validation-failure Sentry event with token keys only.
 * Run: npm run trigger:sentry-validation
 */
import "dotenv/config";
import * as Sentry from "@sentry/node";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrubSentryExtra } from "../src/lib/sentry-scrub.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.error("SENTRY_DSN not set in server/.env");
  process.exit(1);
}

let capturedEvent = null;

Sentry.init({
  dsn,
  environment: "verify-script",
  sendDefaultPii: false,
  beforeSend(event) {
    capturedEvent = event;
    return event;
  },
});

const sessionId = randomUUID();
const expectedKeys = ["\u27E6PII:NAME:1\u27E7", "\u27E6PII:DOB:1\u27E7"];

const eventId = Sentry.captureMessage("Redaction token mismatch — unsafe output blocked", {
  level: "error",
  tags: { path: "validation-failure", source: "verify-script" },
  extra: scrubSentryExtra({
    session_id: sessionId,
    expected_token_keys: expectedKeys,
    unexpected_token_keys: ["\u27E6PII:NAME:99\u27E7"],
    missing_token_keys: ["\u27E6PII:DOB:1\u27E7"],
    token_validation_ok: false,
    raw_leak_ok: true,
  }),
});

await Sentry.flush(3000);

const outPath = path.resolve(__dirname, "../../sentry-event-transmitted.json");
writeFileSync(outPath, JSON.stringify(capturedEvent, null, 2));

console.log("Sentry event sent:", eventId);
console.log("Written to:", outPath);
