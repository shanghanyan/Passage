import Anthropic from "@anthropic-ai/sdk";
import { captureExternalError } from "./sentry.js";

export interface RelatedDocumentItem {
  name: string;
  description: string;
  status: string;
}

export interface RelatedDocumentsResult {
  process: string;
  documents: RelatedDocumentItem[];
  traceId: string;
}

const RELATED_DOCS_SYSTEM = `You analyze redacted U.S. immigration documents for informational display only.

The input uses placeholder tokens like ⟦PII:NAME:1⟧ — never guess what they represent.

Return ONLY valid JSON in this exact shape:
{"process":"Name of the immigration process","documents":[{"name":"Document name","description":"One sentence in third person describing what this document type is and why it is commonly part of this process","status":"Common requirement"}]}

Rules:
- Third person only ("Applicants often…", "This notice typically…"). Never "you should" or "you must file".
- Descriptive only — no legal advice, no telling anyone what to do.
- List 5–8 document types commonly associated with this kind of process.
- Note requirements vary in descriptions where appropriate.`;

export async function listRelatedDocuments(redactedText: string): Promise<RelatedDocumentsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: RELATED_DOCS_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Identify the process and commonly associated document types for this redacted document:\n\n${redactedText}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected Claude response shape");

    const raw = block.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw) as { process?: string; documents?: RelatedDocumentItem[] };

    if (!parsed.process || !Array.isArray(parsed.documents)) {
      throw new Error("Claude returned invalid related-documents JSON");
    }

    return {
      process: parsed.process,
      documents: parsed.documents.slice(0, 10).map((doc) => ({
        name: String(doc.name ?? "Document"),
        description: String(doc.description ?? ""),
        status: String(doc.status ?? "Common requirement"),
      })),
      traceId: message.id,
    };
  } catch (err) {
    captureExternalError("related-documents", err);
    throw err;
  }
}
