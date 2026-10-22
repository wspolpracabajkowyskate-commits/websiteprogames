"""
fit_champion_cad_textures.py - re-fits the Boxer Champion print files of the previous (photo based,
v9) model onto the v10 shape from the CAD renders.  The artwork itself is not changed, only warped:

  FRONT  thin-plate-spline warp: the printed shield window (inner edge of the old red bezel) lands
         exactly on the new CAD glass face and the printed bezel under the new bevel, the printed
         coin acceptor on
         the new coin acceptor, the red rail strips on the new (narrower) rails; the artwork inside
         keeps its scale, the extra column width is taken up by the outer background strips.
  BAND   the canopy band is longer relative to its height (straight sides + semicircular front):
         the CHAMPION panel keeps its proportions (+18 %), the side artwork takes the rest.
  SIDES  unchanged (UV 0..1 over the new side panels, +8 % width).

Also prints the display / rules-plate positions on the new front (copy them into
boxer_champion_model.SCREENS / RULES).

usage: python3 fit_champion_cad_textures.py <v9 sticker dir> <out dir>
       (v9 sticker dir = creator-assets/reference/sticker_v9, out = creator-assets/textures/champion)
"""
import sys, os, math
import numpy as np
import cv2
from scipy.interpolate import RBFInterpolator
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxer_champion_model as M
from meshlib import resample_closed, ccw, offset_contour

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ v9 geometry (photo model)
OLD_GFX = dict(x0=-0.335, x1=0.335, y0=0.045, y1=1.85)
OLD_RAIL_IN = 0.3225 - 0.036
OLD_SHIELD_HW = [(1.76, 0.280), (1.74, 0.265), (1.72, 0.260), (1.70, 0.254), (1.68, 0.248), (1.66, 0.242),
                 (1.64, 0.236), (1.62, 0.231), (1.60, 0.229), (1.58, 0.228), (1.56, 0.228), (1.54, 0.233), (1.52, 0.236),
                 (1.50, 0.240), (1.48, 0.245), (1.46, 0.249), (1.44, 0.253), (1.42, 0.256), (1.40, 0.261), (1.38, 0.267),
                 (1.36, 0.270), (1.34, 0.272), (1.32, 0.274), (1.30, 0.275), (1.27, 0.275), (1.24, 0.273), (1.21, 0.271),
                 (1.18, 0.266), (1.15, 0.261), (1.12, 0.252), (1.10, 0.246), (1.08, 0.238), (1.06, 0.228), (1.04, 0.218),
                 (1.02, 0.206), (1.00, 0.193), (0.98, 0.176), (0.96, 0.152), (0.94, 0.115), (0.92, 0.062), (0.905, 0.0)]
_OLD_TOP = ([0.0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.25, 0.28],
            [1.7546, 1.7535, 1.746, 1.7384, 1.7335, 1.7305, 1.7308, 1.7335, 1.738, 1.742])
OLD_SCREENS = {'score': (-0.137, 1.313, 0.129, 1.431), 'high': (-0.077, 1.187, 0.071, 1.265), 'credit': (-0.023, 1.120, 0.019, 1.153)}
OLD_COIN = (-0.278, 0.856, -0.204, 0.980)
OLD_RULES = (0.211, 0.822, 0.303, 0.963)
OLD_BAND_FRONT_PX = (1345, 2740)      # light CHAMPION panel in champion_zone_band (4096 px wide)


def old_shield(n):
    right = [(hw, y) for y, hw in OLD_SHIELD_HW]
    left = [(-x, y) for x, y in right[::-1]]
    top = [(x, float(np.interp(abs(x), *_OLD_TOP)) + 0.018) for x in np.linspace(-0.28, 0.28, 29)[1:-1]]
    P = ccw(resample_closed(np.array(right + left[1:] + top), n))
    i0 = int(np.argmin(P[:, 1])); return np.roll(P, -i0, 0)


def start_bottom(P):
    i0 = int(np.argmin(P[:, 1])); return np.roll(P, -i0, 0)


