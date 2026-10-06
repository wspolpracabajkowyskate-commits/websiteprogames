import {product,products,presets} from '../products/doubleStrike.js';
export const KEY='progames.creator.v1';
export const newId=()=>crypto.randomUUID();
export function validate(v){
 const selected=products.find(p=>p.id===v?.selectedProduct);
 if(!v||!selected||!/^#[a-f\d]{6}$/i.test(v.bodyColor)||!presets.includes(v.graphicsPreset)||!['Original RGB','White','Blue','Red','Rainbow'].includes(v.ledMode)||!Array.isArray(v.selectedOptions))throw Error('configuration');
 const out={...selected.defaultConfiguration,configurationId:typeof v.configurationId==='string'?v.configurationId.slice(0,36):newId(),bodyColor:v.bodyColor,graphicsPreset:v.graphicsPreset,ledMode:v.ledMode,selectedOptions:v.selectedOptions.filter(x=>selected.availableOptions.includes(x)),customGraphics:{}};
 for(const z of selected.decalZones){const g=v.customGraphics?.[z.id];if(!g)continue;if(!['custom','none','factory'].includes(g.mode))continue;const number=(k,d,min,max)=>Number.isFinite(g[k])?Math.min(max,Math.max(min,g[k])):d;out.customGraphics[z.id]={mode:g.mode,src:typeof g.src==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(g.src)&&g.src.length<500000?g.src:undefined,name:typeof g.name==='string'?g.name.slice(0,100):'',scale:number('scale',1,.1,3),x:number('x',0,-1,1),y:number('y',0,-1,1),rotation:number('rotation',0,-180,180),fit:g.fit==='fill'?'fill':'fit'};}
 return out;
}
export function load(){try{return validate(JSON.parse(localStorage.getItem(KEY)))}catch{return {...product.defaultConfiguration,customGraphics:{},configurationId:newId()}}}
export function portable(state){return {...state,schemaVersion:1,customGraphics:Object.fromEntries(Object.entries(state.customGraphics).map(([k,{src,...v}])=>[k,{...v,hasFile:!!src}]))}}
export function save(state){localStorage.setItem(KEY,JSON.stringify(state))}
export async function readGraphic(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('upload');const bitmap=await createImageBitmap(file);if(bitmap.width>16000||bitmap.height>16000){bitmap.close();throw Error('upload')}const c=document.createElement('canvas'),ratio=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));c.width=Math.max(1,Math.round(bitmap.width*ratio));c.height=Math.max(1,Math.round(bitmap.height*ratio));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();const src=c.toDataURL('image/webp',.85);if(src.length>480000)throw Error('upload');return {mode:'custom',src,name:file.name.slice(0,100),scale:1,x:0,y:0,rotation:0,fit:'fit'};}
