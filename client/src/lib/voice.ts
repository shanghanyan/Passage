import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { formatError } from "./errors";

export type DeepgramAuth =
  | { mode: "client"; token: string; expiresIn: number }
  | { mode: "server-proxy"; message: string };

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

export async function fetchSpeakAudio(text: string): Promise<ArrayBuffer> {
  try {
    const res = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw await readApiError(res, "Text-to-speech");
    return res.arrayBuffer();
  } catch (err) {
    throw wrapFetchError(err, "Text-to-speech");
  }
}

async function transcribeViaServer(blob: Blob): Promise<string> {
  try {
    const res = await fetch("/api/voice/transcribe", {
      method: "POST",
      headers: { "Content-Type": blob.type || "audio/webm" },
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
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (err: Error) => void,
): Promise<() => void> {
  const deepgram = createClient(token);
  const connection = deepgram.listen.live({
    model: "nova-3",
    language: "multi",
    smart_format: true,
  });

  connection.on(LiveTranscriptionEvents.Error, (err: unknown) => onError(new Error(formatError(err))));
  connection.on(LiveTranscriptionEvents.Transcript, (data: { channel?: { alternatives?: Array<{ transcript?: string }> }; is_final?: boolean }) => {
    const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";
    if (!transcript) return;
    onTranscript(transcript, data.is_final ?? false);
  });

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) connection.send(e.data);
  };
  recorder.start(250);

  return () => {
    recorder.stop();
    stream.getTracks().forEach((t) => t.stop());
    connection.requestClose();
  };
}

async function recordAndTranscribe(onError: (err: Error) => void): Promise<{ stop: () => Promise<string> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          transcribeViaServer(blob).then(resolve).catch((err) => {
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
): Promise<{ stop: () => void | Promise<void>; mode: "client" | "server-proxy" }> {
  const auth = await fetchDeepgramAuth();

  if (auth.mode === "client") {
    const stop = await startLiveWithToken(auth.token, onTranscript, onError);
    return { stop, mode: "client" };
  }

  const session = await recordAndTranscribe(onError);
  return {
    mode: "server-proxy",
    stop: async () => {
      const text = await session.stop();
      if (text) onTranscript(text, true);
    },
  };
}
