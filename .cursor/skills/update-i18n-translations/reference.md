# i18n Translation Reference

## File layout

```
docs/                                    # English docs (default locale)
i18n/
  en/                                    # English UI string baseline (write-translations)
  uk/ es/ ko/                            # Translated UI + docs
  .translation-cache.json                # Source hashes (committed)
scripts/
  i18n-translate.js                      # Main orchestrator
  i18n-seed-cache.js                     # Rebuild cache from current files
  i18n-apply-ui.js                       # Apply bundled UI overrides
  i18n-ui-translations.json              # Curated UI string translations
  lib/translator.js                      # OpenAI adapter (pluggable)
```

## npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Translate | `npm run i18n:translate` | Sync structure + translate stale content via LLM |
| Check | `npm run i18n:check` | Exit 1 if translations are stale (CI gate) |
| Seed cache | `npm run i18n:seed-cache` | Rebuild `.translation-cache.json` from existing files |
| Apply UI | `npm run i18n:apply-ui` | Write bundled UI overrides to locale JSON files |

## Environment variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `OPENAI_API_KEY` | Yes (for translate) | — | Set in `.env`, gitignored |
| `LLM_PROVIDER` | No | `openai` | Extensible via `scripts/lib/translator.js` |
| `LLM_MODEL` | No | `gpt-4o-mini` | Any OpenAI chat model |

## What gets translated

### MDX docs

- **Source:** `docs/faq/**`, `docs/product/**`, `docs/release-notes/**`
- **Output:** `i18n/<locale>/docusaurus-plugin-content-docs/current/<same-path>.mdx`
- **Rules:** Translate prose, `title`, `description`, `sidebar_label`, `display_date`, image alt text. Never change frontmatter keys, imports, JSX component names/props, code fences, URLs, or `/img/...` paths. Keep product names (SOC Prime, Threat Detection Marketplace, Sigma, Lucene, MITRE ATT&CK, etc.).

### JSON UI strings

- `i18n/<locale>/code.json`
- `i18n/<locale>/docusaurus-theme-classic/navbar.json`
- `i18n/<locale>/docusaurus-theme-classic/footer.json`
- `i18n/<locale>/docusaurus-plugin-content-docs/current.json`

`theme.*` keys in `code.json` are skipped (Docusaurus ships default theme translations).

## Cache format

`i18n/.translation-cache.json`:

```json
{
  "version": 1,
  "entries": {
    "mdx:faq/email-notifications.mdx:uk": {
      "sourceHash": "<sha256 of English MDX>",
      "updatedAt": "2026-06-14T..."
    },
    "json:code.json:uk:homepage.section.title": {
      "sourceHash": "<sha256 of English message>",
      "updatedAt": "2026-06-14T..."
    }
  }
}
```

An entry is stale when the English source hash differs from the cached hash, or when translated output is missing / still equals English (unless the cache already records that key).

## CLI flags (`scripts/i18n-translate.js`)

| Flag | Effect |
|------|--------|
| `--check` | Report stale items; exit 1 if any (no writes, no API) |
| `--dry-run` | Log what would be translated; no writes, no API |
| `--locale uk` | Limit to one target locale |
| `--only faq/**` | Limit docs to glob under `docs/` |
| `--sync-structure` | Copy new keys from `i18n/en/` JSON into target locales (included in `npm run i18n:translate`) |

## After importing help center articles

When `import-help-center-articles` adds new English MDX:

1. Confirm the file is under `docs/faq/`, `docs/product/`, or `docs/release-notes/`
2. Run `npm run i18n:translate` (no `write-translations` unless UI also changed)
3. Verify with `i18n:check` and `build`

## Manual translation workflow

If translating by hand instead of LLM:

1. Mirror English path under `i18n/<locale>/docusaurus-plugin-content-docs/current/`
2. Edit locale JSON files directly
3. Run `npm run i18n:seed-cache` to sync the cache
4. Run `npm run i18n:check` and `npm run build`

## Local locale preview

| Goal | Command |
|------|---------|
| Dev English only | `npm run start` |
| Dev one locale | `npm run start:uk` / `start:es` / `start:ko` |
| Test locale switcher | `npm run start:all` (build + serve all locales) |
