from pathlib import Path
import math, json
import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'assets'; MODEL=ROOT/'model'; MODEL.mkdir(exist_ok=True)
# Product specification already present in the supplied website product data.
W,D,H = 1.42,1.22,2.19


def rgb(hexstr):
    s=hexstr.lstrip('#'); return [int(s[i:i+2],16)/255 for i in (0,2,4)]

def mat(name,color,metal=0.0,rough=.45,emissive=None,alpha=1.0):
    return PBRMaterial(name=name, baseColorFactor=[*rgb(color),alpha], metallicFactor=metal,
                       roughnessFactor=rough, emissiveFactor=rgb(emissive) if emissive else [0,0,0],
                       alphaMode='BLEND' if alpha<1 else 'OPAQUE', doubleSided=True)

def texmat(name,filename,rough=.45,metal=0.0,alpha=True):
    im=Image.open(ASSET/filename).convert('RGBA')
    return PBRMaterial(name=name, baseColorFactor=[1,1,1,1], baseColorTexture=im,
                       metallicFactor=metal, roughnessFactor=rough,
                       alphaMode='BLEND' if alpha else 'OPAQUE', doubleSided=True)

M={
 'BODY_BLUE':mat('BODY_BLUE','#0789e8',.10,.27), 'BLACK':mat('BLACK','#0b0d11',.28,.32),
 'DARK':mat('DARK','#030507',.05,.62), 'METAL':mat('METAL','#9aa3ad',.88,.24),
 'RUBBER':mat('RUBBER','#111216',0,.78), 'LEATHER':mat('LEATHER','#131416',0,.58),
 'RED':mat('RED','#a91419',.02,.42), 'WHITE':mat('WHITE','#eef2f5',0,.38),
 'GLASS':mat('GLASS','#182536',0,.08,alpha=.28), 'DISPLAY_RED':mat('DISPLAY_RED','#270205',0,.22,'#ff1717'),
 'CUSTOM':mat('CUSTOM','#ffffff',0,.45,alpha=.0),
 'LED_WHITE':mat('LED_WHITE','#fffaf1',0,.16,'#ffffff'), 'LED_CYAN':mat('LED_CYAN','#d6ffff',0,.16,'#56eaff'),
 'LED_GREEN':mat('LED_GREEN','#e7ffdc',0,.16,'#58ff96'), 'LED_PINK':mat('LED_PINK','#ffe5ff',0,.16,'#ff72ff'),
 'TOP_BANNER':texmat('TOP_BANNER','top-banner.webp',.40), 'SCORE_PANEL':texmat('SCORE_PANEL','score-panel.webp',.38),
 'VERSUS_POSTER':texmat('VERSUS_POSTER','versus-poster.webp',.42,alpha=False), 'KICKER_LOGO':texmat('KICKER_LOGO','kicker-logo.webp',.42),
 'BOXER_LOGO':texmat('BOXER_LOGO','boxer-logo.webp',.42), 'GAME_RULES':texmat('GAME_RULES','game-rules.webp',.48),
 'KICKER_SMART':texmat('KICKER_SMART','kicker-smart.webp',.42), 'REAR_LOGO':texmat('REAR_LOGO','rear-logo.webp',.43),
}
scene=trimesh.Scene()

def add(name,mesh,material=None):
    if material: mesh.visual.material=M[material]
    scene.add_geometry(mesh, geom_name=name, node_name=name); return mesh

def box(name,size,center,material='BODY_BLUE'):
    m=trimesh.creation.box(extents=size); m.apply_translation(center); return add(name,m,material)

def rounded_box(name,w,h,d,center,r,material='BODY_BLUE',sections=20):
    cx,cy,cz=center; parts=[]
    a=trimesh.creation.box(extents=[max(w-2*r,.002),h,d]);a.apply_translation(center);parts.append(a)
    b=trimesh.creation.box(extents=[w,h,max(d-2*r,.002)]);b.apply_translation(center);parts.append(b)
    for sx in (-1,1):
      for sz in (-1,1):
        c=trimesh.creation.cylinder(radius=r,height=h,sections=sections)
        c.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]))
        c.apply_translation([cx+sx*(w/2-r),cy,cz+sz*(d/2-r)]);parts.append(c)
    return add(name,trimesh.util.concatenate(parts),material)

