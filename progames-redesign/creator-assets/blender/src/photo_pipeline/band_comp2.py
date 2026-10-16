import numpy as np, cv2
V=np.load('band_views.npy',allow_pickle=True).item()
ims={k:v[0] for k,v in V.items()}
H,W=ims['0571'].shape[:2]
def ecc_align(src,ref,x0,x1,search=120):
    t=cv2.cvtColor(ref[25:H-25,x0:x1],cv2.COLOR_BGR2GRAY)
    s=cv2.cvtColor(src,cv2.COLOR_BGR2GRAY)
    xa=max(0,x0-search); xb=min(W,x1+search)
    pad=cv2.copyMakeBorder(s[:,xa:xb],60,60,0,0,cv2.BORDER_REFLECT)
    r=cv2.matchTemplate(pad,t,cv2.TM_CCOEFF_NORMED); _,mx,_,loc=cv2.minMaxLoc(r)
    dx=(loc[0]+xa)-x0; dy=(loc[1]-60)-25
    print('tm',round(mx,3),(dx,dy))
    return np.array([[1,0,dx],[0,1,dy]],float)   # ref -> src
def warp(src,M): return cv2.warpAffine(src,M.astype(np.float32),(W,H),flags=cv2.INTER_CUBIC|cv2.WARP_INVERSE_MAP,borderMode=cv2.BORDER_REPLICATE)
A0=ims['0571']
mL=ecc_align(ims['0516'],A0,1364,1900); mR=ecc_align(ims['0507'],A0,2150,2630)
dyA=0
A=cv2.warpAffine(A0,np.float32([[1,0,0],[0,1,-dyA]]),(W,H),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REFLECT)
mL[1,2]-=dyA; mR[1,2]-=dyA
L=warp(ims['0516'],mL); R=warp(ims['0507'],mR)
mRR=ecc_align(ims['0508'],ims['0507'],2700,3600); mRR[0,2]+=mR[0,2]; mRR[1,2]+=mR[1,2]
RR=warp(ims['0508'],mRR)
print('dyA',dyA,'L',mL[:,2],'R',mR[:,2],'RR',mRR[:,2])
def ramp(x,c,w): return np.clip((x-c)/w+0.5,0,1)
x=np.arange(W)[None,:].astype(float)
wL=1-ramp(x,1356,8); wR=ramp(x,2665,30); wA=1-wL-wR
wRR=ramp(x,3300,200)*wR; wR=wR-wRR
out=(L*wL[...,None]+A*wA[...,None]+R*wR[...,None]+RR*wRR[...,None])
# colour match each piece to 0571 via overlap stats
cv2.imwrite('band_comp.png',np.clip(out,0,255).astype(np.uint8))
