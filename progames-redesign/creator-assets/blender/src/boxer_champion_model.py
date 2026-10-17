"""
boxer_champion_model.py - PRO GAMES "Boxer Champion" (one specific machine), rebuilt from the
reference package BOXER_CHAMPION_REFERENCES_CLAUDE_2 (photos F01-F35, P01, detail register D01-D28).

State: ONE punch bag lowered vertically (F34/F35), doors closed, displays 777 / 649 / 5 (P01).

Axes here: metres, glTF (Y up, +Z = machine front, +X = machine right).  In Blender (Z up) this
becomes the package convention: front -Y, right +X, origin on the floor under the base outline.

Every value below is either 'photogrammetry' (bundle adjustment of calibrated photos F01/F02/F10/
F26 with known focal length; height 2.19 m = catalogue K01 as the scale reference) or 'estimated'.
No user measurements (M) were available.  Nothing that is not visible in the photos is modelled
(no hinges, no feet under the base, no interior behind the bag opening).
"""
import math
import numpy as np
from meshlib import (Mesh, RoundedBox, sweep, cap, ring_cap, lathe, uv_sphere, quad, disc, box,
                     rounded_box_tris, convex_hull, fillet, resample_closed, ccw, offset_contour,
                     contour_normals, ray_polygon, mat_translate, mat_rot, mat_scale, look_basis,
                     apply, orient_with_uv, orient_volume, grid_tris)
from double_strike_model import (plan_point, arc_param_at, contour_strip, _outward_from_plan, LedGroup,
                                 X3, Y3, Z3)

# Measured values (see PARAMS for names used in the documentation and their status).
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
    # lid: plan + visor line fitted to the top silhouette in the 4 calibrated photos (F01/F02/F10/F26)
    top_x=0.3877, top_xb=0.37, top_z0=-0.1998, top_z1=1.0552, top_r=0.5648,
    top_xm=0.4753, top_zm=0.091, top_rm=0.3474,
    top_y_back=2.1109, top_pow=1.7425, top_y=2.196,
    # punch bag LOWERED (F34/F35, P01): neck hangs from the front of the opening, egg-shaped ball
    bag_rx=0.12, bag_ry=0.14, bag_hang=(0.0, 0.70), neck_len=0.225, neck_top_r=0.030, neck_skirt_r=0.098,
    # slot in the brim underside the bag folds into
    slot_x=0.19, slot_xb=0.125, slot_z0=0.38, slot_z1=0.735,   # IMG_0514/0515/0522: big rounded-trapezoid opening, wider at the front
    # canopy down-lights
    light_x=0.235, light_z=0.785,                 # IMG_0522: lights in the front corners, outside the opening
)
# visible fasteners / lock / wheel positions (F31, F32; D01-D07) - all 'estimated'
D.update(
    door_upper=(-0.032, 1.39, 0.450, 0.450),      # centre x, centre y, w, h (outer frame) - F31 frontal 814 px/m; height from F32 (frame top = side flag stripe) + studio set
    door_lower=(-0.005, 0.765, 0.222, 0.246),
    lock_upper=(-0.194, 1.375), lock_lower=(-0.055, 0.743),
    rating_plate=(0.149, 1.138, 0.066, 0.053), power_socket=(-0.128, 1.105, 0.044, 0.057),
    rear_screws_y=(0.15, 0.735, 1.38, 2.05),               # visible screw heads on each black rear profile
    wheel_xy=((-0.245, 1.99), (0.245, 1.99)), wheel_r=0.0385, wheel_w=0.028,
)
D['bag_center'] = (D['bag_hang'][0], D['lb_y0'] - D['neck_len'] - D['bag_ry'] + 0.032, D['bag_hang'][1])

# Parameter names requested by the documentation -> value, status
PARAMS = {
    'H_nominal': (2.19, 'catalogue K01 (scale reference)'),
    'W_nominal': (0.72, 'catalogue K02 - not used for any part width'),
    'D_nominal': (1.15, 'catalogue K03 - not used'),
    'body_width': (2 * D['col_x'], 'photogrammetry'),
    'body_depth': (D['col_z1'] - D['col_z0'], 'photogrammetry'),
    'canopy_front_extent': (D['top_z1'], 'photogrammetry (lid front from body back)'),
    'canopy_curve': (D['top_r'], 'estimated from F21-F25'),
    'canopy_height': (2.19 - D['lb_y0'], 'photogrammetry'),
    'base_outline': ((2 * D['plat_x'], D['plat_z1'] - D['plat_z0']), 'photogrammetry'),
    'base_thickness': (D['plat_h'], 'estimated (F33 edge)'),
    'bag_center_xyz': (D['bag_center'], 'estimated from F34/F35/P01'),
    'bag_radius': ((D['bag_rx'], D['bag_ry']), 'estimated'),
    'neck_length': (D['neck_len'], 'estimated'),
    'door_upper_bounds': (D['door_upper'], 'photogrammetry on F31 (frontal)'),
    'door_lower_bounds': (D['door_lower'], 'photogrammetry on F31 (frontal)'),
    'trim_section': ((D['frame_w'], D['back_trim']), 'estimated'),
    'lock_centers': ((D['lock_upper'], D['lock_lower']), 'estimated'),
    'wheel_centers': (D['wheel_xy'], 'estimated (F17/F20/F32)'),
}

TOP_DEPTH = D['top_z1'] - D['top_z0']
TARGET_HEIGHT = 2.19            # catalogue height (K01); the photogrammetric model (2.196 m) is scaled by 0.997
MODEL_SCALE = 1.0


def top_bottom(z, x=0.0):
    """Height of the lid underside where it meets the graphics band (measured on 4 photos):
    level ~2.097 m along the sides and back, rising to ~2.132 m at the front centre."""
    t = min(max((z - 0.60) / 0.28, 0.0), 1.0)
    t = t * t * (3 - 2 * t)
    # towards the back the lid underside follows the sloping visor line down (constant ~55 mm face;
    # F32 / studio rear: the rear face sits just above the transport wheels)
    return min(2.097, lid_top(z) - 0.055) + 0.035 * math.exp(-(x / 0.2) ** 2) * t


def lid_top(z):
    """Height of the lid top: it rises from the back to the front like a visor."""
    t = min(max((z - D['top_z0']) / (D['top_z1'] - D['top_z0']), 0.0), 1.0)
    return D['top_y_back'] + (D['top_y'] - D['top_y_back']) * t ** D['top_pow']


