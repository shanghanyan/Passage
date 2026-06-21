/** Shared with client — TTS must only speak explanation sections, never full side-by-side output. */
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
    if (after.length > 40) return after;
  }

  return claudeText.trim();
}

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
