"""
make_textures.py - builds every texture used by the Double Strike model.
 * factory graphics are extracted from the reference photographs (perspective-corrected
   crops, blue cabinet paint keyed out to alpha) -> production artwork should replace them.
 * procedural PBR maps (diamond plate, leather, ball, LED strip, screen digits).
usage: python3 make_textures.py <ref_dir> <out_dir>
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
sys.path.insert(0, os.path.dirname(__file__))
from double_strike_model import (SCORE_CROP_PX, ATLAS, ATLAS_SIZE, SCREEN_ATLAS, SCREEN_TEXT, shield_mask, SHIELD_PX)

REF, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def ref(i):
    for ext in ('png', 'webp', 'jpg'):
        f = os.path.join(REF, f'ref{i}.{ext}')
        if os.path.exists(f):
            return Image.open(f).convert('RGB')
    raise FileNotFoundError(f'ref{i}')


def save(img, name, q=90):
    p = os.path.join(OUT, name)
    if name.endswith('.webp'):
        img.save(p, 'WEBP', quality=q, method=6)
    else:
        img.save(p, optimize=True)
    return p


def key_blue(img, soft=40.0, strength=1.0, protect=None):
    """Alpha-key the blue cabinet paint (keeps white/black/red/gold artwork)."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # blueness: blue clearly above red and green; light-blue highlights included
    blueness = np.minimum(b - r - 60, (b - g) * 1.4 + 10)
    alpha = np.clip(1 - blueness / soft, 0, 1)
    if protect is not None:
        alpha = np.maximum(alpha, protect)
    # despill blue on semi transparent edges
    rgb = a.copy()
    spill = np.clip(b - np.maximum(r, g), 0, None) * (1 - alpha) * 0.9
    rgb[..., 2] -= spill
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def erase_circles(img, circles):
    d = ImageDraw.Draw(img)
    for (x, y, r) in circles:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(0, 0, 0, 0))
    return img


def upscale(img, w, h):
    """Photo crop -> print-like texture: Lanczos x4, edge-preserving denoise of JPEG/photo noise,
    gentle local contrast (CLAHE on L) and a thresholded unsharp mask for crisp lettering."""
    import cv2
    a = np.asarray(img.convert('RGB'))
    a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LANCZOS4)
    a = cv2.bilateralFilter(a, 7, 28, 5)
    lab = cv2.cvtColor(a, cv2.COLOR_RGB2LAB)
    lab[..., 0] = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8)).apply(lab[..., 0])
    a = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.08, 0, 255)  # printed vinyl is a touch more saturated than the photo
    a = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    out = Image.fromarray(a)
    return out.filter(ImageFilter.UnsharpMask(radius=2.2, percent=85, threshold=3))


# ------------------------------------------------------------------ SCORE panel
r1 = ref(1)
x0, y0, x1, y1 = SCORE_CROP_PX
score = r1.crop((x0, y0, x1, y1))
score = upscale(score, 1320, int(1320 * (y1 - y0) / (x1 - x0)))
# fill the area outside the shield with the panel colour to avoid seams
m, W, H = shield_mask(grow_px=4)
mk = Image.fromarray((m * 255).astype(np.uint8)).crop((int(W / 2 - SHIELD_PX['cx'] + x0), y0, int(W / 2 - SHIELD_PX['cx'] + x1), y1)).resize(score.size)
score_rgba = score.convert('RGBA'); score_rgba.putalpha(mk.filter(ImageFilter.GaussianBlur(1.5)))
save(score_rgba, 'zone_score.webp', 92)

# ------------------------------------------------------------------ side panels (BOXER VS KICKER)
r3 = ref(3)
side = r3.crop((357, 330, 461, 863))
side = upscale(side, 400, 2000)
save(side.convert('RGBA'), 'zone_side.webp', 92)

# ------------------------------------------------------------------ KICKER lightning (lower body sides)
kick = r3.crop((294, 928, 513, 1300))
kick = upscale(kick, 900, 1530)
kick = key_blue(kick)
save(kick, 'zone_kicker.webp', 92)

