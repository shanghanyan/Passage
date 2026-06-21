import { LANGUAGES, panelLabelsForCode } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { renderTokenHighlights } from "./helpers";
import { ExplanationTts } from "./ExplanationTts";

export function TranslationTab({ flow }: { flow: PassageFlow }) {
  const lang = LANGUAGES.find((l) => l.code === flow.langCode);
  const labels = panelLabelsForCode(flow.langCode);

  if (flow.validationFailure) {
    return (
      <div className="result-failure panel validation-failure" role="alert">
        <h2>{labels.validationFailed}</h2>
        <p>{flow.fallback}</p>
        {!flow.validationFailure.tokenCheck.ok && flow.validationFailure.tokenCheck.reason && (
          <pre className="span-log">{flow.validationFailure.tokenCheck.reason}</pre>
        )}
        {!flow.validationFailure.leakCheck.ok && flow.validationFailure.leakCheck.reason && (
          <pre className="span-log">{flow.validationFailure.leakCheck.reason}</pre>
        )}
      </div>
    );
  }

  if (flow.fallback) {
    return (
      <div className="result-failure panel" role="alert">
        <h2>{labels.couldNotDisplay}</h2>
        <p>{flow.fallback}</p>
      </div>
    );
  }

  if (!flow.translationReady && flow.phase !== "translating") {
    return <p className="notice">{labels.completePrivacyFirst}</p>;
  }

  if (flow.phase === "translating") {
    return <p className="notice">{labels.translating}</p>;
  }

  return (
    <>
      <div className="split">
        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag">{labels.redactedSource}</span>
            <span className="bracket">[ {labels.tokens} ]</span>
          </div>
          <div className="pane-body">
            {flow.redaction && renderTokenHighlights(flow.redaction.redacted, flow.redaction.tokenMeta)}
          </div>
        </div>
        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag red">{lang?.native ?? flow.targetLanguage}</span>
            <span className="bracket">[ {lang?.code?.toUpperCase() ?? "—"} ]</span>
          </div>
          <div className="pane-body">
            {flow.redaction && renderTokenHighlights(flow.translatedTokens, flow.redaction.tokenMeta)}
          </div>
          {(flow.explanationText || flow.translatedTokens) && (
            <ExplanationTts
              claudeTokenizedText={flow.translatedTokens}
              ttsText={flow.explanationText}
              targetLanguage={flow.targetLanguage}
              langCode={flow.langCode}
              uiLocale={flow.uiLocale}
              label={`${labels.listenIn} · ${lang?.native ?? flow.targetLanguage}`}
            />
          )}
        </div>
      </div>
      <p className="notice" style={{ marginTop: 14 }}>
        {labels.footerNotice}
      </p>
    </>
  );
}
