"""
make_champion_textures.py - textures for the Boxer Champion model.
Factory graphics are extracted from the reference photos (the punch bag that hides the top of
the front graphic in the frontal photo is replaced with the matching area of the 3/4 photo,
re-projected with a homography).  Production print files should replace them later.
usage: python3 make_champion_textures.py <ref_dir> <out_dir>
  ref_dir must contain c_front, c_left, c_right, c_q34 (.png or .webp)
"""
import sys, os, math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from champion_model import FRONT_CROP, DRUM_PLAN, D, ATLAS, ATLAS_SIZE, SCREEN_ATLAS, SCREEN_TEXT

REF, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)


def ref(name):
    for ext in ('png', 'webp', 'jpg'):
        p = os.path.join(REF, f'{name}.{ext}')
        if os.path.exists(p):
            return Image.open(p).convert('RGB')
    raise FileNotFoundError(name)


def save(img, name, q=92):
    img.save(os.path.join(OUT, name), 'WEBP', quality=q, method=6)


def up(img, w, h):
    return img.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))


def ref2(n):
    try:
        return ref(n)
    except FileNotFoundError:
        return ref('champion_' + n[2:])


front = ref2('c_front'); left = ref2('c_left'); right = ref2('c_right'); q34 = ref2('c_q34')

# ------------------------------------------------------------ FRONT panel (bag removed)
F = np.asarray(front).astype(np.uint8).copy()
Q = np.asarray(q34).astype(np.uint8)
src = np.float32([[137.5, 231], [201, 236], [135, 307.5], [200, 307.5], [135, 344], [200, 344]])
dst = np.float32([[430, 383], [597, 383], [430, 515], [595, 515], [430, 582], [595, 582]])
Hm, _ = cv2.findHomography(src, dst, 0)
warped = cv2.warpPerspective(Q, Hm, (F.shape[1], F.shape[0]), flags=cv2.INTER_CUBIC)
mask = np.zeros(F.shape[:2], np.uint8)
cv2.ellipse(mask, (513, 438), (82, 84), 0, 0, 360, 255, -1)
cv2.rectangle(mask, (462, 300), (562, 372), 255, -1)
mask = cv2.GaussianBlur(mask, (21, 21), 7).astype(np.float32)[..., None] / 255.0
F = (F * (1 - mask) + warped * mask).astype(np.uint8)
x0, y0, x1, y1 = FRONT_CROP
crop = Image.fromarray(F[y0:y1, x0:x1])
H = int(round(1024 * (y1 - y0) / (x1 - x0)))
save(up(crop, 1024, H).convert('RGBA'), 'champion_zone_front.webp')

# ------------------------------------------------------------ SIDES (column)
save(up(left.crop((199, 255, 335, 1470)), 300, 2680).convert('RGBA'), 'champion_zone_left.webp')
save(up(right.crop((660, 260, 795, 1445)), 300, 2680).convert('RGBA'), 'champion_zone_right.webp')

# ------------------------------------------------------------ BAND (drum wrap: left side | front | right side)
r = D['drum_r']; hx = D['drum_x']; zc = D['drum_z1'] - r
L_side = zc - (D['col_z0'] + 0.03)
front_arc = 2 * (math.pi / 2 * r) + 2 * (hx - r)
total = 2 * L_side + front_arc
BH = 300
W = int(round(BH * total / (BAND_H := 0.156)))
band = np.zeros((BH, W, 3), np.float32)
Lp = np.asarray(left).astype(np.float32); Rp = np.asarray(right).astype(np.float32); Fp = np.asarray(front).astype(np.float32)


def sample(img, xs, ys):
    xs = np.clip(xs, 0, img.shape[1] - 1.001); ys = np.clip(ys, 0, img.shape[0] - 1.001)
    xi = np.floor(xs).astype(int); yi = np.floor(ys).astype(int); fx = xs - xi; fy = ys - yi
    a = img[yi, xi]; b = img[yi, xi + 1]; c = img[yi + 1, xi]; d = img[yi + 1, xi + 1]
    return (a * (1 - fx)[..., None] + b * fx[..., None]) * (1 - fy)[..., None] + (c * (1 - fx)[..., None] + d * fx[..., None]) * fy[..., None]


