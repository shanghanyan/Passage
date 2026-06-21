import { t, type StringKey, type UiLocale } from "./strings";

export function useUiLocale(locale: UiLocale) {
  return {
    locale,
    t: (key: StringKey) => t(locale, key),
  };
}
