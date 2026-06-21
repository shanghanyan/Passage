/**
 * Step 1 guard: UI chrome locale must default to English and stay separate from translation langCode.
 * Run: node client/scripts/verify-ui-locale-default.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const flowSrc = readFileSync(path.join(ROOT, "src/hooks/usePassageFlow.ts"), "utf8");
assert(flowSrc.includes('useState("en")'), 'langCode should default to "en"');
assert(flowSrc.includes('useState<UiLocale>("en")'), 'uiLocale should default to "en"');
assert(!flowSrc.includes('useState("es")'), 'langCode must not default to "es"');

const i18nUsage = [
  "PassageApp.tsx",
  "InputPhase.tsx",
  "AnalysisView.tsx",
  "ConnectionLostView.tsx",
  "RelatedDocumentsTab.tsx",
  "LandingIntro.tsx",
  "FileUploadZone.tsx",
].map((f) => readFileSync(path.join(ROOT, "src/ui", f), "utf8"));

for (const src of i18nUsage) {
  assert(!src.includes("useUiLocale(flow.langCode)"), "UI chrome must use flow.uiLocale, not langCode");
}

const enStrings = readFileSync(path.join(ROOT, "src/i18n/strings.ts"), "utf8");
assert(
  enStrings.includes('"landing.title": "Understand official letters without giving up your privacy"'),
  "English landing title present",
);

console.log("✓ verify-ui-locale-default: English UI chrome default, separate from langCode");
