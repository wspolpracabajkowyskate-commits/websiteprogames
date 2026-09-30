require('fs').mkdirSync('verification/results',{recursive:true});
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert');global.window={};require('../products.js');const products=window.PRODUCTS;
(async()=>{
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
const results=[];
for(const lang of ['en','es']){
 await page.setViewportSize(lang==='en'?{width:1440,height:1000}:{width:390,height:844});
 for(const [key,p] of Object.entries(products)){
  await page.goto(`http://127.0.0.1:8000/product${lang==='es'?'-es':''}.html?model=${key}`);
  assert.equal(await page.locator('h1').textContent(),p.name);
  assert(await page.locator('#productMainImage').evaluate(i=>i.complete&&i.naturalWidth>0));
  if(p.variants.length>1){
   assert.equal(await page.locator('.gallery-swatch').count(),p.variants.length);
   for(let i=0;i<p.variants.length;i++){
    await page.locator('.gallery-swatch').nth(i).click();
    await page.waitForFunction(expected=>document.querySelector('#productMainImage').getAttribute('src')===expected&&document.querySelector('#productMainImage').getAttribute('aria-busy')==='false',p.variants[i].image);
    assert.equal(await page.locator('.gallery-swatch[aria-pressed="true"]').count(),1);
    assert.equal(await page.locator('#variantName').textContent(),await page.locator('.gallery-swatch').nth(i).locator('.swatch-label').textContent());
    assert(await page.locator('#productMainImage').evaluate(i=>i.complete&&i.naturalWidth>0));
   }
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${key} ${lang}`);
  if(['champion','boxer-kids','bouncy-castles-xs'].includes(key))await page.screenshot({path:`verification/results/${key}-${lang}.png`,fullPage:true});
  results.push({key,lang,variants:p.variants.length,passed:true});
 }
 console.log(lang,'all product variants passed');
}
// Delayed requests: last intent must win; failed image must not change committed selection.
await page.goto('http://127.0.0.1:8000/product.html?model=champion');
await page.route('**/assets/products/champion-yellow.webp',async r=>{await new Promise(ok=>setTimeout(ok,400));await r.continue()});
await page.locator('.gallery-swatch').nth(1).click();await page.locator('.gallery-swatch').nth(2).click();
await page.waitForTimeout(700);assert((await page.locator('#productMainImage').getAttribute('src')).endsWith('champion-red.webp'));
await page.route('**/assets/products/champion-white.webp',r=>r.abort());await page.locator('.gallery-swatch').nth(3).click();
await page.waitForFunction(()=>document.querySelector('#variantStatus').textContent.includes('could not'));
assert((await page.locator('#productMainImage').getAttribute('src')).endsWith('champion-red.webp'));assert.equal(await page.locator('#variantName').textContent(),'Red');
await page.unroute('**/assets/products/champion-white.webp');
await page.locator('[data-lang-link="es"]').click();assert.equal(await page.locator('#variantName').textContent(),'Rojo');
await page.locator('.detail-actions a').first().click();assert.equal(await page.locator('#productInterest').inputValue(),'Champion');assert((await page.locator('textarea').inputValue()).includes('Rojo'));
for(const lang of ['en','es']){
 await page.goto('http://127.0.0.1:8000/'+(lang==='es'?'es.html':''));
 assert.equal(await page.locator('.product-card').count(),28);
 for(const btn of await page.locator('.category-tabs button').all()){
  await btn.click();const c=await btn.getAttribute('data-filter');assert.equal(await page.locator('.product-card:visible').count(),Object.values(products).filter(p=>p.label!=='BOXER STANDARD'&&(c==='all'||p.category===c)).length+((c==='all'||c==='boxer')?1:0));
 }
 await page.locator('#clearProductFilters').click();await page.locator('#productSearch').fill('Champion');assert.equal(await page.locator('.product-card:visible').count(),1);
 await page.locator('#productSearch').fill('zzzz-no-match');assert.equal(await page.locator('.product-card:visible').count(),0);
 await page.locator('#clearProductFilters').click();assert.equal(await page.locator('.product-card:visible').count(),28);
 await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('.contact-form').evaluate(f=>f.checkValidity()),false);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:`verification/results/home-${lang}.png`,fullPage:true});
 await page.goto(`http://127.0.0.1:8000/catalog${lang==='es'?'-es':''}.html?catalog=parts`);
 assert((await page.locator('#catalogFrame').getAttribute('src')).includes('spare-parts'));
 await page.locator('[data-catalog="machines"]').click();assert((await page.locator('#catalogDownload').getAttribute('href')).includes('machines'));
 assert((await page.locator('.language-switch a').last().getAttribute('href')).includes('catalog=machines'));
}
for(const key of ['missing','__proto__','constructor']){await page.goto('http://127.0.0.1:8000/product.html?model='+key);assert.equal(await page.locator('h1').textContent(),'Product not found')}
assert.deepEqual(errors,[]);fs.writeFileSync('verification/results/test-results.json',JSON.stringify({products:results,errors,interactionTests:'passed'},null,2));
console.log('PASS',results.length,'product pages,',results.reduce((n,r)=>n+r.variants,0),'variant checks; race, failure, language, quote, filters, mobile, catalogs, invalid models');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
