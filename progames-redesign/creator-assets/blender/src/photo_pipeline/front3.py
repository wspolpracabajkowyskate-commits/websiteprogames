import sys; sys.path.insert(0,'/home/claude/work/tools')
import numpy as np, cv2
from bake import load_view, bake
C='/home/claude/work/champ/cal/'; P1='/home/claude/work/champ/photos2/'; P3='/home/claude/work/champ/photos3/'
xa,xb,y0,y1,z = -0.335,0.335,0.045,1.85,0.1512
W=1240; H=int(round(W*(y1-y0)/(xb-xa))); ppm=W/(xb-xa)
X,Y=np.meshgrid(np.linspace(xa,xb,W),np.linspace(y1,y0,H)); P=np.stack([X,Y,np.full_like(X,z)],-1); N=np.zeros_like(P); N[...,2]=1
res={}
for k,camf,imf in (('A','ba_0571.json',P3+'IMG_0571.jpg'),('B','ba_0507.json',P1+'IMG_0507.jpg'),('C','ba_0516.json',P1+'IMG_0516.jpg')):
    v=load_view(C+camf,imf); im,ws=bake(P,N,[v],border=0.06); res[k]=(im,ws[0]); cv2.imwrite(f'g_{k}.jpg',im)
np.save('aligned.npy',dict(A=res['A'][0],B=res['B'][0],C=res['C'][0],wa=res['A'][1],wb=res['B'][1],wc=res['C'][1]),allow_pickle=True)
print(W,H,ppm)
