import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {zones} from '../products/doubleStrike.js';
export function buildMachine(){
 const geometryCache=new Map();const root=new T.Group();root.name='Double_Strike_Studio';
 const mat=(name,color,roughness=.35,metalness=0)=>{const m=new T.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:name==='BODY_PAINT'?.9:0,clearcoatRoughness:.18});m.name=name;return m};
 const paint=mat('BODY_PAINT','#008bdf',.25,.18),black=mat('BLACK_PLASTIC','#10141b',.52),metal=mat('METAL','#9ba4ab',.24,.9),rubber=mat('RUBBER','#101214',.9),bag=mat('BOXING_BAG','#a51a2a',.46),ball=mat('BALL','#efefea',.55),screen=mat('SCREEN','#0c080a',.16),led=mat('LED','#d5eeff',.22);led.emissive.set('#84caff');led.emissiveIntensity=1.2;
 const mesh=(name,g,m,p)=>{const o=new T.Mesh(g,m);o.name=name;o.position.set(...p);o.castShadow=true;o.receiveShadow=true;root.add(o);return o};
 const box=(n,s,p,m=paint,r=.02)=>{const key=JSON.stringify([s,r]);if(!geometryCache.has(key))geometryCache.set(key,n==='tread'?new T.BoxGeometry(...s):new RoundedBoxGeometry(...s,4,r));return mesh(n,geometryCache.get(key),m,p)};
 box('metal_platform',[1.3,.065,1.06],[0,.035,.12],black,.018);
 const plate=metal.clone();plate.name='DIAMOND_PLATE_METAL';plate.roughness=.45;
 box('diamond_plate',[1.17,.018,.96],[0,.077,.12],plate,.006);
 // Fine diamond tread, geometry remains independent from body paint.
 for(let x=-.54;x<.56;x+=.055)for(let z=-.32;z<.59;z+=.063){const o=box('tread',[.036,.0025,.008],[x,.088,z],metal,.002);o.rotation.y=Math.PI/4;}
 box('body_column',[.55,1.47,.43],[0,1.48,-.165],paint,.025);
 box('body_lower_back',[1.04,.69,.22],[0,.44,-.22],paint,.05);
 box('body_lower_left',[.16,.61,.63],[-.445,.41,.045],paint,.055);
 box('body_lower_right',[.16,.61,.63],[.445,.41,.045],paint,.055);
 box('body_lower_top',[1.04,.18,.66],[0,.77,.05],paint,.08);
 box('body_lower_bottom',[.91,.10,.63],[0,.14,.045],paint,.025);
 box('kicker_recess',[.73,.45,.018],[0,.42,-.10],black,.04);
 for(const x of [-.36,.36])box('recess_rim',[.035,.44,.035],[x,.4,.375],paint,.01);
 for(const y of [.19,.62])box('recess_rim',[.75,.035,.035],[0,y,.375],paint,.01);
 const arm=mesh('kicker_arm',new T.CylinderGeometry(.065,.075,.45,20),rubber,[.07,.37,.22]);arm.rotation.z=Math.PI/2;
 const football=mesh('football',new T.SphereGeometry(.115,32,24),ball,[-.18,.37,.25]);
 // Twelve spherical pentagons on the football, with raised seam edges.
 const ico=new T.IcosahedronGeometry(1,0).getAttribute('position'),normals=new Map();
 for(let i=0;i<ico.count;i++){const v=new T.Vector3().fromBufferAttribute(ico,i).normalize();normals.set(v.toArray().map(n=>n.toFixed(3)).join(','),v)}
 for(const n of normals.values()){
  const u=new T.Vector3().crossVectors(n,Math.abs(n.y)>.9?new T.Vector3(1,0,0):new T.Vector3(0,1,0)).normalize(),v=new T.Vector3().crossVectors(n,u),verts=[],edge=[];
  const center=n.clone().multiplyScalar(.116);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;edge.push(n.clone().multiplyScalar(.116).addScaledVector(u,.033*Math.cos(a)).addScaledVector(v,.033*Math.sin(a)).normalize().multiplyScalar(.116))}
  for(let i=0;i<5;i++)verts.push(...center.toArray(),...edge[i].toArray(),...edge[(i+1)%5].toArray());
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.computeVertexNormals();mesh('football_patch',geo,rubber,[-.18,.37,.25]);
  edge.push(edge[0]);mesh('football_seam',new T.TubeGeometry(new T.CatmullRomCurve3(edge,false,'centripetal'),30,.001,4,false),rubber,[-.18,.37,.25]);
 }
 // D-shaped canopy; the broad curved front projects over the bag.
 function canopy(width,depth,height,y){const s=new T.Shape();s.moveTo(-width,-.38);s.lineTo(width,-.38);s.lineTo(width,.20);s.absellipse(0,.20,width,depth,0,Math.PI,false,0);s.lineTo(-width,-.38);const g=new T.ExtrudeGeometry(s,{depth:height,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.016,bevelThickness:.015,curveSegments:36});g.rotateX(Math.PI/2);return mesh('body_top',g,paint,[0,y,0]);}
 canopy(.54,.52,.28,2.49);canopy(.585,.56,.045,2.53);canopy(.535,.51,.04,2.23);
 const underside=mesh('canopy_underside',new T.CylinderGeometry(.34,.34,.025,48),black,[0,2.205,.25]);underside.scale.z=1.25;
 mesh('bag_mount',new T.CylinderGeometry(.038,.045,.15,24),metal,[0,2.11,.40]);
 const neck=mesh('bag_neck',new T.CylinderGeometry(.037,.063,.20,24),rubber,[0,2.015,.40]);
 const points=[[.025,0],[.072,.025],[.115,.09],[.125,.17],[.105,.235],[.055,.29],[.045,.32]].map(([x,y])=>new T.Vector2(x,y));
 const punching=mesh('boxing_bag',new T.LatheGeometry(points,48),bag,[0,1.63,.40]);
 for(let j=0;j<4;j++){const panel=mesh('boxing_bag_panel',new T.LatheGeometry(points,12,j*Math.PI/2,.64),rubber,[0,1.63,.40]);panel.scale.setScalar(1.005);}
 // Score and digits are photographed artwork, kept unobstructed by duplicate screens.

 
 box('coin_slot',[.052,.15,.024],[-.20,1.005,.065],metal,.003);box('coin_opening',[.009,.035,.005],[-.20,1.04,.079],black,.001);
 box('coin_return',[.032,.026,.007],[-.20,.965,.08],black,.002);
 box('rear_door',[.47,.62,.015],[0,1.26,-.387],paint,.006);
 for(const x of [-.13,.13])for(let y=1;y<1.14;y+=.025)box('rear_vent',[.115,.009,.008],[x,y,-.40],black,.001);
 box('lower_service_door',[.66,.48,.017],[0,.44,-.34],paint,.005);
 for(let y=.28;y<.40;y+=.026)box('lower_vent',[.16,.009,.008],[-.10,y,-.355],black,.001);
 for(const x of [-.22,.22])for(const y of [.99,1.55])mesh('door_screw',new T.SphereGeometry(.005,8,6),metal,[x,y,-.405]);
 // Low intensity LED lenses: no bloom and no per-diode point lights.
 for(const x of [-.247,.247])for(let y=1.12;y<2.12;y+=.16)mesh('led_front',new T.SphereGeometry(.012,12,8),led,[x,y,.065]);
 for(const x of [-.455,.455])for(let y=.18;y<.80;y+=.1)mesh('led_lower',new T.SphereGeometry(.012,12,8),led,[x,y,.372]);
 for(let i=0;i<15;i++){const a=i/14*Math.PI;for(const y of [2.245,2.505])mesh('led_top',new T.SphereGeometry(.011,12,8),led,[.555*Math.cos(a),y,.20+.535*Math.sin(a)]);}
 for(const x of [-.389,.389]){box('led_diffuser',[.018,.43,.012],[x,.40,.388],black,.006);for(let y=.19;y<.615;y+=.016)mesh('led_strip_diode',new T.SphereGeometry(.006,8,6),led,[x,y,.4]);}
 box('led_diffuser',[.80,.018,.012],[0,.655,.387],black,.005);for(let x=-.38;x<.39;x+=.016)mesh('led_strip_diode',new T.SphereGeometry(.006,8,6),led,[x,.655,.4]);

 // Fabric seams, mounting hardware, panel gaps and recessed service details.
 const leather=bag.clone();leather.name='LEATHER_BLACK';leather.color.set('#161519');leather.roughness=.5;
 root.traverse(o=>{if(o.name==='boxing_bag_panel'||o.name==='bag_neck'||o.name==='kicker_arm')o.material=leather});
 for(let j=0;j<8;j++){
  const a=j*Math.PI/4;
  const seam=points.map(p=>new T.Vector3((p.x+.0015)*Math.cos(a),p.y+1.63,(p.x+.0015)*Math.sin(a)+.40));
  mesh('stitched_bag_seam',new T.TubeGeometry(new T.CatmullRomCurve3(seam),40,.0009,4,false),rubber,[0,0,0]);
 }
 for(let i=0;i<7;i++){
  const ring=mesh('neck_leather_fold',new T.TorusGeometry(.048+i*.001,.003,6,28),leather,[0,1.96+i*.021,.40]);ring.rotation.x=Math.PI/2;
 }
 for(const x of [-.40,.40]){
  const bezel=mesh('recessed_downlight',new T.CylinderGeometry(.043,.043,.012,32),metal,[x,2.195,.29]);
  mesh('downlight_lens',new T.CylinderGeometry(.033,.033,.014,24),led,[x,2.189,.29]);
 }
 box('rear_panel_gasket',[.49,.65,.01],[0,1.26,-.382],rubber,.008);
 for(const x of [-.218,.218])for(const y of [.97,1.55]){
  const bolt=mesh('rear_fastener',new T.CylinderGeometry(.008,.008,.004,12),metal,[x,y,-.405]);bolt.rotation.x=Math.PI/2;
  box('screw_slot',[.009,.0018,.001],[x,y,-.408],black,.0005);
 }
 for(const y of [1.05,1.47])box('rear_hinge',[.018,.055,.024],[-.24,y,-.404],metal,.003);
 box('rear_handle',[.012,.075,.018],[.18,1.30,-.41],black,.004);
 for(const x of [-.48,.48])for(const z of [-.28,.5])box('rubber_foot',[.12,.018,.12],[x,.004,z],rubber,.009);
 for(let i=0;i<23;i++)mesh('lower_top_led',new T.SphereGeometry(.008,12,8),led,[-.40+i*.036,.815,.36]);
 // Additional commercial options have their own meshes and can be toggled.
 box('option_banknote',[.09,.13,.025],[.18,1.015,.075],black,.009);
 box('banknote_slot',[.067,.008,.003],[.18,1.04,.09],metal,.001);
 box('option_ticket',[.12,.055,.028],[.21,.70,.386],black,.004);
 box('ticket_slot',[.09,.007,.003],[.21,.70,.403],metal,.001);

 for(const z of zones){let g=new T.PlaneGeometry(...z.size);let p=z.position,r=z.rotation;
  if(z.id==='top_front'){g=new T.CylinderGeometry(.548,.548,.20,64,1,true,-.89,1.78);g.scale(1,1,.965);p=[0,2.34,.20];r=[0,0,0];}
  const m=new T.MeshStandardMaterial({transparent:true,roughness:.32,metalness:.05,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide});m.name='GRAPHICS';const o=mesh(z.mesh,g,m,p);o.rotation.set(...r);o.castShadow=false;o.userData.zone=z.id;
 }

 const sticker=new T.MeshStandardMaterial({transparent:true,roughness:.36,depthWrite:false,side:T.DoubleSide});sticker.name='DECOR_FOOTBALL';
 for(const x of [-.456,.456])for(const [y,size] of [[.24,.065],[.46,.05],[.65,.03]])mesh('factory_football',new T.PlaneGeometry(size,size),sticker,[x,y,.372]);
 for(let i=0;i<9;i++){const a=.2+i*(Math.PI-.4)/8;const o=mesh('factory_canopy_football',new T.PlaneGeometry(.032,.032),sticker,[.57*Math.cos(a),2.515,.20+.55*Math.sin(a)]);o.rotation.y=Math.PI/2-a;}
 // Batch the diamond tread into one draw call.
 const tread=root.children.filter(o=>o.name==='tread');const geometries=tread.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix)});
 if(geometries.length){mesh('diamond_tread',mergeGeometries(geometries),metal,[0,0,0]);for(const o of tread)root.remove(o);for(const g of geometries)g.dispose();}

 return root;
}