def chin_low(x):
    """Lowest point of the chin at the column front: the shield top in the middle, rising in an arc
    to the brim at the corner rails (measured on the rectified front photo)."""
    ax = abs(x)
    if ax <= 0.25:
        return shield_top(ax) - 0.004
    c0 = shield_top(0.25) - 0.004
    t = min((ax - 0.25) / (D['col_x'] - 0.25), 1.0)
    return c0 + (D['lb_y0'] - c0) * (1.0 - math.sqrt(max(1.0 - t * t, 0.0)))


# top edge of the printed score sticker (measured on the front bake, IMG_0513 / studio set): a wave
# that is highest in the middle, dips either side of centre and rises again to the shoulders.
_STICKER_TOP = ([0.0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.25, 0.28],
                [1.7546, 1.7535, 1.746, 1.7384, 1.7335, 1.7305, 1.7308, 1.7335, 1.738, 1.742])


def shield_top(x):
    """Outer edge of the bezel along the top: follows the sticker edge (bezel rim overlaps it)."""
    return float(np.interp(abs(x), *_STICKER_TOP)) + 0.018


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


def exact_arc_param(contour, target_xz, side_sign=None):
    """Arc-length fraction of the exact closest point on the closed contour (not just a vertex)."""
    C = np.vstack([contour, contour[:1]]); t = np.asarray(target_xz, float)
    seg = np.diff(C, axis=0); L = np.linalg.norm(seg, axis=1); s0 = np.concatenate([[0], np.cumsum(L)])
    best = (1e9, 0.0)
    for i in range(len(seg)):
        if side_sign is not None and np.sign(C[i, 0]) != side_sign:
            continue
        u = np.clip(np.dot(t - C[i], seg[i]) / max(L[i] ** 2, 1e-12), 0, 1)
        dd = np.linalg.norm(C[i] + seg[i] * u - t)
        if dd < best[0]:
            best = (dd, (s0[i] + u * L[i]) / s0[-1])
    return best[1]


def drum_plan(n=220):
    """Band drum: flush with the column at the back (sharp rear corners under the black profiles),
    a few mm wider at the front where the band was measured."""
    cx, x, z0, z1 = D['col_x'], D['drum_x'], D['col_z0'], D['drum_z1']
    pts = np.array([[-cx, z0], [cx, z0], [x, z1], [-x, z1]], float)
    pts = fillet(pts, lambda p: D['drum_r'] if p[1] > (z0 + z1) / 2 else 0.0, seg=16)
    return ccw(resample_closed(pts, n))


DRUM_PLAN = drum_plan()
def lid_plan(n=240):
    """Lid outline: narrower at the back, flaring out towards the rounded front."""
    xb, xf, z0, z1 = D['top_xb'], D['top_x'], D['top_z0'], D['top_z1']
    xm, zm = D['top_xm'], z0 + D['top_zm']          # sides flare out quickly behind the band
    pts = np.array([[-xb, z0], [xb, z0], [xm, zm], [xf, z1], [-xf, z1], [-xm, zm]], float)
    pts = fillet(pts, lambda p: D['top_r'] if p[1] > z1 - 0.01 else (D['top_rm'] if p[1] > z0 + 0.01 else 0.04), seg=16)
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
SHIELD_HW = [(1.76, 0.280), (1.74, 0.265), (1.72, 0.260), (1.70, 0.254), (1.68, 0.248), (1.66, 0.242),
             (1.64, 0.236), (1.62, 0.231), (1.60, 0.229), (1.58, 0.228), (1.56, 0.228), (1.54, 0.233), (1.52, 0.236),
             (1.50, 0.240), (1.48, 0.245), (1.46, 0.249), (1.44, 0.253), (1.42, 0.256), (1.40, 0.261), (1.38, 0.267),
             (1.36, 0.270), (1.34, 0.272), (1.32, 0.274), (1.30, 0.275), (1.27, 0.275), (1.24, 0.273), (1.21, 0.271),
             (1.18, 0.266), (1.15, 0.261), (1.12, 0.252), (1.10, 0.246), (1.08, 0.238), (1.06, 0.228), (1.04, 0.218),
             (1.02, 0.206), (1.00, 0.193), (0.98, 0.176), (0.96, 0.152), (0.94, 0.115), (0.92, 0.062), (0.905, 0.0)]


def shield_outline(n=220):
    right = [(hw, y) for y, hw in SHIELD_HW]
    left = [(-x, y) for x, y in right[::-1]]
    top = [(x, shield_top(x)) for x in np.linspace(-0.28, 0.28, 29)[1:-1]]   # wavy top, follows the sticker
    pts = np.array(right + left[1:] + top)
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
    'lock': (720, 220, 976, 476),      # START BOXER rosette (D12)
    'socket': (1000, 0, 1300, 428),   # D22 from F31
    'plate': (1320, 0, 1720, 320),    # D23 from F31
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
    base = Mesh('B04_base_frame', smooth_angle=30)
    dp = Mesh('D20_base_tread_plate', smooth_angle=20)
    K = 1 / 0.059   # tread tile 59 mm (measured), bars at +-45 deg to the plate edges

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
    # (underside not documented - no feet are modelled, Q01)
    nodes.append(('B04_base_frame', 'BASE', base))
    nodes.append(('D20_base_tread_plate', 'BASE', dp))
    return nodes


