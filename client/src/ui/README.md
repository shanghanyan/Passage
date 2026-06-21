# Passage UI layer

Visual shell follows class names and layout from `passage V2 Draft.html` at the repo root.

**When the draft changes:** re-extract styles with:

```bash
sed -n '/^<style>/,/^<\/style>/p' "passage V2 Draft.html" | sed '1d;$d' > client/src/styles/passage-v2.css
```

Then update presentational components under `ui/` — business logic lives in `hooks/usePassageFlow.ts` and `lib/`, not in the draft markup.

App-specific overrides live in `client/src/styles/passage-app.css`.
