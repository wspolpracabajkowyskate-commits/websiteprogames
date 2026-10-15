"""
double_strike_model.py - parametric geometry of the PRO GAMES "Double Strike Boxer/Kicker"
arcade machine, reconstructed from the reference photographs (front / back / left / right /
3-4 / detail views) and the published dimensions (height 219 cm).

This module is the single geometric source used by:
  * build_double_strike_blend.py  (runs inside Blender -> .blend + .glb export)
  * export_glb.py                 (pure-python GLB writer used for previews/CI)

All values are metres, glTF axes (Y up, machine front = +Z, machine right = +X).
"""
import math
import numpy as np
from meshlib import (Mesh, RoundedBox, sweep, cap, ring_cap, lathe, uv_sphere, quad, disc,
                     box, rounded_box_tris, convex_hull, fillet, resample_closed, ccw, offset_contour,
                     contour_normals, ray_polygon, mat_translate, mat_rot, mat_scale, mat_basis,
                     look_basis, apply, orient_with_uv, grid_tris, box_uv)

# ----------------------------------------------------------------------------
# Master dimensions (m)
# ----------------------------------------------------------------------------
D = dict(
    # platform (black chamfered base + diamond plate)
    plat_x=0.61, plat_z0=-0.33, plat_z1=0.49, plat_h=0.07, plate_t=0.005, plat_chamfer=0.05,
    # lower body (kicker cabinet)
    lb_x=0.52, lb_y0=0.075, lb_y1=0.815, lb_z0=-0.24, lb_z1=0.26,
    # kicker opening on the lower-body front
    op_x=0.355, op_y0=0.085, op_y1=0.59, op_depth=0.24, op_back_x=0.28, op_back_y0=0.15, op_back_y1=0.50,
    # column (tapered: wider at the back)
    col_hw_back=0.28, col_hw_front=0.28, col_z0=-0.115, col_z1=0.165, col_y0=0.80, col_y1=1.755,
    # canopy: lower "drum" + upper slab (tilted up towards the front)
    can_y0=1.75, drum_hw_back=0.30, drum_r=0.44, drum_zc=0.465,
    slab_hw_back=0.40, slab_zback=-0.15, slab_r=0.515, slab_y_back=2.0, slab_rise=0.045, slab_t=0.092,
    # punch bag
    bag_z=0.62, bag_y=1.50, bag_r=0.112,
    # kicker ball
    kb_x=-0.16, kb_y=0.37, kb_z=0.18, kb_r=0.10,
)
SLAB_DEPTH = (D['drum_zc'] + D['slab_r']) - D['slab_zback']
BANNER_Y = (1.852, 2.03)
BANNER_ARC = 0.77


def slab_bottom(z):
    return D['slab_y_back'] + D['slab_rise'] * (z - D['slab_zback']) / SLAB_DEPTH


def col_halfwidth(z):
    t = (z - D['col_z0']) / (D['col_z1'] - D['col_z0'])
    return D['col_hw_back'] + (D['col_hw_front'] - D['col_hw_back']) * t


# ----------------------------------------------------------------------------
# Plan shapes (x,z) - CCW when viewed from +Y? we use (a=x, b=z) with U=+X, V=+Z, W=+Y.
# For U=x, V=z the right-handed normal U x V = -Y, so "CCW in (x,z)" means outward normals
# computed by contour_normals are correct in-plane; caps are oriented explicitly.
# ----------------------------------------------------------------------------
def plan_D(hw_back, z_back, r, zc, corner_r, n=200):
    angs = np.linspace(-math.pi / 2, math.pi / 2, 90)
    arc = np.stack([r * np.sin(angs), zc + r * np.cos(angs)], 1)
    pts = np.vstack([arc, [[-hw_back, z_back], [hw_back, z_back]]])
    hull = convex_hull(pts)
    hull = fillet(hull, lambda p: corner_r if abs(p[1] - z_back) < 1e-6 else 0.0, seg=10)
    return ccw(resample_closed(hull, n))


DRUM_PLAN = plan_D(D['drum_hw_back'], D['col_z0'], D['drum_r'], D['drum_zc'], 0.09)
SLAB_PLAN = plan_D(D['slab_hw_back'], D['slab_zback'], D['slab_r'], D['drum_zc'], 0.17)

X3 = np.array([1.0, 0, 0]); Y3 = np.array([0, 1.0, 0]); Z3 = np.array([0, 0, 1.0])


