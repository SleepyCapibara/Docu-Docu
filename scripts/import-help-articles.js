const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(__dirname, 'help-center-imports.json');

function parseArgs(argv) {
  const args = {
    manifest: MANIFEST_PATH,
    slug: null,
    url: null,
    section: null,
    dryRun: false,
    skipBuild: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slug' && argv[i + 1]) {
      args.slug = argv[++i];
    } else if (arg === '--url' && argv[i + 1]) {
      args.url = argv[++i];
    } else if (arg === '--section' && argv[i + 1]) {
      args.section = argv[++i];
    } else if (arg === '--manifest' && argv[i + 1]) {
      args.manifest = path.resolve(argv[++i]);
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--skip-build') {
      args.skipBuild = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Import SOC Prime help center articles into Docusaurus MDX.

Usage:
  node scripts/import-help-articles.js
  node scripts/import-help-articles.js --slug search
  node scripts/import-help-articles.js --url <help-center-url> --slug <slug> --section <section>

Options:
  --slug <slug>         Import one article from the manifest by slug
  --url <url>           Import a single article URL (requires --slug and --section)
  --section <section>   Docs subfolder under docs/product (required with --url)
  --manifest <path>   Manifest JSON path (default: scripts/help-center-imports.json)
  --dry-run             Fetch and parse only; do not write files
  --skip-build          Do not run npm run build after import
  --help                Show this help text
`);
}

function stripHtml(s) {
  return s
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
      const label = stripHtml(text);
      if (!href || href.startsWith('#')) return label;
      return `[${label}](${href.replace(/&amp;/g, '&')})`;
    })
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchUrl(res.headers.location));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          return resolve(download(res.headers.location, dest));
        }
        if (res.statusCode !== 200) {
          file.close();
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(dest)));
      })
      .on('error', (err) => {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(err);
      });
  });
}

function extFromUrl(url) {
  if (url.includes('.png')) return '.png';
  if (url.includes('.jpg') || url.includes('.jpeg')) return '.jpg';
  if (url.includes('.webp')) return '.webp';
  if (url.includes('.gif')) return '.gif';
  return '.png';
}

function toIsoDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function extractArticleMeta(html) {
  const meta = {
    title: null,
    subtitle: null,
    author: null,
    dateModified: null,
    startMarker: null,
  };

  const ldMatches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const match of ldMatches) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Article') {
        meta.title = data.headline || meta.title;
        meta.subtitle = data.description || meta.subtitle;
        if (data.author?.name) meta.author = data.author.name;
        if (data.dateModified) meta.dateModified = data.dateModified;
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  const articleIdx = html.indexOf('article_body');
  if (articleIdx > -1) {
    const slice = html.slice(articleIdx, articleIdx + 12000);
    const paras = [...slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
      .map((m) => stripHtml(m[1]))
      .filter((text) => text.length > 20);
    if (paras[0]) meta.startMarker = paras[0].slice(0, 80);
  }

  return meta;
}

function parseNestedList(content, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  const listMatch = content.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!listMatch) return [];

  const items = [];
  const liRegex = /<li>([\s\S]*?)<\/li>/g;
  let m;
  while ((m = liRegex.exec(listMatch[1])) !== null) {
    const liContent = m[1];
    const paraMatch = liContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const text = paraMatch ? stripHtml(paraMatch[1]) : stripHtml(liContent);
    const item = { text, children: [], ordered: false };

    const nestedUl = liContent.match(
      /intercom-interblocks-unordered-nested-list[^>]*>([\s\S]*?)(?=<div class="intercom-interblocks-(?!unordered-nested-list)|$)/,
    );
    const nestedOl = liContent.match(
      /intercom-interblocks-ordered-nested-list[^>]*>([\s\S]*?)(?=<div class="intercom-interblocks-(?!ordered-nested-list)|$)/,
    );

    if (nestedUl) {
      item.children = parseNestedList(nestedUl[1], false);
    } else if (nestedOl) {
      item.children = parseNestedList(nestedOl[1], true);
      item.ordered = true;
    }

    if (text || item.children.length) items.push(item);
  }

  return items;
}

function parseTable(content, imageMap) {
  if (content.includes('In this article:')) return null;

  const rows = [...content.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) => {
    return [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => {
      const cellContent = cell[1];
      const img = cellContent.match(/<img[^>]+src="([^"]+)"/);
      if (img) {
        const local = imageMap.get(img[1].replace(/&amp;/g, '&'));
        return local ? `![](${local})` : '';
      }
      return stripHtml(cellContent);
    });
  });

  if (!rows.length) return null;
  return rows;
}

function getArticleBody(html, startMarker) {
  const markerIdx = html.indexOf(startMarker);
  if (markerIdx === -1) {
    throw new Error(`startMarker not found in HTML: "${startMarker}"`);
  }
  const articleIdx = html.lastIndexOf('article_body', markerIdx);
  const end = html.indexOf('intercom-reaction-picker', markerIdx);
  const sliceStart = articleIdx > -1 ? articleIdx : markerIdx;
  return html.slice(sliceStart, end > sliceStart ? end : undefined);
}

function parseArticle(html, startMarker) {
  const body = getArticleBody(html, startMarker);
  const articleMatch = body.match(/<article[^>]*>([\s\S]*)/);
  const articleContent = articleMatch ? articleMatch[1] : body;

  const blockTypes = [
    'subheading',
    'paragraph',
    'image',
    'unordered-nested-list',
    'ordered-nested-list',
    'horizontal-rule',
    'table',
  ];
  const blockRegex = new RegExp(
    `<div class="intercom-interblocks-(${blockTypes.join('|')})`,
    'g',
  );

  const matches = [...articleContent.matchAll(blockRegex)].filter((match) => {
    const prefix = articleContent.slice(Math.max(0, match.index - 40), match.index);
    return (
      !prefix.includes('<li>') &&
      !prefix.includes('ordered-nested-list') &&
      !prefix.includes('unordered-nested-list') &&
      !prefix.includes('<td>')
    );
  });

  const blocks = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : articleContent.length;
    const chunk = articleContent.slice(start, end);
    const type = matches[i][1];
    const content = chunk
      .replace(/^<div class="intercom-interblocks-[^"]*"[^>]*>/, '')
      .replace(/<\/div>\s*$/, '');

    if (type === 'subheading') {
      const h = content.match(/<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/);
      if (h) blocks.push({ type: 'subheading', level: Number(h[1]), text: stripHtml(h[2]) });
    } else if (type === 'paragraph') {
      const paras = [...content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
      for (const p of paras) {
        const text = stripHtml(p[1]);
        if (text) blocks.push({ type: 'paragraph', text });
      }
    } else if (type === 'image') {
      const im = content.match(/<img[^>]+src="([^"]+)"/);
      if (im) blocks.push({ type: 'image', src: im[1].replace(/&amp;/g, '&') });
    } else if (type === 'unordered-nested-list') {
      const items = parseNestedList(content, false);
      if (items.length) blocks.push({ type: 'list', ordered: false, items });
    } else if (type === 'ordered-nested-list') {
      const items = parseNestedList(content, true);
      if (items.length) blocks.push({ type: 'list', ordered: true, items });
    } else if (type === 'horizontal-rule') {
      blocks.push({ type: 'hr' });
    } else if (type === 'table') {
      blocks.push({ type: 'table', content });
    }
  }

  return blocks;
}

