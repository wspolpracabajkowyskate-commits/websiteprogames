const lang=document.documentElement.lang;
const isES=lang==='es';
const isPL=false; // New languages use the complete editorial dictionary.
const routes=window.PG_ROUTES;
const UI=isPL?{view:'Zobacz produkt ↗',shownSingular:'automat',shownPlural:'automaty',spare:'Części zamienne',distribution:'Dystrybucja / współpraca B2B',other:'Inne'}:isES?{
  view:'Ver producto ↗', shownSingular:'máquina mostrada', shownPlural:'máquinas mostradas', spare:'Repuestos', distribution:'Distribución / colaboración B2B', other:'Otro'
}:{
  view:'View product ↗', shownSingular:'machine shown', shownPlural:'machines shown', spare:'Spare parts', distribution:'Distribution / B2B partnership', other:'Other'
};
const es=(isPL?window.PG_PL:window.PG_ES)||{labels:{}};
const translations=(isPL?window.PRODUCT_PL:window.PRODUCT_ES)||{};
const header=document.querySelector('#header');
let headerScrolled=header?.classList.contains('scrolled');
addEventListener('scroll',()=>{const next=scrollY>40;if(next!==headerScrolled){header?.classList.toggle('scrolled',next);headerScrolled=next;}},{passive:true});

const toggle=document.querySelector('.menu-toggle');
const mobile=document.querySelector('#mobileNav');
toggle?.addEventListener('click',()=>{
  const open=toggle.getAttribute('aria-expanded')==='true';
  toggle.setAttribute('aria-expanded',String(!open));
  mobile?.classList.toggle('open',!open);
});
mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  mobile.classList.remove('open');
  toggle?.setAttribute('aria-expanded','false');
}));

const products=window.PRODUCTS||{};
const grid=document.querySelector('#productGrid');
const productCount=document.querySelector('#productCount');
const productSearch=document.querySelector('#productSearch');
const clearProductFilters=document.querySelector('#clearProductFilters');
const categoryParam=new URLSearchParams(location.search).get('category');
let activeCategory=['boxer','combo','kids','strength','distributed'].includes(categoryParam)?categoryParam:'all';
let activeQuery='';

// Render one family card on the homepage, and its members on the family page.
const collections=window.PRODUCT_COLLECTIONS||{};
const collectionKey=grid?.dataset.collection;
const collection=Object.hasOwn(collections,collectionKey)?collections[collectionKey]:null;
const listing=[];
if(collection){
  collection.slugs.forEach(slug=>{if(products[slug]) listing.push([slug,products[slug],false]);});
}else{
  const shownCollections=new Set();
  Object.entries(products).forEach(([slug,p])=>{
    const family=Object.entries(collections).find(([,c])=>c.slugs.includes(slug));
    if(!family){listing.push([slug,p,false]);return;}
    if(!shownCollections.has(family[0])){listing.push([family[0],family[1],true]);shownCollections.add(family[0]);}
  });
}
// Prioritise the new 2026 models without changing the Standard collection order.
if(!collection){const featured=['hammer-2026','win-a-toy','leader-rank'];listing.sort((a,b)=>{const rank=id=>{const i=featured.indexOf(id);return i<0?featured.length:i;};return rank(a[0])-rank(b[0]);});}
if(!collection){const i=listing.findIndex(x=>x[0]==='double-hit-gift-2');if(i>=0){const item=listing.splice(i,1)[0];listing.splice(listing.findIndex(x=>x[0]==='double-hit-kids-gift')+1,0,item);}}
if(!collection)listing.push(['parts-list',{name:isES?'Repuestos':'Parts list',category:'parts',label:isES?'CATÁLOGO DE REPUESTOS':'SPARE PARTS CATALOG',image:'/assets/products/parts-list.webp',directURL:routes.catalog(lang)+'?catalog=parts'},false]);
const escapeAttribute=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
if(grid&&!grid.querySelector('.product-card')){
  grid.innerHTML=listing.map(([slug,p,isCollection])=>{
    const label=(isES||isPL)?(es.labels[p.label]||p.label):p.label;
    const desc=(isES||isPL)?(translations[slug]?.desc||p.desc||''):p.desc||'';
    const members=isCollection?p.slugs.map(id=>products[id].name).join(' '):'';
    const selected=collection?.coverVariants?.[slug];
    const variant=p.variants?.find(v=>v.id===selected);
    const url=p.directURL|| (isCollection?routes.collection(lang):routes.product(lang,slug)+(variant?'?variant='+encodeURIComponent(variant.id):''));
    const cover=isCollection?p.coverModels.map(id=>{
      const model=products[id];const photo=model.variants.find(v=>v.id===p.coverVariants[id])||model.variants[0];
      return `<img loading="lazy" src="${photo.image}" alt="${model.name}">`;
    }).join(''):`<img loading="lazy" src="${variant?.image||p.image}" alt="${p.name} — ${label}">`;
    const cta=p.directURL?(isES?'Ver catálogo de repuestos ↗':'View parts catalog ↗'):isCollection?(isPL?`Zobacz ${p.slugs.length} modeli ↗`:isES?`Ver ${p.slugs.length} modelos ↗`:`Explore ${p.slugs.length} models ↗`):UI.view;
    return `<article class="product-card reveal ${isCollection?'collection-card':''}" data-slug="${slug}" data-category="${p.category}" data-search="${escapeAttribute(`${p.name} ${label} ${desc} ${members}`.toLowerCase())}"><a href="${url}" aria-label="${isPL?'Zobacz':isES?'Ver':'View'} ${p.name}"><div class="card-media ${isCollection?'collection-cover':''}">${cover}${p.tag?`<span class="tag">${isES?p.tag.replace('NEW','NUEVO').replace('BESTSELLER','MÁS VENDIDO'):p.tag}</span>`:''}${isCollection?`<span class="tag">${p.slugs.length} ${isPL?'MODELI':isES?'MODELOS':'MODELS'}</span>`:''}</div><div class="card-body"><p>${isCollection?(isPL?'KOLEKCJA / BOKSERY':isES?'COLECCIÓN / BOXERS':'COLLECTION / BOXERS'):label}</p><h3>${p.name}</h3><span>${cta}</span></div></a></article>`;
  }).join('');
}

