/* Product cards that show several photos side by side on listing pages.
   Data: products.js `cardImages`. Idempotent; runs after build:languages. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');process.chdir(root);
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('products.js','utf8'),ctx);
const P=ctx.window.PRODUCTS;
const multi=Object.entries(P).filter(([,p])=>Array.isArray(p.cardImages)&&p.cardImages.length>1);
const dims=src=>{const m=/hammer-2026-multicolour-v2(-\d)?\.jpg$/.exec(src);return m&&!['-3','-4'].includes(m[1]||'')?[309,1080]:[299,1080];};
function* walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()){if(!['node_modules','assets','creator','creator-assets','api','.git','build','verification'].includes(e.name))yield* walk(path.join(d,e.name));}else if(e.name.endsWith('.html'))yield path.join(d,e.name);}}
let files=0,cards=0;
for(const file of walk(root)){
  let html=fs.readFileSync(file,'utf8'),changed=false;
  for(const [slug,p] of multi){
    const re=new RegExp('(<article class="product-card[^"]*" data-slug="'+slug+'"[\\s\\S]*?<div class=")card-media(?: collection-cover multi-view)?(">)([\\s\\S]*?)(<span class="tag">|</div>)');
    html=html.replace(re,(all,a,b,imgs,end)=>{
      const first=/alt="([^"]*)"/.exec(imgs);const alt=first?first[1]:p.name;
      const out=p.cardImages.map((src,i)=>{const [w,h]=dims(src);return `<img height="${h}" width="${w}" decoding="async" loading="lazy" src="${src}" alt="${i===0?alt:''}"${i===0?'':' aria-hidden="true"'}>`;}).join('');
      cards++;changed=true;return a+'card-media collection-cover multi-view'+b+out+end;
    });
  }
  if(changed){fs.writeFileSync(file,html);files++;}
}
console.log(`Multi-view cards: ${cards} cards in ${files} files.`);
