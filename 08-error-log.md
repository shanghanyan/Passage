# Time | Issue | Cause | Fix | Caught by
|------|-------|-------|-----|----------|
| 2026-06-20 | Planted validation failure (demo doc) | Server simulates dropped token when `planted_validation_failure: true` | Left uncorrected on purpose — deterministic Sentry demo beat | Sentry (validation mismatch) |
| 2026-06-20 | Planted detection failure (missed address) | Address heuristic misses `Apt #4B` format without street suffix | Preview banner blocks send; `scanForLeakage` also catches Apt/Unit city-state-ZIP shapes | Sentry (pre-send leakage) |
