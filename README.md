# Passage

**UC Berkeley AI Hackathon 2026 — World Track**

Passage helps immigrants understand confusing official letters — like a notice to appear in immigration court — written in English. You paste or upload the letter and it translates and explains it in plain language in your own language (11 supported), and you can ask follow-up questions by voice.

The key idea: before anything is sent to the AI, your personal details (name, address, ID numbers) are stripped out and replaced with placeholders inside your browser, so the sensitive data never leaves your device — and you can watch in the browser's developer tools that only the placeholders get sent. It also double-checks that critical dates and deadlines survive translation correctly, since a missed deadline can sink an immigration case, and it's honest about what it can't guarantee.

**Technical (brief):** A monorepo with four packages — client (React 19 + TypeScript + Vite 6 SPA), server (Express 4 + TypeScript), shared (`@passage/shared`: sentry-scrub + explanation-text, single source to prevent drift), and a launcher (`launch.mjs` / macOS `.app`). The client runs the whole privacy pipeline in-browser: PDF/image extraction (pdf.js + Tesseract.js), PII detection (regex + Xenova/bert-base-NER via Transformers.js, recall-first at score ≥ 0.35 plus Unicode label-line names), tokenization to `⟦PII:TYPE:n⟧`, an explicit send gate, and fail-closed post-Claude validation — all orchestrated by a `usePassageFlow` phase machine (input → preview → translating → done | blocked). The server is intentionally thin (prompt + API call per feature): Claude Sonnet 4.6 for translation plus a back-translation verify pass for dates/deadlines, Deepgram for voice, Upstash + optional Redis Cloud for session/memory/cache, OpenTelemetry/OpenInference exporting to Phoenix or Arize AX, and Sentry on both ends. The thesis is that the sophistication lives in the privacy architecture and verification harness — Playwright network audits asserting no raw PII in request bodies, per-type recall metrics, fail-closed validation — not in model orchestration: **the innovation is what you don't send**.

