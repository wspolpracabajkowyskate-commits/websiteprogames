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

# Dimensions from a joint bundle adjustment of four calibrated photos (IMG_0507, 0508, 0516, 0571;
# iPhone 15 Pro, known focal length) with ~1000 matched points on the front panel; height 2.19 m
# (top of the lid) is the scale reference.  See blender/src/calib/.
D = dict(
    # platform: diamond plate on a black steel frame, a little wider than the column, ramp at the front
    plat_x=0.345, plat_z0=-0.175, plat_z1=0.868, plat_h=0.045, ramp=0.10, chamfer=0.012,
    # column: flat graphic front, rounded red corner rails, graphics on both sides, red back with doors
    col_x=0.3225, col_z0=-0.158, col_z1=0.15, col_y0=0.045, col_y1=1.80, col_box_y1=1.91,
    frame_w=0.036, side_red=0.042, back_trim=0.028,
    # canopy: lower brim (red) with a 'chin' that runs down into the score shield,
    # graphics band (drum), lid (thin flared shell)
    lb_y0=1.84, lb_y1=1.91, lb_x=0.331, lb_z1=0.898, lb_r=0.24,
    chin_y=1.77, chin_z=0.31,
    drum_x=0.331, drum_z1=0.902, drum_r=0.25,
    top_x=0.425, top_xb=0.40, top_z0=-0.215, top_z1=1.02, top_r=0.40, top_y_back=2.103, top_rise=0.04, top_y=2.19,
    # punch bag (folded up into the canopy, as the machine stands when idle)
    bag_r=0.116, pivot=(0.0, 1.985, 0.76), ball=(0.0, 1.925, 0.46),
    # slot in the brim underside the bag folds into
    slot_x=0.19, slot_z0=0.33, slot_z1=0.75,
    # canopy down-lights
    light_x=0.152, light_z=0.674,
)
TOP_DEPTH = D['top_z1'] - D['top_z0']
TARGET_HEIGHT = 2.19
MODEL_SCALE = 1.0


def top_bottom(z, x=0.0):
    """Height of the lid underside where it meets the graphics band (measured on 4 photos):
    level ~2.097 m along the sides and back, rising to ~2.132 m at the front centre."""
    t = min(max((z - 0.60) / 0.28, 0.0), 1.0)
    t = t * t * (3 - 2 * t)
    return 2.097 + 0.035 * math.exp(-(x / 0.2) ** 2) * t


def chin_low(x):
    """Lowest point of the chin at the column front: the shield top in the middle, rising in an arc
    to the brim at the corner rails (measured on the rectified front photo)."""
    ax = abs(x)
    if ax <= 0.25:
        return D['chin_y']
    t = min((ax - 0.25) / (D['col_x'] - 0.25), 1.0)
    return D['chin_y'] + (D['lb_y0'] - D['chin_y']) * (1.0 - math.sqrt(max(1.0 - t * t, 0.0)))


def brim_bottom(z, x=0.0):
    """Underside height of the lower brim: flat, with a concave 'chin' between the rails that runs
    down into the score shield."""
    zf = D['col_z1'] + 0.021          # the chin lands on the front of the shield bezel
    t = (D['chin_z'] - z) / (D['chin_z'] - zf)
    t = min(max(t, 0.0), 1.0)
    return D['lb_y0'] - (D['lb_y0'] - chin_low(x)) * (1.0 - math.sqrt(max(1.0 - t * t, 0.0)))


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
def lid_plan(n=240):
    """Lid outline: narrower at the back, flaring out towards the rounded front."""
    xb, xf, z0, z1 = D['top_xb'], D['top_x'], D['top_z0'], D['top_z1']
    pts = np.array([[-xb, z0], [xb, z0], [xf, z1], [-xf, z1]], float)
    pts = fillet(pts, lambda p: D['top_r'] if p[1] > (z0 + z1) / 2 else 0.06, seg=16)
    return ccw(resample_closed(pts, n))


TOP_PLAN = lid_plan()
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


# Score shield (outer edge of the red bezel), measured on the rectified front photo
# (x half-width at height y, metres).  Top edge disappears into the brim chin.
SHIELD_HW = [(1.775, 0.280), (1.76, 0.275), (1.74, 0.265), (1.72, 0.260), (1.70, 0.254), (1.68, 0.248), (1.66, 0.242),
             (1.64, 0.236), (1.62, 0.231), (1.60, 0.229), (1.58, 0.228), (1.56, 0.228), (1.54, 0.233), (1.52, 0.236),
             (1.50, 0.240), (1.48, 0.245), (1.46, 0.249), (1.44, 0.253), (1.42, 0.256), (1.40, 0.261), (1.38, 0.267),
             (1.36, 0.270), (1.34, 0.272), (1.32, 0.274), (1.30, 0.275), (1.27, 0.275), (1.24, 0.273), (1.21, 0.271),
             (1.18, 0.266), (1.15, 0.261), (1.12, 0.252), (1.10, 0.246), (1.08, 0.238), (1.06, 0.228), (1.04, 0.218),
             (1.02, 0.206), (1.00, 0.193), (0.98, 0.176), (0.96, 0.152), (0.94, 0.115), (0.92, 0.062), (0.905, 0.0)]


