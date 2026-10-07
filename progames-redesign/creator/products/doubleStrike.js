export const colors = ['#008bdf','#bd2235','#171c24','#eef0f1','#ffcc19','#ed701b','#258851'];
export const presets=['Original','Minimal','Sport','Neon','Custom Branding'];
export const zones=[
 ['top_front',[0,2.32,.72],[0,0,0],[.86,.21],'front'],
 ['front_panel',[0,1.035,.057],[0,0,0],[.16,.19],'front'],
 ['score_panel',[0,1.56,.057],[0,0,0],[.45,.91],'front'],
 ['left_side',[-.276,1.55,-.16],[0,-Math.PI/2,0],[.37,.94],'left'],
 ['right_side',[.276,1.55,-.16],[0,Math.PI/2,0],[.37,.94],'right'],
 ['lower_front',[0,.80,.38],[0,0,0],[.73,.11],'front'],
 ['kicker_panel',[0,.22,.18],[0,0,0],[.6,.09],'front'],
 ['top_side',[.51,2.32,.08],[0,Math.PI/2,0],[.30,.18],'right'],
 ['lower_left',[-.528,.44,.045],[0,-Math.PI/2,0],[.48,.51],'left'],
 ['lower_right',[.528,.44,.045],[0,Math.PI/2,0],[.48,.51],'right']
].map(([id,position,rotation,size,camera])=>({id,mesh:'decal_'+id,position,rotation,size,camera,factoryTexture:({score_panel:'score.png',left_side:'side.png',right_side:'side.png',lower_left:'kicker.png',lower_right:'kicker.png',top_front:'marquee.png',front_panel:'rules.png'})[id]?'/creator/textures/studio/'+({score_panel:'score.png',left_side:'side.png',right_side:'side.png',lower_left:'kicker.png',lower_right:'kicker.png',top_front:'marquee.png',front_panel:'rules.png'})[id]:null}));
export const product={id:'double-strike',name:'Double Strike',category:'BOXER + KICKER',previewPath:'/creator/textures/studio/reference.webp',optionMeshes:{banknote:['option_banknote','banknote_slot'],ticket:['option_ticket','ticket_slot']},modelPath:'/creator/models/double-strike-studio.glb',finalModelPath:'/creator/models/double-strike.glb',cameraPosition:[3.25,2.65,5.1],configurableMeshes:zones.map(z=>z.mesh),colorMaterials:['BODY_PAINT'],decalZones:zones,ledZones:['LED'],availableOptions:['banknote','coin','capsule','ticket','stickers','wifi'],defaultConfiguration:{selectedProduct:'double-strike',bodyColor:colors[0],graphicsPreset:'Original',customGraphics:{},ledMode:'Original RGB',selectedOptions:[],cameraPreset:'threeQuarter',selectedGraphicZone:'top_front'}};
export const products=[product];