For architecture, data flow, and file reference, see [`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md).

---

## First-time setup

1. **Install dependencies** (once):

```bash
npm run install:all
```

2. **Copy env files** and fill in keys:

```bash
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local   # optional — browser Sentry
```

3. **Required in `server/.env`:**

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude translation + voice Q&A |
| `UPSTASH_REDIS_REST_URL` | Upstash — session markers, launcher heartbeat, rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST credentials |
| `SENTRY_DSN` | Server error monitoring |
| `DEEPGRAM_API_KEY` | Voice transcription + TTS |
| `RECALL_ALERT_THRESHOLD` | Optional (default `0.75`) — Sentry alert when recall or NAME recall drops below |

For **Arize AX Cloud** traces with `npm run launch -- --cloud`, also set `ARIZE_SPACE_ID` and `ARIZE_API_KEY` ([app.arize.com](https://app.arize.com) → Settings).

**Optional Redis Cloud** (voice memory + FAQ cache — redacted text only):

| Variable | Purpose |
|---|---|
| `AGENT_MEMORY_URL` + `AGENT_MEMORY_STORE_ID` + `AGENT_MEMORY_API_KEY` | Multi-turn voice Q&A |
| `LANGCACHE_URL` + `LANGCACHE_CACHE_ID` + `LANGCACHE_API_KEY` | Semantic cache for repeated voice questions |

4. **macOS only — allow double-click launch** (once):

```bash
./scripts/fix-launch-app.sh
```

If macOS still warns, right-click **Launch Passage.app** → **Open** → **Open** once.

---

## Run Passage

**After setup, start Passage one of these ways** (both use the same launcher — server, client, observability picker, and auto-shutdown when you close the browser tab):

| Method | How |
|---|---|
| **macOS app** | Double-click **`Launch Passage.app`** in the repo root |
| **Terminal** | From the repo root: `npm run launch` |

Optional flags (terminal only): `--cloud` for Arize AX Cloud traces, `--local` for local Phoenix (Docker). On macOS, the app shows a dialog to pick observability instead.

```bash
npm run launch                       # default — observability picker (app) or Phoenix (terminal)
npm run launch -- --cloud            # Arize AX Cloud traces
# npm run launch -- --local          # Local Phoenix (Docker) instead
```

Re-run `./scripts/fix-launch-app.sh` only if macOS blocks the app again — not needed for every launch.

Browser opens at **http://localhost:5173**. Pick your **translation language** on the landing screen first — the whole UI (nav, redaction review, tabs, voice controls, warnings) follows that choice. **Close that tab** when you are done — the launcher stops server and client automatically.

Logs if something fails: `.passage-launch.log`

**Port conflict?** If voice or API calls fail, kill any stale server:

```bash
lsof -ti:3001 | xargs kill
npm run launch -- --cloud
```

---

## Configure secrets (reference)

The server refuses to start without working Redis and Claude credentials. See [First-time setup](#first-time-setup) for the required variables.

### Observability — pick one at launch

| Mode | Set in `.env` | Where to get keys |
|---|---|---|
| **Local Phoenix** (default) | `OBSERVABILITY_TARGET=phoenix` | No keys needed — Docker only |
| **Arize AX Cloud** | `OBSERVABILITY_TARGET=ax` | [app.arize.com](https://app.arize.com) → **Settings** → **Space ID** + **API Key** |

```bash
# Local Phoenix
OBSERVABILITY_TARGET=phoenix
PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006
PHOENIX_PROJECT_NAME=immigration-redaction-demo

# Arize AX Cloud
OBSERVABILITY_TARGET=ax
ARIZE_SPACE_ID=your-space-id
ARIZE_API_KEY=your-api-key
ARIZE_PROJECT_NAME=immigration-redaction-demo
```

Both modes use the same OpenTelemetry + OpenInference stack — Claude traces and `redaction-check` recall spans work identically; only the export destination changes.

**Launcher vs `.env`:** `Launch Passage.app` / `launch.mjs` asks which backend to use (macOS dialog) or accepts `--local` / `--cloud`. That choice is passed to the server for that session and **overrides** `OBSERVABILITY_TARGET` in `.env`. For `npm run dev` without the launcher, `.env` controls the target.

### Redis Agent (optional — voice memory + FAQ cache)

Create both services at [cloud.redis.io](https://cloud.redis.io) when you want multi-turn voice or cache hits. Only redacted/tokenized text is stored.

### Client (`client/.env.local`)

| Variable | Purpose |
|---|---|
| `VITE_SENTRY_CLIENT_DSN` | Public browser Sentry DSN (optional) |

---

## Sponsor integrations

### Anthropic (Claude)

**Plain:** Does the actual translating and plain-language explaining of the letter, and answers spoken follow-ups — but only ever sees a version with personal details swapped out for placeholders.

**Technical:** `claude-sonnet-4-6` via `@anthropic-ai/sdk`. Powers `/api/translate` (structured tool output + immigration glossary + prompt caching), a second back-translation pass for date/deadline verification, `/api/voice/question`, and `/api/related-documents`. Receives only `⟦PII:TYPE:n⟧` tokens. Backend is deliberately thin — prompt + API call per feature.

### Redis

**Plain:** Keeps the app running smoothly — remembers your session, blocks abuse, shuts down when you close the tab, and optionally remembers your voice conversation and caches repeated questions. Never stores personal info.

**Technical:** Three surfaces, all PII-free by design. **Upstash** (required): scoped session markers, per-session rate limits on translate/voice/extract, and launcher heartbeat (replaces an in-memory map). **Redis Cloud Agent Memory** (optional): tokenized multi-turn voice history with safety asserts before persist. **Redis Cloud LangCache** (optional): semantic cache for paraphrased voice FAQ, returns hit rate + similarity.

### Sentry

**Plain:** Watches for errors and raises an alarm — including when the system catches itself leaking or mistranslating, or when name-detection accuracy drops.

**Technical:** `@sentry/node` (server, required) + `@sentry/react` (browser, optional). Captures validation mismatches, leakage blocks, date/deadline-drift blocks, recall-drop alerts (incl. a NAME-specific one), and Claude/Deepgram/API failures. Scrubbed via `@passage/shared/sentry-scrub` — events carry token keys only, never raw PII.

### Arize AX (observability)

**Plain:** A dashboard that measures how well the privacy detection actually works — including how often it misses names — so the weakness is tracked openly instead of hidden.

**Technical:** OpenTelemetry + OpenInference. Auto-instruments Claude calls via `@arizeai/openinference-instrumentation-anthropic`. Custom redaction-check spans carry aggregate + per-type recall (`redaction.recall.name`, etc.) plus doc/session/run IDs; eval-dataset export to Arize AX Datasets. Local alternative is Phoenix on the same OTEL pipeline (Docker), chosen at launch.

### Deepgram (voice)

**Plain:** Lets you ask follow-ups out loud and hear the explanation read back. Honest caveat the team volunteers: spoken audio reaches Deepgram before redaction — the one spot where the privacy boundary is weaker.

**Technical:** Nova-3 STT in the document's target language (`redact=pii,numbers` + keyword boosting); Aura-2 TTS speaking explanation-only tokenized text (PII safety assert before synthesis). Short-lived grant via `/api/deepgram-token`, or server-proxy via `/api/voice/transcribe`. Structural exposure: raw audio hits Deepgram before client-side transcript redaction.

---

## What Passage does

**Input:** Paste text, upload a **`.txt`** file (stays in-browser), or upload **`.pdf` / image** (extracted in-browser via pdf.js + Tesseract.js; server fallback only if client extraction fails). Synthetic demo documents are available for testing.

**Output:** Plain-language translation + explanation in **11 languages** (English, Spanish, French, Chinese, Vietnamese, Korean, Portuguese, Arabic, Hindi, Tagalog, Ukrainian). UI shows **tokenized** text by default; raw values can be reinserted client-side from in-memory `tokenMap` for readability without changing Claude payloads (not enabled in demo UI). Voice follow-up questions; optional listen-back via TTS — all tokenized to external APIs. **Related documents** tab lists commonly associated immigration document types (redacted input only).

**UI language:** Choose translation language on the **landing screen** before pasting. Site chrome, redaction review, tab labels, voice buttons, and TTS fallback warnings all follow that choice (11 locale packs under `client/src/i18n/`). Your choice is saved in `localStorage` so the connection-lost screen stays in the same language.

**Scope line:** Explains what a section is *asking for*. Does **not** tell anyone what to write in response.

---

## What we don't claim

Volunteer these in a judged room — credibility beats polish.

| Exposure | Reality |
|---|---|
| **Undetected names** | Best-effort detection with recall-first tuning; names without label anchors or outside NER training can still reach Claude |
| **Raw audio to Deepgram** | Spoken PII hits a third party before redaction; mic disclaimer relies on user compliance |
| **Server extract fallback** | If client-side pdf.js/Tesseract fails, raw file bytes hit the server (rate-limited) |
| **Translation correctness** | Date/deadline back-translate catches one failure mode; it does not verify that form fields or legal meaning are correct |

---

## Verify it works

Keep Passage running (via launcher or separate `npm run dev` in `server/` and `client/`). For Phoenix mode, use the launcher or run `docker compose -f docker-compose.phoenix.yml up -d` first.

`test:phase5` and `test:phase6` call live HTTP endpoints — the server must already be listening on port **3001**.

```bash
cd server
npm run test:phases      # redaction, Redis, Claude, validation + Sentry
npm run test:phase5      # observability + recall scoring
npm run test:phase6      # Deepgram voice + TTS safety
npm run test:explanation-text

cd ../client
npm run verify:all                    # validation, regex, redact, voice, TTS, upload, i18n, names
npm run verify:demo-network           # Playwright — token-only API payloads (needs dev server)
npm run verify:detection              # Playwright — ?detection-test harness
npm run verify:tokenized-ui           # Playwright — no reinsertion in UI
npm run verify:sentry-browser         # Playwright — fail-closed validation beat
node scripts/verify-connection-lost.mjs     # Playwright — connection-lost UI (client only, no server)

npm run score:redaction -- run-before-fix
npm run score:redaction -- run-after-fix   # from server/ — compare trend in observability UI
npm run sync:synthetic-docs --prefix server   # regenerate JSON from client/src/data/synthetic-docs.ts
npm run export:eval-dataset --prefix server   # Arize eval dataset JSONL
```

Filter observability UI by span name **`redaction-check`** or attribute **`redaction.run_id`**.

Failures logged in [`08-error-log.md`](08-error-log.md).

---

## Demo script

See [`09-demo-script.md`](09-demo-script.md) for the timed 5-minute rehearsal (two distinct failure beats: detection gap vs validation mismatch).

---

## API surface

```
GET  /api/health                    — startup probe (used by launcher)
POST /api/launcher/heartbeat        — browser tab alive (launcher auto-shutdown)
GET  /api/launcher/session          — last heartbeat timestamp
POST /api/launcher/goodbye          — explicit tab close
POST /api/redaction-session-token   scoped Upstash credentials (no PII)
POST /api/translate                 redacted text → translated tokens
POST /api/score-redaction           recall metrics → observability span
POST /api/extract-document          PDF/image → text (server fallback only; rate-limited)
POST /api/related-documents         redacted text → process + associated doc types
POST /api/deepgram-token            short-lived client token or server-proxy
POST /api/voice/question            transcript + redacted context → answer + TTS text
POST /api/voice/speak               PII-free text → MP3
POST /api/voice/transcribe          raw audio → transcript
```

---

## Not legal advice

Passage explains immigration paperwork in plain language. It does not provide legal advice, draft responses, or tell anyone how to answer a form.
