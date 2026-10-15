"""
champion_model.py - parametric geometry of the PRO GAMES "Boxer Champion" boxing machine,
reconstructed from the reference photographs (front, left, right, 3/4, underside) and the
published dimensions (height 219 cm, footprint 72 x 115 cm).

Same conventions as double_strike_model.py: metres, glTF axes (Y up, +Z = machine front,
+X = machine right).  Used by build_champion_blend.py (Blender) and export_glb.py (preview).
"""
import math
import numpy as np
from meshlib import (Mesh, RoundedBox, sweep, cap, ring_cap, lathe, uv_sphere, quad, disc, box,
                     rounded_box_tris, convex_hull, fillet, resample_closed, ccw, offset_contour,
                     contour_normals, ray_polygon, mat_translate, mat_rot, mat_scale, look_basis,
                     apply, orient_with_uv, orient_volume, grid_tris)
from double_strike_model import (plan_point, arc_param_at, contour_strip, _outward_from_plan, LedGroup,
                                 X3, Y3, Z3)

D = dict(
    # platform (diamond plate on a thin black base, sloped front edge, small feet)
    plat_x=0.37, plat_z0=-0.20, plat_z1=0.95, plat_h=0.045, ramp=0.10,
    # column (flat, wide front with a red frame; graphics on both sides)
    col_x=0.31, col_z0=-0.14, col_z1=0.14, col_y0=0.045, col_y1=1.80, col_box_y1=1.866,
    frame_w=0.026, side_red=0.055, back_trim=0.016,
    # canopy: lower brim (red), graphics band (drum), top brim (red, tilted, flared)
    lb_y0=1.79, lb_y1=1.865, lb_x=0.36, lb_z1=0.84, lb_r=0.22,
    drum_x=0.335, drum_z1=0.87, drum_r=0.26,
    top_x=0.39, top_z0=-0.21, top_z1=1.00, top_r=0.30, top_y_back=2.035, top_rise=0.05, top_t=0.095,
    # punch bag
    bag_z=0.60, bag_y=1.47, bag_r=0.116,
)
TOP_DEPTH = D['top_z1'] - D['top_z0']
TARGET_HEIGHT = 2.19
MODEL_SCALE = 1.0


def top_bottom(z):
    return D['top_y_back'] + D['top_rise'] * (z - D['top_z0']) / TOP_DEPTH


def rrect_plan(x, z0, z1, r_front, r_back, n=220):
    pts = np.array([[-x, z0], [x, z0], [x, z1], [-x, z1]], float)
    pts = fillet(pts, lambda p: r_front if p[1] > (z0 + z1) / 2 else r_back, seg=16)
    return ccw(resample_closed(pts, n))


def neck_plan(n=260):
    """Lower brim outline: rounded front, concave 'neck' that runs into the column front."""
    x, cx = D['lb_x'], D['col_x']
    z0 = D['col_z1'] - 0.002
    zs = z0 + 0.16  # where the neck reaches full width
    side = []
    for t in np.linspace(0, 1, 14):
        # concave (ease-out) transition from column width to brim width
        s = 1 - (1 - t) ** 2
        side.append([cx + (x - cx) * s, z0 + (zs - z0) * t])
    right = np.array(side + [[x, D['lb_z1']]])
    left = right[::-1] * np.array([-1, 1])
    pts = np.vstack([[[-cx, z0]], [[cx, z0]], right[1:], left[:-1]])
    pts = fillet(pts, lambda p: D['lb_r'] if p[1] > D['lb_z1'] - 1e-6 else 0.0, seg=18)
    return ccw(resample_closed(pts, n))


DRUM_PLAN = rrect_plan(D['drum_x'], D['col_z0'], D['drum_z1'], D['drum_r'], 0.02)
TOP_PLAN = rrect_plan(D['top_x'], D['top_z0'], D['top_z1'], D['top_r'], 0.06)
LB_PLAN = neck_plan()

