const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844}});const logs=[];page.on('pageerror',e=>logs.push(e.message));const productPaths={en:'/en/products',es:'/es/productos',pl:'/pl/produkty',de:'/de/produkte',fr:'/fr/produits'};
for(const l of Object.keys(productPaths)){
 await page.goto('http://127.0.0.1:8765'+productPaths[l]+'/boxer-flash.html',{waitUntil:'networkidle'});
 const switches=page.locator('.gallery-swatch[data-index]');const n=await switches.count();assert.ok(n>1);
 await switches.nth(1).click();await page.waitForFunction(()=>document.querySelector('#productMainImage').getAttribute('aria-busy')==='false');
 const finish=await page.locator('#variantName').textContent(),src=await page.locator('#productMainImage').getAttribute('src');
 await page.locator('input[value=banknotes]').check();await page.locator('input[value=stickers]').check();
 assert.ok(!(await page.locator('#configPayment').textContent()).includes('Standard'));
 const next=l==='fr'?'en':Object.keys(productPaths)[Object.keys(productPaths).indexOf(l)+1];
 await page.locator('.pg-language summary').first().click();
 assert.equal(await page.locator('.pg-language[open] a').count(),5);
 await page.locator(`.pg-language[open] a[lang=${next}]`).click();await page.waitForLoadState('networkidle');
 assert.ok(page.url().includes(productPaths[next]+'/boxer-flash.html'));assert.ok(page.url().includes('options=banknotes%2Cstickers'));
 assert.equal(await page.locator('#productMainImage').getAttribute('src'),src);
 assert.ok(await page.locator('input[value=banknotes]').isChecked());assert.ok(await page.locator('input[value=stickers]').isChecked());
 await page.locator('.config-quote').click();await page.waitForLoadState('networkidle');
 assert.equal(await page.locator('#productInterest').inputValue(),'Boxer Flash');assert.ok((await page.locator('.quote-request-summary').textContent()).length>30);
 await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 await page.locator('#productSearch').fill('zzzz-no-match');assert.ok(await page.locator('.product-empty').isVisible());await page.locator('#clearProductFilters').click();assert.equal(await page.locator('.product-card:visible').count(),32);
}
for(const l of ['pl','de','fr']){
 const url=`/${l}/${l==='fr'?'catalogue':'katalog'}.html?catalog=parts`;
 await page.goto('http://127.0.0.1:8765'+url,{waitUntil:'networkidle'});assert.ok((await page.locator('#catalogFrame').getAttribute('src')).includes('spare-parts'));
 await page.locator('[data-catalog=machines]').click();assert.ok((await page.locator('#catalogFrame').getAttribute('src')).includes('machines-catalog'));
 await page.locator('.pg-language summary').click();const target=page.locator('.pg-language a[lang=es]');assert.ok((await target.getAttribute('href')).includes('catalog=machines'));
 await page.keyboard.press('Escape');assert.equal(await page.locator('.pg-language[open]').count(),0);
}
assert.deepEqual(logs,[]);await browser.close();fs.writeFileSync('verification/interactions-i18n-results.json',JSON.stringify({passed:true,languages:5,tests:['variant image','equipment','same product after language switch','query state','inquiry summary','mobile menu','search/filter reset','catalog PDF switch','keyboard Escape'],errors:logs},null,2));console.log('PASS: all five languages, variants, quote options, language state, inquiry, mobile menu, filters and catalog controls.');})();