const cards=[...document.querySelectorAll('.product-card')];
function applyProductFilters(){
  let visible=0;
  cards.forEach(card=>{
    const categoryMatch=activeCategory==='all'||card.dataset.category===activeCategory;
    const queryMatch=!activeQuery||card.dataset.search.includes(activeQuery);
    const show=categoryMatch&&queryMatch;
    card.hidden=!show;
    if(show) visible++;
  });
  if(productCount) productCount.textContent=collection?`${visible} ${isPL?'widocznych modeli':isES?'modelos mostrados':'models shown'}`:`${visible} ${isPL?'produktów / kolekcji':isES?'productos / colecciones':'products / collections'}`;
  if(clearProductFilters) clearProductFilters.hidden=activeCategory==='all'&&!activeQuery;
  window.PG_LOCALIZE?.(productCount);
}

const tabs=document.querySelectorAll('.category-tabs button');
tabs.forEach(btn=>btn.classList.toggle('active',btn.dataset.filter===activeCategory));
tabs.forEach(btn=>btn.addEventListener('click',()=>{
  tabs.forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  activeCategory=btn.dataset.filter||'all';
  applyProductFilters();
}));

productSearch?.addEventListener('input',()=>{
  activeQuery=productSearch.value.trim().toLowerCase();
  applyProductFilters();
});
clearProductFilters?.addEventListener('click',()=>{
  activeCategory='all';activeQuery='';
  if(productSearch) productSearch.value='';
  tabs.forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));
  applyProductFilters();
});
applyProductFilters();

const productInterest=document.querySelector('#productInterest');
if(productInterest&&productInterest.options.length<=1){
  [...productInterest.querySelectorAll('option')].slice(1).forEach(option=>option.remove());
  Object.values(products).forEach(p=>{
    const option=document.createElement('option');
    option.value=p.name;option.textContent=p.name;productInterest.append(option);
  });
  [UI.spare,UI.distribution,UI.other].forEach(name=>{
    const option=document.createElement('option');option.value=name;option.textContent=name;productInterest.append(option);
  });
}

if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -30px'});
  document.querySelectorAll('.reveal').forEach(el=>{if(el.classList.contains('product-card'))el.classList.remove('in');io.observe(el)});
}else{
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
}

