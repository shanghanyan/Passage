/**
 * TTS must use tokenized explanation only, never reinserted text.
 * Run: npm run verify:explanation-tts --prefix client
 */
import { extractExplanationText, extractTranslationText, ttsVoiceForLanguage } from "../src/lib/explanation-text.ts";

const TOKENIZED = `## Traducción
El documento menciona ⟦PII:NAME:1⟧ con fecha ⟦PII:DOB:1⟧.

---

## Explicación
Esta sección indica una cita. El token ⟦PII:DOB:1⟧ es una fecha de nacimiento en el formulario.`;

const REINSERTED = `## Traducción
El documento menciona Maria Gonzalez con fecha 03/14/1991.

---

## Explicación
Esta sección indica una cita. El token 03/14/1991 es una fecha de nacimiento en el formulario.`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const explanation = extractExplanationText(TOKENIZED);
assert(explanation.includes("⟦PII:DOB:1⟧"), "explanation keeps tokens");
assert(!explanation.includes("Maria Gonzalez"), "explanation excludes raw name");
assert(!explanation.includes("03/14/1991"), "explanation excludes raw DOB digits");
assert(!explanation.includes("## Traducción"), "explanation section only");

const translation = extractTranslationText(TOKENIZED);
assert(translation.includes("⟦PII:NAME:1⟧"), "translation keeps tokens");
assert(!translation.includes("Esta sección"), "translation pane excludes explanation");
assert(!translation.includes("## Traducción"), "translation pane excludes headers");
assert(!translation.includes("## Explicación"), "translation pane excludes explanation header");

const fromReinserted = extractExplanationText(REINSERTED);
assert(fromReinserted.includes("03/14/1991"), "reinserted path would leak raw DOB if mis-wired");

assert(ttsVoiceForLanguage("Spanish") === "aura-2-celeste-es", "Spanish voice");
assert(ttsVoiceForLanguage("French") === "aura-2-agathe-fr", "French voice");
assert(ttsVoiceForLanguage("English") === "aura-2-asteria-en", "English voice");

console.log("PASS — translation/explanation split; TTS uses explanation only; voices mapped.");
console.log("Sample translation (first 80 chars):", translation.slice(0, 80));
console.log("Sample TTS payload (first 120 chars):", explanation.slice(0, 120));
