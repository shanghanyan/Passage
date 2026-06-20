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
| `DEEPGRAM_API_KEY` | Voice transcription / TTS |
| `ARIZE_API_KEY` | Hosted Arize only; leave blank for self-hosted Phoenix |
| `ARIZE_SPACE_KEY` | Same as above |

Copy and fill in values locally — never commit this file.

### Client (`/client/.env.local`)

If you need browser-side Sentry error capture, use a **separate public client DSN**:

```
VITE_SENTRY_CLIENT_DSN=
```

This DSN is meant to be public. It is **not** the server `SENTRY_DSN` above.

See `client/.env.local.example` for the template.

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
