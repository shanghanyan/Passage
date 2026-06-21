/**
 * Browser → Upstash REST directly. Backend mints scoped credentials only.
 * Session marker is PII-free — raw token values stay in browser memory.
 */
export interface RedactionSessionCredentials {
  sessionId: string;
  restUrl: string;
  restToken: string;
  redisKey: string;
  ttlSeconds: number;
}

export async function mintRedactionSession(sessionId?: string): Promise<RedactionSessionCredentials> {
  const res = await fetch("/api/redaction-session-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`Failed to mint Redis session token (${res.status})`);
  return res.json();
}

/** Register an active session in Upstash — no raw PII values written. */
export async function registerRedactionSession(creds: RedactionSessionCredentials): Promise<void> {
  const pipeline = [
    ["HSET", creds.redisKey, "__passage__", "tokenized-browser-only"],
    ["EXPIRE", creds.redisKey, creds.ttlSeconds],
  ];

  const res = await fetch(`${creds.restUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.restToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pipeline),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Redis session register failed (${res.status}): ${detail}`);
  }
}
