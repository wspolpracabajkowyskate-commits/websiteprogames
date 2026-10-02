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
    }).join(''):`<img loading="lazy" src="${variant?.image||p.image}" alt="${p.name} by Pro Games">`;
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
if(productInterest&&quoteProduct){
  productInterest.value=quoteProduct.name;
  const variant=quoteProduct.variants.find(v=>v.id===quoteParams.get('variant'));
  if(variant){const message=document.querySelector('[name="message"]');message.value=(isPL?'Wykończenie: ':isES?'Acabado: ':'Finish: ')+(isPL?(es.colors?.[variant.name]||variant.name):isES?(variant.nameES||es.colors?.[variant.name]||variant.name):variant.name)+'\n';}
}
const contactForm=document.querySelector('.contact-form');
contactForm?.addEventListener('submit',event=>{
  event.preventDefault();
  if(!contactForm.reportValidity()) return;
  const data=new FormData(contactForm);
  const body=[...data].map(([name,value])=>`${name}: ${value}`).join('\r\n');
  location.href='mailto:office@progames.pl?subject='+encodeURIComponent('Pro Games inquiry — '+(data.get('product')||'General'))+'&body='+encodeURIComponent(body);
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
