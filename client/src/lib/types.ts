export type PiiType = "NAME" | "A_NUMBER" | "SSN" | "DOB" | "PASSPORT" | "ADDRESS";

export interface DetectedSpan {
  type: PiiType;
  start: number;
  end: number;
  value: string;
  confidence?: number;
}

export interface RedactionResult {
  redacted: string;
  tokenMap: Record<string, string>;
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

export interface ValidationSuccess {
  ok: true;
  text: string;
}

export interface ValidationFailure {
  ok: false;
  fallback: string;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;
