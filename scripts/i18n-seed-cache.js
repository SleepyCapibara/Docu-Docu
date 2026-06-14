#!/usr/bin/env node
/**
 * Seed i18n/.translation-cache.json from current English sources and translated outputs.
 * Run after manual or initial translations to sync the cache for i18n:check.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const I18N_DIR = path.join(ROOT, 'i18n');
const CACHE_PATH = path.join(I18N_DIR, '.translation-cache.json');

const TARGET_LOCALES = ['uk', 'es', 'ko'];
const DOC_GLOBS = ['faq/**', 'product/**', 'release-notes/**'];

const JSON_SOURCES = [
  'code.json',
  'docusaurus-theme-classic/navbar.json',
  'docusaurus-theme-classic/footer.json',
  'docusaurus-plugin-content-docs/current.json',
];

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function matchesGlob(relativePath, pattern) {
  const normalized = relativePath.replace(/\\/g, '/');
  const regex = new RegExp(
    `^${pattern
      .replace(/\\/g, '/')
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '§§')
      .replace(/\*/g, '[^/]*')
      .replace(/§§/g, '.*')}$`,
  );
  return regex.test(normalized);
}

function walkMdxFiles(dir, base = dir) {
  const results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMdxFiles(full, base));
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      results.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return results;
}

function listDocSources() {
  return walkMdxFiles(DOCS_DIR)
    .filter((rel) => DOC_GLOBS.some((glob) => matchesGlob(rel, glob)))
    .sort();
}

function main() {
  const cache = {version: 1, entries: {}};

  for (const locale of TARGET_LOCALES) {
    for (const relativeDocPath of listDocSources()) {
      const sourcePath = path.join(DOCS_DIR, relativeDocPath);
      const outputPath = path.join(
        I18N_DIR,
        locale,
        'docusaurus-plugin-content-docs',
        'current',
        relativeDocPath,
      );
      if (!fs.existsSync(outputPath)) {
        continue;
      }
      const sourceHash = sha256(fs.readFileSync(sourcePath, 'utf8'));
      cache.entries[`mdx:${relativeDocPath}:${locale}`] = {
        sourceHash,
        updatedAt: new Date().toISOString(),
      };
    }

    for (const relativeJsonPath of JSON_SOURCES) {
      const enPath = path.join(I18N_DIR, 'en', relativeJsonPath);
      const targetPath = path.join(I18N_DIR, locale, relativeJsonPath);
      if (!fs.existsSync(enPath) || !fs.existsSync(targetPath)) {
        continue;
      }
      const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
      for (const [key, enEntry] of Object.entries(enData)) {
        if (!enEntry.message) {
          continue;
        }
        cache.entries[`json:${relativeJsonPath}:${locale}:${key}`] = {
          sourceHash: sha256(enEntry.message),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  console.log(
    `Seeded ${Object.keys(cache.entries).length} cache entries to i18n/.translation-cache.json`,
  );
}

main();
