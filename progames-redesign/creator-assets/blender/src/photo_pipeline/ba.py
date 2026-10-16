"""Joint bundle adjustment: 4 cameras + key model dimensions + front-panel feature points."""
import sys, json; sys.path.insert(0,'/home/claude/work/tools')
import numpy as np, cv2
from scipy.optimize import least_squares
from scipy.sparse import lil_matrix
from bake import load_view, bake
C='/home/claude/work/champ/cal/'; P1='/home/claude/work/champ/photos2/'; P3='/home/claude/work/champ/photos3/'
VIEWS=['0571','0507','0516','0508']
camfile={'0571':'0571.json','0507':'0507.json','0516':'0516_0.json','0508':'0508.json'}
imgfile={'0571':P3+'IMG_0571.jpg','0507':P1+'IMG_0507.jpg','0516':P1+'IMG_0516.jpg','0508':P1+'IMG_0508.jpg'}
cams={k:json.load(open(C+camfile[k])) for k in VIEWS}
# ---------------- model parameters
names=['cx','z1','z0','px','pz1','sy','sz','lx','ly','lz','ry','lbx','lbz']
p0=dict(cx=0.31,z1=0.15,z0=-0.15,px=0.315,pz1=0.92,sy=1.8775,sz=0.848,lx=0.14,ly=1.845,lz=0.66,ry=1.845,lbx=0.36,lbz=-0.20)
def pt(name,m):
    cx,z1,z0,px,pz1,sy,sz,lx,ly,lz,ry,lbx,lbz=[m[n] for n in names]
    return {'plat_fr':(px,0,pz1),'plat_fl':(-px,0,pz1),'rail_br':(cx,0.045,z1),'rail_bl':(-cx,0.045,z1),'col_bbr':(cx,0.045,z0),
            'start':(0,sy,sz),'light_l':(-lx,ly,lz),'light_r':(lx,ly,lz),'rail_tl':(-cx-0.008,ry,z1+0.005),'rail_tr':(cx+0.008,ry,z1+0.005),
            'lid_br':(lbx,2.185,lbz),'brim_fc':(0,ly,sz-0.003)}[name]
obs={  # 825x1100 pixel observations (manual)
 '0507':[('plat_fr',(365,1014)),('rail_br',(470,909)),('rail_bl',(313,884)),('start',(248,325)),('light_l',(261,365)),('light_r',(337,348))],
 '0508':[('plat_fr',(161.6,992.6)),('rail_br',(458,970)),('col_bbr',(581,973)),('lid_br',(602,140)),('light_r',(274.8,290.4)),('light_l',(285.9,328.3))],
 '0516':[('plat_fl',(547.4,1073.9)),('plat_fr',(671.6,947.4)),('rail_bl',(325,945)),('start',(609.8,271.3)),('light_l',(498.8,286.7)),('light_r',(559,311.6))],
 '0571':[('start',(429.4,242.2)),('light_l',(312.3,287.3)),('light_r',(537.8,283.4)),('rail_tl',(205,328)),('rail_tr',(623,328.5)),('brim_fc',(429,262.5))],
}
railobs=[('0571',-1,450,191.4),('0571',1,450,622.0),('0571',-1,1060,203.7),('0571',1,1060,638.4)]
# ---------------- automatic front-panel correspondences via per-view rectified bakes
xa,xb,ya,yb,zf=-0.33,0.33,0.045,1.85,0.1512
W=900; H=int(round(W*(yb-ya)/(xb-xa))); ppm=W/(xb-xa)
X,Y=np.meshgrid(np.linspace(xa,xb,W),np.linspace(yb,ya,H)); PP=np.stack([X,Y,np.full_like(X,zf)],-1); NN=np.zeros_like(PP); NN[...,2]=1
bk={}; V={}
for k in ['0571','0507','0516']:
    V[k]=load_view(C+camfile[k],imgfile[k]); im,ws=bake(PP,NN,[V[k]],border=0.06); bk[k]=(im,ws[0])
sift=cv2.SIFT_create(5000)
def tex2pix(k,uv):
    Xw=np.stack([xa+uv[:,0]/ppm, yb-uv[:,1]/ppm, np.full(len(uv),zf)],-1)
    v=V[k]; Xc=Xw@v['R'].T+v['t']; p=Xc@v['K'].T; s=v['img'].shape[1]/cams[k]['W']
    return p[:,:2]/p[:,2:]/s