# ----------------------------------------------------------------------------
# Front panel pixel frame (front reference photo c_front.png)
#   x: 685 px/m around x=512 ; y: py 300 -> 1.80 m, py 1315 -> 0.045 m
# ----------------------------------------------------------------------------
FRONT_PX = dict(cx=512.0, ppm_x=685.0, py_top=300.0, y_top=1.80, py_bot=1315.0, y_bot=0.045)
FRONT_CROP = (318, 300, 706, 1315)  # graphic area inside the red frame


def fpx(px, py):
    f = FRONT_PX
    x = (px - f['cx']) / f['ppm_x']
    y = f['y_top'] + (py - f['py_top']) * (f['y_bot'] - f['y_top']) / (f['py_bot'] - f['py_top'])
    return x, y


SHIELD_HALF_PX = [(512, 333), (560, 333), (612, 334), (648, 337), (668, 352), (678, 380), (683, 420), (685, 470),
                  (685, 530), (684, 600), (678, 660), (665, 712), (645, 760), (615, 805), (577, 837), (542, 852), (512, 858)]


def shield_outline(n=200):
    right = [fpx(px, py) for px, py in SHIELD_HALF_PX]
    left = [(-x, y) for x, y in right[::-1]]
    pts = np.array(right + left[1:-1])
    return ccw(resample_closed(pts, n))


ATLAS_SIZE = 2048
ATLAS = {
    'coin': (0, 0, 256, 600),
    'rules': (300, 0, 700, 520),
    'bill': (720, 0, 1220, 180),
    'lock': (720, 220, 976, 476),
    'badge': (1000, 220, 1256, 476),
}


def atlas_uv(name, UV):
    x0, y0, x1, y1 = ATLAS[name]
    out = UV.copy()
    out[..., 0] = (x0 + UV[..., 0] * (x1 - x0)) / ATLAS_SIZE
    out[..., 1] = (y0 + UV[..., 1] * (y1 - y0)) / ATLAS_SIZE
    return out


SCREEN_ATLAS = {'score': (0, 0, 1024, 420), 'high': (0, 460, 560, 740), 'credit': (640, 460, 900, 740)}
SCREEN_TEXT = {'score': '777', 'high': '649', 'credit': '5'}

# graphics band (drum wrap) layout, in metres of arc: [left side | front | right side]
BAND_Y = (1.874, 2.03)


