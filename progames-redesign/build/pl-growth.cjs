// Idempotent copy changes; preserve the existing UI, product data and handlers.
const fs=require('fs');
const patches=JSON.parse(fs.readFileSync('build/pl-growth.json'));
for(const [file,changes] of Object.entries(patches)){
 let html=fs.readFileSync(file,'utf8');
 for(const {oldText,newText} of changes){
  if(html.includes(oldText))html=html.split(oldText).join(newText);
  else if(!html.includes(newText))throw Error('Source changed: review Polish copy in '+file);
 }
 fs.writeFileSync(file,html);
}
const manifest=JSON.parse(fs.readFileSync('build/pages.json'));
for(const p of manifest)if(patches[p.filename])p.title=fs.readFileSync(p.filename,'utf8').match(/<title>(.*?)<\/title>/s)[1];
fs.writeFileSync('build/pages.json',JSON.stringify(manifest,null,2));
