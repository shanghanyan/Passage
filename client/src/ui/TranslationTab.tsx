import type { PassageFlow } from "../hooks/usePassageFlow";

export function TranslationTab({ flow }: { flow: PassageFlow }) {
  if (flow.fallback) {
    return (
      <div className="tab-content">
        <div className="result-failure panel" role="alert">
          <h2>Could not display translation</h2>
          <p>{flow.fallback}</p>
        </div>
      </div>
    );
  }

  if (!flow.reinsertedText && flow.phase !== "translating") {
    return (
      <div className="tab-content">
        <div className="info-bar">
          ℹ️{" "}
          <span>
            Complete privacy review and press <strong>Send for translation</strong> on the Privacy tab first.
          </span>
        </div>
      </div>
    );
  }

  if (flow.phase === "translating") {
    return (
      <div className="tab-content">
        <p>Translating with Claude…</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="translation-toolbar">
        <div className="trans-info">
          <strong>{flow.selectedDoc?.title ?? "Your document"}</strong> · {flow.targetLanguage}
        </div>
      </div>
      <div className="translation-panels">
        <div className="trans-panel">
          <div className="trans-panel-header">
            <div className="lang-info">
              <span className="lang-flag">🇺🇸</span>
              <div>
                <div className="lang-name">English</div>
                <div className="lang-native">Original</div>
              </div>
            </div>
          </div>
          <div className="trans-panel-body">
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.78, margin: 0 }}>{flow.rawText}</pre>
          </div>
        </div>
        <div className="trans-panel">
          <div className="trans-panel-header">
            <div className="lang-info">
              <span className="lang-flag">{flow.langCode === "es" ? "🇪🇸" : "🌐"}</span>
              <div>
                <div className="lang-name">{flow.targetLanguage}</div>
                <div className="lang-native">Translated + explained</div>
              </div>
            </div>
          </div>
          <div className="trans-panel-body">
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.78, margin: 0, border: "2px solid var(--g500)", padding: 12, borderRadius: 8 }}>
              {flow.reinsertedText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
