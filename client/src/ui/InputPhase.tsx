import { FileUploadZone } from "./FileUploadZone";
import { useUiLocale } from "../i18n/useUiLocale";
import { LANGUAGES } from "../lib/languages";
import type { PassageFlow } from "../hooks/usePassageFlow";

export function InputPhase({ flow }: { flow: PassageFlow }) {
  const { t } = useUiLocale(flow.uiLocale);
  const demoDocs = flow.syntheticDocs.filter((d) => !d.plantedValidationFailure && !d.plantedDetectionFailure);
  const plantedDocs = flow.syntheticDocs.filter((d) => d.plantedValidationFailure || d.plantedDetectionFailure);

  return (
    <section className="workflow-card" id="passage-tool">
      <div className="lang-select-hero">
        <label className="lang-select-hero__label" htmlFor="translate-lang">
          {t("input.translateTo")}
        </label>
        <select
          id="translate-lang"
          className="lang-select-hero__select"
          value={flow.langCode}
          onChange={(e) => flow.setLangCode(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.name} ({l.native})
            </option>
          ))}
        </select>
        <p className="lang-select-hero__hint">
          Document translation language — UI stays in English. Voice Q&amp;A and read-back follow this choice.
        </p>
      </div>

      <div className="workflow-card-head">
        <h2>{t("input.title")}</h2>
        <p className="notice">{t("input.notice")}</p>
      </div>

      <FileUploadZone
        uiLocale={flow.uiLocale}
        disabled={flow.detecting}
        onTextReady={(text, source) => void flow.ingestDocumentText(text, source)}
        onError={(message) => flow.setError(message || null)}
        onConnectionLost={() => flow.setConnectionLost(true)}
      />

      <p className="upload-or-divider">
        <span>{t("input.orPaste")}</span>
      </p>

      <textarea
        className="voice-textarea workflow-textarea"
        rows={12}
        value={flow.rawText}
        onChange={(e) => flow.setRawText(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
      />

      <div style={{ margin: "16px 0" }}>
        <p className="notice">{t("input.samples")}</p>
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
          className="btn btn-primary"
          disabled={flow.detecting || !flow.rawText.trim()}
          onClick={() => void flow.runDetection()}
        >
          {flow.detecting ? (
            <>
              <span className="spinner" /> {t("input.analyzing")}
            </>
          ) : (
            <>
              <i className="ti ti-wand" /> {t("input.analyze")}
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
