/* Publish the games entry points after locale generation. Keep the artwork layered
   and the CTA as real, localized text (including in builds without JavaScript). */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
// small heading above the banner, so it reads as the site's own game rather than an advert
const heads = {
  en:['OUR GAME','A free game by PRO-GAMES, inspired by our MONSTER 3in1 machine.'],
  pl:['NASZA GRA','Darmowa gra od PRO-GAMES inspirowana naszym automatem MONSTER 3in1.'],
  es:['NUESTRO JUEGO','Un juego gratuito de PRO-GAMES inspirado en nuestra máquina MONSTER 3in1.'],
  de:['UNSER SPIEL','Ein kostenloses Spiel von PRO-GAMES, inspiriert von unserem Automaten MONSTER 3in1.'],
  fr:['NOTRE JEU','Un jeu gratuit de PRO-GAMES, inspiré de notre machine MONSTER 3in1.'],
  el:['ΤΟ ΠΑΙΧΝΙΔΙ ΜΑΣ','Ένα δωρεάν παιχνίδι της PRO-GAMES, εμπνευσμένο από το μηχάνημά μας MONSTER 3in1.'],
  it:['IL NOSTRO GIOCO','Un gioco gratuito di PRO-GAMES, ispirato alla nostra macchina MONSTER 3in1.'],
  ar:['لعبتنا','لعبة مجانية من PRO-GAMES مستوحاة من جهازنا MONSTER 3in1.'],
  ro:['JOCUL NOSTRU','Un joc gratuit de la PRO-GAMES, inspirat de automatul nostru MONSTER 3in1.'],
  cs:['NAŠE HRA','Hra zdarma od PRO-GAMES inspirovaná naším automatem MONSTER 3in1.'],
  hu:['A MI JÁTÉKUNK','Ingyenes játék a PRO-GAMES-től, a MONSTER 3in1 gépünk ihlette.'],
  ru:['НАША ИГРА','Бесплатная игра от PRO-GAMES по мотивам нашего автомата MONSTER 3in1.'],
  bg:['НАШАТА ИГРА','Безплатна игра от PRO-GAMES, вдъхновена от нашия автомат MONSTER 3in1.']
};
// headline under the logo, also real localized text (not baked into the artwork)
const taglines = {en:'BEAT YOUR HIGH SCORE!',pl:'POBIJ SWÓJ REKORD!',es:'¡SUPERA TU RÉCORD!',de:'KNACK DEINEN REKORD!',fr:'BATS TON RECORD !',el:'ΣΠΑΣΕ ΤΟ ΡΕΚΟΡ ΣΟΥ!',it:'BATTI IL TUO RECORD!',ar:'حطّم رقمك القياسي!',ro:'BATE-ȚI RECORDUL!',cs:'PŘEKONEJ SVŮJ REKORD!',hu:'DÖNTSD MEG A REKORDOD!',ru:'ПОБЕЙ СВОЙ РЕКОРД!',bg:'ПОДОБРИ РЕКОРДА СИ!'};
const labels = {en:'PLAY',pl:'ZAGRAJ',es:'JUGAR',de:'SPIELEN',fr:'JOUER',el:'ΠΑΙΞΕ',it:'GIOCA',ar:'العب',ro:'JOACĂ',cs:'HRÁT',hu:'JÁTSSZ',ru:'ИГРАТЬ',bg:'ИГРАЙ'};
// link straight to the game page in the page's language (no redirect hop for visitors and Google)
const gamesURL = lang => lang === 'pl' ? '/pl/gry/' : '/games/';
const asset = name => '/assets/games-banner/' + name + '.webp';
// The banner sits below the long product grid, so native lazy loading often starts it
// too late and visitors scrolling down saw an empty card first. Start fetching the
// layers a few screens ahead instead (still lazy for visitors who never scroll).
const earlyLoad = "(function(){var s=document.currentScript.parentNode,i=s.querySelectorAll('img[loading=lazy]');"
  + "function go(){i.forEach(function(m){m.loading='eager'})}"
  + "if(!('IntersectionObserver'in window))return go();"
  + "var o=new IntersectionObserver(function(e){if(e.some(function(x){return x.isIntersecting})){o.disconnect();go()}},{rootMargin:'3000px 0px'});o.observe(s)})()";
// longer translations get a proportionally smaller headline so every language fits the same space
const tagScale = lang => Math.min(1, 19 / [...(taglines[lang] || taglines.en)].length).toFixed(3);
function banner(lang) {
  return `\n    <section class="games-promo section-dark" aria-label="GAMES MONSTER" data-no-translate>
      <div class="games-promo-head" lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
        <p class="games-promo-kicker">${(heads[lang] || heads.en)[0]}</p>
        <p class="games-promo-intro">${(heads[lang] || heads.en)[1]}</p>
      </div>
      <div class="games-promo-card" dir="ltr">
        <img class="games-promo-background" src="${asset('background')}" alt="" width="2048" height="682" loading="lazy" decoding="async">
        <img class="games-promo-lightning" src="${asset('lightning')}" alt="" width="2048" height="682" loading="lazy" decoding="async">
        <img class="games-promo-monster" src="${asset('monster')}" alt="" width="1254" height="1254" loading="lazy" decoding="async">
        <div class="games-promo-content">
          <img class="games-promo-logo" src="${asset('logo')}" alt="GAMES MONSTER" width="1881" height="836" loading="lazy" decoding="async">
          <p class="games-promo-tagline" style="--tl:${tagScale(lang)}" lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${taglines[lang] || taglines.en}</p>
          <a class="games-promo-play" href="${gamesURL(lang)}" lang="${lang}">
            <img src="${asset('button')}" alt="" width="2048" height="682" loading="lazy" decoding="async">
            <span dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${labels[lang] || labels.en}</span>
          </a>
        </div>
      </div>
      <script>${earlyLoad}</script>
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
  html = html.replace(/\s*<link rel="stylesheet" href="\/games-promo\.css\?v=\d+">/g, '');
  html = html.replace('</head>','<link rel="stylesheet" href="/games-promo.css?v=3">\n</head>');
  fs.writeFileSync(file, html);
  count++;
}
console.log(`Games navigation published on ${count} pages; localized banners follow the product catalogue.`);
