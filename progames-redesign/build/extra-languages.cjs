/* Additive publication: existing five locales retain their content and layouts. */
const fs=require('fs'),path=require('path'),vm=require('vm'),{parseHTML}=require('linkedom');
const root=path.resolve(__dirname,'..');process.chdir(root);
const locales={el:'Ελληνικά',it:'Italiano',ar:'العربية',ro:'Română',cs:'Čeština',hu:'Magyar',ru:'Русский',bg:'Български'};
const langs=Object.keys(locales),origin='https://www.progamespoland.com';
const original=JSON.parse(fs.readFileSync('build/pages.json')).filter(p=>!langs.includes(p.lang));
const sources=JSON.parse(fs.readFileSync('i18n/extra/product-sources.json'));
const dictionaries=Object.fromEntries(langs.map(l=>[l,{}]));
for(const file of fs.readdirSync('i18n/extra').filter(f=>f.endsWith('.tsv'))){
 for(const line of fs.readFileSync('i18n/extra/'+file,'utf8').split('\n').filter(s=>s&&!s.startsWith('#'))){
  const [source,...values]=line.split('\t');if(values.length!==8||values.some(v=>!v.trim()))throw Error('Incomplete translation: '+file+' '+source);
  const key=/^\d+$/.test(source)?sources[+source]:source;if(!key)throw Error('Unknown source '+source);
  langs.forEach((l,i)=>dictionaries[l][key]=values[i]);
 }
}
const aliases={28:20,49:20,57:54,84:69,85:70,87:74,89:76,90:77,109:74,112:78,116:108,117:110};
for(const d of Object.values(dictionaries)){
 d['Boxing and Amusement Machine Manufacturer']=d['Boxing Arcade Machine Manufacturer'];
 d["Polish manufacturer of boxing arcade and amusement machines. PRO-GAMES offers boxers, kickers and hammers, with customisation, spare parts and service."]=d['PRO-GAMES manufactures commercial boxing and amusement machines in Poland. Find your model and request a quote.'];
 for(const [to,from]of Object.entries(aliases))d[sources[to]]=d[sources[from]];
 for(const [to,from]of Object.entries({'Spare Parts':'Spare parts','spare parts':'Spare parts','SPARE PARTS.':'Spare parts','MANUFACTURING':'manufacturing','ELECTRONICS':'Electronics','BOOTH':'Booth','OPERATOR CONFIGURATION':'Operator configuration','MULTIPLAYER BOXER MACHINE':sources[36],'Send an inquiry':'Send inquiry','dispensing':'& dispensing','PRO-GAMES Machines Catalog':'MACHINE CATALOG','PRO-GAMES Spare Parts Catalog':'SPARE PARTS CATALOG'}))d[to]=d[from];
}
const productContext={window:{}};vm.runInNewContext(fs.readFileSync('products.js','utf8'),productContext);
const brands=[...new Set([...Object.values(productContext.window.PRODUCTS).map(p=>p.name),'Boxer Standard'])];
for(const d of Object.values(dictionaries)){
 d['PRO-GAMES manufactures commercial boxing arcade machines in Poland. Compare boxer, combo and strength games, explore configurations and request a B2B quote.']=d['PRO-GAMES manufactures commercial boxing and amusement machines in Poland. Find your model and request a quote.'];
 d['Explore 15 Boxer Standard designs, including Champion, Joker and MMA. Compare images, colours and technical specifications, then request your configuration.']=d['15 Boxer Standard designs. Choose a model to explore its colours, photos and specifications.'];
 d['Browse and download the PRO-GAMES machine and spare parts catalogs in PDF. Explore our range and find parts information for your amusement equipment.']=d['Choose the catalog you need. Browse it directly on this page or download the original PDF for offline use.'];
}
const runtime=fs.readFileSync('i18n/extra/runtime.js','utf8');
for(const l of langs)fs.writeFileSync('i18n/'+l+'.js','window.PG_BRANDS='+JSON.stringify(brands)+';window.PG_DICTIONARY='+JSON.stringify(dictionaries[l])+';\n'+runtime);
const sc={window:{}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),sc);const routes=sc.window.PG_ROUTES;
const pages=original.filter(p=>p.lang==='en'&&!p.editorial);
const generated=[];
const route=(p,l)=>p.kind==='product'?routes.product(l,p.key):routes[p.kind](l);
const newPage=(p,l)=>({...p,lang:l,url:route(p,l),filename:route(p,l).slice(1)+(route(p,l).endsWith('/')?'index.html':'')});
const localeCodes={el:'el_GR',it:'it_IT',ar:'ar_SA',ro:'ro_RO',cs:'cs_CZ',hu:'hu_HU',ru:'ru_RU',bg:'bg_BG'};
function languageLinks(page){return langs.map(l=>`<a href="${route(page,l)}" lang="${l}" hreflang="${l}" dir="${l==='ar'?'rtl':'ltr'}">${locales[l]}</a>`).join('');}
function alternates(page){return langs.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin+route(page,l)}">`).join('');}
// Insert only new language anchors and metadata in existing pages. Idempotent.
for(const p of original){
 let html=fs.readFileSync(p.filename,'utf8');
 const equivalent=p.editorial?{kind:'home'}:p;
 html=html.replace(/<a\b[^>]*\blang="(?:el|it|ar|ro|cs|hu|ru|bg)"[^>]*>[^<]*<\/a>/g,'');
 html=html.replace(/(<div class="pg-language-list">)([\s\S]*?)(<\/div>)/g,(_,a,b,c)=>a+b+languageLinks(equivalent)+c);
 if(!p.editorial){html=html.replace(/<link\b(?=[^>]*hreflang="(?:el|it|ar|ro|cs|hu|ru|bg)")[^>]*>/g,'');html=html.replace('</head>',alternates(p)+'</head>');}
 html=html.replace(/(\/site-config\.js|\/language\.js|\/contact\.js|\/i18n\.css)\?v=[^"']*/g,'$1?v=44');
 fs.writeFileSync(p.filename,html);
}
const unresolved=new Set();
for(const l of langs){
 const ctx={window:{},document:parseHTML('<html></html>').document};vm.createContext(ctx);vm.runInContext(fs.readFileSync('i18n/'+l+'.js','utf8'),ctx);const t=ctx.window.PG_T;
 for(const base of pages){
  const page=newPage(base,l),{document:d}=parseHTML(fs.readFileSync(base.filename,'utf8'));d.documentElement.lang=l;d.documentElement.setAttribute('dir',l==='ar'?'rtl':'ltr');d.documentElement.setAttribute('data-extra-locale','');
  // Resolve owned page URLs without touching images, original PDFs or external partners.
  const mapping=new Map(pages.map(p=>[p.url,route(p,l)]));
  for(const a of d.querySelectorAll('a[href]')){
   if(a.closest('.pg-language'))continue;
   const h=a.getAttribute('href');if(!h.startsWith('/')&&!h.startsWith(origin))continue;
   const u=new URL(h,origin);if(u.origin===origin&&mapping.has(u.pathname))a.setAttribute('href',mapping.get(u.pathname)+u.search+u.hash);
   else if(u.origin===origin&&u.pathname.startsWith('/en/')&&!u.pathname.startsWith('/en/products/')){a.setAttribute('lang','en');a.setAttribute('hreflang','en');a.textContent=t(a.textContent)+' (English)';}
  }
  for(const box of d.querySelectorAll('.pg-language')){box.querySelector('summary span').textContent=l.toUpperCase();box.querySelector('summary').setAttribute('aria-label',locales[l]+' — '+t('Language'));for(const a of box.querySelectorAll('a')){a.classList.toggle('active',a.lang===l);if(a.lang===l)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}}
  ctx.window.PG_LOCALIZE(d.body);
  if(base.kind==='catalog')for(const [key,label]of [['machines','Machine catalog'],['parts','Spare parts catalog']]){const h=d.querySelector('[data-catalog='+key+'] h2');h.textContent=t(label);}
  for(const card of d.querySelectorAll('.product-card[data-search]'))card.dataset.search+=' '+card.textContent.toLowerCase();
  if(base.kind==='catalog')for(const inline of d.querySelectorAll('script:not([src]):not([type])'))inline.textContent=inline.textContent.replace("if(scroll) document.querySelector","window.PG_LOCALIZE?.(document.querySelector('.catalog-viewer-shell')); if(scroll) document.querySelector");
  d.title=t(base.title);page.title=d.title;
  for(const m of d.querySelectorAll('meta[name="description"],meta[name="twitter:title"],meta[name="twitter:description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"],meta[name="twitter:image:alt"]'))m.setAttribute('content',t(m.getAttribute('content')));
  d.querySelector('link[rel=canonical]').href=origin+page.url;
  d.querySelector('meta[property="og:url"]')?.setAttribute('content',origin+page.url);
  d.querySelector('meta[property="og:locale"]')?.setAttribute('content',localeCodes[l]);
  // Rebuild page-level structured data; keep the established corporate identity.
  const translateObject=obj=>{
   if(Array.isArray(obj))return obj.map(translateObject);
   if(obj&&typeof obj==='object')return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,k==='inLanguage'?l:translateObject(v)]));
   if(typeof obj==='string'){if(obj===origin+'/#organization'||obj===origin+'/#website')return obj;if(obj.startsWith(origin)){const u=new URL(obj);return mapping.has(u.pathname)?origin+mapping.get(u.pathname)+u.search+u.hash:obj;}return t(obj);}return obj;
  };
  for(const s of d.querySelectorAll('script[type="application/ld+json"]')){const obj=JSON.parse(s.textContent);if(obj['@type']==='Organization'||obj['@type']==='WebSite')continue;const translated=translateObject(obj);if(obj['@type']==='Product')translated.description=d.querySelector('.detail-lead').textContent.replace(/\s+/g,' ').trim();s.textContent=JSON.stringify(translated).replaceAll('<','\\u003c');}
  const script=d.createElement('script');script.src='/i18n/'+l+'.js?v=44';d.head.append(script);
  const css=d.createElement('link');css.rel='stylesheet';css.href='/i18n/extra/layout.css?v=45';d.head.append(css);
  // Record actual untranslated content, not placeholders or product names.
  function collect(n){if(['SCRIPT','STYLE','SVG'].includes(n.nodeName)||n.hasAttribute?.('data-no-translate')||n.closest?.('select[name=country]'))return;if(n.nodeType===3){const text=n.textContent.trim().replace(/\s+/g,' ');if(text&&t(text)===text&&/[A-Za-z]{3}/.test(text))unresolved.add(text);}for(const ch of n.childNodes)collect(ch);}if(l==='el')collect(d.body);
  fs.mkdirSync(path.dirname(page.filename),{recursive:true});fs.writeFileSync(page.filename,'<!doctype html>\n'+d.documentElement.outerHTML+'\n');generated.push(page);
 }
}
fs.writeFileSync('build/pages.json',JSON.stringify([...original,...generated],null,2)+'\n');
// Keep existing sitemap entries intact; add reciprocal alternates to the core pages.
let sitemap=fs.readFileSync('sitemap.xml','utf8');
sitemap=sitemap.replace(/<url>\s*<loc>https:\/\/www\.progamespoland\.com\/(?:el|it|ar|ro|cs|hu|ru|bg)\/[\s\S]*?<\/url>/g,'');
sitemap=sitemap.replace(/<xhtml:link\b(?=[^>]*hreflang="(?:el|it|ar|ro|cs|hu|ru|bg)")[^>]*\/>/g,'');
function sitemapAlts(p){return [...original.filter(x=>!x.editorial&&x.kind===p.kind&&x.key===p.key),...generated.filter(x=>x.kind===p.kind&&x.key===p.key)].map(x=>`<xhtml:link rel="alternate" hreflang="${x.lang}" href="${origin+x.url}"/>`).join('')+`<xhtml:link rel="alternate" hreflang="x-default" href="${origin+pages.find(x=>x.kind===p.kind&&x.key===p.key).url}"/>`;}
sitemap=sitemap.replace(/<url>([\s\S]*?)<\/url>/g,(whole,inside)=>{const url=inside.match(/<loc>(.*?)<\/loc>/)?.[1];const p=original.find(p=>origin+p.url===url&&!p.editorial);return p?'<url>'+inside+langs.map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${origin+route(p,l)}"/>`).join('')+'</url>':whole;});
sitemap=sitemap.replace('</urlset>',generated.map(p=>`<url><loc>${origin+p.url}</loc>${sitemapAlts(p)}</url>`).join('\n')+'\n</urlset>');
fs.writeFileSync('sitemap.xml',sitemap);
fs.writeFileSync('/tmp/pg-unresolved.json',JSON.stringify([...unresolved],null,2));
console.log(`Generated ${generated.length} pages in ${langs.length} locales; ${Object.keys(dictionaries.el).length} editorial entries per locale.`);
