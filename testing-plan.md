# Testing Plan — Privacy-First Immigration Document Translator

Same phase numbers as `build-plan.md`. This file is testing, pauses, key reminders, and what to record — no new code here.

**Legend:** 🔑 a key/token needs to be real by this point · ⏸ stop and confirm before continuing · 🎥 record this for the demo · 📝 log this in `08-error-log.md`

---

## The Pass/Fail bar — check this before adding any new feature, at every phase

| Must be true at demo time | Why |
|---|---|
| Zero raw PII ever appears in a network request, server log, Sentry breadcrumb, or Arize trace | The entire pitch — if this fails, the project fails regardless of anything else working |
| Token-count validation blocks display on any mismatch (fails closed, not open) | The single load-bearing guardrail |
| At least one planted failure is caught live by Sentry during the demo | Required for the Sentry track; also the strongest demo beat |
| Tool states what a section is asking for, never what to write in response | Hard scope line — unauthorized-practice-of-law |
| Voice layer never transmits raw identifiers to Deepgram | The guarantee has to hold on every channel, not just text |

**If any row is false, fix that before building anything else — including anything in this doc.**

## Rule for every phase (from the roadmap)

Don't start the next phase until the current one's deliverable is actually demoable — not "the function returns the right value in a test," but "you could show this on screen to a mentor right now and they'd understand what it does."

---

## Phase 0 — Scaffold

