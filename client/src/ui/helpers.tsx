import type { ReactNode } from "react";
import type { PiiType, TokenMeta } from "../lib/types";

export const PII_TYPES: PiiType[] = ["NAME", "A_NUMBER", "SSN", "DOB", "PASSPORT", "ADDRESS"];

export const TYPE_COLORS: Record<string, string> = {
  A_NUMBER: "#7A4A2E",
  SSN: "#6B5344",
  DOB: "#5C4A6E",
  PASSPORT: "#4A5568",
  NAME: "#3D5C4A",
  ADDRESS: "#6E5A3D",
};

export function tokenTypeFromString(token: string): string {
  const match = token.match(/^⟦PII:([A-Z_]+):\d+⟧$/);
  return match?.[1] ?? "UNKNOWN";
}

export function tooltipForToken(token: string, tokenMeta: Record<string, TokenMeta>): string {
  const meta = tokenMeta[token];
  const type = meta?.type ?? tokenTypeFromString(token);
  const source = meta?.source ?? "regex";
  const conf =
    meta?.confidence != null
      ? `${Math.round(meta.confidence * 100)}% confidence`
      : "regex-detected (no score)";
  return `${type} · ${conf} · ${source}`;
}

export function renderTokenHighlights(
  text: string,
  tokenMeta: Record<string, TokenMeta> = {},
): ReactNode[] {
  const tokenPattern = /(⟦PII:[A-Z_]+:\d+⟧)/g;
  let tokenIndex = 0;
  return text.split(tokenPattern).map((part, i) => {
    if (!part.startsWith("⟦PII:")) {
      return <span key={i}>{part}</span>;
    }
    const type = tokenTypeFromString(part);
    const idx = tokenIndex++;
    return (
      <mark
        key={i}
        className="token-redaction-bar"
        style={{ "--token-index": idx } as React.CSSProperties}
        title={tooltipForToken(part, tokenMeta)}
        aria-label={`Redacted ${type}`}
      >
        {part}
      </mark>
    );
  });
}

export function piiBadgeClass(type: string): string {
  switch (type) {
    case "NAME":
      return "b-name";
    case "A_NUMBER":
    case "SSN":
    case "PASSPORT":
      return "b-id";
    case "ADDRESS":
      return "b-addr";
    case "DOB":
      return "b-date";
    default:
      return "b-id";
  }
}

export function piiLabel(type: string): string {
  const labels: Record<string, string> = {
    NAME: "Name",
    A_NUMBER: "A-#",
    SSN: "SSN",
    PASSPORT: "Passport",
    ADDRESS: "Addr",
    DOB: "DOB",
  };
  return labels[type] ?? type;
}