// Preserve the quoted product and finish when entering the contact form.
const quoteParams=new URLSearchParams(location.search);
const quoteProduct=Object.hasOwn(products,quoteParams.get('model'))?products[quoteParams.get('model')]:null;
let configurationText='';
if(productInterest&&quoteProduct){
  productInterest.value=quoteProduct.name;
  const variant=quoteProduct.variants.find(v=>v.id===quoteParams.get('variant'))||quoteProduct.variants[0];
  const chosen=window.PG_QUOTE_SELECTION(quoteParams);
  const color=isES?(variant.nameES||es.colors?.[variant.name]||variant.name):variant.name;
  const lines=[(isES?'Modelo: ':'Model: ')+quoteProduct.name,(isES?'Color / acabado: ':'Colour / finish: ')+color,
    (isES?'Pago y dispensación: ':'Payment & dispensing: ')+(chosen.filter(o=>o.group==='payment').map(o=>isES?o.es:o.en).join(', ')||(isES?'Configuración estándar · por confirmar':'Standard configuration · to be confirmed'))];
  window.PG_QUOTE_OPTIONS.filter(o=>o.group==='extras').forEach(o=>lines.push((isES?o.es:o.en)+': '+(chosen.some(c=>c.id===o.id)?(isES?'Sí':'Yes'):'No')));
  configurationText=lines.map(line=>{const split=line.indexOf(': ');if(split<0)return window.PG_T?.(line)||line;return (window.PG_T?.(line.slice(0,split))||line.slice(0,split))+': '+line.slice(split+2).split(', ').map(x=>window.PG_T?.(x)||x).join(', ');}).join('\n');
  const summary=document.createElement('section');summary.className='quote-request-summary';
  const title=document.createElement('h3');title.textContent=isES?'Tu solicitud de configuración':'Your configuration request';
  const copy=document.createElement('p');copy.textContent=configurationText;
  const edit=document.createElement('a');edit.textContent=isES?'Editar configuración ↗':'Edit configuration ↗';
  const query=new URLSearchParams({variant:variant.id});if(chosen.length)query.set('options',chosen.map(o=>o.id).join(','));
  edit.href=routes.product(lang,quoteParams.get('model'))+'?'+query;
  summary.append(title,copy,edit);document.querySelector('.contact-form').prepend(summary);
  productInterest.addEventListener('change',()=>{if(productInterest.value!==quoteProduct.name){configurationText='';summary.remove();}});
  document.querySelectorAll('.language-switch a,.mobile-language a').forEach(a=>{
    const language=a.getAttribute('lang')||a.getAttribute('hreflang');if(!window.PG_SITE.languages.includes(language))return;
    const homeQuery=new URLSearchParams(query);homeQuery.set('model',quoteParams.get('model'));
    a.href=routes.home(language)+'?'+homeQuery+'#inquiry';
  });
}
const contactForm=document.querySelector('.contact-form');
contactForm?.addEventListener('submit',event=>{
  event.preventDefault();
  if(!contactForm.reportValidity()) return;
  const data=new FormData(contactForm);
  if(configurationText)data.set('configuration',configurationText);
  if(window.PG_SEND_INQUIRY)window.PG_SEND_INQUIRY(data);else location.href=window.PG_INQUIRY_URL(data);
});
addEventListener('keydown',event=>{if(event.key==='Escape'){mobile?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}});
// Announce empty results and selected categories without leaving a blank grid.
if(grid){
  document.querySelectorAll('.product-empty').forEach(el=>el.remove());
  const empty=document.createElement('p');
  empty.className='product-empty';empty.setAttribute('role','status');empty.hidden=true;
  empty.textContent=isPL?'Brak pasujących produktów. Zmień wyszukiwanie lub wyczyść filtry.':isES?'No hay productos que coincidan. Cambia la búsqueda o borra los filtros.':'No matching products. Change your search or clear the filters.';
  grid.after(empty);
  const syncFilterState=()=>{
    empty.hidden=[...grid.querySelectorAll('.product-card')].some(card=>!card.hidden);
    tabs.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.filter===activeCategory)));
  };
  tabs.forEach(btn=>btn.addEventListener('click',syncFilterState));
  productSearch?.addEventListener('input',syncFilterState);
  clearProductFilters?.addEventListener('click',syncFilterState);
  syncFilterState();
}

window.PG_LOCALIZE?.();

