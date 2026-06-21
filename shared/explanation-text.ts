/** Section labels for structured Claude translate output (## headers). */
export const TRANSLATE_SECTION_LABELS: Record<string, { translation: string; explanation: string }> = {
  English: { translation: "Translation", explanation: "Explanation" },
  Spanish: { translation: "Traducción", explanation: "Explicación" },
  French: { translation: "Traduction", explanation: "Explication" },
  Chinese: { translation: "翻译", explanation: "解释" },
  Vietnamese: { translation: "Bản dịch", explanation: "Giải thích" },
  Korean: { translation: "번역", explanation: "설명" },
  Portuguese: { translation: "Tradução", explanation: "Explicação" },
  Arabic: { translation: "الترجمة", explanation: "شرح" },
  Hindi: { translation: "अनुवाद", explanation: "व्याख्या" },
  Tagalog: { translation: "Salin", explanation: "Paliwanag" },
  Ukrainian: { translation: "Переклад", explanation: "Пояснення" },
};

export function sectionLabelsForLanguage(targetLanguage: string): { translation: string; explanation: string } {
  const key = targetLanguage.trim();
  return TRANSLATE_SECTION_LABELS[key] ?? TRANSLATE_SECTION_LABELS.English;
}

export function formatTranslationSections(
  translation: string,
  explanation: string,
  targetLanguage: string,
): string {
  const labels = sectionLabelsForLanguage(targetLanguage);
  return `## ${labels.translation}\n${translation.trim()}\n\n---\n\n## ${labels.explanation}\n${explanation.trim()}`;
}

/** Recombine for token validation — matches server formatted output shape. */
export function combineTranslationSections(translation: string, explanation: string): string {
  return `${translation.trim()}\n\n---\n\n${explanation.trim()}`;
}

const TRANSLATION_HEADER =
  /##\s*(Translation|Traducción|Traduction|翻译|Bản dịch|번역|Tradução|الترجمة|अनुवाद|Salin|Переклад)[^\n]*/i;

const EXPLANATION_HEADER =
  /##\s*(Explanation|Explicaci[oó]n|Explication|解释|Giải thích|설명|Explicação|شرح|व्याख्या|Paliwanag|Пояснення)[^\n]*/i;

/**
 * Extract only the document translation — not the plain-language explanation section.
 * The translation pane must show this; explanation is for TTS / listen panel only.
 */
export function extractTranslationText(claudeText: string): string {
  if (!claudeText?.trim()) return "";

  const match = claudeText.match(TRANSLATION_HEADER);
  if (match?.index != null) {
    let body = claudeText.slice(match.index + match[0].length);
    const divider = body.search(/\n---\s*\n/);
    if (divider >= 0) body = body.slice(0, divider);
    const explHeader = body.search(EXPLANATION_HEADER);
    if (explHeader >= 0) body = body.slice(0, explHeader);
    return body.trim();
  }

  const divider = claudeText.search(/\n---\s*\n/);
  if (divider >= 0) {
    const before = claudeText.slice(0, divider).replace(/^##[^\n]*\n?/, "").trim();
    if (before.length > 0) return before;
  }

  const explIdx = claudeText.search(EXPLANATION_HEADER);
  if (explIdx > 0) {
    return claudeText.slice(0, explIdx).replace(/^##[^\n]*\n?/, "").trim();
  }

  return claudeText.trim();
}

/**
 * Extract the explanation portion from Claude translate/answer output.
 * TTS must only speak this section — never the full side-by-side reinserted text.
 */
export function extractExplanationText(claudeText: string): string {
  if (!claudeText?.trim()) return "";

  const markers = [
    /##\s*Explicaci[oó]n[^\n]*/i,
    /##\s*Explication[^\n]*/i,
    /##\s*Explanation[^\n]*/i,
    /##\s*解释[^\n]*/,
    /##\s*Giải thích[^\n]*/i,
    /##\s*설명[^\n]*/,
    /##\s*Explicação[^\n]*/i,
    /##\s*شرح[^\n]*/,
    /##\s*व्याख्या[^\n]*/,
    /##\s*Paliwanag[^\n]*/i,
    /##\s*Пояснення[^\n]*/i,
  ];

  for (const re of markers) {
    const match = claudeText.match(re);
    if (match?.index != null) {
      return claudeText.slice(match.index + match[0].length).trim();
    }
  }

  const translationEnd = claudeText.search(/---\s*\n/);
  if (translationEnd >= 0) {
    const after = claudeText.slice(translationEnd).replace(/^---\s*\n/, "").trim();
    const withoutHeader = after.replace(/^##[^\n]*\n?/, "").trim();
    if (withoutHeader.length > 40) return withoutHeader;
  }

  return "";
}

/** Map translate target language (from LANGUAGES.name) to Deepgram Aura-2 voice model. */
export function ttsVoiceForLanguage(targetLanguage: string): string {
  const lang = targetLanguage.trim().toLowerCase();
  if (lang.startsWith("span") || lang === "es" || lang === "español") {
    return "aura-2-celeste-es";
  }
  if (lang.startsWith("fren") || lang === "fr" || lang === "français") {
    return "aura-2-agathe-fr";
  }
  if (lang.startsWith("port") || lang === "pt" || lang === "português") {
    return "aura-2-thalia-pt";
  }
  if (lang.startsWith("germ") || lang === "de") {
    return "aura-2-helena-de";
  }
  if (lang.startsWith("ital") || lang === "it") {
    return "aura-2-luna-it";
  }
  if (lang.startsWith("japan") || lang === "ja") {
    return "aura-2-hana-ja";
  }
  if (lang.startsWith("dutch") || lang === "nl") {
    return "aura-2-asteria-nl";
  }
  return "aura-2-asteria-en";
}
