import { Redis as UpstashRedis } from "@upstash/redis";
import { createClient, type RedisClientType } from "redis";

export function getUpstashRestConfig(): { url: string; token: string } {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
  }
  return { url: url.replace(/\/$/, ""), token };
}

export function createUpstashClient(): UpstashRedis {
  const { url, token } = getUpstashRestConfig();
  return new UpstashRedis({ url, token });
}

export async function withTcpRedis<T>(fn: (client: RedisClientType) => Promise<T>): Promise<T> {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");

  const client = createClient({ url, socket: { connectTimeout: 15_000 } });
  client.on("error", () => undefined);
  await client.connect();
  try {
    return await fn(client as RedisClientType);
  } finally {
    await client.quit().catch(() => undefined);
  }
}

export const SESSION_TTL_SECONDS = 900;

export function sessionRedisKey(sessionId: string): string {
  return `session:${sessionId}:tokens`;
}
