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

if(grid){
  grid.innerHTML=Object.entries(products).map(([slug,p])=>{
    const label=isES?(es.labels[p.label]||p.label):p.label;
    const desc=isES?((window.PRODUCT_ES||{})[slug]?.desc||p.desc):p.desc;
    const url=`${isES?'/product-es.html':'/product.html'}?model=${encodeURIComponent(slug)}`;
    return `<article class="product-card reveal" data-category="${p.category}" data-search="${`${p.name} ${label} ${desc}`.toLowerCase().replace(/"/g,'&quot;')}"><a href="${url}" aria-label="${isES?'Ver':'View'} ${p.name}"><div class="card-media"><img loading="lazy" src="${p.image}" alt="${p.name} by Pro Games" referrerpolicy="no-referrer">${p.tag?`<span class="tag">${p.tag}</span>`:''}</div><div class="card-body"><p>${label}</p><h3>${p.name}</h3><span>${UI.view}</span></div></a></article>`;
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
  if(productCount) productCount.textContent=`${visible} ${visible===1?UI.shownSingular:UI.shownPlural}`;
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

const contactForm=document.querySelector('#contactForm');
if(contactForm){
  const statusEl=document.querySelector('#formStatus');
  const submitBtn=contactForm.querySelector('button[type="submit"]');
  const messages=isES?{
    sending:'Enviando…',
    success:'Gracias. Tu consulta ha sido enviada correctamente.',
    error:'No se pudo enviar el mensaje. Inténtalo de nuevo o escribe a office@progames.pl.',
    invalid:'Completa tu nombre, email y mensaje.'
  }:{
    sending:'Sending…',
    success:'Thank you. Your inquiry has been sent successfully.',
    error:'We could not send your message. Please try again or email office@progames.pl.',
    invalid:'Please complete your name, email and message.'
  };

  contactForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const payload=Object.fromEntries(new FormData(contactForm).entries());
    if(!payload.name?.trim()||!payload.email?.trim()||!payload.message?.trim()){
      if(statusEl){statusEl.textContent=messages.invalid;statusEl.dataset.state='error';}
      return;
    }
    if(submitBtn){submitBtn.disabled=true;submitBtn.dataset.originalText=submitBtn.textContent;submitBtn.textContent=messages.sending;}
    if(statusEl){statusEl.textContent='';statusEl.dataset.state='';}
    try{
      const response=await fetch('/api/contact',{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload)
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Request failed');
      contactForm.reset();
      if(productInterest)productInterest.value='';
      if(statusEl){statusEl.textContent=messages.success;statusEl.dataset.state='success';}
    }catch(error){
      console.error('Contact form error:',error);
      if(statusEl){statusEl.textContent=messages.error;statusEl.dataset.state='error';}
    }finally{
      if(submitBtn){submitBtn.disabled=false;submitBtn.textContent=submitBtn.dataset.originalText||(isES?'Enviar consulta':'Send inquiry');}
    }
  });
}
