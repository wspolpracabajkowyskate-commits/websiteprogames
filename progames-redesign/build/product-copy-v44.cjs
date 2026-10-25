/* Unique product descriptions for models whose description repeated another model's text.
   Sets the visible .detail-lead and the matching Product JSON-LD description in the five
   static locales; the eight extra locales translate the new English text through
   i18n/extra/product-copy-v44.tsv. Only the products listed in build/product-copy-v44.json
   are touched. No dependencies, idempotent. Run before build/extra-languages.cjs. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const copy = JSON.parse(fs.readFileSync(path.join(root, 'build/product-copy-v44.json'), 'utf8'));
const pages = JSON.parse(fs.readFileSync(path.join(root, 'build/pages.json'), 'utf8'));
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

let changed = 0, checked = 0;
for (const [lang, products] of Object.entries(copy)) {
  if (lang.startsWith('_')) continue;
  for (const [key, paragraphs] of Object.entries(products)) {
    const page = pages.find(p => p.kind === 'product' && p.lang === lang && p.key === key);
    if (!page) throw Error(`No ${lang} product page for ${key}`);
    const file = path.join(root, page.filename);
    const src = fs.readFileSync(file, 'utf8');
    const lead = `<div class="detail-lead">${paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n')}</div>`;
    let out = src.replace(/<div class="detail-lead">[\s\S]*?<\/div>/, () => lead);
    if (out === src && !src.includes(lead)) throw Error(`No .detail-lead in ${page.filename}`);
    let found = false;
    out = out.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, open, json, close) => {
      let obj; try { obj = JSON.parse(json); } catch { return all; }
      if (obj['@type'] !== 'Product') return all;
      found = true;
      obj.description = paragraphs.join('\n\n');
      return open + JSON.stringify(obj).replaceAll('<', '\\u003c') + close;
    });
    if (!found) throw Error(`No Product JSON-LD in ${page.filename}`);
    checked++;
    if (out !== src) { fs.writeFileSync(file, out); changed++; }
  }
}
console.log(`Unique product copy: ${checked} pages checked, ${changed} updated.`);
