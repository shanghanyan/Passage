import { useCallback, useState } from "react";
import { SYNTHETIC_DOCS } from "../data/synthetic-docs";
import { detectPiiWithStatus } from "../lib/detect";
import { mergeSpans } from "../lib/merge-spans";
import { hasUndetectedAddressLeak } from "../lib/leakage";
import { languageNameFromCode } from "../lib/languages";
import { scanForLeakage } from "../lib/patterns";
import { redact } from "../lib/redact";
import { mintRedactionSession, registerRedactionSession } from "../lib/redis";
import { apiFetch, ConnectionLostError, pingServerHealth } from "../lib/api-fetch";
import { computeRecall, reportRedactionScore } from "../lib/score-redaction";
import { Sentry } from "../lib/sentry";
import type { DetectedSpan, RedactionResult, TokenMeta, TranslateResponse, ValidationFailureDetails } from "../lib/types";
import { validateTranslationOutput } from "../lib/validate";

export type AppPhase = "input" | "edit" | "preview" | "translating" | "done" | "blocked";
export type AnalysisTab = "privacy" | "translation" | "voice" | "documents";

import type { UiLocale } from "../i18n/strings";

export function usePassageFlow() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("translation");
  const [rawText, setRawText] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  /** Document translation target — independent from UI chrome language. */
  const [langCode, setLangCode] = useState("en");
  /** UI chrome language (buttons, labels, nav). Always English on fresh load. */
  const [uiLocale] = useState<UiLocale>("en");
  const [detectedSpans, setDetectedSpans] = useState<DetectedSpan[]>([]);
  const [redaction, setRedaction] = useState<RedactionResult | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [phase, setPhase] = useState<AppPhase>("input");
  const [detecting, setDetecting] = useState(false);
  const [showSentPanel, setShowSentPanel] = useState(false);
  const [translatedTokens, setTranslatedTokens] = useState("");
  const [translationReady, setTranslationReady] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const [validationFailure, setValidationFailure] = useState<ValidationFailureDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRecall, setLastRecall] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [detectionWarning, setDetectionWarning] = useState<string | null>(null);
  const [nerNote, setNerNote] = useState<string | null>(null);
  const [manualSpans, setManualSpans] = useState<DetectedSpan[]>([]);
  const [connectionLost, setConnectionLost] = useState(false);
  const [connectionLostMessage, setConnectionLostMessage] = useState<string | null>(null);
  const [showTool, setShowTool] = useState(false);

  const selectedDoc = SYNTHETIC_DOCS.find((d) => d.id === selectedDocId);
  const targetLanguage = languageNameFromCode(langCode);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const resetOutput = useCallback(() => {
    setTranslatedTokens("");
    setTranslationReady(false);
    setFallback(null);
    setValidationFailure(null);
    setError(null);
  }, []);

  const startOver = useCallback(() => {
    setPhase("input");
    setActiveTab("translation");
    setRedaction(null);
    setDetectedSpans([]);
    setDetectionWarning(null);
    setNerNote(null);
    setManualSpans([]);
    setSessionId("");
    setConnectionLost(false);
    setConnectionLostMessage(null);
    setShowTool(false);
    resetOutput();
    setLastRecall(null);
    setShowSentPanel(false);
  }, [resetOutput]);

  const retryConnection = useCallback(async () => {
    const ok = await pingServerHealth();
    if (ok) {
      setConnectionLost(false);
      setConnectionLostMessage(null);
      showToast("Connection restored");
    } else {
      setConnectionLostMessage("Server still unreachable — is it running on port 3001?");
    }
  }, [showToast]);

  const mergeVoiceRedaction = useCallback(
    (newTokens: Record<string, string>, newTokenMeta: Record<string, TokenMeta>) => {
      if (Object.keys(newTokens).length === 0) return;
      setRedaction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tokenMap: { ...prev.tokenMap, ...newTokens },
          tokenMeta: { ...prev.tokenMeta, ...newTokenMeta },
        };
      });
    },
    [],
  );

  const loadSample = useCallback(
    (docId: string) => {
      const doc = SYNTHETIC_DOCS.find((d) => d.id === docId);
      if (!doc) return;
      setSelectedDocId(docId);
      setRawText(doc.text);
      setShowTool(true);
      setRedaction(null);
      setDetectedSpans([]);
      setPhase("input");
      setDetectionWarning(null);
      setNerNote(null);
      setManualSpans([]);
      resetOutput();
      setLastRecall(null);
      setError(null);
    },
    [resetOutput],
  );

  const enterEditMode = useCallback(() => {
    resetOutput();
    setRedaction(null);
    setDetectionWarning(null);
    setPhase("edit");
    setActiveTab("privacy");
  }, [resetOutput]);

  const addManualSpan = useCallback((span: DetectedSpan) => {
    setManualSpans((prev) => {
      const duplicate = prev.some((s) => s.start === span.start && s.end === span.end && s.type === span.type);
      if (duplicate) return prev;
      return [...prev, span];
    });
  }, []);

  const removeManualSpan = useCallback((index: number) => {
    setManualSpans((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const ingestDocumentText = useCallback(
    async (text: string, _source: "paste" | "txt" | "pdf" | "image") => {
      setSelectedDocId("");
      setRawText(text);
      setRedaction(null);
      setDetectedSpans([]);
      setPhase("input");
      setDetectionWarning(null);
      setNerNote(null);
      setManualSpans([]);
      resetOutput();
      setLastRecall(null);
      setError(null);

      setDetecting(true);
      try {
        const { spans: autoSpans, nerError } = await detectPiiWithStatus(text);
        const spans = mergeSpans(autoSpans);
        setDetectedSpans(spans);
        if (nerError) setNerNote(nerError);

        const result = redact(text, spans);
        const newSessionId = crypto.randomUUID();
        setRedaction(result);
        setSessionId(newSessionId);
        setPhase("preview");
        setActiveTab("privacy");

        if (hasUndetectedAddressLeak(result.redacted)) {
          setDetectionWarning(
            "Detection gap: address text (Apt #4B…) was not fully tokenized — raw fragments remain in the scrubbed preview. Send is blocked until you edit the source text and re-analyze.",
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Detection failed");
      } finally {
        setDetecting(false);
      }
    },
    [resetOutput],
  );

  const runDetection = useCallback(async () => {
    if (!rawText.trim()) return;
    setDetecting(true);
    setError(null);
    resetOutput();
    setDetectionWarning(null);
    setNerNote(null);

    try {
      const { spans: autoSpans, nerError } = await detectPiiWithStatus(rawText);
      const spans = mergeSpans([...autoSpans, ...manualSpans]);
      setDetectedSpans(spans);
      if (nerError) setNerNote(nerError);

      const result = redact(rawText, spans);
      const newSessionId = crypto.randomUUID();
      setRedaction(result);
      setSessionId(newSessionId);
      setPhase("preview");
      setActiveTab("privacy");

      if (hasUndetectedAddressLeak(result.redacted)) {
        setDetectionWarning(
          "Detection gap: address text (Apt #4B…) was not fully tokenized — raw fragments remain in the scrubbed preview. Send is blocked until you edit the source text and re-analyze.",
        );
      }

      if (selectedDoc?.labeledSpans.length) {
        const recall = computeRecall(spans, selectedDoc.labeledSpans);
        setLastRecall(recall);
        void reportRedactionScore({
          docId: selectedDoc.id,
          sessionId: newSessionId,
          recall,
          detectedCount: spans.length,
          labeledCount: selectedDoc.labeledSpans.length,
        }).catch((err) => console.warn("Phoenix score report failed:", err));
      } else {
        setLastRecall(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setDetecting(false);
    }
  }, [rawText, selectedDoc, resetOutput, manualSpans]);

  const sendForTranslation = useCallback(async () => {
    if (!redaction || phase !== "preview") return;
    if (detectionWarning) {
      setError("Send blocked — fix detection gaps in the scrubbed preview before translating.");
      return;
    }

    setError(null);
    resetOutput();

    const leaks = scanForLeakage(redaction.redacted);
    if (leaks.length > 0) {
      Sentry.captureMessage("Pre-send PII leakage blocked", {
        level: "error",
        extra: { leakTypes: leaks, sessionId },
      });
      setFallback("We couldn't safely process this section — try again or review manually.");
      setPhase("blocked");
      setActiveTab("translation");
      return;
    }

    setPhase("translating");
    setActiveTab("translation");

    try {
      const creds = await mintRedactionSession(sessionId);
      await registerRedactionSession(creds);

      const res = await apiFetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redacted_text: redaction.redacted,
          target_language: targetLanguage,
          session_id: sessionId,
          planted_validation_failure: selectedDoc?.plantedValidationFailure ?? false,
        }),
      });

      const data = (await res.json()) as TranslateResponse;
      if (!data.ok) {
        setFallback(data.fallback);
        setPhase("blocked");
        return;
      }

      const validation = validateTranslationOutput(data.translated_text, redaction.tokenMap, sessionId);

      if (!validation.ok) {
        setFallback(validation.fallback);
        setValidationFailure({
          tokenCheck: validation.tokenCheck,
          leakCheck: validation.leakCheck,
          traceId: data.trace_id,
        });
        setPhase("blocked");
        return;
      }

      setTranslatedTokens(validation.text);
      setTranslationReady(true);
      setPhase("done");
      setActiveTab("translation");
      showToast("Translation complete");
    } catch (err) {
      if (err instanceof ConnectionLostError) {
        setConnectionLost(true);
        setConnectionLostMessage(err.message);
        setPhase("preview");
        return;
      }
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : "Translation failed");
      setPhase("preview");
    }
  }, [redaction, sessionId, targetLanguage, selectedDoc, resetOutput, showToast, detectionWarning, phase]);

  return {
    activeTab,
    setActiveTab,
    rawText,
    setRawText,
    selectedDocId,
    selectedDoc,
    langCode,
    setLangCode,
    uiLocale,
    targetLanguage,
    detectedSpans,
    redaction,
    sessionId,
    phase,
    detecting,
    showSentPanel,
    setShowSentPanel,
    translatedTokens,
    translationReady,
    fallback,
    validationFailure,
    error,
    setError,
    lastRecall,
    toast,
    detectionWarning,
    nerNote,
    manualSpans,
    connectionLost,
    connectionLostMessage,
    setConnectionLost,
    retryConnection,
    showTool,
    setShowTool,
    addManualSpan,
    removeManualSpan,
    enterEditMode,
    startOver,
    loadSample,
    ingestDocumentText,
    runDetection,
    sendForTranslation,
    mergeVoiceRedaction,
    showToast,
    syntheticDocs: SYNTHETIC_DOCS,
  };
}

export type PassageFlow = ReturnType<typeof usePassageFlow>;
