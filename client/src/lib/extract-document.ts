import { apiFetch } from "./api-fetch";

export type ExtractMethod = "pdf-text" | "ocr";

export interface ExtractDocumentResponse {
  ok: boolean;
  text?: string;
  method?: ExtractMethod;
  char_count?: number;
  error?: string;
}

/** Legacy server path — used only when client-side extraction fails. */
export const SERVER_EXTRACT_FALLBACK_NOTICE =
  "Client-side extraction failed — this file was processed on the server as a fallback. For strongest privacy, paste text directly or use a .txt file.";

export function isServerExtractType(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return false;
  if (name.endsWith(".pdf")) return true;
  return file.type.startsWith("image/");
}

const MAX_BYTES = 10 * 1024 * 1024;

function assertExtractableSize(byteLength: number): void {
  if (byteLength > MAX_BYTES) {
    throw new Error(`File too large (max ${MAX_BYTES / (1024 * 1024)} MB)`);
  }
  if (byteLength === 0) {
    throw new Error("Empty file");
  }
}

async function extractPdfTextClient(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).href;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }

  const text = parts.join("\n").replace(/\s+/g, " ").trim();
  if (text.length < 20) {
    throw new Error(
      "Could not extract readable text from this PDF — it may be scanned/image-only. Try a clearer photo or paste text directly.",
    );
  }
  return text;
}

async function extractImageTextClient(buffer: ArrayBuffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(new Blob([buffer]));
    const text = (data.text ?? "").trim();
    if (text.length < 10) {
      throw new Error("OCR could not read text from this image — try a clearer photo or paste text directly.");
    }
    return text;
  } finally {
    await worker.terminate();
  }
}

/** Extract PDF/image text entirely in the browser — raw bytes never leave the device. */
export async function extractDocumentClientSide(file: File): Promise<{ text: string; method: ExtractMethod }> {
  assertExtractableSize(file.size);
  const buffer = await file.arrayBuffer();
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const text = await extractPdfTextClient(buffer);
    return { text, method: "pdf-text" };
  }

  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/.test(name)) {
    const text = await extractImageTextClient(buffer);
    return { text, method: "ocr" };
  }

  throw new Error("Unsupported file type. Upload .pdf or an image, or use .txt.");
}

/** Server fallback when in-browser pdf.js / Tesseract fails (e.g. worker load error). */
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

export async function extractDocument(file: File): Promise<{ text: string; method: ExtractMethod; usedServerFallback: boolean }> {
  try {
    const result = await extractDocumentClientSide(file);
    return { ...result, usedServerFallback: false };
  } catch (clientErr) {
    console.warn("Client-side extract failed, trying server fallback:", clientErr);
    const text = await extractDocumentOnServer(file);
    const method: ExtractMethod = file.name.toLowerCase().endsWith(".pdf") ? "pdf-text" : "ocr";
    return { text, method, usedServerFallback: true };
  }
}

export async function readTextFileClientSide(file: File): Promise<string> {
  const text = await file.text();
  if (!text.trim()) throw new Error("Text file is empty");
  return text;
}