def build_column():
    nodes = []
    cx, z0, z1, y0, y1 = D['col_x'], D['col_z0'], D['col_z1'], D['col_y0'], D['col_y1']
    rb = RoundedBox([-cx, y0, z0], [cx, D['col_box_y1'], z1], {'-x': 0.008, '+x': 0.008, '-z': 0.006, '+z': 0.01, '-y': 0.0, '+y': 0.0})
    m = Mesh('B01_body', smooth_angle=40)
    def matfn(c, n, face):
        if abs(n[0]) > 0.3 and c[2] < z0 + D['back_trim']:
            return 'BLACK_STEEL'
        if n[2] < -0.3 and abs(c[0]) > cx - D['back_trim']:
            return 'BLACK_STEEL'
        return None
    rb.build(m, 'BODY_PAINT', seg=8, step=0.12, skip=('-y', '+y'), matfn=matfn)
    nodes.append(('B01_body', 'BODY', m))
    nodes += build_back()

    # rounded red corner rails: run up both front edges and bend forward into the brim 'chin'
    fr = Mesh('D09_front_profiles', smooth_angle=50)
    for sx in (-1, 1):
        fr.add('BODY_PAINT', *corner_rail(sx))
    nodes.append(('D09_front_profiles', 'BODY', fr))

    fw = D['frame_w']
    # FRONT graphic (whole front panel between the corner rails)
    fm = Mesh('D24_front_graphic', smooth_angle=60)
    G = FRONT_GFX
    Pq, UVq = quad([(G['x0'] + G['x1']) / 2, (G['y0'] + G['y1']) / 2, z1 + 0.0012], X3, Y3, G['x1'] - G['x0'], G['y1'] - G['y0'], nx=4, ny=16)
    xy = Pq.reshape(-1, 3)[:, :2]
    UVf = np.stack([(xy[:, 0] - G['x0']) / (G['x1'] - G['x0']), (G['y1'] - xy[:, 1]) / (G['y1'] - G['y0'])], 1).reshape(-1, 3, 2)
    fm.add('GFX_FRONT', Pq, UVf)
    nodes.append(('D24_front_graphic', 'GRAPHICS', fm))

    # raised shield bezel around the score area
    sb = Mesh('D18_score_shield', smooth_angle=50)
    sh = shield_outline()
    rim = 0.022
    prof = [(0.003, 0.0), (0.002, 0.009), (-0.003, 0.016), (-rim / 2, 0.019), (-rim + 0.004, 0.016), (-rim, 0.008), (-rim - 0.001, 0.0)]
    P, UV, _ = sweep(sh, prof, X3, Y3, Z3, origin=[0, 0, z1 + 0.0012])
    P, UV = orient_volume(P, UV, [0, 1.2, z1 - 0.05])
    sb.add('BODY_PAINT', P, UV)
    nodes.append(('D18_score_shield', 'FRONT_PANEL', sb))

    # LED displays: flush behind the acrylic, lit digits on top of the printed windows
    # three separate emissive segment fields (7-segment polygons drawn in the texture, dark
    # inactive segments kept, no decimal points) + one thin glass layer over the shield (MAT09)
    for region, nm in (('score', 'D19_score_777'), ('high', 'D19_highscore_649'), ('credit', 'D19_credit_5')):
        xa_, ya_, xb_, yb_ = SCREENS[region]
        sc = Mesh(nm, smooth_angle=10)
        Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0042], X3, Y3, (xb_ - xa_) * 0.97, (yb_ - ya_) * 0.92)
        u0, v0, u1, v1 = [c / 1024.0 for c in SCREEN_ATLAS[region]]
        UVq[..., 0] = u0 + UVq[..., 0] * (u1 - u0); UVq[..., 1] = v0 + UVq[..., 1] * (v1 - v0)
        sc.add('SCREEN', Pq, UVq)
        nodes.append((nm, 'EMISSION', sc))
    gl = Mesh('D18_score_glass', smooth_angle=10)
    inner = offset_contour(sh, -0.018)
    Pg, UVg = cap(inner, X3, Y3, Z3, origin=[0, 0, z1 + 0.0075], facing=+1)
    gl.add('GLASS', Pg, UVg)
    nodes.append(('D18_score_glass', 'FRONT_PANEL', gl))

    # coin mechanism (black face plate with red reject button) and the game-rules plate
    ca = Mesh('D16_payment_panel', smooth_angle=40)
    xa_, ya_, xb_, yb_ = COIN
    Pf = rounded_box_tris([xa_, ya_, z1 - 0.004], [xb_, yb_, z1 + 0.012], 0.003, seg=4, step=1)
    ca.add('BLACK_PLASTIC', Pf)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0123], X3, Y3, (xb_ - xa_) * 0.97, (yb_ - ya_) * 0.98)
    ca.add('DECALS', Pq, atlas_uv('coin', UVq))
    bx, by = xa_ + (xb_ - xa_) * 0.55, ya_ + (yb_ - ya_) * 0.68
    Pb = rounded_box_tris([bx - 0.011, by - 0.007, z1 + 0.011], [bx + 0.011, by + 0.007, z1 + 0.019], 0.002, seg=3, step=1)
    ca.add('BUTTON_RED', Pb)
    nodes.append(('D16_payment_panel', 'FRONT_PANEL', ca))
    ca = Mesh('D17_game_rules', smooth_angle=40)
    xa_, ya_, xb_, yb_ = RULES
    Pr = rounded_box_tris([xa_, ya_, z1 - 0.001], [xb_, yb_, z1 + 0.004], 0.002, seg=3, step=1)
    ca.add('BLACK_PLASTIC', Pr)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0043], X3, Y3, (xb_ - xa_) * 0.98, (yb_ - ya_) * 0.98)
    ca.add('DECALS', Pq, atlas_uv('rules', UVq))
    nodes.append(('D17_game_rules', 'FRONT_PANEL', ca))

    # SIDE graphics (column sides, between the black back trim and the red front band)
    for side, nm, mat in (('-x', 'D26_left_graphic', 'GFX_LEFT'), ('+x', 'D25_right_graphic', 'GFX_RIGHT')):
        dm = Mesh(nm, smooth_angle=60)
        P, UV = rb.decal_grid(side, y0 + 0.002, D['col_box_y1'] - 0.004, z0 + D['back_trim'], z1 - D['side_red'], offset=0.0012, na=24, nb=4)
        dm.add(mat, P, UV)
        nodes.append((nm, 'GRAPHICS', dm))
    return nodes, rb


def corner_rail(sx, n_vert=40):
    """Sweep of the corner profile (concave front channel) along: front edge (vertical) -> chin curve -> brim underside."""
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
    # front face is a concave channel (IMG_0575): inner lip, a trough recessed ~5 mm into the
    # profile, outer lip, then a small radius round the corner onto the side
    sec = [(-fw, 0.0), (-fw, 0.003), (-fw + 0.004, 0.0075), (-0.029, 0.0095)]
    for t in np.linspace(0, 1, 11)[1:-1]:
        sec.append((-0.029 + 0.025 * t, 0.0095 - 0.005 * math.sin(math.pi * t)))
    sec += [(-0.004, 0.0095)]
    cq, cp, r = 0.0045, 0.0055, 0.004
    for ang in np.linspace(math.pi / 2, 0, 6)[1:]:
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


