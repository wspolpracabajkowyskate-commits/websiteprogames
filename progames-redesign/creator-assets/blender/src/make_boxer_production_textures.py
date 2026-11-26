"""
make_boxer_production_textures.py - graphics for the boxers built on the Boxer Champion cabinet
(Boxer Champion, Boxer POW, Boxer Easy) from their PRODUCTION print files.

All three machines share the cabinet and the same die-cut print layout:
  * front/sides sheet, 1350 x 1940 mm, wrapped round the column: left side | front | right side
    (325 + 700 + 325 mm = column 0.70 x 0.321 m + 4 mm round each rear edge);
  * a white crest in the middle that is CUT OUT on the machine - the score shield with the displays
    sits there; the rules / service stickers printed inside it are separate stickers (not used);
  * canopy band print, 2650 x 250 mm.

Placement (model metres, see boxer_champion_model.py):
  * the crest tip (1075 mm from the top of the sheet on all three files) at y 0.875 m, so the
    shield (tip 0.85 m) covers the cut-out all round (>= 6 mm);
  * the plate-shaped neck of the cut-out above the shield is filled with the print just above it
    (mirrored across its top edge, per column);
  * inside the shield the shield artwork of `shield` is used (front-texture UV space, any size);
  * band 1:1, sheet centre on the band centre (u 0.5), rows 19-211 mm visible.

usage: python3 make_boxer_production_textures.py <creator-assets dir> <machine> [<machine> ...]
       machine = champion | pow | easy
writes textures/<dir>/<prefix>_zone_{front,left,right,band}.webp
"""
import sys, os, math
import numpy as np
import cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import boxer_champion_model as M
from meshlib import offset_contour

Image.MAX_IMAGE_PIXELS = None

MACHINES = {
    # sheet / band: files in reference/production; shield: front texture whose shield area is used
    'champion': dict(sheet='champion_sheet_front_sides.webp', band='champion_sheet_band.webp',
                     shield='champion_front_v10_shield_source.webp', out='champion', prefix='champion',
                     px_per_m=2977.0, band_px_per_m=3180.0),
    # POW / Easy print files are 1112 x 1600 px (~0.82 px/mm): output at 2 px/mm, light sharpening
    'pow': dict(sheet='pow_sheet_front_sides.webp', band='pow_sheet_band.webp',
                shield='pow_shield_source.webp', out='pow', prefix='pow',
                px_per_m=2000.0, band_px_per_m=1600.0, sharpen=0.6),
    # Boxer Easy has the same score-shield print as Boxer Champion
    'easy': dict(sheet='easy_sheet_front_sides.webp', band='easy_sheet_band.webp',
                 shield='champion_front_v10_shield_source.webp', out='easy', prefix='easy',
                 px_per_m=2000.0, band_px_per_m=1600.0, sharpen=0.6),
}

D = M.D
G = M.FRONT_GFX
SHEET_MM = (1350.15, 1940.28)
BAND_MM = (2650.0, 250.0)
TIP_Y = 0.875
TIP_SHEET_MM = 1074.98
SHEET_TOP_Y = TIP_Y + TIP_SHEET_MM / 1000.0
CORNER_R = 0.008
BAND_V_CENTRE = 0.55
QUALITY = 90


def sample(img, pp, xs_mm, ys_mm):
    mx, my = np.meshgrid(xs_mm * pp[0], ys_mm * pp[1])
    return cv2.remap(img, mx.astype(np.float32) - 0.5, my.astype(np.float32) - 0.5,
                     cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)


def sharpen(img, amount):
    if not amount:
        return img
    blur = cv2.GaussianBlur(img, (0, 0), 1.6)
    return cv2.addWeighted(img, 1 + amount, blur, -amount, 0)


def side_path(z):
    cx, z1 = D['col_x'], D['col_z1']
    return (cx - CORNER_R) + math.pi / 2 * CORNER_R + (z1 - CORNER_R - z)


def sheet_y_mm(y):
    return (SHEET_TOP_Y - y) * 1000.0


def front_grid(px_per_m):
    fw = int(round((G['x1'] - G['x0']) * px_per_m)); fh = int(round((G['y1'] - G['y0']) * px_per_m))
    xs = np.linspace(G['x0'], G['x1'], fw, endpoint=False) + (G['x1'] - G['x0']) / fw / 2
    ys = np.linspace(G['y1'], G['y0'], fh, endpoint=False) - (G['y1'] - G['y0']) / fh / 2
    return fw, fh, xs, ys


def shield_mask(fw, fh, px_per_m):
    outline = offset_contour(M.shield_outline(720), -0.002)        # hidden under the bevel
    poly = np.stack([(outline[:, 0] - G['x0']) / (G['x1'] - G['x0']) * fw,
                     (G['y1'] - outline[:, 1]) / (G['y1'] - G['y0']) * fh], 1)
    mask = np.zeros((fh, fw), np.uint8)
    cv2.fillPoly(mask, [np.round(poly * 16).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=4)
    return cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), 0.0015 * px_per_m)[..., None]