🔑 `ANTHROPIC_API_KEY`, `REDIS_URL` set in `/server/.env`, confirmed gitignored (`git status` shouldn't show it).

- Test: hardcoded Claude "hello" call succeeds from backend; frontend → backend round trip returns the stub.
- ⏸ Confirm before Phase 1: empty UI shell actually loads in a browser, not just `npm run dev` not erroring.
- 🎥 Screenshot only (per roadmap) — not a recorded clip.

## Phase 1 — Detection

- Test: run detectors against your synthetic docs, manually compare detected spans to hand-labeled ones. This labeled set later feeds Arize — get it right once.
- ⏸ Recall should look roughly sane on an eyeball check before you move to tokenization. You don't need a number yet.
- 🎥 Screenshot of console output showing spans found.

## Phase 2 — Redaction + Storage

🔑 Confirm `REDIS_URL` (or Upstash REST URL + the scoped-token endpoint from the build plan's conflict fix) is live, not local-only, before this phase's checkpoint.

- Test: open the Network tab *before* doing anything. Paste a doc, let redaction run. Confirm the Network tab stays **completely empty** until the "send for translation" button is pressed — including the Redis write, which should now go through the scoped-token path, not your backend.
- Test: write a token map, confirm `redis-cli HGETALL session:<id>:tokens` shows the real values; drop the TTL to 30s temporarily, confirm the key disappears on schedule.
- Confirm: `redis-cli CONFIG GET save` returns empty (persistence off) on the instance/keyspace used.
- ⏸ Don't proceed to Phase 3 until the redaction-session-token endpoint is verified to never carry raw values through your own backend — this is the conflict flagged in the build plan, and it's worth re-checking here specifically.
- 🎥 **Yes — record this.** Maps to demo script beats 1 and 2: the amber-highlighted redaction view, the tap-to-verify (if built), and the empty-then-token-only Network tab after pressing send.

## Phase 3 — Claude Integration

🔑 Confirm `ANTHROPIC_API_KEY` is the real key before running the full test set.

- Test: run all 6–8 synthetic docs through, manually verify every token survives intact in Claude's raw response. Test at least 2 target languages end to end.
- ⏸ Don't move to Phase 4 until token preservation is 100% across your test set — a dropped token here is exactly what Phase 4's validation exists to catch, but you want to know now if it's happening constantly vs. rarely.
- 🎥 Screenshot of a raw Claude response with tokens still in place — not a recorded beat on its own.

## Phase 4 — Validation + Sentry + Reinsertion

🔑 `SENTRY_DSN` set before this phase.

- Test: manually corrupt/truncate the token array passed into `validateAndReinsert` to force a mismatch — confirm Sentry captures it and the fallback UI renders, not partial output.
- Test the **real** planted failure doc end-to-end, repeated at least 3 times in a row — it needs to fail identically every time, not flakily, since it has to fail on cue live.
- 📝 This phase **is** your first real `08-error-log.md` evidence. Log it: time, issue, cause, fix (or "left uncorrected on purpose" for the planted one), caught by.
- ⏸ Confirm every external call (Redis, Claude, Deepgram) is wrapped with a Sentry capture on failure, not just the validation path — re-check this against `AGENTS.md`'s error-handling rule before moving on.
- 🎥 **Yes — top demo beat.** Capture the live Sentry dashboard alert firing right after triggering the planted failure. Maps to demo script beat 3.

## Phase 5 — Arize

- Test: run the full synthetic set through scoring, confirm a recall value logs per doc in the Phoenix UI at `localhost:6006`.
- ⏸ Re-run the set again after any detector fix (e.g. an address heuristic improvement) so you have at least two data points showing recall trend upward, not one static number.
- 🎥 **Yes.** Capture the Phoenix dashboard, ideally showing the before/after trend. Maps to demo script beat 4.

## Phase 6 — Voice

🔑 Confirm the Deepgram token endpoint mints a short-lived client token and that the raw `DEEPGRAM_API_KEY` never appears in any browser request or bundled JS.

- Test: ask a known test question aloud ("What does RFE mean?"), confirm transcript accuracy. Then **read the literal text sent to TTS** — not just listen to the audio — confirm zero raw PII in it, since reinserted values are display-only and should never reach this call.
- Confirm: the "please type ID numbers, don't say them out loud" nudge is visible any time the mic is live.
- 🎥 **Yes.** Full round trip: ask → transcribe → answer → speak back. Maps to demo script beat 5.

## Phase 7 — Stretch Sponsors

- Not Pass/Fail. Test only if you actually attempt these.
- If either is shaky by the time you'd demo it: cut it from the script silently. A confident omission beats a live stumble — don't apologize for skipping it.

## Phase 8 — Polish + Submit

- Test: copy/paste-diff the final displayed values against the original input — exact match required.
- ⏸ Confirm real values render only in the result screen's DOM, nowhere else (check dev tools elements panel and any console logs from earlier debugging you forgot to remove).
- 🎥 **Yes.** The final side-by-side reveal. Maps to demo script beat 6.
- Rehearse the full script below at least once, timed, before submitting.

---

## Demo script (5 minutes — confirmed 5 min/table on the live site)

**Opening (15s):** One-line pitch — translates and explains immigration paperwork, your identity never leaves your device in raw form.

**Live demo (3m40s):**
1. *(45s)* Paste a synthetic RFE letter. Show the scrubbed preview, tokens highlighted amber. Tap one token to show the verify tooltip (if built).
2. *(40s)* Press "send for translation." Open devtools/network — show only `⟦PII:...⟧` tokens in the payload. *This is the privacy proof — make it visible, don't just claim it.*
3. *(40s)* Switch to the pre-loaded planted-failure document. Trigger it. Sentry fires live. Show the dashboard.
4. *(30s)* Switch to Arize Phoenix, show recall trending across the test set.
5. *(45s)* Ask a question by voice — "what is this letter asking me to do?" Deepgram transcribes, Claude answers, Deepgram reads it back in the target language.
6. *(20s)* Show the final result screen: real data reinserted, original and translated side by side.

**Impact / close (1m05s):**
- This is the difference between a privacy *policy* and a privacy *architecture* — judges can verify the second live.
- Explicit non-goal, said out loud: explains the document, never advises on the response.
- Roadmap, one sentence: citation-grounded rights chat, fine-tuned NER, self-hosted Deepgram for full on-device voice.
- If solid: one breath on Fetch AI / Interaction Company. If shaky, cut it.

**Hard rule:** no beat earns a place in this script unless it maps to a Pass/Fail row or a sponsor track you're actually targeting. If a feature doesn't earn a line here, it didn't earn build time either.

---

## Error log discipline (ongoing — not a wrap-up task)

Log every real failure to `08-error-log.md` **as it happens**, both build-time errors and the planted demo failure, in the same table: time, issue, cause, fix, caught by.

⏸ **Before the demo, audit the "caught by" column.** If most real entries say "manual" and only the planted one says "Sentry," that's an honest signal worth knowing with time still on the clock — it means Sentry is currently demo-decoration, not doing real work. If so, go back to Phase 4 and wire Sentry into more of the actual error paths (Redis connection failures, Claude API errors, Deepgram drops) rather than only the validation check.

---

## Pre-demo final checklist

- [ ] Real, non-expired keys everywhere — no placeholders left in `.env`
- [ ] Redis, Sentry, Arize Phoenix, and Deepgram dashboards open in separate tabs, logged in, before you start talking
- [ ] Planted failure doc pre-loaded somewhere copy-pasteable — not typed live
- [ ] `08-error-log.md` reviewed, "caught by" column audited
- [ ] Devtools network tab clean — no console noise to scroll past mid-demo
- [ ] Pass/Fail table above re-checked, every row true
- [ ] Full script timed at least once, end to end, trimmed if over slot
- [ ] Devpost draft submitted before 11am Sunday

## Recording order (so you're not improvising mid-demo)

1. 🎥 Redaction preview + empty Network tab + token-only payload after send (Phase 2)
2. 🎥 Sentry catching the planted failure live (Phase 4)
3. 🎥 Arize recall trending across runs (Phase 5)
4. 🎥 Voice round trip (Phase 6)
5. 🎥 Final reinsertion reveal, side by side (Phase 8)
