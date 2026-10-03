from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
REF=Path(__file__).resolve().parent/'reference'
OUT=ROOT/'assets'; OUT.mkdir(exist_ok=True)

def crop(name, src, box, size=None, mask=None, chroma=False, quality=90):
    im=Image.open(REF/src).convert('RGBA').crop(box)
    if chroma:
        a=np.asarray(im).copy()
        r=a[...,0].astype(np.int16); g=a[...,1].astype(np.int16); b=a[...,2].astype(np.int16)
        # Key saturated PRO GAMES cabinet blue while preserving darker blues in artwork.
        blue=(b>145)&(g>75)&(r<95)&((b-r)>75)&((g-r)>35)
        # soften alpha at mask edges
        alpha=np.where(blue,0,255).astype(np.uint8)
        alpha=Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0))
        im.putalpha(alpha)
    if mask:
        m=Image.new('L', im.size,0); d=ImageDraw.Draw(m)
        kind,args=mask
        if kind=='ellipse': d.ellipse(args,fill=255)
        elif kind=='rounded': d.rounded_rectangle(args[:-1],radius=args[-1],fill=255)
        elif kind=='polygon': d.polygon(args,fill=255)
        m=m.filter(ImageFilter.GaussianBlur(1.2))
        old=im.getchannel('A'); im.putalpha(Image.fromarray(np.minimum(np.array(old),np.array(m)).astype(np.uint8)))
    if size:
        im.thumbnail(size, Image.Resampling.LANCZOS)
    im.save(OUT/name,'WEBP',quality=quality,method=6)
    return im

# Accurate imagery lifted from the user's real machine references.
# Front top banner (frontal reference)
crop('top-banner.webp','01-front.png',(345,95,765,205),(900,300),chroma=True)
# Main score/control artwork (high-resolution close detail)
im=Image.open(REF/'08-score-detail.png').convert('RGBA').crop((178,92,845,1102))
# elliptical shield mask, generous enough to include the football / glove medallions
m=Image.new('L', im.size,0); d=ImageDraw.Draw(m); d.ellipse((18,0,im.width-18,im.height-6),fill=255)
m=m.filter(ImageFilter.GaussianBlur(1.2)); im.putalpha(m); im.thumbnail((700,1050),Image.Resampling.LANCZOS); im.save(OUT/'score-panel.webp','WEBP',quality=92,method=6)
# Side boxer-vs-kicker poster from left side
crop('versus-poster.webp','02-left-side.png',(350,325,455,855),(260,900),chroma=False)
# Kicker lightning side logo
crop('kicker-logo.webp','02-left-side.png',(278,950,520,1275),(520,650),chroma=True)
# Top side boxer logo
crop('boxer-logo.webp','02-left-side.png',(340,140,575,285),(520,330),chroma=True)
# Game rules plate + Kicker Smart logo
crop('game-rules.webp','08-score-detail.png',(398,1110,604,1332),(420,450),chroma=True)
crop('kicker-smart.webp','08-score-detail.png',(662,1140,852,1378),(420,500),chroma=True)
# Rear Double Strike logo
crop('rear-logo.webp','04-rear.png',(380,285,758,490),(760,420),chroma=True)
# Diamond plate / illuminated foot platform from close lower detail
crop('floor-plate.webp','09-lower-detail.png',(0,860,1000,1320),(1024,520),chroma=False,quality=88)
print('reference textures generated')
