import { useEffect } from "react";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingPage() {
  useEffect(() => {
    const nav = document.getElementById("mainNav");
    const onScroll = () => nav?.classList.toggle("stuck", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("in");
        }
      },
      { threshold: 0.12 },
    );

    document.querySelectorAll(".reveal, .reveal-left, .reveal-right").forEach((el) => observer.observe(el));
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <section className="hero" id="home">
        <div className="hero-bg-grid" />
        <svg className="hero-compass" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="100" cy="100" r="98" stroke="#E5DFD0" strokeWidth=".6" />
          <circle cx="100" cy="100" r="78" stroke="#E5DFD0" strokeWidth=".4" />
          <circle cx="100" cy="100" r="58" stroke="#E5DFD0" strokeWidth=".4" />
          <circle cx="100" cy="100" r="38" stroke="#E5DFD0" strokeWidth=".4" />
          <circle cx="100" cy="100" r="8" fill="#D42929" />
          <line x1="100" y1="2" x2="100" y2="198" stroke="#E5DFD0" strokeWidth=".5" />
          <line x1="2" y1="100" x2="198" y2="100" stroke="#E5DFD0" strokeWidth=".5" />
          <polygon points="100,4 94,28 106,28" fill="#D42929" />
        </svg>
        <div className="hero-vignette" />
        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line" />
            Privacy-first immigration document tool
          </div>
          <h1 className="hero-title">
            <span className="tline">
              <span>
                UNDERSTAND<span className="dot">.</span>
              </span>
            </span>
            <span className="tline">
              <span>
                NAVIGATE<span className="dot">.</span>
              </span>
            </span>
            <span className="tline">
              <span>
                ARRIVE<span className="dot">.</span>
              </span>
            </span>
          </h1>
          <p className="hero-body">
            Paste an immigration letter — Passage redacts personal identifiers before anything reaches Claude,
            translates and explains in your language, and reinserts real values only on your screen.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn-primary" onClick={() => scrollToId("tool")}>
              <i className="ti ti-upload" /> Try Passage
            </button>
            <button type="button" className="btn-outline" onClick={() => scrollToId("features")}>
              See What It Does
            </button>
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <div className="stat-num">
              10<em>+</em>
            </div>
            <div className="stat-label">Languages</div>
          </div>
          <div>
            <div className="stat-num">4</div>
            <div className="stat-label">Tools Built In</div>
          </div>
          <div>
            <div className="stat-num">0</div>
            <div className="stat-label">Raw PII Sent</div>
          </div>
        </div>
        <div className="scroll-cue">
          <div className="scroll-cue-text">Scroll</div>
          <div className="scroll-cue-bar" />
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          {[
            "Translation",
            "Privacy Shield",
            "Voice Q&A",
            "Simple English",
            "Redaction Metrics",
            "Fail-Closed Validation",
            "Translation",
            "Privacy Shield",
            "Voice Q&A",
            "Simple English",
            "Redaction Metrics",
            "Fail-Closed Validation",
          ].map((item, i) => (
            <span key={`${item}-${i}`} className="marquee-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="features-section" id="features">
        <div className="features-head reveal">
          <div className="section-eyebrow">Built-In Features</div>
          <h2 className="section-heading" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(42px, 5vw, 68px)", color: "var(--white)" }}>
            Four tools. One mission.
          </h2>
        </div>
        <div className="features-grid">
          <div className="feature-card reveal">
            <div className="feature-n">01</div>
            <div className="feature-icon">
              <i className="ti ti-language" />
            </div>
            <div className="feature-name">Side-by-Side Translation</div>
            <p className="feature-desc">
              Original and translated text with tokens reinserted only on your screen after Claude returns placeholders.
            </p>
            <div className="feature-tag">
              <i className="ti ti-shield-check" /> Tokens preserved
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-n">02</div>
            <div className="feature-icon">
              <i className="ti ti-shield-lock" />
            </div>
            <div className="feature-name">Privacy Shield</div>
            <p className="feature-desc">
              Regex + on-device NER detect names, A-numbers, SSNs, addresses, and dates before anything hits the network.
            </p>
            <div className="feature-tag">
              <i className="ti ti-eye-off" /> Verify in devtools
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-n">03</div>
            <div className="feature-icon">
              <i className="ti ti-microphone" />
            </div>
            <div className="feature-name">Voice Questions</div>
            <p className="feature-desc">
              Ask follow-ups by mic on the redacted document. ID numbers stay typed — never spoken aloud.
            </p>
            <div className="feature-tag">
              <i className="ti ti-player-play" /> Deepgram STT + TTS
            </div>
          </div>
          <div className="feature-card reveal">
            <div className="feature-n">04</div>
            <div className="feature-icon">
              <i className="ti ti-chart-bar" />
            </div>
            <div className="feature-name">Detection Metrics</div>
            <p className="feature-desc">
              Per-document recall scores export to Phoenix or Arize AX — measurable privacy architecture, not just policy.
            </p>
            <div className="feature-tag">
              <i className="ti ti-info-circle" /> redaction-check spans
            </div>
          </div>
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="how-inner">
          <div style={{ textAlign: "center" }} className="reveal">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>
              Getting Started
            </div>
            <h2 className="section-heading" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(42px, 5vw, 68px)", color: "var(--white)" }}>
              Three steps to clarity.
            </h2>
          </div>
          <div className="steps-row">
            <div className="step reveal">
              <div className="step-circle">
                <i className="ti ti-upload" />
              </div>
              <div className="step-title">Paste Your Letter</div>
              <p className="step-desc">Paste RFE, biometrics, EAD, NTA, or similar text. Detection runs locally in your browser.</p>
            </div>
            <div className="step reveal">
              <div className="step-circle">
                <i className="ti ti-shield-lock" />
              </div>
              <div className="step-title">Review Privacy</div>
              <p className="step-desc">Inspect redacted tokens, then explicitly send for translation — nothing leaves until you press send.</p>
            </div>
            <div className="step reveal">
              <div className="step-circle">
                <i className="ti ti-language" />
              </div>
              <div className="step-title">Translate &amp; Ask</div>
              <p className="step-desc">Read the side-by-side result and ask voice follow-ups on the redacted document context.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export { scrollToId };
