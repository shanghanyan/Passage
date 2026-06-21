/** Mirrors draft LANGUAGES — map select value to Claude target_language string. */
export interface LanguageOption {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "tl", name: "Tagalog", native: "Filipino", flag: "🇵🇭" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
];

export function languageNameFromCode(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? "Spanish";
}
