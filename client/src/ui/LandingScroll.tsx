import { useEffect, useRef, useState } from "react";
import { useUiLocale } from "../i18n/useUiLocale";
import type { PassageFlow } from "../hooks/usePassageFlow";

interface LandingScrollProps {
  flow: PassageFlow;
  onGetStarted: () => void;
}

export function LandingScroll({ flow, onGetStarted }: LandingScrollProps) {
  const { t } = useUiLocale(flow.uiLocale);
  const [showTagline, setShowTagline] = useState(false);
  const aboutRef = useRef<HTMLElement>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTagline(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = aboutRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setAboutVisible(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing-scroll">
      <section className="landing-scroll-hero" aria-label="Passage">
        <h1 className="landing-scroll-brand landing-scroll-brand--in">Passage</h1>
        <p className={`landing-scroll-tagline${showTagline ? " landing-scroll-tagline--in" : ""}`}>
          {t("app.tagline")}
        </p>
        <div className={`landing-scroll-cue${showTagline ? " landing-scroll-cue--in" : ""}`} aria-hidden="true">
          <span>Scroll</span>
          <i className="ti ti-chevron-down" />
        </div>
      </section>

      <section
        ref={aboutRef}
        className={`landing-scroll-about${aboutVisible ? " landing-scroll-about--in" : ""}`}
      >
        <p className="landing-scroll-eyebrow">{t("landing.eyebrow")}</p>
        <h2 className="landing-scroll-title">{t("landing.title")}</h2>
        <p className="landing-scroll-body">{t("landing.body")}</p>
        <p className="landing-scroll-meta">{t("landing.privacy")}</p>
        <button
          type="button"
          className="btn btn-primary landing-scroll-cta"
          onClick={() => {
            onGetStarted();
            document.getElementById("passage-tool")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {t("landing.cta")} <i className="ti ti-arrow-down" />
        </button>
      </section>
    </div>
  );
}
