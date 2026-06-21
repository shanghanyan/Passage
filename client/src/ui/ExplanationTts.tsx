import { useCallback, useEffect, useRef, useState } from "react";
import { formatError } from "../lib/errors";
import { extractExplanationText, ttsVoiceForLanguage } from "../lib/explanation-text";
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
  label = "Listen to explanation",
  autoPlay = false,
  ttsText,
}: ExplanationTtsProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const autoPlayedRef = useRef(false);
  const { t } = useUiLocale(uiLocale);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const explanation = ttsText?.trim() || extractExplanationText(claudeTokenizedText);
  const voice = ttsVoiceForLanguage(targetLanguage);
  const usesEnglishVoice = !hasNativeTtsVoice(langCode);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  const ensureAudioLoaded = useCallback(async () => {
    if (!explanation.trim()) {
      throw new Error("No explanation text to read aloud");
    }
    if (audioRef.current && blobUrlRef.current) return;

    setLoading(true);
    setError(null);
    try {
      const audioBuf = await fetchSpeakAudio(explanation, targetLanguage);
      const blob = new Blob([audioBuf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      audio.onplay = () => setPlaying(true);
      audioRef.current = audio;
    } finally {
      setLoading(false);
    }
  }, [explanation, targetLanguage]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlayPause = useCallback(async () => {
    try {
      if (playing && audioRef.current) {
        audioRef.current.pause();
        return;
      }
      await ensureAudioLoaded();
      if (!audioRef.current) return;
      audioRef.current.playbackRate = playbackRate;
      await audioRef.current.play();
    } catch (err) {
      setError(formatError(err));
      cleanupAudio();
    }
  }, [playing, ensureAudioLoaded, cleanupAudio, playbackRate]);

  useEffect(() => {
    if (!autoPlay || !explanation.trim() || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    void handlePlayPause();
  }, [autoPlay, explanation, handlePlayPause]);

  useEffect(() => {
    if (!autoPlay) autoPlayedRef.current = false;
  }, [autoPlay, claudeTokenizedText]);

  if (!explanation.trim()) return null;

  return (
    <div className="voice-bar explanation-tts-bar">
      <button
        type="button"
        className={`voice-btn${playing ? " playing" : ""}`}
        onClick={() => void handlePlayPause()}
        disabled={loading}
        aria-pressed={playing}
        title={label}
      >
        {loading ? (
          <span className="spinner" style={{ width: 14, height: 14 }} />
        ) : (
          <i className={`ti ${playing ? "ti-player-pause" : "ti-player-play"}`} />
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="voice-label">{loading ? "Loading audio…" : playing ? "Playing" : label}</div>
        <div style={{ fontSize: 11, color: "var(--cream-faint)", marginTop: 2 }}>
          {usesEnglishVoice ? (
            <span className="tts-fallback-note">
              <i className="ti ti-alert-circle" /> English voice ({voice}) — text stays in {targetLanguage}
            </span>
          ) : (
            <span>
              {voice} · explanation only (tokenized)
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
        <summary>TTS payload</summary>
        <pre className="voice-tts-payload">{explanation}</pre>
      </details>
    </div>
  );
}
