# Passage

**UC Berkeley AI Hackathon 2026 — World Track**

Paste an immigration letter, get it translated and explained in your language, ask follow-up questions by voice — while names, A-numbers, SSNs, dates of birth, passport numbers, and addresses are stripped **before anything reaches Claude**, then swapped back in only on your own screen at the end.

The differentiator isn't "we use Claude to translate." It's that **redaction is a hard architectural boundary** — with validation that fails closed, error monitoring that catches real failures, and measurable detection accuracy. Privacy you can verify in devtools, not just in a policy.

---

## Quick start

### 1. Prerequisites

- Node 18+
- [Upstash Redis](https://upstash.com/) (REST URL + token — required for browser-direct session storage)
- API keys: Anthropic, Sentry, Deepgram
- Docker (optional, for local Arize Phoenix observability)

### 2. Configure secrets

```bash
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local   # optional — browser Sentry
```

Fill in `server/.env`:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude translation + voice Q&A |
| `UPSTASH_REDIS_REST_URL` | Yes | Ephemeral token-map storage (browser writes directly) |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Scoped credentials for Redis REST |
| `SENTRY_DSN` | Yes | Server error monitoring |
| `DEEPGRAM_API_KEY` | Yes | Voice transcription + TTS |
| `PHOENIX_COLLECTOR_ENDPOINT` | Optional | Default `http://localhost:6006` — see Observability |
| `PHOENIX_PROJECT_NAME` | Optional | Default `immigration-redaction-demo` |
| `PHOENIX_API_KEY` | Optional | Phoenix Cloud only — leave blank for Docker |
| `REDIS_URL` | Fallback | TCP Redis for server startup check if Upstash REST not set |

`VITE_SENTRY_CLIENT_DSN` in `client/.env.local` is a **public** browser DSN — separate from server `SENTRY_DSN`.

> **Note:** `ARIZE_API_KEY` / `ARIZE_SPACE_KEY` are for Arize AX (production ML platform), not this project. Passage uses **Arize Phoenix** via `PHOENIX_*` vars. Leave AX keys blank.

### 3. Start observability (optional but recommended for demo)

```bash
docker compose -f docker-compose.phoenix.yml up -d
# UI at http://localhost:6006
```

### 4. Run the app

```bash
# Terminal 1 — server (verifies Redis + Claude on startup)
cd server && npm install && npm run dev    # http://localhost:3001

# Terminal 2 — client
cd client && npm install && npm run dev    # http://localhost:5173
```

Open **http://localhost:5173**. Vite proxies `/api` → the server.

### 5. Try it

1. Pick a sample doc or paste letter text → **Detect & redact**
2. **Privacy** tab — review amber-highlighted tokens, optionally show the exact Claude payload
3. **Send for translation** — open Network tab: payload contains only `⟦PII:TYPE:n⟧` tokens
4. **Translation** tab — side-by-side original and translated+explained text with real values reinserted locally
5. **Voice** tab — ask *"What does RFE mean?"* after translation completes

---

## What Passage does

**Input:** Paste text from an RFE, biometrics notice, EAD receipt, NTA, or similar immigration correspondence. Text only — no file upload.

**Output:** Plain-language translation + explanation in one of 10 target languages (Spanish, French, Chinese, Vietnamese, Korean, Portuguese, Arabic, Hindi, Tagalog, Ukrainian). Voice follow-up questions answered in the same redacted context, read back via TTS.

**Scope line:** Explains what a section is *asking for*. Does **not** tell anyone what to write in response — that stays out of unauthorized-practice-of-law territory.

---

## Privacy architecture

This is the core of the project. Every layer is designed so a judge (or user) can verify the claim live.

| Layer | What it does |
|---|---|
| **In-browser detection** | Hand-written regex (A-number, SSN, DOB, street addresses, label-anchored passport numbers) + `Xenova/bert-base-NER` running locally via Transformers.js — zero network calls after first model load |
| **Explicit send gate** | Nothing hits the network until you press **Send for translation** — not even Redis |
| **Token format** | `⟦PII:TYPE:n⟧` — deterministic placeholders, never raw values in Claude payloads |
| **Backend never sees PII** | Server mints scoped Upstash credentials via `/api/redaction-session-token`; browser writes the real token map **directly to Redis REST** — your backend never receives names or ID numbers |
| **Ephemeral sessions** | Token maps live in Redis with a **15-minute TTL** (`session:{id}:tokens`) |
| **Pre-send leakage scan** | `scanForLeakage` blocks translation if any raw PII pattern survived redaction — fails closed with Sentry alert |
| **Post-Claude validation** | Token-count check on Claude's response; mismatch → fallback UI, no partial render, Sentry capture |
| **Local reinsertion** | Real values substituted only in the browser DOM on the final result screen |
| **Voice safety** | Questions route through the same redacted document context; TTS receives explanation text only, with a server-side guard that blocks SSN/A-number patterns; live mic nudge warns users not to speak ID numbers aloud |
| **Sentry scrubbing** | `beforeSend` strips A-numbers and SSNs from event messages on both client and server |

**Redis usage:** Passage uses **Upstash Redis** as a short-lived key-value store for token maps during a session. It does **not** use the Redis Agent Memory SDK — the `berkeley-ai-hackathon-RedisAgent/` folder in this repo is an unrelated workshop reference, not part of the app.

---

## Features built

### Detection & redaction UI
- 9 hand-labeled synthetic test documents (RFE, biometrics, EAD, passport labels, combo cards, edge cases)
- 2 planted demo docs: one triggers deterministic validation failure (Sentry beat), one triggers pre-send leakage block (missed address heuristic)
- Privacy tab with per-type counts, span list with confidence scores, amber token highlights
- Expandable **"Show Claude payload"** panel — the exact redacted string sent to the API
- Per-doc **recall score** computed against hand labels and reported to Phoenix

### Translation
- Claude Sonnet 4.6 with a strict system prompt: preserve every token, explain sections, never give legal advice
- Side-by-side result view: original English left, translated+explained right with reinserted personal data
- Fail-closed blocked state when validation or leakage checks fail

### Voice
- Deepgram Nova-3 — live streaming STT when your key supports client grants, otherwise server-proxy transcription (API key never in browser either way)
- Follow-up Q&A grounded in the redacted document, not raw text
- Deepgram TTS on PII-free explanation text, with visible TTS preview for verification
- Mic-active disclaimer: *"Please type any ID numbers — don't say them out loud"*

### Observability

**Sentry** — wired into real error paths, not just demo decoration:
- Token validation mismatches (server + client)
- Pre-send PII leakage blocks
- Claude, Deepgram, translate, and voice route failures
- Planted validation failure doc for live dashboard demo

**Arize Phoenix** — OpenTelemetry via `@arizeai/phoenix-otel`:
- Auto-instrumented Claude `messages.create` traces
- Custom `redaction-check` spans with recall, doc ID, session ID, run ID — metrics only, never raw PII
- Batch scoring script for the full synthetic test set; live browser scoring on each Detect & redact

Phoenix Cloud alternative:
```bash
PHOENIX_COLLECTOR_ENDPOINT=https://app.phoenix.arize.com/s/<your-space>
PHOENIX_API_KEY=<your-phoenix-api-key>
```

---

## Verify it works

Server must be running for API tests. Phoenix Docker must be up for observability tests.

```bash
cd server

npm run test:phases      # redaction token mint, Redis write, Claude token preservation, validation + Sentry
npm run test:phase5      # Phoenix reachable, recall scoring API, batch scoring runs
npm run test:phase6      # Deepgram auth, voice Q&A, TTS safety, audio response

npm run score:redaction              # batch recall → Phoenix
npm run score:redaction -- run-after-fix   # second run — compare recall trend in Phoenix UI
```

In Phoenix → project `immigration-redaction-demo`: filter span name **`redaction-check`** or attribute **`redaction.run_id`**.

Real failures and planted demo cases are logged in [`08-error-log.md`](08-error-log.md).

---

## Project structure

```
/client
  src/hooks/usePassageFlow.ts   — core app logic (detection → redact → translate → reinsert)
  src/lib/detect.ts             — regex + NER merge
  src/lib/ner.ts                — Transformers.js BERT-NER (in-browser)
  src/lib/redis.ts              — browser → Upstash REST (direct, not via backend)
  src/lib/validate.ts           — token check + local reinsertion
  src/lib/voice.ts              — Deepgram STT/TTS client
  src/ui/                       — React UI (styles from passage UI draft)
  src/data/synthetic-docs.ts    — labeled test corpus

/server
  src/routes/                   — translate, voice, deepgram-token, redaction-session-token, score-redaction
  src/lib/claude.ts             — Claude calls + validation helpers
  src/instrumentation.ts        — Phoenix OTEL + Anthropic auto-instrumentation
  src/lib/sentry.ts             — server Sentry with PII scrubbing
  scripts/                      — automated test + scoring scripts
```

Styles live in `client/src/styles/passage-draft.css` (extracted from `passage UI draft.html`). See `client/src/ui/README.md` for UI maintenance notes.

---

## API surface

```
POST /api/redaction-session-token   { session_id } → scoped Upstash credentials (no PII)
POST /api/translate                 { redacted_text, target_language, session_id } → translated tokens
POST /api/score-redaction           { doc_id, recall, ... } → Phoenix span (metrics only)
POST /api/deepgram-token            {} → short-lived client token or server-proxy mode
POST /api/voice/question            { transcript, redacted_text, session_id } → answer + PII-free tts_text
POST /api/voice/speak               { text } → MP3 audio
POST /api/voice/transcribe          raw audio → transcript (server-proxy STT)
```

---

## Not legal advice

Passage explains immigration paperwork in plain language. It does not provide legal advice, draft responses, or tell anyone how to answer a form. Say this explicitly in any demo.
