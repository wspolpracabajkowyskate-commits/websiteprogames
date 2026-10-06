export const colors = ['#008bdf','#bd2235','#171c24','#eef0f1','#ffcc19','#ed701b','#258851'];
export const presets=['Original','Minimal','Sport','Neon','Custom Branding'];
export const zones=[
 ['top_front',[0,2.32,.72],[0,0,0],[.86,.21],'front'],
 ['front_panel',[0,1.06,.055],[0,0,0],[.44,.18],'front'],
 ['score_panel',[0,1.59,.056],[0,0,0],[.43,.72],'front'],
 ['left_side',[-.276,1.55,-.16],[0,-Math.PI/2,0],[.37,.94],'left'],
 ['right_side',[.276,1.55,-.16],[0,Math.PI/2,0],[.37,.94],'right'],
 ['lower_front',[0,.80,.38],[0,0,0],[.73,.11],'front'],
 ['kicker_panel',[0,.22,.18],[0,0,0],[.6,.09],'front'],
 ['top_side',[.51,2.32,.2],[0,Math.PI/2,0],[.42,.20],'right']
].map(([id,position,rotation,size,camera])=>({id,mesh:'decal_'+id,position,rotation,size,camera,factoryTexture:id==='score_panel'?'/creator/textures/score.png':null}));
export const product={id:'double-strike',name:'Double Strike',category:'BOXER + KICKER',previewPath:'/creator/textures/reference.webp',optionMeshes:{},modelPath:'/creator/models/double-strike-demo.glb',finalModelPath:'/creator/models/double-strike.glb',cameraPosition:[3,2.3,4.2],configurableMeshes:zones.map(z=>z.mesh),colorMaterials:['BODY_PAINT'],decalZones:zones,ledZones:['LED'],availableOptions:['banknote','coin','capsule','ticket','stickers','wifi'],defaultConfiguration:{selectedProduct:'double-strike',bodyColor:colors[0],graphicsPreset:'Original',customGraphics:{},ledMode:'Original RGB',selectedOptions:[],cameraPreset:'threeQuarter',selectedGraphicZone:'top_front'}};
export const products=[product];
