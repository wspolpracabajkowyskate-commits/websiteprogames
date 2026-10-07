const fs=require('fs'),assert=require('assert');
for(const f of ['index.html','es.html','pl/index.html','de/index.html','fr/index.html','build/templates/home-en.html','build/templates/home-es.html']){
 const s=fs.readFileSync(f,'utf8');assert(s.includes('action="/api/contact" method="post" autocomplete="on"'),f);
 assert(!/<form[^>]*action="(?:mailto:|http:)/i.test(s),f);
 for(const name of ['name','company','email'])assert(new RegExp('name="'+name+'" autocomplete="').test(s),f+name);
 assert(s.includes('/assets/progames-argentina-v40.webp'),f);
}
assert(fs.statSync('assets/progames-argentina-v40.webp').size<200000);
assert(!fs.existsSync('assets/progames-argentina-v35.png'));
assert(JSON.parse(fs.readFileSync('vercel.json')).headers[0].headers.some(h=>h.key==='Strict-Transport-Security'));
console.log('PASS: 5 languages + 2 templates, form action/autocomplete, logo, HTTPS header.');
