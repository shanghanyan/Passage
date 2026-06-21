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

/** Deepgram nova-3 STT language codes — user speaks in the document target language. */
const STT_BY_CODE: Record<string, string> = {
  es: "es",
  fr: "fr",
  zh: "zh-CN",
  vi: "vi",
  ko: "ko",
  pt: "pt-BR",
  ar: "ar",
  hi: "hi",
  tl: "tl",
  uk: "uk",
};

export function sttLanguageFromCode(code: string): string {
  return STT_BY_CODE[code] ?? "en-US";
}

export function sttLanguageFromName(name: string): string {
  const lang = LANGUAGES.find((l) => l.name.toLowerCase() === name.trim().toLowerCase());
  return lang ? sttLanguageFromCode(lang.code) : "en-US";
}

/** Languages with a native Deepgram Aura-2 TTS voice. All others use English voice for tokenized read-back. */
export const TTS_NATIVE_LANGUAGE_CODES = new Set(["es", "fr", "pt", "de", "it", "ja", "nl"]);

export function hasNativeTtsVoice(code: string): boolean {
  return TTS_NATIVE_LANGUAGE_CODES.has(code);
}

export function ttsFallbackLanguageNames(): string[] {
  return LANGUAGES.filter((l) => !hasNativeTtsVoice(l.code)).map((l) => l.name);
}
