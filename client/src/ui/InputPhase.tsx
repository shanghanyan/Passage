import { FileUploadZone } from "./FileUploadZone";
import { useUiLocale } from "../i18n/useUiLocale";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { RiseIn } from "./motion";

export function InputPhase({ flow }: { flow: PassageFlow }) {
  const { t } = useUiLocale(flow.uiLocale);
  const demoDocs = flow.syntheticDocs.filter((d) => !d.plantedValidationFailure && !d.plantedDetectionFailure);
  const plantedDocs = flow.syntheticDocs.filter((d) => d.plantedValidationFailure || d.plantedDetectionFailure);

  return (
    <section className="workflow-card rise-in-group" id="passage-tool">
      <RiseIn className="workflow-card-head">
        <h2>{t("input.title")}</h2>
        <p className="notice">{t("input.notice")}</p>
      </RiseIn>

      <RiseIn delay={0.17}>
        <FileUploadZone
          uiLocale={flow.uiLocale}
          disabled={flow.detecting}
          onTextReady={(text, source) => void flow.ingestDocumentText(text, source)}
          onError={(message) => flow.setError(message || null)}
          onConnectionLost={() => flow.setConnectionLost(true)}
        />
      </RiseIn>

      <RiseIn delay={0.34}>
        <p className="upload-or-divider">
          <span>{t("input.orPaste")}</span>
        </p>
      </RiseIn>

      <RiseIn delay={0.51}>
        <textarea
          className="voice-textarea workflow-textarea"
          rows={12}
          value={flow.rawText}
          onChange={(e) => flow.setRawText(e.target.value)}
          placeholder={t("input.placeholder")}
          spellCheck={false}
        />
      </RiseIn>

      <RiseIn delay={0.68}>
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
                  title={t("input.demoOnlyTitle")}
                >
                  {doc.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </RiseIn>

      <RiseIn delay={0.85} className="tool-actions">
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
      </RiseIn>

      {flow.error && (
        <p className="passage-error" role="alert" style={{ marginTop: 16 }}>
          {flow.error}
        </p>
      )}
    </section>
  );
}
