import Anthropic from "@anthropic-ai/sdk";
import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient } from "redis";

export async function verifyRedis(): Promise<void> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (restUrl && restToken) {
    const redis = new UpstashRedis({ url: restUrl, token: restToken });
    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error("Upstash REST ping failed");
    }
    console.log("Redis connected via Upstash REST (PING ok)");
    return;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (recommended) or REDIS_URL in server/.env",
    );
  }

  const client = createClient({
    url,
    socket: { connectTimeout: 15_000 },
  });
  client.on("error", (err) => console.error("Redis client error:", err.message));

  try {
    await client.connect();
    await client.ping();
    console.log("Redis connected via TCP (PING ok)");
  } finally {
    await client.quit().catch(() => undefined);
  }
}

export async function verifyClaudeHello(): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in server/.env");
  }

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16,
    messages: [{ role: "user", content: "Say hello in one word." }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected Claude response shape");
  }

  return block.text.trim();
}