# ----------------------------------------------------------------------------
def build_platform():
    nodes = []
    x, z0, z1, h, ramp = D['plat_x'], D['plat_z0'], D['plat_z1'], D['plat_h'], D['ramp']
    base = Mesh('metal_platform', smooth_angle=30)
    # side profile (z, y) of the plate: flat top, sloped front ramp
    prof = [(z0, 0.012), (z0, h), (z1 - ramp, h), (z1, 0.012), (z1, 0.012)]
    # extrude the profile along X -> black base body (slightly inset) + diamond top
    def strip(p0, p1, xa, xb, mat, mesh, top=True):
        (za, ya), (zb, yb) = p0, p1
        P = np.array([[[xa, ya, za], [xb, ya, za], [xb, yb, zb]], [[xa, ya, za], [xb, yb, zb], [xa, yb, zb]]], float)
        L = math.hypot(zb - za, yb - ya)
        UV = np.array([[[xa * 3, 0], [xb * 3, 0], [xb * 3, L * 3]], [[xa * 3, 0], [xb * 3, L * 3], [xa * 3, L * 3]]])
        P, UV = orient_with_uv(P, UV, [0, 1.0, (1.0 if za > z1 - ramp - 1e-6 else 0.0)])
        mesh.add(mat, P, UV)
    dp = Mesh('diamond_plate', smooth_angle=20)
    for a, b in ((prof[1], prof[2]), (prof[2], prof[3])):
        strip(a, b, -x, x, 'DIAMOND_PLATE', dp)
    # black base: sides, back, bottom
    P = rounded_box_tris([-x - 0.002, 0.008, z0 - 0.002], [x + 0.002, h - 0.003, z1 - ramp], 0.003, seg=2, step=1)
    base.add('BLACK_PLASTIC', P)
    for sx in (-1, 1):  # side wedges under the ramp
        a = [sx * (x + 0.002), 0.008, z1 - ramp]; b = [sx * (x + 0.002), h - 0.003, z1 - ramp]; c = [sx * (x + 0.002), 0.008, z1]
        Pw, _ = orient_with_uv(np.array([[a, b, c]], float), np.zeros((1, 3, 2)), [sx, 0, 0])
        base.add('BLACK_PLASTIC', Pw)
    # diamond plate edge band (visible thickness) along both sides
    for sx in (-1, 1):
        Pq, UVq = quad([sx * (x + 0.0025), h - 0.001, (z0 + z1 - ramp) / 2], Z3 * -sx, Y3, z1 - ramp - z0, 0.006)
        dp.add('DIAMOND_PLATE', Pq, UVq * np.array([3, 0.05]))
    # feet
    for fx in (-x + 0.05, x - 0.05):
        for fz in (z0 + 0.05, z1 - ramp - 0.03):
            Pf, UVf = lathe([(0, 0), (0.018, 0), (0.018, 0.009), (0.0, 0.009)], 16, M=mat_translate(fx, 0.0, fz))
            base.add('RUBBER', Pf, UVf)
    nodes.append(('metal_platform', 'platform', base))
    nodes.append(('diamond_plate', 'platform', dp))
    return nodes