def shield_outline(n=220):
    right = [(hw, y) for y, hw in SHIELD_HW]
    left = [(-x, y) for x, y in right[::-1]]
    pts = np.array(right + left[1:])
    return ccw(resample_closed(pts, n))


# front panel features (metres, x right / y up), measured on the same photo
FRONT_GFX = dict(x0=-0.335, x1=0.335, y0=0.045, y1=1.85)
SCREENS = {'score': (-0.137, 1.313, 0.129, 1.431), 'high': (-0.077, 1.187, 0.071, 1.265), 'credit': (-0.023, 1.120, 0.019, 1.153)}
COIN = (-0.278, 0.856, -0.204, 0.980)
RULES = (0.211, 0.822, 0.303, 0.963)


ATLAS_SIZE = 2048
ATLAS = {
    'coin': (0, 0, 288, 512),
    'rules': (300, 0, 700, 612),
    'lock': (720, 220, 976, 476),
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
BAND_Y = (1.906, 2.135)   # printed band; along the sides its upper edge disappears under the lid


# ----------------------------------------------------------------------------
def build_platform():
    """Diamond plate on a black steel frame: as wide as the column, chamfered side edges,
    long ramp at the front, the column stands on its back part."""
    nodes = []
    x, z0, z1, h, ramp, ch = D['plat_x'], D['plat_z0'], D['plat_z1'], D['plat_h'], D['ramp'], D['chamfer']
    zr = z1 - ramp
    base = Mesh('metal_platform', smooth_angle=30)
    dp = Mesh('diamond_plate', smooth_angle=20)
    K = 5.4   # 5-bar tread: ~14 cells across the 69 cm plate, as on the real platform

    def plate(P, up):
        P = np.array(P, float)
        UV = np.stack([P[..., 0] * K, P[..., 2] * K], -1)
        P, UV = orient_with_uv(P, UV, up)
        dp.add('DIAMOND_PLATE', P, UV)

    xi = x - ch
    # flat top
    a, b, c, d = [-xi, h, z0 + ch], [xi, h, z0 + ch], [xi, h, zr], [-xi, h, zr]
    plate([[a, b, c], [a, c, d]], [0, 1, 0])
    # front ramp (full width)
    a, b, c, d = [-xi, h, zr], [xi, h, zr], [x, 0.006, z1], [-x, 0.006, z1]
    plate([[a, b, c], [a, c, d]], [0, 1, 0.4])
    # side + back chamfers (folded plate edge)
    for sx in (-1, 1):
        a, b, c, d = [sx * xi, h, z0 + ch], [sx * x, h - ch, z0], [sx * x, h - ch, zr], [sx * xi, h, zr]
        plate([[a, b, c], [a, c, d]], [sx, 1, 0])
        # ramp corner (keeps the chamfer running into the ramp edge)
        e = [sx * x, 0.006, z1]
        plate([[d, c, e], [d, e, [sx * xi, h, zr]]], [sx, 1, 0.3])
    a, b, c, d = [-xi, h, z0 + ch], [xi, h, z0 + ch], [x, h - ch, z0], [-x, h - ch, z0]
    plate([[a, b, c], [a, c, d]], [0, 1, -1])
    # black steel frame under the plate
    P = rounded_box_tris([-x + 0.002, 0.004, z0 + 0.002], [x - 0.002, h - ch + 0.0005, zr], 0.003, seg=2, step=1)
    base.add('BLACK_STEEL', P)
    for sx in (-1, 1):  # side wedges under the ramp
        a = [sx * (x - 0.002), 0.004, zr]; b = [sx * (x - 0.002), h - ch, zr]; c = [sx * (x - 0.002), 0.004, z1 - 0.004]
        Pw, _ = orient_with_uv(np.array([[a, b, c]], float), np.zeros((1, 3, 2)), [sx, 0, 0])
        base.add('BLACK_STEEL', Pw)
    # rubber feet
    for fx in (-x + 0.05, x - 0.05):
        for fz in (z0 + 0.05, zr - 0.03):
            Pf, UVf = lathe([(0, 0), (0.018, 0), (0.018, 0.006), (0.0, 0.006)], 16, M=mat_translate(fx, 0.0, fz))
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
            return 'BLACK_STEEL'
        if n[2] < -0.3 and abs(c[0]) > cx - D['back_trim']:
            return 'BLACK_STEEL'
        return None
    rb.build(m, 'BODY_PAINT', seg=8, step=0.12, skip=('-y', '+y'), matfn=matfn)
    nodes.append(('body_column', 'body', m))
    nodes += build_back(stick)

    # rounded red corner rails: run up both front edges and bend forward into the brim 'chin'
    fr = Mesh('front_frame', smooth_angle=50)
    for sx in (-1, 1):
        fr.add('BODY_PAINT', *corner_rail(sx))
    nodes.append(('front_frame', 'body', fr))

    fw = D['frame_w']
    # FRONT graphic (whole front panel between the corner rails)
    fm = Mesh('decal_front', smooth_angle=60)
    G = FRONT_GFX
    Pq, UVq = quad([(G['x0'] + G['x1']) / 2, (G['y0'] + G['y1']) / 2, z1 + 0.0012], X3, Y3, G['x1'] - G['x0'], G['y1'] - G['y0'], nx=4, ny=16)
    xy = Pq.reshape(-1, 3)[:, :2]
    UVf = np.stack([(xy[:, 0] - G['x0']) / (G['x1'] - G['x0']), (G['y1'] - xy[:, 1]) / (G['y1'] - G['y0'])], 1).reshape(-1, 3, 2)
    fm.add('GFX_FRONT', Pq, UVf)
    nodes.append(('decal_front', 'decals', fm))

    # raised shield bezel around the score area
    sb = Mesh('score_panel', smooth_angle=50)
    sh = shield_outline()
    rim = 0.022
    prof = [(0.003, 0.0), (0.002, 0.009), (-0.003, 0.016), (-rim / 2, 0.019), (-rim + 0.004, 0.016), (-rim, 0.008), (-rim - 0.001, 0.0)]
    P, UV, _ = sweep(sh, prof, X3, Y3, Z3, origin=[0, 0, z1 + 0.0012])
    P, UV = orient_volume(P, UV, [0, 1.2, z1 - 0.05])
    sb.add('BODY_PAINT', P, UV)
    nodes.append(('score_panel', 'body', sb))

    # LED displays: flush behind the acrylic, lit digits on top of the printed windows
    sc = Mesh('screen_score', smooth_angle=10)
    for region, (xa_, ya_, xb_, yb_) in SCREENS.items():
        Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0022], X3, Y3, (xb_ - xa_) * 0.97, (yb_ - ya_) * 0.92)
        u0, v0, u1, v1 = [c / 1024.0 for c in SCREEN_ATLAS[region]]
        UVq[..., 0] = u0 + UVq[..., 0] * (u1 - u0); UVq[..., 1] = v0 + UVq[..., 1] * (v1 - v0)
        sc.add('SCREEN', Pq, UVq)
    nodes.append(('screen_score', 'body', sc))

    # coin mechanism (black face plate with red reject button) and the game-rules plate
    ca = Mesh('coin_acceptor', smooth_angle=40)
    xa_, ya_, xb_, yb_ = COIN
    Pf = rounded_box_tris([xa_, ya_, z1 - 0.004], [xb_, yb_, z1 + 0.012], 0.003, seg=4, step=1)
    ca.add('BLACK_PLASTIC', Pf)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0123], X3, Y3, (xb_ - xa_) * 0.97, (yb_ - ya_) * 0.98)
    ca.add('DECALS', Pq, atlas_uv('coin', UVq))
    bx, by = xa_ + (xb_ - xa_) * 0.55, ya_ + (yb_ - ya_) * 0.68
    Pb = rounded_box_tris([bx - 0.011, by - 0.007, z1 + 0.011], [bx + 0.011, by + 0.007, z1 + 0.019], 0.002, seg=3, step=1)
    ca.add('BUTTON_RED', Pb)
    xa_, ya_, xb_, yb_ = RULES
    Pr = rounded_box_tris([xa_, ya_, z1 - 0.001], [xb_, yb_, z1 + 0.004], 0.002, seg=3, step=1)
    ca.add('BLACK_PLASTIC', Pr)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0043], X3, Y3, (xb_ - xa_) * 0.98, (yb_ - ya_) * 0.98)
    ca.add('DECALS', Pq, atlas_uv('rules', UVq))
    nodes.append(('coin_acceptor', 'body', ca))

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


