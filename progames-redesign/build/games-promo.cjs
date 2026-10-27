/* Publish the games entry points after locale generation. Keep the artwork layered
   and the CTA as real, localized text (including in builds without JavaScript). */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const labels = {en:'PLAY',pl:'ZAGRAJ',es:'JUGAR',de:'SPIELEN',fr:'JOUER',el:'ΠΑΙΞΕ',it:'GIOCA',ar:'العب',ro:'JOACĂ',cs:'HRÁT',hu:'JÁTSSZ',ru:'ИГРАТЬ',bg:'ИГРАЙ'};
// link straight to the game page in the page's language (no redirect hop for visitors and Google)
const gamesURL = lang => lang === 'pl' ? '/pl/gry/' : '/games/';
const asset = name => '/assets/games-banner/' + name + '.webp';
function banner(lang) {
  return `\n    <section class="games-promo section-dark" aria-label="GAMES MONSTER" data-no-translate>
      <div class="games-promo-card" dir="ltr">
        <img class="games-promo-background" src="${asset('background')}" alt="" width="2048" height="682" loading="lazy" decoding="async">
        <img class="games-promo-lightning" src="${asset('lightning')}" alt="" width="2048" height="682" loading="lazy" decoding="async">
        <img class="games-promo-monster" src="${asset('monster')}" alt="" width="1254" height="1254" loading="lazy" decoding="async">
        <div class="games-promo-content">
          <img class="games-promo-logo" src="${asset('logo')}" alt="GAMES MONSTER" width="1881" height="836" loading="lazy" decoding="async">
          <a class="games-promo-play" href="${gamesURL(lang)}" lang="${lang}">
            <img src="${asset('button')}" alt="" width="2048" height="682" loading="lazy" decoding="async">
            <span dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${labels[lang] || labels.en}</span>
          </a>
        </div>
      </div>
    </section>\n`;
}
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    if (['node_modules','.git','assets','creator-assets','build','verification'].includes(entry.name)) return [];
    const file = path.join(dir,entry.name);
    return entry.isDirectory() ? walk(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
let count = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file,'utf8');
  if (!html.includes('class="desktop-nav"')) continue;
  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] || 'en';
  // Remove our previous output before inserting it; this build can run repeatedly.
  html = html.replace(/\s*<a\b[^>]*class="games-nav-link"[^>]*>GAMES<\/a>/g, '');
  const href = gamesURL(lang);
  html = html.replace(/(<nav\b[^>]*class="desktop-nav"[^>]*>)([\s\S]*?)(<\/nav>)/g,
    (_,open,body,close) => open + body + '<a class="games-nav-link" href="' + href + '" data-no-translate>GAMES</a>' + close);
  html = html.replace(/(<div\b[^>]*class="mobile-nav"[^>]*>)/g,
    '$1<a class="games-nav-link" href="' + href + '" data-no-translate>GAMES</a>');
  html = html.replace(/\s*<section class="games-promo section-dark"[\s\S]*?<\/section>\s*/g, '\n');
  if (/<section\b[^>]*id="machines"/.test(html)) {
    html = html.replace(/(<section\b[^>]*id="machines"[^>]*>[\s\S]*?<\/section>)/, '$1' + banner(lang));
  }
  if (!html.includes('href="/games-promo.css?v=1"')) html = html.replace('</head>','<link rel="stylesheet" href="/games-promo.css?v=1">\n</head>');
  fs.writeFileSync(file, html);
  count++;
}
console.log(`Games navigation published on ${count} pages; localized banners follow the product catalogue.`);
