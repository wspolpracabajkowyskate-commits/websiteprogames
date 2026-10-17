"""
make_monster_textures.py - graphics for the Ultimate Monster 3in1 model, taken from the reference
views supplied with the brief (generated product views, not photos).

Every panel is rectified with a perspective / affine warp onto the physical size of the model face
it belongs to (monster_model.py), the body paint around the stickers is keyed out (alpha) so the
paint colour of the model shows through, lamps that are modelled as geometry are removed from the
prints, and the dark screen area is replaced by a clean dark surface (no baked reflections).

usage: python3 make_monster_textures.py <refs_dir> <out_dir>
refs:  n02 front panel close-up, n05 canopy close-up, n06 kicker close-up, n03 hammer close-up,
       n11 left side view, n12 3/4 right view, n13 front view
"""
import os, sys, json, math
import numpy as np
import cv2
from PIL import Image

REFS, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PPM = 1400                     # texture resolution, pixels per metre (zones)


def load(n):
    return cv2.cvtColor(cv2.imread(os.path.join(REFS, n + '.png'), cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)


def warp(img, quad, w, h):
    """quad = TL, TR, BR, BL in source pixels -> w x h rectangle."""
    src = np.float32(quad); dst = np.float32([[0, 0], [w - 1, 0], [w - 1, h - 1], [0, h - 1]])
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, M, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def paint_mask(rgb, extra_light=True):
    """Body paint (and its highlights / modelled lamps) reachable from the outside of the stickers."""
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    red = ((h <= 9) | (h >= 168)) & (s > 95) & (v > 55)
    light = (s < 70) & (v > 150)                       # specular streaks on the gloss paint, white lamp domes
    cand = red | (light if extra_light else False)
    n, lab = cv2.connectedComponents(cand.astype(np.uint8), connectivity=8)
    keep = np.zeros(n, bool)
    # paint = red components reaching the border of the crop (the paint surrounds every sticker);
    # red areas enclosed by a sticker outline (gloves, fists...) stay opaque
    border = np.zeros_like(cand)
    border[0, :] = border[-1, :] = True; border[:, 0] = border[:, -1] = True
    red_cnt = np.bincount(lab.ravel(), weights=red.ravel().astype(float), minlength=n)
    tb = np.bincount(lab.ravel(), weights=border.ravel().astype(float), minlength=n)
    keep[1:] = (tb[1:] > 0) & (red_cnt[1:] > 50)
    m = keep[lab] & cand
    # light blobs (lamps / streaks) adjacent to paint
    lb = light & ~m
    n2, lab2 = cv2.connectedComponents(lb.astype(np.uint8), connectivity=8)
    near = cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    touch = np.bincount(lab2.ravel(), weights=near.ravel().astype(float), minlength=n2)
    size = np.bincount(lab2.ravel(), minlength=n2)
    ok = np.zeros(n2, bool); ok[1:] = (touch[1:] > 0.12 * size[1:])
    m |= ok[lab2] & lb
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)) > 0
    return m


def rgba_from(rgb, transparent):
    a = (~transparent).astype(np.uint8) * 255
    a = cv2.erode(a, np.ones((3, 3), np.uint8))
    a = cv2.GaussianBlur(a, (3, 3), 0)
    # un-premultiply the paint fringe: pull colour of semi-transparent edge pixels from the inside
    out = np.dstack([rgb, a])
    return out


def enhance(rgb, sat=1.12, con=1.08):
    x = rgb.astype(np.float32) / 255
    lo, hi = np.percentile(x, 0.5), np.percentile(x, 99.7)
    x = np.clip((x - lo) / max(hi - lo, 1e-3), 0, 1)
    m = x.mean(2, keepdims=True)
    x = np.clip(m + (x - m) * sat, 0, 1)
    x = np.clip(0.5 + (x - 0.5) * con, 0, 1)
    return (x * 255).astype(np.uint8)