def corner_rail(sx, n_vert=40):
    """Sweep of the rounded corner bead along: front edge (vertical) -> chin curve -> brim underside."""
    cx, z1 = D['col_x'], D['col_z1']
    rr = 0.035
    yb = D['lb_y0'] - rr
    path = [(y, z1) for y in np.linspace(D['col_y0'], yb, n_vert)]
    for a in np.linspace(0, math.pi / 2, 12)[1:]:
        path.append((yb + rr * math.sin(a), z1 + rr * (1 - math.cos(a))))
    for z in np.linspace(z1 + rr, D['lb_z1'] - D['lb_r'], 16)[1:]:
        path.append((D['lb_y0'], z))
    path = np.array(path)
    # cross-section (q: outward along x, p: along the front-facing normal)
    fw = D['frame_w']
    sec = [(-fw, 0.0), (-fw, 0.003), (-fw + 0.006, 0.0068), (-0.016, 0.0085), (-0.009, 0.0088)]
    cq, cp, r = -0.004, -0.004, 0.0125
    for ang in np.linspace(math.pi / 2, 0, 9)[1:]:
        sec.append((cq + r * math.cos(ang), cp + r * math.sin(ang)))
    sec += [(0.0085, -0.012), (0.0072, -0.034), (0.003, -0.042), (0.0, -0.043)]
    sec = np.array(sec)
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))])
    G = np.zeros((len(path), len(sec), 3)); UV = np.zeros(G.shape[:2] + (2,)); axis = []
    cen = sec.mean(0)
    for i, (y, z) in enumerate(path):
        j0, j1 = max(i - 1, 0), min(i + 1, len(path) - 1)
        t = path[j1] - path[j0]; t = t / np.linalg.norm(t)          # (dy, dz)
        nf = np.array([0.0, -t[1], t[0]])                             # front-facing normal
        k = min(1.0, (L[-1] - L[i]) / 0.08)                          # taper out under the brim
        k = 0.15 + 0.85 * k
        o = np.array([sx * cx, y, z])
        for j, (q, pp) in enumerate(sec):
            G[i, j] = o + np.array([sx * q * k, 0, 0]) + nf * pp * k
            UV[i, j] = [L[i] * 2, j / len(sec)]
        axis.append(o + np.array([sx * cen[0], 0, 0]) + nf * cen[1])
    P, UVt = grid_tris(G, UV)
    axis = np.array(axis)
    def outward(c):
        i = int(np.argmin(np.linalg.norm(axis - c, axis=1)))
        return c - axis[i]
    P, UVt = orient_with_uv(P, UVt, outward, per_triangle=True)
    return P, UVt


