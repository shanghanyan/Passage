import { useCallback, useRef, useState } from "react";
import { askVoiceQuestion, fetchSpeakAudio, startLiveTranscription } from "../lib/voice";
import { Sentry } from "../lib/sentry";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function VoiceTab({ flow }: { flow: PassageFlow }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [ttsPreview, setTtsPreview] = useState("");
  const [voiceMeta, setVoiceMeta] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const stopRef = useRef<(() => void | Promise<void>) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const canUseVoice = flow.phase === "done" && flow.redaction && flow.reinsertedText;

  const toggleMic = useCallback(async () => {
    if (listening) {
      const result = stopRef.current?.();
      if (result instanceof Promise) await result;
      stopRef.current = null;
      setListening(false);
      return;
    }
    if (!canUseVoice) return;

    setVoiceError(null);
    try {
      const { stop, mode } = await startLiveTranscription(
        (text, isFinal) => {
          if (isFinal) setTranscript((prev) => (prev ? `${prev} ${text}` : text).trim());
          else setTranscript(text);
        },
        (err) => {
          Sentry.captureException(err);
          setVoiceError(err.message);
          setListening(false);
        },
      );
      stopRef.current = stop;
      setListening(true);
      if (mode === "server-proxy") {
        console.log("[Passage Phase 6] Using server-proxy STT (Deepgram key lacks grant permission)");
      }
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
      setVoiceError(err instanceof Error ? err.message : "Microphone failed");
    }
  }, [listening, canUseVoice]);

  const submitQuestion = useCallback(async () => {
    if (!flow.redaction || !transcript.trim() || !canUseVoice) return;
    setBusy(true);
    setVoiceError(null);
    if (listening) {
      const result = stopRef.current?.();
      if (result instanceof Promise) await result;
      stopRef.current = null;
      setListening(false);
    }

    try {
      const result = await askVoiceQuestion({
        transcript: transcript.trim(),
        sessionId: flow.sessionId,
        redactedText: flow.redaction.redacted,
        targetLanguage: flow.targetLanguage,
      });

      setAnswer(result.answer_text);
      setTtsPreview(result.tts_text);
      const meta: string[] = [];
      if (result.from_cache) meta.push("LangCache hit");
      if (result.memory_turns) meta.push(`${result.memory_turns} prior turn(s) from Agent Memory`);
      setVoiceMeta(meta.length > 0 ? meta.join(" · ") : null);

      const audioBuf = await fetchSpeakAudio(result.tts_text);
      const blob = new Blob([audioBuf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
      setVoiceError(err instanceof Error ? err.message : "Voice question failed");
    } finally {
      setBusy(false);
    }
  }, [flow, transcript, canUseVoice, listening]);

  if (!canUseVoice) {
    return (
      <p className="notice">
        <i className="ti ti-info-circle" /> Complete translation first — voice questions use the redacted document
        context.
      </p>
    );
  }

  return (
    <>
      {listening && (
        <div className="voice-mic-disclaimer">
          <strong>Please type any ID numbers — don&apos;t say them out loud.</strong> Only general questions should be
          spoken.
        </div>
      )}

      <div className="summary-card">
        <div className="summary-level">
          <span className="level-label">Ask about this letter</span>
        </div>
        <p className="notice" style={{ marginBottom: 16 }}>
          Try: &quot;What is this letter asking me to do?&quot; or &quot;What does RFE mean?&quot;
        </p>

        <div className="tool-actions" style={{ marginBottom: 16 }}>
          <button type="button" className={`btn ${listening ? "btn-ghost" : "btn-red"}`} onClick={() => void toggleMic()}>
            <i className={`ti ${listening ? "ti-player-stop" : "ti-microphone"}`} /> {listening ? "Stop mic" : "Start mic"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy || !transcript.trim()} onClick={() => void submitQuestion()}>
            {busy ? (
              <>
                <span className="spinner" /> Asking…
              </>
            ) : (
              <>
                <i className="ti ti-send" /> Send question
              </>
            )}
          </button>
        </div>

        <label className="level-label" htmlFor="voice-transcript">
          Transcript
        </label>
        <textarea
          id="voice-transcript"
          className="voice-textarea"
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speak or type your question…"
        />
      </div>

      {voiceError && (
        <p className="passage-error" role="alert">
          {voiceError}
        </p>
      )}

      {voiceMeta && <p className="notice">{voiceMeta}</p>}

      {answer && (
        <div className="summary-card">
          <div className="summary-level">
            <span className="level-label">Answer</span>
          </div>
          <div className="summary-text">{answer}</div>
        </div>
      )}

      {ttsPreview && (
        <div className="summary-card">
          <div className="summary-level">
            <span className="level-label">Text sent to TTS (verify: no raw PII)</span>
          </div>
          <div className="summary-text" style={{ fontSize: 13, color: "var(--cream-dim)" }}>
            {ttsPreview}
          </div>
        </div>
      )}
    </>
  );
}
