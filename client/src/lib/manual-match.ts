/** Find every non-overlapping exact match of `needle` in `text`. */
export function findExactOccurrences(text: string, needle: string): Array<{ start: number; end: number }> {
  if (!needle) return [];
  const results: Array<{ start: number; end: number }> = [];
  let from = 0;
  while (from <= text.length - needle.length) {
    const idx = text.indexOf(needle, from);
    if (idx === -1) break;
    results.push({ start: idx, end: idx + needle.length });
    from = idx + needle.length;
  }
  return results;
}

/** Occurrences of the same string excluding the highlighted range. */
export function countOtherExactOccurrences(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): number {
  const needle = text.slice(selectionStart, selectionEnd);
  if (!needle.trim()) return 0;
  return findExactOccurrences(text, needle).filter(
    (occ) => occ.start !== selectionStart || occ.end !== selectionEnd,
  ).length;
}
