/* Add PL/DE/FR to the original, unchanged EN/ES page generator. */
const fs=require('fs'),path=require('path'),vm=require('vm'),{parseHTML}=require('linkedom');
const read=f=>fs.readFileSync(f,'utf8');
const langs=['en','es','pl','de','fr'],added=['pl','de','fr'];
const names={en:'English',es:'Español',pl:'Polski',de:'Deutsch',fr:'Français'};
const ctx={window:{}};vm.createContext(ctx);for(const f of ['site-config.js','products.js'])vm.runInContext(read(f),ctx);
const {PG_ROUTES:r,PG_SITE:site,PRODUCTS:products,PRODUCT_COLLECTIONS:collections}=ctx.window;
const route=(p,l)=>p.kind==='home'?r.home(l):p.kind==='catalog'?r.catalog(l):p.kind==='collection'?r.collection(l):r.product(l,p.key);
const filename=url=>url.endsWith('/')?url.slice(1)+'index.html':url.slice(1);
const original=JSON.parse(read('build/pages.json')).filter(p=>['en','es'].includes(p.lang));
const english=original.filter(p=>p.lang==='en');
const source=new Map(original.map(p=>[p.filename,read(p.filename)]));
const dictionaries=Object.fromEntries(added.map(l=>[l,{}]));
for(const f of fs.readdirSync('i18n').filter(f=>f.endsWith('.tsv')).sort()){
 read('i18n/'+f).trim().split('\n').forEach((line,i)=>{const [key,...values]=line.split('\t');if(values.length!==3)throw Error(`${f}:${i+1}: expected 3 translations`);added.forEach((l,j)=>{dictionaries[l][key]=values[j];});});
}
for(const l of added)for(const product of Object.values(products))for(const text of [...product.desc.split('\n\n'),...product.features,...product.options]){
 if(!Object.hasOwn(dictionaries[l],text))throw Error('Missing '+l+' product translation: '+text);
}
const runtime=read('i18n/runtime.js');
for(const l of added)fs.writeFileSync('i18n/'+l+'.js','window.PG_DICTIONARY='+JSON.stringify(dictionaries[l])+';\n'+runtime);
const normalize=s=>s.replace(/\s+/g,' ').trim();
function translator(document,l){const context={window:{PG_DICTIONARY:dictionaries[l]},document};vm.createContext(context);vm.runInContext(runtime,context);return context.window;}
const remap=(value,l)=>{if(!value||value.startsWith('#'))return value;let url;try{url=new URL(value,site.origin);}catch{return value;}if(url.origin!==site.origin)return value;const p=english.find(p=>p.url===url.pathname);if(!p)return value;url.pathname=route(p,l);return value.startsWith('http')?url.href:url.pathname+url.search+url.hash;};
function menu(p,l){return `<details class="pg-language" data-no-translate><summary aria-label="${names[l]} — ${({en:'Choose language',es:'Elegir idioma',pl:'Wybierz język',de:'Sprache wählen',fr:'Choisir la langue'})[l]}"><span>${l.toUpperCase()}</span></summary><div class="pg-language-list">${langs.map(x=>`<a href="${route(p,x)}" lang="${x}" hreflang="${x}" ${p.kind==='product'?`data-lang-link="${x}"`:''} ${x===l?'class="active" aria-current="page"':''}>${names[x]}</a>`).join('')}</div></details>`;}
function schemaTranslate(obj,t,l){if(Array.isArray(obj))return obj.map(v=>schemaTranslate(v,t,l));if(obj&&typeof obj==='object'){for(const k of Object.keys(obj)){if(k==='inLanguage')obj[k]=Array.isArray(obj[k])?langs:l;else if(['name','description','category','value'].includes(k)&&typeof obj[k]==='string')obj[k]=obj[k].split('\n\n').map(t).join('\n\n');else if(['url','@id','item'].includes(k)&&typeof obj[k]==='string')obj[k]=remap(obj[k],l);else obj[k]=schemaTranslate(obj[k],t,l);} }return obj;}
const output=[];
function render(p,l){
 const isNew=added.includes(l),html=source.get((isNew?english.find(x=>x.kind===p.kind&&x.key===p.key):p).filename);
 const {document}=parseHTML(html);document.documentElement.lang=l;document.body.dataset.pageKind=p.kind;
 const {PG_T:t,PG_LOCALIZE:localize}=translator(document,l);
 if(isNew){
  // Localise links before adding the five-language chooser.
  for(const a of document.querySelectorAll('a[href]'))a.setAttribute('href',remap(a.getAttribute('href'),l));
  localize();
  if(p.kind==='catalog'){
   const titles={pl:['Katalog<br>automatów','Katalog<br>części zamiennych'],de:['Automaten-<br>katalog','Ersatzteil-<br>katalog'],fr:['Catalogue<br>de machines','Catalogue<br>de pièces détachées']};
   document.querySelectorAll('.catalog-choice h2').forEach((h,i)=>h.innerHTML=titles[l][i]);
  }
  for(const card of document.querySelectorAll('.product-card')){const item=products[card.dataset.slug]||collections[card.dataset.slug];card.dataset.search=(card.textContent+' '+(item?.desc||'').split('\n\n').map(t).join(' ')+' '+(item?.slugs||[]).map(x=>products[x].name).join(' ')).toLocaleLowerCase(l);}
  // Translations run before deferred application scripts. Static copy is already translated.
  const script=document.createElement('script');script.src='/i18n/'+l+'.js?v=36';document.head.append(script);
  for(const script of document.querySelectorAll('script:not([src]):not([type="application/ld+json"])')){
   if(script.textContent.includes('function setCatalog'))script.textContent=script.textContent.replace('      if(scroll)',"      window.PG_LOCALIZE?.(document.querySelector('.catalog-viewer-shell'));\n      if(scroll)");
  }
 }
 if(p.kind==='home'){
  const heading=document.querySelector('.hero h1');
  const first=heading.firstChild;
  const line=document.createElement('span');line.className='hero-title-line hero-title-first';line.textContent=first.textContent;
  heading.replaceChild(line,first);heading.querySelector('em').classList.add('hero-title-line','hero-title-second');
 }
 for(const box of document.querySelectorAll('.language-switch,.mobile-language')){box.innerHTML=menu(p,l);box.setAttribute('aria-label',isNew?t('Language'):l==='es'?'Idioma':'Language');}
 const style=document.createElement('link');style.rel='stylesheet';style.href='/i18n.css?v=36';document.head.append(style);
 const script=document.createElement('script');script.defer=true;script.src='/language.js?v=36';document.body.append(script);
 for(const e of document.querySelectorAll('link[hreflang]'))e.remove();
 for(const x of [...langs,'x-default']){const a=document.createElement('link');a.rel='alternate';a.hreflang=x;a.href=site.origin+route(p,x==='x-default'?'en':x);document.head.append(a);}
 const url=route(p,l);document.querySelector('link[rel="canonical"]').href=site.origin+url;
 const locale={en:'en_GB',es:'es_ES',pl:'pl_PL',de:'de_DE',fr:'fr_FR'};
 for(const m of document.querySelectorAll('meta[property="og:locale:alternate"]'))m.remove();
 for(const x of langs.filter(x=>x!==l)){const m=document.createElement('meta');m.setAttribute('property','og:locale:alternate');m.content=locale[x];document.head.append(m);}
 if(isNew){
  const paragraphs=[...document.querySelectorAll('.detail-lead p')].map(x=>x.textContent);
  let description;
  if(p.kind==='product')description=products[p.key].name+' — '+paragraphs.join(' ');
  else {const origDesc=english.find(x=>x.kind===p.kind);const {document:src}=parseHTML(source.get(origDesc.filename));description=t(src.querySelector('meta[name="description"]').content);}
  if(description.length>165)description=description.slice(0,162).replace(/\s+\S*$/,'')+'…';
  document.querySelector('meta[name="description"]').content=description;
  for(const m of document.querySelectorAll('meta[property^="og:"],meta[name^="twitter:"]')){
   const key=m.getAttribute('property')||m.name;
   if(key.endsWith(':title'))m.content=document.title;
   else if(key.endsWith(':description'))m.content=description;
   else if(key==='og:url')m.content=site.origin+url;
   else if(key==='og:locale')m.content=locale[l];
  }
  for(const s of document.querySelectorAll('script[type="application/ld+json"]')){const obj=schemaTranslate(JSON.parse(s.textContent),t,l);if(obj['@type']==='WebPage'||obj['@type']==='CollectionPage'){obj.name=document.title;obj.description=description;}s.textContent=JSON.stringify(obj);}
 }else{for(const s of document.querySelectorAll('script[type="application/ld+json"]')){const obj=JSON.parse(s.textContent);if(obj['@type']==='WebSite'){obj.inLanguage=langs;s.textContent=JSON.stringify(obj);}}}
 // Cache bust shared scripts after hydration enhancements.
 for(const s of document.querySelectorAll('script[src]'))if(/^\/(script|product|site-config|trade-map)\.js/.test(s.src))s.src=s.src.split('?')[0]+'?v=36';
 const countrySelect=document.querySelector('select[name="country"]');if(countrySelect){const names=new Intl.DisplayNames([l],{type:'region'}),defaultCountry={en:'GB',es:'ES',pl:'PL',de:'DE',fr:'FR'}[l];for(const o of countrySelect.options){o.textContent=names.of(o.value);if(o.value===defaultCountry)o.setAttribute('selected','');else o.removeAttribute('selected');}const dial=document.querySelector('[name="dialCode"]');dial.setAttribute('value',require('../assets/data/countries.json')[defaultCountry]);document.querySelector('.phone-prefix').textContent=dial.getAttribute('value');}
 const file=filename(url);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'<!doctype html>\n'+document.documentElement.outerHTML);
 output.push({...p,lang:l,url,filename:file,title:document.title});
}
for(const p of original)render(p,p.lang);
for(const l of added)for(const p of english)render(p,l);
// Legacy links preserve models via Vercel redirects; client fallback covers static hosting.
for(const l of langs){const p={kind:'product',key:'champion'},file=l==='en'?'product.html':`product-${l}.html`;const {document}=parseHTML(read('build/templates/product-'+(l==='es'?'es':'en')+'.html'));document.documentElement.lang=l;document.body.dataset.pageKind='product';for(const box of document.querySelectorAll('.language-switch'))box.innerHTML=menu(p,l);if(added.includes(l)){const s=document.createElement('script');s.src='/i18n/'+l+'.js?v=36';document.head.append(s);translator(document,l).PG_LOCALIZE();}const css=document.createElement('link');css.rel='stylesheet';css.href='/i18n.css?v=36';document.head.append(css);const s=document.createElement('script');s.src='/language.js?v=36';s.defer=true;document.body.append(s);const m=document.createElement('meta');m.name='robots';m.content='noindex,follow';document.head.append(m);for(const a of document.querySelectorAll('a[href]:not([hreflang])'))a.href=remap(a.getAttribute('href'),l);for(const script of document.querySelectorAll('script[src]'))if(/^\/(script|product|site-config|trade-map)\.js/.test(script.src))script.src=script.src.split('?')[0]+'?v=36';fs.writeFileSync(file,'<!doctype html>\n'+document.documentElement.outerHTML);}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+output.map(p=>`<url><loc>${site.origin+p.url}</loc>${[...langs,'x-default'].map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${esc(site.origin+route(p,l==='x-default'?'en':l))}"/>`).join('')}${p.key?`<image:image><image:loc>${site.origin+products[p.key].image}</image:loc></image:image>`:''}</url>`).join('\n')+'\n</urlset>');
fs.writeFileSync('build/pages.json',JSON.stringify(output,null,2));
console.log(`Published ${output.length} pages: 46 products and 3 landing pages in each of 5 languages.`);
