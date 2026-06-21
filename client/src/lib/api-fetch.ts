/** Detect network / server unreachable failures (not validation or 4xx business errors). */
export class ConnectionLostError extends Error {
  constructor(message = "Connection to Passage server lost") {
    super(message);
    this.name = "ConnectionLostError";
  }
}

export function isConnectionLostError(err: unknown): boolean {
  return err instanceof ConnectionLostError;
}

function isLikelyNetworkFailure(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof DOMException && err.name === "AbortError") return false;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("load failed") ||
      msg.includes("networkerror")
    );
  }
  return false;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (isLikelyNetworkFailure(err)) {
      throw new ConnectionLostError(err instanceof Error ? err.message : "Network request failed");
    }
    throw err;
  }
}

export async function pingServerHealth(): Promise<boolean> {
  try {
    const res = await apiFetch("/api/health", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
