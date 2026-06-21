import { renderTokenHighlights, piiBadgeClass, piiLabel } from "./helpers";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { LoadingState } from "./LoadingState";

export function PrivacyTab({ flow }: { flow: PassageFlow }) {
  if (!flow.redaction) return null;

  const counts = flow.detectedSpans.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
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
                  <div className="pii-ds">Confidence {span.confidence ? span.confidence.toFixed(2) : "regex"}</div>
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
            <span style={{ fontSize: 11, color: "var(--cream-faint)" }}>Tokens highlighted</span>
          </div>
          <div className="pane-body" style={{ maxHeight: 420 }}>
            {renderTokenHighlights(flow.redaction.redacted)}
          </div>
        </div>
      </div>

      <div className="tool-actions" style={{ marginTop: 16 }}>
        {flow.phase === "translating" ? (
          <LoadingState
            variant="inline"
            title="Translation in progress"
            subtitle="Switch to the Translation tab to watch progress."
          />
        ) : (
          <>
            <button
              type="button"
              className="btn btn-red"
              onClick={() => void flow.sendForTranslation()}
            >
              <i className="ti ti-send" /> Send for translation
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => flow.setShowSentPanel((v) => !v)}>
              <i className="ti ti-code" /> {flow.showSentPanel ? "Hide" : "Show"} Claude payload
            </button>
          </>
        )}
      </div>

      <p className="notice" style={{ marginTop: 12 }}>
        <i className="ti ti-shield" /> No network requests until you press send — including Redis write.
      </p>

      {flow.showSentPanel && <pre className="redacted-payload">{flow.redaction.redacted}</pre>}
    </>
  );
}
