const fs=require('fs'),assert=require('assert/strict'),vm=require('vm'),{parseHTML}=require('linkedom');
const origin='https://www.progamespoland.com',pages=JSON.parse(fs.readFileSync('build/pages.json')),config=JSON.parse(fs.readFileSync('vercel.json'));
const oldPages=pages.filter(p=>!p.editorial),newPages=pages.filter(p=>p.editorial&&p.lang==='en');assert.equal(oldPages.length,637);assert.equal(newPages.length,8);
const source={window:{}};vm.runInNewContext(fs.readFileSync('products.js','utf8'),source);const products=source.window.PRODUCTS;
const docs=new Map(pages.map(p=>[p.url,parseHTML(fs.readFileSync(p.filename,'utf8')).document]));let references=0,schemas=0,images=0,specs=0;
for(const p of pages){const d=docs.get(p.url),json=[...d.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent));schemas+=json.length;
 assert(!d.querySelector('meta[http-equiv="refresh"]'));assert.equal(d.querySelectorAll('h1').length,1);
 assert.equal(d.querySelector('meta[property="og:url"]').content,origin+p.url);
 assert.equal(d.querySelector('meta[name="twitter:title"]').content,d.title);
 assert.equal(d.querySelector('meta[name="twitter:description"]').content,d.querySelector('meta[name=description]').content);
 assert(!d.documentElement.textContent.includes('[INFORMATION REQUIRED FROM PROGAMES]'),'Internal editorial marker leaked to published page');
 assert(!d.querySelector('.detail-lead')?.textContent.startsWith('Contact Pro Games for the product description'));
 for(const link of d.querySelectorAll('link[hreflang]')){const target=docs.get(new URL(link.href).pathname);assert(target);assert([...target.querySelectorAll('link[hreflang]')].some(a=>a.href===origin+p.url));}
 for(const img of d.querySelectorAll('img')){assert(img.hasAttribute('alt'),p.url+' missing alt');if(!img.src.endsWith('.svg')){assert(+img.getAttribute('width')>0,p.url+' width '+img.src);assert(+img.getAttribute('height')>0,p.url+' height '+img.src);}images++;}
 for(const o of json){assert(!o.offers&&!o.review&&!o.aggregateRating);if(o['@type']==='Product'){const own=products[p.key].category!=='distributed';assert.equal(Boolean(o.manufacturer),own);if(own)assert.equal(o.manufacturer['@id'],origin+'/#organization');assert.equal(o.description.replace(/\s+/g,' ').trim(),d.querySelector('.detail-lead').textContent.replace(/\s+/g,' ').trim());}if(o['@type']==='Organization'){assert.equal(o.name,'ProGames');assert.equal(o['@id'],origin+'/#organization');}}
 if(p.kind==='product'){const product=products[p.key];if(product.spec.length){const rows=d.querySelectorAll('.seo-specs tbody tr');assert.equal(rows.length,product.spec.length);assert.equal(d.querySelectorAll('.seo-specs th[scope="row"]').length,rows.length);specs+=rows.length;}assert(d.querySelector('.config-quote'));assert(d.querySelector('.seo-product-support'));}
 if(p.editorial){assert.equal(d.querySelectorAll('script[src]').length,0);assert.equal(d.querySelectorAll('link[hreflang]').length,p.alternates??2);}
 for(const a of d.querySelectorAll('a[href]')){const u=new URL(a.getAttribute('href'),origin+p.url);if(u.origin!==origin)continue;const f=u.pathname.endsWith('/')?u.pathname.slice(1)+'index.html':u.pathname.slice(1);assert(fs.existsSync(f),p.url+' '+u.href);if(u.hash){const t=docs.get(u.pathname)||parseHTML(fs.readFileSync(f,'utf8')).document;assert(t.getElementById(decodeURIComponent(u.hash.slice(1))),p.url+' '+u.href);}references++;}
}
// Execute the ordered config with representative paths, host conditions and query conditions.
function redirect(url){const u=new URL(url);for(const r of config.redirects){if(r.source!=='/:path*'&&r.source!==u.pathname)continue;let ok=true,capture={};for(const h of r.has||[]){const val=h.type==='host'?u.host:u.searchParams.get(h.key);if(val===null){ok=false;break;}const match=new RegExp('^(?:'+h.value+')$').exec(val);if(!match){ok=false;break;}Object.assign(capture,match.groups||{});}if(!ok)continue;let target=r.destination.replace(':path*',u.pathname.slice(1));for(const[k,v]of Object.entries(capture))target=target.replace(':'+k,v);return {status:r.statusCode,url:new URL(target,u).href};}return null;}
let redirects=0;
for(const host of ['www.progames.pl','progames.pl','progamespoland.com'])for(const p of ['/','/pl/','/de/','/fr/','/en/products/boxer-flash.html','/double-hit','/index.html','/product.html?model=boxer-flash','/air-hockey','/basketball']){
 const first=redirect('https://'+host+p);assert(first);assert.equal(first.status,301);assert.equal(new URL(first.url).origin,origin);assert.equal(redirect(first.url),null,'Redirect chain '+first.url);const u=new URL(first.url),file=u.pathname.endsWith('/')?u.pathname.slice(1)+'index.html':u.pathname.slice(1);assert(fs.existsSync(file));redirects++;
}
for(const p of ['/','/pl/','/de/','/fr/','/en/products/boxer-flash.html'])assert.equal(redirect(origin+p),null);
const result={status:'PASS',pages:pages.length,originalURLs:oldPages.length,newEnglishPages:newPages.length,internalReferences:references,jsonLdObjects:schemas,imagesWithDimensions:images,specificationRows:specs,redirectCases:redirects,redirectTest:'configuration simulation; deployed HTTP not tested',mobile:'responsive CSS and DOM checked; visual browser QA unavailable'};fs.writeFileSync('verification/v42-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
