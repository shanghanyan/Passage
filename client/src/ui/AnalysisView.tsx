import type { PassageFlow, AnalysisTab } from "../hooks/usePassageFlow";
import { PrivacyTab } from "./PrivacyTab";
import { TranslationTab } from "./TranslationTab";
import { VoiceTab } from "./VoiceTab";

const TABS: Array<{ id: AnalysisTab; label: string; icon: string }> = [
  { id: "translation", label: "Translation", icon: "ti-language" },
  { id: "privacy", label: "Privacy", icon: "ti-shield-lock" },
  { id: "voice", label: "Voice Q&A", icon: "ti-microphone" },
];

interface AnalysisViewProps {
  flow: PassageFlow;
}

export function AnalysisView({ flow }: AnalysisViewProps) {
  return (
    <div className="workspace show">
      <div className="workspace-back">
        <button type="button" className="btn btn-ghost btn-sm" onClick={flow.startOver}>
          <i className="ti ti-arrow-left" /> Start over
        </button>
        <span className="process-badge">
          {flow.selectedDoc?.title ?? "Your document"} · {flow.targetLanguage}
        </span>
        {flow.phase === "translating" && (
          <span className="process-badge" style={{ background: "var(--surface2)", color: "var(--cream-dim)", border: "1px solid var(--border)" }}>
            <span className="spinner" style={{ marginRight: 6, verticalAlign: "middle" }} />
            Translating…
          </span>
        )}
      </div>

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

      <div className={`tab-panel${flow.activeTab === "translation" ? " show" : ""}`}>
        {flow.activeTab === "translation" && <TranslationTab flow={flow} />}
      </div>
      <div className={`tab-panel${flow.activeTab === "privacy" ? " show" : ""}`}>
        {flow.activeTab === "privacy" && <PrivacyTab flow={flow} />}
      </div>
      <div className={`tab-panel${flow.activeTab === "voice" ? " show" : ""}`}>
        {flow.activeTab === "voice" && <VoiceTab flow={flow} />}
      </div>
    </div>
  );
}
