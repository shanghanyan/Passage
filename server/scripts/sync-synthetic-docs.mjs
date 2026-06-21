/**
 * Generate server/src/data/synthetic-docs.json from client TS source (single source of truth).
 * Run after editing client/src/data/synthetic-docs.ts:
 *   npm run sync:synthetic-docs --prefix server
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SYNTHETIC_DOCS } from "../../client/src/data/synthetic-docs.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/data/synthetic-docs.json");

writeFileSync(outPath, `${JSON.stringify(SYNTHETIC_DOCS, null, 2)}\n`, "utf8");
console.log(`Wrote ${SYNTHETIC_DOCS.length} docs → ${outPath}`);
