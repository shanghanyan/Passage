import type { ReactNode } from "react";
import type { TokenMeta } from "../lib/types";

export const TYPE_COLORS: Record<string, string> = {
  A_NUMBER: "#dc2626",
  SSN: "#ea580c",
  DOB: "#9333ea",
  PASSPORT: "#2563eb",
  NAME: "#16a34a",
  ADDRESS: "#d97706",
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
  return text.split(tokenPattern).map((part, i) => {
    if (!part.startsWith("⟦PII:")) {
      return <span key={i}>{part}</span>;
    }
    const type = tokenTypeFromString(part);
    const color = TYPE_COLORS[type] ?? "#999";
    return (
      <mark
        key={i}
        className="token-highlight"
        style={{
          backgroundColor: `${color}33`,
          borderColor: color,
          color: "inherit",
        }}
        title={tooltipForToken(part, tokenMeta)}
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