def front_print(root, cfg):
    """The front of the sheet in front-texture space, without the shield (cut-out neck filled)."""
    src = os.path.join(root, 'reference', 'production')
    sheet = np.array(Image.open(os.path.join(src, cfg['sheet'])).convert('RGB'))
    pp = (sheet.shape[1] / SHEET_MM[0], sheet.shape[0] / SHEET_MM[1])
    fw, fh, xs, ys = front_grid(cfg['px_per_m'])
    front = sample(sheet, pp, SHEET_MM[0] / 2 + xs * 1000.0, sheet_y_mm(ys))
    mask = shield_mask(fw, fh, cfg['px_per_m'])
    X, Y = np.meshgrid(xs, ys)
    zone = (np.abs(X) < 0.185) & (Y > 1.70)
    cut = (front.min(2) > 200) & zone & (mask[..., 0] < 0.5)
    k = max(3, int(round(0.0025 * cfg['px_per_m'])) | 1)
    cut = cv2.dilate(cut.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))).astype(bool) & zone
    src_y = np.tile(np.arange(fh)[:, None], (1, fw)).astype(np.float32)
    for c in np.where(cut.any(0))[0]:
        rows = np.where(cut[:, c])[0]
        top = rows.min()
        src_y[rows, c] = np.clip(2 * top - rows - 1, 0, fh - 1)
    src_x = np.tile(np.arange(fw)[None, :], (fh, 1)).astype(np.float32)
    filled = cv2.remap(front, src_x, src_y, cv2.INTER_LINEAR)
    w = cv2.GaussianBlur(cut.astype(np.float32), (0, 0), 1.5)[..., None] * (1 - mask)
    front = (front * (1 - w) + filled * w).round().clip(0, 255).astype(np.uint8)
    return sheet, pp, front, mask


def build(root, name):
    cfg = MACHINES[name]
    src = os.path.join(root, 'reference', 'production')
    out = os.path.join(root, 'textures', cfg['out']); os.makedirs(out, exist_ok=True)
    pre, ppm, sh = cfg['prefix'], cfg['px_per_m'], cfg.get('sharpen', 0)

    def save(arr, zone, alpha=None):
        im = Image.fromarray(np.dstack([arr, alpha]) if alpha is not None else arr)
        p = os.path.join(out, f'{pre}_zone_{zone}.webp')
        im.save(p, 'WEBP', quality=QUALITY, method=6)
        print(f'{pre}_zone_{zone}.webp: {im.size[0]} x {im.size[1]}  {os.path.getsize(p) // 1024} KB')

    sheet, pp, front, mask = front_print(root, cfg)
    fh, fw = front.shape[:2]
    front = sharpen(front, sh)
    shield = Image.open(os.path.join(src, cfg['shield'])).convert('RGB').resize((fw, fh), Image.LANCZOS)
    front = (front * (1 - mask) + np.array(shield) * mask).round().clip(0, 255).astype(np.uint8)
    save(front, 'front', alpha=np.full((fh, fw), 255, np.uint8))

    y0, y1 = D['col_y0'] + 0.002, D['col_box_y1'] - 0.004
    zb, zf = D['col_z0'] + D['back_trim'], D['col_z1'] - D['side_red']
    sw_px = int(round((zf - zb) * ppm)); sh_px = int(round((y1 - y0) * ppm))
    zs = np.linspace(zb, zf, sw_px, endpoint=False) + (zf - zb) / sw_px / 2
    ysd = np.linspace(y1, y0, sh_px, endpoint=False) - (y1 - y0) / sh_px / 2
    d = np.array([side_path(z) for z in zs]) * 1000.0
    save(sharpen(sample(sheet, pp, SHEET_MM[0] / 2 - d, sheet_y_mm(ysd)), sh), 'left')
    save(sharpen(sample(sheet, pp, SHEET_MM[0] / 2 + d[::-1], sheet_y_mm(ysd)), sh), 'right')

    band = np.array(Image.open(os.path.join(src, cfg['band'])).convert('RGB'))
    bp = (band.shape[1] / BAND_MM[0], band.shape[0] / BAND_MM[1])
    L = M._BAND_LEN; Hb = M.BAND_Y[1] - M.BAND_Y[0]
    ow = min(8192, int(round(L * cfg['band_px_per_m']))); oh = int(round(Hb * ow / L))
    us = (np.arange(ow) + 0.5) / ow; vs = (np.arange(oh) + 0.5) / oh
    save(sharpen(sample(band, bp, BAND_MM[0] / 2 + (us - 0.5) * L * 1000.0,
                        BAND_MM[1] / 2 + (vs - BAND_V_CENTRE) * Hb * 1000.0), sh), 'band')


if __name__ == '__main__':
    root = sys.argv[1]
    for n in sys.argv[2:] or ['champion']:
        build(root, n)
