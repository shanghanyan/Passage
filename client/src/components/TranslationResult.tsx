interface TranslationResultProps {
  originalText: string;
  translatedWithTokens: string;
  reinsertedText: string | null;
  fallback: string | null;
}

export function TranslationResult({
  originalText,
  translatedWithTokens,
  reinsertedText,
  fallback,
}: TranslationResultProps) {
  if (fallback) {
    return (
      <section className="panel result-failure" role="alert">
        <h2>Could not display translation</h2>
        <p>{fallback}</p>
      </section>
    );
  }

  if (!reinsertedText) return null;

  return (
    <section className="panel result-success">
      <h2>Translation result</h2>
      <div className="side-by-side">
        <div>
          <h3>Original</h3>
          <pre>{originalText}</pre>
        </div>
        <div>
          <h3>Translated (tokens)</h3>
          <pre>{translatedWithTokens}</pre>
        </div>
        <div>
          <h3>Translated (reinserted)</h3>
          <pre className="reinserted">{reinsertedText}</pre>
        </div>
      </div>
    </section>
  );
}