def build_column(stick):
    nodes = []
    cx, z0, z1, y0, y1 = D['col_x'], D['col_z0'], D['col_z1'], D['col_y0'], D['col_y1']
    rb = RoundedBox([-cx, y0, z0], [cx, D['col_box_y1'], z1], {'-x': 0.008, '+x': 0.008, '-z': 0.006, '+z': 0.01, '-y': 0.0, '+y': 0.0})
    m = Mesh('body_column', smooth_angle=40)
    def matfn(c, n, face):
        if abs(n[0]) > 0.3 and c[2] < z0 + D['back_trim']:
            return 'BLACK_PLASTIC'
        return None
    rb.build(m, 'BODY_PAINT', seg=8, step=0.12, skip=('-y', '+y'), matfn=matfn)
    nodes.append(('body_column', 'body', m))

    # raised red frame around the front graphic
    fr = Mesh('front_frame', smooth_angle=40)
    fw = D['frame_w']
    cont = np.array([[-cx + fw, y0 + 0.004], [cx - fw, y0 + 0.004], [cx - fw, y1 - 0.004], [-cx + fw, y1 - 0.004]])
    cont = ccw(resample_closed(fillet(cont, lambda p: 0.006, seg=4), 240))
    prof = [(0.0, 0.0), (0.0, 0.004), (0.004, 0.0075), (fw - 0.004, 0.0075), (fw + 0.001, 0.002), (fw + 0.002, 0.0)]
    P, UV, _ = sweep(cont, prof, X3, Y3, Z3, origin=[0, 0, z1])
    P, UV = orient_with_uv(P, UV, [0, 0, 1.0])
    fr.add('BODY_PAINT', P, UV)
    nodes.append(('front_frame', 'body', fr))

    # FRONT graphic (whole front panel inside the frame)
    fm = Mesh('decal_front', smooth_angle=60)
    xa, xb = -cx + fw - 0.001, cx - fw + 0.001
    Pq, UVq = quad([0, (y0 + y1) / 2, z1 + 0.0012], X3, Y3, xb - xa, y1 - y0, nx=4, ny=16)
    # UV from the photo frame so bezel / screens line up with the artwork
    xy = Pq.reshape(-1, 3)[:, :2]
    UVf = front_uv(xy).reshape(-1, 3, 2)
    fm.add('GFX_FRONT', Pq, UVf)
    nodes.append(('decal_front', 'decals', fm))

    # raised shield bezel around the score area
    sb = Mesh('score_panel', smooth_angle=50)
    sh = shield_outline()
    rim = 0.017
    prof = [(0.0, 0.0), (0.0, 0.010), (-0.004, 0.0165), (-rim / 2, 0.019), (-rim + 0.004, 0.0165), (-rim, 0.010), (-rim, 0.0)]
    P, UV, _ = sweep(sh, prof, X3, Y3, Z3, origin=[0, 0, z1 + 0.0012])
    P, UV = orient_volume(P, UV, [0, 1.2, z1 - 0.05])
    sb.add('BODY_PAINT', P, UV)
    nodes.append(('score_panel', 'body', sb))

    # LED displays
    sc = Mesh('screen_score', smooth_angle=10)
    def scr(px0, py0, px1, py1, region):
        xa_, ya_ = fpx(px0, py1); xb_, yb_ = fpx(px1, py0)
        w, h = xb_ - xa_, yb_ - ya_
        cx_, cy_ = (xa_ + xb_) / 2, (ya_ + yb_) / 2
        Pf = rounded_box_tris([cx_ - w / 2, cy_ - h / 2, z1 + 0.0005], [cx_ + w / 2, cy_ + h / 2, z1 + 0.004], 0.002, seg=2, step=1)
        sc.add('BLACK_PLASTIC', Pf)
        Pq, UVq = quad([cx_, cy_, z1 + 0.0042], X3, Y3, w * 0.94, h * 0.86)
        u0, v0, u1, v1 = [c / 1024.0 for c in SCREEN_ATLAS[region]]
        UVq[..., 0] = u0 + UVq[..., 0] * (u1 - u0); UVq[..., 1] = v0 + UVq[..., 1] * (v1 - v0)
        sc.add('SCREEN', Pq, UVq)
    scr(430, 515, 596, 583, 'score')
    scr(467, 612, 558, 657, 'high')
    scr(499, 680, 527, 703, 'credit')
    nodes.append(('screen_score', 'body', sc))

    # coin acceptor, rules plate, bill slot
    ca = Mesh('coin_acceptor', smooth_angle=40)
    (xa_, ya_), (xb_, yb_) = fpx(335, 848), fpx(376, 755)
    Pf = rounded_box_tris([xa_, ya_, z1 - 0.004], [xb_, yb_, z1 + 0.010], 0.004, seg=4, step=1)
    ca.add('METAL', Pf)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0103], X3, Y3, (xb_ - xa_) * 0.96, (yb_ - ya_) * 0.97)
    ca.add('DECALS', Pq, atlas_uv('coin', UVq))
    (xa_, ya_), (xb_, yb_) = fpx(636, 853), fpx(703, 770)
    Pr = rounded_box_tris([xa_, ya_, z1 - 0.001], [xb_, yb_, z1 + 0.004], 0.003, seg=4, step=1)
    ca.add('BLACK_PLASTIC', Pr)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0043], X3, Y3, (xb_ - xa_) * 0.97, (yb_ - ya_) * 0.97)
    ca.add('DECALS', Pq, atlas_uv('rules', UVq))
    (xa_, ya_), (xb_, yb_) = fpx(563, 926), fpx(637, 899)
    Pb = rounded_box_tris([xa_, ya_, z1 - 0.002], [xb_, yb_, z1 + 0.012], 0.004, seg=4, step=1)
    ca.add('BLACK_PLASTIC', Pb)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0123], X3, Y3, (xb_ - xa_) * 0.95, (yb_ - ya_) * 0.9)
    ca.add('DECALS', Pq, atlas_uv('bill', UVq))
    nodes.append(('coin_acceptor', 'body', ca))

    # door latch on the right side of the red front frame
    lt = Mesh('door_latch', smooth_angle=40)
    P = rounded_box_tris([cx - 0.002, 0.93, z1 - 0.045], [cx + 0.012, 1.07, z1 - 0.022], 0.003, seg=4, step=1)
    lt.add('BLACK_PLASTIC', P)
    nodes.append(('door_latch', 'body', lt))

    # SIDE graphics (column sides, between the black back trim and the red front band)
    for side, nm, mat in (('-x', 'decal_left', 'GFX_LEFT'), ('+x', 'decal_right', 'GFX_RIGHT')):
        dm = Mesh(nm, smooth_angle=60)
        P, UV = rb.decal_grid(side, y0 + 0.002, D['col_box_y1'] - 0.004, z0 + D['back_trim'], z1 - D['side_red'], offset=0.0012, na=24, nb=4)
        dm.add(mat, P, UV)
        nodes.append((nm, 'decals', dm))
    # screws along the black back trim
    for sx in (-1, 1):
        for yy in np.linspace(0.12, 1.72, 12):
            Ps, UVs = lathe([(0, 0), (0.0035, 0), (0.0035, 0.001), (0, 0.0016)], 10,
                            M=look_basis(np.array([sx * (cx + 0.0005), yy, z0 + 0.008]), [sx, 0, 0]) @ mat_rot('x', 90))
            stick.add('METAL', Ps, UVs)
    return nodes, rb


