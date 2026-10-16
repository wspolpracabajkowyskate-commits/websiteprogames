import sys; sys.path.insert(0,'/home/claude/work/tools'); sys.path.insert(0,'/home/claude/websiteprogames/progames-redesign/creator-assets/blender/src')
import numpy as np, cv2, importlib
import champion_model as cm
from bake import load_view, bake
from PIL import Image
D=cm.D
C='/home/claude/work/champ/cal/'; P1='/home/claude/work/champ/photos2/'
za, zb = D['col_z0'] + D['back_trim'], D['col_z1'] - D['side_red']
ya, yb = D['col_y0'] + 0.002, D['col_box_y1'] - 0.004
Wt=600; Ht=int(round(Wt*(yb-ya)/(zb-za)))
T='/home/claude/websiteprogames/progames-redesign/creator-assets/textures/champion/'
for name,sx,views in (('right',1,[('ba_0508.json','IMG_0508.jpg',1.0),('ba_0507.json','IMG_0507.jpg',0.3)]),('left',-1,[('ba_0516.json','IMG_0516.jpg',1.0)])):
    us=np.linspace(0,1,Wt); vs=np.linspace(0,1,Ht)
    U,V=np.meshgrid(us,vs)
    z = zb-(zb-za)*U if sx>0 else za+(zb-za)*U
    y = yb-(yb-ya)*V
    P=np.stack([np.full_like(U,sx*(D['col_x']+0.0012)),y,z],-1); N=np.zeros_like(P); N[...,0]=sx
    vv=[]
    for cf,imf,g in views:
        v=load_view(C+cf,P1+imf); v['gain']=g; vv.append(v)
    im,ws=bake(P,N,vv,border=0.02)
    cv2.imwrite(f'side_{name}.png',im)
    Image.fromarray(cv2.cvtColor(im,cv2.COLOR_BGR2RGB)).convert('RGBA').save(T+f'champion_zone_{name}.webp','WEBP',quality=90,method=6)
    print(name,im.shape)
