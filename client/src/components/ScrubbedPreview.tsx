import type { DetectedSpan } from "../lib/types";

interface ScrubbedPreviewProps {
  redacted: string;
  spans: DetectedSpan[];
  onDetectLog?: () => void;
}

function renderRedactedWithTokens(redacted: string) {
  const tokenPattern = /(⟦PII:[A-Z_]+:\d+⟧)/g;
  const parts = redacted.split(tokenPattern);

  return parts.map((part, i) =>
    part.startsWith("⟦PII:") ? (
      <mark key={i} className="token-highlight" title="Redacted identifier">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ScrubbedPreview({ redacted, spans }: ScrubbedPreviewProps) {
  return (
    <section className="panel scrubbed-preview">
      <h2>Scrubbed preview</h2>
      <p className="hint">Detected {spans.length} span(s). Amber tokens replace personal identifiers.</p>
      <div className="redacted-text">{renderRedactedWithTokens(redacted)}</div>
    </section>
  );
}

interface SentToClaudePanelProps {
  redacted: string;
  open: boolean;
  onToggle: () => void;
}

export function SentToClaudePanel({ redacted, open, onToggle }: SentToClaudePanelProps) {
  return (
    <section className="panel sent-panel">
      <button type="button" className="panel-toggle" onClick={onToggle} aria-expanded={open}>
        🔒 sent to Claude {open ? "▾" : "▸"}
      </button>
      {open && <pre className="redacted-payload">{redacted}</pre>}
    </section>
  );
}