def chamfer_base(name,w,h,d,center,ch=.10,material='BLACK'):
    hw=w/2;hd=d/2;cy=center[1];y0=cy-h/2;y1=cy+h/2
    pts=np.array([[-hw+ch,-hd],[hw-ch,-hd],[hw,-hd+ch],[hw,hd-ch],[hw-ch,hd],[-hw+ch,hd],[-hw,hd-ch],[-hw,-hd+ch]])
    vs=[[x,y0,z] for x,z in pts]+[[x,y1,z] for x,z in pts];n=len(pts);f=[]
    for i in range(1,n-1):f += [[0,i+1,i],[n,n+i,n+i+1]]
    for i in range(n):j=(i+1)%n;f += [[i,j,n+j],[i,n+j,n+i]]
    return add(name,trimesh.Trimesh(vertices=np.array(vs),faces=np.array(f),process=True),material)

def cyl(name,r,h,center,material='METAL',axis='y',sections=24):
    m=trimesh.creation.cylinder(radius=r,height=h,sections=sections)
    if axis=='x':m.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,1,0]))
    elif axis=='y':m.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]))
    m.apply_translation(center); return add(name,m,material)

def sphere(name,r,center,material='WHITE',scale=None,sub=2):
    m=trimesh.creation.icosphere(subdivisions=sub,radius=r)
    if scale:m.apply_scale(scale)
    m.apply_translation(center);return add(name,m,material)

def plane_xy(name,w,h,center,material,rot_y=0):
    v=np.array([[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]],float);f=np.array([[0,1,2],[0,2,3]]);uv=np.array([[0,0],[1,0],[1,1],[0,1]],float)
    m=trimesh.Trimesh(vertices=v,faces=f,process=False);m.visual=TextureVisuals(uv=uv,material=M[material])
    if rot_y:m.apply_transform(trimesh.transformations.rotation_matrix(rot_y,[0,1,0]))
    m.apply_translation(center);scene.add_geometry(m,geom_name=name,node_name=name);return m

def plane_xz(name,w,d,center,material):
    # UV plane horizontal, facing +Y
    v=np.array([[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2]],float);f=np.array([[0,2,1],[0,3,2]]);uv=np.array([[0,0],[1,0],[1,1],[0,1]],float)
    m=trimesh.Trimesh(vertices=v,faces=f,process=False);m.visual=TextureVisuals(uv=uv,material=M[material]);m.apply_translation(center);scene.add_geometry(m,geom_name=name,node_name=name);return m

