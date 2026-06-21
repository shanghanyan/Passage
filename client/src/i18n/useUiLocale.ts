import { t, tf, type StringKey, type UiLocale } from "./strings";

export function useUiLocale(locale: UiLocale) {
  return {
    locale,
    t: (key: StringKey) => t(locale, key),
    tf: (key: StringKey, vars: Record<string, string>) => tf(locale, key, vars),
  };
}
