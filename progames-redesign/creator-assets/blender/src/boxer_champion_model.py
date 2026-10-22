"""
boxer_champion_model.py - PRO GAMES "Boxer Champion".

v10 (21.10.2026): the SHAPE follows the manufacturer's CAD renders (SolidWorks: front, both sides,
top, two 3/4 views).  Graphics, colours and materials are the ones of the previous (photo based)
version; the factory print files were re-fitted to the new shape by fit_champion_cad_textures.py.

Shape per CAD:
  * column 0.70 m wide x 0.321 m deep standing on the rear part of a flat 0.72 x 1.137 m base plate
    (33 mm plate with a short front bevel on 4 levelling feet, 97 mm of plate behind the column);
  * canopy = one box as wide as the column (sides flush with the column sides) running from the
    column back to a semicircular front (r = 0.35 m), 1.858 -> 2.103 m, with a chamfered lower edge
    (bottom tray) and a flat underside (no 'chin'); a thin ledge plate between box and lid;
  * lid = flat 'U' shell 0.838 m wide x 1.296 m long (straight sides, semicircular front), top at
    2.19 m, nose rolling down to an underside that rises from the box to the rim, recessed top panel
    with 4 screw heads and a round cap at the back right;
  * crest shaped score shield: raised glass face with a sloped bevel that is narrow along the sides,
    wide at the pointed bottom and forms 'horns' at the top corners.

State: ONE punch bag lowered vertically, doors closed, displays 777 / 649 / 5.
Axes: metres, glTF (Y up, +Z = machine front, +X = machine right), origin on the floor.
"""
import math
import numpy as np
from meshlib import (Mesh, RoundedBox, sweep, cap, ring_cap, lathe, uv_sphere, quad, disc, box,
                     rounded_box_tris, convex_hull, fillet, resample_closed, ccw, offset_contour,
                     contour_normals, ray_polygon, mat_translate, mat_rot, mat_scale, look_basis,
                     apply, orient_with_uv, orient_volume, grid_tris)
from double_strike_model import (plan_point, arc_param_at, contour_strip, _outward_from_plan, LedGroup,
                                 X3, Y3, Z3)

# All dimensions measured on the CAD renders (side view = scale reference, 642.5 px/m; top view
# 1017 px/m; front view corrected for its perspective), height 2.19 m = catalogue K01.
D = dict(
    # base plate: flat, 0.72 m wide, short bevel at the front, on 4 levelling feet
    plat_x=0.36, plat_z0=-0.255, plat_z1=0.882, plat_h=0.039, plat_y0=0.006, ramp=0.026, chamfer=0.006,
    foot_r=0.026, foot_x=0.315, foot_z=(-0.17, 0.761),
    # column
    col_x=0.35, col_z0=-0.158, col_z1=0.163, col_y0=0.039, col_y1=1.80, col_box_y1=1.907,
    frame_w=0.0, side_red=0.012, back_trim=0.028,      # no front corner rails (real machine); side print runs to the front edge and up to the band
    # canopy box (sides flush with the column, semicircular front)
    lb_y0=1.858, lb_y1=2.103, lb_x=0.35, lb_z1=0.956, lb_r=0.35,
    wall_y0=1.907, cham_in=0.024, cham_y=1.873, edge_in=0.040, ledge_t=0.008, ledge_out=0.010,
    # kept for older scripts: the canopy front = 'drum'
    drum_x=0.35, drum_z1=0.956, drum_r=0.35,
    # lid
    top_x=0.419, top_z0=-0.183, top_z1=1.113, top_r=0.419, top_y=2.19, top_recess=0.022,
    panel_x=0.363, panel_z0=-0.150, panel_zc=0.651, panel_wall=0.014,     # recessed top panel inside the surround
    # punch bag LOWERED: neck hangs from the narrow front part of the underside opening
    bag_rx=0.12, bag_ry=0.14, bag_hang=(0.0, 0.66), neck_len=0.225, neck_top_r=0.030, neck_skirt_r=0.098,
    # underside opening: narrow front slot (bag mount) widening into a rounded opening towards the column
    slot_x=0.17, slot_xn=0.05, slot_z0=0.215, slot_z1=0.76, slot_zn=0.57,
    # canopy down-lights (flank the narrow part of the opening)
    light_x=0.16, light_z=0.665,
)
D.update(
    door_upper=(-0.032, 1.39, 0.450, 0.450),
    door_lower=(-0.005, 0.765, 0.222, 0.246),
    lock_upper=(-0.194, 1.375), lock_lower=(-0.055, 0.743),
    rating_plate=(0.149, 1.138, 0.066, 0.053), power_socket=(-0.128, 1.105, 0.044, 0.057),
    rear_screws_y=(0.15, 0.735, 1.38, 2.05),
    wheel_xy=((-0.267, 2.026), (0.267, 2.026)), wheel_r=0.0385, wheel_w=0.028,
    # lid top: 4 screw heads, round cap at the back right (CAD top view)
    lid_screws=((-0.25, 0.24), (0.25, 0.24), (-0.25, 0.684), (0.25, 0.684)), lid_cap=(0.265, -0.083, 0.045),
)
D['bag_center'] = (D['bag_hang'][0], D['lb_y0'] - D['neck_len'] - D['bag_ry'] + 0.032, D['bag_hang'][1])
LID_UNDER = D['lb_y1'] + D['ledge_t']          # lid underside where it sits on the ledge
CANOPY_ZC = D['lb_z1'] - D['lb_r']              # centre of the canopy front semicircle
LID_ZC = D['top_z1'] - D['top_r']               # centre of the lid front semicircle

