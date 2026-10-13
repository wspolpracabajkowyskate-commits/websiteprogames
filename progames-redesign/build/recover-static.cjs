/* Restore omitted static publication files using the existing UI renderer and data.
   No network, product-copy edits or customer-form changes. */
const fs=require('fs'),path=require('path'),vm=require('vm'),{parseHTML}=require('linkedom');
const origin='https://www.progamespoland.com',pages=JSON.parse(fs.readFileSync('build/pages.json'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function context(html,url){const {window,document}=parseHTML(html);const c={window,document,location:new URL(origin+url),URL,URLSearchParams,console,history:{replaceState(){}},Image:class{}};vm.createContext(c);for(const f of ['site-config.js','products.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);return c;}
function meta(d,key,value,property=false){let el=d.querySelector(`meta[${property?'property':'name'}="${key}"]`);if(!el){el=d.createElement('meta');el.setAttribute(property?'property':'name',key);d.head.append(el);}el.setAttribute('content',value);}
function ld(d,obj){const el=d.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify(obj).replaceAll('<','\\u003c');d.head.append(el);}
function common(d,page,description){d.title=page.title;meta(d,'description',description);meta(d,'robots','index,follow,max-image-preview:large');for(const el of d.querySelectorAll('link[rel=canonical],link[hreflang],script[type="application/ld+json"]'))el.remove();let el=d.createElement('link');el.rel='canonical';el.href=origin+page.url;d.head.append(el);for(const alt of pages.filter(p=>p.kind===page.kind&&p.key===page.key&&!p.editorial)){el=d.createElement('link');el.rel='alternate';el.hreflang=alt.lang;el.href=origin+alt.url;d.head.append(el);}el=d.createElement('link');el.rel='alternate';el.hreflang='x-default';el.href=origin+pages.find(p=>p.kind===page.kind&&p.key===page.key&&p.lang==='en').url;d.head.append(el);for(const [k,v]of Object.entries({'og:title':page.title,'og:description':description,'og:url':origin+page.url,'og:type':'website','og:site_name':'ProGames','og:locale':page.lang==='pl'?'pl_PL':'en_GB'}))meta(d,k,v,true);meta(d,'twitter:title',page.title);meta(d,'twitter:description',description);meta(d,'twitter:card','summary_large_image');}
let count=0;
for(const page of pages.filter(p=>p.kind==='product'&&p.lang==='en')){
 const c=context(fs.readFileSync('product.html','utf8'),page.url),d=c.document,p=c.window.PRODUCTS[page.key];d.body.dataset.model=page.key;vm.runInContext(fs.readFileSync('product.js','utf8'),c);
 const description=`${p.name} – ${page.title.split(' | ')[1].toLowerCase()} ${p.category==='distributed'?'available from':'by'} ProGames. Explore photos, specifications and configuration options. Request a quote.`;
 if(d.querySelector('.detail-lead').textContent.startsWith('Contact Pro Games for the product description'))d.querySelector('.detail-lead').textContent=p.name+' is listed in the ProGames catalogue. Contact sales to confirm the current specification and available configuration.';
 common(d,page,description);d.querySelectorAll('[data-lang-link]').forEach(a=>a.href=c.window.PG_ROUTES.product(a.dataset.langLink,page.key));
 const pl=parseHTML(fs.readFileSync(`pl/produkty/${page.key}.html`,'utf8')).document;
 const dims=new Map([...pl.querySelectorAll('img')].map(i=>[i.getAttribute('src'),[i.getAttribute('width'),i.getAttribute('height')]]));
 for(const img of d.querySelectorAll('img')){const wh=dims.get(img.getAttribute('src'));if(wh){img.setAttribute('width',wh[0]);img.setAttribute('height',wh[1]);}img.setAttribute('decoding','async');}
 const spec=d.querySelector('.spec-table.light');if(p.spec.length&&spec){spec.innerHTML=`<h3>Technical specifications</h3><table class="seo-specs"><tbody>${p.spec.map(([k,v])=>`<tr><th scope="row">${escape(k)}</th><td>${escape(v)}</td></tr>`).join('')}</tbody></table>`;}
 const support=d.createElement('section');support.className='seo-product-support section';support.innerHTML='<h2>Product information and support</h2><p>Final availability and configuration are confirmed by ProGames sales.</p><a href="/catalog.html">Product and spare parts catalogs</a> · <a href="/#contact">Contact sales and service</a>';d.querySelector('#productDetail').append(support);
 const css=d.createElement('link');css.rel='stylesheet';css.href='/seo-v42.css?v=43';d.head.append(css);
 const pd={'@context':'https://schema.org','@type':'Product','@id':origin+page.url+'#product',name:p.name,url:origin+page.url,image:origin+p.image,description:d.querySelector('.detail-lead').textContent.replace(/\s+/g,' ').trim(),category:p.category};if(p.category!=='distributed')pd.manufacturer={'@id':origin+'/#organization'};ld(d,pd);
 ld(d,{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{name:'Home',item:origin+'/'},{name:'Boxing and arcade machines',item:origin+'/en/arcade-machines.html'},{name:p.name,item:origin+page.url}].map((x,i)=>({'@type':'ListItem',position:i+1,...x}))});
 meta(d,'og:image',origin+p.image,true);meta(d,'twitter:image',origin+p.image);
 fs.mkdirSync(path.dirname(page.filename),{recursive:true});fs.writeFileSync(page.filename,'<!doctype html>\n'+d.documentElement.outerHTML.replace(/[ \t]+$/gm,'')+'\n');count++;
}
// Translate the existing catalogue with its established Polish editorial dictionary.
const page=pages.find(p=>p.kind==='catalog'&&p.lang==='pl');
const c=context(fs.readFileSync('catalog.html','utf8'),page.url),d=c.document;d.documentElement.lang='pl';
for(const f of ['i18n/pl.js','i18n/runtime.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);c.window.PG_LOCALIZE?.();
for(const a of d.querySelectorAll('a[href]')){const h=a.getAttribute('href');if(h==='/'||h.startsWith('/#'))a.href='/pl/'+h.slice(1);}
for(const a of d.querySelectorAll('.pg-language a')){a.classList.toggle('active',a.lang==='pl');if(a.lang==='pl')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}for(const x of d.querySelectorAll('.pg-language summary span'))x.textContent='PL';
for(const src of ['/i18n/pl.js','/i18n/runtime.js']){const script=d.createElement('script');script.src=src;script.defer=true;d.body.append(script);}
common(d,page,'Przeglądaj i pobierz katalog automatów ProGames oraz katalog części zamiennych w formacie PDF. Poznaj ofertę i znajdź informacje o częściach.');
fs.writeFileSync(page.filename,'<!doctype html>\n'+d.documentElement.outerHTML.replace(/[ \t]+$/gm,'')+'\n');console.log(`Restored ${count} EN product pages and Polish catalogue from existing renderer and data.`);
