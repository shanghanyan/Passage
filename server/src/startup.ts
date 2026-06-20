import Anthropic from "@anthropic-ai/sdk";
import { createClient, type RedisClientType } from "redis";

export async function connectRedis(): Promise<RedisClientType> {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set in server/.env");
  }

  const client = createClient({ url });
  client.on("error", (err) => console.error("Redis client error:", err.message));
  await client.connect();
  await client.ping();
  return client as RedisClientType;
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
