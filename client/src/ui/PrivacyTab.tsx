import { renderTokenHighlights, piiBadgeClass, piiLabel } from "./helpers";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function PrivacyTab({ flow }: { flow: PassageFlow }) {
  if (!flow.redaction) return null;

  const counts = flow.detectedSpans.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="tab-content">
      <div className="privacy-toolbar">
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--s700)" }}>
          🔒 Privacy Protection —{" "}
          <span style={{ color: "var(--s500)", fontWeight: 400 }}>
            {flow.detectedSpans.length} piece(s) detected
          </span>
          {flow.lastRecall !== null && (
            <span style={{ marginLeft: 12, color: "var(--b600)" }}>
              · Recall {(flow.lastRecall * 100).toFixed(0)}% (Phoenix)
            </span>
          )}
        </div>
      </div>

      <div className="privacy-grid">
        <div className="pii-sidebar">
          <div className="pii-card">
            <h3>Detected by type</h3>
            {Object.entries(counts).map(([type, count]) => (
              <div key={type} className="pii-stat">
                <div className="pii-stat-lbl">
                  <span className="pii-dot" style={{ background: "var(--b500)" }} />
                  {piiLabel(type)}
                </div>
                <span className="pii-count">{count}</span>
              </div>
            ))}
          </div>
          <div className="pii-card">
            <h3>Spans found</h3>
            <div className="pii-type-list">
              {flow.detectedSpans.map((span, i) => (
                <div key={i} className="pii-type-item">
                  <span className={`pii-badge ${piiBadgeClass(span.type)}`}>{piiLabel(span.type)}</span>
                  <div>
                    <div className="pii-nm">{span.type.replace("_", " ")}</div>
                    <div className="pii-ds">Confidence {span.confidence ? span.confidence.toFixed(2) : "regex"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="doc-panel">
          <div className="doc-panel-hdr">
            <h3>Scrubbed preview — tokens highlighted amber</h3>
          </div>
          <div className="doc-panel-body">
            <div className="doc-text-block redacted-text">{renderTokenHighlights(flow.redaction.redacted)}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="btn btn-md btn-primary"
          disabled={flow.phase === "translating"}
          onClick={() => void flow.sendForTranslation()}
        >
          {flow.phase === "translating" ? "Sending…" : "Send for translation"}
        </button>
        <p className="hint" style={{ margin: 0 }}>
          No network requests until you press this — including Redis write.
        </p>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => flow.setShowSentPanel((v) => !v)}>
          🔒 {flow.showSentPanel ? "Hide" : "Show"} Claude payload
        </button>
      </div>

      {flow.showSentPanel && (
        <pre className="redacted-payload" style={{ marginTop: 16 }}>
          {flow.redaction.redacted}
        </pre>
      )}
    </div>
  );
}