// About section: trust tiles - timeline (2012 -> this year), fleet of mini machines, export routes from
// Poland on the world map, staggered entrance. Decorative only (aria-hidden); content stays in the HTML.
(()=>{
  const list=document.querySelector('.stats-trust');if(!list)return;
  const still=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const year=list.querySelector('.stat-year');
  if(year){const now=Math.max(2026,new Date().getFullYear());year.insertAdjacentHTML('beforeend',`<div class="stat-timeline" aria-hidden="true"><span>2012</span><i><b></b></i><span>${now}</span></div>`);}
  // 10 000+ machines: count up the number in the heading, keeping its local thousands separator
  const count=list.querySelector('.stat-machines h3');let runCount=()=>{};
  if(count){const m=count.textContent.match(/\d{1,3}(?:([\s.,\u00a0\u202f])\d{3})+|\d{4,}/);
    if(m){const total=+m[0].replace(/\D/g,''),sep=m[1]||'',full=count.textContent,fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,sep);
      count.setAttribute('aria-label',full);
      runCount=()=>{const t0=performance.now(),dur=1600;const step=t=>{const k=Math.min((t-t0)/dur,1),e=1-Math.pow(1-k,3);
        count.textContent=full.replace(m[0],fmt(Math.round(total*e/10)*10));if(k<1)requestAnimationFrame(step);else count.textContent=full;};requestAnimationFrame(step);};}}
  // 100% made in Poland: rotating "Made in Poland" stamp with the flag in the middle
  const pl=list.querySelector('.stat-poland .stat-icon');
  if(pl)pl.insertAdjacentHTML('afterend','<div class="stat-stamp" aria-hidden="true"><svg viewBox="0 0 160 160"><defs><path id="statStampPath" d="M80 80m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0"/><clipPath id="statStampFlag"><circle cx="80" cy="80" r="34"/></clipPath></defs><circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 5"/><circle cx="80" cy="80" r="44" fill="none" stroke="currentColor" stroke-width="1.5"/><g class="stamp-text"><text font-family="Manrope,sans-serif" font-size="12.5" font-weight="800" letter-spacing="3.2" fill="currentColor"><textPath href="#statStampPath">MADE IN POLAND • PRO-GAMES POLAND •</textPath></text></g><g clip-path="url(#statStampFlag)"><rect x="40" y="40" width="80" height="40" fill="#fff"/><rect x="40" y="80" width="80" height="40" fill="#dc143c"/></g><circle cx="80" cy="80" r="34" fill="none" stroke="#e2e4e7"/></svg></div>');
  const map=list.querySelector('.stat-map');let routes=null;
  if(map){
    // same projection as /assets/maps/world-outline.svg (1000 x 460)
    const P=(lon,lat)=>[20+(lon+180)/360*960,20+(85-lat)/145*420];
    const [ox,oy]=P(18.6,49.95); // Jastrzębie-Zdrój
    const dest=[[-81.4,28.5],[-74,40.7],[-118.2,34],[-79.4,43.7],[-99.1,19.4],[-74.1,4.7],[-77,-12],[-46.6,-23.5],[-58.4,-34.6],[-70.7,-33.4],
      [-0.1,51.5],[-3.7,40.4],[-9.1,38.7],[2.35,48.9],[12.5,41.9],[18,59.3],[23.7,38],[29,41],[37.6,55.8],
      [31.2,30],[3.4,6.5],[36.8,-1.3],[28,-26.2],[55.3,25.2],[46.7,24.7],[72.9,19.1],[100.5,13.75],[103.8,1.35],[121,14.6],[127,37.5],[139.7,35.7],[115.9,-32],[151.2,-33.9],[174.8,-36.8]];
    const paths=dest.map(([lon,lat],i)=>{const [x,y]=P(lon,lat),mx=(ox+x)/2,my=(oy+y)/2,d=Math.hypot(x-ox,y-oy);
      return `<path pathLength="1" style="--i:${i*.55}" d="M${ox.toFixed(1)} ${oy.toFixed(1)}Q${mx.toFixed(1)} ${(my-d*.32).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/><circle class="dest-ring" style="--i:${i*.55}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/><circle class="dest" style="--i:${i*.55}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`;}).join('');
    map.insertAdjacentHTML('beforeend',`<svg class="stat-routes" viewBox="0 0 1000 460" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="statRouteGrad" x1="0" x2="1"><stop offset="0" stop-color="#ff4b13"/><stop offset="1" stop-color="#ffb08a"/></linearGradient></defs>${paths}<circle class="origin-ring" cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="6"/><circle class="origin" cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="5"/></svg>`);
    routes=map.querySelector('.stat-routes');
  }
  const tiles=[...list.querySelectorAll('.stat')];
  if(still||!('IntersectionObserver' in window)){tiles.forEach(t=>t.classList.add('is-in'));routes?.classList.add('is-on');return;}
  list.classList.add('stats-anim');
  tiles.forEach((t,i)=>t.style.transitionDelay=`0s,0s,0s,${i*110}ms,${i*110}ms`);
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;
    e.target.classList.add('is-in');if(e.target.contains(count))runCount();if(e.target.contains(routes))setTimeout(()=>routes.classList.add('is-on'),350);
    setTimeout(()=>e.target.style.transitionDelay='',1200);io.unobserve(e.target);}),{threshold:.25,rootMargin:'0px 0px -8% 0px'});
  tiles.forEach(t=>io.observe(t));
})();

