/* Entity schema: one Organization identity (#organization) on every page,
   explicit link between the PROGAMES brand and the official domain,
   Product.brand/manufacturer only for machines PROGAMES manufactures.
   Facts come from the published company details on this site; sameAs lists only
   profiles verified to describe this company (same address/phone/brand).
   Idempotent. Run after build:languages and build/brand.cjs. */
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const origin = 'https://www.progamespoland.com';
const ORG_ID = origin + '/#organization';

const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'PROGAMES',
  legalName: 'PRO GAMES POLAND Sp. z o.o.',
  alternateName: ['ProGames', 'Pro Games', 'Pro Games Poland', 'PRO-GAMES POLAND', 'Pro-Games Poland'],
  description: 'PROGAMES is a Polish manufacturer of commercial boxing arcade machines and amusement machines, based in Jastrzębie-Zdrój, Poland. Official website: https://www.progamespoland.com/.',
  url: origin + '/',
  logo: { '@type': 'ImageObject', url: origin + '/assets/progames-emblem-256.webp', width: 256, height: 256 },
  image: origin + '/assets/production/production-line.webp',
  brand: { '@type': 'Brand', name: 'PROGAMES', url: origin + '/' },
  knowsAbout: ['boxing arcade machines', 'boxer machines', 'kicker machines', 'strength tester machines', 'amusement machines', 'automaty bokserskie'],
  email: 'office@progames.pl',
  telephone: '+48 536 068 912',
  address: { '@type': 'PostalAddress', streetAddress: 'ul. Rybnicka 19A', postalCode: '44-335', addressLocality: 'Jastrzębie-Zdrój', addressCountry: 'PL' },
  taxID: '633-224-54-91',
  identifier: { '@type': 'PropertyValue', propertyID: 'REGON', value: '520986702' },
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'sales', email: 'office@progames.pl', telephone: '+48 536 068 912', availableLanguage: ['en', 'es', 'pl', 'de', 'fr'] },
    { '@type': 'ContactPoint', contactType: 'customer service', name: 'Service and spare parts', email: 'service@progames.pl', telephone: '+48 789 108 086', availableLanguage: ['en', 'es', 'pl', 'de', 'fr'] }
  ],
  sameAs: [
    'https://www.facebook.com/BoxerProgames',
    'https://www.instagram.com/progames.pl/',
    'https://iaapa.org/partners/marketplace/progames-poland'
  ],
  subjectOf: { '@id': origin + '/en/manufacturer.html#webpage' }
};

const CATEGORY = {
  boxer: 'Boxing arcade machine',
  combo: 'Boxing and kicking arcade machine',
  kids: 'Kids boxing arcade machine',
  strength: 'Strength tester arcade machine',
  distributed: 'Amusement machine (distributed by PROGAMES)'
};

function fix(item) {
  if (!item || typeof item !== 'object') return item;
  if (item['@id'] === ORG_ID && item['@type'] === 'Organization') {
    const ctx = item['@context'];
    const out = { ...ORGANIZATION };
    if (!ctx) delete out['@context'];
    return out;
  }
  if (item['@type'] === 'WebSite' && item['@id'] === origin + '/#website') {
    item.name = 'PROGAMES';
    item.alternateName = ['ProGames', 'progamespoland.com'];
    item.publisher = { '@id': ORG_ID };
  }
  if (item['@type'] === 'Product') {
    if (CATEGORY[item.category]) item.category = CATEGORY[item.category];
    if (item.manufacturer) {
      item.manufacturer = { '@type': 'Organization', '@id': ORG_ID, name: 'PROGAMES', url: origin + '/' };
      item.brand = { '@type': 'Brand', name: 'PROGAMES' };
      item.countryOfOrigin = 'PL';
    } else {
      delete item.brand; delete item.countryOfOrigin; // distributed: not presented as our brand
    }
  }
  return item;
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!['node_modules', 'creator', 'creator-assets', 'assets', 'api', '.git'].includes(e.name)) yield* walk(path.join(dir, e.name)); }
    else if (e.name.endsWith('.html')) yield path.join(dir, e.name);
  }
}

let files = 0, blocks = 0;
for (const file of walk(root)) {
  const src = fs.readFileSync(file, 'utf8');
  const out = src.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, body, c) => {
    let data; try { data = JSON.parse(body); } catch { return all; }
    if (Array.isArray(data)) data = data.map(fix);
    else if (data['@graph']) data['@graph'] = data['@graph'].map(fix);
    else data = fix(data);
    blocks++;
    return a + JSON.stringify(data).replaceAll('<', '\\u003c') + c;
  });
  if (out !== src) { fs.writeFileSync(file, out); files++; }
}
console.log(`Entity schema applied: ${files} files changed, ${blocks} JSON-LD blocks checked.`);