def lock_and_key(name, pos, z_face, key=False):
    """Cylinder lock: round chrome rosette, keyway (D01/D02).  Keys are left out on request."""
    lk = Mesh(name, smooth_angle=35)
    x, y = pos
    B = look_basis(np.array([x, y, z_face]), [0, 0, -1]) @ mat_rot('x', 90)
    P, UV = lathe([(0, 0), (0.0115, 0), (0.0115, 0.002), (0.0105, 0.0045), (0.0098, 0.0055), (0.0, 0.0055)], 28, M=B)
    lk.add('METAL', P, UV)
    P = rounded_box_tris([x - 0.0011, y - 0.0055, z_face - 0.0058], [x + 0.0011, y + 0.0055, z_face - 0.0052], 0.0004, seg=1, step=1)
    lk.add('BLACK_PLASTIC', P)
    nodes = [(name, 'REAR_DOORS', lk)]
    if key:
        ky = Mesh(name + '_key', smooth_angle=30)
        zk = z_face - 0.009
        # bow + blade turned down, split ring through the bow
        P = rounded_box_tris([x - 0.004, y - 0.016, zk - 0.0012], [x + 0.004, y + 0.004, zk + 0.0012], 0.0012, seg=2, step=1)
        ky.add('METAL', P)
        P = rounded_box_tris([x - 0.0022, y - 0.075, zk - 0.001], [x + 0.0022, y - 0.016, zk + 0.001], 0.0008, seg=1, step=1)
        ky.add('METAL', P)
        ring = []
        cy_ = y - 0.026
        for t in np.linspace(0, 2 * math.pi, 25):
            ring.append((x + 0.013 * math.cos(t), cy_ + 0.013 * math.sin(t)))
        tube = []
        for (ax, ay), (bx, by) in zip(ring[:-1], ring[1:]):
            P = rounded_box_tris([min(ax, bx) - 0.0009, min(ay, by) - 0.0009, zk - 0.003], [max(ax, bx) + 0.0009, max(ay, by) + 0.0009, zk - 0.0012], 0.0004, seg=1, step=1)
            ky.add('METAL', P)
        nodes.append((name + '_key', 'REAR_DOORS', ky))
    return nodes


def build_back():
    """Rear (F31 frontal, F18/F19/F32): two closed black doors (frame + recessed leaf each),
    lock with key on each, power entry with switch, rating plate (116 KG), black rear profiles with
    the visible screw heads, two transport wheels on the upper rear corners."""
    nodes = []
    z0 = D['col_z0']
    cx = D['col_x']
    def door(tag, bounds):
        xc, yc, w, h = bounds
        fr = Mesh(f'{tag}_frame', smooth_angle=35)
        P = rounded_box_tris([xc - w / 2, yc - h / 2, z0 - 0.005], [xc + w / 2, yc + h / 2, z0 + 0.002], 0.002, seg=2, step=1)
        fr.add('BLACK_STEEL', P)
        g = 0.022
        for (xa, ya, xb, yb) in ((xc - w / 2 + g - 0.003, yc - h / 2 + g - 0.003, xc + w / 2 - g + 0.003, yc - h / 2 + g),
                                 (xc - w / 2 + g - 0.003, yc + h / 2 - g, xc + w / 2 - g + 0.003, yc + h / 2 - g + 0.003),
                                 (xc - w / 2 + g - 0.003, yc - h / 2 + g, xc - w / 2 + g, yc + h / 2 - g),
                                 (xc + w / 2 - g, yc - h / 2 + g, xc + w / 2 - g + 0.003, yc + h / 2 - g)):
            Pq, UVq = quad([(xa + xb) / 2, (ya + yb) / 2, z0 - 0.0052], X3, Y3, xb - xa, yb - ya)
            Pq, UVq = orient_with_uv(Pq, UVq, [0, 0, -1])
            fr.add('GAP_DARK', Pq, UVq)            # geometric shadow gap around the leaf
        lf = Mesh(f'{tag}_leaf', smooth_angle=35)
        P = rounded_box_tris([xc - w / 2 + g, yc - h / 2 + g, z0 - 0.0065], [xc + w / 2 - g, yc + h / 2 - g, z0 - 0.004], 0.0015, seg=2, step=1)
        lf.add('BLACK_STEEL', P)
        return [(f'{tag}_frame', 'REAR_DOORS', fr), (f'{tag}_leaf', 'REAR_DOORS', lf)]
    nodes += door('D03_upper_door', D['door_upper'])
    nodes += door('D04_lower_door', D['door_lower'])
    nodes += lock_and_key('D01_upper_lock', D['lock_upper'], z0 - 0.0065)
    nodes += lock_and_key('D02_lower_lock', D['lock_lower'], z0 - 0.0065)
    # D22 power entry (IEC inlet + rocker switch) - textured from the F31 crop
    xs, ys, ws, hs = D['power_socket']
    pw = Mesh('D22_power_socket', smooth_angle=30)
    # elongated hexagon body (F31): vertical sides, chamfered top and bottom
    hexo = np.array([[-ws / 2, -hs * 0.30], [-ws * 0.26, -hs / 2], [ws * 0.26, -hs / 2], [ws / 2, -hs * 0.30],
                     [ws / 2, hs * 0.30], [ws * 0.26, hs / 2], [-ws * 0.26, hs / 2], [-ws / 2, hs * 0.30]])
    hexo = ccw(resample_closed(fillet(hexo, lambda p: 0.003, seg=3), 48)) + np.array([xs, ys])
    P, UV, _ = sweep(hexo, [(0.0, 0.0), (0.0, -0.009), (-0.0015, -0.0105)], X3, Y3, Z3, origin=[0, 0, z0 + 0.001])
    P, UV = orient_volume(P, UV, [xs, ys, z0 + 0.01])
    pw.add('BLACK_PLASTIC', P, UV)
    face = offset_contour(hexo, -0.0015)
    Pf, _ = cap(face, X3, Y3, Z3, origin=[0, 0, z0 + 0.001 - 0.0105], facing=-1)
    q = Pf[..., :2]
    UVf = np.stack([1 - ((q[..., 0] - (xs - ws / 2)) / ws), 1 - ((q[..., 1] - (ys - hs / 2)) / hs)], -1)
    pw.add('DECALS', Pf, atlas_uv('socket', UVf))
    nodes.append(('D22_power_socket', 'DETAILS', pw))
    # D23 rating plate
    xp, yp, wp, hp = D['rating_plate']
    rp = Mesh('D23_rating_plate', smooth_angle=30)
    P = rounded_box_tris([xp - wp / 2, yp - hp / 2, z0 - 0.0015], [xp + wp / 2, yp + hp / 2, z0 + 0.001], 0.001, seg=1, step=1)
    rp.add('BLACK_PLASTIC', P)
    Pq, UVq = quad([xp, yp, z0 - 0.0017], X3, Y3, wp * 0.99, hp * 0.99)
    Pq, UVq = orient_with_uv(Pq, UVq * np.array([-1, 1]) + np.array([1, 0]), [0, 0, -1])
    rp.add('DECALS', Pq, atlas_uv('plate', UVq))
    nodes.append(('D23_rating_plate', 'DETAILS', rp))
    # D05 black rear profiles (L section over both vertical rear edges) + visible screw heads
    pr = Mesh('D05_rear_profiles', smooth_angle=30)
    # black L profiles on both rear edges: one continuous piece from the base up to the crown
    # underside (IMG_0523 / F17 / F32 / studio rear) - the drum is flush with the column at the back
    ytop = top_bottom(z0, cx) + 0.004
    ya, yb = D['col_y0'], ytop
    ym, hh = (ya + yb) / 2, yb - ya
    for sx in (-1, 1):
        Pq, UVq = quad([sx * (cx - D['back_trim'] / 2), ym, z0 - 0.0009], X3, Y3, D['back_trim'], hh)
        Pq, UVq = orient_with_uv(Pq, UVq, [0, 0, -1]); pr.add('BLACK_STEEL', Pq, UVq)
        Pq, UVq = quad([sx * (cx + 0.0009), ym, z0 + D['back_trim'] / 2], Z3, Y3, D['back_trim'], hh)
        Pq, UVq = orient_with_uv(Pq, UVq, [sx, 0, 0]); pr.add('BLACK_STEEL', Pq, UVq)
        for yy in D['rear_screws_y']:
            Ps, UVs = lathe([(0, 0), (0.0032, 0), (0.0032, 0.0008), (0.0022, 0.0016), (0, 0.0018)], 12,
                            M=look_basis(np.array([sx * (cx - D['back_trim'] * 0.55), yy, z0 - 0.001]), [0, 0, -1]) @ mat_rot('x', 90))
            pr.add('METAL', Ps, UVs)
    nodes.append(('D05_rear_profiles', 'BODY', pr))
    # D06 / D07 transport wheels: base plate with 4 bolts on the rear face, fixed fork, grey wheel, axle nut
    for (xw, yw), tag in zip(D['wheel_xy'], ('D07_rear_wheel_assembly_left', 'D06_rear_wheel_assembly_right')):
        cs = Mesh(tag, smooth_angle=40)
        P = rounded_box_tris([xw - 0.04, yw - 0.032, z0 - 0.004], [xw + 0.04, yw + 0.032, z0 + 0.001], 0.003, seg=2, step=1)
        cs.add('METAL', P)
        for bx in (-0.031, 0.031):
            for by in (-0.023, 0.023):
                Pb, UVb = lathe([(0, 0), (0.0045, 0), (0.0045, 0.002), (0.003, 0.0035), (0, 0.0038)], 6,
                                M=look_basis(np.array([xw + bx, yw + by, z0 - 0.004]), [0, 0, -1]) @ mat_rot('x', 90))
                cs.add('METAL', Pb, UVb)
        for side in (-1, 1):
            P = rounded_box_tris([xw + side * 0.021 - 0.0015, yw - 0.026, z0 - 0.062], [xw + side * 0.021 + 0.0015, yw + 0.026, z0 - 0.004], 0.0012, seg=1, step=1)
            cs.add('METAL', P)
        R_, W_ = D['wheel_r'], D['wheel_w'] / 2
        M = mat_translate(xw, yw, z0 - 0.048) @ mat_rot('z', 90)
        prof = [(0.0, -W_), (0.012, -W_), (R_ * 0.68, -W_ * 0.96), (R_ * 0.88, -W_ * 0.8), (R_ * 0.985, -W_ * 0.43), (R_, 0.0),
                (R_ * 0.985, W_ * 0.43), (R_ * 0.88, W_ * 0.8), (R_ * 0.68, W_ * 0.96), (0.012, W_), (0.0, W_)]
        Pw, UVw = lathe(prof, 36, M=M)
        cs.add('TYRE_GREY', Pw, UVw)
        Ph, UVh = lathe([(0.0, -W_ - 0.0015), (0.016, -W_ - 0.0015), (0.016, W_ + 0.0015), (0.0, W_ + 0.0015)], 20, M=M)
        cs.add('BLACK_PLASTIC', Ph, UVh)
        Pn, UVn = lathe([(0.0, -0.0245), (0.0065, -0.0245), (0.0065, 0.0245), (0.0, 0.0245)], 6, M=M)
        cs.add('METAL', Pn, UVn)
        nodes.append((tag, 'TRANSPORT_WHEELS', cs))
    return nodes


