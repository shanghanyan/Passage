import { useCallback, useRef, useState } from "react";
import { useUiLocale } from "../i18n/useUiLocale";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { ManualRedactToolbar } from "./ManualRedactToolbar";
import { piiLabel } from "../i18n/strings";

export function EditRedactPhase({ flow }: { flow: PassageFlow }) {
  const { t, locale } = useUiLocale(flow.uiLocale);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);

  const readSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      setSelection(null);
      return;
    }
    const text = flow.rawText.slice(start, end).trim();
    if (!text) {
      setSelection(null);
      return;
    }
    setSelection({ start, end, text: flow.rawText.slice(start, end) });
  }, [flow.rawText]);

  return (
    <section className="workflow-card">
      <div className="workflow-card-head">
        <h2>{t("edit.title")}</h2>
        <p className="notice">{t("edit.notice")}</p>
      </div>

      <label className="level-label" htmlFor="edit-redact-text">
        {t("edit.originalLabel")}
      </label>
      <textarea
        id="edit-redact-text"
        ref={textareaRef}
        className="voice-textarea workflow-textarea edit-redact-textarea"
        rows={12}
        value={flow.rawText}
        placeholder={t("edit.placeholder")}
        onChange={(e) => flow.setRawText(e.target.value)}
        onSelect={readSelection}
        onMouseUp={readSelection}
        onKeyUp={readSelection}
        spellCheck={false}
      />

      {selection && (
        <ManualRedactToolbar
          flow={flow}
          selection={selection}
          onClearSelection={() => setSelection(null)}
        />
      )}

      {flow.manualSpans.length > 0 && (
        <div className="manual-span-list">
          <span className="level-label">
            {t("edit.manualRedactions")} ({flow.manualSpans.length})
          </span>
          <ul>
            {flow.manualSpans.map((span, i) => (
              <li key={`${span.start}-${span.end}-${span.type}-${i}`}>
                <span className="manual-span-type">{piiLabel(locale, span.type)}</span>
                <span className="manual-span-value">
                  {span.value.length > 60 ? `${span.value.slice(0, 60)}…` : span.value}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => flow.removeManualSpan(i)}>
                  {t("manual.remove")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tool-actions" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={flow.startOver}>
          <i className="ti ti-arrow-left" /> {t("edit.cancel")}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={flow.detecting || !flow.rawText.trim()}
          onClick={() => void flow.runDetection()}
        >
          {flow.detecting ? (
            <>
              <span className="spinner" /> {t("edit.reanalyzing")}
            </>
          ) : (
            <>
              <i className="ti ti-wand" /> {t("edit.reanalyze")}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
