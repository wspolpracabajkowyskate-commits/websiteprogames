const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const server=await require('./local-server.cjs')();const b=await chromium.launch({args:['--no-sandbox']});const page=await b.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];const urls={en:'/',es:'/es.html',pl:'/pl/',de:'/de/',fr:'/fr/'};
for(const width of [320,360,375,390,414,430,480,640]){
 await page.setViewportSize({width,height:844});let baseline;
 for(const [lang,url]of Object.entries(urls)){
  await page.goto('http://127.0.0.1:8765'+url);await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'.reveal{opacity:1!important;transform:none!important;transition:none!important}'});
  const measured=await page.evaluate(()=>{const selectors=['.hero','.hero-copy','.eyebrow','.eyebrow>span','.hero-title-first','.hero-title-second','.hero .lead','.hero-actions','.hero-actions .btn:first-child','.hero-actions .btn:last-child'];return {boxes:Object.fromEntries(selectors.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return [s,{x:r.x,y:r.y,w:r.width,h:r.height}]})),overflow:selectors.filter(s=>{const e=document.querySelector(s);return e.scrollWidth>e.clientWidth+1||(!s.includes('hero-title')&&e.scrollHeight>e.clientHeight+1);}),pageWidth:document.documentElement.scrollWidth};});
  if(!baseline)baseline=measured.boxes;for(const [selector,box]of Object.entries(measured.boxes))for(const key of ['x','y','w','h'])assert.ok(Math.abs(box[key]-baseline[selector][key])<.1,`${width} ${lang} ${selector} ${key}: ${box[key]} != ${baseline[selector][key]}`);
  assert.equal(measured.pageWidth,width);assert.deepEqual(measured.overflow,[],`${width} ${lang} overflow`);results.push({width,lang,...measured});
  if(width===390)await page.screenshot({path:`verification/hero-v27-${lang}.png`});
 }
}
// Real language navigation (not only independently loaded screenshots).
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:8765/');for(const lang of ['pl','de','fr','es','en']){await page.locator('.header-language summary').click();await page.locator(`.header-language a[lang=${lang}]`).click();await page.waitForLoadState('load');assert.equal(await page.locator('html').getAttribute('lang'),lang);}
// Review every homepage section and the important product/catalogue surfaces.
await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8765/pl/');await page.addStyleTag({content:'.reveal{opacity:1!important;transform:none!important;transition:none!important}'});
fs.writeFileSync('verification/home-review-v27.json',JSON.stringify(await page.locator('main').evaluate(main=>[...main.querySelectorAll('section')].filter(s=>s.parentElement===main).map(s=>({id:s.id,class:s.className,heading:s.querySelector('h2,h1')?.textContent,text:s.textContent.replace(/\s+/g,' ').trim()}))),null,2));
for(const id of ['machines','business','distributors','trade-shows','contact']){const el=page.locator('#'+id);if(await el.count()){await el.scrollIntoViewIfNeeded();await page.screenshot({path:`verification/review-v27-${id}.png`});}}
await b.close();server.close();assert.deepEqual(errors,[]);fs.writeFileSync('verification/hero-v27-results.json',JSON.stringify({passed:true,viewports:8,languages:5,cases:results.length,errors,results},null,2));console.log('PASS: 40 mobile layouts; exact shared coordinates, dimensions, CTA sizes; no overflow; five-language navigation.');})();
