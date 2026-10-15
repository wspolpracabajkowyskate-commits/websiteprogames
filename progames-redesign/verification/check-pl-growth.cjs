const fs=require('fs'),assert=require('assert/strict'),{parseHTML}=require('linkedom');
const pages=JSON.parse(fs.readFileSync('build/pages.json')).filter(p=>p.lang==='pl'&&p.kind==='product');const rows=[],descs=new Set(),titles=new Set();
const norm=s=>s.replace(/\s+/g,' ').trim();
for(const p of pages){
 const d=parseHTML(fs.readFileSync(p.filename,'utf8')).document;
 const product=[...d.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)).find(x=>x['@type']==='Product');
 const row={url:p.url,title:d.title,model:product.name,h1_matches_product:norm(d.querySelector('h1').textContent)===norm(product.name),schema_description_visible:norm(d.querySelector('.detail-lead').textContent)===norm(product.description),unique_description:!descs.has(product.description),unique_title:!titles.has(d.title),canonical:d.querySelector('link[rel=canonical]').href==='https://www.progamespoland.com'+p.url,language_alternates:d.querySelectorAll('link[hreflang]').length===6,main_image_alt:!!d.querySelector('#productMainImage')?.getAttribute('alt'),no_invented_price:!product.offers,configuration_present:!!d.querySelector('.machine-config'),internal_links:d.querySelectorAll('a[href^="/pl/"]').length};
 descs.add(product.description);titles.add(d.title);rows.push(row);
 for(const [k,v] of Object.entries(row))if(typeof v==='boolean')assert(v,`${p.url}: ${k}`);
 assert(row.internal_links>0);
}
const home=parseHTML(fs.readFileSync('pl/index.html','utf8')).document;
assert.strictEqual(home.title, 'Producent automatów bokserskich i rozrywkowych | ProGames');
assert(home.querySelector('h1').textContent.includes('BOKSERSKIE'));
assert(home.querySelector('.hero .lead').textContent.includes('polski producent automatów bokserskich'));
assert.equal(home.querySelector('link[rel=canonical]').href,'https://www.progamespoland.com/pl/');
const result={checked_at:new Date().toISOString(),status:'passed',products:rows.length,scope:'HTML and schema checks, not independent certification of product specifications',rows};
fs.mkdirSync('../growth/pl/results',{recursive:true});fs.writeFileSync('../growth/pl/results/products-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,products:rows.length,uniqueDescriptions:descs.size}));
