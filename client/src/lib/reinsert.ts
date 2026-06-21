/** Replace ⟦PII:…⟧ placeholders with in-memory values for on-screen readability only. */
export function reinsertTokens(text: string, tokenMap: Record<string, string>): string {
  if (!text) return "";
  let result = text;
  for (const [token, value] of Object.entries(tokenMap)) {
    if (result.includes(token)) {
      result = result.split(token).join(value);
    }
  }
  return result;
}
