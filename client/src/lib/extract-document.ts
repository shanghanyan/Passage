import { apiFetch } from "./api-fetch";

export type ExtractMethod = "pdf-text" | "ocr";

export interface ExtractDocumentResponse {
  ok: boolean;
  text?: string;
  method?: ExtractMethod;
  char_count?: number;
  error?: string;
}

const SERVER_EXTRACT_NOTICE =
  "PDF and image uploads are processed on our server for text extraction and are not yet covered by the same client-side redaction guarantee as pasted text or .txt files. For full privacy protection, paste text directly or use a .txt file.";

export { SERVER_EXTRACT_NOTICE };

export function isServerExtractType(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return false;
  if (name.endsWith(".pdf")) return true;
  return file.type.startsWith("image/");
}

export async function extractDocumentOnServer(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await apiFetch("/api/extract-document", { method: "POST", body: form });
  const data = (await res.json()) as ExtractDocumentResponse;
  if (!res.ok || !data.ok || !data.text) {
    throw new Error(data.error ?? `Document extraction failed (${res.status})`);
  }
  return data.text;
}

export async function readTextFileClientSide(file: File): Promise<string> {
  const text = await file.text();
  if (!text.trim()) throw new Error("Text file is empty");
  return text;
}
