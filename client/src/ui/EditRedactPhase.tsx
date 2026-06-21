import { useCallback, useRef, useState } from "react";
import { PII_TYPES } from "./helpers";
import { piiLabel } from "../i18n/strings";
import { useUiLocale } from "../i18n/useUiLocale";
import type { PassageFlow } from "../hooks/usePassageFlow";
import type { DetectedSpan, PiiType } from "../lib/types";

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

  const addSelectionAs = useCallback(
    (type: PiiType) => {
      if (!selection) return;
      const span: DetectedSpan = {
        type,
        start: selection.start,
        end: selection.end,
        value: flow.rawText.slice(selection.start, selection.end),
        source: "manual",
        confidence: 1,
      };
      flow.addManualSpan(span);
      setSelection(null);
    },
    [flow, selection],
  );

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
        <div className="manual-redact-toolbar" role="toolbar" aria-label={t("edit.selectToolbarAria")}>
          <span className="manual-redact-label">
            {t("manual.redactPrefix")} &ldquo;
            {selection.text.length > 48 ? `${selection.text.slice(0, 48)}…` : selection.text}&rdquo;{" "}
            {t("edit.redactAs")}
          </span>
          <div className="manual-redact-types">
            {PII_TYPES.map((type) => (
              <button key={type} type="button" className="btn btn-ghost btn-sm" onClick={() => addSelectionAs(type)}>
                {piiLabel(locale, type)}
              </button>
            ))}
          </div>
        </div>
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
