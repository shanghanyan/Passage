import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { PII_TYPES } from "./helpers";
import { piiLabel } from "../i18n/strings";
import { useUiLocale } from "../i18n/useUiLocale";
import { countOtherExactOccurrences } from "../lib/manual-match";
import type { PassageFlow } from "../hooks/usePassageFlow";
import type { PiiType } from "../lib/types";

export interface ManualSelection {
  start: number;
  end: number;
  text: string;
}

interface ManualRedactToolbarProps {
  flow: PassageFlow;
  selection: ManualSelection;
  onClearSelection: () => void;
  /** When set, wraps the selection preview in a styled mark (Privacy tab). */
  confirmBar?: boolean;
}

export function ManualRedactToolbar({ flow, selection, onClearSelection, confirmBar }: ManualRedactToolbarProps) {
  const { t, tf, locale } = useUiLocale(flow.uiLocale);
  const [pendingType, setPendingType] = useState<PiiType | null>(null);

  const otherCount = useMemo(
    () => countOtherExactOccurrences(flow.rawText, selection.start, selection.end),
    [flow.rawText, selection.start, selection.end],
  );
  const totalCount = otherCount + 1;

  const selectionPreview =
    selection.text.length > 48 ? `${selection.text.slice(0, 48)}…` : selection.text;

  const commitSpan = useCallback(
    (type: PiiType, propagateMatches: boolean) => {
      flow.addManualSpan(
        {
          type,
          start: selection.start,
          end: selection.end,
          value: flow.rawText.slice(selection.start, selection.end),
          source: "manual",
          confidence: 1,
        },
        propagateMatches,
      );
      setPendingType(null);
      onClearSelection();
    },
    [flow, onClearSelection, selection.end, selection.start],
  );

  const onPickType = useCallback(
    (type: PiiType) => {
      if (otherCount > 0) {
        setPendingType(type);
        return;
      }
      commitSpan(type, false);
    },
    [commitSpan, otherCount],
  );

  if (pendingType) {
    return (
      <div className="manual-redact-toolbar manual-redact-toolbar--propagate rise-in" role="toolbar">
        <p className="manual-redact-label">
          {tf("manual.matchPrompt", { count: String(otherCount) })}
        </p>
        <div className="manual-redact-types">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => commitSpan(pendingType, false)}>
            {t("manual.redactThisOnly")}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => commitSpan(pendingType, true)}>
            {tf("manual.redactAllOccurrences", { total: String(totalCount) })}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingType(null)}>
            {t("upload.cancel")}
          </button>
        </div>
      </div>
    );
  }

  const previewNode = confirmBar ? (
    <mark
      key={selection.text}
      className="token-redaction-bar manual-redact-confirm-bar"
      style={{ "--token-index": 0 } as CSSProperties}
    >
      {selectionPreview}
    </mark>
  ) : (
    <>“{selectionPreview}”</>
  );

  return (
    <div className="manual-redact-toolbar rise-in" role="toolbar" aria-label={t("manual.selectToolbarAria")}>
      <span className="manual-redact-label">
        {t("manual.redactPrefix")} {previewNode} {confirmBar ? t("manual.redactSuffix") : t("edit.redactAs")}
      </span>
      <div className="manual-redact-types">
        {PII_TYPES.map((type) => (
          <button key={type} type="button" className="btn btn-ghost btn-sm" onClick={() => onPickType(type)}>
            {piiLabel(locale, type)}
          </button>
        ))}
      </div>
    </div>
  );
}
