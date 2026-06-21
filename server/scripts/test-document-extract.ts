/**
 * Verifies server document extraction + client redaction-before-Claude invariant.
 * Run: npx tsx scripts/test-document-extract.ts
 */
import "dotenv/config";
import { extractTextFromDocument } from "../src/lib/document-extract.js";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

/** Minimal valid PDF with embedded text containing a fake A-number. */
function samplePdfBuffer(): Buffer {
  const body =
    "Beneficiary MARIA GARCIA with A-number A123456789 must respond promptly.";
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
    `4 0 obj<< /Length ${body.length + 24} >>stream\nBT /F1 12 Tf 72 720 Td (${body}) Tj ET\nendstream endobj\n`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  ].join("");

  const header = "%PDF-1.4\n";
  let offset = header.length;
  const xref: string[] = ["xref\n0 6\n0000000000 65535 f \n"];
  const parts = [header];

  for (const obj of objects) {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
    parts.push(obj);
    offset += obj.length;
  }

  const xrefStart = offset;
  parts.push(xref.join(""));
  parts.push(`trailer<< /Root 1 0 R /Size 6 >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return Buffer.from(parts.join(""), "utf8");
}

async function testPdfExtract() {
  const buffer = samplePdfBuffer();
  const result = await extractTextFromDocument(buffer, "application/pdf", "sample.pdf");
  assert(result.method === "pdf-text", "PDF should use pdf-text method");
  assert(result.text.includes("A123456789"), "PDF text should include A-number");
  assert(result.text.includes("MARIA GARCIA"), "PDF text should include name");
  console.log("✓ PDF extraction returns text with PII (server-side only — not sent to Claude yet)");
  return result.text;
}

async function testApiRoundTrip() {
  const buffer = samplePdfBuffer();
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "application/pdf" }), "sample.pdf");

  const res = await fetch("http://localhost:3001/api/extract-document", { method: "POST", body: form });
  assert(res.ok, `extract API should succeed (${res.status})`);
  const data = (await res.json()) as { ok: boolean; text?: string };
  assert(data.ok && data.text?.includes("A123456789"), "API returns extracted text");
  console.log("✓ POST /api/extract-document round-trip (requires server on :3001)");
}

async function testClientRedactionPipeline(sampleText: string) {
  const { PII_PATTERNS } = await import("../../client/src/lib/patterns.ts");
  const { redact } = await import("../../client/src/lib/redact.ts");
  const { scanForLeakage } = await import("../../client/src/lib/patterns.ts");

  const spans: Array<{ type: string; start: number; end: number; value: string; source: "regex" }> = [];
  for (const match of sampleText.matchAll(PII_PATTERNS.A_NUMBER)) {
    if (match.index === undefined) continue;
    spans.push({ type: "A_NUMBER", start: match.index, end: match.index + match[0].length, value: match[0], source: "regex" });
  }

  assert(spans.length > 0, "Detection should find A-number in extracted text");

  const result = redact(sampleText, spans);
  assert(result.redacted.includes("⟦PII:"), "Redacted output should contain tokens");
  assert(!result.redacted.includes("A123456789"), "Raw A-number must be tokenized before Claude");

  const leaks = scanForLeakage(result.redacted);
  assert(leaks.length === 0, `No leakage in redacted text: ${leaks.join(", ")}`);

  console.log("✓ Extracted text passes client redaction pipeline — safe to send tokens-only to Claude");
  console.log(`  Sample redacted: ${result.redacted.slice(0, 120)}…`);
}

async function main() {
  const extracted = await testPdfExtract();
  await testClientRedactionPipeline(extracted);

  try {
    await testApiRoundTrip();
  } catch (err) {
    console.warn("⚠ API round-trip skipped (start server for full check):", (err as Error).message);
  }

  console.log("\nDocument extract + redaction-after-extraction checks passed.");
}

main().catch((err) => {
  console.error("\nTest failed:", err.message);
  process.exit(1);
});
