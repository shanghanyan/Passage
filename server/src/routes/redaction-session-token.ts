import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { captureExternalError } from "../lib/sentry.js";
import { getUpstashRestConfig, SESSION_TTL_SECONDS, sessionRedisKey } from "../lib/redis.js";

export function postRedactionSessionToken(req: Request, res: Response): void {
  try {
    const sessionId =
      typeof req.body?.session_id === "string" && req.body.session_id.trim()
        ? req.body.session_id.trim()
        : randomUUID();

    const { url, token } = getUpstashRestConfig();

    res.json({
      sessionId,
      restUrl: url,
      restToken: token,
      redisKey: sessionRedisKey(sessionId),
      ttlSeconds: SESSION_TTL_SECONDS,
    });
  } catch (err) {
    captureExternalError("redaction-session-token", err);
    res.status(500).json({ error: "Failed to mint redaction session token" });
  }
}
