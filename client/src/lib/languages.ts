/** Mirrors draft LANGUAGES — map select value to Claude target_language string. */
export interface LanguageOption {
  code: string;
  name: string;
  native: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
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
  return LANGUAGES.find((l) => l.code === code)?.name ?? "English";
}

/** Deepgram nova-3 STT language codes — user speaks in the document target language. */
const STT_BY_CODE: Record<string, string> = {
  en: "en-US",
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

/** Translation tab panel labels in the document target language (no English leak when langCode !== en). */
export const PANEL_LABELS: Record<
  string,
  {
    redactedSource: string;
    tokens: string;
    listenIn: string;
    footerNotice: string;
    validationFailed: string;
    couldNotDisplay: string;
    completePrivacyFirst: string;
    translating: string;
  }
> = {
  en: {
    redactedSource: "Redacted source",
    tokens: "tokens",
    listenIn: "Listen",
    footerNotice: "Translation stays tokenized for audit. Explanation is restored locally for reading; listen-back still uses tokens only.",
    validationFailed: "Validation failed",
    couldNotDisplay: "Could not display translation",
    completePrivacyFirst: "Complete privacy review and send for translation first.",
    translating: "Translating — redacted tokens only.",
  },
  es: {
    redactedSource: "Texto redactado",
    tokens: "tokens",
    listenIn: "Escuchar",
    footerNotice: "La traducción sigue tokenizada para auditoría. La explicación se restaura localmente para leer; la escucha sigue usando tokens.",
    validationFailed: "Validación fallida",
    couldNotDisplay: "No se pudo mostrar la traducción",
    completePrivacyFirst: "Complete la revisión de privacidad y envíe a traducir primero.",
    translating: "Traduciendo — solo tokens redactados.",
  },
  fr: {
    redactedSource: "Texte caviardé",
    tokens: "jetons",
    listenIn: "Écouter",
    footerNotice: "La traduction reste tokenisée pour l'audit. L'explication est restaurée localement à la lecture ; l'écoute utilise encore des jetons.",
    validationFailed: "Échec de validation",
    couldNotDisplay: "Impossible d'afficher la traduction",
    completePrivacyFirst: "Terminez la revue de confidentialité et envoyez pour traduction.",
    translating: "Traduction en cours — jetons caviardés uniquement.",
  },
  zh: {
    redactedSource: "已脱敏原文",
    tokens: "标记",
    listenIn: "收听",
    footerNotice: "翻译列保持标记以便审查。解释在本地恢复供阅读；朗读仍仅使用标记。",
    validationFailed: "验证失败",
    couldNotDisplay: "无法显示翻译",
    completePrivacyFirst: "请先完成隐私审查并发送翻译。",
    translating: "正在翻译 — 仅发送脱敏标记。",
  },
  vi: {
    redactedSource: "Văn bản đã che",
    tokens: "mã",
    listenIn: "Nghe",
    footerNotice: "Bản dịch vẫn dùng mã để kiểm tra. Phần giải thích được khôi phục cục bộ để đọc; nghe vẫn chỉ dùng mã.",
    validationFailed: "Xác minh thất bại",
    couldNotDisplay: "Không thể hiển thị bản dịch",
    completePrivacyFirst: "Hoàn tất xem xét quyền riêng tư và gửi dịch trước.",
    translating: "Đang dịch — chỉ mã đã che.",
  },
  ko: {
    redactedSource: "편집된 원문",
    tokens: "토큰",
    listenIn: "듣기",
    footerNotice: "번역은 검토용으로 토큰 상태를 유지합니다. 설명은 읽기 위해 로컬에서 복원되며, 듣기는 여전히 토큰만 사용합니다.",
    validationFailed: "검증 실패",
    couldNotDisplay: "번역을 표시할 수 없습니다",
    completePrivacyFirst: "먼저 개인정보 검토를 완료하고 번역을 보내세요.",
    translating: "번역 중 — 편집된 토큰만.",
  },
  pt: {
    redactedSource: "Texto redigido",
    tokens: "tokens",
    listenIn: "Ouvir",
    footerNotice: "A tradução permanece tokenizada para auditoria. A explicação é restaurada localmente para leitura; a escuta ainda usa tokens.",
    validationFailed: "Validação falhou",
    couldNotDisplay: "Não foi possível exibir a tradução",
    completePrivacyFirst: "Conclua a revisão de privacidade e envie para tradução.",
    translating: "Traduzindo — apenas tokens redigidos.",
  },
  ar: {
    redactedSource: "المصدر المعدّل",
    tokens: "رموز",
    listenIn: "استمع",
    footerNotice: "تبقى الترجمة معرّفة للمراجعة. يُستعاد الشرح محلياً للقراءة؛ الاستماع ما زال يستخدم الرموز فقط.",
    validationFailed: "فشل التحقق",
    couldNotDisplay: "تعذّر عرض الترجمة",
    completePrivacyFirst: "أكمل مراجعة الخصوصية وأرسل للترجمة أولاً.",
    translating: "جارٍ الترجمة — رموز معدّلة فقط.",
  },
  hi: {
    redactedSource: "संपादित स्रोत",
    tokens: "टोकन",
    listenIn: "सुनें",
    footerNotice: "अनुवाद ऑडिट के लिए टोकनयुक्त रहता है। व्याख्या पढ़ने के लिए स्थानीय रूप से बहाल होती है; सुनना अभी भी केवल टोकन का उपयोग करता है।",
    validationFailed: "सत्यापन विफल",
    couldNotDisplay: "अनुवाद दिखाया नहीं जा सका",
    completePrivacyFirst: "पहले गोपनीयता समीक्षा पूरी करें और अनुवाद भेजें।",
    translating: "अनुवाद हो रहा है — केवल संपादित टोकन।",
  },
  tl: {
    redactedSource: "Na-redact na source",
    tokens: "mga token",
    listenIn: "Makinig",
    footerNotice: "Naka-tokenize ang salin para sa audit. Ang paliwanag ay ibinabalik nang lokal para basahin; ang pakikinig ay tokens pa rin.",
    validationFailed: "Nabigo ang validation",
    couldNotDisplay: "Hindi maipakita ang salin",
    completePrivacyFirst: "Kumpletuhin muna ang privacy review at magpadala para isalin.",
    translating: "Nagsasalin — redacted tokens lamang.",
  },
  uk: {
    redactedSource: "Редаговане джерело",
    tokens: "токени",
    listenIn: "Слухати",
    footerNotice: "Переклад лишається токенізованим для перевірки. Пояснення відновлюється локально для читання; озвучення досі використовує лише токени.",
    validationFailed: "Помилка перевірки",
    couldNotDisplay: "Не вдалося показати переклад",
    completePrivacyFirst: "Спочатку завершіть перевірку конфіденційності та надішліть на переклад.",
    translating: "Переклад — лише редаговані токени.",
  },
};

export function panelLabelsForCode(code: string) {
  return PANEL_LABELS[code] ?? PANEL_LABELS.en;
}
