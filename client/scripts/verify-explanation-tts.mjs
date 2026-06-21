/**
 * TTS must use tokenized explanation only, never reinserted text.
 * Run: npm run verify:explanation-tts --prefix client
 */
import { extractExplanationText, extractTranslationText, ttsVoiceForLanguage } from "../src/lib/explanation-text.ts";
import { replaceTokensForSpeech } from "../src/lib/token-speech.ts";

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

const spoken = replaceTokensForSpeech(explanation, "es");
assert(spoken.includes("fecha de nacimiento"), "TTS speakable stand-in uses answer language");
assert(!spoken.includes("⟦"), "TTS payload strips bracket tokens");
assert(!spoken.includes("03/14/1991"), "TTS speakable path excludes raw DOB");
assert(!spoken.includes("P I I"), "TTS stand-ins avoid English letter spelling");

console.log("PASS — translation/explanation split; TTS uses speakable token stand-ins; voices mapped.");
console.log("Sample translation (first 80 chars):", translation.slice(0, 80));
console.log("Sample TTS payload (first 120 chars):", spoken.slice(0, 120));
