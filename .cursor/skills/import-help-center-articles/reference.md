# Help Center Import Reference

## Help center URL pattern

```
https://help.socprime.com/en/articles/{numeric-id}-{slug}
```

Example: `https://help.socprime.com/en/articles/5820444-search`

## Manifest file

Path: `scripts/help-center-imports.json`

```json
{
  "docRoot": "docs/product",
  "imageRoot": "static/img/docs",
  "sections": {
    "threat-detection-marketplace": {
      "label": "Threat Detection Marketplace",
      "position": 3,
      "description": "Guides for using the Threat Detection Marketplace."
    }
  },
  "articles": []
}
```

### `sections` block (optional)

Maps section folder names to Docusaurus category metadata. Used when `_category_.json` does not exist yet.

### Per-article `sectionConfig` (optional)

Override or supply category metadata for a single import:

```json
{
  "url": "https://help.socprime.com/en/articles/5820372-dashboard",
  "slug": "dashboard",
  "section": "platform-analytics",
  "sidebarPosition": 1,
  "startMarker": "The Dashboard provides",
  "sectionConfig": {
    "label": "Platform Analytics",
    "position": 5,
    "description": "Dashboard and coverage analytics guides."
  }
}
```

## Finding `startMarker`

1. Open the help center article in a browser
2. Copy the first sentence of the article body (not the page title)
3. Use at least the first 40–80 characters — must match HTML exactly

Auto-detection uses the first non-empty `<p>` in `article_body`, but explicit markers are more reliable for similar intros across articles.

## Bulk import workflow

1. List target articles from a help center collection page
2. For each article, add a manifest entry with `url`, `slug`, `section`, `sidebarPosition`, `startMarker`
3. Assign sequential `sidebarPosition` values within each section
4. Run `node scripts/import-help-articles.js`
5. Fix any failures individually with `--slug <name> --dry-run` first

## What the script preserves

- Headings (`h2` → `##`, etc.)
- Paragraphs with **bold**, `code`, and links
- Ordered and nested bullet lists
- Screenshots (downloaded locally; Intercom CDN URLs not used in MDX)
- Tables (except the auto-generated "In this article" TOC table)
- Horizontal rules and note/tip blockquotes

## What is stripped

- Help center chrome (nav, search, feedback widgets)
- "Did this answer your question?" footer
- Related articles footer (unless present as article body content)

## Re-importing / updating

Re-running the import for an existing slug:

- Overwrites the MDX file
- Keeps existing image files on disk (skips re-download)
- Downloads only new images not yet saved

To force fresh images, delete `static/img/docs/{section}/{slug}/` before re-importing.

## CLI reference

```
node scripts/import-help-articles.js [options]

--slug <slug>         Import one manifest entry
--url <url>           One-off import (requires --slug and --section)
--section <section>   Target docs subfolder (with --url)
--manifest <path>     Custom manifest path
--dry-run             Parse only, no writes
--skip-build          Skip npm run build
--help                Show help
```

## Collection mapping guide

| Help center collection | Suggested `section` folder |
|------------------------|----------------------------|
| Threat Detection Marketplace | `threat-detection-marketplace` |
| Platform Guides | `platform-guides` |
| Uncoder / AI features | `uncoder` |
| FAQs (if migrating) | keep under `docs/faq/` — requires script path adjustment |

To import outside `docs/product/`, change `docRoot` in the manifest (e.g. `"docRoot": "docs/faq"`).
