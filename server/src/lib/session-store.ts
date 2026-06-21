import { createUpstashClient, SESSION_TTL_SECONDS } from "./redis.js";

const LAUNCHER_HEARTBEAT_KEY = "launcher:heartbeat";
const LAUNCHER_CLOSED_KEY = "launcher:closed";

export async function recordLauncherHeartbeat(): Promise<void> {
  const redis = createUpstashClient();
  const now = Date.now();
  await redis.set(LAUNCHER_HEARTBEAT_KEY, now, { ex: 120 });
  await redis.set(LAUNCHER_CLOSED_KEY, 0, { ex: 120 });
}

export async function recordLauncherGoodbye(): Promise<void> {
  const redis = createUpstashClient();
  await redis.set(LAUNCHER_CLOSED_KEY, 1, { ex: 120 });
}

export async function getLauncherSessionState(): Promise<{
  lastHeartbeat: number;
  closed: boolean;
}> {
  try {
    const redis = createUpstashClient();
    const [lastHeartbeat, closed] = await Promise.all([
      redis.get<number>(LAUNCHER_HEARTBEAT_KEY),
      redis.get<number>(LAUNCHER_CLOSED_KEY),
    ]);
    return {
      lastHeartbeat: typeof lastHeartbeat === "number" ? lastHeartbeat : 0,
      closed: closed === 1,
    };
  } catch {
    return { lastHeartbeat: 0, closed: false };
  }
}

export class RateLimitError extends Error {
  constructor(action: string) {
    super(`Rate limit exceeded for ${action}. Try again in a few minutes.`);
    this.name = "RateLimitError";
  }
}

const LIMITS: Record<string, number> = {
  translate: 15,
  voice: 40,
  "extract-document": 10,
};

export async function assertRateLimit(sessionId: string, action: keyof typeof LIMITS): Promise<void> {
  if (!sessionId || sessionId === "unknown") return;

  const redis = createUpstashClient();
  const key = `ratelimit:${action}:${sessionId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, SESSION_TTL_SECONDS);
  }
  if (count > LIMITS[action]) {
    throw new RateLimitError(action);
  }
}
