import * as T from '../vendor/three.module.js';
import {mergeGeometries,mergeVertices} from '../vendor/BufferGeometryUtils.js';
export const MODEL_VERSION='double-strike-reference-1.0';
export const COLOR_PARTS=['BODY_MAIN','FRONT_PANEL','LEFT_PANEL','RIGHT_PANEL','BACK_PANEL','TOP_SECTION','BASE_HOUSING'];
export const MODULES=['COIN_ACCEPTOR','BANKNOTE_ACCEPTOR','CARD_READER','TICKET_DISPENSER','CAPSULE_DISPENSER'];
export async function buildModel(){
 const root=new T.Group();root.name='DOUBLE_STRIKE';root.userData={version:MODEL_VERSION,units:'meters',scaleStatus:'Approximate reconstruction; dimensions and optional mounting positions require manufacturer approval'};
 const blue=new T.MeshStandardMaterial({name:'PAINT_BLUE',color:0x0069d8,metalness:.12,roughness:.29});
 const black=new T.MeshStandardMaterial({name:'MATTE_BLACK',color:0x101216,roughness:.67});
 const rubber=new T.MeshStandardMaterial({name:'RUBBER_BLACK',color:0x121314,roughness:.78});
 const red=new T.MeshStandardMaterial({name:'LEATHER_RED',color:0xa51024,roughness:.53});
 const metal=new T.MeshStandardMaterial({name:'BRUSHED_METAL',color:0x9ba4af,metalness:.83,roughness:.37});
 const white=new T.MeshStandardMaterial({name:'BALL_WHITE',color:0xe5e6e8,roughness:.58});
 const loader=new T.TextureLoader();
 async function texture(name){const t=await loader.loadAsync(new URL('../textures/'+name+'.png',import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
 const tex={};await Promise.all(['front-art','header-art','side-art','kicker-art','rear-art','rules','display','boxer-art','football-art','glove-art'].map(async n=>tex[n]=await texture(n)));
 function group(name,parent=root){const g=new T.Group();g.name=name;parent.add(g);return g;}
 function mesh(geo,mat,name,x,y,z,parent=root){const m=new T.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(name,w,h,d,x,y,z,mat=blue,parent=root){return mesh(new T.BoxGeometry(w,h,d),mat,name,x,y,z,parent);}
 function roundShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 function rounded(name,w,h,d,r,x,y,z,mat=blue,parent=root){const geo=new T.ExtrudeGeometry(roundShape(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.004,bevelThickness:.004,curveSegments:8});geo.translate(0,0,-d/2);return mesh(geo,mat,name,x,y,z,parent);}
 function decal(name,tx,w,h,x,y,z,rotation=0,parent=root){const mat=new T.MeshStandardMaterial({name:name+'_INK',map:tex[tx],transparent:true,alphaTest:.08,roughness:.47,metalness:.02,depthWrite:false});const m=mesh(new T.PlaneGeometry(w,h),mat,name,x,y,z,parent);m.rotation.y=rotation;m.castShadow=false;return m;}
 function sphere(name,r,x,y,z,mat,parent=root){return mesh(new T.SphereGeometry(r,20,14),mat,name,x,y,z,parent);}
 const base=group('METAL_ELEMENTS');rounded('PLATFORM',1.25,.065,.87,.03,0,.055,0,black,base);
 const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=256;const f=floorCanvas.getContext('2d');f.fillStyle='#737b84';f.fillRect(0,0,256,256);for(let x=-32;x<290;x+=32)for(let y=-32;y<290;y+=32){f.save();f.translate(x,y);f.rotate(((x+y)%64?1:-1)*Math.PI/4);f.fillStyle='#b9c1c9';f.fillRect(-11,-2,22,4);f.fillStyle='#3c434b';f.fillRect(-11,2,22,2);f.restore();}const ft=new T.CanvasTexture(floorCanvas);ft.colorSpace=T.SRGBColorSpace;ft.wrapS=ft.wrapT=T.RepeatWrapping;ft.repeat.set(3,2);
 const floorMat=new T.MeshStandardMaterial({name:'CHECKER_PLATE',map:ft,metalness:.73,roughness:.45});box('TREAD_PLATE',1.14,.012,.77,0,.096,0,floorMat,base);
 const lower=group('BASE_HOUSING');
 // Lower casing has an open front recess, not a solid box with a painted ball.
 rounded('LOWER_BACK',1.025,.60,.12,.085,0,.414,-.205,blue,lower);
 rounded('LOWER_LEFT',.145,.60,.42,.035,-.44,.414,.025,blue,lower);
 rounded('LOWER_RIGHT',.145,.60,.42,.035,.44,.414,.025,blue,lower);
 rounded('LOWER_CROWN',.91,.14,.42,.055,0,.691,.025,blue,lower);
 box('LOWER_SILL',.90,.09,.42,0,.16,.025,blue,lower);
 box('RECESS_BACK',.76,.44,.012,0,.425,-.135,blue,lower);
 const frameShape=roundShape(1.025,.64,.105);const hole=roundShape(.745,.425,.018);hole.curves.forEach(c=>{for(const key of ['v0','v1','v2'])if(c[key])c[key].y-=.04;});frameShape.holes.push(hole);
 const frameGeometry=new T.ExtrudeGeometry(frameShape,{depth:.018,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2,curveSegments:12});mesh(frameGeometry,blue,'ROUNDED_FRONT_FRAME',0,.43,.248,lower);

 // Tapered recess side walls.
 const recessMat=blue;
 function quad(name,pts,mat,parent=root){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();return mesh(g,mat,name,0,0,0,parent);}
 quad('RECESS_TOP',[[-.365,.62,.237],[.365,.62,.237],[.32,.55,-.13],[-.32,.55,-.13]],recessMat,lower);
 quad('RECESS_FLOOR',[[-.365,.20,.237],[-.32,.25,-.13],[.32,.25,-.13],[.365,.20,.237]],recessMat,lower);
 const body=group('BODY_MAIN');rounded('CENTRAL_CABINET',.535,1.005,.285,.012,0,1.245,-.245,blue,body);
 const front=group('FRONT_PANEL'),left=group('LEFT_PANEL'),right=group('RIGHT_PANEL'),back=group('BACK_PANEL');
 box('LEFT_REAR_TRIM',.018,1.04,.018,-.276,1.247,-.388,black,left);box('RIGHT_REAR_TRIM',.018,1.04,.018,.276,1.247,-.388,black,right);
 const original=group('FACTORY_GRAPHICS');
 decal('FRONT_FACTORY','front-art',.447,.76,0,1.31,-.096,0,original);
 decal('LEFT_FACTORY','side-art',.22,.83,-.273,1.235,-.232,-Math.PI/2,original);
 decal('RIGHT_FACTORY','side-art',.22,.83,.273,1.235,-.232,Math.PI/2,original);
 decal('LEFT_KICKER_GRAPHIC','kicker-art',.30,.44,-.518,.405,.008,-Math.PI/2,original);
 decal('RIGHT_KICKER_GRAPHIC','kicker-art',.30,.44,.518,.405,.008,Math.PI/2,original);
 decal('REAR_FACTORY','rear-art',.45,.28,0,1.49,-.397,Math.PI,original);
 decal('GAME_RULES','rules',.105,.14,0,.835,-.095,0,front);
 const rearDoor=rounded('REAR_SERVICE_DOOR',.445,.53,.008,.008,0,1.015,-.397,blue,back);
 for(const x of [-.14,.14])for(let i=0;i<5;i++){box('REAR_VENT_TOP',.085,.005,.003,x,1.68-i*.015,-.404,black,back);box('REAR_VENT_DOOR',.085,.005,.003,x,.83+i*.015,-.408,black,back);}
 for(const y of [.82,1.2])box('REAR_HINGE',.012,.057,.013,.23,y,-.41,metal,back);
 sphere('REAR_LOCK',.012,-.195,1.02,-.409,metal,back);
 rounded('BASE_SERVICE_DOOR',.61,.36,.01,.008,0,.36,-.271,blue,back);
 for(let i=0;i<4;i++)for(const x of [-.12,.05])box('BASE_VENT',.095,.005,.003,x,.32+i*.015,-.28,black,back);
 const fan=box('FAN_GRILLE',.105,.105,.008,-.20,.456,-.285,black,back);
 for(let i=1;i<=4;i++){const tor=new T.TorusGeometry(i*.01,.0015,4,20);mesh(tor,metal,'FAN_RING',-.20,.456,-.292,back);}
 box('POWER_INLET',.063,.045,.012,-.22,.236,-.283,black,back);
 const top=group('TOP_SECTION');
 function canopy(name,r,h,y,scaleZ=1){const s=new T.Shape();s.moveTo(-r,-.40);s.lineTo(r,-.40);s.lineTo(r,-.08);for(let i=0;i<=48;i++){const a=i*Math.PI/48;s.lineTo(Math.cos(a)*r,-.08+Math.sin(a)*.47*scaleZ);}s.lineTo(-r,-.40);const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:24});g.rotateX(Math.PI/2);const smooth=mergeVertices(g);smooth.computeVertexNormals();g.dispose();return mesh(smooth,blue,name,0,y,0,top);}
 canopy('CANOPY_MAIN',.49,.235,2.07);canopy('CANOPY_UPPER_LIP',.527,.07,2.157,1.06);canopy('CANOPY_LOWER_LIP',.50,.045,1.838);
 const cavity=mesh(new T.CylinderGeometry(.17,.17,.012,32),black,'BAG_CAVITY',0,1.798,.11,top);cavity.scale.z=1.48;
 function curvedTitle(){let pos=[],uv=[],idx=[];for(let i=0;i<=32;i++){let t=i/32,a=(t-.5)*1.38,x=Math.sin(a)*.507,z=-.08+Math.cos(a)*.495;pos.push(x,1.90,z,x,2.07,z);uv.push(t,0,t,1);if(i<32){let n=i*2;idx.push(n,n+2,n+1,n+2,n+3,n+1);}}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(g,new T.MeshStandardMaterial({name:'HEADER_PRINT',map:tex['header-art'],transparent:true,alphaTest:.1,roughness:.4,side:T.DoubleSide}),'HEADER_FACTORY',0,0,0,original);}
 curvedTitle();
 decal('CANOPY_LEFT_BOXER','boxer-art',.30,.17,-.505,1.958,-.22,-Math.PI/2,original);
 decal('CANOPY_RIGHT_BOXER','boxer-art',.30,.17,.505,1.958,-.22,Math.PI/2,original);
 for(let i=0;i<10;i++){const a=(i+.5)*Math.PI/10-Math.PI/2;const d=decal('CANOPY_MOTIF_'+i,i%2?'football-art':'glove-art',.043,.039,Math.sin(a)*.544,2.121,-.08+Math.cos(a)*.527,a,original);}
 for(const x of [-.477,.477])for(let i=0;i<3;i++)decal('BASE_FOOTBALL_MOTIF','football-art',.043,.043,x,.25+i*.12,.285,0,original);

 const bag=group('PUNCHING_BAG');
 const pts=[[.0,-.123],[.060,-.119],[.089,-.08],[.108,-.015],[.10,.045],[.078,.085],[.043,.125],[.0,.132]].map(([x,y])=>new T.Vector2(x,y));
 for(let i=0;i<4;i++)mesh(new T.LatheGeometry(pts,12,i*Math.PI/2,Math.PI/2),i%2?rubber:red,'BAG_LEATHER_'+i,0,1.465,.25,bag);
 const sleevePoints=[[.054,0],[.050,.02],[.038,.045],[.039,.07],[.029,.09],[.033,.13],[.027,.16],[.029,.20],[.031,.23]].map(([x,y])=>new T.Vector2(x,y));mesh(new T.LatheGeometry(sleevePoints,24),rubber,'BAG_ARM',0,1.588,.25,bag);
 const ballGroup=group('KICKER_BALL');const br=.095,bp=new T.Vector3(-.10,.39,.215);sphere('FOOTBALL',br,...bp.toArray(),white,ballGroup);
 const ico=new T.IcosahedronGeometry(1,0).getAttribute('position');const seen=new Set();for(let i=0;i<ico.count;i++){const n=new T.Vector3().fromBufferAttribute(ico,i).normalize(),key=n.toArray().map(x=>x.toFixed(3)).join();if(seen.has(key))continue;seen.add(key);const patch=mesh(new T.CircleGeometry(.037,5),rubber,'FOOTBALL_PENTAGON',...bp.clone().addScaledVector(n,br*1.002).toArray(),ballGroup);patch.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);}
 const kickArm=mesh(new T.CylinderGeometry(.046,.052,.255,16),rubber,'KICKER_ARM',.095,.39,.12,ballGroup);kickArm.rotation.z=Math.PI/2;box('KICKER_MOUNT',.075,.095,.04,.235,.39,.07,black,ballGroup);
 const display=group('DISPLAY');decal('DISPLAY_SCREEN','display',.207,.106,-.009,1.381,-.087,0,display);display.children[0].material.emissive=new T.Color(0xffffff);display.children[0].material.emissiveMap=tex.display;display.children[0].material.emissiveIntensity=.3;
 const glass=new T.MeshPhysicalMaterial({name:'DISPLAY_GLASS',color:0xffffff,transparent:true,opacity:.06,roughness:.08,metalness:.05,depthWrite:false});mesh(new T.PlaneGeometry(.209,.108),glass,'DISPLAY_GLASS',-.009,1.381,-.084,display);
 const buttons=group('BUTTONS');for(const [y,c]of [[1.43,0xe82830],[1.37,0xeddc35]]){const b=mesh(new T.CylinderGeometry(.019,.02,.009,20),new T.MeshStandardMaterial({color:c,roughness:.36}),'START_BUTTON',-.215,y,-.084,buttons);b.rotation.x=Math.PI/2;}
 const payment=group('PAYMENT_PANEL');box('STANDARD_COIN_PANEL',.052,.145,.008,-.195,.836,-.093,metal,payment);box('STANDARD_COIN_SLOT',.008,.045,.006,-.195,.868,-.087,black,payment);box('COIN_RETURN',.035,.025,.009,-.195,.795,-.084,black,payment);
 const ledGroup=group('LED_LIGHTS');const ledColors=[0x40eaff,0xfa51d6,0x55ff99,0xc6dfff],ledParts=ledColors.map(()=>[]);
 function led(x,y,z,i){let geo=new T.SphereGeometry(.011,10,6);geo.translate(x,y,z);ledParts[i%4].push(geo);}
 for(let i=0;i<19;i++){let a=i*Math.PI/18;for(const y of [2.123,1.848])led(Math.cos(a)*.54,y,-.08+Math.sin(a)*.515,i);}
 for(const x of [-.244,.244])for(let i=0;i<5;i++)led(x,.96+i*.157,-.089,i);
 for(const x of [-.458,.458])for(let i=0;i<7;i++)led(x,.18+i*.069,.282,i);
 for(let i=0;i<9;i++)led(-.36+i*.09,.704,.282,i);
 for(let i=0;i<32;i++)led(-.347+i*.0224,.652,.282,i);
 for(const x of [-.378,.378])for(let i=0;i<23;i++)led(x,.204+i*.019,.282,i);
 ledParts.forEach((parts,i)=>{const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());mesh(geo,new T.MeshStandardMaterial({name:'LED_'+i,color:ledColors[i],emissive:ledColors[i],emissiveIntensity:.9,roughness:.22}),'LED_STRIP_'+i,0,0,0,ledGroup).castShadow=false;});
 for(const x of [-.25,.25]){const g=new T.CylinderGeometry(.027,.027,.007,16);mesh(g,new T.MeshStandardMaterial({name:'DOWNLIGHT',color:0xffffff,emissive:0xffffff,emissiveIntensity:1.6}),'DOWNLIGHT',x,1.798,.21,ledGroup);}
 // Optional hardware mounts are intentionally schematic: absent in supplied views.
 const mounts=[['COIN_ACCEPTOR',.11,.85,.045,.11],['BANKNOTE_ACCEPTOR',.19,.85,.065,.11],['CARD_READER',-.32,.705,.065,.105],['TICKET_DISPENSER',.32,.695,.08,.10],['CAPSULE_DISPENSER',.43,.49,.10,.17]];
 for(const [name,x,y,w,h]of mounts){const g=group(name);g.userData={optional:true,mounting:'Illustrative prototype; verify compatibility and mounting'};let z=y>.8?-.075:.27;rounded(name+'_CASE',w,h,.024,.005,x,y,z,black,g);box(name+'_FACE',w*.82,h*.72,.004,x,y+.004,z+.015,metal,g);if(name==='CARD_READER'){box('CARD_SCREEN',w*.65,h*.35,.005,x,y+.02,z+.02,new T.MeshStandardMaterial({color:0x102532,emissive:0x1c6573,emissiveIntensity:.5}),g);box('CARD_CONTACTLESS',.016,.016,.004,x,y-.025,z+.02,black,g);}else if(name==='CAPSULE_DISPENSER'){box('CAPSULE_OUTLET',w*.68,h*.28,.005,x,y-.035,z+.023,black,g);}else box(name+'_SLOT',w*.63,.008,.006,x,y,z+.021,black,g);g.visible=false;}
 for(const [name,w,h,x,y,z,rot]of [['CUSTOM_FRONT',.47,.92,0,1.23,-.080,0],['CUSTOM_LEFT',.255,.94,-.279,1.23,-.24,-Math.PI/2],['CUSTOM_RIGHT',.255,.94,.279,1.23,-.24,Math.PI/2]]){const m=mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({name:name+'_MATERIAL',transparent:true,opacity:0,depthWrite:false,roughness:.48,polygonOffset:true,polygonOffsetFactor:-1} ),name,x,y,z);m.rotation.y=rot;m.visible=false;m.userData={branding:true,uv:'0..1 full surface'};m.castShadow=false;}
 // Batch static pieces inside each logical part; configurable groups remain independent.
 function batch(part){const buckets=new Map();for(const child of [...part.children]){if(!child.isMesh)continue;const key=(child.material.map?.uuid||child.material.uuid)+'/'+child.material.side;const items=buckets.get(key)||[];items.push(child);buckets.set(key,items);}let index=0;for(const items of buckets.values()){if(items.length<2)continue;const geometries=items.map(o=>{o.updateMatrix();const g=o.geometry.clone().applyMatrix4(o.matrix);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;});const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)continue;const m=new T.Mesh(merged,items[0].material);m.name=part.name+'_BATCH_'+index++;m.castShadow=items[0].castShadow;m.receiveShadow=true;m.userData.sourceParts=items.map(o=>o.name);items.forEach(o=>{part.remove(o);o.geometry.dispose();});part.add(m);}}
 for(const name of ['BACK_PANEL','KICKER_BALL','PUNCHING_BAG','TOP_SECTION','BASE_HOUSING','FACTORY_GRAPHICS',...MODULES])batch(root.getObjectByName(name));
 root.updateMatrixWorld(true);return root;
}
