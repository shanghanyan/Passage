import { useEffect, useRef, useState } from "react";
import { AUDIT_CASES, evaluateAuditCase } from "../lib/audit-cases";
import { detectPiiWithStatus, detectRegexOnly } from "../lib/detect";
import { mergeSpansWithDropped } from "../lib/merge-spans";
import { detectNerSpans } from "../lib/ner";
import { validateSpans } from "../lib/validate-spans";
import type { DetectedSpan } from "../lib/types";
import "./DetectionTest.css";

const SAMPLE_TEXT = `Notice to Appear

Name: Maria Gonzalez
A-Number: A123456789
Date of Birth: 03/14/1991
SSN: 123-45-6789
Passport No.: XK829104
Address: 742 Evergreen Terrace, Springfield

Also born March 14, 1991 per prior filing.`;

const TYPE_COLORS: Record<string, string> = {
  A_NUMBER: "#dc2626",
  SSN: "#ea580c",
  DOB: "#9333ea",
  PASSPORT: "#2563eb",
  NAME: "#16a34a",
  ADDRESS: "#d97706",
};

type HighlightPart = { kind: "text"; value: string } | { kind: "span"; span: DetectedSpan };

function highlightSpans(text: string, spans: DetectedSpan[]): HighlightPart[] | string {
  const valid = spans
    .filter((s) => s.start >= 0 && s.end <= text.length && s.start < s.end)
    .sort((a, b) => a.start - b.start);

  if (!valid.length) return text;

  const parts: HighlightPart[] = [];
  let cursor = 0;

  for (const span of valid) {
    if (span.start > cursor) parts.push({ kind: "text", value: text.slice(cursor, span.start) });
    parts.push({ kind: "span", span });
    cursor = Math.max(cursor, span.end);
  }

  if (cursor < text.length) parts.push({ kind: "text", value: text.slice(cursor) });
  return parts;
}

function installFetchMonitor() {
  const w = window as Window & {
    __passageFetchMonitor?: { log: { url: string; at: number }[]; countSince: (n: number) => number };
    __passageDetect?: { detectRegexOnly: typeof detectRegexOnly; detectPiiWithStatus: typeof detectPiiWithStatus };
  };
  if (w.__passageFetchMonitor) return w.__passageFetchMonitor;
  const log: { url: string; at: number }[] = [];
  const orig = window.fetch.bind(window);
  window.fetch = (...args) => {
    log.push({ url: String(args[0]), at: Date.now() });
    return orig(...args);
  };
  w.__passageFetchMonitor = { log, countSince: (n) => log.length - n };
  return w.__passageFetchMonitor;
}