v = (np.arange(BH) + 0.5) / BH  # 0 top
for i in range(W):
    s = (i + 0.5) / W * total
    if s < L_side:  # left side, back -> front
        px = 203 + s / L_side * (628 - 203)  # stop before the 'CHAMPION' lettering that wraps the corner
        ys = 141 + v * (245 - 141)
        band[:, i] = sample(Lp, np.full(BH, px), ys)
    elif s > total - L_side:  # right side, front -> back
        z = zc - (s - (total - L_side))
        px = 808 - (z + 0.14) * 658
        ys = 146 + v * (249 - 146)
        band[:, i] = sample(Rp, np.full(BH, px), ys)
    else:  # front: unwrap corners
        t = s - L_side
        ca = math.pi / 2 * r
        if t < ca:
            phi = t / r; x = -(hx - r) - r * math.cos(phi)
        elif t < ca + 2 * (hx - r):
            x = -(hx - r) + (t - ca)
        else:
            phi = (front_arc - t) / r; x = (hx - r) + r * math.cos(phi)
        px = 512 + x * 663
        ys = 112 + v * (208 - 112)
        band[:, i] = sample(Fp, np.full(BH, px), ys)
# soften the seams between the three photos
for s_seam in (L_side, total - L_side):
    c = int(s_seam / total * W)
    seg = band[:, max(c - 12, 0):c + 12].copy()
    band[:, max(c - 12, 0):c + 12] = cv2.GaussianBlur(seg, (9, 1), 3)
save(Image.fromarray(np.clip(band, 0, 255).astype(np.uint8)).convert('RGBA'), 'champion_zone_band.webp')

# ------------------------------------------------------------ atlas
atlas = Image.new('RGBA', (ATLAS_SIZE, ATLAS_SIZE), (0, 0, 0, 0))
def put(name, img):
    a0, b0, a1, b1 = ATLAS[name]
    atlas.alpha_composite(img.convert('RGBA').resize((a1 - a0, b1 - b0), Image.LANCZOS), (a0, b0))
put('coin', up(front.crop((336, 756, 376, 848)), 256, 600))
put('rules', up(front.crop((637, 771, 703, 853)), 400, 520))
put('bill', up(front.crop((564, 900, 637, 926)), 500, 180))
lock = up(front.crop((497, 210, 528, 241)), 256, 256)
m = Image.new('L', (256, 256), 0); ImageDraw.Draw(m).ellipse([4, 4, 252, 252], fill=255); lock.putalpha(m)
put('lock', lock)
atlas.save(os.path.join(OUT, 'champion_atlas.webp'), 'WEBP', quality=92)

# ------------------------------------------------------------ screen digits
SEG = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'}
def draw_digit(d, x, y, w, h, ch, on, off):
    t = w * 0.16; sk = w * 0.12
    P = lambda px, py: (x + px + sk * (1 - py / h), y + py)
    segs = {'a': [(t, 0), (w - t, 0)], 'g': [(t, h / 2), (w - t, h / 2)], 'd': [(t, h), (w - t, h)],
            'f': [(0, t), (0, h / 2 - t / 2)], 'b': [(w, t), (w, h / 2 - t / 2)], 'e': [(0, h / 2 + t / 2), (0, h - t)],
            'c': [(w, h / 2 + t / 2), (w, h - t)]}
    for s, ((ax, ay), (bx, by)) in segs.items():
        col = on if s in SEG.get(ch, '') else off
        if ay == by:
            poly = [P(ax, ay), P(ax + t / 2, ay - t / 2), P(bx - t / 2, by - t / 2), P(bx, by), P(bx - t / 2, by + t / 2), P(ax + t / 2, ay + t / 2)]
        else:
            poly = [P(ax, ay), P(ax + t / 2, ay + t / 2), P(bx + t / 2, by - t / 2), P(bx, by), P(bx - t / 2, by - t / 2), P(ax - t / 2, ay + t / 2)]
        d.polygon(poly, fill=col)
scr = Image.new('RGB', (1024, 1024), (8, 2, 2)); glow = Image.new('RGB', (1024, 1024), (0, 0, 0))
for key, (a0, b0, a1, b1) in SCREEN_ATLAS.items():
    txt = SCREEN_TEXT[key]; w = a1 - a0; h = b1 - b0; n = len(txt)
    dw = w / n * 0.62; dh = h * 0.74
    for layer, on, off in ((scr, (255, 40, 30), (34, 6, 5)), (glow, (255, 30, 20), (0, 0, 0))):
        dd = ImageDraw.Draw(layer)
        for i, ch in enumerate(txt):
            draw_digit(dd, a0 + w * (i + 0.5) / n - dw / 2, b0 + (h - dh) / 2, dw, dh, ch, on, off)
glow = glow.filter(ImageFilter.GaussianBlur(10))
scr = Image.fromarray(np.clip(np.asarray(scr).astype(int) + np.asarray(glow).astype(int) * 0.6, 0, 255).astype(np.uint8))
save(scr, 'champion_screen_digits.webp')
for fn in sorted(os.listdir(OUT)):
    print(f'{fn:36s} {os.path.getsize(os.path.join(OUT, fn)) / 1024:8.1f} KB')