# --- shell, proportions matched to full front + side + rear references ---
chamfer_base('BASE_BLACK',W,.075,D,[0,.0375,0],.11,'BLACK')
box('METAL_PLATFORM',[1.20,.018,.96],[0,.084,-.015],'METAL')
rounded_box('BODY_MAIN',1.15,.48,.78,[0,.34,.02],.115,'BODY_BLUE')
box('LEFT_PANEL',[.055,.44,.69],[-.548,.34,.05],'BODY_BLUE');box('RIGHT_PANEL',[.055,.44,.69],[.548,.34,.05],'BODY_BLUE')
# front kicker recess (dark inset + raised frame)
plane_xy('FRONT_RECESS',.79,.31,[0,.34,-.374],'DARK')
box('FRONT_FRAME_TOP',[.90,.055,.055],[0,.535,-.39],'BODY_BLUE');box('FRONT_FRAME_BOTTOM',[.90,.045,.055],[0,.145,-.39],'BODY_BLUE')
box('FRONT_FRAME_LEFT',[.055,.34,.055],[-.445,.34,-.39],'BODY_BLUE');box('FRONT_FRAME_RIGHT',[.055,.34,.055],[.445,.34,-.39],'BODY_BLUE')
# central tower and rear rails
box('BODY_COLUMN',[.53,1.15,.34],[0,1.18,.17],'BODY_BLUE')
box('BACK_PANEL',[.49,1.10,.025],[0,1.18,.352],'BODY_BLUE');box('BACK_RAIL_LEFT',[.032,1.12,.04],[-.285,1.18,.352],'BLACK');box('BACK_RAIL_RIGHT',[.032,1.12,.04],[.285,1.18,.352],'BLACK')
# top canopy / overhang
rounded_box('TOP_SECTION',1.18,.29,.93,[0,1.91,-.04],.16,'BODY_BLUE')
rounded_box('TOP_LIP',1.30,.095,.98,[0,2.075,-.045],.17,'BODY_BLUE')
# black underside / opening
rounded_box('TOP_UNDERSIDE',.57,.026,.45,[0,1.765,-.19],.12,'DARK')
# score/control graphics
plane_xy('FRONT_PANEL',.45,.82,[0,1.23,-.007],'SCORE_PANEL')
plane_xy('DISPLAY',.25,.105,[0,1.36,-.014],'DISPLAY_RED');plane_xy('DISPLAY_GLASS',.265,.12,[0,1.36,-.018],'GLASS')
# coin acceptor & rules / smart logo
box('PAYMENT_PANEL',[.075,.21,.045],[-.18,.76,-.018],'BLACK');box('COIN_ACCEPTOR',[.055,.12,.037],[-.18,.785,-.044],'METAL')
plane_xy('GAME_RULES',.13,.14,[.03,.755,-.022],'GAME_RULES');plane_xy('KICKER_SMART',.16,.14,[.17,.76,-.022],'KICKER_SMART')
# side vertical posters
plane_xy('POSTER_LEFT',.20,.61,[-.271,1.27,.15],'VERSUS_POSTER',rot_y=-math.pi/2)
plane_xy('POSTER_RIGHT',.20,.61,[.271,1.27,.15],'VERSUS_POSTER',rot_y=math.pi/2)
# top banner and side boxer emblems
plane_xy('TOP_BANNER',.64,.17,[0,1.93,-.505],'TOP_BANNER')
plane_xy('TOP_BOXER_LEFT',.27,.17,[-.598,1.93,-.08],'BOXER_LOGO',rot_y=-math.pi/2)
plane_xy('TOP_BOXER_RIGHT',.27,.17,[.598,1.93,-.08],'BOXER_LOGO',rot_y=math.pi/2)
# kicker logos on lower sides
plane_xy('KICKER_LOGO_LEFT',.38,.30,[-.578,.35,.05],'KICKER_LOGO',rot_y=-math.pi/2)
plane_xy('KICKER_LOGO_RIGHT',.38,.30,[.578,.35,.05],'KICKER_LOGO',rot_y=math.pi/2)
# rear logo and panels
plane_xy('REAR_LOGO',.38,.19,[0,1.55,.366],'REAR_LOGO',rot_y=math.pi)
box('REAR_SERVICE_DOOR',[.34,.42,.022],[0,1.10,.366],'BODY_BLUE');box('REAR_SERVICE_LOWER',[.42,.30,.022],[0,.39,.366],'BODY_BLUE')
# vents as black slots
for prefix,y,z in [('VENT_TOP',1.69,.382),('VENT_DOOR',.95,.382),('VENT_LOWER',.42,.382)]:
    for row in range(2 if prefix!='VENT_TOP' else 1):
        for col in range(4):
            x=(-.09 if prefix=='VENT_TOP' else -.12)+col*.06
            box(f'{prefix}_{row}_{col}',[.038,.008,.008],[x,y-row*.035,z],'BLACK')
# punching bag
cyl('BAG_ARM',.043,.24,[0,1.70,-.27],'RUBBER','y');cyl('BAG_NECK',.07,.13,[0,1.57,-.27],'LEATHER','y')
sphere('PUNCHING_BAG',.128,[0,1.475,-.27],'LEATHER',[1,1.12,1],3)
sphere('PUNCHING_BAG_RED_L',.112,[-.037,1.475,-.377],'RED',[.68,1.03,.24],2);sphere('PUNCHING_BAG_RED_R',.112,[.037,1.475,-.377],'RED',[.68,1.03,.24],2)
# kicker ball + padded arm
cyl('KICKER_ARM',.065,.48,[.12,.34,-.415],'LEATHER','x');box('KICKER_MOUNT',[.10,.18,.06],[.39,.34,-.413],'BLACK')
sphere('KICKER_BALL',.128,[-.18,.34,-.415],'WHITE',None,3)
for i,(x,y,z,s) in enumerate([(-.18,.34,-.532,.040),(-.18,.45,-.43,.034),(-.18,.23,-.43,.034),(-.285,.34,-.43,.032),(-.075,.34,-.43,.032)]):
    sphere(f'KICKER_PATCH_{i+1}',s,[x,y,z],'BLACK',[1,1,.25],1)
