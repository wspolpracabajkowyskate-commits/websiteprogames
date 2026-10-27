// Final homepage metadata, shared by production and local builds.
// Only homepage titles omit the brand; product and editorial titles remain specific.
const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');
process.chdir(path.resolve(__dirname, '..'));
// Align visible Polish manufacturer copy as well as metadata, including older static sources.
for (const file of ['pl/index.html', 'pl/producent-automatow-bokserskich.html']) {
  const source = fs.readFileSync(file, 'utf8');
  const updated = source
    .replaceAll('PRO-GAMES projektuje i produkuje automaty bokserskie w Jastrzębiu-Zdroju.', 'PRO-GAMES to polski producent automatów bokserskich z Jastrzębia-Zdroju.')
    .replaceAll('PRO-GAMES (PRO-GAMES POLAND Sp. z o.o.) projektuje i produkuje automaty bokserskie w Jastrzębiu-Zdroju.', 'PRO-GAMES to polski producent automatów bokserskich z Jastrzębia-Zdroju.');
  if (updated !== source) fs.writeFileSync(file, updated);
}
const config = require('./home-seo.json');
const pages = JSON.parse(fs.readFileSync('build/pages.json', 'utf8'));
for (const [file, copy] of Object.entries(config)) {
  const source = fs.readFileSync(file, 'utf8');
  const { document } = parseHTML(source);
  document.title = copy.title;
  for (const [selector, value] of [
    ['meta[name="description"]', copy.description],
    ['meta[property="og:title"]', copy.title],
    ['meta[name="twitter:title"]', copy.title],
    ['meta[property="og:description"]', copy.description],
    ['meta[name="twitter:description"]', copy.description],
    ['meta[property="og:site_name"]', 'PRO-GAMES'],
  ]) {
    const element = document.querySelector(selector);
    if (!element) throw Error(`Missing ${selector} in ${file}`);
    element.setAttribute('content', value);
  }
  const canonical = document.querySelector('link[rel="canonical"]').href;
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    const data = JSON.parse(script.textContent);
    function update(node) {
      if (!node || typeof node !== 'object') return;
      if (['WebPage', 'CollectionPage'].includes(node['@type']) && node.url === canonical) {
        node.name = copy.title;
        node.description = copy.description;
      }
      for (const child of Object.values(node)) if (typeof child === 'object') {
        if (Array.isArray(child)) child.forEach(update); else update(child);
      }
    }
    update(data);
    script.textContent = JSON.stringify(data).replaceAll('<', '\\u003c');
  }
  fs.writeFileSync(file, '<!doctype html>\n' + document.documentElement.outerHTML + '\n');
  const entry = pages.find(page => page.filename === file);
  if (!entry) throw Error('Homepage missing from manifest: ' + file);
  entry.title = copy.title;
}
fs.writeFileSync('build/pages.json', JSON.stringify(pages, null, 2) + '\n');
console.log('PL/EN homepage SEO: manufacturer first, consistent PRO-GAMES brand.');