def save(name, arr):
    im = Image.fromarray(arr)
    path = os.path.join(OUT, name)
    im.save(path, quality=92, method=6)
    return path


def inpaint_circles(rgb, centers, r):
    m = np.zeros(rgb.shape[:2], np.uint8)
    for (x, y) in centers:
        cv2.circle(m, (int(x), int(y)), int(r), 255, -1)
    return cv2.inpaint(rgb, m, 7, cv2.INPAINT_TELEA)


META = {}

# ---------------------------------------------------------------- column front panel (zone 'front')
# n02: column face edges x 30..1045, frame 100..985 x 15..740, kicker slope top at y 1225.
# Model: column front x[-0.58, 0.12], panel y[0.69, 1.81]; frame x[-0.553, 0.075] y[0.99, 1.74].
n02 = load('n02')
FX0, FX1, FY0, FY1 = -0.58, 0.12, 0.69, 1.81
W, H = int((FX1 - FX0) * PPM), int((FY1 - FY0) * PPM)
canvas = np.zeros((H, W, 4), np.uint8)
# lower part (below the frame): n02 y 740..1225 -> y 0.99..0.69 (stickers, coin mech, rules)
src = n02[740:1225, 30:1045]
y0p = int((FY1 - 0.99) * PPM); y1p = int((FY1 - 0.69) * PPM)
low = cv2.resize(src, (W, y1p - y0p), interpolation=cv2.INTER_AREA)
low = enhance(low)
pm = paint_mask(low)
# coin mech area is modelled as a box: keep it, it is black anyway
canvas[y0p:y1p] = rgba_from(low, pm)
save('monster_zone_front.webp', canvas)
META['front'] = dict(x=[FX0, FX1], y=[FY0, FY1])

# coin mech front (DECALS atlas) and start kicker sticker are part of the panel print above.
# screen header / footer strips inside the frame (n02 x 150..935, y 25..100 / 620..725)
hdr = enhance(n02[25:100, 150:935]); ftr = enhance(n02[620:725, 150:935])
save('monster_screen_header.webp', hdr); save('monster_screen_footer.webp', ftr)

# smash panel (inclined plate on the kicker top): n02 trapezoid
sm = warp(n02, [[45, 1225], [1065, 1225], [1080, 1385], [5, 1385]], 1400, 210)
save('monster_smash.webp', enhance(sm))

# ---------------------------------------------------------------- canopy front band (zone 'band')
# n05: center facet graphic 280..1000 x 430..750, side facets 165..280 / 1000..1140 (foreshortened)
n05 = load('n05')
gh = 300                                   # band graphic height in px (0.216 m)
cpx = int(0.474 / 0.216 * gh)              # centre facet graphic width (0.474 m)
spx = int(0.12 / 0.216 * gh)               # side facet graphic width (0.12 m)
cen = warp(n05, [[280, 432], [1000, 432], [1000, 748], [280, 748]], cpx, gh)
lft = warp(n05, [[168, 445], [280, 432], [280, 748], [168, 760]], spx, gh)
rgt = warp(n05, [[1000, 432], [1138, 445], [1138, 760], [1000, 748]], spx, gh)
band = np.concatenate([lft, cen, rgt], 1)
band = enhance(band)
save('monster_zone_band.webp', band)
META['band'] = dict(w=0.12 + 0.474 + 0.12, h=0.216)

