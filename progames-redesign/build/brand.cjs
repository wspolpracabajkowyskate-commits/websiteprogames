/* Brand normalisation: the brand is written PRO-GAMES (capitals, with a hyphen), as on the
   logo and on all social profiles.
   Kept unchanged on purpose:
   - the legal entity PRO GAMES POLAND Sp. z o.o. (registered company name);
   - third-party spellings quoted as such (UPlay "Pro-Games Poland");
   - schema.org alternateName lists (they connect old spellings with the brand);
   - mail subjects / form handlers (site-config.js, api/) and the 3D configurator.
   Logo alt text keeps POLAND, because the wordmark reads PRO-GAMES POLAND.
   Idempotent. Usage: node build/brand.cjs [--check] */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');

const PROTECT = [
  /PRO GAMES POLAND Sp\. z o\.o\./g,
  /Pro Games Poland Sp\. z o\.o\./g,
  /\\?"alternateName\\?":\s*\[[^\]]*\]/g,
  /PRO-GAMES POLAND/g,
  /Pro-Games Poland/g,
  // "variants used by partners" sentences must keep the variant they cite
  /Pro Games Poland in partner/g,
  /zapisy Pro Games Poland/g,
  /Are Pro Games Poland,/g,
  /Czy Pro Games Poland,/g,
];
const BRAND = /\b(?:Pro Games|PRO GAMES|ProGames|PROGAMES|Pro-Games|PRO-GAMES)(?: Poland| POLAND)?\b/g;

function normalizeBrand(text) {
  const kept = [];
  // the wordmark image reads "PRO-GAMES POLAND": keep POLAND in its alt text
  let out = text.replace(/(alt=\\?"|\balt:\s*')PRO GAMES POLAND/g, '$1PRO-GAMES POLAND');
  for (const re of PROTECT) out = out.replace(re, m => `\u0000${kept.push(m) - 1}\u0000`);
  out = out.replace(BRAND, 'PRO-GAMES');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

const SKIP_DIRS = new Set(['node_modules', 'creator', 'creator-assets', 'api', 'assets', '.git', 'verification-output']);
const SKIP_FILES = new Set(['site-config.js', 'contact.js', 'brand.cjs', 'entity-schema.cjs', 'entity-content.cjs', 'check-entity.cjs', 'check-contact-label.cjs']);
const EXT = /\.(html|js|cjs|json|tsv|xml)$/;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) yield* walk(path.join(dir, e.name));
      else if (e.name === 'assets' && dir === root) yield* walk(path.join(dir, e.name, 'data')); // product data shown on the site
    }
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
    console.log('Brand check: PRO-GAMES consistent.');
  } else console.log(`Brand normalised in ${changed} files.`);
}
module.exports = { normalizeBrand };
