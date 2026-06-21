import type { PassageFlow, AnalysisTab } from "../hooks/usePassageFlow";
import { useUiLocale } from "../i18n/useUiLocale";
import { RiseIn } from "./motion";
import { PrivacyTab } from "./PrivacyTab";
import { RelatedDocumentsTab } from "./RelatedDocumentsTab";
import { TranslationTab } from "./TranslationTab";
import { VoiceTab } from "./VoiceTab";

interface AnalysisViewProps {
  flow: PassageFlow;
}

export function AnalysisView({ flow }: AnalysisViewProps) {
  const { t } = useUiLocale(flow.uiLocale);

  const TABS: Array<{ id: AnalysisTab; label: string; icon: string }> = [
    { id: "translation", label: t("tab.translation"), icon: "ti-language" },
    { id: "privacy", label: t("tab.privacy"), icon: "ti-shield-lock" },
    { id: "voice", label: t("tab.voice"), icon: "ti-microphone" },
    { id: "documents", label: t("tab.documents"), icon: "ti-checklist" },
  ];

  return (
    <div className="workspace show rise-in-group">
      <RiseIn className="workspace-back">
        <button type="button" className="btn btn-ghost btn-sm" onClick={flow.startOver}>
          <i className="ti ti-arrow-left" /> {t("workspace.startOver")}
        </button>
        <span className="process-badge">
          {flow.selectedDoc?.title ?? t("workspace.yourDocument")} · {flow.targetLanguage}
        </span>
        {flow.phase === "translating" && (
          <span className="process-badge" style={{ background: "var(--surface2)", color: "var(--cream-dim)", border: "1px solid var(--border)" }}>
            <span className="spinner" style={{ marginRight: 6, verticalAlign: "middle" }} />
            {t("workspace.translating")}
          </span>
        )}
      </RiseIn>

      <RiseIn delay={0.17}>
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab${flow.activeTab === tab.id ? " active" : ""}`}
            onClick={() => flow.setActiveTab(tab.id)}
            style={{ background: "none", border: "none" }}
          >
            <i className={`ti ${tab.icon}`} /> &nbsp;{tab.label}
          </button>
        ))}
      </div>
      </RiseIn>

      <RiseIn delay={0.34}>
      <div className={`tab-panel${flow.activeTab === "translation" ? " show" : ""}`}>
        {flow.activeTab === "translation" && <TranslationTab flow={flow} />}
      </div>
      <div className={`tab-panel${flow.activeTab === "privacy" ? " show" : ""}`}>
        {flow.activeTab === "privacy" && <PrivacyTab flow={flow} />}
      </div>
      <div className={`tab-panel${flow.activeTab === "voice" ? " show" : ""}`}>
        {flow.activeTab === "voice" && <VoiceTab flow={flow} />}
      </div>
      <div className={`tab-panel${flow.activeTab === "documents" ? " show" : ""}`}>
        {flow.activeTab === "documents" && <RelatedDocumentsTab flow={flow} />}
      </div>
      </RiseIn>
    </div>
  );
}