def build_back(stick):
    """Back of the column: two lockable black steel doors, power socket, rating plate,
    transport castors at the top corners."""
    nodes = []
    z0 = D['col_z0']
    bk = Mesh('back_doors', smooth_angle=35)
    def door(xc, yc, w, h, lock_y):
        # black frame (slightly proud) + recessed door leaf with a thin shadow gap
        P = rounded_box_tris([xc - w / 2, yc - h / 2, z0 - 0.005], [xc + w / 2, yc + h / 2, z0 + 0.002], 0.002, seg=2, step=1)
        bk.add('BLACK_STEEL', P)
        g = 0.022
        P = rounded_box_tris([xc - w / 2 + g, yc - h / 2 + g, z0 - 0.0065], [xc + w / 2 - g, yc + h / 2 - g, z0 - 0.004], 0.0015, seg=2, step=1)
        bk.add('BLACK_STEEL', P)
        for (xa, ya, xb, yb) in ((xc - w / 2 + g - 0.003, yc - h / 2 + g - 0.003, xc + w / 2 - g + 0.003, yc - h / 2 + g),
                                 (xc - w / 2 + g - 0.003, yc + h / 2 - g, xc + w / 2 - g + 0.003, yc + h / 2 - g + 0.003),
                                 (xc - w / 2 + g - 0.003, yc - h / 2 + g, xc - w / 2 + g, yc + h / 2 - g),
                                 (xc + w / 2 - g, yc - h / 2 + g, xc + w / 2 - g + 0.003, yc + h / 2 - g)):
            Pq, UVq = quad([(xa + xb) / 2, (ya + yb) / 2, z0 - 0.0052], X3, Y3, xb - xa, yb - ya)
            Pq, UVq = orient_with_uv(Pq, UVq, [0, 0, -1])
            bk.add('RUBBER', Pq, UVq)
        # cylinder lock (on the -X side of the leaf, seen on the right from behind)
        lx = xc - w / 2 + g + 0.035
        Pl, UVl = lathe([(0, 0), (0.012, 0), (0.012, 0.006), (0.0105, 0.010), (0.0, 0.010)], 24,
                        M=look_basis(np.array([lx, lock_y, z0 - 0.0065]), [0, 0, -1]) @ mat_rot('x', 90))
        stick.add('METAL', Pl, UVl)
        Pk = rounded_box_tris([lx - 0.0012, lock_y - 0.005, z0 - 0.0172], [lx + 0.0012, lock_y + 0.005, z0 - 0.0162], 0.0005, seg=1, step=1)
        stick.add('BLACK_PLASTIC', Pk)
    door(-0.025, 1.12, 0.427, 0.427, 1.12)
    door(0.0, 0.528, 0.208, 0.236, 0.52)
    # IEC power socket + switch
    P = rounded_box_tris([-0.131, 0.825, z0 - 0.012], [-0.096, 0.875, z0 + 0.001], 0.003, seg=2, step=1)
    bk.add('BLACK_PLASTIC', P)
    # rating plate
    P = rounded_box_tris([0.113, 0.852, z0 - 0.0015], [0.177, 0.902, z0 + 0.001], 0.001, seg=1, step=1)
    stick.add('METAL', P)
    # black L-trims on the vertical back edges
    cx = D['col_x']
    for sx in (-1, 1):
        ym = (D['col_y0'] + D['col_box_y1']) / 2; hh = D['col_box_y1'] - D['col_y0']
        Pq, UVq = quad([sx * (cx - D['back_trim'] / 2), ym, z0 - 0.0009], X3, Y3, D['back_trim'], hh)
        Pq, UVq = orient_with_uv(Pq, UVq, [0, 0, -1]); bk.add('BLACK_STEEL', Pq, UVq)
        Pq, UVq = quad([sx * (cx + 0.0009), ym, z0 + D['back_trim'] / 2], Z3, Y3, D['back_trim'], hh)
        Pq, UVq = orient_with_uv(Pq, UVq, [sx, 0, 0]); bk.add('BLACK_STEEL', Pq, UVq)
    nodes.append(('back_doors', 'body', bk))
    # transport castors at the top corners (bracket on the back face, wheel sticking out backwards)
    cs = Mesh('castors', smooth_angle=40)
    for sx in (-1, 1):
        xw, yw = sx * 0.245, 1.99
        P = rounded_box_tris([xw - 0.04, yw - 0.032, z0 - 0.004], [xw + 0.04, yw + 0.032, z0 + 0.001], 0.003, seg=2, step=1)
        cs.add('METAL', P)
        for side in (-1, 1):  # fork plates
            P = rounded_box_tris([xw + side * 0.021 - 0.0015, yw - 0.026, z0 - 0.062], [xw + side * 0.021 + 0.0015, yw + 0.026, z0 - 0.004], 0.0012, seg=1, step=1)
            cs.add('METAL', P)
        M = mat_translate(xw, yw, z0 - 0.048) @ mat_rot('z', 90)
        prof = [(0.0, -0.014), (0.012, -0.014), (0.026, -0.0135), (0.034, -0.011), (0.038, -0.006), (0.0385, 0.0),
                (0.038, 0.006), (0.034, 0.011), (0.026, 0.0135), (0.012, 0.014), (0.0, 0.014)]
        Pw, UVw = lathe(prof, 32, M=M)
        cs.add('TYRE_GREY', Pw, UVw)
        Ph, UVh = lathe([(0.0, -0.0155), (0.009, -0.0155), (0.009, 0.0155), (0.0, 0.0155)], 16, M=M)
        cs.add('METAL', Ph, UVh)
    nodes.append(('castors', 'body', cs))
    return nodes