PARAMS = {
    'H_nominal': (2.19, 'catalogue K01 / CAD'),
    'W_nominal': (0.72, 'catalogue K02 = base plate width (CAD)'),
    'D_nominal': (1.15, 'catalogue K03'),
    'body_width': (2 * D['col_x'], 'CAD front view'),
    'body_depth': (D['col_z1'] - D['col_z0'], 'CAD side view'),
    'canopy_front_extent': (D['lb_z1'] - D['col_z0'], 'CAD side view'),
    'canopy_height': ((D['lb_y0'], D['lb_y1']), 'CAD side view'),
    'lid_size': ((2 * D['top_x'], D['top_z1'] - D['top_z0']), 'CAD top + side view'),
    'base_outline': ((2 * D['plat_x'], D['plat_z1'] - D['plat_z0']), 'CAD top + side view'),
    'base_thickness': (D['plat_h'] - D['plat_y0'], 'CAD side view'),
    'bag_center_xyz': (D['bag_center'], 'bag mount position from CAD, lowered state'),
    'door_upper_bounds': (D['door_upper'], 'photogrammetry (rear not in CAD set)'),
    'door_lower_bounds': (D['door_lower'], 'photogrammetry (rear not in CAD set)'),
    'wheel_centers': (D['wheel_xy'], 'CAD top + side view'),
}

TARGET_HEIGHT = 2.19
MODEL_SCALE = 1.0


def top_bottom(z, x=0.0):
    """Lid underside where it sits on the canopy (flat in the CAD)."""
    return LID_UNDER


def lid_top(z):
    return D['top_y']


def brim_bottom(z, x=0.0):
    """Canopy underside: flat (CAD), no chin."""
    return D['lb_y0']


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


def stadium_plan(hx, z0, zc, n=320, back_r=0.0):
    """Straight sides from z0 to zc, semicircular front of radius hx around (0, zc). CCW (x, z)."""
    m = 64
    pts = [[-hx, z0], [hx, z0]]
    pts += [[hx, z] for z in np.linspace(z0, zc, 24)[1:]]
    pts += [[hx * math.cos(a), zc + hx * math.sin(a)] for a in np.linspace(0, math.pi, m)[1:-1]]
    pts += [[-hx, z] for z in np.linspace(zc, z0, 24)[:-1]]
    pts = np.array(pts, float)
    if back_r > 0:
        pts = fillet(pts, lambda p: back_r if p[1] < z0 + 1e-6 else 0.0, seg=6)
    return ccw(resample_closed(pts, n))


DRUM_PLAN = stadium_plan(D['lb_x'], D['col_z0'], CANOPY_ZC)                 # canopy box outline
TOP_PLAN = stadium_plan(D['top_x'], D['top_z0'], LID_ZC, n=360, back_r=0.01)  # lid outline
LB_PLAN = DRUM_PLAN
PANEL_PLAN = stadium_plan(D['panel_x'], D['panel_z0'], D['panel_zc'], n=360)    # recessed lid top panel

# ----------------------------------------------------------------------------
# Front panel (graphic between the corner rails)
# ----------------------------------------------------------------------------
FRONT_GFX = dict(x0=-0.344, x1=0.344, y0=0.041, y1=1.858)
# photo frame of the previous version (used by the photo pipeline scripts only)
FRONT_PX = dict(cx=512.0, ppm_x=685.0, py_top=300.0, y_top=1.80, py_bot=1315.0, y_bot=0.045)
FRONT_CROP = (318, 300, 706, 1315)

# Score shield, CAD front view.  OUTER = edge of the sloped bevel on the panel (right half,
# top tip -> bottom point), TOP = top edge between the horns, INNER = edge of the raised glass face.
SHIELD_OUTER = [(0.281, 1.798), (0.252, 1.733), (0.235, 1.667), (0.239, 1.584), (0.252, 1.501), (0.264, 1.418),
                (0.272, 1.335), (0.274, 1.268), (0.272, 1.185), (0.255, 1.102), (0.218, 1.036), (0.154, 0.969),
                (0.069, 0.903), (0.0, 0.850)]
SHIELD_OUTER_TOP = [(0.0, 1.795), (0.05, 1.794), (0.10, 1.789), (0.15, 1.780), (0.20, 1.771), (0.227, 1.768),
                    (0.255, 1.782)]
SHIELD_INNER = [(0.227, 1.758), (0.218, 1.684), (0.221, 1.601), (0.235, 1.518), (0.252, 1.435), (0.262, 1.352),
                (0.264, 1.269), (0.255, 1.186), (0.230, 1.103), (0.179, 1.020), (0.095, 0.945), (0.0, 0.903)]
SHIELD_INNER_TOP = [(0.0, 1.791), (0.05, 1.790), (0.10, 1.785), (0.15, 1.776), (0.20, 1.765)]
SHIELD_H = 0.010          # glass face above the panel (CAD side view: ~8-10 mm)


def _smooth_closed(P, it=2):
    for _ in range(it):
        P = 0.25 * np.roll(P, 1, 0) + 0.5 * P + 0.25 * np.roll(P, -1, 0)
    return P


