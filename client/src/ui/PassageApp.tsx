import { useEffect } from "react";
import { useLauncherSession } from "../hooks/useLauncherSession";
import { usePassageFlow } from "../hooks/usePassageFlow";
import { AnalysisView } from "./AnalysisView";
import { LandingPage, scrollToId } from "./LandingPage";
import { LoadingState } from "./LoadingState";
import { UploadToolSection } from "./UploadToolSection";

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

  return (
    <div className="passage-shell">
      <nav className="nav" id="mainNav">
        <button
          type="button"
          className="nav-logo"
          onClick={() => {
            if (flow.view === "analysis") flow.goBack();
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          style={{ border: "none", background: "none" }}
        >
          <div className="nav-cross">✛</div>
          <div className="nav-wordmark">PASSAGE</div>
        </button>
        {flow.view === "upload" && (
          <div className="nav-links">
            <span className="nav-link" onClick={() => scrollToId("features")}>
              Features
            </span>
            <span className="nav-link" onClick={() => scrollToId("how")}>
              How It Works
            </span>
            <span className="nav-link" onClick={() => scrollToId("tool")}>
              Tool
            </span>
          </div>
        )}
        {flow.view === "upload" ? (
          <button type="button" className="nav-cta" onClick={() => scrollToId("tool")}>
            <i className="ti ti-wand" /> Try Passage
          </button>
        ) : (
          <button type="button" className="nav-cta" onClick={flow.goBack}>
            <i className="ti ti-arrow-left" /> New Document
          </button>
        )}
      </nav>

      {flow.view === "upload" ? (
        <div className="passage-main">
          <LandingPage />
          <UploadToolSection flow={flow} />
        </div>
      ) : (
        <section className="tool-section passage-analysis passage-main">
          <div className="tool-inner">
            <AnalysisView flow={flow} />
          </div>
        </section>
      )}

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

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-brand">
                <em>✛</em> PASSAGE
              </div>
              <p className="footer-desc">
                Privacy-first translation and explanation for immigration paperwork — with redaction you can verify in
                devtools.
              </p>
              <div className="footer-legal">
                <strong>Legal Notice</strong>
                Passage explains documents in plain language. It does not provide legal advice or tell anyone how to
                respond.
              </div>
            </div>
            <div>
              <div className="footer-col-head">Features</div>
              <div className="footer-links">
                <span className="footer-link" onClick={() => scrollToId("tool")}>
                  Translation
                </span>
                <span className="footer-link" onClick={() => scrollToId("tool")}>
                  Privacy Shield
                </span>
                <span className="footer-link" onClick={() => scrollToId("tool")}>
                  Voice Q&amp;A
                </span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">UC Berkeley AI Hackathon 2026 — World Track</span>
          </div>
        </div>
      </footer>

      {flow.toast && <div className="passage-toast">✓ {flow.toast}</div>}
    </div>
  );
}
