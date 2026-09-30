const products=window.PRODUCTS||{};
const params=new URLSearchParams(location.search);
const requested=params.get('model')||'champion';
const key=products[requested]?requested:'champion';
const p=products[key];
const isES=document.documentElement.lang==='es';
const es=window.PG_ES||{labels:{},specs:{},features:{},options:{},colors:{}};
const pEs=(window.PRODUCT_ES||{})[key]||{};
const CATALOG_URL=isES?'/catalog-es.html?catalog=machines':'/catalog.html?catalog=machines';
const HOME_URL=isES?'/es.html':'/';
const txt=isES?{
  all:'Todos los productos', allMachines:'Todas las máquinas', request:'Solicitar oferta', catalog:'Ver catálogo completo →', price:'El precio y la configuración final se cotizan individualmente.',
  colour:'COLOR / ACABADO', current:'Acabado actual', colourNote:'Selecciona un color o acabado. La foto principal cambia automáticamente para mostrar la variante real de Pro Games. El color, el diseño y la disponibilidad final se confirman con el equipo comercial.',
  finish:'ACABADO / DISEÑO', currentImage:'Imagen actual del producto', currentNote:'Consulta con el equipo comercial de Pro Games las opciones actuales de diseño, color y personalización para este modelo.',
  details:'DETALLES DEL PRODUCTO', built:'DISEÑADA PARA\nUSO COMERCIAL.', features:'Características principales', specs:'Especificaciones técnicas', options:'Opciones / mejoras disponibles',
  operator:'CONFIGURACIÓN PARA OPERADORES', one:'UNA MÁQUINA.\nCONFIGURADA PARA TU LOCAL.', operatorText:'El hardware de pago, el diseño gráfico, la iluminación, la configuración de tickets o premios y algunos detalles técnicos pueden variar según el mercado y el pedido. Contacta con Pro Games para confirmar la especificación exacta que necesitas.',
  explore:'DESCUBRE MÁS', related:'MÁQUINAS RELACIONADAS', viewAll:'Ver todos los productos ↗', ready:'¿HABLAMOS?', build:'CREEMOS TU PRÓXIMA\nEXPERIENCIA DE ENTRETENIMIENTO.', send:'Enviar consulta'
}:{
  all:'All products', allMachines:'All machines', request:'Request a quote', catalog:'View full product catalog →', price:'Pricing and final configuration are quoted individually.',
  colour:'COLOUR / ARTWORK', current:'Current finish', colourNote:'Select a colour / artwork option. The main product photo changes automatically to the corresponding real Pro Games variant. Final colour, artwork and availability are confirmed with the sales team.',
  finish:'FINISH / ARTWORK', currentImage:'Current product image', currentNote:'Ask the Pro Games sales team about current artwork, colour and branding options for this model.',
  details:'PRODUCT DETAILS', built:'BUILT FOR\nCOMMERCIAL PLAY.', features:'Key features', specs:'Technical specifications', options:'Available upgrades / options',
  operator:'OPERATOR CONFIGURATION', one:'ONE MACHINE.\nCONFIGURED FOR YOUR VENUE.', operatorText:'Payment hardware, artwork, lighting, ticket or prize configuration and some technical details can vary by market and order. Contact Pro Games for the current specification of the exact version you need.',
  explore:'EXPLORE MORE', related:'RELATED MACHINES', viewAll:'View all products ↗', ready:'READY TO TALK?', build:"LET'S BUILD YOUR NEXT\nENTERTAINMENT EXPERIENCE.", send:'Send an inquiry'
};
const label=isES?(es.labels[p.label]||p.label):p.label;
const desc=isES?(pEs.desc||p.desc):p.desc;
const localFeature=x=>isES?(es.features[x]||x):x;
const localOption=x=>isES?(es.options[x]||x):x;
const localSpec=x=>isES?(es.specs[x]||x):x;
const localColor=x=>isES?(es.colors[x]||x):x;

document.title=`${p.name} | Pro Games Poland`;
const meta=document.querySelector('meta[name="description"]');
if(meta) meta.content=isES?`${p.name} de Pro Games Poland. Descripción, especificaciones, colores disponibles y configuración para operadores.`:`${p.name} by Pro Games Poland. Product overview, verified dimensions, available finishes and operator configuration.`;

const detail=document.querySelector('#productDetail');
const variantList=(p.variants||[]).filter(v=>v&&v.image);
const mainVariant=variantList[0]||{name:'Product',image:p.image};
const spec=(p.spec||[]).map(([label,value])=>`<div><span>${localSpec(label)}</span><b>${value}</b></div>`).join('');
const features=(p.features||[]).map(x=>`<li>${localFeature(x)}</li>`).join('');
const options=(p.options||[]).map(o=>`<div><span>${localOption(o)}</span><b>+</b></div>`).join('');
const related=Object.entries(products)
  .filter(([slug,item])=>slug!==key && item.category===p.category)
  .slice(0,4)
  .map(([slug,item])=>`<a class="related-card" href="${isES?'/product-es.html':'/product.html'}?model=${slug}"><img src="${item.image}" alt="${item.name} by Pro Games" loading="lazy" referrerpolicy="no-referrer"><span>${isES?(es.labels[item.label]||item.label):item.label}</span><h3>${item.name}</h3></a>`).join('');

