/* Repeatable SEO post-processing: run after multilingual.cjs. No visible copy changes. */
const fs=require('fs'),vm=require('vm'),{parseHTML}=require('linkedom');
const ctx={window:{}};for(const f of ['site-config.js','products.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
const {PG_SITE:site,PG_ROUTES:routes,PRODUCTS:products}=ctx.window;
const pages=JSON.parse(fs.readFileSync('build/pages.json','utf8'));
const copy={
en:{home:['Boxing & Arcade Machine Manufacturer | Pro Games','Discover boxing machines, kickers, hammer games and arcade equipment from Pro Games Poland. Explore models, colours and specifications. Request a quote.'],collection:['Boxer Standard: 15 Boxing Machine Designs | Pro Games','Explore 15 Boxer Standard designs, including Champion, Joker and MMA. Compare images, colours and technical specifications, then request your configuration.'],catalog:['Arcade Machine & Spare Parts Catalogs | Pro Games','Browse and download the Pro Games machine and spare parts catalogs in PDF. Explore our range and find parts information for your amusement equipment.'],types:{boxer:'Boxing machine',combo:'Boxing & kicking machine',kids:'Kids amusement machine',strength:'Strength tester',distributed:'Arcade equipment',hammer:'Hammer strength tester',kicker:'Kicking machine',hockey:'Air hockey table',basket:'Basketball arcade machine',ride:'Kiddie ride',dart:'Electronic darts machine',inflatable:'Kids inflatable castle'},desc:(n,t)=>`${n}: ${t.toLowerCase()} from the Pro Games range. View photos and technical details, explore configuration options and request a quote.`},
es:{home:['Fabricante de máquinas de boxeo y recreativas | Pro Games','Descubre máquinas de boxeo, fuerza y juegos recreativos de Pro Games Poland. Consulta modelos, colores y fichas técnicas y solicita tu presupuesto.'],collection:['Boxer Standard: 15 diseños de máquinas de boxeo | Pro Games','Descubre los 15 diseños Boxer Standard, como Champion, Joker y MMA. Consulta fotos, colores y características técnicas y solicita tu configuración.'],catalog:['Catálogos de máquinas recreativas y repuestos | Pro Games','Consulta y descarga los catálogos PDF de máquinas recreativas y repuestos de Pro Games. Encuentra modelos e información sobre piezas para tus equipos.'],types:{boxer:'Máquina de boxeo',combo:'Máquina de boxeo y patadas',kids:'Máquina recreativa infantil',strength:'Máquina de fuerza',distributed:'Máquina recreativa',hammer:'Máquina de fuerza con martillo',kicker:'Máquina de patadas',hockey:'Mesa de air hockey',basket:'Máquina de baloncesto',ride:'Máquina infantil',dart:'Diana electrónica',inflatable:'Castillo hinchable infantil'},desc:(n,t)=>`${n}: ${t.toLowerCase()} de la gama Pro Games. Consulta fotos, datos técnicos y opciones de configuración. Solicita un presupuesto.`},
pl:{home:['Producent bokserów i automatów rozrywkowych | Pro Games','Poznaj boksery, kopacze, młoty i automaty rozrywkowe Pro Games. Sprawdź modele, kolory oraz dane techniczne i zapytaj o ofertę dla swojego obiektu.'],collection:['Boksery Standard: 15 modeli automatów | Pro Games','Poznaj 15 modeli Boxer Standard, w tym Champion, Joker i MMA. Porównaj zdjęcia, kolory oraz dane techniczne i zapytaj o wybraną konfigurację.'],catalog:['Katalog automatów i części zamiennych PDF | Pro Games','Przeglądaj i pobierz katalogi PDF automatów rozrywkowych oraz części zamiennych Pro Games. Sprawdź ofertę urządzeń i informacje o podzespołach.'],types:{boxer:'Automat bokserski',combo:'Automat boksersko-piłkarski',kids:'Automat rozrywkowy dla dzieci',strength:'Tester siły',distributed:'Automat rozrywkowy',hammer:'Automat siłowy młot',kicker:'Automat piłkarski',hockey:'Stół do cymbergaja',basket:'Automat do koszykówki',ride:'Bujak dla dzieci',dart:'Dart elektroniczny',inflatable:'Zamek dmuchany dla dzieci'},desc:(n,t)=>`${n}: ${t.toLowerCase()} w ofercie Pro Games. Zobacz zdjęcia, sprawdź dane techniczne i opcje konfiguracji. Zapytaj o wycenę urządzenia.`},
de:{home:['Hersteller von Boxautomaten und Spielgeräten | Pro Games','Entdecken Sie Boxautomaten, Kicker, Hammerautomaten und Arcade-Geräte von Pro Games Poland. Modelle, Farben und technische Daten ansehen und Angebot anfragen.'],collection:['Boxer Standard: 15 Boxautomaten-Designs | Pro Games','Entdecken Sie 15 Boxer Standard Designs, darunter Champion, Joker und MMA. Vergleichen Sie Bilder, Farben und technische Daten und fragen Sie ein Angebot an.'],catalog:['Kataloge für Spielgeräte und Ersatzteile | Pro Games','Pro Games Kataloge für Arcade-Geräte und Ersatzteile als PDF ansehen und herunterladen. Finden Sie Modelle und Informationen zu passenden Komponenten.'],types:{boxer:'Boxautomat',combo:'Box- und Kickautomat',kids:'Kinderspielautomat',strength:'Kraftmesser',distributed:'Arcade-Spielgerät',hammer:'Hammerautomat',kicker:'Kickautomat',hockey:'Airhockey-Tisch',basket:'Basketballautomat',ride:'Kinderfahrgeschäft',dart:'Elektronischer Dartautomat',inflatable:'Hüpfburg für Kinder'},desc:(n,t)=>`${n}: ${t} aus dem Pro Games Sortiment. Bilder, technische Daten und Ausstattungsoptionen ansehen. Fragen Sie Ihr individuelles Angebot an.`},
fr:{home:['Fabricant de machines de boxe et de jeux d’arcade | Pro Games','Découvrez les machines de boxe, de frappe et de jeux d’arcade Pro Games Poland. Consultez les modèles, les coloris et les fiches techniques. Demandez un devis.'],collection:['Boxer Standard : 15 modèles de machines de boxe | Pro Games','Découvrez les 15 modèles Boxer Standard, dont Champion, Joker et MMA. Comparez les photos, les coloris et les caractéristiques, puis demandez un devis.'],catalog:['Catalogues de jeux d’arcade et pièces détachées | Pro Games','Consultez et téléchargez les catalogues PDF de machines et de pièces détachées Pro Games. Retrouvez les modèles et les informations sur les composants.'],types:{boxer:'Machine de boxe',combo:'Machine de boxe et de football',kids:'Jeu d’arcade pour enfants',strength:'Testeur de force',distributed:'Jeu d’arcade',hammer:'Machine de force à marteau',kicker:'Machine de football',hockey:'Table de air hockey',basket:'Machine de basket',ride:'Manège pour enfants',dart:'Jeu de fléchettes électronique',inflatable:'Château gonflable pour enfants'},desc:(n,t)=>`${n} : ${t.toLowerCase()} de la gamme Pro Games. Découvrez les photos, les données techniques et les options de configuration. Demandez un devis.`}
};
function type(key,p){if(key.startsWith('hammer'))return 'hammer';if(key==='kicker')return 'kicker';if(key.startsWith('air-hockey'))return 'hockey';if(key.includes('basketball'))return 'basket';if(key==='kiddie-ride')return 'ride';if(key==='cyberdart')return 'dart';if(key.startsWith('bouncy'))return 'inflatable';return p.category;}
const norm=s=>s.replace(/\s+/g,' ').trim();
const audit=[];
for(const p of pages){
 const {document:d}=parseHTML(fs.readFileSync(p.filename,'utf8'));const c=copy[p.lang],product=products[p.key],url=site.origin+p.url;
 const [title,description]=product?[`${product.name} | ${c.types[type(p.key,product)]} | Pro Games`,c.desc(product.name,c.types[type(p.key,product)])]:c[p.kind];
 d.title=title;
 function meta(selector,attrs){let e=d.querySelector(selector);if(!e){e=d.createElement('meta');d.head.append(e);}for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);}
 meta('meta[name=description]',{name:'description',content:description});
 meta('meta[name=robots]',{name:'robots',content:'index,follow,max-image-preview:large'});
 for(const family of ['og','twitter'])for(const[k,v]of Object.entries({title,description})){const attr=family==='og'?'property':'name';meta(`meta[${attr}="${family}:${k}"]`,{[attr]:family+':'+k,content:v});}
 meta('meta[property="og:url"]',{property:'og:url',content:url});
 meta('meta[name="twitter:image:alt"]',{name:'twitter:image:alt',content:d.querySelector('meta[property="og:image:alt"]').content});
 const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')];
 function identities(o){if(Array.isArray(o))return o.forEach(identities);if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(k==='@id'&&typeof v==='string'&&/#(organization|website)$/.test(v))o[k]=site.origin+'/#'+v.split('#')[1];else identities(v);}}
 for(const el of schemas){const o=JSON.parse(el.textContent);identities(o);
  if(['WebPage','CollectionPage'].includes(o['@type'])){o.name=title;o.description=description;o.inLanguage=p.lang;o.url=url;o['@id']=url+'#webpage';o.primaryImageOfPage={'@type':'ImageObject',url:d.querySelector('meta[property="og:image"]').content};}
  if(o['@type']==='Organization'){o.url=site.origin+'/';o.contactPoint.forEach(cp=>cp.availableLanguage=site.languages);}
  if(o['@type']==='WebSite'){o.url=site.origin+'/';o.inLanguage=site.languages;}
  if(o['@type']==='Product'){
   o.category=c.types[type(p.key,product)];o.description=[...d.querySelectorAll('.detail-lead p')].map(e=>norm(e.textContent)).join('\n\n')||o.description;
   if(product.category==='distributed'){delete o.manufacturer;delete o.brand;} // Distributed products are not asserted to be manufactured by Pro Games.
  }
  el.textContent=JSON.stringify(o).replace(/</g,'\\u003c');
 }
 if(p.kind==='home'){
  for(const el of d.querySelectorAll('script[type="application/ld+json"]'))if(JSON.parse(el.textContent)['@id']===url+'#machines')el.remove();
  const links=[...d.querySelectorAll('.product-card a[href]')];const seen=new Set();const items=[];
  for(const a of links){const href=a.getAttribute('href');if(!href||seen.has(href))continue;seen.add(href);const name=a.getAttribute('aria-label')||norm(a.textContent);items.push({'@type':'ListItem',position:items.length+1,url:new URL(href,site.origin).href,name});}
  if(items.length){const el=d.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ItemList','@id':url+'#machines',name:d.querySelector('#machines h2').textContent,inLanguage:p.lang,itemListElement:items});d.head.append(el);}
 }
 fs.writeFileSync(p.filename,'<!doctype html>\n'+d.documentElement.outerHTML);p.title=title;audit.push({url,language:p.lang,title,description,titleLength:title.length,descriptionLength:description.length});
}
// Preserve canonical URLs/hreflang and expose all product colour photos to image search.
let sitemap=fs.readFileSync('sitemap.xml','utf8');
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
for(const p of pages.filter(p=>p.kind==='product')){
 const start='<url><loc>'+site.origin+p.url+'</loc>';
 const at=sitemap.indexOf(start),end=sitemap.indexOf('</url>',at);
 const block=sitemap.slice(at,end);
 const images=[...new Set([products[p.key].image,...products[p.key].variants.map(v=>v.image)])];
 const next=block.replace(/<image:image>[\s\S]*?<\/image:image>/g,'')+images.map(src=>'<image:image><image:loc>'+xml(site.origin+src)+'</image:loc></image:image>').join('');
 sitemap=sitemap.slice(0,at)+next+sitemap.slice(end);
}
fs.writeFileSync('sitemap.xml',sitemap);
fs.writeFileSync('build/pages.json',JSON.stringify(pages,null,2));
fs.writeFileSync('build/seo-audit.json',JSON.stringify(audit,null,2));
console.log(`SEO: ${pages.length} localised titles/descriptions; consistent organisation identity; no invented prices or ratings.`);