def front_uv(xy):
    """front panel metres -> UV of the front graphic texture (photo crop FRONT_CROP)."""
    f = FRONT_PX
    px = xy[:, 0] * f['ppm_x'] + f['cx']
    py = f['py_top'] + (xy[:, 1] - f['y_top']) * (f['py_bot'] - f['py_top']) / (f['y_bot'] - f['y_top'])
    x0, y0, x1, y1 = FRONT_CROP
    return np.stack([(px - x0) / (x1 - x0), (py - y0) / (y1 - y0)], 1)


def slot_outline(n=140):
    """Opening in the brim underside the folded punch bag sits in: wide at the back where the
    ball rests, narrowing towards the hinge at the front (between the two down-lights)."""
    z0, z1 = D['slot_z0'], D['slot_z1']
    def hw(z):
        t = (z - z0) / (z1 - z0)
        return D['slot_x'] * (1.0 - 0.45 * max(0.0, (t - 0.30) / 0.70) ** 1.2)
    zs = np.linspace(z0, z1, 60)
    right = [(hw(z) * math.sqrt(max(0.0, 1 - ((z - z0) / 0.12 - 1) ** 2)) if z < z0 + 0.12 else hw(z), z) for z in zs]
    right[-1] = (hw(z1) * 0.6, z1)
    pts = [(x, z) for x, z in right[1:]] + [(-x, z) for x, z in right[::-1][:-1]] + [(0.0, z0)]
    pts = np.array(pts)
    keep = np.r_[True, np.linalg.norm(np.diff(pts, axis=0), axis=1) > 1e-6]
    pts = pts[keep]
    pts = fillet(pts, lambda p: 0.03, seg=6)
    return ccw(resample_closed(pts, n))


