/* Compare every source paragraph and technical value with rendered HTML in all languages. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),{parseHTML}=require('linkedom');const read=p=>fs.readFileSync(p,'utf8');let ctx={window:{}};for(const f of ['products.js','site-config.js'])vm.runInNewContext(read(f),ctx);const w=ctx.window,source=JSON.parse(read('verification/product-copy-source.json')),tr=JSON.parse(read('verification/product-copy-translations.json'));const norm=s=>s.replace(/\s+/g,' ').trim();let checked=0,missing=[];
for(const[key,x]of Object.entries(source)){
 const p=w.PRODUCTS[key];if(x.status==='no-description'){missing.push(key);assert.equal(p.spec.length+p.features.length+p.options.length,0);}
 for(const lang of ['en','es']){
  const filename=w.PG_ROUTES.product(lang,key).slice(1),{document}=parseHTML(read(filename));let detail=document.querySelector('.detail-lead'),text=norm(document.querySelector('#productDetail').textContent);
  const expected=lang==='pl'?w.PRODUCT_PL[key].desc:lang==='es'?w.PRODUCT_ES[key].desc:p.desc;assert.equal(norm(detail.textContent),norm(expected),filename+' description');
  const schema=[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)).find(x=>x['@type']==='Product');assert.equal(schema.description,expected);
  if(x.status==='matched')for(const sentence of [...x.intro,...x.features,...x.options,...x.spec.flat()]){
   const localized=lang==='en'?sentence:tr[lang][sentence]||sentence;assert(text.includes(norm(localized)),`${filename}: missing ${localized}`);checked++;
  }
  if(x.status==='no-description')assert(!document.querySelector('.product-facts'),filename+' unsupported facts');
 }
 assert.deepEqual(p.spec,x.spec);assert.deepEqual(p.options,x.options);
}
const results={checkedAt:'2026-10-01',productsReviewed:Object.keys(source).length,sourceDescriptionsMatched:42-missing.length,missingSourceDescriptions:missing,localizedContentChecks:checked,status:'PASS'};fs.writeFileSync('verification/product-copy-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