feat=[]  # (view, pix, feature_id)
nf=0
for a,b in (('0571','0507'),('0571','0516'),('0507','0516')):
    A,wa=bk[a]; B,wb=bk[b]
    m=((wa>0.1*wa.max())&(wb>0.05*wb.max())).astype(np.uint8)*255; m[:int(H*0.22)]=0
    ga=cv2.cvtColor(A,cv2.COLOR_BGR2GRAY); gb=cv2.cvtColor(B,cv2.COLOR_BGR2GRAY)
    k1,d1=sift.detectAndCompute(ga,m); k2,d2=sift.detectAndCompute(gb,m)
    mt=cv2.BFMatcher().knnMatch(d1,d2,k=2); good=[x for x,y in mt if x.distance<0.7*y.distance]
    p1=np.float32([k1[g.queryIdx].pt for g in good]); p2=np.float32([k2[g.trainIdx].pt for g in good])
    Hm,inl=cv2.findHomography(p1,p2,cv2.RANSAC,4.0); inl=inl.ravel()>0
    p1,p2=p1[inl],p2[inl]
    sel=np.random.RandomState(0).choice(len(p1),min(120,len(p1)),replace=False)
    for i in sel:
        feat.append((a,tex2pix(a,p1[i:i+1])[0],nf,p1[i])); feat.append((b,tex2pix(b,p2[i:i+1])[0],nf,None)); nf+=1
    print(a,b,'inliers',int(inl.sum()))
# feature init positions (metric) from view a's texel
finit=np.zeros((nf,2))
for v,pix,fid,uv in feat:
    if uv is not None: finit[fid]=[xa+uv[0]/ppm, yb-uv[1]/ppm]
# ---------------- parameter vector
def cam_to_vec(c):
    R=np.array(c['R']).reshape(3,3); rv,_=cv2.Rodrigues(R); return list(rv.ravel())+list(c['t'])
x0=[]
for k in VIEWS: x0+=cam_to_vec(cams[k])
x0+=[cams['0571']['fx']]
x0+=[p0[n] for n in names]
x0+=list(finit.ravel())
x0=np.array(x0,float)
NC=6*len(VIEWS)
def unpack(x):
    cs={}
    for i,k in enumerate(VIEWS):
        rv=x[6*i:6*i+3]; t=x[6*i+3:6*i+6]; cs[k]=(cv2.Rodrigues(rv)[0],t)
    f71=x[NC]; m=dict(zip(names,x[NC+1:NC+1+len(names)])); F=x[NC+1+len(names):].reshape(-1,2)
    return cs,f71,m,F
def project(k,cs,f71,Xw):
    R,t=cs[k]; c=cams[k]; f=f71 if k=='0571' else c['fx']
    Xc=np.atleast_2d(Xw)@R.T+t; return np.stack([f*Xc[:,0]/Xc[:,2]+c['cx'], f*Xc[:,1]/Xc[:,2]+c['cy']],1)
def resid(x):
    cs,f71,m,F=unpack(x); r=[]
    for k,lst in obs.items():
        for name,pix in lst:
            r+=list((project(k,cs,f71,pt(name,m))[0]-pix)*1.0)
    for k,s,yi,xi in railobs:
        ys=np.linspace(0.3,1.9,321); Pw=np.stack([np.full_like(ys,s*(m['cx']+0.008)),ys,np.full_like(ys,m['z1']+0.003)],1)
        pr=project(k,cs,f71,Pw); j=np.argmin(abs(pr[:,1]-yi)); r.append(pr[j,0]-xi)
    for v,pix,fid,_ in feat:
        Xw=[F[fid,0],F[fid,1],m['z1']+0.0012]; r+=list((project(v,cs,f71,Xw)[0]-pix)*0.5)
    # weak priors to keep the unobservable stuff sane
    r+=[(m['z1']-0.15)*500, (m['lbx']-0.36)*100]
    return np.array(r)
r0=resid(x0); print('initial rms',np.sqrt(np.mean(r0**2)).round(2))
sol=least_squares(resid,x0,loss='huber',f_scale=3.0,max_nfev=300)
r1=resid(sol.x); print('final rms',np.sqrt(np.mean(r1**2)).round(2))
cs,f71,m,F=unpack(sol.x)
print('f71',round(f71,1)); print({k:round(v,4) for k,v in m.items()})
for k,lst in obs.items():
    e=[np.linalg.norm(project(k,cs,f71,pt(n,m))[0]-np.array(p)) for n,p in lst]; print(k,np.round(e,1))
for k in VIEWS:
    R,t=cs[k]; c=dict(cams[k]); c['R']=R.ravel().tolist(); c['t']=list(map(float,t))
    if k=='0571': c['fx']=c['fy']=float(f71)
    C3=-R.T@t; print(k,'cam',C3.round(3))
    json.dump(c,open(C+'ba_'+k+'.json','w'))
json.dump({k:float(v) for k,v in m.items()},open(C+'ba_model.json','w'))
