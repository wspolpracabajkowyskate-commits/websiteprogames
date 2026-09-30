const isES=document.documentElement.lang==='es';
const UI=isES?{
  view:'Ver producto ↗', shownSingular:'máquina mostrada', shownPlural:'máquinas mostradas', spare:'Repuestos', distribution:'Distribución / colaboración B2B', other:'Otro'
}:{
  view:'View product ↗', shownSingular:'machine shown', shownPlural:'machines shown', spare:'Spare parts', distribution:'Distribution / B2B partnership', other:'Other'
};
const es=window.PG_ES||{labels:{}};
const header=document.querySelector('#header');
addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>40),{passive:true});

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
let activeCategory='all';
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
const escapeAttribute=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
if(grid){
  grid.innerHTML=listing.map(([slug,p,isCollection])=>{
    const label=isES?(es.labels[p.label]||p.label):p.label;
    const desc=isES?((window.PRODUCT_ES||{})[slug]?.desc||p.desc||''):p.desc||'';
    const members=isCollection?p.slugs.map(id=>products[id].name).join(' '):'';
    const selected=collection?.coverVariants?.[slug];
    const variant=p.variants?.find(v=>v.id===selected);
    const url=isCollection?`/${slug}${isES?'-es':''}.html`:`${isES?'/product-es.html':'/product.html'}?model=${encodeURIComponent(slug)}${variant?'&variant='+encodeURIComponent(variant.id):''}`;
    const cover=isCollection?p.coverModels.map(id=>{
      const model=products[id];const photo=model.variants.find(v=>v.id===p.coverVariants[id])||model.variants[0];
      return `<img loading="lazy" src="${photo.image}" alt="${model.name}">`;
    }).join(''):`<img loading="lazy" src="${variant?.image||p.image}" alt="${p.name} by Pro Games">`;
    const cta=isCollection?(isES?`Ver ${p.slugs.length} modelos ↗`:`Explore ${p.slugs.length} models ↗`):UI.view;
    return `<article class="product-card reveal ${isCollection?'collection-card':''}" data-slug="${slug}" data-category="${p.category}" data-search="${escapeAttribute(`${p.name} ${label} ${desc} ${members}`.toLowerCase())}"><a href="${url}" aria-label="${isES?'Ver':'View'} ${p.name}"><div class="card-media ${isCollection?'collection-cover':''}">${cover}${p.tag?`<span class="tag">${p.tag}</span>`:''}${isCollection?`<span class="tag">${p.slugs.length} ${isES?'MODELOS':'MODELS'}</span>`:''}</div><div class="card-body"><p>${isCollection?(isES?'COLECCIÓN / BOXERS':'COLLECTION / BOXERS'):label}</p><h3>${p.name}</h3><span>${cta}</span></div></a></article>`;
  }).join('');
}

function applyProductFilters(){
  const cards=[...document.querySelectorAll('.product-card')];
  let visible=0;
  cards.forEach(card=>{
    const categoryMatch=activeCategory==='all'||card.dataset.category===activeCategory;
    const queryMatch=!activeQuery||card.dataset.search.includes(activeQuery);
    const show=categoryMatch&&queryMatch;
    card.hidden=!show;
    if(show) visible++;
  });
  if(productCount) productCount.textContent=collection?`${visible} ${isES?'modelos mostrados':'models shown'}`:`${visible} ${isES?'productos / colecciones':'products / collections'}`;
  if(clearProductFilters) clearProductFilters.hidden=activeCategory==='all'&&!activeQuery;
}

const tabs=document.querySelectorAll('.category-tabs button');
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
if(productInterest){
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
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}else{
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
}

// Preserve the quoted product and finish when entering the contact form.
const quoteParams=new URLSearchParams(location.search);
const quoteProduct=Object.hasOwn(products,quoteParams.get('model'))?products[quoteParams.get('model')]:null;
if(productInterest&&quoteProduct){
  productInterest.value=quoteProduct.name;
  const variant=quoteProduct.variants.find(v=>v.id===quoteParams.get('variant'));
  if(variant){const message=document.querySelector('[name="message"]');message.value=(isES?'Acabado: ':'Finish: ')+(isES?(variant.nameES||es.colors?.[variant.name]||variant.name):variant.name)+'\n';}
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
  const empty=document.createElement('p');
  empty.className='product-empty';empty.setAttribute('role','status');empty.hidden=true;
  empty.textContent=isES?'No hay productos que coincidan. Cambia la búsqueda o borra los filtros.':'No matching products. Change your search or clear the filters.';
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