N = 72
old_out = start_bottom(offset_contour(old_shield(N), 0.003))      # outer edge of the old red bezel
old_in = start_bottom(offset_contour(old_shield(N), -0.023))      # inner edge (window of the print)
new_out = M.shield_outline(N)
new_in = M.shield_inner(N)
G = M.FRONT_GFX
SB, ST = new_out[:, 1].min(), new_out[:, 1].max()
OB, OT = old_out[:, 1].min(), old_out[:, 1].max()


def y_new2old(y):
    return np.interp(y, [G['y0'], SB, ST, G['y1']], [OLD_GFX['y0'], OB, OT, OLD_GFX['y1']])


src, dst = [], []                     # src = new coords, dst = old coords
# the print window (inner edge of the old bezel) lands on the new glass face; the new bevel takes
# the same width of the old printed bezel (no compression -> no overshoot of the spline)
src += list(new_in); dst += list(old_in)
from meshlib import contour_normals
NI = 600
ni_d = M.shield_inner(NI); oi_d = start_bottom(offset_contour(old_shield(NI), -0.023)); on_d = contour_normals(oi_d)
ring_src, ring_dst = [], []               # bevel ring, used by the piecewise-linear stage below
NO = 160
for p, nrm in zip(M.shield_outline(NO), contour_normals(M.shield_outline(NO))):
    i = int(np.argmin(np.linalg.norm(ni_d - p, axis=1)))
    ring_src += [p, p + nrm * 0.02]
    ring_dst += [oi_d[i] + on_d[i] * 0.042, oi_d[i] + on_d[i] * 0.062]   # outer edge of the printed (photographed) bezel / artwork beyond it
_s = np.array(src); _d = np.array(dst); _keep = _s[:, 0] > 1e-6
src = list(_s[_keep]) + list(_s[_keep] * [-1, 1]) + list(_s[np.abs(_s[:, 0]) <= 1e-6] * [0, 1])
dst = list(_d[_keep]) + list(_d[_keep] * [-1, 1]) + list(_d[np.abs(_s[:, 0]) <= 1e-6] * [0, 1])
for y in np.linspace(G['y0'], G['y1'], 16):
    for sx in (-1, 1):
        src += [[sx * G['x1'], y]]                       # no rails any more: the printed red rail
        dst += [[sx * OLD_RAIL_IN, y_new2old(y)]]        # strip of the photo is left outside
for x in np.linspace(-0.30, 0.30, 7):
    src += [[x, G['y0']], [x, G['y1']]]; dst += [[x * OLD_RAIL_IN / G['x1'], OLD_GFX['y0']], [x * OLD_RAIL_IN / G['x1'], OLD_GFX['y1']]]
for y in (0.12, 0.32, 0.52, 0.70):                      # artwork below the shield keeps its scale
    for x in (-0.18, -0.09, 0.0, 0.09, 0.18):
        src.append([x, y]); dst.append([x, y_new2old(y)])
nc, oc = M.COIN, OLD_COIN
for fx, fy in ((0, 0), (0.5, 0), (1, 0), (0, 0.5), (0.5, 0.5), (0, 1)):   # (top right corner sits at the bevel)
    if True:
        src.append([nc[0] + fx * (nc[2] - nc[0]), nc[1] + fy * (nc[3] - nc[1])])
        dst.append([oc[0] + fx * (oc[2] - oc[0]), oc[1] + fy * (oc[3] - oc[1])])
src = np.array(src, float); dst = np.array(dst, float)
# stage 1: smooth spline from the print window, the frame and the coin acceptor
tps = RBFInterpolator(src, dst, kernel='thin_plate_spline', smoothing=1e-7)
err = np.abs(tps(src) - dst).max()
# stage 2: piecewise-linear warp (no overshoot) that additionally squeezes the old printed bezel
# under the new bevel: exact window ring + bevel rings + a grid evaluated with the spline away from the band
from scipy.interpolate import LinearNDInterpolator
from matplotlib.path import Path as _Path
_outer2 = _Path(offset_contour(M.shield_outline(400), 0.03)); _inner1 = _Path(offset_contour(M.shield_inner(400), -0.008))
gx, gy = np.meshgrid(np.arange(G['x0'] - 0.01, G['x1'] + 0.011, 0.01), np.arange(G['y0'] - 0.01, G['y1'] + 0.011, 0.01))
grid = np.stack([gx.ravel(), gy.ravel()], 1)
keep = ~_outer2.contains_points(grid) | _inner1.contains_points(grid)
grid = grid[keep]
inner_ring = M.shield_inner(160)
pl_src = np.vstack([grid, inner_ring, np.array(ring_src)])
pl_dst = np.vstack([tps(grid), tps(inner_ring), np.array(ring_dst)])
_pl = LinearNDInterpolator(pl_src, pl_dst)
_pl_inv = LinearNDInterpolator(pl_dst, pl_src)