def front_uv(xy):
    """front panel metres -> UV of the front graphic texture (photo crop FRONT_CROP)."""
    f = FRONT_PX
    px = xy[:, 0] * f['ppm_x'] + f['cx']
    py = f['py_top'] + (xy[:, 1] - f['y_top']) * (f['py_bot'] - f['py_top']) / (f['y_bot'] - f['y_top'])
    x0, y0, x1, y1 = FRONT_CROP
    return np.stack([(px - x0) / (x1 - x0), (py - y0) / (y1 - y0)], 1)


def slot_outline(n=140):
    """D15: opening in the underside (IMG_0514/0515/0522): rounded trapezoid, wide at the front
    (between the two lights), narrowing towards the column; large corner radii."""
    z0, z1, xf, xb = D['slot_z0'], D['slot_z1'], D['slot_x'], D['slot_xb']
    pts = np.array([[-xb, z0], [xb, z0], [xf, z1], [-xf, z1]], float)
    pts = fillet(pts, lambda p: 0.075 if p[1] > (z0 + z1) / 2 else 0.06, seg=14)
    return ccw(resample_closed(pts, n))


def build_canopy(leds):
    nodes = []
    y0, y1 = D['lb_y0'], D['lb_y1']
    H = y1 - y0
    # ---- lower brim (red): rounded front edge, flat underside, concave chin into the column
    lb = Mesh('B03_canopy_underside', smooth_angle=45)
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
    hole_o = offset_contour(hole, 0.035)                 # edge of the sloped lip around the opening
    rings = [outer + (hole_o - outer) * k for k in np.linspace(0, 1, 9)]
    under_h = lambda a_, b_, h: brim_bottom(b_, a_)
    for ra, rb_ in zip(rings[:-1], rings[1:]):
        Pu, UVu = ring_cap(ra, rb_, X3, Z3, Y3, hfunc=under_h, facing=-1)
        lb.add('BODY_PAINT', Pu, UVu)
    # sloped red lip: from the underside up and into the opening (the "wings" either side)
    lip = []
    for k in range(len(hole)):
        q = (k + 1) % len(hole)
        a = [hole_o[k][0], brim_bottom(hole_o[k][1], hole_o[k][0]), hole_o[k][1]]; b = [hole_o[q][0], brim_bottom(hole_o[q][1], hole_o[q][0]), hole_o[q][1]]
        c = [hole[q][0], brim_bottom(hole[q][1], hole[q][0]) + 0.04, hole[q][1]]; d = [hole[k][0], brim_bottom(hole[k][1], hole[k][0]) + 0.04, hole[k][1]]
        lip += [[a, b, c], [a, c, d]]
    Pl = np.array(lip)
    Pl, _ = orient_with_uv(Pl, np.zeros((len(Pl), 3, 2)), lambda c: np.array([oc[0] - c[0], -1.5, oc[1] - c[2]]), per_triangle=True)
    lb.add('BODY_PAINT', Pl)
    # slot walls + ceiling (black, deep enough to hold the folded ball)
    depth = 0.21
    walls = []
    for k in range(len(hole)):
        q = (k + 1) % len(hole)
        a = [hole[k][0], brim_bottom(hole[k][1], hole[k][0]) + 0.04, hole[k][1]]; b = [hole[q][0], brim_bottom(hole[q][1], hole[q][0]) + 0.04, hole[q][1]]
        c = [hole[q][0], y0 + depth, hole[q][1]]; d = [hole[k][0], y0 + depth, hole[k][1]]
        walls += [[a, b, c], [a, c, d]]
    Pw = np.array(walls)
    Pw, _ = orient_with_uv(Pw, np.zeros((len(Pw), 3, 2)), lambda c: np.array([oc[0] - c[0], 0, oc[1] - c[2]]), per_triangle=True)
    lb.add('CAVITY_DARK', Pw)
    Pc, UVc = cap(hole, X3, Z3, Y3, origin=[0, y0 + depth, 0], facing=-1, center=oc)
    lb.add('CAVITY_DARK', Pc, UVc)
    nodes.append(('B03_canopy_underside', 'CANOPY', lb))

    # ---- graphics band (drum)
    dr = Mesh('B02_canopy_drum', smooth_angle=40)
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
    nodes.append(('B02_canopy_drum', 'CANOPY', dr))
    # the band print runs back along the sides right up to the black rear profiles (no paint strip)
    zb = D['col_z0'] + D['back_trim'] - 0.003
    fL = exact_arc_param(Cd, [-D['col_x'], zb], side_sign=-1)
    fR = exact_arc_param(Cd, [D['col_x'], zb], side_sign=1)
    fF = arc_param_at(Cd, [0, D['drum_z1']])
    a, b = fL, fR
    def between(f0, f1, f):
        return (f - f0) % 1.0 < (f1 - f0) % 1.0
    if not between(a, b, fF):
        a, b = b, a
    if b < a:
        b += 1.0
    bm = Mesh('D27_champion_band', smooth_angle=60)
    P, UV = contour_strip(Cd, a, b, BAND_Y[0], lambda x_, z_: min(top_bottom(z_, x_) - 0.002, BAND_Y[1]), 0.0016, nu=220, nv=6)
    # physical v (the print is a constant-height strip; the lid simply covers more of it on the sides)
    yy = P[..., 1]
    UV = UV.copy(); UV[..., 1] = (BAND_Y[1] - yy) / (BAND_Y[1] - BAND_Y[0])
    bm.add('GFX_BAND', P, UV)
    nodes.append(('D27_champion_band', 'GRAPHICS', bm))

    # ---- lid: thin moulded shell.  A short collar sits on the band, the underside flares out like a
    # bell (steep at the band, almost flat at the rim), rounded rim ~3 cm thick, flat top.
    tb = Mesh('B02_canopy_crown', smooth_angle=30)
    S = TOP_PLAN
    TOP = D['top_y']
    oc = np.array([0.0, 0.38])
    angs = np.linspace(0, 2 * math.pi, 240, endpoint=False)
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    rin = ray_polygon(oc, angs, offset_contour(Cd, 0.004))   # just outside the band
    rout = ray_polygon(oc, angs, S)
    # crown (studio close-ups + IMG_0514/0515/0518/0566/0569/0571): from a small roll above the band
    # the lid face runs straight and steeply inclined (wide angle) out and up to the rim; the rim is
    # cut off by a ~14 mm chamfer before the flat top.
    G = []
    ch_v, ch_h = 0.013, 0.013          # chamfer height / depth
    top_h = lid_top
    for i in range(len(angs)):
        d = dirs[i]; p_in = oc + d * rin[i]; p_out = oc + d * rout[i]
        bot = top_bottom(p_in[1], p_in[0])
        TOPz = max(top_h(p_out[1]), bot + 0.045)
        span = max(rout[i] - rin[i], 0.03)
        col = [[p_in[0], bot - 0.004, p_in[1]], [p_in[0], bot + 0.002, p_in[1]]]
        # lower edge: a concave cove cut into the lid - the arc runs from the band up and out, its
        # middle recessed into the body relative to its ends (as published in v8, kept on request)
        rb = min(0.02, span * 0.35)
        for k in range(1, 7):
            t = k / 6.0 * math.pi / 2
            q = oc + d * (rin[i] + rb * (1 - math.cos(t)))
            col.append([q[0], bot + 0.002 + rb * math.sin(t), q[1]])
        f0 = oc + d * (rin[i] + rb); h0 = bot + 0.002 + rb
        hf = TOPz - ch_v
        for k in range(1, 6):                                   # straight inclined face
            f = k / 5.0
            q = f0 + (p_out - f0) * f
            col.append([q[0], h0 + (hf - h0) * f, q[1]])
        q = p_out - d * ch_h
        col.append([q[0], TOPz, q[1]])                          # chamfer -> top
        q = p_out - d * 0.05
        col.append([q[0], TOPz, q[1]])
        G.append(col)
    G = np.array(G); G = np.concatenate([G, G[:1]], 0)
    P, UV = grid_tris(G, np.zeros(G.shape[:2] + (2,)))
    P, UV = orient_with_uv(P, UV, lambda c: np.array([c[0] - oc[0], 0.0, c[2] - oc[1]]) + np.array([0, -0.6 if c[1] < top_h(c[2]) - 0.002 else 0.6, 0]), per_triangle=False)
    tb.add('BODY_PAINT', P, UV)
    Si = np.array([oc + dirs[i] * (rout[i] - 0.05) for i in range(len(angs))])
    Pt, UVt = cap(Si, X3, Z3, Y3, h=TOP, facing=+1, center=oc)
    Pt = Pt.copy(); Pt[..., 1] = np.vectorize(top_h)(Pt[..., 2])
    tb.add('BODY_PAINT', Pt, UVt)
    nodes.append(('B02_canopy_crown', 'CANOPY', tb))

    # ---- D15: exactly two round lamps in the underside (chrome bezel + emissive disc)
    lb_m = Mesh('D15_lamp_bezels', smooth_angle=30)
    for sx in (-1, 1):
        zz = D['light_z']
        yb = brim_bottom(zz, sx * D['light_x'])
        Pm, UVm = lathe([(0.0, 0.0), (0.036, 0.0), (0.040, 0.004), (0.046, 0.003), (0.047, 0.0)], 32, M=mat_translate(sx * D['light_x'], yb, zz) @ mat_rot('x', 180))
        lb_m.add('METAL', Pm, UVm)
        Pd, UVd = disc(0.034, 32, M=mat_translate(sx * D['light_x'], yb - 0.0025, zz) @ mat_rot('x', 90))
        leds['D15_lamps'].mesh.add('LED_WHITE', Pd, UVd, np.ones((len(Pd), 3, 3)), np.full((len(Pd), 3), float(leds['D15_lamps'].count)))
        leds['D15_lamps'].count += 1
    nodes.append(('D15_lamp_bezels', 'CANOPY', lb_m))
    # ---- D12: START BOXER - chrome rosette with printed text, button with a thin warm glowing ring
    st = Mesh('D12_start_button', smooth_angle=35)
    p, n = plan_point(C, arc_param_at(C, [0, D['lb_z1']]))
    pos = np.array([p[0], (y0 + y1) / 2, p[1]])
    B = look_basis(pos, [n[0], 0, n[1]]) @ mat_rot('x', 90)
    Pl, UVl = lathe([(0.0, 0.0), (0.019, 0.0), (0.019, 0.0035), (0.0175, 0.005), (0.0, 0.005)], 32, M=B)
    st.add('METAL', Pl, UVl)
    Pk, UVk = disc(0.0175, 32, M=look_basis(pos + np.array([n[0], 0, n[1]]) * 0.0052, [n[0], 0, n[1]]))
    st.add('DECALS', Pk, atlas_uv('lock', UVk))
    Pb, UVb = lathe([(0.0, 0.0055), (0.0068, 0.0055), (0.0064, 0.0085), (0.0, 0.0092)], 24, M=B)
    st.add('METAL', Pb, UVb)
    nodes.append(('D12_start_button', 'DETAILS', st))
    rg = Mesh('D12_start_ring', smooth_angle=30)
    ring_in, ring_out = 0.0070, 0.0082
    tris = []
    for k in range(32):
        t0 = 2 * math.pi * k / 32; t1 = 2 * math.pi * (k + 1) / 32
        a_ = [ring_in * math.cos(t0), ring_in * math.sin(t0), 0]; b_ = [ring_out * math.cos(t0), ring_out * math.sin(t0), 0]
        c_ = [ring_out * math.cos(t1), ring_out * math.sin(t1), 0]; d_ = [ring_in * math.cos(t1), ring_in * math.sin(t1), 0]
        tris += [[a_, b_, c_], [a_, c_, d_]]
    Pr = np.array(tris); Pr, _ = orient_with_uv(Pr, np.zeros((len(Pr), 3, 2)), [0, 0, 1])
    Pr = apply(look_basis(pos + np.array([n[0], 0, n[1]]) * 0.0058, [n[0], 0, n[1]]), Pr.reshape(-1, 3)).reshape(-1, 3, 3)
    rg.add('START_GLOW', Pr, np.zeros((len(Pr), 3, 2)) + 0.5)
    nodes.append(('D12_start_ring', 'EMISSION', rg))
    return nodes


