# Build Plan — Privacy-First Immigration Document Translator

Assembled from all ten planning docs + `AGENTS.md` into one ordered build checklist. Pairs with `testing-plan.md` — same phase numbers in both, so you can build a phase here and immediately flip to the matching section there. This file is code only; testing, pauses, screenshots, and demo recording all live in the other doc.

---

## ⚠️ One architecture conflict to resolve before Phase 0

`AGENTS.md`'s non-negotiable rule says raw PII **never** crosses a network boundary, "not to the backend, not to Claude, not to Sentry, not to Arize, not to Deepgram." But `04-architecture.md`'s API surface defines:

```
POST /api/redact-session
  body: { session_id: string, token_map: Record<string,string> }  ← real values, not tokens
  → Redis hSet + TTL
```

If the browser POSTs `token_map` (real names, A-numbers, etc.) to your own backend so the backend can write it into Redis, that request body contains raw PII over the network — which directly breaks Pass/Fail row #1 in `01-product-one-pager.md` ("zero raw PII ever appears in a network request"), and it's the exact request a judge could inspect in devtools right after watching you demo a *different* request as token-only.

**Fix — apply the same pattern you already use for Deepgram (short-lived, scoped client token, data flows client-to-service directly):**

```
POST /api/redaction-session-token
  body: { session_id: string }
  → { token: string }   // short-lived, scoped ONLY to write session:{sessionId}:tokens
```

The frontend then writes the real `tokenMap` **directly** to a Redis REST endpoint (e.g. Upstash Redis, which has a browser-callable REST API) using that scoped token — never through your own backend. Your backend mints permission; it never sees the payload. This keeps the "backend never receives raw PII" claim literally true, not just true-in-spirit.

If you're using a plain self-hosted Redis instance with no REST interface and don't have time to switch to Upstash: don't silently keep the old endpoint. Either switch providers (Upstash's free tier + REST API is a same-day setup) or explicitly cut the "zero raw PII in any network request" line from your Pass/Fail claim and say so out loud in the demo. Don't let this be the gap a judge finds first.

---

## Non-negotiable rule (from `AGENTS.md`)

> Raw PII never crosses a network boundary. If you're about to send a variable containing a name, A-number, SSN, DOB, passport number, or address to any `fetch`, API client, or logging call — stop and check whether it should be a token instead. This overrides convenience and "just for now" shortcuts.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite, plain CSS / minimal Tailwind | No heavy UI framework |
| PII regex | Hand-written, no NPM pattern libraries | A-number, SSN, DOB |
| PII NER | `@huggingface/transformers` (not the deprecated `@xenova/transformers` path), `Xenova/bert-base-NER`, q8 quantized | In-browser, ONNX Runtime Web / WASM, WebGPU where available |
| Session store | Redis, TTL-based | Persistence (RDB/AOF) off on this keyspace |
| Backend | Node/Express, single thin proxy | Sole holder of `ANTHROPIC_API_KEY`; mints scoped tokens, never relays raw PII |
| LLM | `claude-sonnet-4-6` via Anthropic API | Server-side only |
| Error monitoring | Sentry | Wired into validation-failure path **and** every other external call |
| Observability | Arize Phoenix, self-hosted (one Docker container) | OpenTelemetry, `openinference-instrumentation-anthropic` |
| Voice | Deepgram, `nova-3` | Short-lived client tokens only |

## Coding standards (apply throughout, not just at the end)

- Files under ~400 lines — split if a file is doing too much.
- DRY, but don't over-abstract a one-day build.
- No dead code "for later" — every line serves `02-mvp-scope.md`.
- Comment the *why*, not the *what* — especially at the redaction boundary, so a teammate at 3am knows why a function refuses to do something.
- Token format is exactly `⟦PII:TYPE:n⟧` — `TYPE` ∈ `NAME | A_NUMBER | SSN | DOB | PASSPORT | ADDRESS`, `n` increments per session, not globally. Don't invent a different delimiter mid-build.
- Work from this doc one phase at a time. Don't implement two phases in one pass — smaller diffs are easier to debug under time pressure, and it's what the error log is built around.
- If a task is taking more than ~30 minutes of back-and-forth, stop and flag it rather than keep iterating — a simpler implementation that hits the MVP bar beats a "correct" one that doesn't ship.

