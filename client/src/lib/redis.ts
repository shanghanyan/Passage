/**
 * Browser → Upstash REST directly. Backend mints credentials; it never sees tokenMap values.
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

export async function writeTokenMap(
  creds: RedactionSessionCredentials,
  tokenMap: Record<string, string>,
): Promise<void> {
  const entries = Object.entries(tokenMap).flat();
  if (entries.length === 0) return;

  const pipeline = [
    ["HSET", creds.redisKey, ...entries],
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
    throw new Error(`Redis write failed (${res.status}): ${detail}`);
  }
}

export async function readTokenMap(creds: RedactionSessionCredentials): Promise<Record<string, string>> {
  const res = await fetch(`${creds.restUrl}/hgetall/${encodeURIComponent(creds.redisKey)}`, {
    headers: { Authorization: `Bearer ${creds.restToken}` },
  });
  if (!res.ok) throw new Error(`Redis read failed (${res.status})`);
  const data = (await res.json()) as { result?: Record<string, string> | string[] };
  const raw = data.result;
  if (!raw) return {};
  if (!Array.isArray(raw)) return raw;

  const map: Record<string, string> = {};
  for (let i = 0; i < raw.length; i += 2) {
    map[raw[i]] = raw[i + 1];
  }
  return map;
}
