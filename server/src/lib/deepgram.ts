import { deepgramListenQueryParams } from "./deepgram-keywords.js";
import { extractExplanationText, ttsVoiceForLanguage } from "@passage/shared/explanation-text.js";

export { extractExplanationText, ttsVoiceForLanguage };

export async function mintDeepgramClientToken(): Promise<
  { mode: "client"; token: string; expiresIn: number } | { mode: "server-proxy"; message: string }
> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set");

  const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ttl_seconds: 120 }),
  });

  if (res.ok) {
    const data = (await res.json()) as { access_token: string; expires_in: number };
    return { mode: "client", token: data.access_token, expiresIn: data.expires_in };
  }

  if (res.status === 403) {
    return {
      mode: "server-proxy",
      message:
        "Deepgram grant unavailable on this API key — using server-side transcription (raw key never sent to browser).",
    };
  }

  const detail = await res.text();
  throw new Error(`Deepgram grant failed (${res.status}): ${detail}`);
}

export async function transcribeAudio(
  buffer: ArrayBuffer,
  mimeType: string,
  language = "en-US",
): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set");

  const params = deepgramListenQueryParams(language);
  const res = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": mimeType || "audio/webm",
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Deepgram transcribe failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as {
    results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
  };
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? "";
}

/** Block TTS if raw PII patterns appear — reinserted values must never reach Deepgram. */
export function assertTtsTextSafe(text: string): void {
  const patterns = [
    /\bA-?\d{7,9}\b/i,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/,
  ];
  for (const p of patterns) {
    if (p.test(text)) throw new Error("TTS blocked: raw PII pattern detected in speak payload");
  }
}

export async function synthesizeSpeech(text: string, targetLanguage = "English"): Promise<ArrayBuffer> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set");

  assertTtsTextSafe(text);

  const model = ttsVoiceForLanguage(targetLanguage);
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Deepgram TTS failed (${res.status}): ${detail}`);
  }

  return res.arrayBuffer();
}
