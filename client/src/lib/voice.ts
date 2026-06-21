import { DeepgramClient } from "@deepgram/sdk";
import { formatError } from "./errors";

export type DeepgramAuth =
  | { mode: "client"; token: string; expiresIn: number }
  | { mode: "server-proxy"; message: string };

export type SttStatus = "connecting" | "listening" | "idle" | "error";

const STT_MODEL = "nova-3";

function wrapFetchError(err: unknown, context: string): Error {
  if (err instanceof TypeError && /fetch|network|load failed/i.test(err.message)) {
    return new Error(
      `${context}: Passage server is not reachable. If you closed the browser tab, relaunch Passage. Otherwise check that the server is still running on port 3001.`,
    );
  }
  return err instanceof Error ? err : new Error(formatError(err));
}

async function readApiError(res: Response, label: string): Promise<Error> {
  try {
    const body = (await res.json()) as { fallback?: string; error?: unknown; ok?: boolean };
    if (body.fallback) return new Error(body.fallback);
    if (typeof body.error === "string") return new Error(body.error);
    if (body.ok === false && !body.fallback) {
      return new Error(`${label} failed — the server could not complete this request. Relaunch Passage and try again.`);
    }
  } catch {
    // ignore JSON parse failures
  }
  return new Error(`${label} failed (HTTP ${res.status})`);
}

export async function fetchDeepgramAuth(): Promise<DeepgramAuth> {
  try {
    const res = await fetch("/api/deepgram-token", { method: "POST" });
    if (!res.ok) throw await readApiError(res, "Deepgram auth");
    return res.json();
  } catch (err) {
    throw wrapFetchError(err, "Microphone setup");
  }
}

interface VoiceQuestionResponse {
  ok: true;
  answer_text: string;
  tts_text: string;
  from_cache?: boolean;
  memory_turns?: number;
  agent_memory?: boolean;
  langcache?: boolean;
}

export async function askVoiceQuestion(params: {
  transcript: string;
  sessionId: string;
  redactedText: string;
  targetLanguage: string;
}): Promise<VoiceQuestionResponse> {
  try {
    const res = await fetch("/api/voice/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: params.transcript,
        session_id: params.sessionId,
        redacted_text: params.redactedText,
        target_language: params.targetLanguage,
      }),
    });
    if (!res.ok) throw await readApiError(res, "Voice question");
    return res.json();
  } catch (err) {
    throw wrapFetchError(err, "Voice question");
  }
}

export async function fetchSpeakAudio(text: string, targetLanguage: string): Promise<ArrayBuffer> {
  try {
    const res = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target_language: targetLanguage }),
    });
    if (!res.ok) throw await readApiError(res, "Text-to-speech");
    return res.arrayBuffer();
  } catch (err) {
    throw wrapFetchError(err, "Text-to-speech");
  }
}

async function transcribeViaServer(blob: Blob, sttLanguage: string): Promise<string> {
  try {
    const res = await fetch("/api/voice/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": blob.type || "audio/webm",
        "X-Stt-Language": sttLanguage,
      },
      body: blob,
    });
    if (!res.ok) throw await readApiError(res, "Transcription");
    const data = (await res.json()) as { transcript: string };
    return data.transcript;
  } catch (err) {
    throw wrapFetchError(err, "Transcription");
  }
}

async function startLiveWithToken(
  token: string,
  sttLanguage: string,
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (err: Error) => void,
  onStatus?: (status: SttStatus, detail?: string) => void,
): Promise<() => Promise<void>> {
  onStatus?.("connecting");

  const client = new DeepgramClient({ accessToken: token });
  const connection = await client.listen.v1.connect({
    model: STT_MODEL,
    language: sttLanguage,
    punctuate: "true",
    interim_results: "true",
    smart_format: "true",
  } as Parameters<typeof client.listen.v1.connect>[0]);

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let stopped = false;

  const stop = async () => {
    if (stopped) return;
    stopped = true;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    stream?.getTracks().forEach((track) => track.stop());

    try {
      if (connection.socket?.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify({ type: "CloseStream" }));
        connection.socket.close();
      }
    } catch {
      // socket may already be closed
    }

    onStatus?.("idle");
  };

  connection.on("message", (data: unknown) => {
    const message = data as {
      type?: string;
      channel?: { alternatives?: Array<{ transcript?: string }> };
      is_final?: boolean;
    };
    if (message.type !== "Results") return;
    const transcript = message.channel?.alternatives?.[0]?.transcript ?? "";
    if (!transcript.trim()) return;
    onTranscript(transcript, Boolean(message.is_final));
  });

  connection.on("error", () => {
    onStatus?.("error", "Deepgram connection error");
    onError(new Error("Deepgram connection error"));
    void stop();
  });

  connection.on("close", () => {
    if (!stopped) onStatus?.("idle");
  });

  connection.connect();
  await connection.waitForOpen();

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0 && connection.socket?.readyState === WebSocket.OPEN) {
      connection.socket.send(event.data);
    }
  };
  recorder.start(250);

  onStatus?.("listening");
  return stop;
}

async function recordAndTranscribe(
  sttLanguage: string,
  onError: (err: Error) => void,
): Promise<{ stop: () => Promise<string> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.start();

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          transcribeViaServer(blob, sttLanguage)
            .then(resolve)
            .catch((err) => {
              onError(err instanceof Error ? err : new Error(String(err)));
              reject(err);
            });
        };
        recorder.stop();
      }),
  };
}

export async function startLiveTranscription(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (err: Error) => void,
  onStatus?: (status: SttStatus, detail?: string) => void,
  sttLanguage = "en-US",
): Promise<{ stop: () => void | Promise<void>; mode: "client" | "server-proxy" }> {
  const auth = await fetchDeepgramAuth();

  if (auth.mode === "client") {
    const stop = await startLiveWithToken(auth.token, sttLanguage, onTranscript, onError, onStatus);
    return { stop, mode: "client" };
  }

  onStatus?.("connecting");
  const session = await recordAndTranscribe(sttLanguage, onError);
  onStatus?.("listening");

  return {
    mode: "server-proxy",
    stop: async () => {
      onStatus?.("idle");
      const text = await session.stop();
      if (text) onTranscript(text, true);
    },
  };
}