def build_bag():
    """D13 / D14: one punch bag LOWERED vertically (F34, F35, P01).  Black leather neck cover
    emerging from the front of the opening: narrow at the top with one horizontal fold, flaring into
    a skirt that overlaps the top of the ball.  Egg-shaped ball of 4 vertical panels (black at front
    and back, red at the sides) meeting at the bottom; seams as shallow grooves.  The mechanism inside
    the opening is not modelled (dark cavity only)."""
    nodes = []
    hx, hz = D['bag_hang']
    ytop = D['lb_y0'] + 0.03                     # starts inside the opening
    yskirt = D['lb_y0'] - D['neck_len']
    bx, by, bz = D['bag_center']
    rx, ry = D['bag_rx'], D['bag_ry']
    # D14_neck_mount: black block visible at the top of the neck inside the opening (F35)
    mt = Mesh('D14_neck_mount', smooth_angle=40)
    P = rounded_box_tris([hx - 0.045, D['lb_y0'] - 0.005, hz - 0.04], [hx + 0.045, D['lb_y0'] + 0.06, hz + 0.04], 0.006, seg=3, step=1)
    mt.add('BLACK_PLASTIC', P)
    nodes.append(('D14_neck_mount', 'BAG_LOWERED', mt))
    # D14_neck
    nk = Mesh('D14_neck', smooth_angle=65)
    prof = []
    for yy in np.linspace(ytop, yskirt, 44):
        t = (ytop - yy) / (ytop - yskirt)
        r = D['neck_top_r'] + 0.024 * t                             # tapered sleeve, wider downwards
        r += 0.007 * math.exp(-((t - 0.34) / 0.04) ** 2)            # horizontal fold
        if t > 0.80:                                                 # short cuff flaring over the ball
            u = (t - 0.80) / 0.20
            r += (D['neck_skirt_r'] - D['neck_top_r'] - 0.024) * (u ** 1.4)
        prof.append((r, yy))
    prof += [(D['neck_skirt_r'] - 0.004, yskirt - 0.006), (D['neck_skirt_r'] - 0.016, yskirt - 0.004)]
    def wr(a, yy, rr):
        t = min(max((ytop - yy) / (ytop - yskirt), 0.0), 1.0)
        wav = 0.05 * math.sin(a * 4 + 0.6) * max(0.0, t - 0.75) / 0.25     # soft folds in the cuff
        sq = 1.0 + 0.12 * math.cos(2 * a) * (1 - 0.6 * t)                 # sleeve slightly flattened (wider side to side)
        return rr * (1 + wav) * sq
    P, UV = lathe(prof, 48, M=mat_translate(hx, 0, hz), radial_fn=wr)
    nk.add('LEATHER_BLACK', P, UV)
    nodes.append(('D14_neck', 'BAG_LOWERED', nk))
    # D13_bag: 4 gores, egg profile (widest a little below the centre)
    bg = Mesh('D13_bag', smooth_angle=50)
    ng = 4
    for g in range(ng):
        a0 = 2 * math.pi * g / ng - math.pi / 4; a1 = a0 + 2 * math.pi / ng
        prof = []
        for ph in np.linspace(0.04, math.pi - 0.04, 34):
            rr = rx * math.sin(ph) * (1.0 + 0.06 * math.cos(ph) * -1.0)
            prof.append((rr, by + ry * math.cos(ph)))
        def seam(a, yy, rr, a0=a0, a1=a1):
            d = min(abs(a - a0), abs(a - a1))
            return rr * (1 - 0.018 * math.exp(-(d / 0.035) ** 2))
        P, UV = lathe(prof, 14, M=mat_translate(bx, 0, bz), radial_fn=seam, a0=a0, a1=a1)
        bg.add('BOXING_BAG_BLACK' if g % 2 == 0 else 'BOXING_BAG_RED', P, UV)
    for ph_c in (0.04, math.pi - 0.04):        # close the poles
        y_ = by + ry * math.cos(ph_c); r_ = rx * math.sin(ph_c)
        Pc, UVc = disc(r_ * 1.01, 16, M=mat_translate(bx, y_, bz) @ mat_rot('x', -90 if ph_c < 1 else 90))
        bg.add('BOXING_BAG_BLACK', Pc, UVc)
    nodes.append(('D13_bag', 'BAG_LOWERED', bg))
    return nodes


