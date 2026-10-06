(()=>{
const products=window.PRODUCTS||{};
const params=new URLSearchParams(location.search);
const requested=document.body.dataset.model||params.get('model')||'champion';
const key=Object.hasOwn(products,requested)?requested:null;
if(!key){ document.title='Product not found | Pro Games Poland'; document.querySelector('#productDetail').innerHTML=document.documentElement.lang==='es'?'<section class="section"><h1>Producto no encontrado</h1><a href="/es.html#machines">Ver productos</a></section>':'<section class="section"><h1>Product not found</h1><a href="/#machines">View products</a></section>'; window.PG_LOCALIZE?.(); return; }
const p=products[key];
const lang=document.documentElement.lang;
const isES=lang==='es';
const isPL=false; // New languages use the complete editorial dictionary.
const routes=window.PG_ROUTES;
const es=(isPL?window.PG_PL:window.PG_ES)||{labels:{},specs:{},features:{},options:{},colors:{}};
const pEs=((isPL?window.PRODUCT_PL:window.PRODUCT_ES)||{})[key]||{};
const CATALOG_URL=routes.catalog(lang)+'?catalog=machines';
const HOME_URL=routes.home(lang);
const standardFamily=window.PRODUCT_COLLECTIONS?.['boxer-standard'];
const isStandard=standardFamily?.slugs.includes(key)||false;
const FAMILY_URL=routes.collection(lang);
const txt=isPL?{
 all:'Wszystkie produkty',allMachines:'Wszystkie automaty',request:'Zapytaj o ofertę',catalog:'Zobacz pełny katalog →',price:'Cena i ostateczna konfiguracja są ustalane indywidualnie.',
 colour:'KOLOR / WZÓR',current:'Wybrane wykończenie',colourNote:'Wybierz kolor lub wzór, aby zobaczyć zdjęcie tej wersji urządzenia. Dostępność i szczegóły konfiguracji potwierdza dział sprzedaży.',
 finish:'WYKOŃCZENIE / WZÓR',currentImage:'Zdjęcie produktu',currentNote:'Zapytaj Pro Games o dostępne wykończenia, kolory i możliwości personalizacji tego modelu.',
 details:'SZCZEGÓŁY PRODUKTU',built:'DO INTENSYWNEJ\nEKSPLOATACJI.',features:'Najważniejsze cechy',specs:'Dane techniczne',options:'Dostępne opcje i wyposażenie',
 operator:'KONFIGURACJA DLA OPERATORA',one:'TWÓJ AUTOMAT.\nDOPASOWANY DO LOKALU.',operatorText:'System płatności, grafika, oświetlenie, funkcje biletowe i nagrodowe oraz szczegóły techniczne zależą od modelu, rynku i zamówienia. Skontaktuj się z Pro Games, aby potwierdzić konfigurację odpowiednią dla Twojego obiektu.',
 explore:'POZNAJ WIĘCEJ',related:'POWIĄZANE AUTOMATY',viewAll:'Zobacz wszystkie produkty ↗',ready:'POROZMAWIAJMY',build:'STWÓRZMY TWOJĄ\nNOWĄ ATRAKCJĘ.',send:'Wyślij zapytanie'
}:isES?{
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
const label=(isES||isPL)?(es.labels[p.label]||p.label):p.label;
const desc=(isES||isPL)?(pEs.desc||p.desc):p.desc;
const escapeCopy=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const descriptionHTML=desc.split('\n\n').map(text=>`<p>${escapeCopy(text)}</p>`).join('\n');
const localFeature=x=>(isES||isPL)?(es.features[x]||x):x;
const localOption=x=>(isES||isPL)?(es.options[x]||x):x;
const localSpec=x=>(isES||isPL)?(es.specs[x]||x):x;
const localColor=x=>(isES||isPL)?(es.colors[x]||x):x;

if(!document.body.dataset.model) document.title=`${p.name} | Pro Games Poland`;
const meta=document.querySelector('meta[name="description"]');
if(meta&&!document.body.dataset.model) meta.content=isPL?`${p.name} — automat Pro Games. Kolory, zdjęcia, dane techniczne i konfiguracja dla operatorów.`:isES?`${p.name} de Pro Games Poland. Descripción, especificaciones, colores disponibles y configuración para operadores.`:`${p.name} by Pro Games Poland. Product overview, verified dimensions, available finishes and operator configuration.`;

const detail=document.querySelector('#productDetail');
const variantList=(p.variants||[]).filter(v=>v&&v.image);
let selectedIndex=Math.max(0,variantList.findIndex(v=>v.id===params.get('variant')));
const mainVariant=variantList[selectedIndex]||{name:'Product',image:p.image};
const spec=(p.spec||[]).map(([label,value])=>`<div><span>${localSpec(label)}</span><b>${localSpec(value)}</b></div>`).join('');
const features=(p.features||[]).map(x=>`<li>${localFeature(x)}</li>`).join('');
const options=(p.options||[]).map(o=>`<div><span>${localOption(o)}</span><b>+</b></div>`).join('');
const related=Object.entries(products)
  .filter(([slug,item])=>slug!==key && item.category===p.category && (!isStandard||standardFamily.slugs.includes(slug)))
  .slice(0,4)
  .map(([slug,item])=>`<a class="related-card" href="${routes.product(lang,slug)}"><img src="${item.image}" alt="${item.name} by Pro Games" loading="lazy" referrerpolicy="no-referrer"><span>${(isES||isPL)?(es.labels[item.label]||item.label):item.label}</span><h3>${item.name}</h3></a>`).join('');

const swatchColor={White:'#f4f4f1',Orange:'#ff7a18',Yellow:'#ffd329',Green:'#27ae60',Blue:'#1976d2',Red:'#ef3123',Black:'#17191c',Brown:'#84543a',Graphite:'#4b4f55',Golden:'#c49b38',Arctic:'#d9f4ff',Matrix:'#4d56a8',Compact:'#7f8c8d',Standard:'#777',Kids:'#4fa3ff',Purple:'#7b4cb8',Silver:'#bfc3c7',Pink:'#e85e9f'};
const isGenericVariantName=(name='')=>/^Variant\s+\d+$/i.test(name);
const rawVariantName=(v,i)=>isPL?(es.colors[v.name]||v.name):isES&&v.nameES?v.nameES:isGenericVariantName(v.name)?`${isES?'Variante':'Variant'} ${String(i+1).padStart(2,'0')}`:localColor(v.name);
const displayVariantName=(v,i)=>window.PG_T?.(rawVariantName(v,i))||rawVariantName(v,i);
const variantSelector=variantList.length>1?`<div class="gallery-variant-selector" aria-label="${isPL?'Wybierz kolor lub wzór':isES?'Elegir color o diseño':'Choose colour or artwork variant'}"><div class="gallery-variant-head"><span>${txt.colour}</span><strong id="variantName" aria-live="polite">${displayVariantName(mainVariant,selectedIndex)}</strong></div><div class="gallery-variant-swatches">${variantList.map((v,i)=>{const label=displayVariantName(v,i);const named=Boolean(swatchColor[v.color||v.name]);return `<button type="button" class="gallery-swatch ${i===selectedIndex?'active':''} ${named?'has-colour-name':'photo-variant'}" data-index="${i}" aria-pressed="${i===selectedIndex}" aria-label="${isPL?'Pokaż':isES?'Mostrar':'Show'} ${label}" title="${label}" style="--swatch:${swatchColor[v.color||v.name]||'#f2f2ef'}"><span class="swatch-dot">${named?'':`<img src="${v.image}" alt="" loading="lazy" referrerpolicy="no-referrer">`}</span><span class="swatch-label">${label}</span></button>`}).join('')}</div></div>`:'';
const quoteLabels=isES?{title:'CONFIGURA TU MÁQUINA',intro:'Selecciona las opciones, revisa el resumen y solicita un presupuesto.',payment:'Pago y dispensación',paymentNote:'Elige las opciones de pago y dispensación. Puedes seleccionar varias.',extras:'Opciones adicionales',summary:'Tu configuración',model:'Modelo',color:'Color / acabado',none:'Sin opciones adicionales',standard:'Configuración estándar · por confirmar',cta:'Solicitar esta configuración ↗',note:'El equipo de ventas confirmará la compatibilidad, la disponibilidad y el precio para este modelo.'}:{title:'CONFIGURE YOUR MACHINE',intro:'Select your options, review the summary and request a quote.',payment:'Payment & dispensing',paymentNote:'Choose the payment and dispensing options for your machine. Multiple selections are possible.',extras:'Additional options',summary:'Your configuration',model:'Model',color:'Colour / finish',none:'No additional options',standard:'Standard configuration · to be confirmed',cta:'Request this configuration ↗',note:'Our sales team will confirm compatibility, availability and pricing for this model.'};
const quoteOptions=window.PG_QUOTE_OPTIONS;
const selectedOptions=new Set(window.PG_QUOTE_SELECTION(params).map(o=>o.id));
const optionCards=group=>quoteOptions.filter(o=>o.group===group).map(o=>`<label class="config-option"><input type="checkbox" name="equipment" value="${o.id}" ${selectedOptions.has(o.id)?'checked':''}><span class="config-option-content"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${o.icon}</svg><span>${isES?o.es:o.en}</span><span class="config-check" aria-hidden="true"></span></span></label>`).join('');
const configurationHTML=`<section class="machine-config" aria-labelledby="configTitle"><p class="config-standard config-standard-coins">${isES?'Cada máquina incluye un monedero de serie. Puedes añadir un monedero adicional en el configurador.':'Every machine includes a coin acceptor as standard. You can add an extra coin acceptor in the configurator.'}</p><div class="config-heading"><p class="kicker">${quoteLabels.title}</p><h2 id="configTitle">${isES?'Elige tu equipamiento.':'Choose your equipment.'}</h2><p>${quoteLabels.intro}</p></div><fieldset><legend>${quoteLabels.payment}</legend><p class="config-helper">${quoteLabels.paymentNote}</p><div class="config-grid">${optionCards('payment')}</div></fieldset><fieldset><legend>${quoteLabels.extras}</legend><div class="config-grid">${optionCards('extras')}</div></fieldset><p class="config-standard">${isES?'Incluido de serie con cada máquina: cable de alimentación de 2 metros.':'Included as standard with every machine: 2-meter power cable.'}</p><div class="config-summary"><h3>${quoteLabels.summary}</h3><dl><div><dt>${quoteLabels.model}</dt><dd>${p.name}</dd></div><div><dt>${quoteLabels.color}</dt><dd id="configFinish"></dd></div><div><dt>${quoteLabels.payment}</dt><dd id="configPayment"></dd></div><div><dt>${quoteLabels.extras}</dt><dd id="configExtras"></dd></div></dl><a class="btn btn-primary config-quote" href="${HOME_URL}#contact">${quoteLabels.cta}</a><p class="config-footnote">${quoteLabels.note}</p><span id="configAnnouncement" class="config-sr" role="status" aria-live="polite"></span></div><noscript><p>${isES?'Activa JavaScript para añadir las opciones a tu consulta. También puedes escribirlas en el formulario de contacto.':'Enable JavaScript to include selected options in your enquiry, or list them in the contact form.'}</p></noscript></section>`;
const finishBlock=p.availableColors?'':variantList.length>1?`<div class="finish-selector compact"><p class="finish-note">${txt.colourNote}</p></div>`:`<div class="finish-selector single"><p class="kicker">${txt.finish}</p><h3>${displayVariantName(mainVariant,selectedIndex)}</h3><p class="finish-note">${txt.currentNote}</p></div>`;

const hasStaticDetail=Boolean(detail.querySelector('#productMainImage'));
if(!hasStaticDetail) detail.innerHTML=`
<section class="product-detail-v2 product-layout-v23">
  <div class="product-intro">
    <a class="product-back-link" href="${isStandard?FAMILY_URL:HOME_URL+'#machines'}">← ${isStandard?'Boxer Standard':txt.allMachines}</a>
    <p class="kicker">${label}</p>
    <h1>${p.name}</h1>
  </div>
  <div class="product-gallery-panel">
    <div class="product-main-stage reveal in">
      <img id="productMainImage" src="${mainVariant.image}" alt="${p.name} — ${displayVariantName(mainVariant,selectedIndex)}" fetchpriority="high" referrerpolicy="no-referrer">
      ${p.tag?`<span class="product-tag">${isES?p.tag.replace('NEW','NUEVO').replace('BESTSELLER','MÁS VENDIDO'):p.tag}</span>`:''}
    </div>
  </div>
  <div class="product-info-panel">
    <div class="detail-lead">${descriptionHTML}</div>
    <a class="product-catalog-link" href="${CATALOG_URL}">${txt.catalog}</a>
    <p class="quote-note">${txt.price}</p>
  </div>
  <div class="product-config-panel">
    ${variantSelector}${p.availableColors?`<div class="gallery-variant-selector"><div class="gallery-variant-head"><span>${isES?'COLORES DISPONIBLES':'AVAILABLE COLORS'}</span></div><div class="gallery-variant-swatches">${p.availableColors.map(color=>`<span class="gallery-swatch" style="--swatch:${swatchColor[color]}"><span class="swatch-dot"></span><span class="swatch-label">${localColor(color)}</span></span>`).join('')}</div></div>`:''}<p id="variantStatus" class="variant-status" role="status" aria-live="polite"></p>
    ${configurationHTML}
  </div>
</section>

${(p.features.length||p.spec.length||p.options.length)?`<section class="product-facts section" style="--facts-columns:${[p.features,p.spec,p.options].filter(items=>items.length).length}">
  <div class="product-facts-title"><p class="kicker">${txt.details}</p><h2>${isES?'Especificaciones y características':'Specifications & features'}</h2></div>
  ${p.features.length?`<div class="product-facts-column"><h3>${txt.features}</h3><ul class="feature-list">${features}</ul></div>`:''}
  ${p.spec.length?`<div class="spec-table light"><h3>${txt.specs}</h3>${spec}</div>`:''}
  ${p.options.length?`<div class="spec-table light"><h3>${txt.options}</h3>${options}</div>`:''}
</section>`:''}

<section class="operator-note section section-dark">
  <p class="kicker">${txt.operator}</p>
  <h2>${txt.one.replace('\n','<br>')}</h2>
  <p>${txt.operatorText}</p>
</section>

<section class="related section">
  <p class="kicker">${txt.explore}</p>
  <div class="related-heading"><h2>${txt.related}</h2><a href="${isStandard?FAMILY_URL:HOME_URL+'#machines'}">${isStandard?(isPL?'Wszystkie modele Boxer Standard ↗':isES?'Ver todos los Boxer Standard ↗':'View all Boxer Standard models ↗'):txt.viewAll}</a></div>
  <div class="related-grid">${related}</div>
</section>
`;

let variantRequest=0;
function updateVariantLinks(){
  const variant=variantList[selectedIndex]||mainVariant;
  const selected=quoteOptions.filter(o=>selectedOptions.has(o.id));
  const query=new URLSearchParams({model:key,variant:variant.id});
  if(selected.length)query.set('options',selected.map(o=>o.id).join(','));
  const productQuery=new URLSearchParams(query);productQuery.delete('model');
  document.querySelectorAll('[data-lang-link]').forEach(a=>{a.href=routes.product(a.dataset.langLink,key)+'?'+productQuery;});
  document.querySelectorAll('.config-quote').forEach(a=>{a.href=HOME_URL+'?'+query+'#inquiry';});
  document.querySelector('#configFinish').textContent=displayVariantName(variant,selectedIndex);
  document.querySelector('#configPayment').textContent=selected.filter(o=>o.group==='payment').map(o=>isES?o.es:(window.PG_T?.(o.en)||o.en)).join(', ')||quoteLabels.standard;
  document.querySelector('#configExtras').textContent=selected.filter(o=>o.group==='extras').map(o=>isES?o.es:(window.PG_T?.(o.en)||o.en)).join(', ')||quoteLabels.none;
  window.PG_LOCALIZE?.(document.querySelector('.config-summary'));
}
// Hydrate pre-rendered controls from the URL; native checkbox semantics preserve keyboard access.
document.querySelectorAll('.config-option input').forEach(input=>{
  input.checked=selectedOptions.has(input.value);
  input.addEventListener('change',()=>{
    if(input.checked)selectedOptions.add(input.value);else selectedOptions.delete(input.value);
    updateVariantLinks();
    const url=new URL(location.href);const values=quoteOptions.filter(o=>selectedOptions.has(o.id)).map(o=>o.id).join(',');
    if(values)url.searchParams.set('options',values);else url.searchParams.delete('options');
    history.replaceState(null,'',url);
    document.querySelector('#configAnnouncement').textContent=isES?'Configuración actualizada.':(window.PG_T?.('Configuration updated.')||'Configuration updated.');
  });
});
function setVariant(index){
  const variant=variantList[index];
  if(!variant) return;
  const token=++variantRequest;
  const img=document.querySelector('#productMainImage');
  const status=document.querySelector('#variantStatus');
  // Keep the current image stable until the selected variant is ready.
  img.setAttribute('aria-busy','true');
  status.textContent='';
  const preload=new Image();
  preload.onload=()=>{
    if(token!==variantRequest) return;
    selectedIndex=index;
    img.src=variant.image;
    img.alt=`${p.name} — ${displayVariantName(variant,index)}`;
    document.querySelector('#variantName').textContent=displayVariantName(variant,index);
    document.querySelectorAll('.gallery-swatch').forEach(btn=>{
      const active=Number(btn.dataset.index)===index;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    img.classList.remove('switching');img.setAttribute('aria-busy','false');status.textContent='';
    const url=new URL(location.href);url.searchParams.set('variant',variant.id);
    history.replaceState(null,'',url);
    updateVariantLinks();
  };
  preload.onerror=()=>{
    if(token!==variantRequest) return;
    img.classList.remove('switching');img.setAttribute('aria-busy','false');
    status.textContent=isPL?'Nie udało się wczytać zdjęcia. Spróbuj ponownie.':isES?'No se pudo cargar la imagen. Vuelve a intentarlo.':(window.PG_T?.('The image could not be loaded. Please try again.')||'The image could not be loaded. Please try again.');
  };
  preload.src=variant.image;
}
if(hasStaticDetail&&selectedIndex!==0) setVariant(selectedIndex);
updateVariantLinks();

// Product and breadcrumb structured data are included in the generated HTML.
document.querySelectorAll('[data-index]').forEach(btn=>btn.addEventListener('click',()=>setVariant(Number(btn.dataset.index))));

window.PG_LOCALIZE?.();
})();
