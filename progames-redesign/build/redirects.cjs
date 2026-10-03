const fs=require('fs'),vm=require('vm');const ctx={window:{}};vm.createContext(ctx);for(const f of ['site-config.js','products.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);const{PG_SITE:site,PG_ROUTES:routes,PRODUCTS:products}=ctx.window;
const redirects=[];for(const host of ['progames.pl','www.progames.pl','progamespoland.com'])redirects.push({source:'/:path*',has:[{type:'host',value:host}],destination:site.origin+'/:path*',statusCode:301});
redirects.push({source:'/index.html',destination:'/',statusCode:301},{source:'/pl/index.html',destination:'/pl/',statusCode:301},{source:'/pl',destination:'/pl/',statusCode:301},{source:'/de',destination:'/de/',statusCode:301},{source:'/fr',destination:'/fr/',statusCode:301});
for(const lang of ['en','es','pl','de','fr'])for(const key of Object.keys(products)){
 const source=lang==='en'?'/product.html':`/product-${lang}.html`;const model={type:'query',key:'model',value:key};
 redirects.push({source,has:[model,{type:'query',key:'variant',value:'(?<variant>[a-z0-9-]+)'}],destination:routes.product(lang,key)+'?variant=:variant',statusCode:301});
 redirects.push({source,has:[model],destination:routes.product(lang,key),statusCode:301});
}

const oldPaths={};for(const [key,p] of Object.entries(products)){const source=new URL(p.source).pathname;if(source!=='/')(oldPaths[source]??=[]).push(key)}
for(const[source,keys]of Object.entries(oldPaths))redirects.push({source,destination:keys.length===1?routes.product('en',keys[0]):'/?category=distributed#machines',statusCode:301});
redirects.push({source:'/boxer-standard',destination:routes.collection('en'),statusCode:301});
const config={cleanUrls:false,buildCommand:'',framework:null,redirects,headers:[{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},{source:'/assets/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=86400'}]},{source:'/(build|verification)/(.*)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},{source:'/(.*\\.md|variant-audit.json|KONTROLA_WARIANTOW.html)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]}]};
fs.writeFileSync('vercel.json',JSON.stringify(config,null,2));
fs.writeFileSync('build/redirects.csv','source,destination,status,condition\n'+redirects.map(r=>[r.source,r.destination,r.statusCode,JSON.stringify(r.has||[])].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n'));
console.log('Prepared',redirects.length,'redirect rules.');