def new2old(P):
    P = np.atleast_2d(P); Q = _pl(P); bad = np.isnan(Q[:, 0])
    if bad.any():
        Q[bad] = tps(P[bad])
    return Q
print('front warp: max control error %.2f mm' % (err * 1000))

# ------------------------------------------------------------------ FRONT texture
def read(name):
    im = cv2.imread(os.path.join(SRC, name), cv2.IMREAD_UNCHANGED)
    if im is None:
        raise FileNotFoundError(name)
    return im


front = read('champion_zone_front.webp')
Ho, Wo = front.shape[:2]
Wn = Wo
Hn = int(round(Wn * (G['y1'] - G['y0']) / (G['x1'] - G['x0'])))
step = 4
gx = np.arange(0, Wn + step, step); gy = np.arange(0, Hn + step, step)
X, Y = np.meshgrid(gx, gy)
xm = G['x0'] + (X + 0.5) / Wn * (G['x1'] - G['x0'])
ym = G['y1'] - (Y + 0.5) / Hn * (G['y1'] - G['y0'])
old = new2old(np.stack([xm.ravel(), ym.ravel()], 1)).reshape(xm.shape + (2,))
mapx = ((old[..., 0] - OLD_GFX['x0']) / (OLD_GFX['x1'] - OLD_GFX['x0']) * Wo - 0.5).astype(np.float32)
mapy = ((OLD_GFX['y1'] - old[..., 1]) / (OLD_GFX['y1'] - OLD_GFX['y0']) * Ho - 0.5).astype(np.float32)
mapx = cv2.resize(mapx, (len(gx) * step, len(gy) * step), interpolation=cv2.INTER_LINEAR)[:Hn, :Wn]
mapy = cv2.resize(mapy, (len(gx) * step, len(gy) * step), interpolation=cv2.INTER_LINEAR)[:Hn, :Wn]
out = cv2.remap(front, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
# where the old printed bezel was wider than the new bevel, its red rim would show next to the
# shield: in a 25 mm strip outside the new bevel (below the top corners) bezel-red pixels are
# filled in from the surrounding artwork
def to_px(P):
    return np.stack([(P[:, 0] - G['x0']) / (G['x1'] - G['x0']) * Wn, (G['y1'] - P[:, 1]) / (G['y1'] - G['y0']) * Hn], 1)
O = M.shield_outline(400)
band_mask = np.zeros((Hn, Wn), np.uint8)
cv2.fillPoly(band_mask, [np.round(to_px(offset_contour(O, 0.035)) * 4).astype(np.int32)], 255, shift=2)
tip = to_px(np.array([[0.0, O[:, 1].min()]]))[0]
tip_mask = np.zeros((Hn, Wn), np.uint8)
cv2.ellipse(tip_mask, (int(tip[0]), int(tip[1] + 0.012 / (G['y1'] - G['y0']) * Hn)), (int(0.03 / (G['x1'] - G['x0']) * Wn), int(0.028 / (G['y1'] - G['y0']) * Hn)), 0, 0, 360, 255, -1)
cv2.fillPoly(band_mask, [np.round(to_px(offset_contour(O, -0.002)) * 4).astype(np.int32)], 0, shift=2)
band_mask[: int((G['y1'] - 1.55) / (G['y1'] - G['y0']) * Hn)] = 0
bgr = out[..., :3].astype(int)
red = (bgr[..., 2] > 110) & (bgr[..., 1] < 0.55 * bgr[..., 2]) & (bgr[..., 0] < 0.6 * bgr[..., 2])
inside = np.zeros((Hn, Wn), np.uint8)
cv2.fillPoly(inside, [np.round(to_px(offset_contour(O, -0.002)) * 4).astype(np.int32)], 255, shift=2)
side = np.zeros((Hn, Wn), np.uint8)          # left / right of the shield up to the rails
cv2.fillPoly(side, [np.round(to_px(np.array([[G['x0'] + 0.022, 1.06], [G['x1'] - 0.022, 1.06], [G['x1'] - 0.022, 1.6], [G['x0'] + 0.022, 1.6]])) * 4).astype(np.int32)], 255, shift=2)
near = np.zeros((Hn, Wn), np.uint8)
cv2.fillPoly(near, [np.round(to_px(offset_contour(O, 0.004)) * 4).astype(np.int32)], 255, shift=2)
fill = (((tip_mask > 0) | ((side > 0) & (near == 0) & red)) & (inside == 0)).astype(np.uint8) * 255
fill = cv2.dilate(fill, np.ones((5, 5), np.uint8))
fill &= (255 - inside)
rgb = cv2.inpaint(np.ascontiguousarray(out[..., :3]), fill, 9, cv2.INPAINT_TELEA)
out = np.dstack([rgb, out[..., 3]]) if out.shape[2] == 4 else rgb
print('bezel remnant pixels filled:', int((fill > 0).sum()))

# ---------------------------------------------------------------- score shield from the sharp photo
# champion_shield_photo.png: straight-on photo of the printed shield.  Its print window (inner edge of
# the red bezel, traced below in photo pixels) is warped onto the new glass face; the displays are
# then placed on the photographed display windows.
SHIELD_PHOTO = os.path.join(SRC, 'champion_shield_photo.png')
PH_INNER = [(506, 1468), (673, 1410), (745, 1350), (799, 1290), (842, 1230), (874, 1170), (896, 1110), (913, 1050),
            (930, 990), (939, 930), (942, 870), (941, 810), (936, 750), (921, 690), (907, 630), (893, 570), (879, 510),
            (867, 450), (858, 390), (851, 330), (858, 210), (874, 90), (868, 78), (800, 62), (700, 57), (600, 52),
            (506, 50), (400, 52), (300, 58), (200, 66), (110, 78), (102, 90), (122, 210), (129, 330), (125, 390),
            (103, 450), (102, 510), (90, 570), (78, 630), (69, 690), (63, 750), (60, 810), (62, 870), (66, 930),
            (74, 990), (87, 1050), (110, 1110), (134, 1170), (167, 1230), (209, 1290), (264, 1350), (340, 1410)]
PH_WINDOWS = {'score': (270, 595, 728, 773), 'high': (380, 880, 632, 1012), 'credit': (470, 1072, 545, 1133)}   # x0,y0,x1,y1 px
NEW_SCREENS = None
if os.path.exists(SHIELD_PHOTO):
    photo = cv2.imread(SHIELD_PHOTO, cv2.IMREAD_COLOR)
    ph = np.array(PH_INNER, float) * [1, -1]                   # y up so the contour is CCW like the model's
    ph = ccw(resample_closed(ph, 160)); ph = start_bottom(ph)
    ni = M.shield_inner(160)
    to_ph = RBFInterpolator(ni, ph * [1, -1], kernel='thin_plate_spline', smoothing=1e-6)
    to_new = RBFInterpolator(ph * [1, -1], ni, kernel='thin_plate_spline', smoothing=1e-6)
    gx2, gy2 = np.meshgrid(np.arange(0, Wn + step, step), np.arange(0, Hn + step, step))
    xm2 = G['x0'] + (gx2 + 0.5) / Wn * (G['x1'] - G['x0']); ym2 = G['y1'] - (gy2 + 0.5) / Hn * (G['y1'] - G['y0'])
    q = to_ph(np.stack([xm2.ravel(), ym2.ravel()], 1)).reshape(xm2.shape + (2,)).astype(np.float32)
    mx = cv2.resize(q[..., 0], (gx2.shape[1] * step, gx2.shape[0] * step), interpolation=cv2.INTER_LINEAR)[:Hn, :Wn]
    my = cv2.resize(q[..., 1], (gx2.shape[1] * step, gx2.shape[0] * step), interpolation=cv2.INTER_LINEAR)[:Hn, :Wn]
    shield_rgb = cv2.remap(photo, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # slightly more contrast and colour (the photo is a little flat behind the acrylic)
    f = shield_rgb.astype(np.float32) / 255.0
    f = np.clip((f - 0.5) * 1.15 + 0.5 - 0.015, 0, 1)
    lum = f.mean(2, keepdims=True); f = np.clip(lum + (f - lum) * 1.10, 0, 1)
    shield_rgb = (f * 255 + 0.5).astype(np.uint8)
    mask = np.zeros((Hn, Wn), np.uint8)
    cv2.fillPoly(mask, [np.round(to_px(offset_contour(M.shield_inner(400), 0.004)) * 4).astype(np.int32)], 255, shift=2)
    mask = cv2.GaussianBlur(mask, (9, 9), 2).astype(np.float32)[..., None] / 255.0
    out[..., :3] = (out[..., :3] * (1 - mask) + shield_rgb * mask).astype(np.uint8)
    def win(r):
        cx, cy = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2
        Q = to_new(np.array([[cx, cy], [r[0], cy], [r[2], cy], [cx, r[1]], [cx, r[3]]], float))
        w = np.linalg.norm(Q[2] - Q[1]); h = np.linalg.norm(Q[4] - Q[3]); c = Q[0]
        return tuple(round(float(v), 3) for v in (c[0] - w / 2, c[1] - h / 2, c[0] + w / 2, c[1] + h / 2))
    NEW_SCREENS = {k: win(v) for k, v in PH_WINDOWS.items()}
    print('shield photo fitted; display windows:', NEW_SCREENS)
cv2.imwrite(os.path.join(OUT, 'champion_zone_front.webp'), out, [cv2.IMWRITE_WEBP_QUALITY, 92])
print('front', front.shape, '->', out.shape)


from scipy.spatial import cKDTree
_gx, _gy = np.meshgrid(np.arange(-0.33, 0.33, 0.001), np.arange(0.6, 1.86, 0.001))
_gn = np.stack([_gx.ravel(), _gy.ravel()], 1)
_tree = cKDTree(new2old(_gn))


def old2new_exact(P):
    """Inverse of the texture warp (nearest grid sample, 1 mm)."""
    return _gn[_tree.query(np.atleast_2d(P))[1]]


def fwd_rect(r):
    cx, cy = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2
    Q = old2new_exact(np.array([[cx, cy], [r[0], cy], [r[2], cy], [cx, r[1]], [cx, r[3]]]))
    w = np.linalg.norm(Q[2] - Q[1]); h = np.linalg.norm(Q[4] - Q[3]); c = Q[0]
    return tuple(round(float(v), 3) for v in (c[0] - w / 2, c[1] - h / 2, c[0] + w / 2, c[1] + h / 2))


print('SCREENS =', NEW_SCREENS or {k: fwd_rect(v) for k, v in OLD_SCREENS.items()})
print('RULES =', fwd_rect(OLD_RULES))

# ------------------------------------------------------------------ BAND texture
band = read('champion_zone_band.webp')
Hb, Wb = band.shape[:2]
a, b, L = M.band_range()
Hm = M.BAND_Y[1] - M.BAND_Y[0]
Wnb = int(round(Hb * L / Hm))
f0, f1 = OLD_BAND_FRONT_PX
front_w = (f1 - f0) / Hb * Hm * 1.18                 # metres, CHAMPION panel +18 %
s0 = L / 2 - front_w / 2; s1 = L / 2 + front_w / 2
s = (np.arange(Wnb) + 0.5) / Wnb * L
u = np.interp(s, [0, s0, s1, L], [0, f0, f1, Wb]) - 0.5
mapx = np.tile(u.astype(np.float32), (Hb, 1))
mapy = np.tile(np.arange(Hb, dtype=np.float32)[:, None], (1, Wnb))
outb = cv2.remap(band, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
cv2.imwrite(os.path.join(OUT, 'champion_zone_band.webp'), outb, [cv2.IMWRITE_WEBP_QUALITY, 92])
print('band', band.shape, '->', outb.shape, 'length %.3f m, height %.3f m' % (L, Hm))

import shutil
for n in ('champion_zone_left.webp', 'champion_zone_right.webp'):
    if os.path.abspath(os.path.join(SRC, n)) != os.path.abspath(os.path.join(OUT, n)):
        shutil.copyfile(os.path.join(SRC, n), os.path.join(OUT, n))
