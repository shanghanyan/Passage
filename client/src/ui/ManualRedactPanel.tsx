import { useCallback, useRef, useState } from "react";
import { PII_TYPES, piiLabel } from "./helpers";
import type { PassageFlow } from "../hooks/usePassageFlow";
import type { DetectedSpan, PiiType } from "../lib/types";

/** Inline manual PII marking on source text — merges with auto-detection on re-analyze. */
export function ManualRedactPanel({ flow }: { flow: PassageFlow }) {
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
    <div className="manual-redact-panel">
      <p className="level-label">Mark additional PII in source text</p>
      <p className="notice" style={{ marginBottom: 10 }}>
        Highlight any text the auto-detector missed, choose a type, then re-analyze. Manual marks merge with
        automatic detection.
      </p>
      <textarea
        ref={textareaRef}
        className="voice-textarea workflow-textarea manual-redact-source"
        rows={6}
        value={flow.rawText}
        readOnly
        onSelect={readSelection}
        onMouseUp={readSelection}
        onKeyUp={readSelection}
        spellCheck={false}
        aria-label="Source text for manual PII selection"
      />

      {selection && (
        <div className="manual-redact-toolbar" role="toolbar" aria-label="Mark selection as PII">
          <span className="manual-redact-label">
            Redact &ldquo;{selection.text.length > 48 ? `${selection.text.slice(0, 48)}…` : selection.text}&rdquo; as:
          </span>
          <div className="manual-redact-types">
            {PII_TYPES.map((type) => (
              <button key={type} type="button" className="btn btn-ghost btn-sm" onClick={() => addSelectionAs(type)}>
                {piiLabel(type)}
              </button>
            ))}
          </div>
        </div>
      )}

      {flow.manualSpans.length > 0 && (
        <div className="manual-span-list">
          <span className="level-label">Manual marks ({flow.manualSpans.length})</span>
          <ul>
            {flow.manualSpans.map((span, i) => (
              <li key={`${span.start}-${span.end}-${span.type}-${i}`}>
                <span className="manual-span-type">{piiLabel(span.type)}</span>
                <span className="manual-span-value">
                  {span.value.length > 60 ? `${span.value.slice(0, 60)}…` : span.value}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => flow.removeManualSpan(i)}>
                  Remove
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
              <span className="spinner" /> Re-analyzing…
            </>
          ) : (
            <>
              <i className="ti ti-wand" /> Re-analyze with manual marks
            </>
          )}
        </button>
      </div>
    </div>
  );
}
