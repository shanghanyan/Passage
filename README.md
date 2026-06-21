# Passage

**UC Berkeley AI Hackathon 2026 — World Track**

## The Pitch

> Say this part out loud.

Someone gets a Notice to Appear or an RFE in the mail. It's in English, full of bureaucratic phrasing, about their immigration status — which means the document itself is something they'd reasonably not want sitting in a third party's logs.

This tool lets them paste it in, get it translated and explained in their language, and ask follow-up questions by voice — while their A-number, passport number, SSN, date of birth, and legal name are stripped out before anything leaves their device, swapped back in only at the very end, on their own screen.

The technical differentiator isn't "we use Claude to translate things." It's that the architecture treats **redaction as a hard boundary** with its own validation, its own failure monitoring, and its own measurable accuracy — not a privacy-policy promise.

## Scope

### Building

Form/letter helper — paste a section of a DS-160, I-485, RFE, or NTA → redact → translate + explain → reinsert → display. Plus a voice layer (ask questions out loud, hear the explanation read back).

### Not building (roadmap only)

The open-ended "describe your situation, get a citation-grounded rights explainer" chat flow. It's unbounded and hard to make reliable in ~24 hours — don't let it eat time from the demo-able core.

### Not legal advice

The tool explains what a section of a form or letter is asking for. It does **not** tell anyone what to write in response. Say this explicitly in the demo — it also keeps you out of unauthorized-practice-of-law territory.

## Project structure

```
/client   Frontend — no secrets ever
/server   Backend proxy — all secrets live here
```

The browser only talks to `/server` endpoints. Nothing in `/client` ever holds `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`, or other private keys.

## Secrets

### Server (`/server/.env`)

All private keys live here and are gitignored:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API |
| `REDIS_URL` | Redis connection |
| `SENTRY_DSN` | Server-side error monitoring |
| `DEEPGRAM_API_KEY` | Voice transcription / TTS (Phase 6) |
| `PHOENIX_COLLECTOR_ENDPOINT` | Self-hosted Phoenix OTLP URL (default `http://localhost:6006`) |
| `PHOENIX_PROJECT_NAME` | Phoenix project name (default `immigration-redaction-demo`) |
| `PHOENIX_API_KEY` | Phoenix Cloud only — leave blank for Docker |
| `ARIZE_API_KEY` / `ARIZE_SPACE_KEY` | Legacy hosted Arize AX — **not** used by self-hosted Phoenix |

Copy and fill in values locally — never commit this file.

## Phase 5 — Arize Phoenix (observability)

Self-hosted Phoenix is the default (one Docker container). No `ARIZE_API_KEY` needed.

### 1. Start Phoenix

```bash
docker compose -f docker-compose.phoenix.yml up -d
```

Open **http://localhost:6006** — keep this tab open for the demo.

### 2. Server env (already in `server/.env.example`)

```bash
PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006
PHOENIX_PROJECT_NAME=immigration-redaction-demo
# PHOENIX_API_KEY=          # only if using Phoenix Cloud instead of Docker
```

Restart the server after adding these (instrumentation loads at startup).

### 3. Score the synthetic test set

**Batch (regex baseline, no browser):**

```bash
cd server
npm run score:redaction              # run 1
npm run score:redaction -- run-after-fix   # run 2 — shows recall trend in UI
```

**Live (browser, includes NER):** load each synthetic doc → **Detect & redact**. Recall is computed locally and posted to Phoenix as a `redaction-check` span (metrics only — no raw PII).

### 4. What to show in the demo

In Phoenix → project `immigration-redaction-demo`:

- **Traces** tab: Claude `messages.create` spans (auto-instrumented)
- Filter span name **`redaction-check`** or attribute **`redaction.doc_id`**
- Compare **`redaction.recall`** across two `redaction.run_id` values (before/after a detector fix)

### Phoenix Cloud (optional alternative to Docker)

If you use [Phoenix Cloud](https://app.phoenix.arize.com) instead of Docker:

```bash
PHOENIX_COLLECTOR_ENDPOINT=https://app.phoenix.arize.com/s/<your-space>
PHOENIX_API_KEY=<your-phoenix-api-key>
```

`ARIZE_API_KEY` / `ARIZE_SPACE_KEY` are for **Arize AX** (production ML platform), not self-hosted Phoenix — leave them blank for this hackathon.

### Client (`/client/.env.local`)

If you need browser-side Sentry error capture, use a **separate public client DSN**:

```
VITE_SENTRY_CLIENT_DSN=
```

This DSN is meant to be public. It is **not** the server `SENTRY_DSN` above.

See `client/.env.local.example` for the template.

## Phase 5 & 6 tests

```bash
cd server
npm run test:phase5   # Phoenix reachable + recall scoring (two runs)
npm run test:phase6   # Deepgram token + voice Q&A + TTS (no raw PII in speak payload)
```

## Phase 6 — Voice

`DEEPGRAM_API_KEY` stays server-only. The browser never receives it.

- **Client token mode** (if your key supports `/v1/auth/grant`): live streaming STT in the browser
- **Server-proxy mode** (your current key): mic records → `POST /api/voice/transcribe` → still no API key in the browser

Demo: translate a doc → **Voice** tab → mic → ask *"What does RFE mean?"* → check **TTS preview** for zero raw PII → hear audio.

## UI draft integration

Styles: `client/src/styles/passage-draft.css` (from `passage UI draft.html`).  
Components: `client/src/ui/` (same CSS class names).  
Logic: `client/src/hooks/usePassageFlow.ts` — update this when behavior changes, re-extract CSS when the draft changes (`client/src/ui/README.md`).

## Getting started

```bash
# Server
cd server
npm install
npm run dev          # http://localhost:3001

# Client (separate terminal)
cd client
npm install
npm run dev          # http://localhost:5173 — proxies /api → server
```