export function DetectionTest() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [spans, setSpans] = useState<DetectedSpan[]>([]);
  const [droppedSpans, setDroppedSpans] = useState<DetectedSpan[]>([]);
  const [regexSpans, setRegexSpans] = useState<DetectedSpan[]>([]);
  const [nerSpans, setNerSpans] = useState<DetectedSpan[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState("not loaded");
  const [error, setError] = useState<string | null>(null);
  const [auditResults, setAuditResults] = useState<{
    rows: Array<Record<string, unknown>>;
    totalNew: number;
  } | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [networkNote, setNetworkNote] = useState("");
  const fetchBaseline = useRef(0);

  useEffect(() => {
    const monitor = installFetchMonitor();
    fetchBaseline.current = monitor.log.length;
    const w = window as Window & {
      __passageDetect?: { detectRegexOnly: typeof detectRegexOnly; detectPiiWithStatus: typeof detectPiiWithStatus };
    };
    w.__passageDetect = { detectRegexOnly, detectPiiWithStatus };
  }, []);

  async function handleDetect() {
    setLoading(true);
    setError(null);
    const monitor = installFetchMonitor();
    const before = monitor.log.length;
    try {
      const regexOnly = detectRegexOnly(text);
      setRegexSpans(regexOnly);

      let ner: DetectedSpan[] = [];
      let nerError: string | undefined;
      try {
        ner = await detectNerSpans(text);
        setNerSpans(ner);
      } catch (err) {
        nerError = err instanceof Error ? err.message : String(err);
        setNerSpans([]);
      }

      const { kept, dropped } = mergeSpansWithDropped(validateSpans([...regexOnly, ...ner], text));
      setSpans(kept);
      setDroppedSpans(dropped);

      if (nerError) setModelStatus(`NER unavailable (${nerError}) — regex results shown`);
      else if (ner.length) setModelStatus("NER + regex detection complete");
      else setModelStatus("Regex detection complete (no NER spans)");

      const newFetches = monitor.countSince(before);
      setNetworkNote(
        newFetches === 0
          ? "fetch() calls this detect: 0 (good — text stayed local)"
          : `fetch() calls this detect: ${newFetches} (model download on first run is expected)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSpans([]);
    } finally {
      setLoading(false);
    }
  }

  async function runAuditSuite() {
    setAuditRunning(true);
    setAuditResults(null);
    const monitor = installFetchMonitor();
    const beforeAll = monitor.log.length;
    const rows: Array<Record<string, unknown>> = [];

    try {
      for (const testCase of AUDIT_CASES) {
        const beforeCase = monitor.log.length;
        const { spans: merged } = await detectPiiWithStatus(testCase.text);
        const evalResult = evaluateAuditCase(merged, testCase);
        rows.push({
          id: testCase.id,
          label: testCase.label,
          pass: evalResult.pass,
          failures: evalResult.failures,
          merged: merged.map((s) => `${s.type}="${s.value}"`),
          newFetches: monitor.countSince(beforeCase),
        });
      }

      setAuditResults({ rows, totalNew: monitor.countSince(beforeAll) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAuditRunning(false);
    }
  }

  const highlighted = highlightSpans(text, spans);

  return (
    <section className="detection-test">
      <h2>PII detection test harness</h2>
      <p className="hint">
        Dev-only (`?detection-test`). Detection runs in-browser — Network tab should stay quiet except first NER model
        download.
      </p>

      <textarea
        className="detect-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        spellCheck={false}
      />

      <div className="detect-actions">
        <button type="button" onClick={() => void handleDetect()} disabled={loading || auditRunning || !text.trim()}>
          {loading ? "Detecting…" : "Detect PII"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => void runAuditSuite()} disabled={loading || auditRunning}>
          {auditRunning ? "Running audit…" : "Run audit suite"}
        </button>
        <span className="model-status">{modelStatus}</span>
      </div>

      {networkNote && <p className="network-note">{networkNote}</p>}
      {error && <pre className="detect-error">{error}</pre>}

      {auditResults && (
        <div className="audit-results">
          <h3>Audit suite results</h3>
          <p className="hint">Total new fetch() during suite: {auditResults.totalNew}</p>
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Pass</th>
                <th>Merged</th>
                <th>fetch()</th>
              </tr>
            </thead>
            <tbody>
              {auditResults.rows.map((row) => (
                <tr key={String(row.id)} className={row.pass ? "pass" : "fail"}>
                  <td>{String(row.label)}</td>
                  <td>{row.pass ? "✓" : (row.failures as string[]).join("; ")}</td>
                  <td>{(row.merged as string[]).join(", ") || "—"}</td>
                  <td>{String(row.newFetches)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {spans.length > 0 && (
        <>
          <div className="legend">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <span key={type} className="legend-item">
                <span className="swatch" style={{ background: color }} />
                {type}
              </span>
            ))}
          </div>

          <div className="highlight-output">
            {Array.isArray(highlighted)
              ? highlighted.map((part, i) =>
                  part.kind === "text" ? (
                    <span key={i}>{part.value}</span>
                  ) : (
                    <mark
                      key={i}
                      className="pii-mark"
                      style={{
                        backgroundColor: `${TYPE_COLORS[part.span.type]}33`,
                        borderColor: TYPE_COLORS[part.span.type],
                      }}
                      title={`${part.span.type} · ${part.span.source ?? "regex"}`}
                    >
                      {text.slice(part.span.start, part.span.end)}
                    </mark>
                  ),
                )
              : highlighted}
          </div>

          {droppedSpans.length > 0 && (
            <details open className="dropped-panel">
              <summary>Dropped by merge ({droppedSpans.length})</summary>
              <pre className="span-log dropped">{JSON.stringify(droppedSpans, null, 2)}</pre>
            </details>
          )}

          <details>
            <summary>Regex only ({regexSpans.length})</summary>
            <pre className="span-log">{JSON.stringify(regexSpans, null, 2)}</pre>
          </details>

          <details>
            <summary>NER only ({nerSpans.length})</summary>
            <pre className="span-log">{JSON.stringify(nerSpans, null, 2)}</pre>
          </details>
        </>
      )}
    </section>
  );
}
