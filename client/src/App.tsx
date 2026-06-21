import { useCallback, useState } from "react";
import { SYNTHETIC_DOCS } from "./data/synthetic-docs";
import { ScrubbedPreview, SentToClaudePanel } from "./components/ScrubbedPreview";
import { TranslationResult } from "./components/TranslationResult";
import { detectPii } from "./lib/detect";
import { scanForLeakage } from "./lib/patterns";
import { redact } from "./lib/redact";
import { mintRedactionSession, writeTokenMap } from "./lib/redis";
import { computeRecall, reportRedactionScore } from "./lib/score-redaction";
import { Sentry } from "./lib/sentry";
import type { DetectedSpan, RedactionResult, TranslateResponse } from "./lib/types";
import { validateAndReinsert } from "./lib/validate";

type AppPhase = "input" | "preview" | "translating" | "done" | "blocked";

export default function App() {
  const [rawText, setRawText] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [detectedSpans, setDetectedSpans] = useState<DetectedSpan[]>([]);
  const [redaction, setRedaction] = useState<RedactionResult | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [phase, setPhase] = useState<AppPhase>("input");
  const [detecting, setDetecting] = useState(false);
  const [showSentPanel, setShowSentPanel] = useState(false);
  const [translatedTokens, setTranslatedTokens] = useState("");
  const [reinsertedText, setReinsertedText] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRecall, setLastRecall] = useState<number | null>(null);

  const selectedDoc = SYNTHETIC_DOCS.find((d) => d.id === selectedDocId);

  const resetOutput = () => {
    setTranslatedTokens("");
    setReinsertedText(null);
    setFallback(null);
    setError(null);
  };

  const loadSample = (docId: string) => {
    const doc = SYNTHETIC_DOCS.find((d) => d.id === docId);
    if (!doc) return;
    setSelectedDocId(docId);
    setRawText(doc.text);
    setRedaction(null);
    setDetectedSpans([]);
    setPhase("input");
    resetOutput();
  };

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
  }, [rawText, selectedDoc]);

  const sendForTranslation = async () => {
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
      return;
    }

    setPhase("translating");

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
    } catch (err) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : "Translation failed");
      setPhase("preview");
    }
  };

  return (
    <main>
      <header>
        <h1>Passage</h1>
        <p>Privacy-first immigration document translator</p>
      </header>

      <section className="panel">
        <label htmlFor="sample-doc">Load synthetic test document</label>
        <select
          id="sample-doc"
          value={selectedDocId}
          onChange={(e) => loadSample(e.target.value)}
        >
          <option value="">— paste your own —</option>
          {SYNTHETIC_DOCS.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title}
            </option>
          ))}
        </select>

        <label htmlFor="doc-text">Document text</label>
        <textarea
          id="doc-text"
          rows={12}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setPhase("input");
            setRedaction(null);
            resetOutput();
          }}
          placeholder="Paste immigration document text here…"
        />

        <label htmlFor="target-lang">Target language</label>
        <input
          id="target-lang"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
        />

        <div className="actions">
          <button type="button" onClick={runDetection} disabled={detecting || !rawText.trim()}>
            {detecting ? "Detecting…" : "Detect & redact"}
          </button>
        </div>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {redaction && phase !== "input" && (
        <>
          <ScrubbedPreview redacted={redaction.redacted} spans={detectedSpans} />
          {lastRecall !== null && selectedDoc && (
            <p className="hint recall-hint">
              Redaction recall vs hand labels: <strong>{(lastRecall * 100).toFixed(0)}%</strong> — logged to
              Phoenix as <code>redaction-check</code>
            </p>
          )}

          <section className="panel">
            <button
              type="button"
              className="primary"
              onClick={sendForTranslation}
              disabled={phase === "translating"}
            >
              {phase === "translating" ? "Sending…" : "Send for translation"}
            </button>
            <p className="hint">
              No network requests until you press this button — including the Redis write.
            </p>
          </section>

          <SentToClaudePanel
            redacted={redaction.redacted}
            open={showSentPanel}
            onToggle={() => setShowSentPanel((v) => !v)}
          />
        </>
      )}

      <TranslationResult
        originalText={rawText}
        translatedWithTokens={translatedTokens}
        reinsertedText={reinsertedText}
        fallback={fallback}
      />
    </main>
  );
}