## 🔑 Where keys live

`/server/.env` (gitignored before first commit) — never in `/client`:
```
ANTHROPIC_API_KEY=
REDIS_URL=                 # or Upstash REST URL, per the fix above
SENTRY_DSN=
DEEPGRAM_API_KEY=
```
Frontend only ever holds short-lived, scoped tokens minted by the backend (Deepgram, Redis-write) — never a raw key.

---

## Phase 0 — Scaffold (Hour 0–2) · Must have

- [ ] Init repo, React + Vite frontend, Node/Express backend proxy
- [ ] Stand up Redis (or Upstash), confirm connection from backend
- [ ] `ANTHROPIC_API_KEY` into backend env, confirm a hardcoded "hello" Claude call succeeds
- [ ] Stub `/api/translate` returning a hardcoded response; confirm frontend → backend round trip

**Demoable checkpoint:** empty UI shell loads, hardcoded response flows backend → frontend.

## Phase 1 — Detection (Hour 2–7) · Must have

```js
const PII_PATTERNS = {
  A_NUMBER: /\bA-?\d{7,9}\b/gi,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  DOB_NUMERIC: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
  DOB_TEXT: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+(19|20)\d{2}\b/gi,
};
```
- [ ] A-number regex — test 7/8/9-digit variants
- [ ] SSN regex (dashed format only)
- [ ] DOB regex, numeric and text-month formats
- [ ] Passport: label-anchor only — search ~30 chars after "Passport No." / "Document Number", never bare-regex an alphanumeric run
- [ ] Load `Xenova/bert-base-NER` via Transformers.js, confirm zero network calls after first model load
- [ ] Address heuristic: regex street-shape (`\d+\s+[\w\s]+(St|Ave|Blvd|Rd|Dr|Ln|Ct|Way)\b`) OR-combined with NER's `LOC` tag
- [ ] Merge regex + NER spans into one sorted, non-overlapping list

**Demoable checkpoint:** paste a test doc, see detected spans logged to console (not tokenized yet).

## Phase 2 — Redaction + Storage (Hour 7–11) · Must have

```ts
interface DetectedSpan {
  type: 'NAME' | 'A_NUMBER' | 'SSN' | 'DOB' | 'PASSPORT' | 'ADDRESS';
  start: number; end: number;
  value: string;          // raw PII — never leaves the browser except into the Redis write
  confidence?: number;    // NER score, used only for the tap-to-verify tooltip later
}
interface RedactionResult {
  redacted: string;                  // → Claude
  tokenMap: Record<string, string>;  // → Redis, via the scoped-token write, not the backend
}
```
```js
function redact(text, detectedSpans, sessionId) {
  let tokenIndex = 0;
  const tokenMap = {};
  let redacted = text;
  for (const span of detectedSpans) { // sorted by position, replace right-to-left
    const token = `⟦PII:${span.type}:${++tokenIndex}⟧`;
    tokenMap[token] = span.value;
    redacted = redacted.slice(0, span.start) + token + redacted.slice(span.end);
  }
  return { redacted, tokenMap };
}
```
```
HSET session:{sessionId}:tokens
  "⟦PII:NAME:1⟧"     "Maria Gonzalez"
  "⟦PII:A_NUMBER:1⟧" "A12345678"
TTL 900s, persistence (RDB/AOF) disabled on this keyspace
```
- [ ] Implement `redact()`
- [ ] Implement `/api/redaction-session-token` (mints scoped write token — see conflict fix above)
- [ ] Frontend writes `tokenMap` directly to Redis using that token; confirm `expire 900` is set on write
- [ ] Confirm persistence is disabled on the keyspace/instance used
- [ ] Build scrubbed-preview screen: redacted text rendered with tokens as highlighted (amber) spans
- [ ] Add the explicit "send for translation" button — **nothing fetches before this click**
- [ ] Add the expandable "🔒 sent to Claude" panel showing the exact redacted string

