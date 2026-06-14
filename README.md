# SOC Prime Documentation

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

**Locales:** English (default), Ukrainian (`uk`), Spanish (`es`), Korean (`ko`).

## Installation

```bash
npm ci
```

## Local Development

```bash
npm start
```

Preview a specific locale:

```bash
npm run start -- --locale uk
```

Or use the dedicated scripts:

```bash
npm run start:uk
npm run start:es
npm run start:ko
```

**Locale switcher in development:** `npm run start` serves only the default locale (`en`). Other locales are available after a production build. To test the locale dropdown across all languages locally, use:

```bash
npm run start:all
```

This builds and serves the full multi-locale site (same as production). Per-locale dev servers (`start:uk`, etc.) hot-reload faster for editing one language.

## Build

```bash
npm run build
```

Builds all locales into `build/`, `build/uk/`, `build/es/`, and `build/ko/`.

## Internationalization workflow

### 1. Add or edit English content

- Docs: edit files under `docs/`
- UI strings: use `<Translate>` in React pages or edit `docusaurus.config.js` navbar/footer labels
- After changing UI strings, regenerate templates:

```bash
npm run write-translations -- --locale en
npm run write-translations -- --locale uk
npm run write-translations -- --locale es
npm run write-translations -- --locale ko
```

### 2. Translate changed content

Copy `.env.example` to `.env` and set `OPENAI_API_KEY`:

```bash
cp .env.example .env
npm run i18n:translate
```

Options:

- `--locale uk` — translate one locale only
- `--only faq/**` — limit to matching docs
- `--dry-run` — preview without API calls

Bundled UI overrides for homepage/navbar/footer live in `scripts/i18n-ui-translations.json`. Apply them with:

```bash
npm run i18n:apply-ui
```

### 3. Verify before commit

```bash
npm run i18n:check
npm run build
```

CI runs `i18n:check` before build; PRs fail if committed translations are stale.

### Translation file layout

```
i18n/
  en/                          # English UI string baseline
  uk/ es/ ko/                  # Translated UI strings + docs
  .translation-cache.json      # Source hashes (committed)
docs/                          # English docs (default locale)
```

Translated docs mirror English paths under `i18n/<locale>/docusaurus-plugin-content-docs/current/`.

## Deployment

GitHub Actions deploys the multi-locale `build/` folder to GitHub Pages on push to `main`.

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```