def _closed_outline(side, top, n):
    """Mirror a right-half outline (top->bottom point) + top edge (centre->right) into a closed CCW
    contour, resampled to n points starting at the bottom point."""
    right = np.array(side, float)
    topr = np.array(top, float)
    pts = np.vstack([right[::-1],                       # bottom point -> tip (right side, going up)
                     topr[::-1],                         # top edge right -> centre
                     topr[1:] * [-1, 1],                 # centre -> left
                     right[:-1] * [-1, 1]])              # tip left -> just above bottom
    pts = ccw(pts)
    # start at the bottom point
    i0 = int(np.argmin(pts[:, 1])); pts = np.roll(pts, -i0, 0)
    P = resample_closed(pts, n)
    i0 = int(np.argmin(P[:, 1])); P = np.roll(P, -i0, 0)
    return P


def shield_outline(n=240):
    return _closed_outline(SHIELD_OUTER, SHIELD_OUTER_TOP, n)


def shield_inner(n=240):
    return _closed_outline(SHIELD_INNER, SHIELD_INNER_TOP, n)


# Displays, coin acceptor and rules plate (front, metres).  Display windows and the rules plate are
# where the re-fitted print puts them (fit_champion_cad_textures.py prints these values); the coin
# acceptor is at its CAD position.
SCREENS = {'score': (-0.145, 1.322, 0.144, 1.448), 'high': (-0.078, 1.189, 0.079, 1.272), 'credit': (-0.022, 1.117, 0.025, 1.155)}   # = display windows of the shield photo
COIN = (-0.268, 0.854, -0.205, 0.975)          # coin acceptor where it is on the machine (front photo)
RULES = (0.205, 0.826, 0.298, 0.969)          # rules plate where it is on the machine (front photo)

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

# graphics band: printed on the vertical canopy wall, [left side | semicircular front | right side]
BAND_Y = (D['wall_y0'] + 0.002, D['lb_y1'] - 0.002)


def band_range():
    """Arc fractions of the band on DRUM_PLAN (from the left black rear profile round the front to the
    right one) and its length in metres."""
    Cd = DRUM_PLAN
    zb = D['col_z0'] + D['back_trim'] - 0.003
    fL = exact_arc_param(Cd, [-D['col_x'], zb], side_sign=-1)
    fR = exact_arc_param(Cd, [D['col_x'], zb], side_sign=1)
    fF = exact_arc_param(Cd, [0, D['lb_z1']])
    a, b = fL, fR
    def between(f0, f1, f):
        return (f - f0) % 1.0 < (f1 - f0) % 1.0
    if not between(a, b, fF):
        a, b = b, a
    if b < a:
        b += 1.0
    C = np.vstack([Cd, Cd[:1]]); per = np.linalg.norm(np.diff(C, axis=0), axis=1).sum()
    return a, b, (b - a) * per


# ----------------------------------------------------------------------------
def build_platform():
    """Flat base plate (CAD): 0.72 m wide, plate behind and in front of the column, short bevel at the
    front, 4 levelling feet.  Top keeps the tread-plate finish of the previous version."""
    nodes = []
    x, z0, z1, h, yb, ramp, ch = D['plat_x'], D['plat_z0'], D['plat_z1'], D['plat_h'], D['plat_y0'], D['ramp'], D['chamfer']
    zr = z1 - ramp
    base = Mesh('B04_base_frame', smooth_angle=30)
    dp = Mesh('D20_base_tread_plate', smooth_angle=20)
    K = 1 / 0.059

    def plate(P, up):
        P = np.array(P, float)
        UV = np.stack([P[..., 0] * K, P[..., 2] * K], -1)
        P, UV = orient_with_uv(P, UV, up)
        dp.add('DIAMOND_PLATE', P, UV)

    xi = x - ch
    a, b, c, d = [-xi, h, z0 + ch], [xi, h, z0 + ch], [xi, h, zr], [-xi, h, zr]
    plate([[a, b, c], [a, c, d]], [0, 1, 0])
    # front bevel (full width, full plate thickness)
    yl = yb + 0.002
    a, b, c, d = [-xi, h, zr], [xi, h, zr], [x, yl, z1], [-x, yl, z1]
    plate([[a, b, c], [a, c, d]], [0, 0.8, 1])
    for sx in (-1, 1):
        a, b, c, d = [sx * xi, h, z0 + ch], [sx * x, h - ch, z0], [sx * x, h - ch, zr], [sx * xi, h, zr]
        plate([[a, b, c], [a, c, d]], [sx, 1, 0])
        e = [sx * x, yl, z1]
        plate([[d, c, e], [d, e, [sx * xi, h, zr]]], [sx, 1, 0.3])
    a, b, c, d = [-xi, h, z0 + ch], [xi, h, z0 + ch], [x, h - ch, z0], [-x, h - ch, z0]
    plate([[a, b, c], [a, c, d]], [0, 1, -1])
    # plate edges / underside
    P = rounded_box_tris([-x + 0.001, yb, z0 + 0.001], [x - 0.001, h - ch + 0.0005, zr], 0.002, seg=2, step=1)
    base.add('BLACK_STEEL', P)
    for sx in (-1, 1):
        a = [sx * (x - 0.001), yb, zr]; b = [sx * (x - 0.001), h - ch, zr]; c = [sx * (x - 0.001), yl, z1 - 0.002]
        Pw, _ = orient_with_uv(np.array([[a, b, c]], float), np.zeros((1, 3, 2)), [sx, 0, 0])
        base.add('BLACK_STEEL', Pw)
    nodes.append(('B04_base_frame', 'BASE', base))
    nodes.append(('D20_base_tread_plate', 'BASE', dp))
    # levelling feet (CAD side + front view)
    ft = Mesh('D21_base_feet', smooth_angle=40)
    r = D['foot_r']
    for fx in (-D['foot_x'], D['foot_x']):
        for fz in D['foot_z']:
            P, UV = lathe([(0.0, 0.0), (r * 0.92, 0.0), (r, 0.0015), (r, yb), (0.0, yb)], 28, M=mat_translate(fx, 0, fz))
            ft.add('RUBBER', P, UV)
    nodes.append(('D21_base_feet', 'BASE', ft))
    return nodes


