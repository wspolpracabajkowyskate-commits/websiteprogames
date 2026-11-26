/* Brand normalisation: the company / brand name is written exactly PRO-GAMES POLAND
   (capitals, hyphen, POLAND), as on the wordmark - in headings, body copy, meta titles and
   descriptions, alt texts and structured data. Legal name: PRO-GAMES POLAND Sp. z o.o.
   Never touched: URLs, e-mail addresses (@progames.pl), social handles, class names / ids
   (the patterns need a word boundary and capitals, so progames.pl, progamespoland.com,
   .progames-x, PROGAMES_X do not match).
   Kept unchanged on purpose:
   - schema.org alternateName lists (they connect old spellings with the brand);
   - the FAQ / note that explains the spelling variants themselves;
   - the pixel-art wordmark drawn by the browser game (games/monster-game*.js);
   - mail subjects / form handlers (site-config.js, api/) and the 3D configurator.
   Logo alt text keeps POLAND, because the wordmark reads PRO-GAMES POLAND.
   Idempotent. Usage: node build/brand.cjs [--check] */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');

const LISTS = /\\?"alternateName\\?":\s*\[[^\]]*\]/g;
const PROTECT = [
  // "variants used by partners" sentences must keep the variant they cite
  /also appears as Pro Games Poland or Pro-Games Poland/g,
  /zapisy Pro Games Poland i Pro-Games Poland/g,
  /(?:Are|Czy) Pro Games Poland, ProGames (?:and|i) PRO-GAMES POLAND/g,
];
const BRAND = /\b(?:Pro Games|PRO GAMES|ProGames|PROGAMES|Pro-Games|PRO-GAMES)(?: Poland| POLAND)?\b/g;

function normalizeBrand(text) {
  const kept = [];
  const hold = m => `\u0000${kept.push(m) - 1}\u0000`;
  // alternateName lists keep every spelling (old ones connect the brand's history)
  let out = text.replace(LISTS, hold);
  // company name in company data and the footer
  out = out.replace(/(?:PRO GAMES POLAND|Pro Games Poland|PRO-GAMES POLAND) Sp\. z o\.o\./g, 'PRO-GAMES POLAND Sp. z o.o.');
  for (const re of PROTECT) out = out.replace(re, hold);
  out = out.replace(BRAND, 'PRO-GAMES POLAND');
  // lower-case search index text (data-search attributes)
  out = out.replace(/(data-search=\\?"[^"\\]*?)\bpro games\b(?! poland)/g, '$1pro-games poland');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => kept[+i]);
}

const SKIP_DIRS = new Set(['node_modules', 'creator', 'creator-assets', 'api', 'assets', '.git', 'verification-output']);
const SKIP_FILES = new Set(['monster-game.js', 'monster-game-levels.js', 'site-config.js', 'contact.js', 'brand.cjs', 'entity-schema.cjs', 'entity-content.cjs', 'check-entity.cjs', 'check-contact-label.cjs']);
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
    console.log('Brand check: PRO-GAMES POLAND consistent.');
  } else console.log(`Brand normalised in ${changed} files.`);
}
module.exports = { normalizeBrand };
