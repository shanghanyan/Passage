import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";

interface UploadViewProps {
  flow: PassageFlow;
}

export function UploadView({ flow }: UploadViewProps) {
  const demoDocs = flow.syntheticDocs.filter((d) => !d.plantedValidationFailure && !d.plantedDetectionFailure);

  return (
    <div id="view-upload">
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Privacy-first redaction
        </div>
        <h1 className="hero-title">
          Your documents,
          <br />
          <em>in your language.</em>
        </h1>
        <p className="hero-subtitle">
          Paste immigration letter text, review redacted tokens locally, then translate and explain — personal
          identifiers never leave your device in raw form.
        </p>

        <div className="upload-card">
          <div className="upload-zone" style={{ cursor: "default" }}>
            <span className="upload-zone-icon">📄</span>
            <h3>Paste document text</h3>
            <p>Text only — no file upload in this MVP</p>
            <textarea
              id="doc-text"
              rows={10}
              value={flow.rawText}
              onChange={(e) => {
                flow.setRawText(e.target.value);
              }}
              placeholder="Paste your RFE, biometrics notice, or other immigration letter here…"
              style={{
                width: "100%",
                marginTop: 16,
                padding: 12,
                border: "1.5px solid var(--s200)",
                borderRadius: "var(--rad-s)",
                fontFamily: "ui-monospace, monospace",
                fontSize: 13,
                resize: "vertical",
              }}
            />
          </div>

          <div className="upload-lang-row">
            <label htmlFor="upload-lang-sel">Translate to:</label>
            <select
              id="upload-lang-sel"
              className="select-styled"
              value={flow.langCode}
              onChange={(e) => flow.setLangCode(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} — {l.native}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 18, textAlign: "center" }}>
            <button
              type="button"
              className="btn btn-lg btn-primary"
              disabled={flow.detecting || !flow.rawText.trim()}
              onClick={() => void flow.runDetection()}
            >
              {flow.detecting ? "Detecting…" : "Detect & review privacy"}
            </button>
          </div>

          <div className="demo-btn-row">
            <p>Or try a synthetic test document:</p>
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
        </div>
      </section>

      {flow.error && (
        <p className="error" role="alert" style={{ maxWidth: 540, margin: "0 auto 40px" }}>
          {flow.error}
        </p>
      )}

      <section className="features-grid">
        <div className="feature-card" style={{ background: "#EFF6FF" }}>
          <div className="feature-icon" style={{ background: "#DBEAFE" }}>
            🌐
          </div>
          <h4>Side-by-Side Translation</h4>
          <p>Original and translated text with tokens reinserted only on your screen.</p>
        </div>
        <div className="feature-card" style={{ background: "#ECFDF5" }}>
          <div className="feature-icon" style={{ background: "#D1FAE5" }}>
            🔒
          </div>
          <h4>Privacy Protection</h4>
          <p>Regex + on-device NER detects names, IDs, addresses, and dates before anything is sent.</p>
        </div>
        <div className="feature-card" style={{ background: "#FFFBEB" }}>
          <div className="feature-icon" style={{ background: "#FEF3C7" }}>
            📖
          </div>
          <h4>Plain-Language Explanation</h4>
          <p>Claude explains what each section is asking — not what you should write back.</p>
        </div>
        <div className="feature-card" style={{ background: "#F5F3FF" }}>
          <div className="feature-icon" style={{ background: "#EDE9FE" }}>
            🎙️
          </div>
          <h4>Voice Questions</h4>
          <p>Ask follow-ups by mic after translation; ID numbers stay typed, not spoken.</p>
        </div>
      </section>
    </div>
  );
}
