#!/usr/bin/env node
/**
 * Apply bundled UI string translations from scripts/i18n-ui-translations.json.
 * Used for initial locale setup; ongoing updates use npm run i18n:translate.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OVERRIDES_PATH = path.join(__dirname, 'i18n-ui-translations.json');
const JSON_MAP = {
  'code.json': 'code.json',
  'navbar.json': 'docusaurus-theme-classic/navbar.json',
  'footer.json': 'docusaurus-theme-classic/footer.json',
  'current.json': 'docusaurus-plugin-content-docs/current.json',
};

function applyOverrides() {
  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));

  for (const [locale, files] of Object.entries(overrides)) {
    for (const [fileKey, messages] of Object.entries(files)) {
      const relativePath = JSON_MAP[fileKey];
      if (!relativePath) {
        console.warn(`Unknown file key: ${fileKey}`);
        continue;
      }

      const targetPath = path.join(ROOT, 'i18n', locale, relativePath);
      if (!fs.existsSync(targetPath)) {
        console.warn(`Missing target file: ${targetPath}`);
        continue;
      }

      const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      let updated = 0;

      for (const [key, message] of Object.entries(messages)) {
        if (data[key]) {
          data[key].message = message;
          updated += 1;
        }
      }

      fs.writeFileSync(targetPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      console.log(`Applied ${updated} override(s) to i18n/${locale}/${relativePath}`);
    }
  }
}

applyOverrides();
