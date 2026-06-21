import "dotenv/config";
import cors from "cors";
import express from "express";
import { verifyClaudeHello, verifyRedis } from "./startup.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Phase 0 stub — replaced with real Claude call in Phase 3
app.post("/api/translate", (_req, res) => {
  res.json({
    translated_text:
      "Phase 0 stub — your translated and explained document will appear here after Phase 3.",
    trace_id: "phase-0-stub",
  });
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
