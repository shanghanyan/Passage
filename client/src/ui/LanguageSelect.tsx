import { useUiLocale } from "../i18n/useUiLocale";
import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";

interface LanguageSelectProps {
  flow: PassageFlow;
  className?: string;
  id?: string;
}

export function LanguageSelect({ flow, className = "lang-select-hero", id = "translate-lang" }: LanguageSelectProps) {
  const { t } = useUiLocale(flow.uiLocale);

  return (
    <div className={className}>
      <label className="lang-select-hero__label micro-label" htmlFor={id}>
        {t("input.translateTo")}
      </label>
      <select
        id={id}
        className="lang-select-hero__select"
        value={flow.langCode}
        onChange={(e) => flow.setLangCode(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.name} ({l.native})
          </option>
        ))}
      </select>
      <p className="lang-select-hero__hint">{t("landing.langHint")}</p>
    </div>
  );
}
