import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";

interface UploadToolSectionProps {
  flow: PassageFlow;
}

export function UploadToolSection({ flow }: UploadToolSectionProps) {
  const demoDocs = flow.syntheticDocs.filter((d) => !d.plantedValidationFailure && !d.plantedDetectionFailure);

  return (
    <section className="tool-section" id="tool">
      <div className="tool-inner">
        <div className="tool-head reveal">
          <div className="section-eyebrow">The Tool</div>
          <h2 className="section-heading" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(42px, 5vw, 68px)", color: "var(--white)" }}>
            Try Passage now.
          </h2>
          <p style={{ fontSize: 14, color: "var(--cream-dim)", marginTop: 12, maxWidth: 540, lineHeight: 1.75 }}>
            Paste immigration letter text below. Detection runs locally — nothing is sent until you review privacy and
            press send for translation.
          </p>
        </div>

        <div className="tool-controls reveal">
          <span className="lang-label">Translate to</span>
          <select id="langSelect" value={flow.langCode} onChange={(e) => flow.setLangCode(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="upload-zone reveal">
          <div style={{ position: "relative" }}>
            <div className="c-tl" />
            <div className="c-br" />
            <div className="upload-icon">
              <i className="ti ti-file-upload" />
            </div>
            <h3>Paste your document</h3>
            <p>RFE, biometrics notice, EAD receipt, NTA, and similar immigration letters — text only in this MVP</p>
            <textarea
              id="docInput"
              rows={5}
              value={flow.rawText}
              onChange={(e) => flow.setRawText(e.target.value)}
              placeholder="Paste the document text here…"
            />
          </div>
        </div>

        <div className="tool-actions reveal">
          <button
            type="button"
            className="btn btn-red"
            disabled={flow.detecting || !flow.rawText.trim()}
            onClick={() => void flow.runDetection()}
          >
            {flow.detecting ? (
              <>
                <span className="spinner" /> Detecting…
              </>
            ) : (
              <>
                <i className="ti ti-wand" /> Analyze Document
              </>
            )}
          </button>
        </div>

        <div className="reveal" style={{ marginBottom: 24 }}>
          <p className="notice">Or try a synthetic test document:</p>
          <div className="demo-chips">
            {demoDocs.slice(0, 4).map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="demo-chip"
                onClick={() => {
                  flow.loadSample(doc.id);
                  flow.setRawText(doc.text);
                }}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>

        {flow.error && (
          <p className="passage-error" role="alert">
            {flow.error}
          </p>
        )}
      </div>
    </section>
  );
}
