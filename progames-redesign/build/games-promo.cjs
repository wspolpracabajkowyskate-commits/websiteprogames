/* Publish the games entry points after locale generation. Keep the artwork layered
   and the CTA as real, localized text (including in builds without JavaScript). */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
// small heading above the banner, so it reads as the site's own game rather than an advert
const heads = {
  en:['OUR GAME','A free game by PRO-GAMES that you can play right away in your browser. Punch, kick the ball and smash with the hammer through 10 stages, defeat the BIG BAG boss and fight for a place in the online ranking.'],
  pl:['NASZA GRA','Darmowa gra od PRO-GAMES, w którą zagrasz od razu w przeglądarce. Uderzaj, kopnij piłkę i rozbijaj młotem przez 10 etapów, pokonaj bossa BIG BAG i zawalcz o miejsce w rankingu online.'],
  es:['NUESTRO JUEGO','Un juego gratuito de PRO-GAMES al que juegas al instante en el navegador. Golpea, patea el balón y machaca con el martillo a lo largo de 10 niveles, derrota al jefe BIG BAG y lucha por un puesto en el ranking online.'],
  de:['UNSER SPIEL','Ein kostenloses Spiel von PRO-GAMES, das du sofort im Browser spielst. Schlag zu, kick den Ball und hau mit dem Hammer durch 10 Level, besiege den Boss BIG BAG und kämpfe um deinen Platz in der Online-Rangliste.'],
  fr:['NOTRE JEU','Un jeu gratuit de PRO-GAMES, jouable immédiatement dans le navigateur. Frappe, tire dans le ballon et cogne au marteau à travers 10 niveaux, bats le boss BIG BAG et décroche ta place dans le classement en ligne.'],
  el:['ΤΟ ΠΑΙΧΝΙΔΙ ΜΑΣ','Ένα δωρεάν παιχνίδι της PRO-GAMES που παίζεις αμέσως στον browser. Χτύπα, κλώτσα την μπάλα και σπάσε με το σφυρί σε 10 πίστες, νίκησε τον BIG BAG και διεκδίκησε θέση στην online κατάταξη.'],
  it:['IL NOSTRO GIOCO','Un gioco gratuito di PRO-GAMES che giochi subito nel browser. Colpisci, calcia il pallone e spacca con il martello per 10 livelli, sconfiggi il boss BIG BAG e conquista un posto nella classifica online.'],
  ar:['لعبتنا','لعبة مجانية من PRO-GAMES تلعبها فورًا في المتصفح. اضرب واركل الكرة وحطّم بالمطرقة عبر 10 مراحل، واهزم الزعيم BIG BAG ونافس على مكانك في الترتيب عبر الإنترنت.'],
  ro:['JOCUL NOSTRU','Un joc gratuit de la PRO-GAMES, pe care îl joci imediat în browser. Lovește, șutează mingea și zdrobește cu ciocanul prin 10 niveluri, învinge-l pe boss-ul BIG BAG și luptă pentru un loc în clasamentul online.'],
  cs:['NAŠE HRA','Hra zdarma od PRO-GAMES, kterou si zahraješ hned v prohlížeči. Boxuj, kopej do míče a tluč kladivem v 10 úrovních, poraz bosse BIG BAG a bojuj o místo v online žebříčku.'],
  hu:['A MI JÁTÉKUNK','Ingyenes játék a PRO-GAMES-től, amivel azonnal játszhatsz a böngészőben. Üss, rúgd a labdát és zúzz a kalapáccsal 10 pályán át, győzd le a BIG BAG főellenséget, és küzdj meg a helyedért az online ranglistán.'],
  ru:['НАША ИГРА','Бесплатная игра от PRO-GAMES, в которую можно сразу играть в браузере. Бей, пинай мяч и круши молотом на 10 уровнях, победи босса BIG BAG и поборись за место в онлайн-рейтинге.'],
  bg:['НАШАТА ИГРА','Безплатна игра от PRO-GAMES, която играеш веднага в браузъра. Удряй, ритай топката и чупи с чука през 10 нива, победи боса BIG BAG и се бори за място в онлайн класацията.']
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
        <p class="games-promo-intro">${lang === 'pl' ? '<strong class="games-promo-lead">Darmowa gra od PRO-GAMES, w którą zagrasz od razu w przeglądarce.</strong>' : (heads[lang] || heads.en)[1]}</p>
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
  html = html.replace('</head>','<link rel="stylesheet" href="/games-promo.css?v=7">\n</head>');
  fs.writeFileSync(file, html);
  count++;
}
console.log(`Games navigation published on ${count} pages; localized banners follow the product catalogue.`);

