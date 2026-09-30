const{parseHTML}=require('linkedom'),fs=require('fs'),vm=require('vm'),assert=require('assert');
const read=f=>fs.readFileSync(f,'utf8');
function setup(file,url,auto=true){
 const{window}=parseHTML(read(file));const document=window.document;const pending=[];let loc=new URL(url,'http://test.local');
 const ctx={window,document,location:loc,URL,URLSearchParams,console,requestAnimationFrame:f=>f(),history:{replaceState:(_,__,url)=>{loc=new URL(url,loc);ctx.location=loc}},Image:class{set src(v){this._src=v;pending.push(this);if(auto)this.onload?.()}get src(){return this._src}},addEventListener:()=>{},scrollY:0,FormData:class{}};
 vm.createContext(ctx);vm.runInContext(read('products.js'),ctx);return{ctx,document,pending,run:f=>vm.runInContext(read(f),ctx)};
}
let result=[];
for(const lang of ['en','es']){
 const t=setup('product.html','/');const ps=t.ctx.window.PRODUCTS;
 for(const[k,p]of Object.entries(ps)){
  assert.equal(new Set(p.variants.map(v=>v.id)).size,p.variants.length,`duplicate IDs ${k}`);
  const t=setup(lang==='es'?'product-es.html':'product.html','/product.html?model='+k);t.run('product.js');
  assert.equal(t.document.querySelector('h1').textContent,p.name);
  for(let i=0;i<p.variants.length;i++){
   const v=p.variants[i];assert(fs.existsSync('.'+v.image),v.image);
   if(p.variants.length>1){t.document.querySelectorAll('.gallery-swatch')[i].click();assert.equal(t.document.querySelector('#variantName').textContent,lang==='es'?(v.nameES||t.ctx.window.PG_ES.colors[v.name]||v.name):v.name);assert.equal(t.document.querySelectorAll('[aria-pressed="true"]').length,1)}
   assert.equal(t.document.querySelector('#productMainImage').getAttribute('src'),v.image);
  }
  result.push({product:k,language:lang,variants:p.variants.length,status:'PASS'});
 }
}
const t=setup('product.html','/product.html?model=champion',false);t.run('product.js');const b=t.document.querySelectorAll('.gallery-swatch');b[1].click();b[2].click();t.pending[1].onload();t.pending[0].onload();assert.equal(t.document.querySelector('#variantName').textContent,'Red');assert(t.document.querySelector('#productMainImage').src.endsWith('champion-red.webp'));b[3].click();t.pending[2].onerror();assert.equal(t.document.querySelector('#variantName').textContent,'Red');assert(t.document.querySelector('#variantStatus').textContent.includes('could not'));
for(const key of ['invalid','constructor','__proto__']){const t=setup('product.html','/product.html?model='+key);t.run('product.js');assert.equal(t.document.querySelector('h1').textContent,'Product not found')}
const deep=setup('product-es.html','/product-es.html?model=champion&variant=blue');deep.run('product.js');assert.equal(deep.document.querySelector('#variantName').textContent,'Azul');assert(deep.document.querySelector('[data-lang-link="en"]').href.includes('variant=blue'));assert(deep.document.querySelector('.detail-actions a').href.includes('variant=blue'));
for(const lang of ['en','es']){
 const t=setup(lang==='es'?'es.html':'index.html','/');t.run('script.js');
 assert.equal(t.document.querySelectorAll('.product-card').length,28);
 for(const b of t.document.querySelectorAll('.category-tabs button')){b.click();const cat=b.dataset.filter;assert.equal([...t.document.querySelectorAll('.product-card')].filter(c=>!c.hidden).length,Object.values(t.ctx.window.PRODUCTS).filter(p=>p.label!=='BOXER STANDARD'&&(cat==='all'||cat===p.category)).length+((cat==='all'||cat==='boxer')?1:0))}
 t.document.querySelector('#clearProductFilters').click();const search=t.document.querySelector('#productSearch');search.value='Champion';search.dispatchEvent(new t.ctx.window.Event('input'));assert.equal([...t.document.querySelectorAll('.product-card')].filter(c=>!c.hidden).length,1);
 search.value='xxxx-nothing';search.dispatchEvent(new t.ctx.window.Event('input'));assert.equal([...t.document.querySelectorAll('.product-card')].filter(c=>!c.hidden).length,0);t.document.querySelector('#clearProductFilters').click();assert.equal([...t.document.querySelectorAll('.product-card')].filter(c=>!c.hidden).length,28);
 t.document.querySelector('.menu-toggle').click();assert.equal(t.document.querySelector('.menu-toggle').getAttribute('aria-expanded'),'true');t.document.querySelector('#mobileNav a').click();assert.equal(t.document.querySelector('.menu-toggle').getAttribute('aria-expanded'),'false');
}
// Exact family membership comes from the 15 models in the supplied screenshots.
const expectedStandard=['joker','pow-boxer','champion','easy','cyber-punch','gladiator','mma','black-jack','super-hero','power-black','poison-squad','hacker','strongman','viking','disco'];
for(const lang of ['en','es']){
 const home=setup(lang==='es'?'es.html':'index.html','/');home.run('script.js');
 const cards=[...home.document.querySelectorAll('.product-card')];
 assert.equal(cards.filter(c=>c.dataset.slug==='boxer-standard').length,1);
 assert.equal(cards.filter(c=>expectedStandard.includes(c.dataset.slug)).length,0);
 assert.equal(home.document.querySelectorAll('#productInterest option').length,46); // 42 models + placeholder + 3 inquiry types
 const groupLink=home.document.querySelector('[data-slug="boxer-standard"] a').getAttribute('href');
 assert.equal(groupLink,lang==='es'?'/boxer-standard-es.html':'/boxer-standard.html');
 for(const slug of expectedStandard){
  const search=home.document.querySelector('#productSearch');search.value=home.ctx.window.PRODUCTS[slug].name;search.dispatchEvent(new home.ctx.window.Event('input'));
  assert(!home.document.querySelector('[data-slug="boxer-standard"]').hidden,slug+' family search');
 }
 const family=setup(groupLink.slice(1),groupLink);family.run('script.js');
 const models=[...family.document.querySelectorAll('.product-card')];
 assert.deepEqual(models.map(c=>c.dataset.slug),expectedStandard);
 assert.equal(family.document.querySelectorAll('.collection-card').length,0);
 for(const card of models){
  const href=card.querySelector('a').getAttribute('href');const url=new URL(href,'http://test.local');
  assert.equal(url.searchParams.get('model'),card.dataset.slug);
  const detail=setup(url.pathname.slice(1),href);detail.run('product.js');
  assert.equal(detail.document.querySelector('h1').textContent,home.ctx.window.PRODUCTS[card.dataset.slug].name);
  assert.equal(detail.document.querySelector('.product-back-link').getAttribute('href'),groupLink);
  assert.equal(detail.document.querySelector('#productMainImage').getAttribute('src'),card.querySelector('img').getAttribute('src'));
 }
 const search=family.document.querySelector('#productSearch');search.value='Champion';search.dispatchEvent(new family.ctx.window.Event('input'));
 assert.deepEqual(models.filter(c=>!c.hidden).map(c=>c.dataset.slug),['champion']);
 search.value='no-such-model';search.dispatchEvent(new family.ctx.window.Event('input'));assert.equal(models.filter(c=>!c.hidden).length,0);assert.equal(family.document.querySelector('.product-empty').hidden,false);
 family.document.querySelector('#clearProductFilters').click();assert.equal(models.filter(c=>!c.hidden).length,15);
 for(const a of family.document.querySelectorAll('.language-switch a'))assert(fs.existsSync('.'+a.getAttribute('href')));
}
console.log('PASS grouped homepages: 28 cards, 15 exact Standard models, all model links/photos/backlinks, family search/reset, EN/ES');
fs.writeFileSync('verification/dom-test-results.json',JSON.stringify({environment:'Node + linkedom DOM simulation, not a browser layout test',standardCollection:'PASS: 28 homepage cards; 15 models, exact order; links, matching cover photos, backlinks, search, reset, EN/ES',results:result,race:'PASS',imageFailure:'PASS',deepLinks:'PASS',languageLinks:'PASS',filters:'PASS',menu:'PASS',invalidProducts:'PASS'},null,2));console.log('PASS',result.length,'pages',result.reduce((a,x)=>a+x.variants,0),'variants; race, failure, deep link, language, filters, mobile menu');
