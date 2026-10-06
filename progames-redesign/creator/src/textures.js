import * as T from 'three';
const cache=new Map();
const image=src=>{if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src}));return cache.get(src)};
export async function makeTexture(zone,state){
 const c=document.createElement('canvas');c.width=window.matchMedia('(max-width: 760px)').matches?512:1024;c.height=Math.max(128,Math.round(c.width*zone.size[1]/zone.size[0]));const ctx=c.getContext('2d'),g=state.customGraphics[zone.id];
 if(g?.mode==='none')return texture(c);
 if(g?.mode==='custom'&&g.src){const im=await image(g.src);ctx.translate(c.width*(.5+g.x*.5),c.height*(.5+g.y*.5));ctx.rotate(g.rotation*Math.PI/180);const s=(g.fit==='fill'?Math.max:Math.min)(c.width/im.width,c.height/im.height)*g.scale;ctx.drawImage(im,-im.width*s/2,-im.height*s/2,im.width*s,im.height*s);return texture(c)}
 const preset=g?.mode==='factory'?'Original':state.graphicsPreset;
 if(preset==='Custom Branding')return texture(c);
 if(zone.factoryTexture&&preset==='Original'){ctx.drawImage(await image(zone.factoryTexture),0,0,c.width,c.height);return texture(c)}
 const original=preset==='Original',neon=preset==='Neon';
 ctx.fillStyle=original?'#111018':neon?'#101126':preset==='Sport'?'#f2f2ed':'#141a21';ctx.fillRect(0,0,c.width,c.height);
 if(preset!=='Minimal'){const gradient=ctx.createLinearGradient(0,0,c.width,c.height);gradient.addColorStop(0,original?'#ff351d':neon?'#725cff':'#098ed8');gradient.addColorStop(1,original?'#ffae13':neon?'#29ece0':'#18283d');ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(0,c.height*.05);ctx.lineTo(c.width*.75,0);ctx.lineTo(c.width,c.height*.95);ctx.lineTo(c.width*.2,c.height);ctx.closePath();ctx.fill();}
 ctx.strokeStyle=original?'#ff9d22':'#fff';ctx.lineWidth=8;ctx.strokeRect(10,10,c.width-20,c.height-20);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=4;
 const narrow=zone.size[1]>zone.size[0];ctx.font=`900 ${narrow?100:Math.min(108,c.height*.34)}px Arial`;ctx.fillText(narrow?'BOXER':'DOUBLE STRIKE',c.width/2,c.height*(narrow?.22:.40),c.width*.91);ctx.font=`800 ${narrow?95:Math.min(58,c.height*.18)}px Arial`;ctx.fillText(narrow?'VS':'BOXER  /  KICKER',c.width/2,c.height*(narrow?.5:.76),c.width*.9);if(narrow)ctx.fillText('KICKER',c.width/2,c.height*.8,c.width*.9);
 return texture(c);
}
function texture(c){const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return tx;}
