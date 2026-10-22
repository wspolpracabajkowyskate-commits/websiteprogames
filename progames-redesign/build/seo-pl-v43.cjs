/* v43 – Polish SEO pass. Runs last in `npm run build`, needs no npm dependencies and is idempotent
   (safe to run again on its own output). It does not change styles, scripts, the contact form or e-mail settings.
   1. Creates Polish editorial pages (same markup and CSS as the v42 English editorial pages).
   2. Points Polish pages to the Polish editorial pages instead of English ones.
   3. Sharpens Polish titles and meta descriptions for the phrases Polish buyers search for.
   4. Adds pl hreflang to the English counterparts, updates sitemap.xml and build/pages.json.
   5. Sends progames.pl / www.progames.pl visitors to the Polish version (vercel.json + redirects.csv). */
const fs=require('fs'),path=require('path'),vm=require('vm');
const {urls,pairs,pages:plPages}=require('./content-pl-v43.cjs');
const ctx={window:{}};for(const f of ['site-config.js','products.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const {PRODUCTS:products,PG_ROUTES:routes,PG_SITE:site}=ctx.window,origin=site.origin;
const read=f=>fs.readFileSync(f,'utf8'),write=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const fileOf=u=>u.endsWith('/')?u.slice(1)+'index.html':u.slice(1);
const ld=o=>`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org',...o}).replaceAll('<','\\u003c')}</script>`;
const dims=JSON.parse(read('build/image-dimensions.json'));
const img=(src,alt)=>{const d=dims[src.replace(/^\//,'')];return `<img decoding="async"${d?` height="${d[1]}" width="${d[0]}"`:''} src="${src}" alt="${esc(alt)}" loading="lazy">`;};
const listFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?listFiles(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);

/* Polish category labels exactly as shown on the Polish homepage cards. */
const home=read('pl/index.html'),plLabel={};
for(const m of home.matchAll(/data-slug="([^"]+)"[^>]*>[\s\S]*?<div class="card-body"><p>([^<]+)<\/p>/g))plLabel[m[1]]??=m[2];

/* ---------- 1. Polish editorial pages ---------- */
const enOrg=read('en/manufacturer.html').match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"Organization"[\s\S]*?)<\/script>/);
const production=[['assembly','Montaż'],['electronics','Elektronika'],['testing','Testy'],['production-line','Kontrola końcowa']].map(([f,t])=>`<figure>${img(`/assets/production/${f}.webp`,'Produkcja automatów PROGAMES w Polsce: '+t.toLowerCase())}<figcaption>${t}</figcaption></figure>`).join('');
const heroAlt='Automat bokserski PROGAMES Champion';
const manifest=[];
for(const page of plPages){
 const url=urls[page.key],en=pairs[page.key],full=origin+url,isArticle=page.kind==='article';
 const items=page.filter?Object.entries(products).filter(([k,p])=>page.filter(p)&&p.label!=='BOXER STANDARD'):[];
 const cards=items.map(([k,p])=>`<article class="editorial-product"><a href="${routes.product('pl',k)}">${img(p.image,`${p.name} — ${p.category==='distributed'?'oferta dystrybucyjna':'automat PROGAMES'}`)}<h3>${esc(p.name)}</h3></a><p>${esc(plLabel[k]||p.label)}</p></article>`).join('');
 let body=page.body.replace('%PRODUCTION%',`<div class="editorial-grid">${production}</div>`)
  .replace('%CARDS%',page.cards?`<div class="editorial-grid">${page.cards.map(([k,t,d])=>`<article class="editorial-card"><h2><a href="${urls[k]}">${t}</a></h2><p>${d}</p></article>`).join('')}</div>`:'');
 if(cards)body+=`<section class="editorial-section"><h2>Zobacz modele</h2>${page.standardLink?'<p><a href="/pl/boxer-standard.html">Zobacz wszystkie 15 wzorów Boxer Standard</a></p>':''}<div class="editorial-products">${cards}</div></section>`;
 const alternates=en?`<link rel="alternate" hreflang="en" href="${origin+en}"><link rel="alternate" hreflang="pl" href="${full}"><link rel="alternate" hreflang="x-default" href="${origin+en}">`:'';
 const crumbs=[{name:'Strona główna',item:origin+'/pl/'},...(isArticle?[{name:'Poradniki',item:origin+urls.hub}]:[]),{name:page.h1,item:full}];
 const schemas=[
  ld({'@type':page.kind==='about'?'AboutPage':page.kind==='category'||page.kind==='hub'?'CollectionPage':'WebPage','@id':full+'#webpage',url:full,name:page.title,description:page.description,inLanguage:'pl',isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#organization'},publisher:{'@id':origin+'/#organization'},primaryImageOfPage:{'@id':full+'#image'}}),
  ld({'@type':'ImageObject','@id':full+'#image',url:origin+'/assets/hero-champion.webp',contentUrl:origin+'/assets/hero-champion.webp',caption:heroAlt}),
  ld({'@type':'BreadcrumbList',itemListElement:crumbs.map((x,i)=>({'@type':'ListItem',position:i+1,...x}))}),
  page.kind==='about'&&enOrg?`<script type="application/ld+json">${enOrg[1]}</script>`:'',
  isArticle?ld({'@type':'Article','@id':full+'#article',headline:page.h1,description:page.description,inLanguage:'pl',mainEntityOfPage:{'@id':full+'#webpage'},author:{'@id':origin+'/#organization'},publisher:{'@id':origin+'/#organization'},image:origin+'/assets/hero-champion.webp',articleSection:'Poradniki: automaty bokserskie'}):'',
  items.length?ld({'@type':'ItemList',name:page.h1,itemListElement:items.map(([k,p],i)=>({'@type':'ListItem',position:i+1,name:p.name,url:origin+routes.product('pl',k)}))}):''
 ].join('');
 const T=esc(page.title),D=esc(page.description);
 const html=`<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${T}</title><meta name="description" content="${D}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${full}">${alternates}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css?v=42"><link rel="stylesheet" href="/assets/fonts/fonts.css"><meta property="og:type" content="${isArticle?'article':'website'}"><meta property="og:url" content="${full}"><meta property="og:image" content="${origin}/assets/hero-champion.webp"><meta property="og:image:alt" content="${heroAlt}"><meta property="og:locale" content="pl_PL">${en?'<meta property="og:locale:alternate" content="en_GB">':''}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image:alt" content="${heroAlt}">${schemas}<link href="/seo-v42.css?v=43" rel="stylesheet"><meta content="PROGAMES" property="og:site_name"><meta content="${T}" property="og:title"><meta content="${D}" property="og:description"><meta content="${T}" name="twitter:title"><meta content="${D}" name="twitter:description"><meta content="${origin}/assets/hero-champion.webp" name="twitter:image"></head><body class="editorial-page"><a class="skip-link" href="#main-content">Przejdź do treści</a><header class="editorial-header"><a class="brand" href="/pl/" aria-label="PROGAMES – strona główna"><img decoding="async" class="brand-logo" src="/assets/progames-wordmark.webp" alt="PROGAMES" width="720" height="223"></a><nav aria-label="Główna nawigacja"><a href="${urls.boxing}">Automaty bokserskie</a><a href="${urls.arcade}">Automaty rozrywkowe</a><a href="${urls.manufacturer}">Producent</a><a href="${urls.hub}">Poradniki</a><a href="${urls.b2b}">B2B</a></nav><a class="btn btn-primary" href="/pl/#contact">Zapytaj o ofertę</a></header><main id="main-content"><nav class="seo-breadcrumb" aria-label="Okruszki nawigacji"><ol><li><a href="/pl/">Strona główna</a></li>${isArticle?`<li><a href="${urls.hub}">Poradniki</a></li>`:''}<li aria-current="page">${esc(page.h1)}</li></ol></nav><article><header class="editorial-hero"><p class="kicker">PROGAMES / ${isArticle?'PORADNIK DLA OPERATORÓW':'POLSKA PRODUKCJA'}</p><h1>${esc(page.h1)}</h1><p class="editorial-lead">${esc(page.lead)}</p></header><div class="editorial-body">${body}<section class="editorial-cta"><h2>Porozmawiaj z PROGAMES o swoim automacie</h2><p>Wyślij nam wybrany model, miejsce dostawy i konfigurację – przygotujemy ofertę.</p><a class="btn btn-primary" href="/pl/#contact">Zapytaj o ofertę</a></section></div></article></main><footer class="editorial-footer"><nav aria-label="Więcej informacji"><a href="${urls.boxing}">Automaty bokserskie</a><a href="${urls.arcade}">Automaty rozrywkowe</a><a href="${urls.manufacturer}">O PROGAMES</a><a href="${urls.b2b}">Sprzedaż hurtowa i dystrybucja</a><a href="${urls.hub}">Poradniki</a><a href="/pl/katalog.html">Katalogi</a></nav><p>PRO GAMES POLAND Sp. z o.o. · ul. Rybnicka 19A, 44-335 Jastrzębie-Zdrój, Polska</p><p>Sprzedaż: <a href="mailto:office@progames.pl">office@progames.pl</a> · <a href="tel:+48536068912">+48 536 068 912</a> · Serwis: <a href="mailto:service@progames.pl">service@progames.pl</a> · <a href="tel:+48789108086">+48 789 108 086</a></p><nav aria-label="Wersje językowe"><span>Strona w innych językach:</span><a href="${en||'/'}" lang="en">English</a><a href="/es.html" lang="es">Español</a><a href="/pl/" lang="pl">Polski</a><a href="/de/" lang="de">Deutsch</a><a href="/fr/" lang="fr">Français</a></nav></footer></body></html>`;
 write(fileOf(url),html);
 manifest.push({kind:page.kind,lang:'pl',key:en?page.key:'pl-'+page.key,url,filename:fileOf(url),title:page.title,editorial:true,alternates:en?3:0});
}

/* ---------- 2. Polish pages: link to Polish editorial pages, not English ones ---------- */
const enToPl={'/en/boxing-machines.html':[urls.boxing,'Automaty bokserskie'],'/en/arcade-machines.html':[urls.arcade,'Automaty rozrywkowe'],'/en/manufacturer.html':[urls.manufacturer,'O PROGAMES'],'/en/distributors-wholesale.html':[urls.b2b,'Sprzedaż hurtowa i dystrybucja'],'/en/knowledge/':[urls.hub,'Baza wiedzy'],'/en/knowledge/choosing-a-commercial-boxing-machine.html':[urls.choose,'Poradniki zakupowe'],'/en/knowledge/what-is-a-boxing-arcade-machine.html':[urls.definition,'Co to jest automat bokserski?'],'/en/knowledge/installation-and-maintenance.html':[urls.care,'Montaż i serwis']};
let rewritten=0;const generated=new Set(manifest.map(p=>path.normalize(p.filename)));
for(const f of listFiles('pl')){
 if(generated.has(path.normalize(f)))continue; // keep the English language link on the new pages
 const before=read(f);
 let s=before.replace(/<a href="(\/en\/[^"]+)" lang="en">([^<]*)<\/a>/g,(all,href,label)=>{const t=enToPl[href];if(!t)return all;return `<a href="${t[0]}">${label==='PROGAMES'?'PROGAMES':t[1]}</a>`;});
 s=s.replace(/"name":"[^"]*","item":"https:\/\/www\.progamespoland\.com(\/en\/[^"]+)"/g,(all,href)=>{const t=enToPl[href];return t?`"name":"${t[1]}","item":"${origin+t[0]}"`:all;});
 if(s!==before){write(f,s);rewritten++;}
}

/* ---------- 3. Polish titles and meta descriptions ---------- */
function retitle(f,title,description){
 let s=read(f);const i=s.indexOf('</head>');let head=s.slice(0,i);
 const oldT=head.match(/<title>([^<]*)<\/title>/)[1],oldD=head.match(/<meta name="description" content="([^"]*)"/)[1];
 if(title&&oldT!==esc(title))head=head.split(oldT).join(esc(title));
 if(description&&oldD!==esc(description))head=head.split(oldD).join(esc(description));
 write(f,head+s.slice(i));return title||oldT;
}
const titles={};
titles['pl/index.html']=retitle('pl/index.html','Automaty bokserskie i rozrywkowe – producent z Polski | PROGAMES','Automaty bokserskie (boksery, siłomierze), automaty z kopaczem i młotem prosto od polskiego producenta PROGAMES. Dla barów, klubów i salonów gier. Zapytaj o ofertę.');
titles['pl/boxer-standard.html']=retitle('pl/boxer-standard.html','Automaty bokserskie Boxer Standard – 15 modeli | PROGAMES','Automaty bokserskie Boxer Standard: 15 wzorów, m.in. Champion, Joker i MMA. Porównaj zdjęcia, kolory i dane techniczne, wybierz konfigurację i zapytaj o cenę.');
for(const [k,p] of Object.entries(products)){
 const f=fileOf(routes.product('pl',k));if(!fs.existsSync(f))continue;
 const t=read(f).match(/<title>([^<]*)<\/title>/)[1].split(' | ');if(t.length<3)continue;
 const type=t[1].charAt(0).toLowerCase()+t[1].slice(1);
 titles[f]=retitle(f,null,p.category==='distributed'
  ?`${p.name} – ${type} w ofercie PROGAMES. Zobacz zdjęcia, dane techniczne i dostępne wersje. Zapytaj o cenę i dostępność.`
  :`${p.name} – ${type} od polskiego producenta PROGAMES. Zobacz zdjęcia, dane techniczne i opcje konfiguracji. Zapytaj o cenę i dostępność.`);
}

/* ---------- 4. hreflang on English counterparts, pages.json, sitemap ---------- */
for(const [key,en] of Object.entries(pairs)){
 const f=fileOf(en);let s=read(f);const pl=origin+urls[key];
 if(!s.includes('hreflang="pl"'))s=s.replace(/(<link rel="alternate" hreflang="en" href="[^"]*">)/,`$1<link rel="alternate" hreflang="pl" href="${pl}">`);
 if(!s.includes('og:locale:alternate'))s=s.replace(/(<meta property="og:locale" content="en_GB">)/,'$1<meta property="og:locale:alternate" content="pl_PL">');
 write(f,s);
}
let pages=JSON.parse(read('build/pages.json')).filter(p=>!(p.editorial&&p.lang==='pl'));
for(const p of pages){if(p.lang==='pl'&&titles[p.filename])p.title=titles[p.filename];if(p.editorial&&p.lang==='en')p.alternates=Object.values(pairs).includes(p.url)?3:2;}
pages=pages.concat(manifest);
write('build/pages.json',JSON.stringify(pages,null,2));
const editorial=pages.filter(p=>p.editorial),editorialLocs=new Set(editorial.map(p=>origin+p.url));
const enOf=Object.fromEntries(Object.entries(pairs).map(([k,en])=>[en,urls[k]]));
const xl=(lang,u)=>`<xhtml:link rel="alternate" hreflang="${lang}" href="${origin+u}"/>`;
let sitemap=read('sitemap.xml').split('\n').filter(line=>{const m=line.match(/^<url><loc>([^<]+)<\/loc>/);return !(m&&editorialLocs.has(m[1]));}).join('\n');
const entries=editorial.map(p=>{const en=p.lang==='en'?p.url:pairs[p.key],pl=p.lang==='pl'?p.url:enOf[p.url];
 const links=p.alternates===0?'':pl?xl('en',en)+xl('pl',pl)+xl('x-default',en):xl('en',en)+xl('x-default',en);
 return `<url><loc>${origin+p.url}</loc>${links}</url>`;}).join('\n');
sitemap=sitemap.replace('</urlset>',entries+'\n</urlset>');write('sitemap.xml',sitemap);

/* ---------- 5. progames.pl → Polish version ---------- */
const config=JSON.parse(read('vercel.json')),plHosts=['progames.pl','www.progames.pl'];
const isPlHost=r=>(r.has||[]).some(h=>h.type==='host'&&plHosts.includes(h.value));
const keep=new Set(['/','/pl/','/de/','/fr/','/:path*']);
config.redirects=config.redirects.filter(r=>!(isPlHost(r)&&!keep.has(r.source)));
for(const r of config.redirects)if(isPlHost(r)&&r.source==='/')r.destination=origin+'/pl/';
const legacy={};for(const [k,p] of Object.entries(products)){const src=new URL(p.source).pathname;if(src!=='/')(legacy[src]??=[]).push(k);}
const plRules=[];
for(const host of plHosts){
 const has=[{type:'host',value:host}],add=(source,dest)=>plRules.push({source,has,destination:origin+dest,statusCode:301});
 add('/index.html','/pl/');
 for(const [src,keys] of Object.entries(legacy))add(src,keys.length===1?routes.product('pl',keys[0]):urls.arcade+(src==='/air-hockey'?'#cymbergaj':'#koszykowka'));
 add('/boxer-standard','/pl/boxer-standard.html');
 if(!legacy['/boxer-flash'])add('/boxer-flash',routes.product('pl','boxer-flash'));
}
config.redirects=plRules.concat(config.redirects);
write('vercel.json',JSON.stringify(config,null,2));
write('build/redirects.csv','source,destination,status,condition\n'+config.redirects.map(r=>[r.source,r.destination,r.statusCode,JSON.stringify(r.has||[])].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n'));

console.log(`v43 PL: ${manifest.length} Polish editorial pages; ${rewritten} Polish pages relinked; ${Object.keys(titles).length} Polish titles/descriptions; ${plRules.length} progames.pl redirects to the Polish version.`);