def front_uv(xy):
    """front panel metres -> UV of the front graphic texture (photo crop FRONT_CROP)."""
    f = FRONT_PX
    px = xy[:, 0] * f['ppm_x'] + f['cx']
    py = f['py_top'] + (xy[:, 1] - f['y_top']) * (f['py_bot'] - f['py_top']) / (f['y_bot'] - f['y_top'])
    x0, y0, x1, y1 = FRONT_CROP
    return np.stack([(px - x0) / (x1 - x0), (py - y0) / (y1 - y0)], 1)


def build_canopy(leds, stick):
    nodes = []
    y0, y1 = D['lb_y0'], D['lb_y1']
    # ---- lower brim (red) with concave neck into the column
    lb = Mesh('top_canopy_lower', smooth_angle=40)
    C = LB_PLAN
    prof = [(-0.03, 0.0), (-0.016, 0.0), (-0.004, 0.004), (0.0, 0.018), (0.0, y1 - y0 - 0.008), (-0.006, y1 - y0)]
    P, UV, _ = sweep(C, prof, X3, Z3, Y3, origin=[0, y0, 0])
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(C, c) + np.array([0, -0.4, 0]))
    lb.add('BODY_PAINT', P, UV)
    Pt, UVt = cap(offset_contour(C, -0.006), X3, Z3, Y3, origin=[0, y1, 0], facing=+1, center=[0, 0.5])
    lb.add('BODY_PAINT', Pt, UVt)
    # underside with the bag opening
    oc = np.array([0.0, 0.52])
    angs = np.linspace(0, 2 * math.pi, 180, endpoint=False)
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    hole = oc + dirs * np.array([0.165, 0.215])
    rout = ray_polygon(oc, angs, offset_contour(C, -0.03))
    outer = oc + dirs * rout[:, None]
    Pu, UVu = ring_cap(outer, hole, X3, Z3, Y3, origin=[0, y0, 0], facing=-1)
    lb.add('BODY_PAINT', Pu, UVu)
    walls = []
    for i in range(len(hole)):
        j = (i + 1) % len(hole)
        a = [hole[i][0], y0, hole[i][1]]; b = [hole[j][0], y0, hole[j][1]]
        c = [hole[j][0], y0 + 0.07, hole[j][1]]; d = [hole[i][0], y0 + 0.07, hole[i][1]]
        walls += [[a, b, c], [a, c, d]]
    Pw = np.array(walls)
    Pw, _ = orient_with_uv(Pw, np.zeros((len(Pw), 3, 2)), lambda c: np.array([oc[0] - c[0], 0, oc[1] - c[2]]))
    lb.add('BLACK_PLASTIC', Pw)
    Pc, UVc = cap(hole, X3, Z3, Y3, origin=[0, y0 + 0.07, 0], facing=-1, center=oc)
    lb.add('BLACK_PLASTIC', Pc, UVc)
    # concave fillet where the brim underside meets the column front
    r = 0.06
    zc1 = D['col_z1']
    G = []
    for xx in (-D['col_x'], D['col_x']):
        row = []
        for t in np.linspace(0, math.pi / 2, 10):
            row.append([xx, y0 - r + r * math.sin(t), zc1 + r - r * math.cos(t)])
        G.append(row)
    G = np.array(G)
    Pf, UVf = grid_tris(G, np.zeros(G.shape[:2] + (2,)))
    Pf, UVf = orient_with_uv(Pf, UVf, [0, -1.0, 1.0])
    lb.add('BODY_PAINT', Pf, None)
    for sx in (-1, 1):
        tri = []
        arc = G[0 if sx < 0 else 1]
        corner = [sx * D['col_x'], y0, zc1]
        for k in range(len(arc) - 1):
            tri.append([corner, arc[k], arc[k + 1]])
        Pt2, _ = orient_with_uv(np.array(tri), np.zeros((len(tri), 3, 2)), [sx, 0, 0])
        lb.add('BODY_PAINT', Pt2)
    nodes.append(('top_canopy_lower', 'canopy', lb))

    # ---- graphics band (drum)
    dr = Mesh('top_canopy_drum', smooth_angle=40)
    Cd = DRUM_PLAN
    Nn = contour_normals(Cd)
    rows = []
    for (off, yy) in ((-0.02, y1 - 0.002), (0.0, y1 - 0.002), (0.0, None)):
        row = []
        for i in range(len(Cd)):
            a, b = Cd[i] + Nn[i] * off
            row.append([a, top_bottom(b) + 0.005 if yy is None else yy, b])
        rows.append(row)
    G = np.array(rows)
    G = np.concatenate([G, G[:, :1]], 1).transpose(1, 0, 2)
    P, UV = grid_tris(G, np.zeros(G.shape[:2] + (2,)))
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(Cd, c))
    dr.add('BODY_PAINT', P, None)
    nodes.append(('top_canopy_drum', 'canopy', dr))
    # band decal: wraps from the back-left, around the front, to the back-right
    fL = arc_param_at(Cd, [-D['drum_x'], D['col_z0'] + 0.03], side_sign=-1)
    fR = arc_param_at(Cd, [D['drum_x'], D['col_z0'] + 0.03], side_sign=1)
    fF = arc_param_at(Cd, [0, D['drum_z1']])
    a, b = fL, fR
    def between(f0, f1, f):
        return (f - f0) % 1.0 < (f1 - f0) % 1.0
    if not between(a, b, fF):
        a, b = b, a
    if b < a:
        b += 1.0
    bm = Mesh('decal_band', smooth_angle=60)
    P, UV = contour_strip(Cd, a, b, BAND_Y[0], BAND_Y[1], 0.0016, nu=220, nv=6)
    bm.add('GFX_BAND', P, UV)
    nodes.append(('decal_band', 'decals', bm))

    # ---- top brim (red, flared lip, tilted up towards the front)
    tb = Mesh('top_canopy', smooth_angle=40)
    S = TOP_PLAN
    t = D['top_t']
    prof = [(-0.05, 0.0), (-0.02, 0.0), (-0.006, 0.003), (0.0, 0.016), (0.022, t - 0.02), (0.027, t - 0.008),
            (0.02, t), (-0.004, t), (-0.05, t)]
    P, UV, _ = sweep(S, prof, X3, Z3, Y3, hfunc=lambda a_, b_, h: top_bottom(b_) + h)
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(S, c))
    tb.add('BODY_PAINT', P, UV)
    Si = offset_contour(S, -0.05)
    Pt, UVt = cap(Si, X3, Z3, Y3, h=t, hfunc=lambda a_, b_, h: top_bottom(b_) + h, facing=+1)
    tb.add('BODY_PAINT', Pt, UVt)
    Pb, UVb = cap(Si, X3, Z3, Y3, h=0.0, hfunc=lambda a_, b_, h: top_bottom(b_) + h, facing=-1)
    tb.add('BODY_PAINT', Pb, UVb)
    nodes.append(('top_canopy', 'canopy', tb))

    # ---- details: spot lights, chrome lock, small violet LEDs at the brim front corners
    for sx in (-1, 1):
        Pm, UVm = lathe([(0.0, 0.0), (0.03, 0.0), (0.034, 0.003), (0.036, 0.0)], 24, M=mat_translate(sx * 0.215, y0, 0.70) @ mat_rot('x', 180))
        stick.add('METAL', Pm, UVm)
        Pd, UVd = disc(0.027, 24, M=mat_translate(sx * 0.215, y0 - 0.0035, 0.70) @ mat_rot('x', 90))
        leds['led_spot'].mesh.add('LED_WHITE', Pd, UVd, np.ones((len(Pd), 3, 3)), np.full((len(Pd), 3), float(leds['led_spot'].count)))
        leds['led_spot'].count += 1
    p, n = plan_point(C, arc_param_at(C, [0, D['lb_z1']]))
    lock_pos = np.array([p[0], (y0 + y1) / 2, p[1]])
    Pl, UVl = lathe([(0.0, 0.0), (0.017, 0.0), (0.017, 0.006), (0.013, 0.009), (0.0, 0.009)], 24,
                    M=look_basis(lock_pos, [n[0], 0, n[1]]) @ mat_rot('x', 90))
    stick.add('METAL', Pl, UVl)
    Pk, UVk = disc(0.0115, 24, M=look_basis(lock_pos + np.array([0, 0, 0.0095]), [0, 0, 1]))
    stick.add('DECALS', Pk, atlas_uv('lock', UVk))
    for sx in (-1, 1):
        f = arc_param_at(S, [sx * (D['top_x'] - 0.09), D['top_z1'] - 0.02])
        p, n = plan_point(S, f)
        leds['led_top'].bulb([p[0] + n[0] * 0.012, top_bottom(p[1]) + 0.03, p[1] + n[1] * 0.012], [n[0], 0.2, n[1]],
                             (0.78, 0.45, 1.0), r=0.011, h=0.007)
    return nodes


