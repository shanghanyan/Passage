import { useEffect } from "react";
import { useLauncherSession } from "../hooks/useLauncherSession";
import { usePassageFlow } from "../hooks/usePassageFlow";
import { AnalysisView } from "./AnalysisView";
import { InputPhase } from "./InputPhase";
import { LoadingState } from "./LoadingState";
import { PrivacyTab } from "./PrivacyTab";

const PHASE_LABELS: Record<string, string> = {
  input: "1 · Paste",
  preview: "2 · Privacy review",
  translating: "3 · Translating",
  done: "4 · Results",
  blocked: "4 · Blocked",
};

export function PassageApp() {
  const flow = usePassageFlow();
  useLauncherSession();

  useEffect(() => {
    const nav = document.getElementById("mainNav");
    const onScroll = () => nav?.classList.toggle("stuck", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showResults = flow.phase === "done" || flow.phase === "blocked" || flow.phase === "translating";

  return (
    <div className="passage-shell passage-workflow">
      <nav className="nav" id="mainNav">
        <button type="button" className="nav-logo" onClick={flow.startOver} style={{ border: "none", background: "none" }}>
          <div className="nav-cross">✛</div>
          <div className="nav-wordmark">PASSAGE</div>
        </button>
        <div className="workflow-phase-strip">
          {(["input", "preview", "translating", "done"] as const).map((step) => {
            const active =
              flow.phase === step ||
              (step === "done" && (flow.phase === "done" || flow.phase === "blocked")) ||
              (step === "translating" && flow.phase === "translating");
            const reached =
              (step === "input") ||
              (step === "preview" && flow.phase !== "input") ||
              (step === "translating" && (flow.phase === "translating" || flow.phase === "done" || flow.phase === "blocked")) ||
              (step === "done" && (flow.phase === "done" || flow.phase === "blocked"));
            return (
              <span key={step} className={`workflow-phase${active ? " active" : ""}${reached ? " reached" : ""}`}>
                {step === "done" && flow.phase === "blocked" ? PHASE_LABELS.blocked : PHASE_LABELS[step]}
              </span>
            );
          })}
        </div>
        {flow.phase !== "input" && (
          <button type="button" className="nav-cta" onClick={flow.startOver}>
            <i className="ti ti-file-plus" /> New document
          </button>
        )}
      </nav>

      <main className="passage-main workflow-main">
        <div className="workflow-inner">
          {flow.phase === "input" && <InputPhase flow={flow} />}

          {flow.phase === "preview" && (
            <section className="workflow-card">
              <div className="workflow-card-head">
                <h2>Scrubbed preview</h2>
                <p className="notice">
                  Tokens replace real values. Only token text reaches Claude — tap a highlight to verify detection.
                </p>
              </div>
              <PrivacyTab flow={flow} />
            </section>
          )}

          {showResults && <AnalysisView flow={flow} />}
        </div>
      </main>

      {flow.detecting && (
        <LoadingState
          variant="overlay"
          title="Scanning for sensitive information"
          subtitle="Loading on-device NER and running regex detectors — names, A-numbers, SSNs, addresses, and dates. Nothing is sent over the network."
        />
      )}

      {flow.phase === "translating" && (
        <LoadingState
          variant="overlay"
          title="Translating with Claude"
          subtitle="Sending redacted tokens only, validating Claude's response, then reinserting values on your screen."
        />
      )}

      <footer className="footer footer-compact">
        <div className="footer-inner">
          <span className="footer-copy">UC Berkeley AI Hackathon 2026 — World Track · Not legal advice</span>
        </div>
      </footer>

      {flow.toast && <div className="passage-toast">✓ {flow.toast}</div>}
    </div>
  );
}