def plan_point(contour, s_frac):
    """Point + outward normal at fraction of arc length along contour (x,z)."""
    C = np.vstack([contour, contour[:1]])
    seg = np.linalg.norm(np.diff(C, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = (s_frac % 1.0) * s[-1]
    i = min(np.searchsorted(s, t, side='right') - 1, len(contour) - 1)
    f = (t - s[i]) / max(seg[i], 1e-12)
    p = C[i] * (1 - f) + C[i + 1] * f
    N = contour_normals(contour)
    n = N[i] * (1 - f) + N[(i + 1) % len(contour)] * f
    n /= np.linalg.norm(n)
    return p, n


def arc_param_at(contour, target_xz, side_sign=None):
    """Arc-length fraction of the contour point closest to target (x,z)."""
    d = np.linalg.norm(contour - np.asarray(target_xz), axis=1)
    if side_sign is not None:
        d = d + (np.sign(contour[:, 0]) != side_sign) * 10
    i = int(np.argmin(d))
    C = np.vstack([contour, contour[:1]])
    seg = np.linalg.norm(np.diff(C, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    return s[i] / s[-1]


def contour_strip(contour, f0, f1, y0, y1, offset, nu=48, nv=8, yfunc=None):
    """Conforming patch on a vertical wall swept along a plan contour between arc fractions f0..f1.
    UV oriented so the image reads correctly from outside. Returns P, UV."""
    if f1 < f0:
        f1 += 1.0
    G = np.zeros((nu + 1, nv + 1, 3)); UVg = np.zeros((nu + 1, nv + 1, 2))
    for i in range(nu + 1):
        f = f0 + (f1 - f0) * i / nu
        p, n = plan_point(contour, f)
        for j in range(nv + 1):
            t = j / nv
            yy0 = y0(p[0], p[1]) if callable(y0) else y0
            yy1 = y1(p[0], p[1]) if callable(y1) else y1
            y = yy0 + (yy1 - yy0) * t
            G[i, j] = [p[0] + n[0] * offset, y, p[1] + n[1] * offset]
            UVg[i, j] = [i / nu, 1 - t]
    # orientation: u must increase towards viewer's right (up x n)
    p, n = plan_point(contour, 0.5 * (f0 + f1))
    n3 = np.array([n[0], 0, n[1]])
    right = np.cross(Y3, n3)
    du = G[-1, 0] - G[0, 0]
    if du @ right < 0:
        UVg[..., 0] = 1 - UVg[..., 0]
    P, UV = grid_tris(G, UVg)
    P, UV = orient_with_uv(P, UV, lambda c: np.array([c[0], 0, c[2] - D['drum_zc'] * 0.0]) * 0 + _outward_from_plan(contour, c))
    return P, UV


def _outward_from_plan(contour, c):
    d = np.linalg.norm(contour - np.array([c[0], c[2]]), axis=1)
    i = int(np.argmin(d))
    n = contour_normals(contour)[i]
    return np.array([n[0], 0, n[1]])


# ----------------------------------------------------------------------------
# Score-panel shield outline (derived from the frontal detail photo, ref1)
# Pixel frame of ref1: centre x=527, 1406 px per metre, bottom of shield at py=1100 -> y=0.965 m
# ----------------------------------------------------------------------------
SHIELD_PX = dict(cx=527.0, ppm=1406.0, py_bottom=1100.0, y_bottom=0.965)
SHIELD_HW = [(100, 0), (108, 40), (120, 75), (150, 125), (200, 183), (270, 230), (350, 260), (450, 280),
             (540, 291), (630, 296), (720, 290), (780, 278), (870, 250), (930, 225), (990, 194), (1040, 152),
             (1080, 95), (1100, 40), (1104, 0)]
SHIELD_BUMPS = [(527, 128, 60), (527 - 256, 296, 54), (527 + 256, 296, 54)]


def shield_mask(grow_px=0.0, scale=1.0):
    W, H = 760, 1200
    ys, xs = np.mgrid[0:H, 0:W].astype(float)
    xs = xs - W / 2 + SHIELD_PX['cx']
    pys = np.array([p for p, _ in SHIELD_HW]); hws = np.array([h for _, h in SHIELD_HW])
    hw = np.interp(ys, pys, hws, left=0, right=0)
    inside = (np.abs(xs - SHIELD_PX['cx']) <= hw + grow_px) & (ys >= pys[0] - grow_px) & (ys <= pys[-1] + grow_px)
    for bx, by, br in SHIELD_BUMPS:
        inside |= (xs - bx) ** 2 + (ys - by) ** 2 <= (br + grow_px) ** 2
    return inside, W, H


def shield_contour_px(grow_px=0.0, n=220):
    m, W, H = shield_mask(grow_px)
    cx, cy = W / 2, 560.0
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n
        dx, dy = math.cos(a), math.sin(a)
        r = 0.0
        step = 0.5
        rr = 0.0
        while True:
            x = cx + dx * rr; y = cy + dy * rr
            if x < 0 or y < 0 or x >= W - 1 or y >= H - 1:
                break
            if m[int(y), int(x)]:
                r = rr
            elif rr - r > 30:
                break
            rr += step
        pts.append([cx + dx * r - W / 2 + SHIELD_PX['cx'], cy + dy * r])
    pts = np.array(pts)
    # light smoothing
    for _ in range(2):
        pts = 0.25 * np.roll(pts, 1, 0) + 0.5 * pts + 0.25 * np.roll(pts, -1, 0)
    return pts


def px_to_panel(pts_px):
    """ref1 pixel coords -> (x, y) metres on the column front."""
    p = np.asarray(pts_px, float)
    x = (p[:, 0] - SHIELD_PX['cx']) / SHIELD_PX['ppm']
    y = SHIELD_PX['y_bottom'] + (SHIELD_PX['py_bottom'] - p[:, 1]) / SHIELD_PX['ppm']
    return np.stack([x, y], 1)


# Texture crop rectangle (ref1 pixels) used for the SCORE graphic -> UV mapping
SCORE_CROP_PX = (527 - 330, 52, 527 + 330, 1112)  # x0, y0, x1, y1


def panel_uv(xy):
    x0, y0, x1, y1 = SCORE_CROP_PX
    px = xy[:, 0] * SHIELD_PX['ppm'] + SHIELD_PX['cx']
    py = SHIELD_PX['py_bottom'] - (xy[:, 1] - SHIELD_PX['y_bottom']) * SHIELD_PX['ppm']
    return np.stack([(px - x0) / (x1 - x0), (py - y0) / (y1 - y0)], 1)


# ----------------------------------------------------------------------------
# Screen digit atlas (1024 x 1024 px): region rectangles (x0,y0,x1,y1), aspect matches the glass
SCREEN_ATLAS = {'score': (0, 0, 1024, 528), 'high': (0, 560, 600, 880), 'credit': (680, 600, 960, 880)}
SCREEN_TEXT = {'score': '777', 'high': '649', 'credit': '5'}

# ----------------------------------------------------------------------------
# Sticker atlas (2048 x 2048) regions, pixel rectangles (x0, y0, x1, y1)
# ----------------------------------------------------------------------------
ATLAS_SIZE = 2048
ATLAS = {
    'rules': (0, 0, 512, 580),
    'kicker_smart': (512, 0, 1024, 584),
    'coin': (1024, 0, 1264, 700),
    'ball': (1280, 0, 1664, 384),
    'glove': (1664, 0, 2048, 384),
    'badge': (0, 640, 768, 896),
    'warning': (768, 640, 1024, 800),
    'fan': (1024, 720, 1408, 1104),
    'socket': (1408, 720, 1664, 912),
    'glove_l': (1664, 400, 2048, 784),
}


def atlas_uv(name, UV):
    x0, y0, x1, y1 = ATLAS[name]
    s = ATLAS_SIZE
    out = UV.copy()
    out[..., 0] = (x0 + UV[..., 0] * (x1 - x0)) / s
    out[..., 1] = (y0 + UV[..., 1] * (y1 - y0)) / s
    return out


def sticker(mesh, name, center, normal, w, h, up=(0, 1, 0), mat='DECALS', offset=0.0015):
    n = np.asarray(normal, float); n /= np.linalg.norm(n)
    B = look_basis(np.asarray(center, float) + n * offset, n, up)
    P, UV = quad([0, 0, 0], [1, 0, 0], [0, 1, 0], w, h, M=B)
    mesh.add(mat, P, atlas_uv(name, UV))


# ----------------------------------------------------------------------------
# LED helper
# ----------------------------------------------------------------------------
class LedGroup:
    def __init__(self, name):
        self.mesh = Mesh(name, smooth_angle=80)
        self.count = 0
        self.items = []

    def bulb(self, pos, normal, color=(1, 1, 1), r=0.0165, h=0.011, mat='LED_RGB'):
        prof = [(r * math.cos(t) * 1.0, h * math.sin(t)) for t in np.linspace(0, math.pi / 2, 7)]
        prof = [(r * 1.0, -0.004)] + prof
        B = look_basis(np.asarray(pos, float), normal) @ mat_rot('x', 90)
        P, UV = lathe(prof, segments=16, M=B)
        C = np.tile(np.asarray(color, float), (len(P), 3, 1))
        L = np.full((len(P), 3), float(self.count))
        self.mesh.add(mat, P, UV, C, L)
        self.items.append(dict(pos=list(map(float, pos)), color=list(map(float, color))))
        self.count += 1

    def strip(self, p0, p1, normal, width=0.022, height=0.012, segs=48, mat='LED_STRIP'):
        """Rounded translucent RGB bar from p0 to p1, UV.u runs along its length."""
        p0 = np.asarray(p0, float); p1 = np.asarray(p1, float)
        n = np.asarray(normal, float); n /= np.linalg.norm(n)
        ax = p1 - p0; L = np.linalg.norm(ax); ax /= L
        side = np.cross(n, ax)
        prof = []
        for t in np.linspace(math.pi, 0, 9):
            prof.append((math.cos(t) * width / 2, math.sin(t) * height))
        G = np.zeros((segs + 1, len(prof), 3)); UVg = np.zeros((segs + 1, len(prof), 2))
        for i in range(segs + 1):
            u = i / segs
            for j, (sx, sy) in enumerate(prof):
                endround = 1.0
                G[i, j] = p0 + ax * (u * L) + side * sx * endround + n * sy
                UVg[i, j] = [u, j / (len(prof) - 1)]
        P, UV = grid_tris(G, UVg)
        P, UV = orient_with_uv(P, UV, lambda c: n + 0.0 * c)
        # end caps
        for e, sgn in ((p0, -1), (p1, 1)):
            Bc = mat_basis(e, side, n, ax * sgn)
            pc = [[sx, sy, 0] for sx, sy in prof]
            tris = []
            for k in range(len(pc) - 1):
                tris.append([[0, 0, 0], pc[k], pc[k + 1]])
            Pc = apply(Bc, np.array(tris, float).reshape(-1, 3)).reshape(-1, 3, 3)
            UVc = np.full((len(Pc), 3, 2), [0.0 if sgn < 0 else 1.0, 0.5])
            Pc, UVc = orient_with_uv(Pc, UVc, ax * sgn)
            P = np.concatenate([P, Pc]); UV = np.concatenate([UV, UVc])
        C = np.ones((len(P), 3, 3))
        Lid = np.full((len(P), 3), float(self.count))
        self.mesh.add(mat, P, UV, C, Lid)
        self.count += 1


PALETTE = dict(white=(1.0, 1.0, 1.0), pink=(1.0, 0.45, 0.85), green=(0.45, 1.0, 0.6), cyan=(0.45, 0.85, 1.0),
               blue=(0.6, 0.7, 1.0), violet=(0.8, 0.55, 1.0))


# ----------------------------------------------------------------------------
# Build parts
# ----------------------------------------------------------------------------
def build_platform():
    nodes = []
    m = Mesh('metal_platform', smooth_angle=30)
    x, z0, z1, h, ch = D['plat_x'], D['plat_z0'], D['plat_z1'], D['plat_h'], D['plat_chamfer']
    # chamfered frame: profile swept around rectangle contour
    rect = np.array([[-x, z0], [x, z0], [x, z1], [-x, z1]])
    rect = ccw(fillet(rect, lambda p: 0.02, seg=4))
    rect = resample_closed(rect, 120)
    prof = [(-ch - 0.002, h), (-ch, h), (0, 0.012), (0, 0.0)]
    P, UV, _ = sweep(rect, prof, X3, Z3, Y3)
    P, UV = orient_with_uv(P, UV, lambda c: np.array([c[0], 0.5, (c[2] - 0.08)]))
    m.add('RUBBER', P, UV)
    Pb, UVb = cap(rect, X3, Z3, Y3, h=0.0, facing=-1)
    m.add('RUBBER', Pb, UVb)
    nodes.append(('metal_platform', 'platform', m))
    # diamond plate (top sheet) - UV in metres*4 for tiling
    dp = Mesh('diamond_plate', smooth_angle=30)
    inner = offset_contour(rect, -ch - 0.002)
    Pt, UVt = cap(inner, X3, Z3, Y3, h=h + D['plate_t'], facing=+1, uv_scale=3.0)
    dp.add('DIAMOND_PLATE', Pt, UVt)
    prof2 = [(0, h + D['plate_t']), (0.0, h - 0.001)]
    Ps, UVs, _ = sweep(inner, prof2, X3, Z3, Y3, uv_scale=3.0)
    Ps, UVs = orient_with_uv(Ps, UVs, lambda c: np.array([c[0], 0, c[2] - 0.08]))
    dp.add('DIAMOND_PLATE', Ps, UVs)
    nodes.append(('diamond_plate', 'platform', dp))
    return nodes


def lower_body_box():
    return RoundedBox([-D['lb_x'], D['lb_y0'], D['lb_z0']], [D['lb_x'], D['lb_y1'], D['lb_z1']],
                      {'-x': 0.08, '+x': 0.08, '-y': 0.0, '+y': 0.085, '-z': 0.09, '+z': 0.07})


def build_lower_body(leds, stick):
    nodes = []
    rb = lower_body_box()
    m = Mesh('body_lower', smooth_angle=40)
    fx = D['op_x']; fy0 = D['op_y0']; fy1 = D['op_y1']
    holes = {'+z': [(-fx, fx, fy0 - 0.2, fy1)]}
    extra = {('+z', 0): (-fx, fx), ('+z', 1): (fy1,)}
    z0 = D['lb_z0']

    def matfn(c, n, face):
        if c[2] < z0 + 0.04 and n[2] > -0.97:
            return 'BLACK_PLASTIC'
        return None
    rb.build(m, 'BODY_PAINT', seg=12, step=0.08, holes=holes, extra=extra, skip=('-y',), matfn=matfn)
    # kicker recess (tapered tunnel)
    zf = D['lb_z1']; zb = zf - D['op_depth']
    bx = D['op_back_x']; by0 = D['op_back_y0']; by1 = D['op_back_y1']
    front = [(-fx, fy0), (fx, fy0), (fx, fy1), (-fx, fy1)]
    back = [(-bx, by0), (bx, by0), (bx, by1), (-bx, by1)]
    tris = []
    for i in range(4):
        j = (i + 1) % 4
        a = [front[i][0], front[i][1], zf]; b = [front[j][0], front[j][1], zf]
        c = [back[j][0], back[j][1], zb]; d = [back[i][0], back[i][1], zb]
        tris += [[a, b, c], [a, c, d]]
    P = np.array(tris, float)
    P, _ = orient_with_uv(P, np.zeros((len(P), 3, 2)), lambda c: np.array([-c[0], 0.5 - c[1], 0.0]) * np.array([1, 1, 0]) + np.array([0, 0, 0.001]))
    m.add('BODY_PAINT', P)
    Pb, UVb = quad([0, (by0 + by1) / 2, zb], X3, Y3, 2 * bx, by1 - by0)
    m.add('BODY_PAINT', Pb, UVb)
    nodes.append(('body_lower', 'body', m))

    # opening frame (raised bezel)
    fr = Mesh('kicker_frame', smooth_angle=40)
    cont = np.array([[-fx, 0.02], [fx, 0.02], [fx, fy1], [-fx, fy1]])
    cont = ccw(resample_closed(fillet(cont, lambda p: 0.02 if p[1] > 0.1 else 0.0, seg=6), 160))
    prof = [(0.0, -0.012), (0.0, 0.006), (0.004, 0.011), (0.020, 0.011), (0.026, 0.005), (0.027, 0.0)]
    P, UV, _ = sweep(cont, prof, X3, Y3, Z3, origin=[0, 0, zf])
    P, UV = orient_with_uv(P, UV, lambda c: np.array([0, 0, 1.0]) + 0.3 * np.array([np.sign(c[0]) * (abs(c[0]) > fx - 0.01), 0, 0]))
    fr.add('BODY_PAINT', P, UV)
    nodes.append(('kicker_frame', 'body', fr))

    # ---- LEDs on the lower body
    # front: row of bulbs above the RGB bar
    for i, xx in enumerate(np.linspace(-0.33, 0.33, 8)):
        p, n = rb.surface_point('+z', xx, 0.705)
        leds['led_lower'].bulb(p, n, PALETTE[['white', 'pink', 'white', 'green', 'white', 'cyan', 'white', 'pink'][i]])
    for sx in (-1, 1):
        p, n = rb.surface_point('+z', sx * 0.405, 0.655)
        leds['led_lower'].bulb(p, n, PALETTE['pink'])
        for k, yy in enumerate(np.linspace(0.585, 0.13, 6)):
            p, n = rb.surface_point('+z', sx * 0.452, yy)
            leds['led_lower'].bulb(p, n, PALETTE[['white', 'cyan', 'white', 'pink', 'white', 'green'][k]])
        # side faces (front edge)
        for k, yy in enumerate(np.linspace(0.70, 0.16, 6)):
            p, n = rb.surface_point('+x' if sx > 0 else '-x', yy, 0.215)
            leds['led_side'].bulb(p, n, PALETTE[['pink', 'white', 'cyan', 'white', 'green', 'white'][k]])
        p, n = rb.surface_point('+x' if sx > 0 else '-x', 0.47, -0.20)
        leds['led_side'].bulb(p, n, PALETTE['violet'])
        # back
        for k, yy in enumerate(np.linspace(0.66, 0.24, 6)):
            p, n = rb.surface_point('-z', sx * 0.41, yy)
            leds['led_back'].bulb(p, n, PALETTE[['pink', 'cyan', 'green', 'white', 'violet', 'green'][k]])
    # RGB bars
    leds['led_kicker'].strip([-0.345, 0.637, zf + 0.001], [0.345, 0.637, zf + 0.001], Z3, width=0.024)
    for sx in (-1, 1):
        leds['led_kicker'].strip([sx * 0.395, 0.11, zf + 0.001], [sx * 0.395, 0.575, zf + 0.001], Z3, width=0.02)

    # ---- graphics zones on the lower body (conforming decals)
    zones = {}
    zf_m = Mesh('decal_lower_front', smooth_angle=60)
    hole = [(-(fx + 0.027), fx + 0.027, -1, fy1 + 0.027)]
    P, UV = rb.decal_grid('+z', -0.50, 0.50, 0.06, 0.80, offset=0.0016, na=40, nb=30, holes=hole)
    zf_m.add('GFX_LOWER_FRONT', P, UV)
    nodes.append(('decal_lower_front', 'decals', zf_m))
    zones['lower_front'] = dict(rect=[-0.50, 0.50, 0.06, 0.80], size=[1.0, 0.74])
    for side, nm in (('-x', 'decal_kicker_left'), ('+x', 'decal_kicker_right')):
        km = Mesh(nm, smooth_angle=60)
        P, UV = rb.decal_grid(side, 0.12, 0.74, -0.175, 0.19, offset=0.0016, na=24, nb=24)
        km.add('GFX_KICKER', P, UV)
        nodes.append((nm, 'decals', km))
    zones['kicker'] = dict(size=[0.365, 0.62])

    # stickers: DOUBLE STRIKE badge near top-front of both sides
    for sx in (-1, 1):
        face = '+x' if sx > 0 else '-x'
        p, n = rb.surface_point(face, 0.765, 0.05)
        sticker(stick, 'badge', p, n, 0.20, 0.066, up=(0, 1, -0.0))
    # back panel details
    return nodes, zones, rb


def build_back_details(rb_lower, det):
    zb = D['lb_z0']
    # lower body rear service door: groove outline + vents + fan + socket
    door = [(-0.29, 0.25), (0.29, 0.25), (0.29, 0.65), (-0.29, 0.65)]
    _groove_rect(det, -0.29, 0.29, 0.245, 0.655, zb, -1)
    for xx in (0.11, -0.04):
        for k in range(4):
            yy = 0.47 - k * 0.016
            P = box([xx - 0.05, yy - 0.004, zb - 0.002], [xx + 0.05, yy + 0.004, zb + 0.001])
            det.add('BLACK_PLASTIC', P)
    for xx in (0.11, -0.04):
        for k in range(4):
            yy = 0.37 - k * 0.016
            P = box([xx - 0.05, yy - 0.004, zb - 0.002], [xx + 0.05, yy + 0.004, zb + 0.001])
            det.add('BLACK_PLASTIC', P)
    # fan
    P = box([-0.24, 0.53, zb - 0.006], [-0.15, 0.62, zb + 0.001]); det.add('BLACK_PLASTIC', P)
    Pq, UVq = quad([-0.195, 0.575, zb - 0.0065], X3 * -1, Y3, 0.085, 0.085); det.add('DECALS', Pq, atlas_uv('fan', UVq))
    # power socket + warning label
    P = box([-0.23, 0.39, zb - 0.012], [-0.16, 0.45, zb + 0.001]); det.add('BLACK_PLASTIC', P)
    Pq, UVq = quad([-0.195, 0.42, zb - 0.0125], X3 * -1, Y3, 0.06, 0.045); det.add('DECALS', Pq, atlas_uv('socket', UVq))
    Pq, UVq = quad([-0.195, 0.345, zb - 0.0012], X3 * -1, Y3, 0.075, 0.047); det.add('DECALS', Pq, atlas_uv('warning', UVq))
    # lock
    P, UV = lathe([(0, 0), (0.009, 0), (0.009, 0.006), (0.0, 0.008)], 16, M=mat_translate(-0.215, 0.5, zb) @ mat_rot('x', -90))
    det.add('METAL', P, UV)
    # column / canopy rear: door, hinges, lock, vents
    zc = D['col_z0']
    _groove_rect(det, -0.25, 0.25, 0.84, 1.42, zc, -1)
    for yy, xs in ((0.92, (-0.1, 0.1)), (1.86, (-0.17, 0.17))):
        for xx in xs:
            for k in range(4):
                y2 = yy + k * 0.016
                P = box([xx - 0.05, y2 - 0.004, zc - 0.002], [xx + 0.05, y2 + 0.004, zc + 0.001])
                det.add('BLACK_PLASTIC', P)
    for yy in (0.98, 1.31):
        P = box([0.245, yy - 0.03, zc - 0.012], [0.262, yy + 0.03, zc + 0.001]); det.add('BLACK_PLASTIC', P)
    P, UV = lathe([(0, 0), (0.009, 0), (0.009, 0.006), (0.0, 0.008)], 16, M=mat_translate(-0.215, 1.15, zc) @ mat_rot('x', -90))
    det.add('METAL', P, UV)


def _groove_rect(mesh, x0, x1, y0, y1, z, zsign, w=0.004):
    zz = z + zsign * 0.0008
    for (a, b, c, d) in ((x0, x1, y0 - w / 2, y0 + w / 2), (x0, x1, y1 - w / 2, y1 + w / 2),
                         (x0 - w / 2, x0 + w / 2, y0, y1), (x1 - w / 2, x1 + w / 2, y0, y1)):
        P, UV = quad([(a + b) / 2, (c + d) / 2, zz], X3 * (-zsign), Y3, b - a, d - c)
        mesh.add('BLACK_PLASTIC', P, UV)


def build_column(leds, stick):
    nodes = []
    hwb = D['col_hw_back']
    rb = RoundedBox([-hwb, D['col_y0'], D['col_z0']], [hwb, D['col_y1'], D['col_z1']],
                    {'-x': 0.014, '+x': 0.014, '-z': 0.012, '+z': 0.014, '+y': 0.0, '-y': 0.0})
    def taper(P):
        P = P.copy()
        s = np.array([col_halfwidth(z) / hwb for z in P[:, 2]])
        P[:, 0] *= s
        return P
    slope = (D['col_hw_back'] - D['col_hw_front']) / (D['col_z1'] - D['col_z0'])
    def taper_n(N):
        N = N.copy()
        N[:, 2] += np.sign(N[:, 0]) * slope * (np.abs(N[:, 0]) > 0.5)
        return N / np.linalg.norm(N, axis=1, keepdims=True)
    m = Mesh('body_column', smooth_angle=40)
    z0 = D['col_z0']
    def matfn(c, n, face):
        if abs(n[0]) > 0.3 and c[2] < z0 + 0.026:
            return 'BLACK_PLASTIC'
        return None
    rb.build(m, 'BODY_PAINT', seg=8, step=0.1, skip=('+y', '-y'), matfn=matfn, deform=taper)
    nodes.append(('body_column', 'body', m))

    zf = D['col_z1']
    # ---- score panel bezel (raised shield moulding)
    outer_px = shield_contour_px(grow_px=16)
    inner_px = shield_contour_px(grow_px=0)
    outer = ccw(px_to_panel(outer_px)); inner = ccw(px_to_panel(inner_px))
    sp = Mesh('score_panel', smooth_angle=50)
    # rim profile swept along the outer outline (offset is relative to outer contour)
    rim = 16 / SHIELD_PX['ppm']
    prof = [(0.0, 0.0), (0.0, 0.009), (-0.003, 0.0135), (-rim * 0.55, 0.015), (-rim + 0.002, 0.012), (-rim, 0.009)]
    P, UV, _ = sweep(outer, prof, X3, Y3, Z3, origin=[0, 0, zf])
    P, UV = orient_with_uv(P, UV, lambda c: np.array([c[0], c[1] - 1.33, 0.25]))
    sp.add('BODY_PAINT', P, UV)
    inner_c = offset_contour(outer, -rim)
    Pc, UVc = cap(inner_c, X3, Y3, Z3, origin=[0, 0, zf], h=0.009, facing=+1, center=[0, 1.33])
    sp.add('BODY_PAINT', Pc, UVc)
    nodes.append(('score_panel', 'body', sp))
    # SCORE graphic decal (exact inner outline) - UVs map into the ref1-derived crop
    dm = Mesh('decal_score', smooth_angle=60)
    dec_c = offset_contour(outer, -rim + 0.001)
    Pd, _ = cap(dec_c, X3, Y3, Z3, origin=[0, 0, zf], h=0.0102, facing=+1, center=[0, 1.33])
    xy = Pd.reshape(-1, 3)[:, :2]
    UVd = panel_uv(xy).reshape(-1, 3, 2)
    dm.add('GFX_SCORE', Pd, UVd)
    nodes.append(('decal_score', 'decals', dm))
    # LED screens (emissive digits) over the graphic
    sc = Mesh('screen_score', smooth_angle=10)
    def scr(cx_px, cy_px, w_px, h_px, region):
        xy = px_to_panel([[cx_px, cy_px]])[0]
        w = w_px / SHIELD_PX['ppm']; h = h_px / SHIELD_PX['ppm']
        # dark glass frame
        Pf = rounded_box_tris([xy[0] - w / 2, xy[1] - h / 2, zf + 0.0095], [xy[0] + w / 2, xy[1] + h / 2, zf + 0.0125], 0.002, seg=2, step=1)
        sc.add('BLACK_PLASTIC', Pf)
        Pq, UVq = quad([xy[0], xy[1], zf + 0.0127], X3, Y3, w * 0.93, h * 0.86)
        u0, v0, u1, v1 = [c / 1024.0 for c in SCREEN_ATLAS[region]]
        UVq[..., 0] = u0 + UVq[..., 0] * (u1 - u0)
        UVq[..., 1] = v0 + UVq[..., 1] * (v1 - v0)
        sc.add('SCREEN', Pq, UVq)
    scr(512, 518, 310, 172, 'score')
    scr(504, 702, 172, 100, 'high')
    scr(500, 823, 56, 56, 'credit')
    nodes.append(('screen_score', 'body', sc))

    # ---- column LEDs
    for sx in (-1, 1):
        for k, yy in enumerate((1.587, 1.39, 1.16, 1.008)):
            leds['led_front'].bulb([sx * 0.233, yy, zf + 0.0005], Z3, PALETTE['blue'])
    for side, sx in (('led_left', -1), ('led_right', 1)):
        for k, yy in enumerate(np.linspace(0.91, 1.69, 8)):
            z = 0.132
            x = sx * (col_halfwidth(z) + 0.0005)
            n = np.array([sx, 0, slope]); n /= np.linalg.norm(n)
            leds[side].bulb([x, yy, z], n, PALETTE[['green', 'white', 'pink', 'cyan', 'white', 'violet', 'green', 'pink'][k]])

    # ---- column side graphics (BOXER VS KICKER)
    for side, nm in (('-x', 'decal_left'), ('+x', 'decal_right')):
        dmm = Mesh(nm, smooth_angle=60)
        P, UV = rb.decal_grid(side, 0.855, 1.745, -0.072, 0.105, offset=0.0016, na=6, nb=40, deform=taper, deform_normal=taper_n)
        dmm.add('GFX_LEFT' if side == '-x' else 'GFX_RIGHT', P, UV)
        nodes.append((nm, 'decals', dmm))

    # ---- coin acceptor (3D)
    ca = Mesh('coin_acceptor', smooth_angle=40)
    cx, cy = px_to_panel([[246, 1237]])[0]
    w, h = 72 / SHIELD_PX['ppm'], 205 / SHIELD_PX['ppm']
    Pf = rounded_box_tris([cx - w / 2, cy - h / 2, zf - 0.005], [cx + w / 2, cy + h / 2, zf + 0.008], 0.004, seg=4, step=1)
    ca.add('BLACK_PLASTIC', Pf)
    Pq, UVq = quad([cx, cy, zf + 0.0083], X3, Y3, w * 0.98, h * 0.985)
    ca.add('DECALS', Pq, atlas_uv('coin', UVq))
    # chrome coin-return lever
    Pl = rounded_box_tris([cx - 0.008, cy - 0.055, zf + 0.008], [cx + 0.008, cy - 0.03, zf + 0.016], 0.003, seg=4, step=1)
    ca.add('METAL', Pl)
    nodes.append(('coin_acceptor', 'body', ca))

    # ---- rules plate + KICKER SMART sticker
    rx, ry = px_to_panel([[503, 1245]])[0]
    Pr = rounded_box_tris([rx - 0.069, ry - 0.077, zf - 0.001], [rx + 0.069, ry + 0.077, zf + 0.003], 0.003, seg=4, step=1)
    stick.add('BLACK_PLASTIC', Pr)
    Pq, UVq = quad([rx, ry, zf + 0.0033], X3, Y3, 0.136, 0.152)
    stick.add('DECALS', Pq, atlas_uv('rules', UVq))
    kx, ky = px_to_panel([[766, 1278]])[0]
    Pq, UVq = quad([kx, ky, zf + 0.0015], X3, Y3, 0.13, 0.148)
    stick.add('DECALS', Pq, atlas_uv('kicker_smart', UVq))
    return nodes, rb


def build_canopy(leds, stick):
    nodes = []
    y0 = D['can_y0']
    # ---- drum (lower canopy band)
    dr = Mesh('top_canopy_drum', smooth_angle=40)
    def hf(a, b, s):
        # s: 0 = bottom, 1 = top (slab bottom), values in between interpolate; >1/<0 are absolute offsets
        return y0 + (slab_bottom(b) + 0.01 - y0) * s
    prof = [(-0.03, 0.0), (-0.012, 0.0), (-0.003, 0.003), (0.0, 0.012), (0.0, 1.0)]
    C = DRUM_PLAN
    Nn = contour_normals(C)
    G = []
    P_all = []; UV_all = []
    # custom sweep to support mixed absolute/relative heights
    rows = []
    for (off, s) in prof:
        row = []
        for i in range(len(C)):
            a, b = C[i] + Nn[i] * off
            if s in (0.0,):
                y = y0
            elif s == 1.0:
                y = slab_bottom(b) + 0.01
            else:
                y = y0 + s
            row.append([a, y, b])
        rows.append(row)
    rows = np.array(rows)  # (npf, nc, 3)
    Gr = np.concatenate([rows, rows[:, :1]], 1).transpose(1, 0, 2)
    seg = np.linalg.norm(np.diff(np.vstack([C, C[:1]]), axis=0), axis=1)
    s_arc = np.concatenate([[0], np.cumsum(seg)])
    UVg = np.zeros(Gr.shape[:2] + (2,))
    UVg[..., 0] = s_arc[:, None]; UVg[..., 1] = np.array([0, 0.02, 0.03, 0.04, 0.3])[None, :]
    P, UV = grid_tris(Gr, UVg)
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(C, c) + np.array([0, -0.3, 0]) * (c[1] < y0 + 0.005))
    dr.add('BODY_PAINT', P, UV)
    # underside: ring between drum outline and bag slot, then slot walls + ceiling
    slot_c = np.array([0.0, 0.42])
    slot = ccw(resample_closed(fillet(np.array([[-0.19, 0.12], [0.19, 0.12], [0.19, 0.72], [-0.19, 0.72]]), lambda p: 0.17, seg=12), 400))
    angs = np.linspace(0, 2 * math.pi, 160, endpoint=False)
    rin = ray_polygon(slot_c, angs, slot)
    rout = ray_polygon(slot_c, angs, offset_contour(C, -0.03))
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    inner = slot_c + dirs * rin[:, None]; outer = slot_c + dirs * rout[:, None]
    Pu, UVu = ring_cap(outer, inner, X3, Z3, Y3, h=y0, facing=-1)
    dr.add('BODY_PAINT', Pu, UVu)
    slot_wall = []
    for i in range(len(inner)):
        j = (i + 1) % len(inner)
        a = [inner[i][0], y0, inner[i][1]]; b = [inner[j][0], y0, inner[j][1]]
        c = [inner[j][0], y0 + 0.05, inner[j][1]]; d = [inner[i][0], y0 + 0.05, inner[i][1]]
        slot_wall += [[a, b, c], [a, c, d]]
    Pw = np.array(slot_wall)
    Pw, _ = orient_with_uv(Pw, np.zeros((len(Pw), 3, 2)), lambda c: np.array([slot_c[0] - c[0], 0, slot_c[1] - c[2]]))
    dr.add('BLACK_PLASTIC', Pw)
    Pce, UVce = cap(inner, X3, Z3, Y3, h=y0 + 0.05, facing=-1, center=slot_c)
    dr.add('BLACK_PLASTIC', Pce, UVce)
    nodes.append(('top_canopy_drum', 'canopy', dr))

    # ---- slab (upper canopy, tilted)
    sl = Mesh('top_canopy', smooth_angle=40)
    S = SLAB_PLAN
    t = D['slab_t']
    prof = [(-0.03, 0.0), (-0.02, 0.0), (-0.006, 0.0025), (0.0, 0.016), (0.0, t - 0.018), (-0.006, t - 0.003), (-0.02, t), (-0.03, t)]
    P, UV, _ = sweep(S, prof, X3, Z3, Y3, hfunc=lambda a, b, h: slab_bottom(b) + h)
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(S, c) + np.array([0, 1.0, 0]) * (c[1] > slab_bottom(c[2]) + t - 0.004) - np.array([0, 1.0, 0]) * (c[1] < slab_bottom(c[2]) + 0.004))
    sl.add('BODY_PAINT', P, UV)
    Si = offset_contour(S, -0.03)
    Pt, UVt = cap(Si, X3, Z3, Y3, h=t, hfunc=lambda a, b, h: slab_bottom(b) + h, facing=+1)
    sl.add('BODY_PAINT', Pt, UVt)
    Pb, UVb = cap(Si, X3, Z3, Y3, h=0.0, hfunc=lambda a, b, h: slab_bottom(b) + h, facing=-1)
    sl.add('BODY_PAINT', Pb, UVb)
    nodes.append(('top_canopy', 'canopy', sl))

    # ---- slab top surface along the edge: LEDs + ball / glove stickers (LED, glove, ball, glove, ...)
    f_back = arc_param_at(S, [0, D['slab_zback']])
    n_items = 40
    for k in range(n_items):
        f = (f_back + (k + 0.5) / n_items) % 1.0
        p, n = plan_point(S, f)
        if p[1] < D['slab_zback'] + 0.08:
            continue  # nothing on the straight back edge
        q = p - n * 0.068
        pos = np.array([q[0], slab_bottom(q[1]) + t, q[1]])
        up_dir = np.array([n[0], 0, n[1]])  # sticker 'up' points outwards
        nrm = np.array([0, 1.0, -D['slab_rise'] / SLAB_DEPTH]); nrm /= np.linalg.norm(nrm)
        kind = k % 4
        if kind == 0:
            leds['led_top'].bulb(pos, nrm, PALETTE[['white', 'pink', 'white', 'cyan', 'white', 'violet'][(k // 4) % 6]], r=0.018)
        elif kind == 2:
            sticker(stick, 'ball', pos, nrm, 0.068, 0.068, up=up_dir, offset=0.0012)
        else:
            sticker(stick, 'glove' if kind == 1 else 'glove_l', pos, nrm, 0.085, 0.062, up=up_dir, offset=0.0012)

    # ---- drum LEDs (lower ring) + stickers
    f_b = arc_param_at(C, [0, D['col_z0']])
    for k in range(30):
        f = (f_b + (k + 0.5) / 30) % 1.0
        p, n = plan_point(C, f)
        if p[1] < 0.05:
            continue
        leds['led_canopy'].bulb([p[0], y0 + 0.045, p[1]], [n[0], 0, n[1]], PALETTE[['green', 'cyan', 'white', 'green', 'pink'][k % 5]], r=0.0155)
    # banner zone (TOP FRONT) on the front of the drum
    f_front = arc_param_at(C, [0, D['drum_zc'] + D['drum_r']])
    arc_total = float(np.sum(np.linalg.norm(np.diff(np.vstack([C, C[:1]]), axis=0), axis=1)))
    span = BANNER_ARC / 2 / arc_total
    bn = Mesh('decal_top_front', smooth_angle=60)
    P, UV = contour_strip(C, f_front - span, f_front + span, BANNER_Y[0], BANNER_Y[1], 0.0016, nu=64, nv=6)
    bn.add('GFX_TOP_FRONT', P, UV)
    nodes.append(('decal_top_front', 'decals', bn))
    # side "BOXER" lightning decals (TOP SIDE zone) on the straight drum flanks
    for sx, nm in ((-1, 'decal_top_side_left'), (1, 'decal_top_side_right')):
        fa = arc_param_at(C, [sx * 0.34, -0.075], side_sign=sx)
        fb = arc_param_at(C, [sx * 0.42, 0.285], side_sign=sx)
        f0, f1 = (fa, fb) if fa < fb else (fb, fa)
        if f1 - f0 > 0.5:
            f0, f1 = f1, f0 + 1.0
        tm = Mesh(nm, smooth_angle=60)
        P, UV = contour_strip(C, f0, f1, 1.81, 1.99, 0.0016, nu=24, nv=6)
        tm.add('GFX_TOP_SIDE', P, UV)
        nodes.append((nm, 'decals', tm))
    # small stickers on the drum flanking the banner
    arc_total = float(np.sum(np.linalg.norm(np.diff(np.vstack([C, C[:1]]), axis=0), axis=1)))
    for df, kind, yy in ((-(span + 0.035), 'ball', 1.895), ((span + 0.035), 'ball', 1.895), (-(span + 0.055), 'glove', 1.96), ((span + 0.055), 'glove_l', 1.96)):
        p, n = plan_point(C, f_front + df)
        sticker(stick, kind, [p[0], yy, p[1]], [n[0], 0, n[1]], 0.05 if kind == 'ball' else 0.06, 0.05 if kind == 'ball' else 0.044)

    # ---- spotlights under the canopy
    for sx in (-1, 1):
        B = mat_translate(sx * 0.255, y0 - 0.0005, 0.6) @ mat_rot('x', 90)
        P, UV = lathe([(0.0, 0.0), (0.03, 0.0), (0.034, 0.003), (0.036, 0.0)], 24, M=mat_translate(sx * 0.255, y0, 0.6) @ mat_rot('x', 180))
        stick.add('METAL', P, UV)
        Pd, UVd = disc(0.028, 24, M=mat_translate(sx * 0.255, y0 - 0.0035, 0.6) @ mat_rot('x', 90))
        leds['led_spot'].mesh.add('LED_WHITE', Pd, UVd, np.ones((len(Pd), 3, 3)), np.full((len(Pd), 3), float(leds['led_spot'].count)))
        leds['led_spot'].count += 1
    return nodes


def build_boxer():
    nodes = []
    y0 = D['can_y0']
    bz = D['bag_z']; by = D['bag_y']; r = D['bag_r']
    # mount (black cup + metal plate in the slot ceiling)
    mt = Mesh('boxing_bag_mount', smooth_angle=40)
    P, UV = lathe([(0.0, 0.05), (0.06, 0.05), (0.06, 0.04), (0.045, 0.03), (0.038, -0.005), (0.0, -0.005)], 32, M=mat_translate(0, y0, bz))
    mt.add('BLACK_PLASTIC', P, UV)
    P = rounded_box_tris([-0.075, y0 + 0.044, bz - 0.09], [0.075, y0 + 0.05, bz + 0.05], 0.004, seg=2, step=1)
    mt.add('METAL', P)
    nodes.append(('boxing_bag_mount', 'boxer', mt))
    # sleeve (black leather with wrinkles)
    sv = Mesh('boxing_bag_sleeve', smooth_angle=70)
    prof = []
    ys = np.linspace(y0 + 0.002, by + r * 0.62, 26)
    for y in ys:
        t = min(max((y0 - y) / (y0 - (by + r * 0.62)), 0.0), 1.0)  # 0 top -> 1 bottom
        rad = 0.027 + 0.010 * t + 0.050 * t ** 4.0
        prof.append((rad, y))
    def wr(a, y, rr):
        t = min(max((y0 - y) / (y0 - (by + r * 0.62)), 0.0), 1.0)
        folds = 0.07 * math.sin(y * 52 + 0.8 * math.sin(a * 2 + 1.0)) * (0.3 + t)
        creases = 0.035 * math.sin(a * 3 + y * 8) + 0.02 * math.sin(a * 7 - y * 20)
        return rr * (1 + folds * (0.6 + 0.4 * math.cos(a * 2)) + creases * (1 - 0.6 * t))
    P, UV = lathe(prof, 40, M=mat_translate(0, 0, bz), radial_fn=wr)
    sv.add('LEATHER_BLACK', P, UV)
    nodes.append(('boxing_bag_sleeve', 'boxer', sv))
    # bag body: 6 gores, alternating red / black, small seam grooves
    bg = Mesh('boxing_bag', smooth_angle=50)
    ng = 6
    for g in range(ng):
        a0 = 2 * math.pi * g / ng - math.pi / ng * 0 ; a1 = 2 * math.pi * (g + 1) / ng
        prof = []
        for ph in np.linspace(0.12, math.pi, 22):
            rr = r * math.sin(ph) * (1.0 - 0.04 * math.cos(ph))
            yy = by + r * 1.06 * math.cos(ph)
            prof.append((rr, yy))
        def seam(a, y, rr, a0=a0, a1=a1):
            d = min(abs(a - a0), abs(a - a1))
            return rr * (1 - 0.018 * math.exp(-(d / 0.035) ** 2)) * (1 + 0.012 * math.sin(a * 3) * 0)
        P, UV = lathe(prof, 14, M=mat_translate(0, 0, bz), radial_fn=seam, a0=a0, a1=a1)
        bg.add('BOXING_BAG_RED' if g % 2 == 0 else 'BOXING_BAG_BLACK', P, UV)
    nodes.append(('boxing_bag', 'boxer', bg))
    return nodes


def build_kicker():
    nodes = []
    kx, ky, kz, kr = D['kb_x'], D['kb_y'], D['kb_z'], D['kb_r']
    ball = Mesh('kicker_ball', smooth_angle=80)
    # sphere rotated so a white panel faces the player
    P, UV = uv_sphere(kr, 64, 32, M=mat_translate(kx, ky, kz) @ mat_rot('y', -20))
    ball.add('BALL', P, UV)
    nodes.append(('kicker_ball', 'kicker', ball))
    arm = Mesh('kicker_body', smooth_angle=45)
    # ball socket block (behind/above ball)
    P = rounded_box_tris([kx + 0.02, ky - 0.065, kz - 0.085], [kx + 0.115, ky + 0.07, kz + 0.02], 0.012, seg=4, step=1)
    arm.add('LEATHER_BLACK', P)
    # padded arm (leather roll) along +X
    L0, L1 = kx + 0.10, 0.215
    ay, az = ky + 0.012, kz - 0.035
    prof = [(0.0, L0), (0.043, L0), (0.052, L0 + 0.01)]
    for xx in np.linspace(L0 + 0.02, L1 - 0.02, 8):
        prof.append((0.055, xx))
    prof += [(0.052, L1 - 0.01), (0.043, L1), (0.0, L1)]
    def rf(a, y, rr):
        return rr * (1 + 0.012 * math.sin(a * 6 + y * 40))
    P, UV = lathe(prof, 32, M=mat_translate(0, ay, az) @ mat_rot('z', -90), radial_fn=rf)
    arm.add('LEATHER_BLACK', P, UV)
    # arm end bracket + pivot plate fixed to the right wall of the recess
    P = rounded_box_tris([0.195, ay - 0.06, az - 0.06], [0.275, ay + 0.06, az + 0.055], 0.008, seg=4, step=1)
    arm.add('BLACK_PLASTIC', P)
    P = rounded_box_tris([0.27, ay - 0.10, az - 0.10], [0.295, ay + 0.10, az + 0.07], 0.006, seg=4, step=1)
    arm.add('BLACK_PLASTIC', P)
    for yy in (ay - 0.07, ay + 0.07):
        P, UV = lathe([(0, 0), (0.008, 0), (0.008, 0.004), (0, 0.005)], 12, M=mat_translate(0.27, yy, az - 0.015) @ mat_rot('z', 90))
        arm.add('METAL', P, UV)
    nodes.append(('kicker_body', 'kicker', arm))
    return nodes


# ----------------------------------------------------------------------------
def build_all():
    leds = {k: LedGroup(k) for k in ('led_top', 'led_canopy', 'led_front', 'led_left', 'led_right', 'led_lower',
                                     'led_side', 'led_back', 'led_kicker', 'led_spot')}
    stick = Mesh('decor_stickers', smooth_angle=30)
    det = Mesh('rear_details', smooth_angle=30)
    nodes = []
    nodes += build_platform()
    lb_nodes, zones, rb_lower = build_lower_body(leds, stick)
    nodes += lb_nodes
    col_nodes, rb_col = build_column(leds, stick)
    nodes += col_nodes
    nodes += build_canopy(leds, stick)
    nodes += build_boxer()
    nodes += build_kicker()
    build_back_details(rb_lower, det)
    # back logo zone on the column rear
    bl = Mesh('decal_back', smooth_angle=60)
    P, UV = quad([0, 1.64, D['col_z0'] - 0.0016], -X3, Y3, 0.54, 0.343)
    bl.add('GFX_BACK', P, UV)
    nodes.append(('decal_back', 'decals', bl))
    nodes.append(('decor_stickers', 'decals', stick))
    nodes.append(('rear_details', 'body', det))
    for k, g in leds.items():
        if g.count:
            nodes.append((k, 'leds', g.mesh))
    # honour the published overall height (219 cm): uniform scale of the whole reconstruction
    ymax = max(float(np.concatenate(gr['P']).reshape(-1, 3)[:, 1].max()) for _, _, m in nodes for gr in m.groups.values())
    S = TARGET_HEIGHT / ymax
    Ms = mat_scale(S)
    nodes = [(n, p, m.transformed(Ms)) for n, p, m in nodes]
    for g in leds.values():
        for it in g.items:
            it['pos'] = [c * S for c in it['pos']]
    global MODEL_SCALE
    MODEL_SCALE = S
    return nodes, leds


TARGET_HEIGHT = 2.19
MODEL_SCALE = 1.0
GROUPS = ['body', 'canopy', 'boxer', 'kicker', 'platform', 'decals', 'leds']

# Graphics zones -> meshes, physical size (w,h in m) used to size the canvas textures
ZONES = {
    'top_front':   dict(label='TOP FRONT',   material='GFX_TOP_FRONT',   meshes=['decal_top_front'], size=[0.77, 0.178]),
    'score':       dict(label='SCORE PANEL', material='GFX_SCORE',       meshes=['decal_score'], size=[0.469, 0.754]),
    'left':        dict(label='LEFT SIDE',   material='GFX_LEFT',        meshes=['decal_left'], size=[0.18, 0.89]),
    'right':       dict(label='RIGHT SIDE',  material='GFX_RIGHT',       meshes=['decal_right'], size=[0.18, 0.89]),
    'lower_front': dict(label='LOWER FRONT', material='GFX_LOWER_FRONT', meshes=['decal_lower_front'], size=[1.0, 0.74]),
    'kicker':      dict(label='KICKER PANEL', material='GFX_KICKER',     meshes=['decal_kicker_left', 'decal_kicker_right'], size=[0.365, 0.62]),
    'top_side':    dict(label='TOP SIDE',    material='GFX_TOP_SIDE',    meshes=['decal_top_side_left', 'decal_top_side_right'], size=[0.38, 0.18]),
    'back':        dict(label='BACK LOGO',   material='GFX_BACK',        meshes=['decal_back'], size=[0.54, 0.343]),
}