def build_all():
    global MODEL_SCALE
    leds = {k: LedGroup(k) for k in ('D15_lamps',)}
    nodes = []
    nodes += build_platform()
    col_nodes, rb = build_column()
    nodes += col_nodes
    nodes += build_canopy(leds)
    nodes += build_bag()
    for k, g in leds.items():
        if g.count:
            nodes.append((k, 'EMISSION', g.mesh))
    ymax = max(float(np.concatenate(gr['P']).reshape(-1, 3)[:, 1].max()) for _, _, m in nodes for gr in m.groups.values())
    S = TARGET_HEIGHT / ymax
    nodes = [(n, p, m.transformed(mat_scale(S))) for n, p, m in nodes]
    MODEL_SCALE = S
    return nodes, leds


ROOT_NAME = 'BOXER_CHAMPION'
GROUPS = ['BODY', 'CANOPY', 'BASE', 'FRONT_PANEL', 'REAR_DOORS', 'BAG_LOWERED', 'TRANSPORT_WHEELS', 'DETAILS', 'GRAPHICS', 'EMISSION']

# custom properties per object (source_ids, confidence, measurement_status, detail_id)
_PG = 'photogrammetry (BA of F01/F02/F10/F26)'
META = {
    'B01_body': ('F01,F02,F10,F18,F19,F31', 'high', _PG, 'B01'),
    'D09_front_profiles': ('F27,F05,F28,F29', 'medium', 'section estimated', 'D09/D28'),
    'D24_front_graphic': ('F01,F10,F26', 'high', 'projective bake of 3 photos', 'D24/B05'),
    'D18_score_shield': ('F26', 'high', 'outline measured on rectified front', 'D18'),
    'D18_score_glass': ('F26,F07', 'medium', 'estimated', 'D18'),
    'D19_score_777': ('P01,F26', 'medium', 'window measured, digits per P01', 'D19'),
    'D19_highscore_649': ('P01,F26', 'medium', 'window measured, digits per P01', 'D19'),
    'D19_credit_5': ('P01,F26', 'medium', 'window measured, digits per P01', 'D19'),
    'D16_payment_panel': ('F26,F01,F10', 'high', 'measured on rectified front', 'D16'),
    'D17_game_rules': ('F26,F06', 'medium', 'measured on rectified front; text from photo', 'D17'),
    'D26_left_graphic': ('F10,F19', 'high', 'projective bake', 'D26'),
    'D25_right_graphic': ('F02,F18', 'high', 'projective bake', 'D25'),
    'D03_upper_door_frame': ('F31,F18,F19', 'high', 'F31 frontal, scale from body width', 'D03'),
    'D03_upper_door_leaf': ('F31', 'high', 'F31 frontal', 'D03'),
    'D04_lower_door_frame': ('F31', 'high', 'F31 frontal', 'D04'),
    'D04_lower_door_leaf': ('F31', 'high', 'F31 frontal', 'D04'),
    'D01_upper_lock': ('F31,F18,F19', 'medium', 'estimated size', 'D01'),
    'D02_lower_lock': ('F31,F18,F19', 'medium', 'estimated size', 'D02'),
    'D22_power_socket': ('F31', 'medium', 'F31 frontal', 'D22'),
    'D23_rating_plate': ('F31', 'medium', 'F31 frontal; texture from photo', 'D23'),
    'D05_rear_profiles': ('F31,F32', 'medium', 'section estimated; only visible screws', 'D05'),
    'D06_rear_wheel_assembly_right': ('F32,F17,F20', 'medium', 'diameter estimated', 'D06'),
    'D07_rear_wheel_assembly_left': ('F32,F17,F20', 'medium', 'diameter estimated', 'D07'),
    'B03_canopy_underside': ('F11,F16,F28-F30,F35', 'medium', 'opening shape estimated', 'B03/D11/D15'),
    'B02_canopy_drum': ('F15,F21-F26', 'high', _PG, 'B02'),
    'D27_champion_band': ('F26,F01,F02,F10', 'high', 'projective bake on curved surface', 'D27'),
    'B02_canopy_crown': ('F21-F25,F32', 'medium', 'roof not documented (Q01) - estimated', 'B02/D10'),
    'D15_lamp_bezels': ('F35,F16', 'high', 'positions photogrammetry', 'D15'),
    'D15_lamps': ('F35,P01', 'high', 'emission', 'D15'),
    'D12_start_button': ('F26,F35', 'high', 'diameter estimated', 'D12'),
    'D12_start_ring': ('F35,P01', 'medium', 'emission', 'D12'),
    'D14_neck_mount': ('F35', 'low', 'estimated', 'D14'),
    'D14_neck': ('F34,F35', 'medium', 'estimated length', 'D14'),
    'D13_bag': ('F34,F35,P01', 'medium', 'estimated size; back not visible', 'D13'),
    'B04_base_frame': ('F02,F03,F33', 'medium', 'underside not documented', 'B04/D21'),
    'D20_base_tread_plate': ('F33,F03,F10', 'high', _PG, 'D20'),
}

ZONES = {
    'front': dict(label='FRONT PANEL', material='GFX_FRONT', meshes=['D24_front_graphic'], size=[0.67, 1.805]),
    'band': dict(label='CANOPY BAND', material='GFX_BAND', meshes=['D27_champion_band'], size=[2.39, 0.229]),
    'left': dict(label='LEFT SIDE', material='GFX_LEFT', meshes=['D26_left_graphic'], size=[0.238, 1.859]),
    'right': dict(label='RIGHT SIDE', material='GFX_RIGHT', meshes=['D25_right_graphic'], size=[0.238, 1.859]),
}