# ------------------------------------------------------------------ TOP SIDE (BOXER lightning on canopy flanks)
tops = r3.crop((345, 140, 575, 280))
tops = upscale(tops, 1380, 840)
tops = key_blue(tops)
tops = erase_circles(tops, [(1162, 774, 50)])
save(tops, 'zone_top_side.webp', 92)

# ------------------------------------------------------------------ BACK logo
r6 = ref(6)
back = r6.crop((398, 300, 728, 520))
back = upscale(back, 1320, 880)
back = key_blue(back)
save(back, 'zone_back.webp', 92)

# ------------------------------------------------------------------ TOP FRONT banner (drum front, curved)
r9 = ref(9)
ban = np.asarray(r9.crop((355, 95, 765, 215))).astype(np.float32)
Hb, Wb = ban.shape[:2]
# un-project the cylinder: sample columns uniformly in arc length
R = 0.44 * 605.0  # drum radius in px of ref9
cx = Wb / 2
half = Wb / 2
th_max = math.asin(min(half / R, 0.999))
out_w = 1400
xs = cx + R * np.sin(np.linspace(-th_max, th_max, out_w))
xi = np.clip(xs, 0, Wb - 1.001)
i0 = np.floor(xi).astype(int); f = xi - i0
banu = ban[:, i0] * (1 - f)[None, :, None] + ban[:, i0 + 1] * f[None, :, None]
ban_img = Image.fromarray(np.clip(banu, 0, 255).astype(np.uint8)).resize((out_w, 400), Image.LANCZOS)
ban_img = key_blue(ban_img)
# remove stickers caught at the bottom corners
d = ImageDraw.Draw(ban_img)
d.rectangle([0, 330, 230, 400], fill=(0, 0, 0, 0)); d.rectangle([out_w - 260, 330, out_w, 400], fill=(0, 0, 0, 0))
save(ban_img, 'zone_top_front.webp', 92)

