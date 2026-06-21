import type { PassageFlow } from "../hooks/usePassageFlow";
import { useUiLocale } from "../i18n/useUiLocale";

interface ConnectionLostViewProps {
  flow: PassageFlow;
}

export function ConnectionLostView({ flow }: ConnectionLostViewProps) {
  const { t } = useUiLocale(flow.uiLocale);

  return (
    <div className="connection-lost-view" role="alert">
      <div className="passage-card__inset passage-card__inset--error">
        <div className="connection-lost-view__icon" aria-hidden="true">
          <i className="ti ti-plug-connected-x" />
        </div>
        <h2>{t("connection.title")}</h2>
        <p>{flow.connectionLostMessage ?? t("connection.body")}</p>
        <div className="tool-actions">
          <button type="button" className="btn btn-primary" onClick={() => void flow.retryConnection()}>
            <i className="ti ti-refresh" /> {t("connection.retry")}
          </button>
        </div>
      </div>
    </div>
  );
}