def build_canopy(leds, stick):
    nodes = []
    y0, y1 = D['lb_y0'], D['lb_y1']
    H = y1 - y0
    # ---- lower brim (red): rounded front edge, flat underside, concave chin into the column
    lb = Mesh('top_canopy_lower', smooth_angle=45)
    C = LB_PLAN
    prof = [(-0.03, 0.0), (-0.018, 0.0), (-0.007, 0.003), (-0.001, 0.014), (0.0, 0.028), (0.0, H - 0.006), (-0.004, H)]
    def side_h(a_, b_, h):   # outer walls: flat bottom edge (the chin only sits between the rails)
        return y0 + (h / H) * (y1 - y0)
    P, UV, _ = sweep(C, prof, X3, Z3, Y3, origin=[0, 0, 0], hfunc=side_h)
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(C, c) + np.array([0, -0.4, 0]))
    lb.add('BODY_PAINT', P, UV)
    Pt, UVt = cap(offset_contour(C, -0.004), X3, Z3, Y3, origin=[0, y1, 0], facing=+1, center=[0, 0.5])
    lb.add('BODY_PAINT', Pt, UVt)
    # underside: rings from the outer edge to the slot, following the chin
    hole = slot_outline()
    oc = np.array([0.0, (D['slot_z0'] + D['slot_z1']) / 2])
    rel = hole - oc
    angs = np.arctan2(rel[:, 1], rel[:, 0])
    rout = ray_polygon(oc, angs, offset_contour(C, -0.03))
    outer = oc + np.stack([np.cos(angs), np.sin(angs)], 1) * rout[:, None]
    rings = [outer + (hole - outer) * k for k in np.linspace(0, 1, 9)]
    under_h = lambda a_, b_, h: brim_bottom(b_, a_)
    for ra, rb_ in zip(rings[:-1], rings[1:]):
        Pu, UVu = ring_cap(ra, rb_, X3, Z3, Y3, hfunc=under_h, facing=-1)
        lb.add('BODY_PAINT', Pu, UVu)
    # slot walls + ceiling (black, deep enough to hold the folded ball)
    depth = 0.21
    walls = []
    for k in range(len(hole)):
        q = (k + 1) % len(hole)
        a = [hole[k][0], brim_bottom(hole[k][1], hole[k][0]), hole[k][1]]; b = [hole[q][0], brim_bottom(hole[q][1], hole[q][0]), hole[q][1]]
        c = [hole[q][0], y0 + depth, hole[q][1]]; d = [hole[k][0], y0 + depth, hole[k][1]]
        walls += [[a, b, c], [a, c, d]]
    Pw = np.array(walls)
    Pw, _ = orient_with_uv(Pw, np.zeros((len(Pw), 3, 2)), lambda c: np.array([oc[0] - c[0], 0, oc[1] - c[2]]), per_triangle=True)
    lb.add('BLACK_PLASTIC', Pw)
    Pc, UVc = cap(hole, X3, Z3, Y3, origin=[0, y0 + depth, 0], facing=-1, center=oc)
    lb.add('BLACK_PLASTIC', Pc, UVc)
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
            row.append([a, top_bottom(b, a) + 0.01 if yy is None else yy, b])
        rows.append(row)
    G = np.array(rows)
    G = np.concatenate([G, G[:, :1]], 1).transpose(1, 0, 2)
    P, UV = grid_tris(G, np.zeros(G.shape[:2] + (2,)))
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(Cd, c))
    dr.add('BODY_PAINT', P, None)
    nodes.append(('top_canopy_drum', 'canopy', dr))
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
    P, UV = contour_strip(Cd, a, b, BAND_Y[0], lambda x_, z_: min(top_bottom(z_, x_) - 0.002, BAND_Y[1]), 0.0016, nu=220, nv=6)
    # physical v (the print is a constant-height strip; the lid simply covers more of it on the sides)
    yy = P[..., 1]
    UV = UV.copy(); UV[..., 1] = (BAND_Y[1] - yy) / (BAND_Y[1] - BAND_Y[0])
    bm.add('GFX_BAND', P, UV)
    nodes.append(('decal_band', 'decals', bm))

    # ---- lid: thin moulded shell.  A short collar sits on the band, the underside flares out like a
    # bell (steep at the band, almost flat at the rim), rounded rim ~3 cm thick, flat top.
    tb = Mesh('top_canopy', smooth_angle=42)
    S = TOP_PLAN
    TOP = D['top_y']
    oc = np.array([0.0, 0.38])
    angs = np.linspace(0, 2 * math.pi, 240, endpoint=False)
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    rin = ray_polygon(oc, angs, offset_contour(Cd, 0.004))   # just outside the band
    rout = ray_polygon(oc, angs, S)
    nrm = dirs
    rows = []
    rim_t = 0.040
    def rimbot(z):
        t = min(max((z - D['top_z0']) / TOP_DEPTH, 0.0), 1.0)
        return TOP - rim_t - 0.015 * t          # rolled lip slightly deeper towards the front
    # (radius fraction s, height fraction along the bell, extra outward offset)
    for k in range(13):
        sfr = k / 12.0
        rows.append(('bell', sfr))
    rimpts = [(0.000, 0.00), (0.006, 0.12), (0.010, 0.35), (0.011, 0.55), (0.009, 0.75), (0.004, 0.92), (-0.004, 1.0), (-0.03, 1.0), (-0.08, 1.0)]
    G = []
    for i in range(len(angs)):
        d = dirs[i]; p_in = oc + d * rin[i]; p_out = oc + d * rout[i]
        zin = p_in[1]
        col = []
        bot = top_bottom(zin, p_in[0])
        # collar: 2 cm vertical ring on the band
        col.append([p_in[0], bot - 0.004, p_in[1]])
        col.append([p_in[0], bot + 0.006, p_in[1]])
        for k in range(1, 13):
            sfr = k / 12.0
            q = p_in + (p_out - p_in) * sfr
            hb = max(rimbot(q[1]), bot + 0.014)
            h = (bot + 0.006) + (hb - bot - 0.006) * (1 - (1 - sfr) ** 2.4)   # trumpet flare
            col.append([q[0], h, q[1]])
        hb = max(rimbot(p_out[1]), bot + 0.014)
        for off, fr in rimpts[1:]:
            q = p_out + d * off
            col.append([q[0], hb + (TOP - hb) * fr, q[1]])
        G.append(col)
    G = np.array(G); G = np.concatenate([G, G[:1]], 0)
    P, UV = grid_tris(G, np.zeros(G.shape[:2] + (2,)))
    P, UV = orient_with_uv(P, UV, lambda c: np.array([c[0] - oc[0], 0.0, c[2] - oc[1]]) + np.array([0, -0.6 if c[1] < TOP - 0.02 else 0.6, 0]), per_triangle=False)
    tb.add('BODY_PAINT', P, UV)
    Si = np.array([oc + dirs[i] * (rout[i] - 0.08) for i in range(len(angs))])
    Pt, UVt = cap(Si, X3, Z3, Y3, h=TOP, facing=+1, center=oc)
    tb.add('BODY_PAINT', Pt, UVt)
    nodes.append(('top_canopy', 'canopy', tb))

    # ---- details: two down-lights at the front of the brim, START button in the brim front
    for sx in (-1, 1):
        zz = D['light_z']
        yb = brim_bottom(zz)
        Pm, UVm = lathe([(0.0, 0.0), (0.028, 0.0), (0.032, 0.003), (0.034, 0.0)], 24, M=mat_translate(sx * D['light_x'], yb, zz) @ mat_rot('x', 180))
        stick.add('METAL', Pm, UVm)
        Pd, UVd = disc(0.025, 24, M=mat_translate(sx * D['light_x'], yb - 0.0035, zz) @ mat_rot('x', 90))
        leds['led_spot'].mesh.add('LED_WHITE', Pd, UVd, np.ones((len(Pd), 3, 3)), np.full((len(Pd), 3), float(leds['led_spot'].count)))
        leds['led_spot'].count += 1
    p, n = plan_point(C, arc_param_at(C, [0, D['lb_z1']]))
    lock_pos = np.array([p[0], (y0 + y1) / 2, p[1]])
    Pl, UVl = lathe([(0.0, 0.0), (0.017, 0.0), (0.017, 0.006), (0.013, 0.009), (0.0, 0.009)], 24,
                    M=look_basis(lock_pos, [n[0], 0, n[1]]) @ mat_rot('x', 90))
    stick.add('METAL', Pl, UVl)
    Pk, UVk = disc(0.0115, 24, M=look_basis(lock_pos + np.array([0, 0, 0.0095]), [0, 0, 1]))
    stick.add('DECALS', Pk, atlas_uv('lock', UVk))
    return nodes


