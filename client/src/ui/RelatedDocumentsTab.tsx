import type { CSSProperties } from "react";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { useUiLocale } from "../i18n/useUiLocale";
import { RiseIn } from "./motion";
import { LoadingState } from "./LoadingState";

export function RelatedDocumentsTab({ flow }: { flow: PassageFlow }) {
  const { t } = useUiLocale(flow.uiLocale);

  const canShow =
    flow.phase === "done" && flow.redaction && (flow.translationReady || flow.relatedDocsLoading || flow.relatedDocuments.length > 0);

  if (!canShow) {
    return <p className="notice">{t("docs.empty")}</p>;
  }

  if (flow.relatedDocsLoading && flow.relatedDocuments.length === 0) {
    return (
      <LoadingState
        variant="panel"
        title={t("docs.loading")}
        subtitle={t("docs.disclaimer")}
      />
    );
  }

  if (flow.relatedDocsError && flow.relatedDocuments.length === 0) {
    return (
      <div className="passage-card__inset passage-card__inset--error" role="alert">
        <p>{t("docs.error")}</p>
      </div>
    );
  }

  return (
    <div className="rise-in-group">
      <RiseIn>
        <p className="micro-label docs-section-header">{t("tab.documents")}</p>
        <p className="notice docs-disclaimer">{t("docs.disclaimer")}</p>
      </RiseIn>
      {flow.relatedDocsProcess && (
        <RiseIn delay={0.17}>
          <div className="process-badge" style={{ marginBottom: 16 }}>
            <i className="ti ti-id-badge" /> {flow.relatedDocsProcess}
          </div>
        </RiseIn>
      )}
      <div className="doc-list">
        {flow.relatedDocuments.map((doc, index) => (
          <div
            key={`${doc.name}-${index}`}
            className="doc-item doc-item--rise"
            style={{ "--rise-delay": `${0.34 + index * 0.15}s` } as CSSProperties}
          >
            <div className="doc-num">{index + 1}</div>
            <div>
              <div className="doc-name">{doc.name}</div>
              <div className="doc-desc">{doc.description}</div>
              <span className="doc-status">
                <i className="ti ti-circle-check" /> {doc.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
