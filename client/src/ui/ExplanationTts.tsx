import { useCallback, useEffect, useRef, useState } from "react";
import { formatError } from "../lib/errors";
import { extractExplanationText, ttsVoiceForLanguage } from "../lib/explanation-text";
import { replaceTokensForSpeech } from "../lib/token-speech";
import { hasNativeTtsVoice } from "../lib/languages";
import { fetchSpeakAudio } from "../lib/voice";
import { useUiLocale } from "../i18n/useUiLocale";

interface ExplanationTtsProps {
  claudeTokenizedText: string;
  targetLanguage: string;
  langCode: string;
  uiLocale: import("../i18n/strings").UiLocale;
  label?: string;
  autoPlay?: boolean;
  /** Server-computed TTS payload — avoids client/server extract drift. */
  ttsText?: string;
}

const SPEED_OPTIONS = [
  { rate: 1, key: "tts.speedNormal" as const },
  { rate: 2, key: "tts.speed2x" as const },
  { rate: 4, key: "tts.speed4x" as const },
];

export function ExplanationTts({
  claudeTokenizedText,
  targetLanguage,
  langCode,
  uiLocale,
  label,
  autoPlay = false,
  ttsText,
}: ExplanationTtsProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { t, tf } = useUiLocale(uiLocale);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  /** Bumps when playback should stop — stale fetch/play promises bail out. */
  const loadGenerationRef = useRef(0);
  const autoPlayedForRef = useRef("");

  const explanationRaw = ttsText?.trim() || extractExplanationText(claudeTokenizedText);
  const explanation = replaceTokensForSpeech(explanationRaw, langCode);
  const voice = ttsVoiceForLanguage(targetLanguage);
  const usesEnglishVoice = !hasNativeTtsVoice(langCode);
  const listenLabel = label ?? t("tts.listenExplanation");

  const stopPlayback = useCallback(() => {
    loadGenerationRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPlaying(false);
    setLoading(false);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => {
    stopPlayback();
    autoPlayedForRef.current = "";
  }, [explanationRaw, stopPlayback]);

  const playExplanation = useCallback(async () => {
    if (!explanation.trim()) {
      throw new Error(t("tts.noExplanation"));
    }

    const loadId = ++loadGenerationRef.current;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    setLoading(true);
    setError(null);
    setPlaying(false);

    try {
      const audioBuf = await fetchSpeakAudio(explanation, targetLanguage);
      if (loadId !== loadGenerationRef.current) return;

      const url = URL.createObjectURL(new Blob([audioBuf], { type: "audio/mpeg" }));
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      audio.onended = () => {
        if (audioRef.current === audio) setPlaying(false);
      };
      audio.onpause = () => {
        if (audioRef.current === audio) setPlaying(false);
      };
      audio.onplay = () => {
        if (audioRef.current === audio) setPlaying(true);
      };
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      if (loadId !== loadGenerationRef.current) return;
      setError(formatError(err));
      stopPlayback();
    } finally {
      if (loadId === loadGenerationRef.current) setLoading(false);
    }
  }, [explanation, targetLanguage, playbackRate, stopPlayback, t]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlayPause = useCallback(async () => {
    try {
      if (playing && audioRef.current) {
        stopPlayback();
        return;
      }
      await playExplanation();
    } catch (err) {
      setError(formatError(err));
      stopPlayback();
    }
  }, [playing, playExplanation, stopPlayback]);

  useEffect(() => {
    if (!autoPlay || !explanation.trim()) return;
    if (autoPlayedForRef.current === explanationRaw) return;
    autoPlayedForRef.current = explanationRaw;
    void playExplanation();
  }, [autoPlay, explanationRaw, explanation, playExplanation]);

  if (!explanation.trim()) return null;

  const statusLabel = loading ? t("tts.loadingAudio") : playing ? t("tts.playing") : listenLabel;

  return (
    <div className="voice-bar explanation-tts-bar">
      <button
        type="button"
        className={`voice-btn${playing ? " playing" : ""}`}
        onClick={() => void handlePlayPause()}
        disabled={loading}
        aria-pressed={playing}
        title={listenLabel}
      >
        {loading ? (
          <span className="spinner" style={{ width: 14, height: 14 }} />
        ) : (
          <i className={`ti ${playing ? "ti-player-pause" : "ti-player-play"}`} />
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="voice-label">{statusLabel}</div>
        <div style={{ fontSize: 11, color: "var(--cream-faint)", marginTop: 2 }}>
          {usesEnglishVoice && (
            <span className="tts-fallback-note">
              <i className="ti ti-alert-circle" />{" "}
              {tf("tts.englishVoiceFallback", { voice, language: targetLanguage })}
            </span>
          )}
        </div>
      </div>
      {error && (
        <span className="passage-error" style={{ fontSize: 11 }}>
          {error}
        </span>
      )}
      <div className="tts-speed-control" aria-label={t("tts.speed")}>
        <span className="tts-speed-label">{t("tts.speed")}</span>
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt.rate}
            type="button"
            className={`tts-speed-btn${playbackRate === opt.rate ? " active" : ""}`}
            onClick={() => {
              setPlaybackRate(opt.rate);
              if (audioRef.current) audioRef.current.playbackRate = opt.rate;
            }}
          >
            {t(opt.key)}
          </button>
        ))}
      </div>
      <details className="voice-tts-details">
        <summary>{t("tts.payloadSummary")}</summary>
        <pre className="voice-tts-payload">{explanation}</pre>
      </details>
    </div>
  );
};
