import { usePassageFlow } from "../hooks/usePassageFlow";
import { AnalysisView } from "./AnalysisView";
import { UploadView } from "./UploadView";

export function PassageApp() {
  const flow = usePassageFlow();

  return (
    <>
      <nav className="nav">
        <button type="button" className="nav-logo" onClick={flow.view === "analysis" ? flow.goBack : undefined} style={{ border: "none", background: "none" }}>
          <div className="nav-logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 2C11 2 4 5 4 11.5C4 16 7.5 20 11 20C14.5 20 18 16 18 11.5C18 5 11 2 11 2Z"
                fill="rgba(255,255,255,.25)"
                stroke="white"
                strokeWidth="1.5"
              />
              <path d="M11 6V16M8 9L11 6L14 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="nav-logo-text">Passage</span>
        </button>
        <span className="nav-tagline">Your Document, Your Language</span>
        <div className="nav-actions">
          {flow.view === "analysis" && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={flow.goBack}>
              ← Back
            </button>
          )}
        </div>
      </nav>

      {flow.view === "upload" ? <UploadView flow={flow} /> : <AnalysisView flow={flow} />}

      <footer className="footer">
        <div className="footer-logo">Passage</div>
        <p>Explains immigration documents — not legal advice.</p>
      </footer>

      {flow.toast && <div id="toast">✓ {flow.toast}</div>}
    </>
  );
}
