const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const locales=['el','it','ar','ro','cs','hu','ru','bg'];
(async()=>{
 const browser=await chromium.launch({headless:true});const results=[],errors=[];
 for(const width of [320,390,1440])for(const lang of locales){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(lang+': '+e.message));
  let payload=null;
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname==='/api/contact'){if(r.request().method()==='POST'){payload=r.request().postDataJSON();return r.fulfill({json:{ok:true}});}return r.fulfill({json:{enabled:true}});}const file=path.join(process.cwd(),u.pathname+(u.pathname.endsWith('/')?'index.html':''));return fs.existsSync(file)&&fs.statSync(file).isFile()?r.fulfill({path:file}):r.abort();});
  for(const kind of ['home','product','catalog']){
   const url=kind==='home'?`/${lang}/`:kind==='product'?`/${lang}/products/boxer-kids.html?variant=artwork-01-white&options=banknotes`:`/${lang}/catalog.html`;
   await page.goto('https://pg.local'+url);await page.evaluate(()=>document.fonts.ready);
   const measure=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,over:[...document.querySelectorAll('h1,h2,.btn,.config-option-content')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(e.scrollWidth>e.clientWidth+2)&&getComputedStyle(e).overflowX==='visible'}).map(e=>e.textContent.trim().slice(0,70))}));
   results.push({lang,width,kind,...measure});
   assert(measure.scroll<=width+1,`${lang} ${kind} ${width}: document overflow ${measure.scroll}`);
   if(width===390){
    if(kind==='home'){
     const search=page.locator('#productSearch');await search.fill('zzzz-no-match');assert.equal(await page.locator('.product-card:visible').count(),0);await search.fill('');
     await page.locator('.contact-form [name=name]').fill('Localization test');await page.locator('.contact-form [name=email]').fill('localization@example.com');await page.locator('.contact-form [name=message]').fill('Mock request — not sent');await page.locator('.contact-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('.contact-status').textContent.length>0);assert.equal(payload.language,lang);assert.equal(await page.locator('.contact-status').textContent(),await page.evaluate(()=>window.PG_T('Your inquiry has been sent. Thank you.')));
    }
    if(kind==='product'){
     const before=await page.locator('#variantName').textContent();await page.locator('.gallery-swatch').nth(1).click();await page.waitForFunction(before=>document.querySelector('#variantName').textContent!==before,before);const quote=await page.locator('.config-quote').getAttribute('href');assert(quote.startsWith('/'+lang+'/'));assert(quote.includes('variant='));
     const menu=page.locator('.pg-language').first();await menu.locator('summary').click();assert.equal(await menu.locator('a').count(),13);const it=await menu.locator('a[lang=it]').getAttribute('href');assert(it.includes('/it/products/boxer-kids.html'));assert(it.includes('variant='));await menu.locator('summary').click();
    }
    if(kind==='catalog'){await page.locator('[data-catalog=parts]').click();assert.equal(await page.locator('#catalogTitle').textContent(),await page.evaluate(()=>window.PG_T('PRO GAMES Spare Parts')));}
   }
   if(width===390&&['el','ar','ru'].includes(lang))await page.screenshot({path:`/tmp/pg-${lang}-${kind}.png`});
  }
  await page.close();
 }
 await browser.close();assert.deepEqual(errors,[]);fs.writeFileSync('verification/extra-browser-results.json',JSON.stringify({status:'PASS',mockedContact:true,results,errors},null,2));console.log('PASS: '+results.length+' responsive page checks; 8 language/configuration/catalog/form flows (mocked, no email sent).');console.log('Clipping candidates:',results.filter(r=>r.over.length));
})().catch(e=>{console.error(e);process.exit(1)});
