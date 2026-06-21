import type { PassageFlow, AnalysisTab } from "../hooks/usePassageFlow";
import { PrivacyTab } from "./PrivacyTab";
import { TranslationTab } from "./TranslationTab";
import { VoiceTab } from "./VoiceTab";

const TABS: Array<{ id: AnalysisTab; label: string; icon: string }> = [
  { id: "translation", label: "Translation", icon: "ti-language" },
  { id: "privacy", label: "Privacy", icon: "ti-shield-lock" },
  { id: "voice", label: "Voice Q&A", icon: "ti-microphone" },
  { id: "summary", label: "Simple English", icon: "ti-abc" },
  { id: "documents", label: "Documents Needed", icon: "ti-checklist" },
];

interface AnalysisViewProps {
  flow: PassageFlow;
}

export function AnalysisView({ flow }: AnalysisViewProps) {
  return (
    <div className="workspace show">
      <div className="workspace-back">
        <button type="button" className="btn btn-ghost btn-sm" onClick={flow.goBack}>
          <i className="ti ti-arrow-left" /> Back to upload
        </button>
        <span className="process-badge" style={{ marginLeft: 12 }}>
          {flow.selectedDoc?.title ?? "Your document"} · {flow.targetLanguage}
        </span>
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
      <div className={`tab-panel${flow.activeTab === "summary" ? " show" : ""}`}>
        {flow.activeTab === "summary" && (
          <div className="summary-card">
            <div className="summary-level">
              <span className="level-label">Reading level</span>
              <button type="button" className="level-btn active">
                Basic
              </button>
              <button type="button" className="level-btn" disabled>
                Intermediate
              </button>
              <button type="button" className="level-btn" disabled>
                Full Detail
              </button>
            </div>
            <div className="summary-text">
              {flow.reinsertedText
                ? "Plain-language explanations are included in the translation output on the Translation tab."
                : "Complete privacy review and translation first."}
            </div>
          </div>
        )}
      </div>
      <div className={`tab-panel${flow.activeTab === "documents" ? " show" : ""}`}>
        {flow.activeTab === "documents" && (
          <>
            <div className="disclaimer">
              <strong>Informational Only — Not Legal Advice</strong>
              <p>
                Document checklists are a stretch goal in this MVP. Passage explains what a section is asking for — it
                does not advise on how to respond.
              </p>
            </div>
            <div className="doc-list">
              <div className="doc-item">
                <div className="doc-num">—</div>
                <div>
                  <div className="doc-name">Coming soon</div>
                  <div className="doc-desc">Process-specific document lists will appear here in a future phase.</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
