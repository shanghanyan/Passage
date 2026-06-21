import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { renderTokenHighlights } from "./helpers";
import { ExplanationTts } from "./ExplanationTts";

export function TranslationTab({ flow }: { flow: PassageFlow }) {
  const lang = LANGUAGES.find((l) => l.code === flow.langCode);

  if (flow.validationFailure) {
    return (
      <div className="result-failure panel validation-failure" role="alert">
        <h2>Validation failed</h2>
        <p>{flow.fallback}</p>
        {!flow.validationFailure.tokenCheck.ok && flow.validationFailure.tokenCheck.reason && (
          <pre className="span-log">{flow.validationFailure.tokenCheck.reason}</pre>
        )}
        {!flow.validationFailure.leakCheck.ok && flow.validationFailure.leakCheck.reason && (
          <pre className="span-log">{flow.validationFailure.leakCheck.reason}</pre>
        )}
        <p className="hint">
          session: {flow.sessionId} · trace: {flow.validationFailure.traceId ?? "—"}
        </p>
      </div>
    );
  }

  if (flow.fallback) {
    return (
      <div className="result-failure panel" role="alert">
        <h2>Could not display translation</h2>
        <p>{flow.fallback}</p>
      </div>
    );
  }

  if (!flow.translationReady && flow.phase !== "translating") {
    return (
      <p className="notice">
        <i className="ti ti-info-circle" /> Complete privacy review and press <strong>Send for translation</strong> on
        the Privacy tab first.
      </p>
    );
  }

  if (flow.phase === "translating") {
    return (
      <p className="notice">
        <i className="ti ti-loader" /> Translating with Claude — redacted text only, preserving placeholder tokens.
      </p>
    );
  }

  return (
    <>
      <div className="split">
        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag">Redacted source</span>
            <span className="bracket">[ tokens ]</span>
          </div>
          <div className="pane-body">
            {flow.redaction && renderTokenHighlights(flow.redaction.redacted, flow.redaction.tokenMeta)}
          </div>
        </div>
        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag red">{lang?.name ?? flow.targetLanguage}</span>
            <span className="bracket">[ {lang?.code?.toUpperCase() ?? "—"} ]</span>
          </div>
          <div className="pane-body">
            {flow.redaction && renderTokenHighlights(flow.translatedTokens, flow.redaction.tokenMeta)}
          </div>
          {flow.translatedTokens && (
            <ExplanationTts
              claudeTokenizedText={flow.translatedTokens}
              targetLanguage={flow.targetLanguage}
              langCode={flow.langCode}
              label={`Listen in ${lang?.native ?? flow.targetLanguage}`}
            />
          )}
        </div>
      </div>
      <p className="notice" style={{ marginTop: 14 }}>
        <i className="ti ti-info-circle" /> Translation and read-back stay tokenized end-to-end. Raw values never leave
        your browser or get saved to any server.
      </p>
    </>
  );
}
