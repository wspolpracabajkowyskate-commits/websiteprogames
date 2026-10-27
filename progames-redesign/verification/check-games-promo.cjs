const fs=require('fs'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const labels={en:'PLAY',pl:'ZAGRAJ',es:'JUGAR',de:'SPIELEN',fr:'JOUER',el:'ΠΑΙΞΕ',it:'GIOCA',ar:'العب',ro:'JOACĂ',cs:'HRÁT',hu:'JÁTSSZ',ru:'ИГРАТЬ',bg:'ИГРАЙ'};
for(const [lang,label] of Object.entries(labels)){
 const file=lang==='en'?'index.html':lang==='es'?'es.html':`${lang}/index.html`;
 const {document:d}=parseHTML(fs.readFileSync(file,'utf8'));
 assert.equal(d.querySelectorAll('.games-promo').length,1,lang);
 assert.equal(d.querySelector('.games-promo').previousElementSibling.id,'machines',lang);
 assert.equal(d.querySelector('.games-promo-play span').textContent,label,lang);
 for(const selector of ['.games-promo-play','.desktop-nav .games-nav-link','.mobile-nav .games-nav-link']){
  assert.equal(d.querySelectorAll(selector).length,1,lang+selector);
  assert.equal(d.querySelector(selector).getAttribute('href'),lang==='pl'?'/pl/gry/':'/games/',lang+selector);
 }
 for(const image of d.querySelectorAll('.games-promo img'))assert(fs.existsSync('.'+image.getAttribute('src')));
}
assert(fs.existsSync('games/index.html'));
console.log('PASS: 13 translated banners after the product catalogue; unique desktop/mobile links; all assets and game exist.');
