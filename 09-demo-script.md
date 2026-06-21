# Demo script — 5 minutes

Rehearse against this throughout the build. Two failure beats are **different stories** — do not conflate them.

## Opening (15s)

One-line pitch: translates and explains immigration paperwork — your identity stays tokenized end-to-end; raw PII never leaves the browser or gets saved anywhere.

## Live demo (3m10s)

1. **(45s)** Paste a synthetic doc → **Analyze & redact** → Privacy tab shows tokens highlighted by type. Tap a token for type · confidence · source.

2. **(40s)** **Send for translation** → open devtools Network → filter `/api/` → show only `⟦PII:...⟧` in `POST /api/translate`. Pre-warm NER before opening devtools if needed.

3. **(40s)** **Fail-closed validation (Sentry)** — separate from detection gap. Run `npm run verify:sentry-browser --prefix client` once before stage, or rehearse in a spare tab: corrupted token → validation failure panel, **no** translation pane. Show Sentry event with token **keys** only.

4. **(30s)** **Date/deadline back-translate** — mention in close or if a doc with a deadline blocks when dates drift (optional live beat; Sentry event: "date/deadline drift").

5. **(40s)** Voice Q&A — emphasize **audio path ≠ text path**; show scrubbed question preview.

6. **(20s)** Translation tab: tokenized side-by-side. Raw values never persisted.

## Impact / close (1m05s)

- Privacy *architecture* vs policy — verify in devtools; volunteer [what we don't claim](../README.md#what-we-dont-claim).
- Back-translate catches **date/deadline drift**, not full translation correctness.
- Thesis: innovation is what you **don't** send.

## Optional (judge asks about detection limits)

Load **planted failure (Apt #4B)** → Analyze → yellow **Send blocked** banner while `Apt #4B` remains plain in preview. Do **not** send to Claude.

## Hard rule

No new demo beat unless it maps to a Pass/Fail row or sponsor track you're targeting.
