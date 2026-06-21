import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function InputPhase({ flow }: { flow: PassageFlow }) {
  const demoDocs = flow.syntheticDocs.filter((d) => !d.plantedValidationFailure && !d.plantedDetectionFailure);
  const plantedDocs = flow.syntheticDocs.filter((d) => d.plantedValidationFailure || d.plantedDetectionFailure);

  return (
    <section className="workflow-card">
      <div className="workflow-card-head">
        <h2>Paste document section</h2>
        <p className="notice">
          PII detection runs in your browser. Nothing is sent until you review the scrubbed preview and press send for
          translation.
        </p>
      </div>

      <div className="tool-controls" style={{ marginBottom: 16 }}>
        <span className="lang-label">Translate to</span>
        <select value={flow.langCode} onChange={(e) => flow.setLangCode(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="voice-textarea workflow-textarea"
        rows={12}
        value={flow.rawText}
        onChange={(e) => flow.setRawText(e.target.value)}
        placeholder="Paste the document text here…"
        spellCheck={false}
      />

      <div style={{ margin: "16px 0" }}>
        <p className="notice">Or try a synthetic test document:</p>
        <div className="demo-chips">
          {demoDocs.map((doc) => (
            <button key={doc.id} type="button" className="demo-chip" onClick={() => flow.loadSample(doc.id)}>
              {doc.title}
            </button>
          ))}
        </div>
        {plantedDocs.length > 0 && (
          <div className="demo-chips" style={{ marginTop: 8 }}>
            {plantedDocs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="demo-chip"
                onClick={() => flow.loadSample(doc.id)}
                title="Demo-only — tests fail-closed paths"
              >
                {doc.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tool-actions">
        <button
          type="button"
          className="btn btn-red"
          disabled={flow.detecting || !flow.rawText.trim()}
          onClick={() => void flow.runDetection()}
        >
          {flow.detecting ? (
            <>
              <span className="spinner" /> Analyzing…
            </>
          ) : (
            <>
              <i className="ti ti-wand" /> Analyze &amp; redact
            </>
          )}
        </button>
      </div>

      {flow.error && (
        <p className="passage-error" role="alert" style={{ marginTop: 16 }}>
          {flow.error}
        </p>
      )}
    </section>
  );
}