def build_column():
    nodes = []
    cx, z0, z1, y0 = D['col_x'], D['col_z0'], D['col_z1'], D['col_y0']
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

    # corner rails: up both front edges and bending forward into the canopy underside (CAD)

    # FRONT graphic (whole front panel between the corner rails)
    fm = Mesh('D24_front_graphic', smooth_angle=60)
    G = FRONT_GFX
    Pq, UVq = quad([(G['x0'] + G['x1']) / 2, (G['y0'] + G['y1']) / 2, z1 + 0.0012], X3, Y3, G['x1'] - G['x0'], G['y1'] - G['y0'], nx=4, ny=16)
    xy = Pq.reshape(-1, 3)[:, :2]
    UVf = np.stack([(xy[:, 0] - G['x0']) / (G['x1'] - G['x0']), (G['y1'] - xy[:, 1]) / (G['y1'] - G['y0'])], 1).reshape(-1, 3, 2)
    fm.add('GFX_FRONT', Pq, UVf)
    nodes.append(('D24_front_graphic', 'GRAPHICS', fm))

    # crest shaped score shield (CAD): sloped bevel from the outer outline on the panel up to the
    # raised glass face; narrow along the sides, wide at the bottom point, 'horns' at the top corners
    sb = Mesh('D18_score_shield', smooth_angle=50)
    O = shield_outline(); I = shield_inner()
    zp, zt = z1 + 0.0012, z1 + SHIELD_H
    rows = [(O, zp - 0.0022), (O, zp + 0.0022), (O * 0.4 + I * 0.6, zt - 0.0012), (I, zt), (offset_contour(I, -0.002), zt - 0.0004)]
    Gs = np.array([[[p[0], p[1], z] for p in R] for R, z in rows]).transpose(1, 0, 2)
    Gs = np.concatenate([Gs, Gs[:1]], 0)
    P, UV = grid_tris(Gs, np.zeros(Gs.shape[:2] + (2,)))
    ctr = np.array([0.0, 1.33])
    P, UV = orient_with_uv(P, UV, lambda c: np.array([c[0] - ctr[0], c[1] - ctr[1], 0.0]) * 0.6 + np.array([0, 0, 1.0]), per_triangle=True)
    sb.add('BODY_PAINT', P, UV)
    nodes.append(('D18_score_shield', 'FRONT_PANEL', sb))

    for region, nm in (('score', 'D19_score_777'), ('high', 'D19_highscore_649'), ('credit', 'D19_credit_5')):
        xa_, ya_, xb_, yb_ = SCREENS[region]
        sc = Mesh(nm, smooth_angle=10)
        Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0042], X3, Y3, (xb_ - xa_) * 1.0, (yb_ - ya_) * 1.0)   # covers the whole (blacked-out) window
        u0, v0, u1, v1 = [c / 1024.0 for c in SCREEN_ATLAS[region]]
        UVq[..., 0] = u0 + UVq[..., 0] * (u1 - u0); UVq[..., 1] = v0 + UVq[..., 1] * (v1 - v0)
        sc.add('SCREEN', Pq, UVq)
        nodes.append((nm, 'EMISSION', sc))
    gl = Mesh('D18_score_glass', smooth_angle=10)
    Pg, UVg = cap(offset_contour(I, -0.0015), X3, Y3, Z3, origin=[0, 0, zt - 0.0006], facing=+1, center=ctr)
    gl.add('GLASS', Pg, UVg)
    nodes.append(('D18_score_glass', 'FRONT_PANEL', gl))

    # coin acceptor (CAD position) and the game-rules plate
    ca = Mesh('D16_payment_panel', smooth_angle=40)
    xa_, ya_, xb_, yb_ = COIN
    Pf = rounded_box_tris([xa_, ya_, z1 - 0.004], [xb_, yb_, z1 + 0.012], 0.003, seg=4, step=1)
    ca.add('BLACK_PLASTIC', Pf)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0123], X3, Y3, (xb_ - xa_) * 0.97, (yb_ - ya_) * 0.98)
    ca.add('DECALS', Pq, atlas_uv('coin', UVq))
    bx, by = xa_ + (xb_ - xa_) * 0.63, ya_ + (yb_ - ya_) * 0.615          # on the printed button of the decal
    Pb = rounded_box_tris([bx - 0.0105, by - 0.0082, z1 + 0.011], [bx + 0.0105, by + 0.0082, z1 + 0.017], 0.002, seg=3, step=1)
    ca.add('BUTTON_RED', Pb)
    nodes.append(('D16_payment_panel', 'FRONT_PANEL', ca))
    ca = Mesh('D17_game_rules', smooth_angle=40)
    xa_, ya_, xb_, yb_ = RULES
    Pr = rounded_box_tris([xa_, ya_, z1 - 0.001], [xb_, yb_, z1 + 0.004], 0.002, seg=3, step=1)
    ca.add('BLACK_PLASTIC', Pr)
    Pq, UVq = quad([(xa_ + xb_) / 2, (ya_ + yb_) / 2, z1 + 0.0043], X3, Y3, (xb_ - xa_) * 0.98, (yb_ - ya_) * 0.98)
    ca.add('DECALS', Pq, atlas_uv('rules', UVq))
    nodes.append(('D17_game_rules', 'FRONT_PANEL', ca))

    for side, nm, mat in (('-x', 'D26_left_graphic', 'GFX_LEFT'), ('+x', 'D25_right_graphic', 'GFX_RIGHT')):
        dm = Mesh(nm, smooth_angle=60)
        P, UV = rb.decal_grid(side, y0 + 0.002, D['col_box_y1'] - 0.004, z0 + D['back_trim'], z1 - D['side_red'], offset=0.0012, na=24, nb=4)
        dm.add(mat, P, UV)
        nodes.append((nm, 'GRAPHICS', dm))
    return nodes, rb


