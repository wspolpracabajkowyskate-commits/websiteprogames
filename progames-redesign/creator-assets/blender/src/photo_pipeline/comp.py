import numpy as np, cv2
d=np.load('aligned.npy',allow_pickle=True).item()
A,B,C=[d[k].astype(np.float32) for k in 'ABC']; wa,wb,wc=d['wa'],d['wb'],d['wc']
H,W=A.shape[:2]
def valid(w,th): return (w>th*w.max()).astype(np.float32)
ma,mb,mc=valid(wa,0.2),valid(wb,0.05),valid(wc,0.05)
# colour-match B and C to A (and C to B) in overlaps
def match(src,ref,m):
    m=m>0.5
    if m.sum()<1000: return src
    out=src.copy()
    for c in range(3):
        s=src[...,c][m]; r=ref[...,c][m]
        a=r.std()/max(s.std(),1e-3); b=r.mean()-a*s.mean()
        out[...,c]=src[...,c]*a+b
    return out
B=match(B,A,ma*mb); C=match(C,B,mb*mc)
# feathered masks
def feather(m,r): 
    k=cv2.GaussianBlur(cv2.erode(m,np.ones((r,r),np.uint8)),(0,0),r/3.5); return k*m
fa=feather(ma,181)*12.0; fb=feather(mb,41)*(wb/wb.max())**0.5; fc=feather(mc,41)*(wc/wc.max())**0.5
# B vs C: prefer the more frontal (wb, wc are resolution-based already)
ws=fa+fb+fc+1e-6
out=(A*fa[...,None]+B*fb[...,None]+C*fc[...,None])/ws[...,None]
cv2.imwrite('front_comp.png',np.clip(out,0,255).astype(np.uint8))
x=cv2.resize(np.clip(out,0,255).astype(np.uint8),(400,int(400*H/W))); cv2.imwrite('front_comp_s.jpg',x)
