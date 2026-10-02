const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/tmp/pg-browsers/chromium-1161/chrome-linux/chrome',args:['--no-sandbox']});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const lang of ['en','es'])for(const width of [360,390,768,1440]){
 await p.setViewportSize({width,height:900});const route=lang==='en'?'/en/products/leader-rank.html':'/es/productos/leader-rank.html';
 await p.goto('http://127.0.0.1:8141'+route);assert.equal(await p.locator('.config-option input').count(),6);
 for(const option of ['banknotes','coins','capsules','tickets','stickers','wifi'])await p.locator(`.config-option input[value="${option}"]`).check();
 await p.locator('.gallery-swatch[data-index="2"]').click();await p.waitForFunction(()=>document.querySelector('#productMainImage').getAttribute('aria-busy')==='false');
 assert((await p.locator('#productMainImage').getAttribute('src')).endsWith('leader-rank-blue.jpg'));
 assert((await p.locator('#configFinish').textContent()).includes(lang==='en'?'Blue':'Azul'));
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await p.reload();assert.equal(await p.locator('.config-option input:checked').count(),6);await p.waitForFunction(()=>document.querySelector('#productMainImage').getAttribute('aria-busy')==='false');
 const target=await p.locator('.config-quote').getAttribute('href');assert.equal(await p.locator('a[href*="#inquiry"]').count(),1);assert((await p.locator('#configPayment').textContent()).includes(lang==='en'?'Capsule dispenser':'Dispensador de cápsulas'));assert(!(await p.locator('#configExtras').textContent()).includes('2-meter'));assert(target.includes('model=leader-rank')&&target.includes('variant=blue')&&target.includes('options='));
 if(width===390||width===1440){await p.locator('.machine-config').screenshot({path:`config-${lang}-${width}.png`});}
 await p.locator('.config-quote').click();await p.locator('.quote-request-summary').waitFor();
 assert.equal(await p.locator('#productInterest').inputValue(),'Boxer Leader Rank');const summary=await p.locator('.quote-request-summary').textContent();assert(summary.includes(lang==='en'?'Blue':'Azul'));assert(summary.includes('Boxnet'));
 const mail=await p.evaluate(()=>{const data=new FormData(document.querySelector('.contact-form'));data.set('configuration',configurationText);return window.PG_INQUIRY_URL(data);});
 const body=new URL(mail).searchParams.get('body');assert(body.includes('Boxer Leader Rank')&&body.includes('Boxnet')&&body.includes(lang==='en'?'Blue':'Azul'));assert(mail.startsWith('mailto:office@progames.pl?'));
 await p.locator('[name="name"]').fill('Configuration test');await p.locator('[name="email"]').fill('test@example.com');
 await p.evaluate(()=>{const original=window.PG_INQUIRY_URL;window.PG_INQUIRY_URL=data=>{window.testPreparedEmail=original(data);return location.href;};});
 await p.locator('.contact-form button[type="submit"]').click();
 const prepared=await p.evaluate(()=>window.testPreparedEmail);assert(new URL(prepared).searchParams.get('body').includes('Boxnet'));
 if(width===390)await p.locator('.contact-form').screenshot({path:`inquiry-${lang}.png`});
 await p.locator('.quote-request-summary a').click();assert.equal(await p.locator('.config-option input:checked').count(),6);
 await p.locator('.config-option input[value="wifi"]').uncheck();assert(!(await p.locator('.config-quote').getAttribute('href')).includes('wifi'));
 const other=lang==='en'?'es':'en';await p.locator(`[data-lang-link="${other}"]`).click();assert.equal(await p.locator('.config-option input:checked').count(),5);
}
await p.goto('http://127.0.0.1:8141/');assert.equal(await p.locator('.trade-map-pin').count(),4);for(const [event,booth]of [['bergamo','B9'],['las-vegas','1901']]){await p.locator(`.trade-map-tabs button[data-event="${event}"]`).click();assert((await p.locator('#tradeMapDetail').textContent()).includes(booth));}
await p.locator('#tradeMap').screenshot({path:'map-v21.png'});assert.deepEqual(errors,[]);fs.writeFileSync('config-test-results.json',JSON.stringify({status:'PASS',languages:['en','es'],widths:[360,390,768,1440],scenarios:['multiple payments','variant image and summary','reload','query state','edit configuration','language switch','email body composition without sending','new event selection'],errors},null,2));await b.close();console.log('PASS configuration flow');})().catch(e=>{console.error(e);process.exit(1)});