# ------------------------------------------------------------------ ball icon (used by stickers + lower front)
def ball_icon(size=384):
    src = r1.crop((452, 70, 570, 188)).resize((size, size), Image.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse([size * 0.06, size * 0.06, size * 0.94, size * 0.94], fill=255)
    src = src.convert('RGBA'); src.putalpha(mask.filter(ImageFilter.GaussianBlur(1)))
    return src
ball = ball_icon()

# ------------------------------------------------------------------ LOWER FRONT (ball stickers around the kicker)
LW, LH = 1400, 1036  # 1.00 x 0.74 m
lf = Image.new('RGBA', (LW, LH), (0, 0, 0, 0))
def ref9_to_zone(px, py):
    x = (px - 561) / 604.0
    y = 0.055 + (1275 - py) / 346.0 * 0.68
    u = (x + 0.5) / 1.0; v = (0.80 - y) / 0.74
    return u * LW, v * LH
for (px, py, dpx) in [(272, 1035, 36), (266, 1110, 42), (276, 1205, 50), (843, 1040, 32), (855, 1120, 36), (847, 1220, 50),
                      (495, 1212, 26), (532, 1230, 36), (625, 1222, 50)]:
    u, v = ref9_to_zone(px, py)
    s = int(dpx / 604.0 * LW)
    lf.alpha_composite(ball.resize((s, s), Image.LANCZOS), (int(u - s / 2), int(v - s / 2)))
save(lf, 'zone_lower_front.webp', 92)

# ------------------------------------------------------------------ sticker atlas
atlas = Image.new('RGBA', (ATLAS_SIZE, ATLAS_SIZE), (0, 0, 0, 0))
def put(name, img):
    ax0, ay0, ax1, ay1 = ATLAS[name]
    atlas.alpha_composite(img.convert('RGBA').resize((ax1 - ax0, ay1 - ay0), Image.LANCZOS), (ax0, ay0))
put('rules', upscale(r1.crop((408, 1137, 598, 1353)), 512, 580))
put('kicker_smart', key_blue(upscale(r1.crop((672, 1168, 860, 1386)), 512, 584)))
put('coin', upscale(r1.crop((211, 1136, 282, 1340)), 240, 700))
put('ball', ball)
g = key_blue(upscale(r1.crop((738, 222, 862, 318)) if False else ref(7).crop((628, 452, 708, 532)), 384, 384))
put('glove', g)
put('glove_l', ImageOps.mirror(g))
badge = ref(5).crop((838, 375, 1062, 485)).rotate(-17, Image.BICUBIC, expand=False, fillcolor=(10, 112, 220))
badge = key_blue(upscale(badge.crop((14, 22, 212, 92)), 768, 256))
put('badge', badge)
# warning label
wl = Image.new('RGBA', (256, 160), (250, 250, 250, 255)); d = ImageDraw.Draw(wl)
d.rectangle([0, 0, 255, 159], outline=(20, 20, 20, 255), width=6)
d.polygon([(22, 120), (62, 40), (102, 120)], fill=(250, 205, 20, 255), outline=(10, 10, 10, 255))
d.text((56, 78), '!', fill=(0, 0, 0, 255))
d.text((118, 55), 'AC 230V', fill=(0, 0, 0, 255)); d.text((118, 85), '50/60Hz', fill=(0, 0, 0, 255))
put('warning', wl)
# fan grill
fan = Image.new('RGBA', (384, 384), (18, 18, 20, 255)); d = ImageDraw.Draw(fan)
for rr in range(30, 190, 22):
    d.ellipse([192 - rr, 192 - rr, 192 + rr, 192 + rr], outline=(70, 70, 75, 255), width=5)
d.line([0, 192, 384, 192], fill=(70, 70, 75, 255), width=6); d.line([192, 0, 192, 384], fill=(70, 70, 75, 255), width=6)
put('fan', fan)
sock = Image.new('RGBA', (256, 192), (25, 25, 28, 255)); d = ImageDraw.Draw(sock)
d.rounded_rectangle([40, 30, 216, 162], 18, fill=(8, 8, 8, 255), outline=(60, 60, 60, 255), width=4)
for xx in (88, 128, 168):
    d.rectangle([xx - 7, 80, xx + 7, 112], fill=(150, 150, 150, 255))
put('socket', sock)
save(atlas, 'decals_atlas.webp', 92)

# ------------------------------------------------------------------ screen digits (7-segment)
SEG = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'}
def draw_digit(d, x, y, w, h, ch, on, off):
    t = w * 0.16; sk = w * 0.12
    def P(px, py):
        return (x + px + sk * (1 - py / h), y + py)
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
scr = Image.new('RGB', (1024, 1024), (8, 2, 2))
glow = Image.new('RGB', (1024, 1024), (0, 0, 0))
for key, (ax0, ay0, ax1, ay1) in SCREEN_ATLAS.items():
    txt = SCREEN_TEXT[key]
    w = ax1 - ax0; h = ay1 - ay0
    n = len(txt)
    dw = w / n * 0.62; dh = h * 0.74
    for layer, on, off in ((scr, (255, 40, 30), (34, 6, 5)), (glow, (255, 30, 20), (0, 0, 0))):
        d = ImageDraw.Draw(layer)
        for i, ch in enumerate(txt):
            cx = ax0 + w * (i + 0.5) / n
            draw_digit(d, cx - dw / 2, ay0 + (h - dh) / 2, dw, dh, ch, on, off)
glow = glow.filter(ImageFilter.GaussianBlur(10))
scr = Image.fromarray(np.clip(np.asarray(scr).astype(int) + np.asarray(glow).astype(int) * 0.6, 0, 255).astype(np.uint8))
save(scr, 'screen_digits.webp', 92)

# ------------------------------------------------------------------ LED strip (RGB, u along the bar)
SW, SH = 1024, 64
u = np.linspace(0, 1, SW, endpoint=False)
hue = (u * 2.0) % 1.0
import colorsys
rgb = np.array([colorsys.hsv_to_rgb(h, 0.75, 1.0) for h in hue])
dots = 0.55 + 0.45 * np.cos(u * 2 * math.pi * 48) ** 8
img = (rgb * dots[:, None])[None, :, :].repeat(SH, 0)
vv = np.linspace(-1, 1, SH)[:, None, None]
img = img * (0.75 + 0.25 * (1 - vv ** 2))
save(Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)), 'led_strip_rgb.webp', 92)

