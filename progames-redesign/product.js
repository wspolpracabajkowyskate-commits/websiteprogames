const products=window.PRODUCTS||{};
const params=new URLSearchParams(location.search);
const requested=params.get('model')||'champion';
const key=products[requested]?requested:'champion';
const p=products[key];
const CATALOG_URL='https://www.progamespoland.com/_files/ugd/d36c49_3ddf33bed9744292a3c9f7967a98534f.pdf';

document.title=`${p.name} | Pro Games Poland`;
const meta=document.querySelector('meta[name="description"]');
if(meta) meta.content=`${p.name} by Pro Games Poland. Product overview, verified dimensions, available finishes and operator configuration.`;

const detail=document.querySelector('#productDetail');
const variantList=(p.variants||[]).filter(v=>v&&v.image);
const mainVariant=variantList[0]||{name:'Product',image:p.image};
const spec=(p.spec||[]).map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('');
const features=(p.features||[]).map(x=>`<li>${x}</li>`).join('');
const options=(p.options||[]).map(o=>`<div><span>${o}</span><b>+</b></div>`).join('');
const related=Object.entries(products)
  .filter(([slug,item])=>slug!==key && item.category===p.category)
  .slice(0,4)
  .map(([slug,item])=>`<a class="related-card" href="/product.html?model=${slug}"><img src="${item.image}" alt="${item.name} by Pro Games" loading="lazy" referrerpolicy="no-referrer"><span>${item.label}</span><h3>${item.name}</h3></a>`).join('');

const thumbs=variantList.length>1?`<div class="variant-thumbs" role="list" aria-label="Available visual variants">${variantList.map((v,i)=>`<button type="button" class="variant-thumb ${i===0?'active':''}" data-index="${i}" aria-label="Show ${v.name}"><img src="${v.image}" alt="${p.name} — ${v.name}" loading="lazy" referrerpolicy="no-referrer"><span>${v.name}</span></button>`).join('')}</div>`:'';
const finishBlock=variantList.length>1?`<div class="finish-selector"><div class="finish-selector-head"><div><p class="kicker">COLOUR / ARTWORK VARIANTS</p><h3>Choose a colour / artwork variant</h3></div><strong id="variantName">${mainVariant.name}</strong></div>${thumbs}<p class="finish-note">Choose a thumbnail to switch the main preview to the corresponding real product photo from the current Pro Games range. Final colour, artwork and availability are confirmed with the sales team.</p></div>`:`<div class="finish-selector single"><p class="kicker">FINISH / ARTWORK</p><h3>Current product image</h3><p class="finish-note">Ask the Pro Games sales team about current artwork, colour and branding options for this model.</p></div>`;

detail.innerHTML=`
<section class="product-detail-v2">
  <div class="product-gallery-panel">
    <div class="product-main-stage reveal in">
      <img id="productMainImage" src="${mainVariant.image}" alt="${p.name} — ${mainVariant.name}" fetchpriority="high" referrerpolicy="no-referrer">
      ${p.tag?`<span class="product-tag">${p.tag}</span>`:''}
    </div>
    ${variantList.length>1?`<div class="mobile-variant-strip">${variantList.map((v,i)=>`<button type="button" class="mobile-variant ${i===0?'active':''}" data-index="${i}"><img src="${v.image}" alt="${p.name} ${v.name}" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}</div>`:''}
  </div>
  <div class="product-info-panel">
    <a class="product-back-link" href="/#machines">← All machines</a>
    <p class="kicker">${p.label}</p>
    <h1>${p.name}</h1>
    <p class="detail-lead">${p.desc}</p>
    <div class="detail-actions">
      <a class="btn btn-primary" href="/#contact">Request a quote</a>
      <a class="btn btn-outline-dark" href="${CATALOG_URL}" target="_blank" rel="noopener">View full product catalog ↗</a>
    </div>
    <p class="quote-note">Pricing and final configuration are quoted individually.</p>
    ${finishBlock}
  </div>
</section>

<section class="product-facts section">
  <div class="product-facts-title"><p class="kicker">PRODUCT DETAILS</p><h2>BUILT FOR<br>COMMERCIAL PLAY.</h2></div>
  <div class="product-facts-column"><h3>Key features</h3><ul class="feature-list">${features}</ul></div>
  <div class="spec-table light"><h3>Technical specifications</h3>${spec}</div>
  <div class="spec-table light"><h3>Available upgrades / options</h3>${options}</div>
</section>

<section class="operator-note section section-dark">
  <p class="kicker">OPERATOR CONFIGURATION</p>
  <h2>ONE MACHINE.<br>CONFIGURED FOR YOUR VENUE.</h2>
  <p>Payment hardware, artwork, lighting, ticket or prize configuration and some technical details can vary by market and order. Contact Pro Games for the current specification of the exact version you need.</p>
  ${p.source?`<a class="source-link" href="${p.source}" target="_blank" rel="noopener">View original Pro Games product source ↗</a>`:''}
</section>

<section class="related section">
  <p class="kicker">EXPLORE MORE</p>
  <div class="related-heading"><h2>RELATED MACHINES</h2><a href="/#machines">View all products ↗</a></div>
  <div class="related-grid">${related}</div>
</section>

<section class="product-cta section-dark">
  <p class="kicker">READY TO TALK?</p>
  <h2>LET'S BUILD YOUR NEXT<br>ENTERTAINMENT EXPERIENCE.</h2>
  <a class="btn btn-primary" href="/#contact">Send an inquiry</a>
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
      img.alt=`${p.name} — ${variant.name}`;
      requestAnimationFrame(()=>img.classList.remove('switching'));
    };
    preload.src=variant.image;
  }
  const name=document.querySelector('#variantName');
  if(name) name.textContent=variant.name;
  document.querySelectorAll('[data-index]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.index)===index));
}
document.querySelectorAll('[data-index]').forEach(btn=>btn.addEventListener('click',()=>setVariant(Number(btn.dataset.index))));
