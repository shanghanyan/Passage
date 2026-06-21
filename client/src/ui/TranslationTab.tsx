import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function TranslationTab({ flow }: { flow: PassageFlow }) {
  const lang = LANGUAGES.find((l) => l.code === flow.langCode);

  if (flow.fallback) {
    return (
      <div className="result-failure panel" role="alert">
        <h2>Could not display translation</h2>
        <p>{flow.fallback}</p>
      </div>
    );
  }

  if (!flow.reinsertedText && flow.phase !== "translating") {
    return (
      <p className="notice">
        <i className="ti ti-info-circle" /> Complete privacy review and press <strong>Send for translation</strong> on
        the Privacy tab first.
      </p>
    );
  }

  if (flow.phase === "translating") {
    return (
      <p className="pane-body loading">
        <span className="spinner" style={{ marginRight: 8, verticalAlign: "middle" }} /> Translating with Claude…
      </p>
    );
  }

  return (
    <>
      <div className="split">
        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag">Original Document</span>
            <span className="bracket">[ EN ]</span>
          </div>
          <div className="pane-body">{flow.rawText}</div>
        </div>
        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag red">{lang?.name ?? flow.targetLanguage}</span>
            <span className="bracket">[ {lang?.code?.toUpperCase() ?? "—"} ]</span>
          </div>
          <div className="pane-body">{flow.reinsertedText}</div>
        </div>
      </div>
      <p className="notice" style={{ marginTop: 14 }}>
        <i className="ti ti-info-circle" /> Real values reinserted locally only. Claude saw placeholder tokens, not raw
        PII.
      </p>
    </>
  );
}
