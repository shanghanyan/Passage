import { useEffect } from "react";
import { useLauncherSession } from "../hooks/useLauncherSession";
import { usePassageFlow } from "../hooks/usePassageFlow";
import { useUiLocale } from "../i18n/useUiLocale";
import { pingServerHealth } from "../lib/api-fetch";
import { AnalysisView } from "./AnalysisView";
import { ConnectionLostView } from "./ConnectionLostView";
import { EditRedactPhase } from "./EditRedactPhase";
import { InputPhase } from "./InputPhase";
import { LandingScroll } from "./LandingScroll";
import { LoadingState } from "./LoadingState";
import { RiseIn } from "./motion";
import { PrivacyTab } from "./PrivacyTab";

export function PassageApp() {
  const flow = usePassageFlow();
  const { t } = useUiLocale(flow.uiLocale);
  useLauncherSession();

  useEffect(() => {
    const nav = document.getElementById("mainNav");
    if (!nav) return;

    const syncNavHeight = () => {
      document.documentElement.style.setProperty("--nav-height", `${nav.offsetHeight}px`);
    };

    syncNavHeight();
    const ro = new ResizeObserver(syncNavHeight);
    ro.observe(nav);

    const onScroll = () => nav.classList.toggle("stuck", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const onOffline = () => flow.setConnectionLost(true);
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, [flow]);

  useEffect(() => {
    if (flow.connectionLost) return;
    const id = window.setInterval(() => {
      void pingServerHealth().then((ok) => {
        if (!ok) flow.setConnectionLost(true);
      });
    }, 30_000);
    return () => window.clearInterval(id);
  }, [flow.connectionLost, flow]);

  const showResults = flow.phase === "done" || flow.phase === "blocked" || flow.phase === "translating";

  const phaseLabels = {
    input: t("phase.paste"),
    preview: t("phase.privacy"),
    translating: t("phase.translating"),
    done: t("phase.yourDocument"),
    blocked: t("phase.blocked"),
  };

  if (flow.connectionLost) {
    return (
      <div className="passage-shell passage-workflow">
        <nav className="nav" id="mainNav">
          <div className="nav-row nav-row--swapped">
            {flow.phase !== "input" && flow.phase !== "edit" && (
              <button type="button" className="nav-cta nav-cta--left" onClick={flow.startOver}>
                <i className="ti ti-file-plus" /> {t("nav.newDocument")}
              </button>
            )}
            <button type="button" className="nav-logo nav-logo--right" onClick={flow.startOver} style={{ border: "none", background: "none" }}>
              <div className="nav-cross">✛</div>
              <div className="nav-wordmark">PASSAGE</div>
            </button>
          </div>
        </nav>
        <main className="passage-main workflow-main">
          <ConnectionLostView flow={flow} />
        </main>
      </div>
    );
  }

  return (
    <div className="passage-shell passage-workflow">
      <nav className="nav" id="mainNav">
        <div className="nav-row nav-row--swapped">
          {flow.phase !== "input" && flow.phase !== "edit" && (
            <button type="button" className="nav-cta nav-cta--left" onClick={flow.startOver}>
              <i className="ti ti-file-plus" /> {t("nav.newDocument")}
            </button>
          )}
          <button type="button" className="nav-logo nav-logo--right" onClick={flow.startOver} style={{ border: "none", background: "none" }}>
            <div className="nav-cross">✛</div>
            <div className="nav-wordmark">PASSAGE</div>
          </button>
        </div>
        <div className="workflow-phase-strip">
          {(["input", "preview", "translating", "done"] as const).map((step) => {
            const active =
              flow.phase === step ||
              (step === "done" && (flow.phase === "done" || flow.phase === "blocked")) ||
              (step === "translating" && flow.phase === "translating");
            const reached =
              step === "input" ||
              (step === "preview" && flow.phase !== "input" && flow.phase !== "edit") ||
              (step === "translating" &&
                (flow.phase === "translating" || flow.phase === "done" || flow.phase === "blocked")) ||
              (step === "done" && (flow.phase === "done" || flow.phase === "blocked"));
            return (
              <span key={step} className={`workflow-phase${active ? " active" : ""}${reached ? " reached" : ""}`}>
                {step === "done" && flow.phase === "blocked" ? phaseLabels.blocked : phaseLabels[step]}
              </span>
            );
          })}
        </div>
      </nav>

      <main className="passage-main workflow-main">
        <div className="workflow-inner">
          {flow.phase === "input" && (
            <>
              <LandingScroll
                flow={flow}
                onGetStarted={() => flow.setShowTool(true)}
              />
              {(flow.showTool || flow.rawText.trim()) && <InputPhase flow={flow} />}
            </>
          )}

          {flow.phase === "edit" && <EditRedactPhase flow={flow} />}

          {flow.phase === "preview" && (
            <section className="workflow-card rise-in-group">
              <RiseIn className="workflow-card-head">
                <h2>Scrubbed preview</h2>
                <p className="notice">
                  Tokens replace real values. Only token text reaches Claude — tap a highlight to verify detection.
                </p>
              </RiseIn>
              <RiseIn delay={0.17}>
                <PrivacyTab flow={flow} />
              </RiseIn>
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
          subtitle="Sending redacted tokens only and validating Claude's response before display."
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
