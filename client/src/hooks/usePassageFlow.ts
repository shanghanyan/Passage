import { useCallback, useState } from "react";
import { SYNTHETIC_DOCS } from "../data/synthetic-docs";
import { detectPii } from "../lib/detect";
import { languageNameFromCode } from "../lib/languages";
import { scanForLeakage } from "../lib/patterns";
import { redact } from "../lib/redact";
import { mintRedactionSession, writeTokenMap } from "../lib/redis";
import { computeRecall, reportRedactionScore } from "../lib/score-redaction";
import { Sentry } from "../lib/sentry";
import type { DetectedSpan, RedactionResult, TranslateResponse } from "../lib/types";
import { validateAndReinsert } from "../lib/validate";

export type AppView = "upload" | "analysis";
export type AppPhase = "input" | "preview" | "translating" | "done" | "blocked";
export type AnalysisTab = "privacy" | "translation" | "voice" | "summary" | "documents";

export function usePassageFlow() {
  const [view, setView] = useState<AppView>("upload");
  const [activeTab, setActiveTab] = useState<AnalysisTab>("privacy");
  const [rawText, setRawText] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [langCode, setLangCode] = useState("es");
  const [detectedSpans, setDetectedSpans] = useState<DetectedSpan[]>([]);
  const [redaction, setRedaction] = useState<RedactionResult | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [phase, setPhase] = useState<AppPhase>("input");
  const [detecting, setDetecting] = useState(false);
  const [showSentPanel, setShowSentPanel] = useState(false);
  const [translatedTokens, setTranslatedTokens] = useState("");
  const [reinsertedText, setReinsertedText] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRecall, setLastRecall] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selectedDoc = SYNTHETIC_DOCS.find((d) => d.id === selectedDocId);
  const targetLanguage = languageNameFromCode(langCode);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const resetOutput = useCallback(() => {
    setTranslatedTokens("");
    setReinsertedText(null);
    setFallback(null);
    setError(null);
  }, []);

  const goBack = useCallback(() => {
    setView("upload");
    setActiveTab("privacy");
    resetOutput();
  }, [resetOutput]);

  const loadSample = useCallback(
    (docId: string) => {
      const doc = SYNTHETIC_DOCS.find((d) => d.id === docId);
      if (!doc) return;
      setSelectedDocId(docId);
      setRawText(doc.text);
      setRedaction(null);
      setDetectedSpans([]);
      setPhase("input");
      resetOutput();
      setLastRecall(null);
    },
    [resetOutput],
  );

  const runDetection = useCallback(async () => {
    if (!rawText.trim()) return;
    setDetecting(true);
    setError(null);
    resetOutput();

    try {
      const spans = await detectPii(rawText);
      setDetectedSpans(spans);
      console.log("[Passage Phase 1] Detected spans:", spans);

      const result = redact(rawText, spans);
      const newSessionId = crypto.randomUUID();
      setRedaction(result);
      setSessionId(newSessionId);
      setPhase("preview");
      setView("analysis");
      setActiveTab("privacy");

      if (selectedDoc?.labeledSpans.length) {
        const recall = computeRecall(spans, selectedDoc.labeledSpans);
        setLastRecall(recall);
        console.log(`[Passage Phase 5] Recall for ${selectedDoc.id}: ${(recall * 100).toFixed(0)}%`);
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
  }, [rawText, selectedDoc, resetOutput]);

  const sendForTranslation = useCallback(async () => {
    if (!redaction) return;
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
      await writeTokenMap(creds, redaction.tokenMap);

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redacted_text: redaction.redacted,
          target_language: targetLanguage,
          session_id: creds.sessionId,
          planted_validation_failure: selectedDoc?.plantedValidationFailure ?? false,
        }),
      });

      const data = (await res.json()) as TranslateResponse;
      if (!data.ok) {
        setFallback(data.fallback);
        setPhase("blocked");
        return;
      }

      setTranslatedTokens(data.translated_text);

      const validation = validateAndReinsert(
        data.translated_text,
        redaction.tokenMap,
        creds.sessionId,
      );

      if (!validation.ok) {
        setFallback(validation.fallback);
        setPhase("blocked");
        return;
      }

      setReinsertedText(validation.text);
      setPhase("done");
      showToast("Translation complete");
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : "Translation failed");
      setPhase("preview");
    }
  }, [redaction, sessionId, targetLanguage, selectedDoc, resetOutput, showToast]);

  return {
    view,
    activeTab,
    setActiveTab,
    rawText,
    setRawText,
    selectedDocId,
    selectedDoc,
    langCode,
    setLangCode,
    targetLanguage,
    detectedSpans,
    redaction,
    sessionId,
    phase,
    detecting,
    showSentPanel,
    setShowSentPanel,
    translatedTokens,
    reinsertedText,
    fallback,
    error,
    lastRecall,
    toast,
    goBack,
    loadSample,
    runDetection,
    sendForTranslation,
    showToast,
    syntheticDocs: SYNTHETIC_DOCS,
  };
}

export type PassageFlow = ReturnType<typeof usePassageFlow>;
