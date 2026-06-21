# Demo script — 5 minutes

Rehearse against this throughout the build. Two failure beats are **different stories** — do not conflate them.

## Opening (15s)

One-line pitch: translates and explains immigration paperwork — your identity stays tokenized end-to-end; raw PII never leaves the browser or gets saved anywhere.

## Live demo (3m10s)

1. **(45s)** Paste a synthetic doc → **Analyze & redact** → Privacy tab shows tokens highlighted by type. Tap a token for type · confidence · source.

2. **(40s)** **Send for translation** → open devtools Network → filter `/api/` → show only `⟦PII:...⟧` in `POST /api/translate`. Pre-warm NER before opening devtools if needed.

3. **(40s)** **Fail-closed validation (Sentry)** — separate from detection gap. Run `npm run verify:sentry-browser --prefix client` once before stage, or rehearse in a spare tab: corrupted token → validation failure panel, **no** translation pane. Show Sentry event with token **keys** only.

4. **(45s)** Voice Q&A — ask “what is this letter asking me to do?” Show scrubbed question preview. **Play read-back** on tokenized explanation (manual, not autoplay).

5. **(20s)** Translation tab: redacted source ↔ tokenized translation side by side. Say out loud: raw values were never reinserted and never persisted.

## Impact / close (1m05s)

- Privacy *architecture* vs policy — judges can verify in devtools.
- Non-goal: explains the document, never drafts a response.
- Roadmap: higher recall NER, spoken-DOB patterns, optional on-device voice.

## Optional (judge asks about detection limits)

Load **planted failure (Apt #4B)** → Analyze → yellow **Send blocked** banner while `Apt #4B` remains plain in preview. Do **not** send to Claude.

## Hard rule

No new demo beat unless it maps to a Pass/Fail row or sponsor track you're targeting.
