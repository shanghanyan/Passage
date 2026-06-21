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
import {
  computeRecall,
  computeRecallByType,
  reportRedactionScore,
  shouldAlertRecall,
} from "../lib/score-redaction";
import { Sentry } from "../lib/sentry";
import type { DetectedSpan, RedactionResult, TokenMeta, TranslateResponse, ValidationFailureDetails } from "../lib/types";
import { validateTranslationOutput } from "../lib/validate";

export type AppPhase = "input" | "edit" | "preview" | "translating" | "done" | "blocked";
export type AnalysisTab = "privacy" | "translation" | "voice" | "documents";

export interface RelatedDocumentItem {
  name: string;
  description: string;
  status: string;
}

import { persistLangCode, readPersistedLangCode } from "../i18n/locale-storage";
import { t, uiLocaleFromLangCode } from "../i18n/strings";
import { findExactOccurrences } from "../lib/manual-match";

export function usePassageFlow() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("translation");
  const [rawText, setRawText] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  /** Document translation target — UI chrome follows this language. */
  const [langCode, setLangCodeState] = useState(() => readPersistedLangCode() ?? "en");
  const setLangCode = useCallback((code: string) => {
    persistLangCode(code);
    setLangCodeState(code);
  }, []);
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
  const [relatedDocsProcess, setRelatedDocsProcess] = useState<string | null>(null);
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocumentItem[]>([]);
  const [relatedDocsLoading, setRelatedDocsLoading] = useState(false);
  const [relatedDocsError, setRelatedDocsError] = useState<string | null>(null);

  const selectedDoc = SYNTHETIC_DOCS.find((d) => d.id === selectedDocId);
  const targetLanguage = languageNameFromCode(langCode);
  const uiLocale = uiLocaleFromLangCode(langCode);

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
    setRelatedDocsProcess(null);
    setRelatedDocuments([]);
    setRelatedDocsLoading(false);
    setRelatedDocsError(null);
  }, []);

  const prefetchRelatedDocuments = useCallback(async (redactedText: string, sid: string, language: string) => {
    setRelatedDocsLoading(true);
    setRelatedDocsError(null);
    setRelatedDocsProcess(null);
    setRelatedDocuments([]);

    try {
      const res = await apiFetch("/api/related-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redacted_text: redactedText,
          session_id: sid,
          target_language: language,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        process?: string;
        documents?: RelatedDocumentItem[];
        error?: string;
      };

      if (!res.ok || !data.ok || !data.documents) {
        setRelatedDocsError("failed");
        return;
      }

      setRelatedDocsProcess(data.process ?? null);
      setRelatedDocuments(data.documents);
    } catch (err) {
      if (err instanceof ConnectionLostError) {
        setConnectionLost(true);
        return;
      }
      setRelatedDocsError("failed");
    } finally {
      setRelatedDocsLoading(false);
    }
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
      showToast(t(uiLocale, "connection.restored"));
    } else {
      setConnectionLostMessage(t(uiLocale, "connection.stillDown"));
    }
  }, [showToast, uiLocale]);

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

  const addManualSpan = useCallback((span: DetectedSpan, propagateMatches = false) => {
    setManualSpans((prev) => {
      const next = [...prev];
      const seen = new Set(prev.map((s) => `${s.start}:${s.end}:${s.type}`));

      const pushSpan = (candidate: DetectedSpan) => {
        const key = `${candidate.start}:${candidate.end}:${candidate.type}`;
        if (seen.has(key)) return;
        seen.add(key);
        next.push(candidate);
      };

      pushSpan(span);

      if (propagateMatches) {
        for (const occ of findExactOccurrences(rawText, span.value)) {
          if (occ.start === span.start && occ.end === span.end) continue;
          pushSpan({
            ...span,
            start: occ.start,
            end: occ.end,
            value: rawText.slice(occ.start, occ.end),
          });
        }
      }

      return next.length === prev.length ? prev : next;
    });
  }, [rawText]);

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
        const recallByType = computeRecallByType(spans, selectedDoc.labeledSpans);
        setLastRecall(recall);
        if (shouldAlertRecall(recall, recallByType)) {
          Sentry.captureMessage("Redaction recall below threshold", {
            level: "warning",
            extra: { docId: selectedDoc.id, sessionId: newSessionId, recall, recallByType },
          });
        }
        void reportRedactionScore({
          docId: selectedDoc.id,
          sessionId: newSessionId,
          recall,
          recallByType,
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
      void prefetchRelatedDocuments(redaction.redacted, sessionId, targetLanguage);
    } catch (err) {
      if (err instanceof ConnectionLostError) {
        setConnectionLost(true);
        setConnectionLostMessage(null);
        setPhase("preview");
        return;
      }
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : "Translation failed");
      setPhase("preview");
    }
  }, [redaction, sessionId, targetLanguage, selectedDoc, resetOutput, showToast, detectionWarning, phase, prefetchRelatedDocuments]);

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
    relatedDocsProcess,
    relatedDocuments,
    relatedDocsLoading,
    relatedDocsError,
    prefetchRelatedDocuments,
  };
}

export type PassageFlow = ReturnType<typeof usePassageFlow>;
