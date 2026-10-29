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

// Halloween: ghosts float down for 2.5 seconds after the page opens, fading out at the end.
// All fall at the same pace; each one sways and drifts its own way (left or right), like a real ghost.
(() => {
  if (window.PG_HALLOWEEN_PLAYED) return;
  window.PG_HALLOWEEN_PLAYED = true;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || document.hidden) return;
  const STEPS = 12;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:90;overflow:hidden;user-select:none';
  const height = window.innerHeight, width = window.innerWidth;
  // phone: fewer, smaller ghosts that drift down more gently and start fading early, slowly
  const phone = width <= 600;
  const TOTAL = 2500, FADE = phone ? 1100 : 700;
  const count = phone ? 6 : 11;
  const fall = height * (phone ? .34 : .85);
  // phone: ghosts appear scattered over the whole screen (each in its own height band) and float down a little
  const bands = [...Array(count).keys()].sort(() => Math.random() - .5);
  const animations = [];
  let done = false;
  const cleanup = () => {
    if (done) return; done = true;
    animations.forEach(a => a.cancel());
    layer.remove();
    document.removeEventListener('visibilitychange', onVisibility);
  };
  const onVisibility = () => { if (document.hidden) cleanup(); };
  document.body.append(layer);
  for (let i = 0; i < count; i++) {
    const ghost = document.createElement('span');
    const size = phone ? 25 + Math.random() * 7 : 24 + Math.random() * 10;
    const x = 20 + ((i + .2 + Math.random() * .6) / count) * Math.max(0, width - 80);
    const startY = phone ? height * (.04 + (bands[i] + Math.random() * .7) / count * .72) : -60 + Math.random() * height * .25;           // staggered heights instead of different speeds
    const dir = Math.random() < .5 ? -1 : 1;                      // drifts left or right
    const drift = dir * (phone ? 15 + Math.random() * 25 : 30 + Math.random() * 60);
    const wobble = phone ? 6 + Math.random() * 6 : 10 + Math.random() * 10, phase = Math.random() * Math.PI * 2, waves = 1.5 + Math.random();
    ghost.textContent = '👻';
    ghost.style.cssText = `position:absolute;top:0;left:${x}px;font-size:${size}px;line-height:1.3;font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;opacity:0;will-change:transform,opacity;filter:drop-shadow(0 2px 5px rgba(54,25,83,.18))${dir < 0 ? ';scale:-1 1' : ''}`;
    layer.append(ghost);
    const frames = [];
    for (let k = 0; k <= STEPS; k++) {
      const t = k / STEPS;
      let dx, dy, rot;
      if (phone) { // phone: a smooth glide down, easing in, with a slight slant one way (no swaying)
        const e = t * t * (1.6 - .6 * t);
        dx = drift * .6 * e; dy = startY + fall * e; rot = dir * (4 + 4 * t);
      } else {
        const w = Math.sin(phase + t * waves * Math.PI * 2);
        dx = drift * t + wobble * w; dy = startY + fall * t; rot = dir * 8 + w * 10;
      }
      frames.push({ transform: `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) rotate(${rot.toFixed(1)}deg)`, opacity: t === 0 ? 0 : phone && k === 1 ? .45 : .9, offset: t });
    }
    animations.push(ghost.animate(frames, { duration: TOTAL, easing: 'linear', fill: 'both' }));
  }
  // the whole flock fades away during the last part of the 2.5 s
  animations.push(layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, delay: TOTAL - FADE, easing: phone ? 'linear' : 'ease-in', fill: 'forwards' }));
  document.addEventListener('visibilitychange', onVisibility);
  window.setTimeout(cleanup, TOTAL + 50);
})();
