import numpy as np, cv2, sys
sys.path.insert(0,'/home/claude/websiteprogames/progames-redesign/creator-assets/blender/src')
import champion_model as cm
from PIL import Image, ImageDraw
T='/home/claude/websiteprogames/progames-redesign/creator-assets/textures/champion/'
im=cv2.imread('front_comp.png'); H,W=im.shape[:2]; ppm=W/0.67
miss=(im.sum(2)<15).astype(np.uint8)*255; miss=cv2.dilate(miss,np.ones((5,5),np.uint8))
im=cv2.inpaint(im,miss,9,cv2.INPAINT_TELEA)
cv2.imwrite('front_final_c.png',im)
H,W=im.shape[:2]; G=cm.FRONT_GFX
def crop(r):
    xa,ya,xb,yb=r
    px=lambda x:(x-G['x0'])/(G['x1']-G['x0'])*W; py=lambda y:(G['y1']-y)/(G['y1']-G['y0'])*H
    return im[int(py(yb)):int(py(ya)), int(px(xa)):int(px(xb))]
Image.fromarray(cv2.cvtColor(im,cv2.COLOR_BGR2RGB)).convert('RGBA').save(T+'champion_zone_front.webp','WEBP',quality=90,method=6)
atlas=Image.new('RGBA',(2048,2048),(0,0,0,0))
for name,r in (('coin',cm.COIN),('rules',cm.RULES)):
    c=cv2.cvtColor(crop(r),cv2.COLOR_BGR2RGB); a0,b0,a1,b1=cm.ATLAS[name]
    atlas.paste(Image.fromarray(c).resize((a1-a0,b1-b0),Image.LANCZOS),(a0,b0))
ph=cv2.imread('/home/claude/work/champ/photos3/IMG_0571.jpg'); s=ph.shape[1]/825
cx,cy,rr=429.4*s,242.2*s,19.5*s
b=cv2.cvtColor(ph[int(cy-rr):int(cy+rr),int(cx-rr):int(cx+rr)],cv2.COLOR_BGR2RGB)
lock=Image.fromarray(b).resize((256,256),Image.LANCZOS); m=Image.new('L',(256,256),0); ImageDraw.Draw(m).ellipse([2,2,254,254],fill=255); lock.putalpha(m)
a0,b0,a1,b1=cm.ATLAS['lock']; atlas.paste(lock,(a0,b0))
atlas.save(T+'champion_atlas.webp','WEBP',quality=92)
atlas.crop((0,0,1000,620)).save('atlas_preview.png')
print(im.shape)
