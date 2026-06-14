---
name: update-i18n-translations
description: >-
  Updates Ukrainian, Spanish, and Korean translations for this Docusaurus site
  after English content changes. Use when the user asks to translate docs, sync
  i18n, run i18n:translate, refresh locale files, or update uk/es/ko translations
  after editing docs/ or UI strings.
---

# Update i18n Translations

Keeps `uk`, `es`, and `ko` in sync with English source content using the LLM translation pipeline in this repo.

**Locales:** `en` (default), `uk`, `es`, `ko`

## When to use

- User edited English MDX under `docs/` or added a new doc in `faq/`, `product/`, or `release-notes/`
- User changed UI copy (`<Translate>` in React pages, navbar/footer labels in `docusaurus.config.js`)
- User asks to translate, refresh locales, or run the i18n workflow
- CI fails on `npm run i18n:check` (stale translations)

## Ongoing workflow

1. **Edit English content** in `docs/` or UI strings
2. **Run `npm run write-translations`** if UI strings changed
3. **Run `npm run i18n:translate`** (requires `OPENAI_API_KEY` in `.env`)
4. **Commit `i18n/**` and the updated cache**

## Step-by-step (agent)

### 1. Confirm what changed

| Change type | English source | Translated output |
|-------------|----------------|-------------------|
| Docs | `docs/**/*.mdx` | `i18n/{uk,es,ko}/docusaurus-plugin-content-docs/current/**` |
| UI strings | `src/pages/`, `src/components/`, `docusaurus.config.js` | `i18n/{locale}/code.json`, theme JSON files |
| Category labels | `docs/**/_category_.json` | `i18n/{locale}/docusaurus-plugin-content-docs/current.json` |

Auto-translated doc scopes: `faq/**`, `product/**`, `release-notes/**` only. Tutorial docs fall back to English.

### 2. Regenerate translation templates (UI changes only)

Run when `<Translate>` strings, navbar, footer, or category labels changed:

```bash
npm run write-translations -- --locale en
npm run write-translations -- --locale uk
npm run write-translations -- --locale es
npm run write-translations -- --locale ko
```

Skip this step if only MDX docs under `docs/` changed.

### 3. Ensure API key is configured

```bash
# If .env missing, copy from example and ask user to set the key
cp .env.example .env
```

Required in `.env`:

```
OPENAI_API_KEY=sk-...
```

Optional: `LLM_MODEL` (default `gpt-4o-mini`), `LLM_PROVIDER` (default `openai`).

Do **not** commit `.env`.

### 4. Translate stale content

```bash
# Default: sync JSON structure + translate all stale uk/es/ko content
npm run i18n:translate
```

Useful flags (pass through to `scripts/i18n-translate.js`):

```bash
npm run i18n:translate -- --dry-run          # preview without API calls
npm run i18n:translate -- --locale uk        # one locale only
npm run i18n:translate -- --only faq/**      # scope to doc glob
```

### 5. Verify before commit

```bash
npm run i18n:check
npm run build
```

Both must pass. CI runs `i18n:check` before build.

### 6. Commit

Stage and commit:

- `i18n/uk/**`, `i18n/es/**`, `i18n/ko/**`
- `i18n/.translation-cache.json`
- `i18n/en/**` only if `write-translations` added new English baseline keys

Do **not** commit unless the user asked for a commit.

## Bundled UI overrides

Curated homepage/navbar/footer strings live in `scripts/i18n-ui-translations.json`. After editing that file:

```bash
npm run i18n:apply-ui
```

Then run `i18n:seed-cache` if you need to refresh the cache without calling the LLM (see [reference.md](reference.md)).

## Quick checklist

```
- [ ] English edits complete (docs/ and/or UI strings)
- [ ] write-translations run (if UI strings changed)
- [ ] OPENAI_API_KEY set in .env
- [ ] npm run i18n:translate
- [ ] npm run i18n:check passes
- [ ] npm run build passes
- [ ] i18n/** + .translation-cache.json ready to commit
```

## Troubleshooting

| Problem | Action |
|---------|--------|
| `OPENAI_API_KEY is not set` | Create `.env` from `.env.example` |
| `i18n:check` fails after manual edits | Run `npm run i18n:seed-cache` then re-check |
| New UI keys untranslated | Run `write-translations` for all locales, then `i18n:translate` |
| Only one doc changed | `npm run i18n:translate -- --only product/**` |
| Cost control | `--dry-run` first; use `--locale` to translate one language at a time |

## Additional reference

- MDX translation rules, cache format, env vars: [reference.md](reference.md)
- Orchestrator: `scripts/i18n-translate.js`
- LLM adapter: `scripts/lib/translator.js`
