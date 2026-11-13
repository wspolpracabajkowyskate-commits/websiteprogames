// JSON-LD for /pl/katalog.html, mirroring the other catalogue pages (WebPage + BreadcrumbList).
// Pure string step so it can run after recover-static.cjs without re-parsing the page. Idempotent.
const fs=require('fs');
const file='pl/katalog.html',origin='https://www.progamespoland.com',url=origin+'/pl/katalog.html';
function addSchema(html){
 if(html.includes('application/ld+json'))return html;
 const attr=(re)=>{const m=html.match(re);if(!m)throw new Error('Missing '+re);return m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"');};
 const name=attr(/<title>([^<]+)<\/title>/),description=attr(/<meta name="description" content="([^"]+)"/);
 const page={'@context':'https://schema.org','@type':'WebPage','@id':url+'#webpage',url,name,description,inLanguage:'pl',isPartOf:{'@id':origin+'/#website'},publisher:{'@id':origin+'/#organization'},primaryImageOfPage:{'@type':'ImageObject',url:origin+'/assets/hero-champion.webp'},about:{'@id':origin+'/#organization'}};
 const crumbs={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Wszystkie produkty',item:origin+'/pl/#machines'},{'@type':'ListItem',position:2,name:'Katalogi',item:url}]};
 const tag=o=>'<script type="application/ld+json">'+JSON.stringify(o).replaceAll('<','\\u003c')+'</script>';
 return html.replace('</head>',tag(page)+tag(crumbs)+'</head>');
}
if(require.main===module){const before=fs.readFileSync(file,'utf8'),after=addSchema(before);if(after!==before)fs.writeFileSync(file,after);console.log(after===before?'Polish catalogue schema already present.':'Polish catalogue schema added.');}
module.exports={addSchema};
