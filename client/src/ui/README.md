# Passage UI layer

Visual shell follows class names and layout from `passage UI draft.html` at the repo root.

**When the draft changes:** re-extract styles with:

```bash
sed -n '/^<style>/,/^<\/style>/p' "passage UI draft.html" | sed '1d;$d' > client/src/styles/passage-draft.css
```

Then update presentational components under `ui/` — business logic lives in `hooks/usePassageFlow.ts` and `lib/`, not in the draft markup.