def corner_rail(sx, n_vert=40):
    """Corner profile (concave front channel): front edge (vertical) -> bend -> canopy underside."""
    cx, z1 = D['col_x'], D['col_z1']
    rr = 0.035
    yb = D['lb_y0'] - rr
    path = [(y, z1) for y in np.linspace(D['col_y0'], yb, n_vert)]
    for a in np.linspace(0, math.pi / 2, 12)[1:]:
        path.append((yb + rr * math.sin(a), z1 + rr * (1 - math.cos(a))))
    for z in np.linspace(z1 + rr, z1 + 0.11, 10)[1:]:
        path.append((D['lb_y0'], z))
    path = np.array(path)
    fw = 0.036
    kw = D['frame_w'] / fw                       # CAD rails are narrower than the photo ones
    sec = [(-fw, 0.0), (-fw, 0.003), (-fw + 0.004, 0.0075), (-0.029, 0.0095)]
    for t in np.linspace(0, 1, 11)[1:-1]:
        sec.append((-0.029 + 0.025 * t, 0.0095 - 0.005 * math.sin(math.pi * t)))
    sec += [(-0.004, 0.0095)]
    cq, cp, r = 0.0045, 0.0055, 0.004
    for ang in np.linspace(math.pi / 2, 0, 6)[1:]:
        sec.append((cq + r * math.cos(ang), cp + r * math.sin(ang)))
    sec += [(0.0085, -0.012), (0.0072, -0.034), (0.003, -0.042), (0.0, -0.043)]
    sec = np.array(sec) * np.array([kw, 0.8])
    L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(path, axis=0), axis=1))])
    G = np.zeros((len(path), len(sec), 3)); UV = np.zeros(G.shape[:2] + (2,)); axis = []
    cen = sec.mean(0)
    for i, (y, z) in enumerate(path):
        j0, j1 = max(i - 1, 0), min(i + 1, len(path) - 1)
        t = path[j1] - path[j0]; t = t / np.linalg.norm(t)
        nf = np.array([0.0, -t[1], t[0]])
        k = min(1.0, (L[-1] - L[i]) / 0.06)
        k = 0.1 + 0.9 * k
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
    G = FRONT_GFX
    return np.stack([(xy[:, 0] - G['x0']) / (G['x1'] - G['x0']), (G['y1'] - xy[:, 1]) / (G['y1'] - G['y0'])], 1)


def slot_outline(n=160):
    """Underside opening: narrow slot at the front where the bag mount sits, widening into a big
    rounded opening towards the column (CAD 3/4 view from below)."""
    z0, z1, zn, xw, xn = D['slot_z0'], D['slot_z1'], D['slot_zn'], D['slot_x'], D['slot_xn']
    zw = zn - 0.11
    pts = np.array([[-xn, z1], [xn, z1], [xn, zn], [xw, zw], [xw, z0 + 0.03], [-xw, z0 + 0.03], [-xw, zw], [-xn, zn]], float)
    def rad(p):
        if p[1] > z1 - 1e-6: return 0.015
        if abs(p[1] - zn) < 1e-6: return 0.05
        if abs(p[1] - zw) < 1e-6: return 0.06
        return 0.10
    pts = fillet(pts, rad, seg=14)
    return ccw(resample_closed(pts, n))