const swatchColor={White:'#f4f4f1',Orange:'#ff7a18',Yellow:'#ffd329',Green:'#27ae60',Blue:'#1976d2',Red:'#ef3123',Black:'#17191c',Brown:'#84543a',Graphite:'#4b4f55',Golden:'#c49b38',Arctic:'#d9f4ff',Matrix:'#4d56a8',Compact:'#7f8c8d',Standard:'#777',Kids:'#4fa3ff'};
const isGenericVariantName=(name='')=>/^Variant\s+\d+$/i.test(name);
const displayVariantName=(v,i)=>isGenericVariantName(v.name)?`${isES?'Variante':'Variant'} ${String(i+1).padStart(2,'0')}`:localColor(v.name);
const variantSelector=variantList.length>1?`<div class="gallery-variant-selector" aria-label="Choose colour or artwork variant"><div class="gallery-variant-head"><span>${txt.colour}</span><strong id="variantName">${displayVariantName(mainVariant,0)}</strong></div><div class="gallery-variant-swatches">${variantList.map((v,i)=>{const label=displayVariantName(v,i);const named=!isGenericVariantName(v.name);return `<button type="button" class="gallery-swatch ${i===0?'active':''} ${named?'has-colour-name':'photo-variant'}" data-index="${i}" aria-label="${isES?'Mostrar':'Show'} ${label}" title="${label}" style="--swatch:${swatchColor[v.name]||'#f2f2ef'}"><span class="swatch-dot">${named?'':`<img src="${v.image}" alt="" loading="lazy" referrerpolicy="no-referrer">`}</span><span class="swatch-label">${label}</span></button>`}).join('')}</div></div>`:'';
const finishBlock=variantList.length>1?`<div class="finish-selector compact"><p class="finish-note">${txt.colourNote}</p></div>`:`<div class="finish-selector single"><p class="kicker">${txt.finish}</p><h3>${txt.currentImage}</h3><p class="finish-note">${txt.currentNote}</p></div>`;

detail.innerHTML=`
<section class="product-detail-v2">
  <div class="product-gallery-panel">
    <div class="product-main-stage reveal in">
      <img id="productMainImage" src="${mainVariant.image}" alt="${p.name} — ${localColor(mainVariant.name)}" fetchpriority="high" referrerpolicy="no-referrer">
      ${p.tag?`<span class="product-tag">${p.tag}</span>`:''}
    </div>
    ${variantSelector}
  </div>
  <div class="product-info-panel">
    <a class="product-back-link" href="${HOME_URL}#machines">← ${txt.allMachines}</a>
    <p class="kicker">${label}</p>
    <h1>${p.name}</h1>
    <p class="detail-lead">${desc}</p>
    <div class="detail-actions">
      <a class="btn btn-primary" href="${HOME_URL}#contact">${txt.request}</a>
      <a class="btn btn-outline-dark" href="${CATALOG_URL}">${txt.catalog}</a>
    </div>
    <p class="quote-note">${txt.price}</p>
    ${finishBlock}
  </div>
</section>

<section class="product-facts section">
  <div class="product-facts-title"><p class="kicker">${txt.details}</p><h2>${txt.built.replace('\n','<br>')}</h2></div>
  <div class="product-facts-column"><h3>${txt.features}</h3><ul class="feature-list">${features}</ul></div>
  <div class="spec-table light"><h3>${txt.specs}</h3>${spec}</div>
  <div class="spec-table light"><h3>${txt.options}</h3>${options}</div>
</section>

<section class="operator-note section section-dark">
  <p class="kicker">${txt.operator}</p>
  <h2>${txt.one.replace('\n','<br>')}</h2>
  <p>${txt.operatorText}</p>
</section>

<section class="related section">
  <p class="kicker">${txt.explore}</p>
  <div class="related-heading"><h2>${txt.related}</h2><a href="${HOME_URL}#machines">${txt.viewAll}</a></div>
  <div class="related-grid">${related}</div>
</section>

<section class="product-cta section-dark">
  <p class="kicker">${txt.ready}</p>
  <h2>${txt.build.replace('\n','<br>')}</h2>
  <a class="btn btn-primary" href="${HOME_URL}#contact">${txt.send}</a>
</section>`;

function setVariant(index){
  const variant=variantList[index];
  if(!variant) return;
  const img=document.querySelector('#productMainImage');
  if(img){
    img.classList.add('switching');
    const preload=new Image();
    preload.onload=()=>{
      img.src=variant.image;
      img.alt=`${p.name} — ${localColor(variant.name)}`;
      requestAnimationFrame(()=>img.classList.remove('switching'));
    };
    preload.onerror=()=>img.classList.remove('switching');
    preload.src=variant.image;
  }
  const name=document.querySelector('#variantName');
  if(name) name.textContent=displayVariantName(variant,index);
  document.querySelectorAll('[data-index]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.index)===index));
}

const schema=document.createElement('script');
schema.type='application/ld+json';
schema.textContent=JSON.stringify({
  '@context':'https://schema.org','@type':'Product',name:p.name,
  description:desc,image:variantList.map(v=>v.image),
  brand:{'@type':'Brand',name:'Pro Games Poland'},
  manufacturer:{'@type':'Organization',name:'PRO GAMES POLAND Sp. z o.o.'},
  offers:{'@type':'Offer',url:location.href,availability:'https://schema.org/InStock',priceSpecification:{'@type':'PriceSpecification',description:isES?'Precio bajo consulta':'Price on request'}}
});
document.head.append(schema);

document.querySelectorAll('[data-index]').forEach(btn=>btn.addEventListener('click',()=>setVariant(Number(btn.dataset.index))));