**Demoable checkpoint:** scrubbed preview renders with amber tokens; Redis round-trip confirmed (write, read back).

## Phase 3 — Claude Integration (Hour 11–14) · Must have

```
SYSTEM PROMPT:
You are translating and explaining a U.S. immigration document for someone who does
not read English fluently. The text has had personal identifiers replaced with
placeholder tokens of the form ⟦PII:TYPE:n⟧ (e.g. ⟦PII:NAME:1⟧, ⟦PII:A_NUMBER:1⟧).

Rules:
1. Never guess, infer, or fill in what a placeholder token represents.
2. Reproduce every placeholder token exactly, in its original position, in your output.
3. Translate the surrounding text into {{target_language}} and add a short
   plain-language explanation of what each section is asking for or telling the person.
4. Explain what is being asked. Do not advise the person on how to answer it —
   that's legal advice, and out of scope.
5. If a sentence can't be understood without knowing what a token represents,
   describe the field type generally rather than guessing the value.
```
```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1500,
    system=SYSTEM_PROMPT.replace("{{target_language}}", target_language),
    messages=[{"role": "user", "content": redacted_text}],
)
```
- [ ] Implement `/api/translate` — calls Claude with redacted text only, never logs the redacted text body beyond what Sentry/Arize need
- [ ] Build 6–8 synthetic test docs, hand-labeled with true PII spans (never a real document)
- [ ] Run all test docs through, manually verify every token survives in the output
- [ ] Add `target_language` param, test at least 2 target languages end to end

**Demoable checkpoint:** "send for translation" hits real Claude, returns translated+explained text with tokens intact.

## Phase 4 — Validation + Sentry + Minimal Reinsertion (Hour 14–16) · Must have

```js
function validateAndReinsert(claudeOutput, tokenMap, sessionId) {
  const tokensFound = claudeOutput.match(/⟦PII:[A-Z_]+:\d+⟧/g) || [];
  const expected = Object.keys(tokenMap).length;
  if (tokensFound.length !== expected) {
    Sentry.captureMessage("Redaction token mismatch — unsafe output blocked", {
      level: "error",
      extra: { expected, found: tokensFound.length, sessionId }, // never the raw values
    });
    return { ok: false, fallback: "We couldn't safely process this section — try again or review manually." };
  }
  let result = claudeOutput;
  for (const [token, realValue] of Object.entries(tokenMap)) {
    result = result.replaceAll(token, realValue);
  }
  return { ok: true, text: result };
}
```
- [ ] Implement the token-count check above
- [ ] Wire Sentry on mismatch — expected/found counts + session id, never raw PII
- [ ] **Also wrap every other external call** (Redis, Claude API, Deepgram) in try/catch with a Sentry capture on failure — not a silent swallow, not a bare `console.log`. The Sentry track and the honesty of `08-error-log.md` depend on this catching real failures, not only the one planted case.
- [ ] Build the failure-state UI — fallback message only, never a partial render of Claude's output
- [ ] Build the one deliberately-tricky synthetic doc that should fail detection (address format the heuristic misses, or a label-less passport number)
- [ ] Minimal reinsertion: pull real values back from Redis, substitute, render unstyled original/translated panels (full polish happens in Phase 8)

**Demoable checkpoint:** Sentry dashboard shows a captured event from the planted failure doc.

## Phase 5 — Arize (Hour 16–19) · Must have

```bash
pip install arize-phoenix
docker run -p 6006:6006 arizephoenix/phoenix
```
```python
from phoenix.otel import register
from openinference.instrumentation.anthropic import AnthropicInstrumentor
from opentelemetry import trace

tracer_provider = register(project_name="immigration-redaction-demo")
AnthropicInstrumentor().instrument(tracer_provider=tracer_provider)
tracer = trace.get_tracer(__name__)

def score_redaction(detected_spans, true_spans, doc_id):
    recall = len(detected_spans) / len(true_spans)
    with tracer.start_as_current_span("redaction-check") as span:
        span.set_attribute("redaction.recall", recall)
        span.set_attribute("redaction.doc_id", doc_id)        # synthetic id, never a real document
        span.set_attribute("redaction.session_id", session_id) # for cross-ref with Sentry, not for PII
```
- [ ] Instrument the Claude call with `AnthropicInstrumentor`
- [ ] Implement `score_redaction()`
- [ ] Run the full synthetic test set through scoring, log recall per doc

