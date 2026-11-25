"""
make_champion_production_textures.py - Boxer Champion graphics from the PRODUCTION print files
(v11).  Replaces the photo-based front, side and canopy-band artwork with the factory print files,
laid on the model at true 1:1 scale, so the joins between the panels are exactly those of the real
sticker.

Sources (creator-assets/reference/production/):
  champion_sheet_front_sides.webp   CHAMPION__PG print sheet, 1350 x 1940 mm, rendered at 144 dpi.
                                    One sheet wraps the column: left side | front | right side.
                                    The white crest in the middle is CUT OUT on the machine - the
                                    score shield (displays) sits there; the rules / service stickers
                                    printed inside it are separate stickers and are not used.
  champion_sheet_band.webp          Champion_top print, 2650 x 250 mm (canopy band).
  champion_front_v10_shield_source.webp  v10 front texture - only its score-shield artwork is used.

How the sheet is placed (all in metres, model coordinates, see boxer_champion_model.py):
  * horizontally the sheet is wrapped round the column from its centre line: front face flat to
    the rounded corner (r 8 mm), then along the side.  1350 mm = 325 + 700 + 325 mm, i.e. the
    column (0.70 x 0.321 m) plus 4 mm round each rear edge - the print fits the column exactly.
  * vertically the crest cut-out is placed so the score shield covers it all round (>= 6 mm
    overlap): the cut-out tip sits at y = 0.875 m (shield tip 0.85 m).  The sheet then runs from
    y = 1.950 m (under the canopy) to y = 0.010 m (under the base plate).
  * inside the score shield the existing shield artwork of the front texture is kept (the print
    file has the cut-out there; the shield print is a separate part).
  * band: 1:1, sheet centre on the band centre (u 0.5), the band shows sheet rows 19-211 mm
    (top and bottom of the print wrap over the edges of the canopy wall).

usage: python3 make_champion_production_textures.py <creator-assets dir>
writes textures/champion/champion_zone_{front,left,right,band}.webp
"""
import sys, os, math
import numpy as np
import cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxer_champion_model as M
from meshlib import offset_contour

Image.MAX_IMAGE_PIXELS = None
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..')
SRC = os.path.join(ROOT, 'reference', 'production')
OUT = os.path.join(ROOT, 'textures', 'champion')

D = M.D
G = M.FRONT_GFX
SHEET_MM = (1350.15, 1940.28)          # print page size
TIP_Y = 0.875                          # model y of the cut-out tip
TIP_SHEET_MM = 1074.98                 # cut-out tip, mm from the top of the sheet
SHEET_TOP_Y = TIP_Y + TIP_SHEET_MM / 1000.0
CORNER_R = 0.008                       # column front corner radius ('-x' / '+x' of the RoundedBox)
PX_PER_M = 2977.0                      # output resolution (print raster is ~2830 px/m)
BAND_PX_PER_M = 3180.0
BAND_V_CENTRE = 0.55                   # band v (0 = top) of the sheet centre line
QUALITY = 90


def load(name):
    return np.array(Image.open(os.path.join(SRC, name)).convert('RGB'))