function renderListItems(items, ordered, lines, indent = 0) {
  const pad = '  '.repeat(indent);
  items.forEach((item, idx) => {
    const prefix = ordered ? `${idx + 1}. ` : '- ';
    lines.push(`${pad}${prefix}${item.text}`);
    if (item.children?.length) {
      renderListItems(item.children, item.ordered ?? false, lines, indent + 1);
    }
  });
}

function blocksToMdx(blocks, imageMap) {
  const lines = [];
  let inNote = false;

  for (const block of blocks) {
    if (block.type === 'subheading') {
      inNote = false;
      const hashes = '#'.repeat(Math.min(block.level, 6));
      lines.push('', `${hashes} ${block.text}`, '');
    } else if (block.type === 'paragraph') {
      if (block.text === '**Note:**' || block.text === 'Note:') {
        inNote = true;
        lines.push('', '> **Note:**');
        continue;
      }

      if (inNote && !block.text.startsWith('**Tip:**') && !block.text.startsWith('Tip:')) {
        lines.push(`> ${block.text}`);
        if (!block.text.endsWith(':')) inNote = false;
        continue;
      }

      inNote = false;

      if (block.text.startsWith('**Note:**')) {
        lines.push('', `> ${block.text}`, '');
      } else if (block.text.startsWith('**Tip:**') || block.text.startsWith('Tip:')) {
        lines.push('', `> ${block.text.replace(/^Tip:/, '**Tip:**')}`, '');
      } else {
        lines.push(block.text, '');
      }
    } else if (block.type === 'image') {
      inNote = false;
      const local = imageMap.get(block.src);
      if (local) lines.push(`![Product screenshot](${local})`, '');
    } else if (block.type === 'list') {
      inNote = false;
      renderListItems(block.items, block.ordered, lines);
      lines.push('');
    } else if (block.type === 'table') {
      inNote = false;
      const rows = parseTable(block.content, imageMap);
      if (rows?.length) {
        const header = rows[0];
        lines.push(
          '',
          `| ${header.join(' | ')} |`,
          `| ${header.map(() => '---').join(' | ')} |`,
        );
        rows.slice(1).forEach((row) => lines.push(`| ${row.join(' | ')} |`));
        lines.push('');
      }
    } else if (block.type === 'hr') {
      inNote = false;
      lines.push('---', '');
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function ensureSectionCategory(sectionPath, sectionConfig) {
  const categoryFile = path.join(sectionPath, '_category_.json');
  if (fs.existsSync(categoryFile) || !sectionConfig?.label) return;

  const category = {
    label: sectionConfig.label,
    position: sectionConfig.position ?? 99,
    link: {
      type: 'generated-index',
      description: sectionConfig.description ?? `Guides for ${sectionConfig.label}.`,
    },
  };

  fs.writeFileSync(categoryFile, `${JSON.stringify(category, null, 2)}\n`, 'utf8');
  console.log(`Created ${path.relative(ROOT, categoryFile)}`);
}

function resolveArticleConfig(entry, manifest) {
  const docRoot = entry.docRoot ?? manifest.docRoot ?? 'docs/product';
  const imageRoot = entry.imageRoot ?? manifest.imageRoot ?? 'static/img/docs';
  const section = entry.section;
  const slug = entry.slug;

  if (!section || !slug) {
    throw new Error('Each article needs section and slug');
  }

  return {
    url: entry.url,
    slug,
    section,
    title: entry.title,
    subtitle: entry.subtitle ?? null,
    author: entry.author ?? null,
    updated: entry.updated ?? null,
    startMarker: entry.startMarker,
    sidebarPosition: entry.sidebarPosition ?? 99,
    outFile: path.join(docRoot, section, `${slug}.mdx`),
    imageDir: path.join(imageRoot, section, slug),
    imagePublicBase: `/img/docs/${section}/${slug}`,
    sectionConfig: entry.sectionConfig ?? manifest.sections?.[section] ?? null,
  };
}

async function processArticle(article, { dryRun = false } = {}) {
  console.log(`\nImporting ${article.slug} from ${article.url}`);

  const html = await fetchUrl(article.url);
  const extracted = extractArticleMeta(html);

  const title = article.title || extracted.title || article.slug;
  const subtitle = article.subtitle ?? extracted.subtitle;
  const author = article.author || extracted.author;
  const startMarker = article.startMarker || extracted.startMarker;

  if (!startMarker) {
    throw new Error(
      `Could not determine startMarker for ${article.slug}. Add startMarker to the manifest.`,
    );
  }

  const blocks = parseArticle(html, startMarker);
  const imageDir = path.join(ROOT, article.imageDir);
  const outFile = path.join(ROOT, article.outFile);
  const sectionDir = path.dirname(outFile);

  if (dryRun) {
    const imageCount = blocks.filter((b) => b.type === 'image').length;
    console.log(
      `Dry run: ${blocks.length} blocks, ${imageCount} images, startMarker="${startMarker.slice(0, 60)}..."`,
    );
    return { slug: article.slug, blocks: blocks.length, images: imageCount };
  }

  fs.mkdirSync(imageDir, { recursive: true });
  fs.mkdirSync(sectionDir, { recursive: true });
  ensureSectionCategory(sectionDir, article.sectionConfig);

  const imageMap = new Map();
  let imageIndex = 1;
  const uniqueUrls = [...new Set(blocks.filter((b) => b.type === 'image').map((b) => b.src))];

  for (const block of blocks.filter((b) => b.type === 'table')) {
    const imgs = [...block.content.matchAll(/<img[^>]+src="([^"]+)"/g)];
    for (const img of imgs) uniqueUrls.push(img[1].replace(/&amp;/g, '&'));
  }

  const allUrls = [...new Set(uniqueUrls)];

  for (const url of allUrls) {
    const ext = extFromUrl(url);
    const filename = `${String(imageIndex).padStart(2, '0')}${ext}`;
    const dest = path.join(imageDir, filename);
    const publicPath = `${article.imagePublicBase}/${filename}`;

    if (!fs.existsSync(dest)) {
      try {
        await download(url, dest);
        console.log(`  Downloaded ${filename}`);
      } catch (err) {
        console.error(`  Failed ${url}: ${err.message}`);
        continue;
      }
    }

    imageMap.set(url, publicPath);
    imageIndex += 1;
  }

  const body = blocksToMdx(blocks, imageMap);
  const lastUpdateDate = toIsoDate(article.updated) || toIsoDate(extracted.dateModified);
  const yamlLines = ['---', `sidebar_position: ${article.sidebarPosition}`];
  if (author) {
    yamlLines.push('authors:');
    yamlLines.push(`  - ${author}`);
    yamlLines.push(`original_author: ${author}`);
  }
  if (lastUpdateDate && author) {
    yamlLines.push('last_update:');
    yamlLines.push(`  date: ${lastUpdateDate}`);
    yamlLines.push(`  author: ${author}`);
  }
  if (article.updated) {
    yamlLines.push(`display_date: ${article.updated}`);
  }
  yamlLines.push('---');

  const frontmatter = [...yamlLines, ''];
  if (author) {
    frontmatter.push(`import DocAuthors from '@site/src/components/DocAuthors';`, '');
  }
  frontmatter.push(`# ${title}`, '');

  if (subtitle) frontmatter.push(subtitle, '');
  if (author) {
    frontmatter.push(
      `<DocAuthors authors={["${author}"]}${article.updated ? ` date="${article.updated}"` : ''} />`,
      '',
    );
  } else if (article.updated) {
    frontmatter.push(`*${article.updated}*`, '');
  }
  frontmatter.push(body, '');

  fs.writeFileSync(outFile, frontmatter.join('\n'), 'utf8');
  console.log(`  Wrote ${path.relative(ROOT, outFile)} (${imageMap.size} images)`);

  return { slug: article.slug, images: imageMap.size, outFile };
}

function loadManifest(manifestPath) {
  const raw = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(raw);
}

function selectArticles(manifest, args) {
  if (args.url) {
    if (!args.slug || !args.section) {
      throw new Error('--url requires --slug and --section');
    }
    return [
      resolveArticleConfig(
        {
          url: args.url,
          slug: args.slug,
          section: args.section,
          sidebarPosition: 99,
        },
        manifest,
      ),
    ];
  }

  const entries = manifest.articles || [];
  const filtered = args.slug ? entries.filter((entry) => entry.slug === args.slug) : entries;

  if (args.slug && filtered.length === 0) {
    throw new Error(`No manifest entry found for slug "${args.slug}"`);
  }

  return filtered.map((entry) => resolveArticleConfig(entry, manifest));
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const manifest = loadManifest(args.manifest);
  const articles = selectArticles(manifest, args);

  const results = [];
  for (const article of articles) {
    results.push(await processArticle(article, { dryRun: args.dryRun }));
  }

  if (!args.dryRun && !args.skipBuild && results.length > 0) {
    const { execSync } = require('child_process');
    console.log('\nRunning npm run build...');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  }

  console.log(`\nImported ${results.length} article(s).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