# ------------------------------------------------------------------ diamond plate v2 (tiling, 14 x 14 bosses per tile)
import cv2 as _cv2
N = 2048; cells = 14
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32) / N * cells
height = np.zeros((N, N), np.float32)
for oy in (-1, 0, 1):
    for ox in (-1, 0, 1):
        cxg = np.floor(xx) + 0.5 + ox; cyg = np.floor(yy) + 0.5 + oy
        dx = xx - cxg; dy = yy - cyg
        par = ((np.floor(xx) + ox + np.floor(yy) + oy) % 2)
        ang = np.where(par == 0, math.radians(45), math.radians(-45))
        lx = dx * np.cos(ang) + dy * np.sin(ang); ly = -dx * np.sin(ang) + dy * np.cos(ang)
        dd = (lx / 0.40) ** 2 + (ly / 0.075) ** 2
        height = np.maximum(height, np.clip(1 - dd, 0, 1) ** 0.35)
height = _cv2.GaussianBlur(height, (0, 0), 1.6)
brushed = _cv2.GaussianBlur(rng.random((N, N)).astype(np.float32), (0, 0), sigmaX=24, sigmaY=0.6)
brushed = (brushed - brushed.mean()) / (brushed.std() + 1e-6)
gy, gx = np.gradient(height * 1.0 + brushed * 0.004)
nx, ny, nz = -gx * 14.0, gy * 14.0, np.ones_like(gx)
ln = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
save(Image.fromarray(((np.dstack([nx / ln, ny / ln, nz / ln]) * 0.5 + 0.5) * 255).astype(np.uint8)), 'diamond_plate_normal.png')
wear = np.clip(_cv2.GaussianBlur(rng.random((N // 16, N // 16)).astype(np.float32), (0, 0), 2), 0, 1)
wear = _cv2.resize(wear, (N, N), interpolation=_cv2.INTER_CUBIC)
rough = np.clip(0.34 - height * 0.16 + (wear - 0.5) * 0.18 + brushed * 0.02, 0.06, 1)  # boss tops polished by shoes
ao = np.clip(1 - np.clip(_cv2.GaussianBlur(height, (0, 0), 10) - height, 0, 1) * 1.4, 0, 1)
save(Image.fromarray((np.dstack([ao, rough, np.ones_like(rough)]) * 255).astype(np.uint8)), 'diamond_plate_orm.png')

# glow of the RGB LEDs under the perforated plate (emissive, tiles with the plate UVs)
glow = np.zeros((256, 256, 3), np.float32)
yy2, xx2 = np.mgrid[0:256, 0:256].astype(np.float32)
for (gx_, gy_, col_) in [(64, 64, (1.0, 0.25, 0.7)), (192, 64, (0.3, 1.0, 0.5)), (64, 192, (0.3, 0.6, 1.0)), (192, 192, (1.0, 0.8, 0.3))]:
    for ox in (-256, 0, 256):
        for oy in (-256, 0, 256):
            d2 = ((xx2 - gx_ - ox) ** 2 + (yy2 - gy_ - oy) ** 2) / (34.0 ** 2)
            glow += np.exp(-d2)[..., None] * np.array(col_) * 0.55
save(Image.fromarray((np.clip(glow, 0, 1) * 255).astype(np.uint8)), 'diamond_plate_glow.webp', 90)

# ------------------------------------------------------------------ leather grain normal (tiling)
N2 = 512
base = rng.random((N2, N2)).astype(np.float32)
h = np.zeros((N2, N2), np.float32)
for sc, w in ((4, 0.55), (8, 0.3), (32, 0.15)):
    small = rng.random((N2 // sc, N2 // sc)).astype(np.float32)
    big = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((N2, N2), Image.BICUBIC)).astype(np.float32) / 255
    h += big * w
cells_h = np.abs(np.sin(np.mgrid[0:N2, 0:N2][0] * 0.31 + h * 9) * np.sin(np.mgrid[0:N2, 0:N2][1] * 0.29 + h * 7))
h = h * 0.7 + cells_h * 0.3
gy, gx = np.gradient(h)
nx, ny, nz = -gx * 6, gy * 6, np.ones_like(gx)
ln = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
save(Image.fromarray(((np.dstack([nx / ln, ny / ln, nz / ln]) * 0.5 + 0.5) * 255).astype(np.uint8)), 'leather_normal.png')

# ------------------------------------------------------------------ kicker ball (12 pentagon panels, equirect 2048x1024)
BW, BH = 2048, 1024
phi = (np.arange(BH) + 0.5) / BH * math.pi
th = (np.arange(BW) + 0.5) / BW * 2 * math.pi
PH, TH = np.meshgrid(phi, th, indexing='ij')
dirs = np.stack([np.sin(PH) * np.sin(TH), np.cos(PH), np.sin(PH) * np.cos(TH)], -1)
gr = (1 + 5 ** 0.5) / 2
ico = np.array([[-1, gr, 0], [1, gr, 0], [-1, -gr, 0], [1, -gr, 0], [0, -1, gr], [0, 1, gr], [0, -1, -gr], [0, 1, -gr],
                [gr, 0, -1], [gr, 0, 1], [-gr, 0, -1], [-gr, 0, 1]], float)
ico /= np.linalg.norm(ico, axis=1, keepdims=True)
# rotate so a panel centre faces +Z (towards the player)
def rot_to(a, b):
    v = np.cross(a, b); c = np.dot(a, b)
    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + vx + vx @ vx * (1 / (1 + c))
Rm = rot_to(ico[5], np.array([0, 0, 1.0]))
ico = ico @ Rm.T
dots_ = dirs @ ico.T
order = np.argsort(-dots_, axis=-1)
best = order[..., 0]; second = order[..., 1]
d1 = np.take_along_axis(dots_, best[..., None], -1)[..., 0]
d2 = np.take_along_axis(dots_, second[..., None], -1)[..., 0]
edge = (d1 - d2)
# colour: panels whose centre is in the upper/front hemisphere alternate (white front panel)
white_set = set()
for i, c in enumerate(ico):
    if c[2] > 0.85 or (abs(c[2]) < 0.6 and (i % 2 == 0)) or c[2] < -0.85:
        white_set.add(i)
is_white = np.isin(best, list(white_set))
col = np.where(is_white[..., None], np.array([236, 234, 228.0]), np.array([20, 20, 22.0]))
# leather: pebble grain (equirect noise), panels pillow towards the seams, double stitching, light scuffs
import cv2 as _cv
def _wrapnoise(h, w, cell, seed):
    r = np.random.default_rng(seed)
    sm = r.random((h // cell + 3, w // cell + 3)).astype(np.float32)
    sm[:, -3:] = sm[:, :3]
    return _cv.resize(sm, ((w // cell + 3) * cell, (h // cell + 3) * cell), interpolation=_cv.INTER_CUBIC)[:h, :w]
pebble = _wrapnoise(BH, BW, 3, 41) * 0.6 + _wrapnoise(BH, BW, 7, 42) * 0.4
seam = np.clip(edge / 0.022, 0, 1)
pillow = np.sin(np.clip(edge / 0.09, 0, 1) * math.pi / 2)
k = np.array([0.37, 0.81, 0.45]); k /= np.linalg.norm(k)
stitch_band = np.exp(-((edge - 0.032) / 0.006) ** 2)
stitch = stitch_band * (np.sin((dirs @ k) * 700 + (dirs @ np.array([0.8, -0.2, 0.55])) * 300) > 0.35)
scuff = np.clip(_wrapnoise(BH, BW, 40, 43) - 0.62, 0, 1) * 2.2 * (dirs[..., 2] > 0.2)
shade = (0.30 + 0.70 * seam)[..., None] * (0.93 + 0.07 * pillow[..., None])
col = col * shade + (pebble[..., None] - 0.5) * np.where(is_white[..., None], 10.0, 6.0)
col = np.where(is_white[..., None], col - scuff[..., None] * np.array([38, 40, 46.0]), col)
col = col * (1 - 0.55 * stitch[..., None]) + stitch[..., None] * np.where(is_white[..., None], 40.0, 70.0)
col = np.clip(col, 0, 255)
save(Image.fromarray(col.astype(np.uint8)), 'kicker_ball_basecolor.webp', 92)
hgt = pillow * 1.0 + pebble * 0.08 - stitch * 0.25
gy, gx = np.gradient(hgt)
nx, ny, nz = -gx * 9, gy * 9, np.ones_like(gx)
ln = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
save(Image.fromarray(((np.dstack([nx / ln, ny / ln, nz / ln]) * 0.5 + 0.5) * 255).astype(np.uint8)), 'kicker_ball_normal.png')
rough = np.clip(np.where(is_white, 0.42, 0.36) + (1 - seam) * 0.3 + scuff * 0.2 + (pebble - 0.5) * 0.1, 0.05, 1)
save(Image.fromarray((np.dstack([np.ones_like(rough), rough, np.zeros_like(rough)]) * 255).astype(np.uint8)), 'kicker_ball_orm.png')

# ------------------------------------------------------------------ realism maps (v2)
import cv2


def height_to_normal(h, strength, name):
    gy, gx = np.gradient(h.astype(np.float32))
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(gx)
    ln = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    save(Image.fromarray(((np.dstack([nx / ln, ny / ln, nz / ln]) * 0.5 + 0.5) * 255).astype(np.uint8)), name)


def tile_noise(n, scale, seed):
    r = np.random.default_rng(seed)
    small = r.random((max(n // scale, 2), max(n // scale, 2))).astype(np.float32)
    small = np.pad(small, 2, mode='wrap')
    big = cv2.resize(small, ((small.shape[1]) * scale, (small.shape[0]) * scale), interpolation=cv2.INTER_CUBIC)
    o = 2 * scale
    return big[o:o + n, o:o + n]


# car-paint "orange peel": very soft, low-frequency waviness of the clear coat (tiles every 0.2 m)
N = 1024
peel = tile_noise(N, 32, 11) * 0.7 + tile_noise(N, 16, 12) * 0.3
height_to_normal(cv2.GaussianBlur(peel, (0, 0), 3), 3.0, 'paint_finish_normal.png')
# textured ABS / powder-coat grain for black plastic parts
grain = tile_noise(N, 2, 21) * 0.6 + tile_noise(N, 4, 22) * 0.4
height_to_normal(cv2.GaussianBlur(grain, (0, 0), 0.8), 1.6, 'plastic_grain_normal.png')

# punch-bag leather: pebbled grain + double stitch lines along both gore edges (UV u = across the gore)
BW, BH = 512, 1024
g = tile_noise(1024, 3, 31)[:BH, :BW] * 0.55 + tile_noise(1024, 9, 32)[:BH, :BW] * 0.45
uu = (np.arange(BW) + 0.5) / BW
edge = np.minimum(uu, 1 - uu)  # 0 at the seams
seam_groove = np.exp(-(edge / 0.018) ** 2)
stitch_rows = (np.sin((np.arange(BH)[:, None] + 0.5) / BH * 2 * math.pi * 70) > 0.15).astype(np.float32)
stitch = np.exp(-((edge - 0.045) / 0.008) ** 2)[None, :] * stitch_rows
bagh = g * 0.35 - seam_groove[None, :] * 1.2 + stitch * 0.7
height_to_normal(cv2.GaussianBlur(bagh.astype(np.float32), (0, 0), 0.9), 3.5, 'bag_leather_normal.png')
# roughness: worn shine on the most hit areas (centre of the front gores), matte in the seams
br = np.clip(0.42 - 0.10 * np.exp(-(((np.arange(BH)[:, None] / BH) - 0.55) / 0.18) ** 2) + seam_groove[None, :] * 0.25 + (g - 0.5) * 0.08, 0.1, 1)
save(Image.fromarray((np.dstack([np.ones_like(br), br, np.zeros_like(br)]) * 255).astype(np.uint8)), 'bag_leather_orm.png')

# kicker ball v2: seams + stitching dots + leather grain (equirect, same panel layout as v1)
seam_mask = np.clip(edge_b := (1 - np.clip(edge / 0.02, 0, 1)), 0, 1) if False else None
print('textures written to', OUT)
for fn in sorted(os.listdir(OUT)):
    print(f'{fn:34s} {os.path.getsize(os.path.join(OUT, fn)) / 1024:8.1f} KB')
