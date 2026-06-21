import { ManualRedactPanel } from "./ManualRedactPanel";
import { TYPE_COLORS, PII_TYPES, countTokensByType, piiBadgeClass, renderTokenHighlights } from "./helpers";
import { piiLabel } from "../i18n/strings";
import { useUiLocale } from "../i18n/useUiLocale";
import { CountUp } from "./motion";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function PrivacyTab({ flow }: { flow: PassageFlow }) {
  const { t, locale } = useUiLocale(flow.uiLocale);
  if (!flow.redaction) return null;

  const counts = countTokensByType(flow.redaction.tokenMeta);
  const typesWithCounts = PII_TYPES.filter((type) => (counts[type] ?? 0) > 0);

  const sendBlocked = Boolean(flow.detectionWarning);
  const canSend = flow.phase === "preview";
  const tokenCount = Object.keys(flow.redaction.tokenMap).length;

  return (
    <>
      {flow.nerNote && (
        <p className="notice ner-notice">
          <i className="ti ti-alert-triangle" /> {flow.nerNote}
        </p>
      )}

      {flow.detectionWarning && (
        <div className="detection-warning" role="alert">
          <strong>{t("privacy.sendBlockedTitle")}</strong>
          <p>{flow.detectionWarning}</p>
        </div>
      )}

      <div className="privacy-layout">
        <div className="pii-sidebar">
          <div className="pii-card">
            <h3>{t("privacy.detectedByType")}</h3>
            {typesWithCounts.map((type) => (
              <div key={type} className="pii-stat">
                <span>{piiLabel(locale, type)}</span>
                <span className="pii-count">
                  <CountUp key={`${type}-${counts[type]}`} value={counts[type] ?? 0} />
                </span>
              </div>
            ))}
          </div>
          <div className="pii-card">
            <h3>{t("privacy.spansFound")}</h3>
            {flow.detectedSpans.map((span, i) => (
              <div key={i} className="pii-type-item">
                <span className={`pii-badge ${piiBadgeClass(span.type)}`}>{piiLabel(locale, span.type)}</span>
                <div>
                  <div className="pii-nm">{piiLabel(locale, span.type)}</div>
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
              <h3>{t("privacy.recallScore")}</h3>
              <div className="pii-stat">
                <span>{t("privacy.observability")}</span>
                <span className="pii-count">
                  <CountUp value={Math.round(flow.lastRecall * 100)} suffix="%" />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="doc-pane">
          <div className="pane-header">
            <span className="pane-tag">{t("privacy.scrubbedPreview")}</span>
            <span style={{ fontSize: 11, color: "var(--cream-faint)" }}>{t("privacy.tapTokenHint")}</span>
          </div>
          <div className="token-legend">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <span key={type} className="token-legend-item">
                <span className="token-legend-swatch" style={{ background: color }} />
                {piiLabel(locale, type)}
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
            <i className="ti ti-edit" /> {t("privacy.fullScreenEdit")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={sendBlocked}
            onClick={() => void flow.sendForTranslation()}
          >
            <i className="ti ti-send" /> {sendBlocked ? t("privacy.sendBlockedBtn") : t("privacy.sendForTranslation")}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => flow.setShowSentPanel((v) => !v)}>
            <i className="ti ti-code" /> {flow.showSentPanel ? t("privacy.hidePayload") : t("privacy.showPayload")}{" "}
            {t("privacy.claudePayload")}
          </button>
        </div>
      )}

      {canSend && (
        <details className="manual-redact-details">
          <summary>{t("privacy.markMissedOptional")}</summary>
          <ManualRedactPanel flow={flow} />
        </details>
      )}

      {flow.phase === "translating" && (
        <p className="notice" style={{ marginTop: 16 }}>
          <i className="ti ti-loader" /> {t("privacy.translatingNotice")}
        </p>
      )}

      <p className="notice" style={{ marginTop: 12 }}>
        <i className="ti ti-shield" /> {canSend ? t("privacy.noticeCanSend") : t("privacy.noticeFixGaps")}
      </p>

      {flow.showSentPanel && canSend && <pre className="redacted-payload">{flow.redaction.redacted}</pre>}

      {canSend && (
        <details className="token-debug-details" style={{ marginTop: 12 }}>
          <summary>
            {t("privacy.tokenMap")} ({tokenCount} {t("privacy.keys")})
          </summary>
          <pre className="span-log">{Object.keys(flow.redaction.tokenMap).join("\n")}</pre>
        </details>
      )}
    </>
  );
}