def _chamfer_k(z):
    """1 where the canopy overhangs the column (lower edge chamfered), 0 over the column."""
    t = min(max((z - D['col_z1'] - 0.004) / 0.05, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def _lid_f(d):
    """Lid underside rise (m) at distance d from the rim, fitted to the CAD side view."""
    return 0.008 * max(1 - d / 0.157, 0.0) + 0.065 * math.exp(-d / 0.04)


def build_canopy(leds):
    nodes = []
    y0, y1 = D['lb_y0'], D['lb_y1']
    C = DRUM_PLAN
    Nn = contour_normals(C)
    # ---- canopy box: vertical wall, chamfered bottom tray, flat underside (one moulding in BODY_PAINT)
    sh = Mesh('B02_canopy_drum', smooth_angle=40)
    prof = [(0.0, y1), (0.0, D['wall_y0']), (-0.003, D['wall_y0'] - 0.005), (-D['cham_in'], D['cham_y']),
            (-(D['cham_in'] + D['edge_in']) / 2 - 0.001, y0 + 0.003), (-D['edge_in'], y0)]
    k = np.array([_chamfer_k(p[1]) for p in C])
    G = np.zeros((len(C) + 1, len(prof), 3))
    for i in range(len(C) + 1):
        ci = i % len(C)
        for j, (off, yy) in enumerate(prof):
            a, b = C[ci] + Nn[ci] * off * k[ci]
            G[i, j] = [a, yy, b]
    P, UV = grid_tris(G, np.zeros(G.shape[:2] + (2,)))
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(C, c) if c[1] > D['wall_y0'] + 0.01 else np.zeros(3))   # one decision: consistent grid winding
    sh.add('BODY_PAINT', P, UV)
    Pt, UVt = cap(C, X3, Z3, Y3, origin=[0, y1, 0], facing=+1, center=[0, CANOPY_ZC - 0.2])
    sh.add('BODY_PAINT', Pt, UVt)
    nodes.append(('B02_canopy_drum', 'CANOPY', sh))

    # ---- underside: flat ring from the tray edge to the opening, lip, dark cavity
    lb = Mesh('B03_canopy_underside', smooth_angle=45)
    edge = np.array([C[i] + Nn[i] * (-D['edge_in'] * k[i]) for i in range(len(C))])
    hole = slot_outline()
    oc = np.array([0.0, (D['slot_z0'] + D['slot_z1']) / 2])
    rel = hole - oc
    angs = np.arctan2(rel[:, 1], rel[:, 0])
    rout = ray_polygon(oc, angs, edge)
    outer = oc + np.stack([np.cos(angs), np.sin(angs)], 1) * rout[:, None]
    hole_o = offset_contour(hole, 0.018)
    rings = [outer + (hole_o - outer) * t for t in np.linspace(0, 1, 7)]
    for ra, rb_ in zip(rings[:-1], rings[1:]):
        Pu, UVu = ring_cap(ra, rb_, X3, Z3, Y3, h=y0, facing=-1)
        lb.add('BODY_PAINT', Pu, UVu)
    lip = []
    for i in range(len(hole)):
        q = (i + 1) % len(hole)
        a = [hole_o[i][0], y0, hole_o[i][1]]; b = [hole_o[q][0], y0, hole_o[q][1]]
        c = [hole[q][0], y0 + 0.03, hole[q][1]]; d = [hole[i][0], y0 + 0.03, hole[i][1]]
        lip += [[a, b, c], [a, c, d]]
    Pl = np.array(lip)
    Pl, _ = orient_with_uv(Pl, np.zeros((len(Pl), 3, 2)), lambda c: np.array([oc[0] - c[0], -1.5, oc[1] - c[2]]), per_triangle=True)
    lb.add('BLACK_PLASTIC', Pl)
    depth = 0.20
    walls = []
    for i in range(len(hole)):
        q = (i + 1) % len(hole)
        a = [hole[i][0], y0 + 0.03, hole[i][1]]; b = [hole[q][0], y0 + 0.03, hole[q][1]]
        c = [hole[q][0], y0 + depth, hole[q][1]]; d = [hole[i][0], y0 + depth, hole[i][1]]
        walls += [[a, b, c], [a, c, d]]
    Pw = np.array(walls)
    Pw, _ = orient_with_uv(Pw, np.zeros((len(Pw), 3, 2)), lambda c: np.array([oc[0] - c[0], 0, oc[1] - c[2]]), per_triangle=True)
    lb.add('CAVITY_DARK', Pw)
    Pc, UVc = cap(hole, X3, Z3, Y3, origin=[0, y0 + depth, 0], facing=-1, center=oc)
    lb.add('CAVITY_DARK', Pc, UVc)
    nodes.append(('B03_canopy_underside', 'CANOPY', lb))

    # ---- graphics band on the vertical wall
    a, b, length = band_range()
    bm = Mesh('D27_champion_band', smooth_angle=60)
    P, UV = contour_strip(C, a, b, BAND_Y[0], BAND_Y[1], 0.0016, nu=280, nv=4)
    yy = P[..., 1]
    UV = UV.copy(); UV[..., 1] = (BAND_Y[1] - yy) / (BAND_Y[1] - BAND_Y[0])
    bm.add('GFX_BAND', P, UV)
    nodes.append(('D27_champion_band', 'GRAPHICS', bm))

    # ---- thin ledge plate between box and lid
    lg = Mesh('B02_canopy_ledge', smooth_angle=35)
    lo = D['ledge_out']
    P, UV, _ = sweep(C, [(-0.004, y1), (lo - 0.002, y1), (lo, y1 + 0.002), (lo, LID_UNDER - 0.0015), (lo - 0.003, LID_UNDER)], X3, Z3, Y3)
    P, UV = orient_with_uv(P, UV, lambda c: _outward_from_plan(C, c) + np.array([0, -0.3, 0]))
    lg.add('BODY_PAINT', P, UV)
    nodes.append(('B02_canopy_ledge', 'CANOPY', lg))

    # ---- lid: 'U' shell with a raised surround (CAD top view): rolled rim all round (narrow at the
    # back, ~4 cm along the sides, ~8 cm at the front), recessed flat top panel inside it; nose rolling
    # down into an underside that rises from the ledge to the rim
    tb = Mesh('B02_canopy_crown', smooth_angle=34)
    S = TOP_PLAN
    TOP = D['top_y']
    rec = TOP - D['top_recess']
    ocl = np.array([0.0, 0.42])
    nang = 320
    angs = np.linspace(0, 2 * math.pi, nang, endpoint=False)
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    rin = ray_polygon(ocl, angs, offset_contour(C, lo - 0.004))
    rout = ray_polygon(ocl, angs, S)
    rwall = ray_polygon(ocl, angs, offset_contour(PANEL_PLAN, D['panel_wall']))
    rpan = ray_polygon(ocl, angs, PANEL_PLAN)
    Gl = []
    for i in range(nang):
        dvec = dirs[i]
        span = max(rout[i] - rin[i], 0.012)
        base = _lid_f(span)
        pt = lambda dist: ocl + dvec * (rout[i] - dist)
        col = []
        for dd in np.linspace(span, 0.006, 12):
            q = pt(dd); col.append([q[0], LID_UNDER + _lid_f(dd) - base, q[1]])
        yt = LID_UNDER + _lid_f(0.006) - base
        for dd, f in ((0.0022, 0.30), (0.0, 0.58), (0.0016, 0.80), (0.005, 0.93), (0.010, 0.985)):
            q = pt(dd); col.append([q[0], yt + (TOP - 0.002 - yt) * f, q[1]])
        dw = rout[i] - rwall[i]; dp = rout[i] - rpan[i]
        for t in np.linspace(0, 1, 7)[1:]:                      # rolled (domed) rim top
            dd = 0.010 + (dw - 0.010) * t
            col.append([*pt(dd)[:1], TOP - 0.0025 + 0.0025 * math.sin(math.pi * min(t * 1.15, 1.0)), pt(dd)[1]])
        for t in np.linspace(0, 1, 6)[1:]:                      # rounded inner wall down to the panel
            dd = dw + (dp - dw) * t
            yy = TOP - 0.001 - (TOP - 0.001 - rec) * (0.5 - 0.5 * math.cos(math.pi * t))
            q = pt(dd); col.append([q[0], yy, q[1]])
        Gl.append(col)
    Gl = np.array(Gl); Gl = np.concatenate([Gl, Gl[:1]], 0)
    P, UV = grid_tris(Gl, np.zeros(Gl.shape[:2] + (2,)))
    # one global decision (consistent grid winding): the rim top must face up
    P, UV = orient_with_uv(P, UV, lambda c: np.array([0, 1.0, 0]) if c[1] > TOP - 0.0015 else np.zeros(3))
    tb.add('BODY_PAINT', P, UV)
    Si = np.array([ocl + dirs[i] * rpan[i] for i in range(nang)])
    Pt, UVt = cap(Si, X3, Z3, Y3, h=rec, facing=+1, center=ocl)
    tb.add('BODY_PAINT', Pt, UVt)
    nodes.append(('B02_canopy_crown', 'CANOPY', tb))
    # screw heads + round cap on the recessed top panel (CAD top view)
    ld = Mesh('D10_lid_fittings', smooth_angle=35)
    for (sxz, szz) in D['lid_screws']:
        Ps, UVs = lathe([(0, 0), (0.0075, 0), (0.0075, 0.0012), (0.006, 0.0028), (0, 0.0034)], 20, M=mat_translate(sxz, rec, szz))
        ld.add('METAL', Ps, UVs)
    cxp, czp, cr = D['lid_cap']
    Pc, UVc = lathe([(0, 0), (cr, 0), (cr, 0.002), (cr * 0.8, 0.007), (cr * 0.3, 0.009), (0, 0.009)], 40, M=mat_translate(cxp, rec, czp))
    ld.add('BLACK_PLASTIC', Pc, UVc)
    Pc, UVc = lathe([(0, 0.008), (0.009, 0.008), (0.009, 0.012), (0.006, 0.0145), (0, 0.015)], 24, M=mat_translate(cxp, rec, czp))
    ld.add('METAL', Pc, UVc)
    nodes.append(('D10_lid_fittings', 'DETAILS', ld))

    # ---- two round lamps in the underside
    lb_m = Mesh('D15_lamp_bezels', smooth_angle=30)
    for sx in (-1, 1):
        zz = D['light_z']
        Pm, UVm = lathe([(0.0, 0.0), (0.027, 0.0), (0.030, 0.003), (0.035, 0.0025), (0.036, 0.0)], 32, M=mat_translate(sx * D['light_x'], y0, zz) @ mat_rot('x', 180))
        lb_m.add('METAL', Pm, UVm)
        Pd, UVd = disc(0.026, 32, M=mat_translate(sx * D['light_x'], y0 - 0.0025, zz) @ mat_rot('x', 90))
        leds['D15_lamps'].mesh.add('LED_WHITE', Pd, UVd, np.ones((len(Pd), 3, 3)), np.full((len(Pd), 3), float(leds['D15_lamps'].count)))
        leds['D15_lamps'].count += 1
    nodes.append(('D15_lamp_bezels', 'CANOPY', lb_m))
    # ---- START button: front centre of the chamfered tray (CAD)
    st = Mesh('D12_start_button', smooth_angle=35)
    nv = np.array([0.0, -(D['wall_y0'] - D['cham_y']), D['cham_in']]); nv /= np.linalg.norm(nv)
    pos = np.array([0.0, (D['wall_y0'] + D['cham_y']) / 2, D['lb_z1'] - D['cham_in'] / 2])
    B = look_basis(pos, nv) @ mat_rot('x', 90)
    Pl, UVl = lathe([(0.0, 0.0), (0.0125, 0.0), (0.0125, 0.0028), (0.0115, 0.004), (0.0, 0.004)], 32, M=B)
    st.add('METAL', Pl, UVl)
    Pk, UVk = disc(0.0112, 32, M=look_basis(pos + nv * 0.0042, nv))
    st.add('DECALS', Pk, atlas_uv('lock', UVk))
    Pb, UVb = lathe([(0.0, 0.0045), (0.005, 0.0045), (0.0047, 0.0068), (0.0, 0.0074)], 24, M=B)
    st.add('METAL', Pb, UVb)
    nodes.append(('D12_start_button', 'DETAILS', st))
    rg = Mesh('D12_start_ring', smooth_angle=30)
    ring_in, ring_out = 0.0052, 0.0062
    tris = []
    for kk in range(32):
        t0 = 2 * math.pi * kk / 32; t1 = 2 * math.pi * (kk + 1) / 32
        a_ = [ring_in * math.cos(t0), ring_in * math.sin(t0), 0]; b_ = [ring_out * math.cos(t0), ring_out * math.sin(t0), 0]
        c_ = [ring_out * math.cos(t1), ring_out * math.sin(t1), 0]; d_ = [ring_in * math.cos(t1), ring_in * math.sin(t1), 0]
        tris += [[a_, b_, c_], [a_, c_, d_]]
    Pr = np.array(tris); Pr, _ = orient_with_uv(Pr, np.zeros((len(Pr), 3, 2)), [0, 0, 1])
    Pr = apply(look_basis(pos + nv * 0.0046, nv), Pr.reshape(-1, 3)).reshape(-1, 3, 3)
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
_CAD = 'CAD renders 21.10.2026'
META = {
    'B01_body': ('CAD front/side view', 'high', _CAD, 'B01'),
    'D24_front_graphic': ('F01,F10,F26', 'high', 'projective bake of 3 photos', 'D24/B05'),
    'D18_score_shield': ('CAD front view', 'high', _CAD, 'D18'),
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
    'B03_canopy_underside': ('CAD 3-4 from below', 'medium', _CAD, 'B03/D11/D15'),
    'B02_canopy_drum': ('CAD side/top/3-4', 'high', _CAD, 'B02'),
    'D27_champion_band': ('F26,F01,F02,F10', 'high', 'projective bake on curved surface', 'D27'),
    'B02_canopy_crown': ('CAD top/side/3-4', 'high', _CAD, 'B02/D10'),
    'B02_canopy_ledge': ('CAD 3-4', 'medium', _CAD, 'B02'),
    'D10_lid_fittings': ('CAD top view', 'medium', _CAD, 'D10'),
    'D21_base_feet': ('CAD side/front view', 'medium', _CAD, 'D21'),
    'D15_lamp_bezels': ('F35,F16', 'high', 'positions photogrammetry', 'D15'),
    'D15_lamps': ('F35,P01', 'high', 'emission', 'D15'),
    'D12_start_button': ('F26,F35', 'high', 'diameter estimated', 'D12'),
    'D12_start_ring': ('F35,P01', 'medium', 'emission', 'D12'),
    'D14_neck_mount': ('F35', 'low', 'estimated', 'D14'),
    'D14_neck': ('F34,F35', 'medium', 'estimated length', 'D14'),
    'D13_bag': ('F34,F35,P01', 'medium', 'estimated size; back not visible', 'D13'),
    'B04_base_frame': ('CAD side/top view', 'high', _CAD, 'B04'),
    'D20_base_tread_plate': ('F33,F03,F10', 'high', _PG, 'D20'),
}

_BAND_LEN = band_range()[2]
ZONES = {
    'front': dict(label='FRONT PANEL', material='GFX_FRONT', meshes=['D24_front_graphic'],
                  size=[round(FRONT_GFX['x1'] - FRONT_GFX['x0'], 3), round(FRONT_GFX['y1'] - FRONT_GFX['y0'], 3)]),
    'band': dict(label='CANOPY BAND', material='GFX_BAND', meshes=['D27_champion_band'],
                 size=[round(float(_BAND_LEN), 3), round(BAND_Y[1] - BAND_Y[0], 3)]),
    'left': dict(label='LEFT SIDE', material='GFX_LEFT', meshes=['D26_left_graphic'],
                 size=[round(D['col_z1'] - D['side_red'] - D['col_z0'] - D['back_trim'], 3), round(D['col_box_y1'] - D['col_y0'] - 0.006, 3)]),
    'right': dict(label='RIGHT SIDE', material='GFX_RIGHT', meshes=['D25_right_graphic'],
                  size=[round(D['col_z1'] - D['side_red'] - D['col_z0'] - D['back_trim'], 3), round(D['col_box_y1'] - D['col_y0'] - 0.006, 3)]),
}