def build_boxer():
    nodes = []
    y0 = D['lb_y0']
    bz, by, r = D['bag_z'], D['bag_y'], D['bag_r']
    mt = Mesh('boxing_bag_mount', smooth_angle=40)
    P, UV = lathe([(0.0, 0.07), (0.055, 0.07), (0.055, 0.06), (0.04, 0.045), (0.034, 0.0), (0.0, 0.0)], 32, M=mat_translate(0, y0, bz))
    mt.add('BLACK_PLASTIC', P, UV)
    P = rounded_box_tris([-0.07, y0 + 0.064, bz - 0.08], [0.07, y0 + 0.07, bz + 0.06], 0.004, seg=2, step=1)
    mt.add('METAL', P)
    nodes.append(('boxing_bag_mount', 'boxer', mt))
    # sleeve: long black leather with soft folds, collar over the ball
    sv = Mesh('boxing_bag_sleeve', smooth_angle=70)
    ytop, ybot = y0 + 0.004, by + r * 0.60
    prof = []
    for yy in np.linspace(ytop, ybot, 30):
        tt = (ytop - yy) / (ytop - ybot)
        rad = 0.028 + 0.012 * tt + 0.048 * tt ** 4.5
        prof.append((rad, yy))
    def wr(a, yy, rr):
        tt = min(max((ytop - yy) / (ytop - ybot), 0.0), 1.0)
        folds = 0.075 * math.sin(yy * 46 + 0.9 * math.sin(a * 2 + 0.7)) * (0.35 + tt)
        creases = 0.04 * math.sin(a * 3 + yy * 7) + 0.022 * math.sin(a * 7 - yy * 19)
        return rr * (1 + folds * (0.55 + 0.45 * math.cos(a * 2)) + creases * (1 - 0.5 * tt))
    P, UV = lathe(prof, 44, M=mat_translate(0, 0, bz), radial_fn=wr)
    sv.add('LEATHER_BLACK', P, UV)
    nodes.append(('boxing_bag_sleeve', 'boxer', sv))
    # ball: 8 gores alternating red / black, stitched seams, black bottom cap
    bg = Mesh('boxing_bag', smooth_angle=50)
    ng = 8
    for g in range(ng):
        a0 = 2 * math.pi * g / ng + math.pi / ng; a1 = 2 * math.pi * (g + 1) / ng + math.pi / ng
        prof = []
        for ph in np.linspace(0.10, math.pi * 0.86, 22):
            rr = r * math.sin(ph) * (1.0 - 0.035 * math.cos(ph))
            prof.append((rr, by + r * 1.05 * math.cos(ph)))
        def seam(a, yy, rr, a0=a0, a1=a1):
            d = min(abs(a - a0), abs(a - a1))
            return rr * (1 - 0.02 * math.exp(-(d / 0.03) ** 2))
        P, UV = lathe(prof, 12, M=mat_translate(0, 0, bz), radial_fn=seam, a0=a0, a1=a1)
        bg.add('BOXING_BAG_RED' if g % 2 == 0 else 'BOXING_BAG_BLACK', P, UV)
    capprof = [(r * math.sin(ph) * 1.002, by + r * 1.05 * math.cos(ph)) for ph in np.linspace(math.pi * 0.86, math.pi, 6)]
    P, UV = lathe(capprof, 32, M=mat_translate(0, 0, bz))
    bg.add('BOXING_BAG_BLACK', P, UV)
    nodes.append(('boxing_bag', 'boxer', bg))
    return nodes


