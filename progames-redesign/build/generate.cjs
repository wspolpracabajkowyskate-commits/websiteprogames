/* Rebuild static multilingual pages: run npm run build from the project root. */
const fs=require('fs'),path=require('path'),vm=require('vm'),{parseHTML}=require('linkedom');
const read=f=>fs.readFileSync(f,'utf8');const data={window:{}};vm.createContext(data);for(const f of ['site-config.js','products.js'])vm.runInContext(read(f),data);
const {PRODUCTS:products,PG_SITE:site,PG_ROUTES:routes,PRODUCT_PL:pl,PRODUCT_ES:es,PG_PL:plLabels,PG_ES:esLabels}=data.window;
// Browser payloads omit source provenance used only by build/audit tooling.
fs.mkdirSync('assets/data',{recursive:true});
for(const language of ['en','es']){
 const clean=JSON.parse(JSON.stringify(products,(key,value)=>['source','sourceImage'].includes(key)?undefined:value));
 const payload={PRODUCTS:clean,PRODUCT_COLLECTIONS:data.window.PRODUCT_COLLECTIONS};
 if(language==='es'){payload.PRODUCT_ES=es;payload.PG_ES=esLabels;}
 fs.writeFileSync('assets/data/products-'+language+'.js',Object.entries(payload).map(([key,value])=>'window.'+key+'='+JSON.stringify(value)+';').join('\n'));
}
const origin=site.origin;const output=[];const langs=['en','es'];
const titles={home:{en:'Boxer & Arcade Machine Manufacturer | Pro Games Poland',pl:'Boksery i automaty rozrywkowe — producent | Pro Games Poland',es:'Fabricante de máquinas recreativas y boxers | Pro Games Poland'},collection:{en:'Boxer Standard — 15 Boxing Machine Designs | Pro Games',pl:'Boksery Standard — 15 modeli automatów bokserskich | Pro Games',es:'Boxer Standard — 15 diseños de máquinas de boxeo | Pro Games'},catalog:{en:'Arcade Machines & Spare Parts Catalogs | Pro Games Poland',pl:'Katalogi automatów i części zamiennych | Pro Games Poland',es:'Catálogos de máquinas y repuestos | Pro Games Poland'}};
const descriptions={home:{en:'Polish manufacturer of boxer and arcade machines. Explore boxing, kicker, hammer and combo games, colours, specifications, spare parts and B2B enquiries.',pl:'Producent bokserów i automatów rozrywkowych z Polski. Poznaj boksery, kopacze, młoty i urządzenia 3 w 1, dostępne kolory, części zamienne i ofertę B2B.',es:'Fabricante polaco de boxers y máquinas recreativas. Descubre modelos, colores, especificaciones, repuestos y opciones para operadores y distribuidores.'},collection:{en:'Explore all 15 Boxer Standard designs from Pro Games: Joker, Champion, MMA, Viking and more. Compare photos and choose your model and cabinet colour.',pl:'Poznaj 15 bokserów Standard Pro Games: Joker, Champion, MMA, Viking i inne. Zobacz zdjęcia, wybierz model, kolor obudowy i konfigurację do swojego lokalu.',es:'Explora los 15 diseños Boxer Standard de Pro Games: Joker, Champion, MMA, Viking y más. Elige tu modelo y consulta colores, fotos y especificaciones.'},catalog:{en:'Browse and download Pro Games arcade machine and spare parts catalogs as local PDF files. Find models, components and information for operators.',pl:'Przeglądaj i pobierz katalog automatów Pro Games oraz katalog części zamiennych PDF. Modele, podzespoły i informacje dla operatorów w jednym miejscu.',es:'Consulta y descarga los catálogos PDF de máquinas Pro Games y repuestos. Modelos, componentes e información para operadores en un solo lugar.'}};
const pageURL=(kind,lang,key)=>kind==='home'?routes.home(lang):kind==='collection'?routes.collection(lang):kind==='catalog'?routes.catalog(lang):routes.product(lang,key);
function setMeta(doc,selector,attrs){let e=doc.querySelector(selector);if(!e){e=doc.createElement(attrs.rel?'link':'meta');doc.head.append(e)}for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v)}
function addSchema(doc,obj){const el=doc.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify(obj).replace(/</g,'\\u003c');doc.head.append(el)}
function render(kind,lang,key){
 const{window}=parseHTML(read(`build/templates/${kind}-${lang}.html`));const document=window.document;const url=pageURL(kind,lang,key);const alternates=Object.fromEntries(langs.map(l=>[l,pageURL(kind,l,key)]));
 if(key)document.body.dataset.model=key;
 for(const box of document.querySelectorAll('.language-switch,.mobile-language')){
  box.innerHTML=langs.map(l=>`<a href="${alternates[l]}" hreflang="${l}" lang="${l}" ${kind==='product'?`data-lang-link="${l}"`:''} ${l===lang?'class="active" aria-current="page"':''}>${l.toUpperCase()}</a>`).join('');
 }
 const ctx={window,document,location:new URL(origin+url),URL,URLSearchParams,Intl,Date,console,addEventListener:()=>{},requestAnimationFrame:f=>f(),setInterval:()=>{},history:{replaceState:()=>{}},scrollY:0,Image:class{},FormData:class{}};vm.createContext(ctx);
 for(const f of ['site-config.js','products.js'])vm.runInContext(read(f),ctx);
 if(kind==='home'||kind==='collection')vm.runInContext(read('script.js'),ctx);
 if(kind==='home')vm.runInContext(read('trade-map.js'),ctx);
 if(kind==='product')vm.runInContext(read('product.js'),ctx);
 const product=key?products[key]:null;const description=product?(lang==='pl'?pl[key].desc:lang==='es'?es[key]?.desc||product.desc:product.desc):descriptions[kind][lang];
 const label=product?(lang==='pl'?plLabels.labels[product.label]:lang==='es'?esLabels.labels[product.label]:product.label):'';
 document.title=product?`${product.name} — ${label} | ${lang==='es'?'Catálogo Pro Games':'Pro Games'}`:titles[kind][lang];
 const summary=product ? `${product.name} — ${description.replace(/\s+/g,' ').trim()}` : description;
 setMeta(document,'meta[name="description"]',{name:'description',content:summary.length>165?summary.slice(0,162).replace(/\s+\S*$/,'')+'…':summary});
 for(const e of document.querySelectorAll('link[rel="canonical"],link[hreflang],meta[property^="og:"],meta[name^="twitter:"],script[type="application/ld+json"]'))e.remove();
 setMeta(document,'link[rel="canonical"]',{rel:'canonical',href:origin+url});
 for(const [l,u]of Object.entries({...alternates,'x-default':alternates.en})){const e=document.createElement('link');e.rel='alternate';e.hreflang=l;e.href=origin+u;document.head.append(e)}
 const og={title:document.title,description:document.querySelector('meta[name="description"]').content,type:'website',url:origin+url,image:origin+(product?product.image:'/assets/hero-champion.webp'),site_name:'Pro Games Poland',locale:lang==='pl'?'pl_PL':lang==='es'?'es_ES':'en_GB'};
 for(const[k,v]of Object.entries(og))setMeta(document,`meta[property="og:${k}"]`,{property:'og:'+k,content:v});
 setMeta(document,'meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
 for(const k of ['title','description','image'])setMeta(document,`meta[name="twitter:${k}"]`,{name:'twitter:'+k,content:og[k]});
 setMeta(document,'meta[property="og:image:alt"]',{property:'og:image:alt',content:product?product.name+' — Pro Games Poland':'Pro Games Poland'});
 setMeta(document,'meta[property="og:locale:alternate"]',{property:'og:locale:alternate',content:lang==='es'?'en_GB':'es_ES'});
 setMeta(document,'meta[name="robots"]',{name:'robots',content:'index,follow,max-image-preview:large'});
 const org={'@context':'https://schema.org','@type':'Organization','@id':origin+'/#organization',name:'PRO GAMES POLAND Sp. z o.o.',url:origin+'/',email:'office@progames.pl',telephone:'+48 536 068 912',address:{'@type':'PostalAddress',streetAddress:'ul. Rybnicka 19A',postalCode:'44-335',addressLocality:'Jastrzębie-Zdrój',addressCountry:'PL'}};
 org.taxID='633-224-54-91';org.identifier={'@type':'PropertyValue',propertyID:'REGON',value:'520986702'};org.logo=origin+'/assets/progames-wordmark.webp';org.sameAs=['https://www.facebook.com/BoxerProgames','https://www.instagram.com/progames.pl/'];org.contactPoint=[{'@type':'ContactPoint',contactType:'sales',email:'office@progames.pl',telephone:'+48 536 068 912'},{'@type':'ContactPoint',contactType:'customer service',email:'service@progames.pl',telephone:'+48 789 108 086'}];
 addSchema(document,{'@context':'https://schema.org','@type':kind==='collection'?'CollectionPage':'WebPage','@id':origin+url+'#webpage',url:origin+url,name:document.title,description:document.querySelector('meta[name="description"]').content,inLanguage:lang,isPartOf:{'@id':origin+'/#website'},publisher:{'@id':origin+'/#organization'},...(product?{mainEntity:{'@id':origin+url+'#product'}}:{})});
 if(kind==='home'){addSchema(document,org);addSchema(document,{'@context':'https://schema.org','@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Pro Games Poland',inLanguage:langs,publisher:{'@id':origin+'/#organization'}})}
 if(product){
  addSchema(document,{'@context':'https://schema.org','@type':'Product','@id':origin+url+'#product',name:product.name,description,image:product.variants.map(v=>origin+v.image),url:origin+url,category:label,brand:{'@type':'Brand',name:'Pro Games Poland'},manufacturer:{'@id':origin+'/#organization'},additionalProperty:product.spec.map(([name,value])=>({'@type':'PropertyValue',name:lang==='pl'?(plLabels.specs[name]||name):lang==='es'?(esLabels.specs[name]||name):name,value:lang==='pl'?(plLabels.specs[value]||value):lang==='es'?(esLabels.specs[value]||value):value}))});
 }
 if(kind!=='home'){
  const names={pl:'Wszystkie produkty',en:'All products',es:'Todos los productos'};const crumbs=[{name:names[lang],item:origin+routes.home(lang)+'#machines'}];
  if(product&&product.label==='BOXER STANDARD')crumbs.push({name:'Boxer Standard',item:origin+routes.collection(lang)});
  crumbs.push({name:product?product.name:kind==='collection'?'Boxer Standard':lang==='pl'?'Katalogi':lang==='es'?'Catálogos':'Catalogs',item:origin+url});
  addSchema(document,{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))});
 }
 if(kind==='collection')addSchema(document,{'@context':'https://schema.org','@type':'ItemList',name:'Boxer Standard',itemListElement:data.window.PRODUCT_COLLECTIONS['boxer-standard'].slugs.map((slug,i)=>({'@type':'ListItem',position:i+1,name:products[slug].name,url:origin+routes.product(lang,slug)}))});
 for(const script of document.querySelectorAll('script[src]')){
 if(script.getAttribute('src').startsWith('/products.js')) script.setAttribute('src','/assets/data/products-'+lang+'.js?v=25');
}
for(const img of document.querySelectorAll('img[src="/assets/progames-emblem.webp"]')){
 img.setAttribute('src','/assets/progames-emblem-256.webp');
 img.setAttribute('width','1254');img.setAttribute('height','1254');
}
// Reserve layout for product images; the file dimensions are optional for contained card artwork.
 for(const img of document.querySelectorAll('img')){img.setAttribute('decoding','async');if(!img.alt&&!['trade-world-outline','header-emblem'].includes(img.className)&&!img.closest('.swatch-dot'))img.alt=lang==='es'?'Máquina recreativa Pro Games':'Pro Games amusement machine'}
 const filename=url.endsWith('/')?url.slice(1)+'index.html':url.slice(1);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,'<!doctype html>\n'+document.documentElement.outerHTML);output.push({kind,lang,key,url,filename,title:document.title});
}
for(const lang of langs){for(const kind of ['home','collection','catalog'])render(kind,lang);for(const key of Object.keys(products))render('product',lang,key)}
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+output.map(p=>`  <url><loc>${xml(origin+p.url)}</loc>${[...langs,'x-default'].map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${xml(origin+pageURL(p.kind,l==='x-default'?'en':l,p.key))}"/>`).join('')}${p.key?`<image:image><image:loc>${xml(origin+products[p.key].image)}</image:loc></image:image>`:''}</url>`).join('\n')+'\n</urlset>\n');
fs.writeFileSync('robots.txt',`User-agent: *\nAllow: /\nDisallow: /build/\nDisallow: /verification/\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync('build/pages.json',JSON.stringify(output,null,2));
// Compatibility templates for previously shared ?model= URLs, also covered by server redirects.
for(const lang of langs){const{document}=parseHTML(read(`build/templates/product-${lang}.html`));setMeta(document,'meta[name="robots"]',{name:'robots',content:'noindex,follow'});for(const box of document.querySelectorAll('.language-switch'))box.innerHTML=langs.map(l=>`<a data-lang-link="${l}" href="${routes.home(l)}">${l.toUpperCase()}</a>`).join('');fs.writeFileSync(lang==='en'?'product.html':`product-${lang}.html`,'<!doctype html>\n'+document.documentElement.outerHTML)}
console.log('Generated',output.length,'indexable pages:',Object.keys(products).length,'products × 2 languages + 6 landing pages.');