**Demoable checkpoint:** recall metric logged per test doc, visible and trending in the Phoenix UI.

## Phase 6 — Voice (Hour 19–21) · Must have

```js
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
const deepgram = createClient(deepgramAccessToken); // from a backend-minted short-lived token
const connection = deepgram.listen.live({ model: "nova-3", language: "multi", smart_format: true });
connection.on(LiveTranscriptionEvents.Transcript, (data) => {
  const question = data.channel.alternatives[0]?.transcript;
  if (question) sendQuestionToClaude(question);
});
```
```js
const audio = await deepgram.speak.request(
  { text: explanationText }, // explanation only — PII-free by construction, never reinserted values
  { encoding: "mp3" }
);
```
```
POST /api/voice/question
  body: { transcript: string, session_id: string }
  → routes to the same redacted-context Claude call as /api/translate
```
- [ ] Implement Deepgram STT connection
- [ ] Persistent UI nudge while mic is live: "Please type any ID numbers — don't say them out loud"
- [ ] Implement `/api/voice/question`, route transcript into the same redacted-context call — no separate raw-text path
- [ ] Implement Deepgram TTS on the explanation text only

**Demoable checkpoint:** ask a question by mic, see transcript, hear the explanation read back, once end to end.

## Phase 7 — Stretch Sponsors (Hour 21–22) · Nice to have, not Pass/Fail, cut first if behind

- [ ] Register agent on Fetch AI Agentverse/ASI:One
- [ ] Thin Interaction Company delivery wrapper around `/api/translate`, one round-trip message

## Phase 8 — Polish + Submit (Hour 22–24) · Must have

- [ ] Finalize the side-by-side result screen (original left, translated+explained right)
- [ ] Confirm real values render only in this screen's DOM, never logged anywhere else
- [ ] Rehearse the 5-minute demo script (see `testing-plan.md`) start to finish, once
- [ ] Submit Devpost draft before 11am Sunday

---

## Nice-to-have (only after every Must-have phase above is demo-ready)

- **Tap-to-verify tooltip** — tap a token, show detected entity type + confidence
- **Date-only flag** — append to the system prompt, *not* the stakes/urgency version: `6. If a section references a specific date or deadline, note its presence in one neutral sentence (e.g. "This section references a date: [the date]"). Do not characterize urgency, consequence, or what it means for the person's case — that crosses into advice.` Safer and narrower than characterizing what a deadline "means" — keep it this way.
- **Language auto-detection** — replace the target-language input with detection from pasted text, manual override link as fallback
- **Animated token-replacement transition** on the redaction step (visual polish only, no functional change)

## Explicitly do not build

- Open-ended "describe your situation, get rights advice" chat — unbounded, unsafe in a day
- Any response-drafting feature ("here's what to write back") — the unauthorized-practice-of-law line, never cross it
- File upload / OCR — text paste only
- User accounts, auth, or persistence beyond the 15-minute Redis session
- Multi-document history or saved sessions
- BrowserBase-grounded citations, self-hosted Deepgram, Terac fine-tuning — roadmap mentions only

## API surface (final)

```
POST /api/translate
  { redacted_text, target_language, session_id } → { translated_text, trace_id }

POST /api/redaction-session-token   ← replaces the raw-payload /api/redact-session
  { session_id } → { token }   // scoped, short-lived, write-only to this session's Redis key

POST /api/voice/question
  { transcript, session_id } → routes through the same redacted-context Claude call

POST /api/deepgram-token
  {} → { token }   // short-lived, never the raw Deepgram key
```
