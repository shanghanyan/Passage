import type { PassageFlow, AnalysisTab } from "../hooks/usePassageFlow";
import { PrivacyTab } from "./PrivacyTab";
import { TranslationTab } from "./TranslationTab";
import { VoiceTab } from "./VoiceTab";

const TABS: Array<{ id: AnalysisTab; label: string }> = [
  { id: "privacy", label: "🔒 Privacy" },
  { id: "translation", label: "🌐 Translation" },
  { id: "voice", label: "🎙️ Voice" },
  { id: "summary", label: "📖 Simple Summary" },
  { id: "documents", label: "📋 Documents Needed" },
];

interface AnalysisViewProps {
  flow: PassageFlow;
}

export function AnalysisView({ flow }: AnalysisViewProps) {
  return (
    <div id="view-analysis">
      <div className="analysis-header">
        <button type="button" className="btn btn-sm btn-ghost" onClick={flow.goBack}>
          ← Back
        </button>
        <div className="doc-meta">
          <div className="doc-title">{flow.selectedDoc?.title ?? "Your document"}</div>
          <div className="doc-subtitle">Privacy review · translate · voice</div>
        </div>
        <span className="doc-badge">✓ {flow.phase === "done" ? "Translated" : "Analyzed"}</span>
        <div className="header-lang">{flow.targetLanguage}</div>
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn${flow.activeTab === tab.id ? " active" : ""}`}
            onClick={() => flow.setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {flow.activeTab === "privacy" && <PrivacyTab flow={flow} />}
      {flow.activeTab === "translation" && <TranslationTab flow={flow} />}
      {flow.activeTab === "voice" && <VoiceTab flow={flow} />}
      {flow.activeTab === "summary" && (
        <div className="tab-content">
          <div className="info-bar">
            ℹ️ <span>Simple summary tab — placeholder from UI draft. Translation output includes plain-language explanations.</span>
          </div>
        </div>
      )}
      {flow.activeTab === "documents" && (
        <div className="tab-content">
          <div className="info-bar">
            ℹ️ <span>Document checklist — placeholder from UI draft (Phase 8+).</span>
          </div>
        </div>
      )}
    </div>
  );
}
