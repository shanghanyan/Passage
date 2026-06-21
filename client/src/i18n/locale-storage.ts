const LANG_CODE_KEY = "passage.langCode";

export function readPersistedLangCode(): string | null {
  try {
    return localStorage.getItem(LANG_CODE_KEY);
  } catch {
    return null;
  }
}

export function persistLangCode(code: string): void {
  try {
    localStorage.setItem(LANG_CODE_KEY, code);
  } catch {
    // Private browsing or storage disabled — in-memory locale still works for this session.
  }
}