# front/side custom branding surfaces (slightly proud of paint)
plane_xy('CUSTOM_FRONT',.34,.12,[.20,.63,-.400],'CUSTOM')
plane_xy('CUSTOM_LEFT',.40,.24,[-.582,.34,-.03],'CUSTOM',rot_y=-math.pi/2)
plane_xy('CUSTOM_RIGHT',.40,.24,[.582,.34,-.03],'CUSTOM',rot_y=math.pi/2)
# optional equipment, included once, controlled with visible=true/false
box('BANKNOTE_ACCEPTOR',[.09,.20,.045],[.13,.76,-.025],'BLACK')
box('CARD_READER',[.095,.13,.035],[.14,.66,-.028],'BLACK')
box('TICKET_DISPENSER',[.13,.11,.045],[.36,.46,-.405],'BLACK')
# compact capsule option on right side (prototype mount; not shown in references)
cyl('CAPSULE_DISPENSER',.10,.25,[.59,.58,.19],'GLASS','y',32);cyl('CAPSULE_BASE',.105,.05,[.59,.44,.19],'BLACK','y',32)
# metallic button/detail
cyl('BUTTONS',.024,.020,[.19,.60,-.03],'METAL','z',20)
# LEDs
colors=['LED_PINK','LED_WHITE','LED_CYAN','LED_GREEN']
# top front and lower front rows
idx=0
for x in np.linspace(-.51,.51,9):
    sphere(f'LED_TOP_FRONT_{idx}',.019,[x,1.80,-.505],colors[idx%4],None,1);idx+=1
for x in np.linspace(-.56,.56,10):
    sphere(f'LED_TOP_LIP_{idx}',.018,[x,2.075,-.518],colors[idx%4],None,1);idx+=1
for x in np.linspace(-.43,.43,10):
    sphere(f'LED_LOWER_TOP_{idx}',.016,[x,.575,-.402],colors[idx%4],None,1);idx+=1
for x in (-.505,.505):
    for y in np.linspace(.18,.52,7):
        sphere(f'LED_LOWER_SIDE_{idx}',.015,[x,y,-.402],colors[idx%4],None,1);idx+=1
# score column side LEDs
for x in (-.273,.273):
    for y in np.linspace(.82,1.68,5):
        sphere(f'LED_COLUMN_{idx}',.015,[x,y,-.02],colors[idx%4],None,1);idx+=1
# underside spotlights
for x in (-.38,.38):cyl(f'SPOT_{x}',.035,.018,[x,1.757,-.24],'LED_WHITE','y',24)

# Scale Y uniformly so the exported bounds match the product's 219 cm overall height exactly.
current_h=float(scene.bounds[1,1]-scene.bounds[0,1])
y_scale=H/current_h
for geom in scene.geometry.values():
    geom.apply_scale([1,y_scale,1])
scene.metadata.update({'asset_name':'PRO GAMES CREATOR — Double Strike 2','dimensions_m':[W,D,H],'source':'9 supplied reference images + supplied website product specification'})
out=MODEL/'pro-games-double-strike-2.glb';out.write_bytes(scene.export(file_type='glb'))
manifest={
 'model':'Double Strike 2','dimensions_m':{'width':W,'depth':D,'height':H},
 'color_targets':['BODY_MAIN','LEFT_PANEL','RIGHT_PANEL','BODY_COLUMN','BACK_PANEL','TOP_SECTION','TOP_LIP','FRONT_FRAME_TOP','FRONT_FRAME_BOTTOM','FRONT_FRAME_LEFT','FRONT_FRAME_RIGHT','REAR_SERVICE_DOOR','REAR_SERVICE_LOWER'],
 'branding_surfaces':['CUSTOM_FRONT','CUSTOM_LEFT','CUSTOM_RIGHT'],
 'equipment':['COIN_ACCEPTOR','BANKNOTE_ACCEPTOR','CARD_READER','TICKET_DISPENSER','CAPSULE_DISPENSER','CAPSULE_BASE'],
 'display_nodes':['DISPLAY','DISPLAY_GLASS'],'led_prefixes':['LED_','SPOT_'],
 'materials':[k for k in M.keys()],
 'source_texture_files':['top-banner.webp','score-panel.webp','versus-poster.webp','kicker-logo.webp','boxer-logo.webp','game-rules.webp','kicker-smart.webp','rear-logo.webp']
}
(MODEL/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(out, out.stat().st_size)
