/* Entity checks without dependencies: brand name, official domain, producer vs distributed. */
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.resolve(__dirname, '..'), origin = 'https://www.progamespoland.com';
const ORG = origin + '/#organization';
let pages = 0, orgs = 0, own = 0, dist = 0;
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!['node_modules', 'creator', 'creator-assets', 'assets', 'api', '.git', 'verification'].includes(e.name)) yield* walk(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name);
  }
}
for (const file of walk(root)) {
  const html = fs.readFileSync(file, 'utf8'), rel = path.relative(root, file);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  if (!/noindex/.test(html) && title) {
    pages++;
    assert(!/\b(Pro ?Games|ProGames|PROGAMES|Pro-Games)\b/.test(title), 'Old brand spelling in title: ' + rel);
    const canonical = (html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/) || html.match(/<link[^>]+href="([^"]+)"[^>]*rel="canonical"/) || [])[1];
    if (canonical) assert(canonical.startsWith(origin + '/'), 'Canonical outside official domain: ' + rel);
  }
  for (const [, body] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(body);
    const items = Array.isArray(data) ? data : data['@graph'] || [data];
    for (const it of items) {
      if (it['@type'] === 'Organization' && it['@id'] === ORG) {
        orgs++;
        assert.equal(it.name, 'PRO GAMES', rel);
        assert.equal(it.url, origin + '/', rel);
        assert.equal(it.legalName, 'PRO GAMES POLAND Sp. z o.o.', rel);
        assert(it.sameAs.every(u => u.startsWith('https://')), rel);
      }
      if (it['@type'] === 'Product') {
        if (it.manufacturer) { own++; assert.equal(it.manufacturer['@id'], ORG, rel); assert.equal(it.brand && it.brand.name, 'PRO GAMES', rel); }
        else { dist++; assert(!it.brand, 'Distributed product must not carry the PRO GAMES brand: ' + rel); }
      }
    }
  }
}
assert(orgs > 0 && own > 0 && dist > 0);
console.log(`Entity check: ${pages} pages, ${orgs} Organization blocks, ${own} manufactured / ${dist} distributed products OK.`);
