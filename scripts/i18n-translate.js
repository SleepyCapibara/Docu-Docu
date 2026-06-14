#!/usr/bin/env node
/**
 * SOC Prime Docusaurus i18n translation orchestrator.
 *
 * Usage:
 *   node scripts/i18n-translate.js              # translate stale content
 *   node scripts/i18n-translate.js --check        # exit 1 if translations stale
 *   node scripts/i18n-translate.js --dry-run
 *   node scripts/i18n-translate.js --locale uk
 *   node scripts/i18n-translate.js --only docs/faq/**
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {createTranslator, LOCALE_NAMES} = require('./lib/translator');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const I18N_DIR = path.join(ROOT, 'i18n');
const CACHE_PATH = path.join(I18N_DIR, '.translation-cache.json');

const TARGET_LOCALES = ['uk', 'es', 'ko'];
const DEFAULT_LOCALE = 'en';

const DOC_GLOBS_INCLUDE = [
  'faq/**',
  'product/**',
  'release-notes/**',
];

const JSON_SOURCES = [
  'code.json',
  'docusaurus-theme-classic/navbar.json',
  'docusaurus-theme-classic/footer.json',
  'docusaurus-plugin-content-docs/current.json',
];

function parseArgs(argv) {
  const args = {
    check: false,
    dryRun: false,
    locales: [...TARGET_LOCALES],
    only: null,
    help: false,
    syncStructure: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') {
      args.check = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--sync-structure') {
      args.syncStructure = true;
    } else if (arg === '--locale' && argv[i + 1]) {
      args.locales = [argv[++i]];
    } else if (arg === '--only' && argv[i + 1]) {
      args.only = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Translate Docusaurus content using LLM (OpenAI by default).

Usage:
  node scripts/i18n-translate.js [options]

Options:
  --check           Fail if any source content is newer than cached translations
  --dry-run         Show what would be translated without calling the API
  --locale <code>   Translate a single locale (uk, es, ko)
  --only <glob>     Limit to docs matching glob under docs/ (e.g. faq/**)
  --sync-structure  Copy i18n/en JSON keys to target locales before translating
  --help            Show this help

Environment:
  OPENAI_API_KEY    Required for translation (set in .env)
  LLM_PROVIDER      Default: openai
  LLM_MODEL         Default: gpt-4o-mini
`);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    return {version: 1, entries: {}};
  }
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), {recursive: true});
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

function cacheKey(type, sourcePath, locale, subKey = '') {
  return `${type}:${sourcePath}:${locale}${subKey ? `:${subKey}` : ''}`;
}

function matchesGlob(relativePath, pattern) {
  if (!pattern) {
    return true;
  }
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

function listDocSources(onlyPattern) {
  const all = walkMdxFiles(DOCS_DIR);
  const included = all.filter((rel) =>
    DOC_GLOBS_INCLUDE.some((glob) => matchesGlob(rel, glob)),
  );
  if (!onlyPattern) {
    return included.sort();
  }
  return included.filter((rel) => matchesGlob(rel, onlyPattern)).sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function docOutputPath(locale, relativeDocPath) {
  return path.join(
    I18N_DIR,
    locale,
    'docusaurus-plugin-content-docs',
    'current',
    relativeDocPath,
  );
}

function jsonPaths(locale, relativeJsonPath) {
  return {
    en: path.join(I18N_DIR, DEFAULT_LOCALE, relativeJsonPath),
    target: path.join(I18N_DIR, locale, relativeJsonPath),
  };
}

function syncJsonStructure(locale) {
  for (const relativeJsonPath of JSON_SOURCES) {
    const {en, target} = jsonPaths(locale, relativeJsonPath);
    if (!fs.existsSync(en)) {
      continue;
    }
    const enData = readJson(en);
    let targetData = {};
    if (fs.existsSync(target)) {
      targetData = readJson(target);
    }
    const merged = {...targetData};
    for (const [key, value] of Object.entries(enData)) {
      if (!merged[key]) {
        merged[key] = {...value};
      } else {
        merged[key] = {
          ...value,
          message: merged[key].message ?? value.message,
          description: value.description ?? merged[key].description,
        };
      }
    }
    writeJson(target, merged);
  }
}

function collectJsonTranslationBatch(locale, cache) {
  const batch = {};
  const batchMeta = [];

  for (const relativeJsonPath of JSON_SOURCES) {
    const {en, target} = jsonPaths(locale, relativeJsonPath);
    if (!fs.existsSync(en) || !fs.existsSync(target)) {
      continue;
    }

    const enData = readJson(en);
    const targetData = readJson(target);

    for (const [key, enEntry] of Object.entries(enData)) {
      const sourceText = enEntry.message;
      if (!sourceText || typeof sourceText !== 'string') {
        continue;
      }

      // Docusaurus ships default theme translations; only manage custom UI strings.
      if (relativeJsonPath === 'code.json' && key.startsWith('theme.')) {
        continue;
      }

      const keyHash = sha256(sourceText);
      const entryKey = cacheKey('json', relativeJsonPath, locale, key);
      const cachedHash = cache.entries[entryKey]?.sourceHash;
      const targetMessage = targetData[key]?.message;
      const needsTranslation =
        cachedHash !== keyHash ||
        !targetMessage ||
        (targetMessage === sourceText && !cache.entries[entryKey]);

      if (!needsTranslation) {
        continue;
      }

      batch[key] = sourceText;
      batchMeta.push({relativeJsonPath, key, sourceText, keyHash, entryKey});
    }
  }

  return {batch, batchMeta};
}

async function translateJsonBatch(translator, locale, batch, batchMeta, targetDataByFile, cache, dryRun) {
  if (Object.keys(batch).length === 0) {
    return 0;
  }

  if (dryRun) {
    console.log(
      `[dry-run] Would translate ${Object.keys(batch).length} JSON strings for ${locale}`,
    );
    return Object.keys(batch).length;
  }

  const translated = await translator.translate({
    text: batch,
    targetLocale: locale,
    contentType: 'json',
  });

  for (const meta of batchMeta) {
    const translatedMessage = translated[meta.key];
    if (!translatedMessage) {
      console.warn(`Warning: missing translation for JSON key ${meta.key}`);
      continue;
    }

    const targetPath = jsonPaths(locale, meta.relativeJsonPath).target;
    if (!targetDataByFile[targetPath]) {
      targetDataByFile[targetPath] = readJson(targetPath);
    }
    targetDataByFile[targetPath][meta.key].message = translatedMessage;
    cache.entries[meta.entryKey] = {
      sourceHash: meta.keyHash,
      updatedAt: new Date().toISOString(),
    };
  }

  return Object.keys(batch).length;
}

async function processDocs(translator, locale, cache, args) {
  let count = 0;
  const docs = listDocSources(args.only);

  for (const relativeDocPath of docs) {
    const sourcePath = path.join(DOCS_DIR, relativeDocPath);
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const sourceHash = sha256(sourceContent);
    const entryKey = cacheKey('mdx', relativeDocPath, locale);
    const cachedHash = cache.entries[entryKey]?.sourceHash;

    if (cachedHash === sourceHash && fs.existsSync(docOutputPath(locale, relativeDocPath))) {
      continue;
    }

    if (args.check) {
      console.error(
        `Stale translation: ${relativeDocPath} (${locale}) — source changed or missing output`,
      );
      count += 1;
      continue;
    }

    if (args.dryRun) {
      console.log(`[dry-run] Would translate doc ${relativeDocPath} -> ${locale}`);
      count += 1;
      continue;
    }

    console.log(`Translating doc ${relativeDocPath} -> ${locale} (${LOCALE_NAMES[locale]})`);
    const translated = await translator.translate({
      text: sourceContent,
      targetLocale: locale,
      contentType: 'mdx',
    });

    const outputPath = docOutputPath(locale, relativeDocPath);
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    fs.writeFileSync(outputPath, translated.endsWith('\n') ? translated : `${translated}\n`, 'utf8');

    cache.entries[entryKey] = {
      sourceHash,
      updatedAt: new Date().toISOString(),
    };
    count += 1;
  }

  return count;
}

async function processJson(translator, locale, cache, args) {
  if (args.syncStructure) {
    syncJsonStructure(locale);
  }

  const {batch, batchMeta} = collectJsonTranslationBatch(locale, cache);

  if (args.check) {
    if (Object.keys(batch).length > 0) {
      console.error(
        `Stale translation: ${Object.keys(batch).length} JSON strings (${locale})`,
      );
    }
    return Object.keys(batch).length;
  }

  const targetDataByFile = {};
  const count = await translateJsonBatch(
    translator,
    locale,
    batch,
    batchMeta,
    targetDataByFile,
    cache,
    args.dryRun,
  );

  if (!args.dryRun) {
    for (const [filePath, data] of Object.entries(targetDataByFile)) {
      writeJson(filePath, data);
    }
  }

  return count;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const cache = loadCache();
  let totalStale = 0;

  if (args.check) {
    for (const locale of args.locales) {
      totalStale += await processDocs(null, locale, cache, args);
      totalStale += await processJson(null, locale, cache, args);
    }
    if (totalStale > 0) {
      console.error(`\n${totalStale} stale translation(s) found. Run: npm run i18n:translate`);
      process.exit(1);
    }
    console.log('All translations are up to date.');
    process.exit(0);
  }

  const translator = createTranslator();
  let totalTranslated = 0;

  for (const locale of args.locales) {
    console.log(`\n=== Locale: ${locale} (${LOCALE_NAMES[locale]}) ===`);
    if (args.syncStructure) {
      syncJsonStructure(locale);
    }
    totalTranslated += await processJson(translator, locale, cache, args);
    totalTranslated += await processDocs(translator, locale, cache, args);
  }

  if (!args.dryRun) {
    saveCache(cache);
  }

  console.log(`\nDone. ${totalTranslated} item(s) processed.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
