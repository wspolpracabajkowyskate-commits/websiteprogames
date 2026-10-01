const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');
const read=f=>fs.readFileSync(f,'utf8');const pages=JSON.parse(read('build/pages.json'));let variantChecks=0;const assetPaths=new Set(),hrefs=[];const problems=[];
function localFile(url,from){const u=new URL(url,'https://www.progamespoland.com/'+from);if(u.origin!=='https://www.progamespoland.com')return null;let p=decodeURIComponent(u.pathname.slice(1));return {file:p.endsWith('/')?p+'index.html':p||'index.html',hash:u.hash}}
function context(file,search='',auto=true){const{window}=parseHTML(read(file));const document=window.document,pending=[];let location=new URL('https://www.progamespoland.com/'+file+search);const ctx={window,document,location,URL,URLSearchParams,Intl,Date,console,requestAnimationFrame:f=>f(),setInterval:()=>{},addEventListener:()=>{},scrollY:0,history:{replaceState:(_,__,u)=>{ctx.location=new URL(u,ctx.location)}},Image:class{set src(src){assert(fs.existsSync('.'+src),src);pending.push(this);if(auto)this.onload?.()}},FormData:class{}};vm.createContext(ctx);for(const f of ['site-config.js','products.js'])vm.runInContext(read(f),ctx);return{ctx,document,pending,run:f=>vm.runInContext(read(f),ctx)}}
for(const p of pages){
 const t=context(p.filename),d=t.document;
 assert.equal(d.documentElement.lang,p.lang);assert.equal(d.querySelectorAll('h1').length,1,p.filename+' H1');assert(d.querySelector('h1').textContent.trim());
 assert.equal(d.querySelector('link[rel="canonical"]').href,'https://www.progamespoland.com'+p.url);
 assert.equal(d.querySelectorAll('link[hreflang]').length,3);
 assert(d.querySelector('meta[name="description"]').content.length>=50);assert(!d.querySelector('meta[name="robots"]').content.includes('noindex'));
 for(const a of d.querySelectorAll('link[hreflang]')){const f=localFile(a.href,p.filename);assert(fs.existsSync(f.file),a.href);const{document}=parseHTML(read(f.file));assert([...document.querySelectorAll('link[hreflang]')].some(x=>x.href==='https://www.progamespoland.com'+p.url),'reciprocal '+a.href)}
 for(const s of d.querySelectorAll('script[type="application/ld+json"]')){const data=JSON.parse(s.textContent);assert(data['@type']);if(data['@type']==='Product'){assert(!data.offers);assert(!data.aggregateRating)}}
 for(const el of d.querySelectorAll('img[src],script[src],iframe[src],link[rel="stylesheet"]')){
  const src=el.getAttribute('src')||el.getAttribute('href');assert(!/^https?:|^\/\//.test(src),'external render dependency '+src);const f=localFile(src,p.filename);assert(fs.existsSync(f.file),src);assert(fs.statSync(f.file).size>0,src);assetPaths.add(f.file);
 }
 for(const a of d.querySelectorAll('a[href]')){const href=a.getAttribute('href');if(/^(mailto:|tel:)/.test(href))continue;const f=localFile(href,p.filename);if(!f)continue;assert(fs.existsSync(f.file),p.filename+' -> '+href);if(f.hash){const{document}=parseHTML(read(f.file));assert(document.getElementById(decodeURIComponent(f.hash.slice(1))),p.filename+' fragment '+href)}hrefs.push(href)}
 if(p.kind==='product'){
  const product=t.ctx.window.PRODUCTS[p.key];assert.equal(d.querySelector('h1').textContent,product.name);assert(d.querySelector('.detail-lead').textContent.length>50);assert.equal(d.querySelectorAll('.spec-table.light').length,Number(product.spec.length>0)+Number(product.options.length>0)); // content exists before JS
  t.run('product.js');
  for(let i=0;i<product.variants.length;i++){
   const v=product.variants[i];assetPaths.add(v.image.slice(1));assert(fs.statSync('.'+v.image).size>0,v.image);if(product.variants.length>1)d.querySelectorAll('.gallery-swatch')[i].click();assert.equal(d.querySelector('#productMainImage').getAttribute('src'),v.image);if(product.variants.length>1)assert.equal(d.querySelectorAll('.gallery-swatch[aria-pressed="true"]').length,1);variantChecks++;
  }
  assert.equal(d.querySelectorAll('.language-switch a').length,2);
 }
 if(p.kind==='home'||p.kind==='collection'){
  const expected=p.kind==='home'?29:15;assert.equal(d.querySelectorAll('.product-card').length,expected);t.run('script.js');assert.equal(d.querySelectorAll('.product-card').length,expected);assert.equal(d.querySelectorAll('.product-empty').length,1);
  if(p.kind==='home')assert.equal(d.querySelectorAll('#productInterest option').length,46);
  const search=d.querySelector('#productSearch');search.value='Champion';search.dispatchEvent(new t.ctx.window.Event('input'));assert.equal([...d.querySelectorAll('.product-card')].filter(c=>!c.hidden).length,1);d.querySelector('#clearProductFilters').click();assert.equal([...d.querySelectorAll('.product-card')].filter(c=>!c.hidden).length,expected);
  if(p.kind==='home'){t.run('trade-map.js');assert.equal(d.querySelectorAll('.trade-map-pin').length,2);d.querySelector('.trade-map-pin[data-event="london"]').click();assert(d.querySelector('#tradeMapDetail').textContent.includes('S2201'));}
 }
 if(p.kind==='catalog'){
  for(const s of d.querySelectorAll('script:not([src])'))if(s.type!=='application/ld+json')vm.runInContext(s.textContent,t.ctx);
  vm.runInContext("setCatalog('parts')",t.ctx);assert(d.querySelector('#catalogFrame').getAttribute('src').includes('spare-parts'));for(const a of d.querySelectorAll('.language-switch a'))assert(a.href.includes('catalog=parts'));
 }
}
// Race and failed-image behavior retain a coherent committed selection.
const t=context('en/products/champion.html','',false);t.run('product.js');const btn=t.document.querySelectorAll('.gallery-swatch');btn[1].click();btn[2].click();t.pending[1].onload();t.pending[0].onload();assert.equal(t.document.querySelector('#variantName').textContent,'Red');btn[3].click();t.pending[2].onerror();assert.equal(t.document.querySelector('#variantName').textContent,'Red');
const css=read('styles.css')+'\n'+read('assets/fonts/fonts.css');for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)/g)){if(/^(data:|#|%23)/.test(m[1]))continue;assert(m[1].startsWith('/'),'CSS external URL '+m[1]);assert(fs.existsSync('.'+m[1]),m[1]);assetPaths.add(m[1].slice(1))}
const results={pages:pages.length,productPages:pages.filter(p=>p.kind==='product').length,variantChecks,internalLinksChecked:hrefs.length,renderAssets:assetPaths.size,externalRenderDependencies:0,staticSEO:'PASS',runtimeDOM:'PASS',map:'PASS',raceAndFailure:'PASS',browserVisualTest:'NOT RUN',assets:[...assetPaths].sort()};fs.writeFileSync('verification/publication-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({...results,assets:undefined},null,2));
