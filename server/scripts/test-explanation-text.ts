/** Server-side explanation extraction + TTS voice mapping tests. */
import { extractExplanationText, ttsVoiceForLanguage } from "../src/lib/explanation-text.js";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const tokenized = `## Translation
Reference ⟦PII:NAME:1⟧.

---

## Explanation
This section requests evidence. Token ⟦PII:DOB:1⟧ is a date placeholder.`;

const explanation = extractExplanationText(tokenized);
assert(explanation.includes("⟦PII:DOB:1⟧"), "explanation keeps tokens");
assert(!explanation.includes("## Translation"), "explanation section only");
assert(ttsVoiceForLanguage("Spanish") === "aura-2-celeste-es", "Spanish voice");
assert(ttsVoiceForLanguage("French") === "aura-2-agathe-fr", "French voice");

console.log("✓ explanation-text helpers isolate tokenized explanation for TTS");
