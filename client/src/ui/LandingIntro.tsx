import { useUiLocale } from "../i18n/useUiLocale";
import type { PassageFlow } from "../hooks/usePassageFlow";

interface LandingIntroProps {
  flow: PassageFlow;
  onGetStarted: () => void;
}

export function LandingIntro({ flow, onGetStarted }: LandingIntroProps) {
  const { t } = useUiLocale(flow.uiLocale);

  return (
    <section className="landing-intro" aria-labelledby="landing-title">
      <p className="landing-intro__eyebrow">{t("landing.eyebrow")}</p>
      <h1 id="landing-title" className="landing-intro__title">
        {t("landing.title")}
      </h1>
      <p className="landing-intro__body">{t("landing.body")}</p>
      <p className="landing-intro__meta">{t("landing.privacy")}</p>
      <button type="button" className="btn btn-red landing-intro__cta" onClick={onGetStarted}>
        {t("landing.cta")} <i className="ti ti-arrow-down" />
      </button>
    </section>
  );
}
