/**
 * UI locale follows document translation langCode (same language for site chrome + translation).
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
assert(flowSrc.includes("uiLocaleFromLangCode(langCode)"), "uiLocale should derive from langCode");
assert(!flowSrc.includes('useState<UiLocale>("en")'), "uiLocale must not be a separate fixed state");

const landingSrc = readFileSync(path.join(ROOT, "src/ui/LandingScroll.tsx"), "utf8");
assert(landingSrc.includes("LanguageSelect"), "language picker belongs on landing page");

const inputSrc = readFileSync(path.join(ROOT, "src/ui/InputPhase.tsx"), "utf8");
assert(!inputSrc.includes("lang-select-hero__select"), "language picker should not be on input phase");

const i18nUsage = [
  "PassageApp.tsx",
  "InputPhase.tsx",
  "AnalysisView.tsx",
  "ConnectionLostView.tsx",
  "RelatedDocumentsTab.tsx",
  "LandingIntro.tsx",
  "FileUploadZone.tsx",
  "LandingScroll.tsx",
].map((f) => readFileSync(path.join(ROOT, "src/ui", f), "utf8"));

for (const src of i18nUsage) {
  assert(!src.includes("useUiLocale(flow.langCode)"), "UI chrome must use flow.uiLocale, not langCode directly");
}

const stringsSrc = readFileSync(path.join(ROOT, "src/i18n/strings.ts"), "utf8");
assert(stringsSrc.includes('"landing.langHint"'), "landing language hint string present");
assert(stringsSrc.includes("zh,"), "Chinese UI strings present");

console.log("✓ verify-ui-locale-default: UI locale follows langCode; picker on landing page");
