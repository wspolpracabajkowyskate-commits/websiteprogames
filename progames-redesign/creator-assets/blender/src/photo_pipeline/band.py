import sys; sys.path.insert(0,'/home/claude/work/tools'); sys.path.insert(0,'/home/claude/websiteprogames/progames-redesign/creator-assets/blender/src')
import numpy as np, cv2, importlib
import champion_model as cm
from double_strike_model import plan_point, arc_param_at
from bake import load_view, bake
C='/home/claude/work/champ/cal/'; P1='/home/claude/work/champ/photos2/'; P3='/home/claude/work/champ/photos3/'
D=cm.D; Cd=cm.DRUM_PLAN
fL = arc_param_at(Cd, [-D['drum_x'], D['col_z0'] + 0.03], side_sign=-1)
fR = arc_param_at(Cd, [D['drum_x'], D['col_z0'] + 0.03], side_sign=1)
fF = arc_param_at(Cd, [0, D['drum_z1']])
a, b = fL, fR
if not ((fF - a) % 1.0 < (b - a) % 1.0): a, b = b, a
if b < a: b += 1.0
nu=4096; Y0,Y1=cm.BAND_Y; nv=int(round(nu*(Y1-Y0)/2.39))
P=np.zeros((nv,nu,3)); N=np.zeros((nv,nu,3))
pts=[plan_point(Cd, a+(b-a)*i/(nu-1)) for i in range(nu)]
# orientation as in contour_strip: u increases to viewer's right (seen from outside)
pm,nm=plan_point(Cd,0.5*(a+b)); right=np.cross([0,1,0],[nm[0],0,nm[1]])
du=np.array([pts[-1][0][0]-pts[0][0][0],0,pts[-1][0][1]-pts[0][0][1]])
flip = du@right < 0
if flip: pts=pts[::-1]
for i,(p,n) in enumerate(pts):
    for j in range(nv):
        y=Y1-(Y1-Y0)*j/(nv-1)          # v=0 at the top
        P[j,i]=[p[0]+n[0]*0.0016,y,p[1]+n[1]*0.0016]; N[j,i]=[n[0],0,n[1]]
views={'0571':(C+'ba_0571.json',P3+'IMG_0571.jpg'),'0507':(C+'ba_0507.json',P1+'IMG_0507.jpg'),'0516':(C+'ba_0516.json',P1+'IMG_0516.jpg'),'0508':(C+'ba_0508.json',P1+'IMG_0508.jpg')}
out={}
for k,(cf,imf) in views.items():
    v=load_view(cf,imf); im,ws=bake(P,N,[v],border=0.003); out[k]=(im,ws[0])
    cv2.imwrite(f'band_{k}.jpg',im)
np.save('band_views.npy',{k:(v[0],v[1]) for k,v in out.items()},allow_pickle=True)
print(nu,nv,'flip',flip)
