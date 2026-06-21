export type PiiType = "NAME" | "A_NUMBER" | "SSN" | "DOB" | "PASSPORT" | "ADDRESS";

export interface DetectedSpan {
  type: PiiType;
  start: number;
  end: number;
  value: string;
  confidence?: number;
  source?: "regex" | "ner" | "manual";
}

export interface TokenMeta {
  type: PiiType;
  confidence?: number;
  source?: "regex" | "ner" | "manual";
}

export interface RedactionResult {
  redacted: string;
  tokenMap: Record<string, string>;
  tokenMeta: Record<string, TokenMeta>;
}

export interface TranslateSuccess {
  ok: true;
  translated_text: string;
  trace_id: string;
}

export interface TranslateFailure {
  ok: false;
  fallback: string;
}

export type TranslateResponse = TranslateSuccess | TranslateFailure;

export interface TokenCheckResult {
  ok: boolean;
  reason?: string;
  unexpected?: string[];
  missing?: string[];
}

export interface LeakCheckResult {
  ok: boolean;
  reason?: string;
}

export interface ValidationSuccess {
  ok: true;
  text: string;
}

export interface ValidationFailure {
  ok: false;
  fallback: string;
  tokenCheck: TokenCheckResult;
  leakCheck: LeakCheckResult;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export interface ValidationFailureDetails {
  tokenCheck: TokenCheckResult;
  leakCheck: LeakCheckResult;
  traceId?: string;
}
