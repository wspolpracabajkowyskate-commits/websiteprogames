/* Brand normalisation: the brand is written PROGAMES (one word).
   Kept unchanged on purpose:
   - the legal entity PRO GAMES POLAND Sp. z o.o.;
   - third-party spellings quoted as such (IAAPA "PRO-GAMES POLAND", UPlay "Pro-Games Poland");
   - schema.org alternateName lists (they connect old spellings with the brand);
   - alt text of images whose pixels show the old lettering (wordmark, branch signs);
   - mail subjects / form handlers (site-config.js, api/) and the 3D configurator.
   Idempotent. Usage: node build/brand.cjs [--check] */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');

const PROTECT = [
  /PRO GAMES POLAND Sp\. z o\.o\./g,
  /Pro Games Poland Sp\. z o\.o\./g,
  /\\?"alternateName\\?":\s*\[[^\]]*\]/g,
  /PRO-GAMES POLAND/g,
  /Pro-Games Poland/g,
  /alt=\\?"(?:PRO GAMES POLAND|PRO GAMES POLAND EN ESPAÑA|PRO GAMES ARGENTINA)\\?"/g,
  /\balt:\s*'(?:PRO GAMES POLAND|PRO GAMES POLAND EN ESPAÑA|PRO GAMES ARGENTINA)'/g,
  // "variants used by partners" sentences must keep the variant they cite
  /Pro Games Poland in partner/g,
  /zapisy Pro Games Poland/g,
  /Are Pro Games Poland,/g,
  /Czy Pro Games Poland,/g,
];
const BRAND = /\b(?:Pro Games|PRO GAMES|ProGames|Pro-Games|PRO-GAMES)(?: Poland| POLAND)?\b/g;

function normalizeBrand(text) {
  const kept = [];
  let out = text;
  for (const re of PROTECT) out = out.replace(re, m => `\u0000${kept.push(m) - 1}\u0000`);
  out = out.replace(BRAND, 'PROGAMES');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

const SKIP_DIRS = new Set(['node_modules', 'creator', 'creator-assets', 'api', 'assets', '.git', 'verification-output']);
const SKIP_FILES = new Set(['site-config.js', 'contact.js', 'brand.cjs', 'entity-schema.cjs', 'entity-content.cjs', 'check-entity.cjs', 'check-contact-label.cjs']);
const EXT = /\.(html|js|cjs|json|tsv|xml)$/;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name)); }
    else if (EXT.test(e.name) && !SKIP_FILES.has(e.name)) yield path.join(dir, e.name);
  }
}

if (require.main === module) {
  const check = process.argv.includes('--check');
  let changed = 0, left = [];
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, 'utf8');
    const out = normalizeBrand(src);
    if (out !== src) { changed++; if (!check) fs.writeFileSync(file, out); }
    if (check && out !== src) left.push(path.relative(root, file));
  }
  if (check) {
    if (left.length) { console.error('Brand not normalised in:\n' + left.join('\n')); process.exit(1); }
    console.log('Brand check: PROGAMES consistent.');
  } else console.log(`Brand normalised in ${changed} files.`);
}
module.exports = { normalizeBrand };
