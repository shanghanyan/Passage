import type { ReactNode } from "react";

export function renderTokenHighlights(text: string): ReactNode[] {
  const tokenPattern = /(⟦PII:[A-Z_]+:\d+⟧)/g;
  return text.split(tokenPattern).map((part, i) =>
    part.startsWith("⟦PII:") ? (
      <mark key={i} className="token-highlight" title="Redacted identifier">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
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
