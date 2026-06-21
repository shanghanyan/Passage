import "dotenv/config";
import "./instrumentation.js";
import cors from "cors";
import express from "express";
import { initSentry } from "./lib/sentry.js";
import { postRedactionSessionToken } from "./routes/redaction-session-token.js";
import { postScoreRedaction } from "./routes/score-redaction.js";
import { postTranslate } from "./routes/translate.js";
import { verifyClaudeHello, verifyRedis } from "./startup.js";

initSentry();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/redaction-session-token", postRedactionSessionToken);
app.post("/api/score-redaction", postScoreRedaction);
app.post("/api/translate", (req, res) => {
  void postTranslate(req, res);
});

async function main() {
  try {
    await verifyRedis();
  } catch (err) {
    console.error("Redis startup check failed:", (err as Error).message);
    process.exit(1);
  }

  try {
    const hello = await verifyClaudeHello();
    console.log(`Claude hello check ok: "${hello}"`);
  } catch (err) {
    console.error("Claude startup check failed:", (err as Error).message);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Passage server listening on http://localhost:${port}`);
  });
}

main();
