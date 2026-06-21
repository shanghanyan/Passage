import { useCallback, useEffect, useRef, useState } from "react";
import { formatError } from "../lib/errors";
import { sttLanguageFromCode } from "../lib/languages";
import { prepareVoiceQuestion } from "../lib/prepare-voice-question";
import { askVoiceQuestion, startLiveTranscription } from "../lib/voice";
import { validateVoiceAnswer } from "../lib/validate";
import { Sentry } from "../lib/sentry";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { ExplanationTts } from "./ExplanationTts";
import { renderTokenHighlights } from "./helpers";
import { RiseIn, useRiseOnChange } from "./motion";
import { LoadingState } from "./LoadingState";

export function VoiceTab({ flow }: { flow: PassageFlow }) {
  const [connecting, setConnecting] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [redactedPreview, setRedactedPreview] = useState("");
  const [answer, setAnswer] = useState("");
  const [ttsText, setTtsText] = useState("");
  const [voiceMeta, setVoiceMeta] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const stopRef = useRef<(() => void | Promise<void>) | null>(null);
  const [autoPlayAnswer, setAutoPlayAnswer] = useState(false);

  const canUseVoice = flow.phase === "done" && flow.redaction && flow.translationReady;
  const sttLanguage = sttLanguageFromCode(flow.langCode);
  const lang = flow.targetLanguage;

  useEffect(() => {
    return () => {
      const result = stopRef.current?.();
      if (result instanceof Promise) void result;
      stopRef.current = null;
    };
  }, []);

  const toggleMic = useCallback(async () => {
    if (listening || connecting) {
      const result = stopRef.current?.();
      if (result instanceof Promise) await result;
      stopRef.current = null;
      setListening(false);
      setConnecting(false);
      return;
    }
    if (!canUseVoice) return;

    setVoiceError(null);
    setRedactedPreview("");
    setAnswer("");
    setTtsText("");
    setAutoPlayAnswer(false);
    try {
      const { stop, mode } = await startLiveTranscription(
        (text, isFinal) => {
          if (isFinal) {
            setTranscript((prev) => (prev ? `${prev} ${text}` : text).trim());
            setInterim("");
          } else {
            setInterim(text);
          }
        },
        (err) => {
          Sentry.captureException(err instanceof Error ? err : new Error(formatError(err)));
          setVoiceError(formatError(err));
          setListening(false);
          setConnecting(false);
        },
        (status) => {
          if (status === "connecting") {
            setConnecting(true);
            setListening(false);
          } else if (status === "listening") {
            setConnecting(false);
            setListening(true);
          } else if (status === "idle" || status === "error") {
            setConnecting(false);
            setListening(false);
          }
        },
        sttLanguage,
      );
      stopRef.current = stop;
      if (mode === "server-proxy") {
        console.log(`[Passage] STT server-proxy · language=${sttLanguage}`);
      }
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(formatError(err)));
      setVoiceError(formatError(err));
      setConnecting(false);
    }
  }, [listening, connecting, canUseVoice, sttLanguage]);

  const submitQuestion = useCallback(async () => {
    const rawQuestion = [transcript, interim].filter(Boolean).join(" ").trim();
    if (!flow.redaction || !canUseVoice) return;
    if (!rawQuestion) {
      setVoiceError("Type or speak a question first.");
      return;
    }
    setBusy(true);
    setVoiceError(null);
    setAutoPlayAnswer(false);
    if (listening || connecting) {
      const result = stopRef.current?.();
      if (result instanceof Promise) await result;
      stopRef.current = null;
      setListening(false);
      setConnecting(false);
    }

    try {
      const { redacted, newTokens, newTokenMeta } = await prepareVoiceQuestion(
        rawQuestion,
        flow.redaction.tokenMap,
      );
      setRedactedPreview(redacted);
      flow.mergeVoiceRedaction(newTokens, newTokenMeta);

      const result = await askVoiceQuestion({
        transcript: redacted,
        sessionId: flow.sessionId,
        redactedText: flow.redaction.redacted,
        targetLanguage: flow.targetLanguage,
      });

      const validation = validateVoiceAnswer(
        result.answer_text,
        { ...flow.redaction.tokenMap, ...newTokens },
        flow.sessionId,
      );
      if (!validation.ok) {
        const detail =
          validation.tokenCheck.reason ??
          validation.leakCheck.reason ??
          validation.fallback;
        setVoiceError(detail);
        return;
      }

      setAnswer(validation.text);
      setTtsText(result.tts_text);
      setAutoPlayAnswer(true);
      const meta: string[] = [`STT: ${sttLanguage}`];
      if (result.from_cache) meta.push("LangCache hit");
      if (result.memory_turns) meta.push(`${result.memory_turns} prior turn(s)`);
      if (result.agent_memory) meta.push("Agent Memory on");
      setVoiceMeta(meta.join(" · "));
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(formatError(err)));
      setVoiceError(formatError(err));
    } finally {
      setBusy(false);
    }
  }, [flow, transcript, interim, canUseVoice, listening, connecting, sttLanguage]);

  const displayTranscript = [transcript, interim].filter(Boolean).join(interim && transcript ? " " : "");
  const transcriptPulse = useRiseOnChange(canUseVoice ? displayTranscript : "");

  if (!canUseVoice) {
    return (
      <p className="notice">
        <i className="ti ti-info-circle" /> Complete translation first — voice questions use the redacted document
        context only.
      </p>
    );
  }

  const isLive = listening || connecting;

  const micBtnClass = [
    "btn",
    "voice-mic-btn",
    isLive ? "btn-ghost" : "btn-primary",
    connecting ? "voice-mic-btn--connecting" : "",
    listening ? "voice-mic-btn--listening" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="voice-tab-stack rise-in-group">
      {isLive && (
        <RiseIn>
          <div className="voice-mic-disclaimer voice-mic-disclaimer-live">
            <strong>Please type any ID numbers — don&apos;t say them out loud.</strong> Speak in {lang}. Audio goes to
            Deepgram only; your question is redacted before Claude.
          </div>
        </RiseIn>
      )}

      <RiseIn delay={0.17} className={`summary-card voice-panel voice-panel-stable${isLive ? " voice-panel-live" : ""}`}>
        <div className="summary-level">
          <span className="micro-label micro-label--inline">Ask about this letter</span>
          {isLive && <span className="mic-pulse" aria-hidden="true" />}
          {connecting && <span className="voice-status-chip">Connecting…</span>}
          {listening && <span className="voice-status-chip voice-status-chip-live">Listening · {sttLanguage}</span>}
        </div>

        <p className="notice" style={{ marginBottom: 16 }}>
          Speak or type in <strong>{lang}</strong>. Try a general question about what the letter is asking for.
        </p>

        <div className="tool-actions" style={{ marginBottom: 16 }}>
          <button type="button" className={micBtnClass} onClick={() => void toggleMic()} disabled={busy}>
            <i className={`ti ${isLive ? "ti-player-stop" : "ti-microphone"}`} />
            {connecting ? "Connecting…" : listening ? "Stop mic" : "Start mic"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || !displayTranscript.trim()}
            onClick={() => void submitQuestion()}
          >
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

        <label className="micro-label" htmlFor="voice-transcript">
          Transcript <span style={{ opacity: 0.6 }}>(local · {sttLanguage})</span>
        </label>
        <div className={`voice-transcript-wrap ${transcriptPulse}`.trim()}>
          <textarea
            id="voice-transcript"
            className="voice-textarea voice-textarea-stable"
            rows={4}
            value={displayTranscript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setInterim("");
            }}
            placeholder={`Speak or type your question in ${lang}…`}
          />
        </div>

        {redactedPreview && (
          <RiseIn className="voice-scrubbed-preview">
            <span className="micro-label">Scrubbed question sent to Claude</span>
            <div className="voice-scrubbed-text">{renderTokenHighlights(redactedPreview, flow.redaction?.tokenMeta)}</div>
          </RiseIn>
        )}
      </RiseIn>

      <div className="voice-answer-slot">
        {busy && (
          <LoadingState
            variant="panel"
            title="Processing your question"
            subtitle="Redacting in browser, then Claude answers from tokenized context only."
          />
        )}

        {voiceError && (
          <p className="passage-error" role="alert">
            {voiceError}
          </p>
        )}

        {voiceMeta && <p className="notice">{voiceMeta}</p>}

        {answer && flow.redaction && (
          <RiseIn className="split voice-answer-split">
            <div className="doc-pane">
              <div className="pane-header">
                <span className="micro-label">What it says</span>
              </div>
              <div className="summary-text pane-body">{renderTokenHighlights(answer, flow.redaction.tokenMeta)}</div>
            </div>
            <div className="doc-pane">
              <div className="pane-header">
                <span className="micro-label">What it means</span>
              </div>
              <div className="pane-body">
                {ttsText ? (
                  <p className="summary-text" style={{ marginBottom: 12 }}>
                    {ttsText}
                  </p>
                ) : (
                  <p className="notice">Read-back text will appear here when available.</p>
                )}
                <ExplanationTts
                  claudeTokenizedText={answer}
                  ttsText={ttsText}
                  targetLanguage={flow.targetLanguage}
                  langCode={flow.langCode}
                  uiLocale={flow.uiLocale}
                  label="Listen to answer"
                  autoPlay={autoPlayAnswer}
                />
              </div>
            </div>
          </RiseIn>
        )}
      </div>
    </div>
  );
}
