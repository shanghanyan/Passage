import { TYPE_COLORS, piiBadgeClass, piiLabel, renderTokenHighlights } from "./helpers";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function PrivacyTab({ flow }: { flow: PassageFlow }) {
  if (!flow.redaction) return null;

  const counts = flow.detectedSpans.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  const sendBlocked = Boolean(flow.detectionWarning);
  const canSend = flow.phase === "preview";

  return (
    <>
      {flow.nerNote && (
        <p className="notice ner-notice">
          <i className="ti ti-alert-triangle" /> {flow.nerNote}
        </p>
      )}

      {flow.detectionWarning && (
        <div className="detection-warning" role="alert">
          <strong>Send blocked</strong>
          <p>{flow.detectionWarning}</p>
        </div>
      )}

      <div className="privacy-layout">
        <div className="pii-sidebar">
          <div className="pii-card">
            <h3>Detected by type</h3>
            {Object.entries(counts).map(([type, count]) => (
              <div key={type} className="pii-stat">
                <span>{piiLabel(type)}</span>
                <span className="pii-count">{count}</span>
              </div>
            ))}
          </div>
          <div className="pii-card">
            <h3>Spans found</h3>
            {flow.detectedSpans.map((span, i) => (
              <div key={i} className="pii-type-item">
                <span className={`pii-badge ${piiBadgeClass(span.type)}`}>{piiLabel(span.type)}</span>
                <div>
                  <div className="pii-nm">{span.type.replace("_", " ")}</div>
                  <div className="pii-ds">
                    {span.confidence != null
                      ? `${Math.round(span.confidence * 100)}% · ${span.source ?? "regex"}`
                      : `regex · ${span.source ?? "regex"}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {flow.lastRecall !== null && (
            <div className="pii-card">
              <h3>Recall score</h3>
              <div className="pii-stat">
                <span>Observability</span>
                <span className="pii-count">{(flow.lastRecall * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag">Scrubbed preview</span>
            <span style={{ fontSize: 11, color: "var(--cream-faint)" }}>Tap a token for type · confidence · source</span>
          </div>
          <div className="token-legend">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <span key={type} className="token-legend-item">
                <span className="token-legend-swatch" style={{ background: color }} />
                {type}
              </span>
            ))}
          </div>
          <div className="pane-body workflow-scrubbed" style={{ maxHeight: 420 }}>
            {renderTokenHighlights(flow.redaction.redacted, flow.redaction.tokenMeta)}
          </div>
        </div>
      </div>

      {canSend && (
        <div className="tool-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={flow.enterEditMode}>
            <i className="ti ti-edit" /> Edit &amp; re-redact
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={sendBlocked}
            onClick={() => void flow.sendForTranslation()}
          >
            <i className="ti ti-send" /> {sendBlocked ? "Send blocked (detection gap)" : "Send for translation"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => flow.setShowSentPanel((v) => !v)}>
            <i className="ti ti-code" /> {flow.showSentPanel ? "Hide" : "Show"} Claude payload
          </button>
        </div>
      )}

      {flow.phase === "translating" && (
        <p className="notice" style={{ marginTop: 16 }}>
          <i className="ti ti-loader" /> Translation in progress — switch to the Translation tab to watch.
        </p>
      )}

      <p className="notice" style={{ marginTop: 12 }}>
        <i className="ti ti-shield" />{" "}
        {canSend
          ? "No network requests until you press send. Upstash gets a PII-free session marker only — raw values stay in browser memory."
          : "Fix detection gaps before sending. Raw values never leave your browser."}
      </p>

      {flow.showSentPanel && canSend && <pre className="redacted-payload">{flow.redaction.redacted}</pre>}

      {canSend && (
        <details className="token-debug-details" style={{ marginTop: 12 }}>
          <summary>Token map ({Object.keys(flow.redaction.tokenMap).length} keys)</summary>
          <pre className="span-log">{Object.keys(flow.redaction.tokenMap).join("\n")}</pre>
        </details>
      )}
    </>
  );
}
