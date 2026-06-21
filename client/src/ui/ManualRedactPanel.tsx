import { useCallback, useRef, useState, type CSSProperties } from "react";
import { piiLabel } from "../i18n/strings";
import { useUiLocale } from "../i18n/useUiLocale";
import { RiseIn } from "./motion";
import type { PassageFlow } from "../hooks/usePassageFlow";
import { ManualRedactToolbar } from "./ManualRedactToolbar";

/** Inline manual PII marking on source text — merges with auto-detection on re-analyze. */
export function ManualRedactPanel({ flow }: { flow: PassageFlow }) {
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
    setSelection({ start, end, text: flow.rawText.slice(start, end) });
  }, [flow.rawText]);

  return (
    <RiseIn className="manual-redact-panel">
      <p className="micro-label">{t("manual.markAdditional")}</p>
      <p className="notice" style={{ marginBottom: 10 }}>
        {t("manual.notice")}
      </p>
      <textarea
        ref={textareaRef}
        className="voice-textarea workflow-textarea manual-redact-source"
        rows={6}
        value={flow.rawText}
        readOnly
        placeholder={t("edit.placeholder")}
        onSelect={readSelection}
        onMouseUp={readSelection}
        onKeyUp={readSelection}
        spellCheck={false}
        aria-label={t("manual.sourceAriaLabel")}
      />

      {selection && (
        <ManualRedactToolbar
          flow={flow}
          selection={selection}
          onClearSelection={() => setSelection(null)}
          confirmBar
        />
      )}

      {flow.manualSpans.length > 0 && (
        <div className="manual-span-list">
          <span className="micro-label">
            {t("manual.manualMarks")} ({flow.manualSpans.length})
          </span>
          <ul>
            {flow.manualSpans.map((span, i) => (
              <li key={`${span.start}-${span.end}-${span.type}-${i}`}>
                <span className="manual-span-type">{piiLabel(locale, span.type)}</span>
                <mark
                  className="token-redaction-bar manual-span-value-bar"
                  style={{ "--token-index": i } as CSSProperties}
                  title={span.value}
                >
                  {span.value.length > 60 ? `${span.value.slice(0, 60)}…` : span.value}
                </mark>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => flow.removeManualSpan(i)}>
                  {t("manual.remove")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="tool-actions" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={flow.detecting || flow.manualSpans.length === 0}
          onClick={() => void flow.runDetection()}
        >
          {flow.detecting ? (
            <>
              <span className="spinner" /> {t("manual.reanalyzing")}
            </>
          ) : (
            <>
              <i className="ti ti-wand" /> {t("manual.reanalyzeWithMarks")}
            </>
          )}
        </button>
      </div>
    </RiseIn>
  );
}