def build_all():
    global MODEL_SCALE
    leds = {k: LedGroup(k) for k in ('led_top', 'led_spot')}
    stick = Mesh('decor_details', smooth_angle=30)
    nodes = []
    nodes += build_platform()
    col_nodes, rb = build_column(stick)
    nodes += col_nodes
    nodes += build_canopy(leds, stick)
    nodes += build_boxer()
    nodes.append(('decor_details', 'decals', stick))
    for k, g in leds.items():
        if g.count:
            nodes.append((k, 'leds', g.mesh))
    ymax = max(float(np.concatenate(gr['P']).reshape(-1, 3)[:, 1].max()) for _, _, m in nodes for gr in m.groups.values())
    S = TARGET_HEIGHT / ymax
    nodes = [(n, p, m.transformed(mat_scale(S))) for n, p, m in nodes]
    MODEL_SCALE = S
    return nodes, leds


GROUPS = ['body', 'canopy', 'boxer', 'platform', 'decals', 'leds']

ZONES = {
    'front': dict(label='FRONT PANEL', material='GFX_FRONT', meshes=['decal_front'], size=[0.566, 1.755]),
    'band': dict(label='CANOPY BAND', material='GFX_BAND', meshes=['decal_band'], size=[2.41, 0.156]),
    'left': dict(label='LEFT SIDE', material='GFX_LEFT', meshes=['decal_left'], size=[0.209, 1.815]),
    'right': dict(label='RIGHT SIDE', material='GFX_RIGHT', meshes=['decal_right'], size=[0.209, 1.815]),
}