def sample(img, mm_per_px, xs_mm, ys_mm):
    """Lanczos-sample img at sheet positions (mm). xs_mm: (W,), ys_mm: (H,)."""
    mx, my = np.meshgrid(xs_mm * mm_per_px[0], ys_mm * mm_per_px[1])
    return cv2.remap(img, mx.astype(np.float32) - 0.5, my.astype(np.float32) - 0.5,
                     cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def side_path(z):
    """Distance along the wrapped sheet from the front centre line to side point at depth z."""
    cx, z1 = D['col_x'], D['col_z1']
    return (cx - CORNER_R) + math.pi / 2 * CORNER_R + (z1 - CORNER_R - z)


def save(arr, name, alpha=None):
    im = Image.fromarray(arr)
    if alpha is not None:
        im = Image.fromarray(np.dstack([arr, alpha]))
    p = os.path.join(OUT, name)
    im.save(p, 'WEBP', quality=QUALITY, method=6)
    print(f'{name}: {im.size[0]} x {im.size[1]}  {os.path.getsize(p) // 1024} KB')


sheet = load('champion_sheet_front_sides.webp')
sh, sw = sheet.shape[:2]
pp = (sw / SHEET_MM[0], sh / SHEET_MM[1])           # px per mm
cx_mm = SHEET_MM[0] / 2


def sheet_y_mm(y):
    return (SHEET_TOP_Y - y) * 1000.0


# ---------------------------------------------------------------- FRONT
fw = int(round((G['x1'] - G['x0']) * PX_PER_M)); fh = int(round((G['y1'] - G['y0']) * PX_PER_M))
xs = np.linspace(G['x0'], G['x1'], fw, endpoint=False) + (G['x1'] - G['x0']) / fw / 2
ys = np.linspace(G['y1'], G['y0'], fh, endpoint=False) - (G['y1'] - G['y0']) / fh / 2
front = sample(sheet, pp, cx_mm + xs * 1000.0, sheet_y_mm(ys))

# keep the existing score-shield artwork inside the shield (the print has the cut-out there)
old = Image.open(os.path.join(SRC, 'champion_front_v10_shield_source.webp')).convert('RGBA')   # v10 front (photo of the shield print)
old = np.array(old.resize((fw, fh), Image.LANCZOS))
outline = offset_contour(M.shield_outline(720), -0.002)        # hidden under the bevel
poly = np.stack([(outline[:, 0] - G['x0']) / (G['x1'] - G['x0']) * fw,
                 (G['y1'] - outline[:, 1]) / (G['y1'] - G['y0']) * fh], 1)
mask = np.zeros((fh, fw), np.uint8)
cv2.fillPoly(mask, [np.round(poly * 16).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=4)
mask = cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), 0.0015 * PX_PER_M)[..., None]
front_print = front
front = (front * (1 - mask) + old[..., :3] * mask).round().clip(0, 255).astype(np.uint8)
# the cut-out also has a plate-shaped neck above the shield (white on the print). It is filled with
# the print artwork just above it (mirrored across the neck's top edge, per column), so the star
# background runs down to the shield with no gap.
X, Y = np.meshgrid(xs, ys)
zone = (np.abs(X) < 0.19) & (Y > 1.70)
cut = (front_print.min(2) > 200) & zone & (mask[..., 0] < 0.5)
cut = cv2.dilate(cut.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(bool) & zone
src_y = np.tile(np.arange(fh)[:, None], (1, fw)).astype(np.float32)
for c in np.where(cut.any(0))[0]:
    rows = np.where(cut[:, c])[0]
    top = rows.min()
    src_y[rows, c] = np.clip(2 * top - rows - 1, 0, fh - 1)
src_x = np.tile(np.arange(fw)[None, :], (fh, 1)).astype(np.float32)
filled = cv2.remap(front_print, src_x, src_y, cv2.INTER_LINEAR)
w = cv2.GaussianBlur(cut.astype(np.float32), (0, 0), 1.5)[..., None] * (1 - mask)
front = (front * (1 - w) + filled * w).round().clip(0, 255).astype(np.uint8)
save(front, 'champion_zone_front.webp', alpha=np.full((fh, fw), 255, np.uint8))

# ---------------------------------------------------------------- SIDES
y0, y1 = D['col_y0'] + 0.002, D['col_box_y1'] - 0.004
zb, zf = D['col_z0'] + D['back_trim'], D['col_z1'] - D['side_red']
sw_px = int(round((zf - zb) * PX_PER_M)); sh_px = int(round((y1 - y0) * PX_PER_M))
zs = np.linspace(zb, zf, sw_px, endpoint=False) + (zf - zb) / sw_px / 2        # u: back -> front
ysd = np.linspace(y1, y0, sh_px, endpoint=False) - (y1 - y0) / sh_px / 2
d = np.array([side_path(z) for z in zs]) * 1000.0
# left side (-x): image left = back, right = front; on the sheet the left panel runs back -> front
left = sample(sheet, pp, cx_mm - d, sheet_y_mm(ysd))
# right side (+x): image left = front, right = back
right = sample(sheet, pp, cx_mm + d[::-1], sheet_y_mm(ysd))
save(left, 'champion_zone_left.webp')
save(right, 'champion_zone_right.webp')

# ---------------------------------------------------------------- BAND
band = load('champion_sheet_band.webp')
bh, bw = band.shape[:2]
BAND_MM = (2650.0, 250.0)
bp = (bw / BAND_MM[0], bh / BAND_MM[1])
L = M._BAND_LEN; Hb = M.BAND_Y[1] - M.BAND_Y[0]
ow = min(8192, int(round(L * BAND_PX_PER_M))); oh = int(round(Hb * ow / L))
us = (np.arange(ow) + 0.5) / ow; vs = (np.arange(oh) + 0.5) / oh
bx = BAND_MM[0] / 2 + (us - 0.5) * L * 1000.0
by = BAND_MM[1] / 2 + (vs - BAND_V_CENTRE) * Hb * 1000.0
save(sample(band, bp, bx, by), 'champion_zone_band.webp')