def build_boxer():
    """Punch bag folded up into the brim slot (idle position on the real machine): hinge at the
    front of the slot, leather sleeve over the arm, ball resting towards the column."""
    nodes = []
    r = D['bag_r']
    pv = np.array(D['pivot'], float); bc = np.array(D['ball'], float)
    v = bc - pv
    L = float(np.linalg.norm(v))
    theta = math.degrees(math.atan2(-v[2], -v[1]))      # rotation about X from 'hanging down'
    M = mat_translate(*pv) @ mat_rot('x', theta)
    mt = Mesh('boxing_bag_mount', smooth_angle=40)
    P = rounded_box_tris([-0.06, -0.035, -0.045], [0.06, 0.03, 0.045], 0.008, seg=3, step=1)
    mt.add('BLACK_PLASTIC', apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3))
    P, UV = lathe([(0.0, -0.065), (0.013, -0.065), (0.013, 0.065), (0.0, 0.065)], 16, M=M @ mat_rot('z', 90))
    mt.add('METAL', P, UV)
    nodes.append(('boxing_bag_mount', 'boxer', mt))
    # sleeve (local: hangs along -Y from the hinge, ball centre at y = -L)
    sv = Mesh('boxing_bag_sleeve', smooth_angle=70)
    ytop, ybot = -0.02, -L + r * 0.60
    prof = []
    for yy in np.linspace(ytop, ybot, 30):
        tt = (ytop - yy) / (ytop - ybot)
        rad = 0.034 + 0.014 * tt + 0.044 * tt ** 4.5
        prof.append((rad, yy))
    def wr(a, yy, rr):
        tt = min(max((ytop - yy) / (ytop - ybot), 0.0), 1.0)
        folds = 0.075 * math.sin(yy * 46 + 0.9 * math.sin(a * 2 + 0.7)) * (0.35 + tt)
        creases = 0.04 * math.sin(a * 3 + yy * 7) + 0.022 * math.sin(a * 7 - yy * 19)
        return rr * (1 + folds * (0.55 + 0.45 * math.cos(a * 2)) + creases * (1 - 0.5 * tt))
    P, UV = lathe(prof, 44, M=M, radial_fn=wr)
    sv.add('LEATHER_BLACK', P, UV)
    nodes.append(('boxing_bag_sleeve', 'boxer', sv))
    bg = Mesh('boxing_bag', smooth_angle=50)
    ng = 8
    by = -L
    for g in range(ng):
        a0 = 2 * math.pi * g / ng + math.pi / ng; a1 = 2 * math.pi * (g + 1) / ng + math.pi / ng
        prof = []
        for ph in np.linspace(0.10, math.pi * 0.86, 22):
            rr = r * math.sin(ph) * (1.0 - 0.035 * math.cos(ph))
            prof.append((rr, by + r * 1.05 * math.cos(ph)))
        def seam(a, yy, rr, a0=a0, a1=a1):
            d = min(abs(a - a0), abs(a - a1))
            return rr * (1 - 0.02 * math.exp(-(d / 0.03) ** 2))
        P, UV = lathe(prof, 12, M=M, radial_fn=seam, a0=a0, a1=a1)
        bg.add('BOXING_BAG_RED' if g % 2 == 0 else 'BOXING_BAG_BLACK', P, UV)
    capprof = [(r * math.sin(ph) * 1.002, by + r * 1.05 * math.cos(ph)) for ph in np.linspace(math.pi * 0.86, math.pi, 6)]
    P, UV = lathe(capprof, 32, M=M)
    bg.add('BOXING_BAG_BLACK', P, UV)
    nodes.append(('boxing_bag', 'boxer', bg))
    return nodes


def build_all():
    global MODEL_SCALE
    leds = {k: LedGroup(k) for k in ('led_spot',)}
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
    'front': dict(label='FRONT PANEL', material='GFX_FRONT', meshes=['decal_front'], size=[0.67, 1.805]),
    'band': dict(label='CANOPY BAND', material='GFX_BAND', meshes=['decal_band'], size=[2.39, 0.229]),
    'left': dict(label='LEFT SIDE', material='GFX_LEFT', meshes=['decal_left'], size=[0.238, 1.86]),
    'right': dict(label='RIGHT SIDE', material='GFX_RIGHT', meshes=['decal_right'], size=[0.238, 1.86]),
}
