const countries=require('../assets/data/countries.json');
const limits=new Map();
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex');
 const enabled=!!(process.env.RESEND_API_KEY&&process.env.CONTACT_FROM);
 if(req.method==='GET')return res.status(200).json({enabled,country:countries[req.headers['x-vercel-ip-country']]?req.headers['x-vercel-ip-country']:null});
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({ok:false})}
 const origin=req.headers.origin;
 const allowed=['https://www.progamespoland.com','https://progamespoland.com','https://www.progames.pl','https://progames.pl','https://websiteprogames.vercel.app'];
 if(!origin||!allowed.includes(origin))return res.status(403).json({ok:false});
 if(!enabled)return res.status(503).json({ok:false});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({ok:false});
 let b=req.body;try{if(typeof b==='string')b=JSON.parse(b)}catch{return res.status(400).json({ok:false})}
 if(!b||typeof b!=='object'||JSON.stringify(b).length>14000)return res.status(400).json({ok:false});
 const fields={name:120,company:160,email:254,phone:30,dialCode:5,country:2,countryName:100,product:180,message:5000,configuration:2500,language:2,requestId:36,website:200};
 for(const [key,max]of Object.entries(fields))if(b[key]!=null&&(typeof b[key]!=='string'||b[key].length>max))return res.status(400).json({ok:false});
 if(b.website||!b.name?.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email||'')||!countries[b.country]||!/^\+\d{1,4}$/.test(b.dialCode||'')||!/^[a-f0-9-]{36}$/i.test(b.requestId||''))return res.status(400).json({ok:false});
 let creatorText='';
 if(b.creatorConfiguration!=null){
  const c=b.creatorConfiguration,zones=['top_front','front_panel','score_panel','left_side','right_side','lower_front','kicker_panel','top_side','lower_left','lower_right'];
  if(!c||c.selectedProduct!=='double-strike'||!/^#[a-f0-9]{6}$/i.test(c.bodyColor||'')||!['Original','Minimal','Sport','Neon','Custom Branding'].includes(c.graphicsPreset)||!['Original RGB','White','Blue','Red','Rainbow'].includes(c.ledMode)||!Array.isArray(c.selectedOptions)||c.selectedOptions.length>6||c.selectedOptions.some(o=>!['banknote','coin','capsule','ticket','stickers','wifi'].includes(o))||!/^[a-f0-9-]{36}$/i.test(c.configurationId||'')||!c.customGraphics||typeof c.customGraphics!=='object'||Array.isArray(c.customGraphics))return res.status(400).json({ok:false});
  const clean={schemaVersion:1,selectedProduct:c.selectedProduct,configurationId:c.configurationId,bodyColor:c.bodyColor,graphicsPreset:c.graphicsPreset,ledMode:c.ledMode,selectedOptions:c.selectedOptions,customGraphics:{}};
  for(const [zone,g]of Object.entries(c.customGraphics)){
   if(!zones.includes(zone)||!g||!['custom','factory','none'].includes(g.mode)||typeof g.name!=='string'||g.name.length>100||['scale','x','y','rotation'].some(k=>!Number.isFinite(g[k]))||g.scale<.1||g.scale>3||Math.abs(g.x)>1||Math.abs(g.y)>1||Math.abs(g.rotation)>180||!['fit','fill'].includes(g.fit))return res.status(400).json({ok:false});
   clean.customGraphics[zone]={mode:g.mode,name:g.name,hasFile:!!g.hasFile,scale:g.scale,x:g.x,y:g.y,rotation:g.rotation,fit:g.fit};
  }
  creatorText='\n\ncreatorConfiguration:\n'+JSON.stringify(clean,null,2);
 }
 const ip=req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown',now=Date.now();
 for(const [key,v]of limits)if(v.until<now)limits.delete(key);
 const limit=limits.get(ip)||{count:0,until:now+600000};if(limit.count>=5){res.setHeader('Retry-After','600');return res.status(429).json({ok:false})}limit.count++;limits.set(ip,limit);
 const text=Object.keys(fields).filter(k=>!['requestId','website'].includes(k)).map(k=>k+': '+(b[k]||'')).join('\n')+creatorText;
 try{const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'contact-'+b.requestId},body:JSON.stringify({from:process.env.CONTACT_FROM,to:['office@progames.pl'],reply_to:b.email,subject:'PRO GAMES inquiry: '+(b.product||'General').replace(/[\r\n]/g,' '),text}),signal:AbortSignal.timeout(10000)});const result=await response.json();if(!response.ok||!result.id)return res.status(502).json({ok:false});return res.status(200).json({ok:true})}catch{return res.status(502).json({ok:false})}
};
