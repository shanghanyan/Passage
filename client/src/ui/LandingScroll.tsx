import { useEffect, useRef, useState } from "react";
import { useUiLocale } from "../i18n/useUiLocale";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { LanguageSelect } from "./LanguageSelect";
import { RiseIn } from "./motion";

interface LandingScrollProps {
  flow: PassageFlow;
  onGetStarted: () => void;
}

export function LandingScroll({ flow, onGetStarted }: LandingScrollProps) {
  const { t } = useUiLocale(flow.uiLocale);
  const aboutRef = useRef<HTMLElement>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

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
        <h1 className="landing-scroll-brand">Passage</h1>
        <p className="landing-scroll-tagline">{t("app.tagline")}</p>
        <LanguageSelect flow={flow} className="lang-select-hero lang-select-hero--landing" id="landing-translate-lang" />
        <div className="landing-scroll-cue" aria-hidden="true">
          <span>{t("landing.scroll")}</span>
          <i className="ti ti-chevron-down" />
        </div>
      </section>

      <section
        ref={aboutRef}
        className={`landing-scroll-about${aboutVisible ? " landing-scroll-about--in" : ""}`}
      >
        <p className="landing-scroll-eyebrow rise-in">{t("landing.eyebrow")}</p>
        <h2 className="landing-scroll-title rise-in">{t("landing.title")}</h2>
        <p className="landing-scroll-body rise-in">{t("landing.body")}</p>
        <p className="landing-scroll-meta rise-in">{t("landing.privacy")}</p>
        <RiseIn delay={0.68} className="landing-scroll-cta-wrap">
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
        </RiseIn>
      </section>
    </div>
  );
}
