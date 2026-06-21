import { useEffect, useState, type CSSProperties } from "react";
import { apiFetch, ConnectionLostError } from "../lib/api-fetch";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { useUiLocale } from "../i18n/useUiLocale";
import { RiseIn } from "./motion";
import { LoadingState } from "./LoadingState";

interface RelatedDoc {
  name: string;
  description: string;
  status: string;
}

export function RelatedDocumentsTab({ flow }: { flow: PassageFlow }) {
  const { t } = useUiLocale(flow.uiLocale);
  const [loading, setLoading] = useState(false);
  const [processLabel, setProcessLabel] = useState<string | null>(null);
  const [documents, setDocuments] = useState<RelatedDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canLoad = flow.phase === "done" && flow.redaction && flow.translationReady;

  useEffect(() => {
    if (!canLoad || !flow.redaction) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await apiFetch("/api/related-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            redacted_text: flow.redaction!.redacted,
            session_id: flow.sessionId,
          }),
        });

        const data = (await res.json()) as {
          ok: boolean;
          process?: string;
          documents?: RelatedDoc[];
          error?: string;
        };

        if (cancelled) return;

        if (!res.ok || !data.ok || !data.documents) {
          setError(data.error ?? t("docs.error"));
          return;
        }

        setProcessLabel(data.process ?? null);
        setDocuments(data.documents);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ConnectionLostError) {
          flow.setConnectionLost(true);
          return;
        }
        setError(err instanceof Error ? err.message : t("docs.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canLoad, flow.redaction?.redacted, flow.sessionId, flow.setConnectionLost, t]);

  if (!canLoad) {
    return <p className="notice">{t("docs.empty")}</p>;
  }

  if (loading) {
    return (
      <LoadingState
        variant="panel"
        title={t("docs.loading")}
        subtitle={t("docs.disclaimer")}
      />
    );
  }

  if (error) {
    return (
      <div className="passage-card__inset passage-card__inset--error" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="rise-in-group">
      <RiseIn>
        <p className="micro-label docs-section-header">{t("tab.documents")}</p>
        <p className="notice docs-disclaimer">{t("docs.disclaimer")}</p>
      </RiseIn>
      {processLabel && (
        <RiseIn delay={0.17}>
          <div className="process-badge" style={{ marginBottom: 16 }}>
            <i className="ti ti-id-badge" /> {processLabel}
          </div>
        </RiseIn>
      )}
      <div className="doc-list">
        {documents.map((doc, index) => (
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
