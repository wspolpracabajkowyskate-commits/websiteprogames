const lang=document.documentElement.lang;
const isES=lang==='es';
const isPL=lang==='pl';
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
if(!collection)listing.push(['parts-list',{name:isPL?'Części zamienne':isES?'Repuestos':'Parts list',category:'parts',label:isPL?'KATALOG CZĘŚCI ZAMIENNYCH':isES?'CATÁLOGO DE REPUESTOS':'SPARE PARTS CATALOG',image:'/assets/products/parts-list.webp',directURL:routes.catalog(lang)+'?catalog=parts'},false]);
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
    }).join(''):`<img loading="lazy" src="${variant?.image||p.image}" alt="${p.name} by Pro Games">`;
    const cta=p.directURL?(isPL?'Zobacz katalog części ↗':isES?'Ver catálogo de repuestos ↗':'View parts catalog ↗'):isCollection?(isPL?`Zobacz ${p.slugs.length} modeli ↗`:isES?`Ver ${p.slugs.length} modelos ↗`:`Explore ${p.slugs.length} models ↗`):UI.view;
    return `<article class="product-card reveal ${isCollection?'collection-card':''}" data-slug="${slug}" data-category="${p.category}" data-search="${escapeAttribute(`${p.name} ${label} ${desc} ${members}`.toLowerCase())}"><a href="${url}" aria-label="${isPL?'Zobacz':isES?'Ver':'View'} ${p.name}"><div class="card-media ${isCollection?'collection-cover':''}">${cover}${p.tag?`<span class="tag">${isPL?p.tag.replace('NEW','NOWOŚĆ'):isES?p.tag.replace('NEW','NUEVO').replace('BESTSELLER','MÁS VENDIDO'):p.tag}</span>`:''}${isCollection?`<span class="tag">${p.slugs.length} ${isPL?'MODELI':isES?'MODELOS':'MODELS'}</span>`:''}</div><div class="card-body"><p>${isCollection?(isPL?'KOLEKCJA / BOKSERY':isES?'COLECCIÓN / BOXERS':'COLLECTION / BOXERS'):label}</p><h3>${p.name}</h3><span>${cta}</span></div></a></article>`;
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
  const color=isPL?(es.colors?.[variant.name]||variant.name):isES?(variant.nameES||es.colors?.[variant.name]||variant.name):variant.name;
  const optionName=o=>isPL?(o.pl||o.en):isES?o.es:o.en;
  const lines=[(isPL?'Model: ':isES?'Modelo: ':'Model: ')+quoteProduct.name,(isPL?'Kolor / wykończenie: ':isES?'Color / acabado: ':'Colour / finish: ')+color,
    (isPL?'Płatności i wydawanie: ':isES?'Pago y dispensación: ':'Payment & dispensing: ')+(chosen.filter(o=>o.group==='payment').map(optionName).join(', ')||(isPL?'Konfiguracja standardowa · do potwierdzenia':isES?'Configuración estándar · por confirmar':'Standard configuration · to be confirmed'))];
  window.PG_QUOTE_OPTIONS.filter(o=>o.group==='extras').forEach(o=>lines.push(optionName(o)+': '+(chosen.some(c=>c.id===o.id)?(isPL?'Tak':isES?'Sí':'Yes'):(isPL?'Nie':'No'))));
  configurationText=lines.join('\n');
  const summary=document.createElement('section');summary.className='quote-request-summary';
  const title=document.createElement('h3');title.textContent=isPL?'Twoje zapytanie o konfigurację':isES?'Tu solicitud de configuración':'Your configuration request';
  const copy=document.createElement('p');copy.textContent=configurationText;
  const edit=document.createElement('a');edit.textContent=isPL?'Edytuj konfigurację ↗':isES?'Editar configuración ↗':'Edit configuration ↗';
  const query=new URLSearchParams({variant:variant.id});if(chosen.length)query.set('options',chosen.map(o=>o.id).join(','));
  edit.href=routes.product(lang,quoteParams.get('model'))+'?'+query;
  summary.append(title,copy,edit);document.querySelector('.contact-form').prepend(summary);
  productInterest.addEventListener('change',()=>{if(productInterest.value!==quoteProduct.name){configurationText='';summary.remove();}});
  document.querySelectorAll('.language-switch a,.mobile-language a').forEach(a=>{
    const language=a.getAttribute('lang')||a.getAttribute('hreflang');if(!['en','pl','es'].includes(language))return;
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
  location.href=window.PG_INQUIRY_URL(data);
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
