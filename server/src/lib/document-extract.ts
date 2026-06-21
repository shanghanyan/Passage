/**
 * Server-side text extraction from PDF/image uploads.
 * Raw file bytes are processed here only — extracted text is returned to the
 * browser and MUST pass through client-side redaction before any Claude call.
 */

const MAX_BYTES = 10 * 1024 * 1024;

export type ExtractMethod = "pdf-text" | "ocr";

export interface ExtractResult {
  text: string;
  method: ExtractMethod;
  charCount: number;
}

function extension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export function assertExtractableSize(byteLength: number): void {
  if (byteLength > MAX_BYTES) {
    throw new Error(`File too large (max ${MAX_BYTES / (1024 * 1024)} MB)`);
  }
  if (byteLength === 0) {
    throw new Error("Empty file");
  }
}

export async function extractTextFromDocument(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ExtractResult> {
  assertExtractableSize(buffer.length);

  const ext = extension(filename);
  const mime = mimeType.toLowerCase();

  if (mime === "application/pdf" || ext === "pdf") {
    return extractPdfText(buffer);
  }

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"].includes(ext)) {
    return extractImageText(buffer);
  }

  throw new Error("Unsupported file type. Upload .pdf or an image (PNG, JPG, WebP), or use .txt client-side.");
}

async function extractPdfText(buffer: Buffer): Promise<ExtractResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
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
      "Could not extract readable text from this PDF — it may be scanned/image-only. Upload a photo of the page or paste text directly.",
    );
  }

  return { text, method: "pdf-text", charCount: text.length };
}

async function extractImageText(buffer: Buffer): Promise<ExtractResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    const text = (data.text ?? "").trim();
    if (text.length < 10) {
      throw new Error("OCR could not read text from this image — try a clearer photo or paste text directly.");
    }
    return { text, method: "ocr", charCount: text.length };
  } finally {
    await worker.terminate();
  }
}
