const fs=require('fs');
for(const [file,block] of Object.entries(JSON.parse(fs.readFileSync('build/growth-content.json','utf8')))){
 let html=fs.readFileSync(file,'utf8');const id=block.match(/id="([^"]+)"/)[1];
 const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 html=html.replace(new RegExp('<section[^>]*id="'+escaped+'"[\\s\\S]*?</section>'),'');
 if(!html.includes('</main>'))throw Error('No main '+file);
 fs.writeFileSync(file,html.replace('</main>',block+'</main>'));
}