# ---------------------------------------------------------------- left side L graphic (zone 'left')
# n11 is close to an orthographic side view: z = (px-525)/624, y = (1450-py)/624
n11 = load('n11')
LZ0, LZ1, LY0, LY1 = -0.585, 0.337, 0.055, 2.10
W, H = int((LZ1 - LZ0) * PPM), int((LY1 - LY0) * PPM)
zz = LZ0 + (np.arange(W) + 0.5) / PPM
yy = LY1 - (np.arange(H) + 0.5) / PPM
mapx = np.tile((525 + 624 * zz).astype(np.float32), (H, 1))
mapy = np.tile((1450 - 624 * yy).astype(np.float32)[:, None], (1, W))
side = cv2.remap(n11, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
side = enhance(side, 1.08, 1.05)
# graphic region of the L: canopy band side, column side, kicker side (inside the red frames)
Z, Y = np.meshgrid(zz, yy)
reg = ((Y > 1.875) & (Y < 2.095) & (Z > -0.565) & (Z < 0.322)) | \
      ((Z > -0.565) & (Z < -0.330) & (Y > 0.075) & (Y < 2.095)) | \
      ((Z > -0.565) & (Z < -0.262) & (Y > 0.075) & (Y < 0.63))
# lamps on the side fascia / ledge are modelled -> outside the region anyway
pm = np.zeros_like(reg)   # clean, fully opaque print; the mesh outline does the trimming
save('monster_zone_left.webp', rgba_from(side, pm))
META['left'] = dict(z=[LZ0, LZ1], y=[LY0, LY1])

# ---------------------------------------------------------------- right side (zone 'right'), from n12
# plane x = 0.12; homography from 4 points of the canopy band side / column front edge
n12 = load('n12')
pts_img = np.float32([[451, 122], [817, 182], [722, 262], [450, 225]])
pts_mod = np.float32([[0.325, 2.088], [-0.568, 2.088], [-0.324, 1.872], [0.325, 1.872]])   # (z, y)
Hm, _ = cv2.findHomography(pts_mod, pts_img)
RZ0, RZ1 = -0.585, 0.337
W, H = int((RZ1 - RZ0) * PPM), int((LY1 - LY0) * PPM)
zz = RZ1 - (np.arange(W) + 0.5) / PPM                 # u runs from the front (left in view) to the back
yy = LY1 - (np.arange(H) + 0.5) / PPM
Z, Y = np.meshgrid(zz, yy)
P = np.stack([Z.ravel(), Y.ravel(), np.ones(Z.size)], 0)
q = Hm @ P; q = q[:2] / q[2]
mapx = q[0].reshape(H, W).astype(np.float32); mapy = q[1].reshape(H, W).astype(np.float32)
rs = cv2.remap(n12, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
rs = enhance(rs, 1.08, 1.05)
reg = ((Y > 1.875) & (Y < 2.095) & (Z > -0.565) & (Z < 0.322)) | ((Z > -0.525) & (Z < -0.322) & (Y > 0.60) & (Y < 2.095))
pm = np.zeros_like(reg)
save('monster_zone_right.webp', rgba_from(rs, pm))
META['right'] = dict(z=[RZ0, RZ1], y=[LY0, LY1])

# ---------------------------------------------------------------- tower front (zone 'tower'), from n13
# The tower front is a trapezoid (its right edge leans in towards the top, the left edge follows the
# slanted right side of the boxer column).  n13 edges: left 600 (y295) -> 655 (y1185), right 880 -> 940.
# Texture u runs linearly between the two edges on every row (the mesh rows do the same).
n13 = load('n13')
TX0, TX1, TY0, TY1 = 0.12, 0.70, 0.055, 1.90
W, H = int((TX1 - TX0) * PPM), int((TY1 - TY0) * PPM)
Hv = int((TY1 - 0.58) * PPM)
v = (np.arange(Hv) + 0.5) / Hv
py = 295 + v * (1185 - 295)
xl = 600 + v * (655 - 600); xr = 880 + v * (940 - 880)
u = (np.arange(W) + 0.5) / W
mapx = (xl[:, None] + u[None, :] * (xr - xl)[:, None]).astype(np.float32)
mapy = np.tile(py[:, None], (1, W)).astype(np.float32)
tw = cv2.remap(n13, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
tw = enhance(tw, 1.1, 1.06)
TW = lambda x, y: ((x - (0.12 + (1.90 - y) / 1.32 * 0.0)) / 0.58)   # placeholder (not used)
# hammer head / handle / pad of the photo in front of the tower: inpaint
occ = np.zeros(tw.shape[:2], np.uint8)
def img2tex(px_, py_):
    vv = (py_ - 295) / (1185 - 295); l = 600 + vv * 55; r = 880 + vv * 60
    return (px_ - l) / (r - l) * W, vv * Hv
pts = [img2tex(x, y) for x, y in ((755, 1040), (890, 1040), (900, 1130), (750, 1130))]
cv2.fillPoly(occ, [np.int32(pts)], 255)
pts = [img2tex(x, y) for x, y in ((735, 1185), (950, 1185), (950, 1115), (735, 1115))]
cv2.fillPoly(occ, [np.int32(pts)], 255)
for t in np.linspace(0, 1, 40):     # hammer handle running up to the right panel
    x, y = img2tex(850 + t * (800 - 850) * -1 if False else 808 + t * 40, 1050 - t * 300)
    cv2.circle(occ, (int(x), int(y)), int(0.02 * PPM), 255, -1)
tw = cv2.inpaint(tw, occ, 9, cv2.INPAINT_TELEA)
# lamps (modelled) -> inpaint: right column at x=0.638, top row at y=1.87
lamps = [img2tex(x, y) for x, y in ((850, 315), (850, 380), (857, 448), (863, 515), (868, 580), (873, 645), (877, 710), (880, 777), (885, 842), (890, 910), (893, 978), (898, 1045), (903, 1113), (660, 320), (720, 315), (785, 315), (725, 1140))]
tw = inpaint_circles(tw, lamps, 0.024 * PPM)
tower = np.zeros((H, W, 3), np.uint8)
tower[:Hv] = tw
tower[Hv:] = tw[Hv - 1:Hv]                   # hidden behind the hammer base: continue the bottom row
tower[Hv:] = cv2.GaussianBlur(np.repeat(tw[Hv - 60:Hv - 40].mean(0, keepdims=True).astype(np.uint8), H - Hv, 0), (1, 1), 0)
save('monster_zone_tower.webp', tower)
META['tower'] = dict(x=[TX0, TX1], y=[TY0, TY1])

# ---------------------------------------------------------------- kicker front face (DECALS) from n06
n06 = load('n06')
KX0, KX1, KY0, KY1 = -0.58, 0.20, 0.055, 0.645
W, H = int((KX1 - KX0) * PPM), int((KY1 - KY0) * PPM)
kf = cv2.resize(n06[150:1030, 130:1200], (W, H), interpolation=cv2.INTER_AREA)
kf = enhance(kf)
pm = paint_mask(kf)
kx = lambda px: (px - 130) / 1070 * W
ky = lambda py: (py - 150) / 880 * H
hole = np.zeros((H, W), np.uint8)
cv2.rectangle(hole, (int(kx(186)), int(ky(260))), (int(kx(950)), int(ky(950))), 255, -1)       # recess
cv2.circle(hole, (int(kx(305)), int(ky(565))), int(kx(305 + 168) - kx(305)), 255, -1)          # ball
cv2.rectangle(hole, (int(kx(860)), int(ky(490))), (int(kx(1030)), int(ky(700))), 255, -1)      # arm mount
save('monster_kicker_face.webp', rgba_from(kf, pm | (hole > 0)))
# comet sticker on the recess floor (n06 345..880 x 715..850)
fl = enhance(n06[700:860, 335:890])
save('monster_kicker_floor.webp', rgba_from(fl, paint_mask(fl)))

# ---------------------------------------------------------------- stickers (DECALS) with alpha
def sticker(img, box, name, quad=None, size=None):
    if quad is not None:
        crop = warp(img, quad, *size)
    else:
        x0, y0, x1, y1 = box
        crop = img[y0:y1, x0:x1]
    crop = enhance(crop)
    return save(name, rgba_from(crop, paint_mask(crop)))

sticker(n05, (360, 90, 950, 325), 'monster_st_vs_hammer.webp')
sticker(n05, None, 'monster_st_boxer.webp', quad=[[118, 160], [310, 160], [310, 395], [118, 395]], size=(300, 300))
sticker(n05, None, 'monster_st_kicker.webp', quad=[[995, 160], [1205, 160], [1205, 392], [995, 392]], size=(300, 300))
sticker(n05, (592, 748, 714, 868), 'monster_st_start_boxer.webp')
# hammer: START HAMMER sticker (n03, on the top surface), start button sticker, emblem panel, 3in1 + comet
n03 = load('n03')
sticker(n03, None, 'monster_st_start_hammer.webp', quad=[[0, 760], [520, 735], [590, 1075], [0, 1070]], size=(640, 400))
sticker(n03, (100, 1035, 300, 1235), 'monster_st_hammer_button.webp')
em = enhance(warp(n13, [[662, 1250], [764, 1250], [766, 1452], [662, 1452]], 260, 520))
save('monster_emblem_panel.webp', em)
sticker(n13, (782, 1228, 932, 1445), 'monster_st_hammer_front.webp')
sticker(n06, (945, 262, 1155, 435), 'monster_st_comet.webp')

# START HAMMER: drop the tower print caught in the top-left corner of the crop
_sh = np.array(Image.open(os.path.join(OUT, 'monster_st_start_hammer.webp')))
_m = np.zeros(_sh.shape[:2], np.uint8)
cv2.fillPoly(_m, [np.int32([[0, 0], [300, 0], [0, 150]])], 255)
_sh[_m > 0, 3] = 0
save('monster_st_start_hammer.webp', _sh)
save('monster_coin_mech.webp', enhance(n02[835:1045, 745:827]))

# ---------------------------------------------------------------- atlas for all DECALS (shelf packing)
ITEMS = ['kicker_face', 'smash', 'screen_header', 'screen_footer', 'st_vs_hammer', 'st_start_hammer', 'emblem_panel',
         'st_boxer', 'st_kicker', 'kicker_floor', 'st_hammer_front', 'st_comet', 'st_start_boxer', 'st_hammer_button', 'coin_mech']
imgs = {}
for k in ITEMS:
    im = Image.open(os.path.join(OUT, 'monster_' + k + '.webp')).convert('RGBA')
    imgs[k] = im
AW = 2048
order = sorted(ITEMS, key=lambda k: -imgs[k].height)
x = y = rowh = 0; rects = {}
for k in order:
    im = imgs[k]
    if im.width > AW:
        im = im.resize((AW - 4, int(im.height * (AW - 4) / im.width)), Image.LANCZOS); imgs[k] = im
    if x + im.width + 4 > AW:
        x = 0; y += rowh + 4; rowh = 0
    rects[k] = (x + 2, y + 2, im.width, im.height)
    x += im.width + 4; rowh = max(rowh, im.height)
AH = 1 << int(math.ceil(math.log2(y + rowh + 4)))
atlas = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
for k, (ax, ay, w, h) in rects.items():
    atlas.paste(imgs[k], (ax, ay))
atlas.save(os.path.join(OUT, 'monster_atlas.webp'), quality=92, method=6)
for k in ITEMS:
    os.remove(os.path.join(OUT, 'monster_' + k + '.webp'))
META['atlas'] = dict(size=[AW, AH], rects=rects)
# LED meter strip (off): black perforated panel with dim dots
mt = np.full((1536, 256, 3), 10, np.uint8)
for yy in range(10, 1536, 20):
    for xx in range(14, 256, 28):
        cv2.circle(mt, (xx, yy), 5, (34, 30, 32), -1, cv2.LINE_AA)
        cv2.circle(mt, (xx - 1, yy - 1), 2, (58, 52, 54), -1, cv2.LINE_AA)
save('monster_meter.webp', mt)
json.dump(META, open(os.path.join(OUT, 'monster_textures.json'), 'w'), indent=1)
print('ok', sorted(os.listdir(OUT)))
