"""
monster_model.py - PRO GAMES "Boxer Monster 3 in 1" (boxer + kicker + hammer), v2.

Source: the manufacturer's drawing "Boxer Monster 3 in 1" (SOLIDWORKS, A1, 1:10, 28.09.2026:
left side, front, right side, back, top, two isometric views; dimensions ~2253 / 1249 / 1375 /
850 / 1316 / 40 / 66) and the CAD renders of 23.10.2026.  Every value below was measured on the
drawing (1:10 -> 1.181 px/mm at 300 dpi), in millimetres in the drawing frame:

    X  from the left edge of the base plate (0) to the right edge (1375)      (front view)
    Y  up from the floor                                                         (front/side views)
    Z  forward from the back face of the machine (0) towards the player        (side/top views)

and converted to the glTF frame at the end (metres, +X right, +Y up, +Z front, centred on the base).

Shape only (v2): plain red body, white lamps, black screen and pads, no stickers yet.  The
sticker zones exist as invisible decals so that customer artwork can be placed.

State: punch bag folded up into the canopy (as in the CAD), kicker arm at rest, hammer resting on
the box next to the strike pad, doors closed.
"""
import math
import numpy as np
from meshlib import (Mesh, lathe, disc, rounded_box_tris, mat_translate, mat_scale, mat_basis, look_basis,
                     mat_rot, apply, orient_with_uv, grid_tris, resample_closed, ray_polygon, ring_cap)
from double_strike_model import LedGroup

# ------------------------------------------------------------------------------------------ dimensions (mm)
D = dict(
    W=1375.0, H=2253.0,
    # base plate (Y 10..40 on feet), rear part + kicker stand (wide step + long arm on the left)
    plate_y=(10.0, 40.0), plate_rear_z=(-8.0, 520.0), stand_wide=(0.0, 687.0, 520.0, 687.0),
    stand_arm=(0.0, 300.0, 687.0, 1187.0), bevel=26.0,
    # boxer column (front face z 435) + kicker box (front z 514, top 577, chamfer to the column at 646)
    col_x0=4.0, col_xr_top=683.0, col_xr_low=844.0, col_slant_y=(1774.0, 646.0), col_z=(151.0, 435.0), col_top=2088.0,   # column back 151 mm in front of the tower back
    kick_z=514.0, kick_top=577.0, kick_y0=40.0,
    kick_open=(41.0, 77.0, 649.0, 480.0), kick_depth=130.0,
    screen=(37.0, 999.0, 662.0, 1755.0), coin=(595.0, 811.0, 662.0, 969.0), lock=(724.0, 999.0),
    # canopy box (walls Y 1875..2088, lamp strip chamfer to the underside at 1827; back flush with the
    # column at z 151), ledge plate and lid (back edge at z 45, overhanging the tower)
    can_y=(1827.0, 1875.0, 2088.0), plate_t=38.0, lid_top=2202.0, lid_top_front=2243.0, lid_floor=2150.0,
    # hammer tower (back slab, front face z 151, slanted right edge), middle box, anvil box
    tower_z=(0.0, 76.0), tower_y=(404.0, 2064.0), tower_cap=(2064.0, 2083.0), tower_xr=(1230.0, 1363.0),
    tower_win=(892.0, 514.0, 1072.0, 1985.0), tower_strip_x=1109.0,
    mid_box=(844.0, 1113.0, 40.0, 407.0, 0.0, 484.0), anvil_box=(1113.0, 1370.0, 40.0, 432.0, 0.0, 485.0),
    pad=(1226.0, 337.0, 151.0), bellows=(432.0, 514.0, 88.0), pad_y=(514.0, 571.0),
    hammer_head=(946.0, 480.0, 274.0, 73.0, 230.0), hammer_top=(801.0, 1087.0),
    # kicker ball + arm
    ball=(174.0, 277.0, 535.0, 107.0), arm=(270.0, 552.0, 287.0, 470.0, 48.0),
    # punch bag folded up
    bag=(344.0, 1868.0, 640.0, 100.0),
)
Y3 = np.array([0, 1.0, 0]); X3 = np.array([1.0, 0, 0]); Z3 = np.array([0, 0, 1.0])
CENTRE = (D['W'] / 2, 0.0, 620.0)


def col_xr(y):
    """Right edge of the boxer column at height y (front view: 683 at the top, slanting out to 844)."""
    y1, y0 = D['col_slant_y']
    if y >= y1: return D['col_xr_top']
    if y <= y0: return D['col_xr_low']
    t = (y - y0) / (y1 - y0)
    return D['col_xr_low'] + (D['col_xr_top'] - D['col_xr_low']) * t


def tower_xr(y):
    """Right edge of the hammer tower (slanted, 1230 at the top -> 1363 at its foot 404)."""
    ytop = D['tower_cap'][1]; ybot = D['tower_y'][0]
    t = (ytop - y) / (ytop - ybot)
    return D['tower_xr'][0] + (D['tower_xr'][1] - D['tower_xr'][0]) * t


# ------------------------------------------------------------------------------------------ helpers
def face(mesh, mat, pts, normal, uv_scale=0.001):
    """Convex planar polygon (fan) facing `normal`; planar UVs in metres."""
    pts = np.asarray(pts, float); n = np.asarray(normal, float); n = n / np.linalg.norm(n)
    a = np.cross(Y3, n) if abs(n[1]) < 0.9 else X3.copy()
    a /= np.linalg.norm(a); b = np.cross(n, a)
    P = np.array([[pts[0], pts[i], pts[i + 1]] for i in range(1, len(pts) - 1)])
    UV = np.stack([P @ a, -(P @ b)], -1) * uv_scale
    P, UV = orient_with_uv(P, UV, n)
    mesh.add(mat, P, UV)


def poly_normal(pts, ref_out):
    pts = np.asarray(pts, float)
    n = np.cross(pts[1] - pts[0], pts[2] - pts[0])
    for i in range(2, len(pts) - 1):
        if np.linalg.norm(n) > 1e-9: break
        n = np.cross(pts[i] - pts[0], pts[i + 1] - pts[0])
    n /= np.linalg.norm(n)
    return n if np.dot(n, ref_out) >= 0 else -n


def qface(mesh, mat, pts, ref_out):
    face(mesh, mat, pts, poly_normal(pts, ref_out))


def box(mesh, mat, lo, hi, r=1.5, seg=1):
    mesh.add(mat, rounded_box_tris(lo, hi, r, seg=seg, step=1e4))


def solid_box(mesh, mat, x0, x1, y0, y1, z0, z1, skip=()):
    c = np.array([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2])
    F = {'-x': [(x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0)], '+x': [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)],
         '-y': [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], '+y': [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)],
         '-z': [(x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0)], '+z': [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]}
    for k, pts in F.items():
        if k in skip: continue
        qface(mesh, mat, pts, np.asarray(pts, float).mean(0) - c)


def axis_basis(p0, d):
    """Matrix mapping lathe space (axis +Y) onto the axis p0 + t*d."""
    d = np.asarray(d, float); d = d / np.linalg.norm(d)
    u = np.cross(d, [0, 0, 1.0]) if abs(d[2]) < 0.9 else np.cross(d, [1.0, 0, 0])
    u /= np.linalg.norm(u); w = np.cross(u, d)
    return mat_basis(np.asarray(p0, float), u, d, w)


def cyl(mesh, mat, p0, p1, r, seg=32, round_r=0.0):
    p0 = np.asarray(p0, float); p1 = np.asarray(p1, float); L = np.linalg.norm(p1 - p0)
    rr = min(round_r, r * 0.9, L / 2)
    prof = [(0.0, 0.0), (r - rr, 0.0)]
    if rr > 0:
        prof += [(r - rr + rr * math.sin(t), rr - rr * math.cos(t)) for t in np.linspace(0, math.pi / 2, 5)[1:]]
        prof += [(r - rr + rr * math.cos(t), L - rr + rr * math.sin(t)) for t in np.linspace(0, math.pi / 2, 5)[:-1]]
    else:
        prof += [(r, 0.0), (r, L)]
    prof += [(r - rr, L), (0.0, L)]
    P, UV = lathe(prof, seg, M=axis_basis(p0, p1 - p0))
    mesh.add(mat, P, UV)


def sphere_gores(mesh, mats, c, R, n=8, axis=(0, 1, 0)):
    """Ball of n vertical gores alternating materials (kicker ball)."""
    for g in range(n):
        a0 = 2 * math.pi * g / n; a1 = a0 + 2 * math.pi / n
        prof = [(R * math.sin(ph), R * math.cos(ph)) for ph in np.linspace(math.pi, 0, 24)]
        P, UV = lathe(prof, 6, M=axis_basis(np.asarray(c, float), axis), a0=a0, a1=a1)
        mesh.add(mats[g % len(mats)], P, UV)


def offset_poly(pts, d):
    """Offset a CCW (x, z) polygon outward by d (miter)."""
    P = np.asarray(pts, float); n = len(P); out = []
    for i in range(n):
        a, b, c = P[i - 1], P[i], P[(i + 1) % n]
        e1 = b - a; e2 = c - b
        n1 = np.array([e1[1], -e1[0]]) / np.linalg.norm(e1); n2 = np.array([e2[1], -e2[0]]) / np.linalg.norm(e2)
        m = n1 + n2; m /= np.linalg.norm(m)
        out.append(b + m * d / max(np.dot(m, n1), 0.3))
    return np.array(out)


def ccw(P):
    P = np.asarray(P, float)
    area = 0.5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])
    return P if area > 0 else P[::-1].copy()


def ring(mesh, mat, A, B, ref_c):
    """Band between two 3D polylines with equal point counts (closed), facing away from ref_c."""
    n = len(A)
    for i in range(n):
        j = (i + 1) % n
        q = [A[i], A[j], B[j], B[i]]
        cen = np.mean(q, 0)
        out = cen - np.asarray(ref_c, float); out[1] = 0 if abs(out[1]) < 1e-9 else out[1]
        qface(mesh, mat, q, out)


def polyline_points(poly3, step, margin=0.0, closed=True):
    """Evenly spaced points along a 3D polyline (for lamp rows)."""
    P = np.asarray(poly3, float)
    if closed: P = np.vstack([P, P[:1]])
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1); s = np.concatenate([[0], np.cumsum(seg)])
    L = s[-1] - 2 * margin; n = max(int(round(L / step)), 1)
    out = []
    for k in range(n + (0 if closed else 1)):
        t = margin + (L * k / n if not closed else s[-1] * k / n)
        i = min(np.searchsorted(s, t, side='right') - 1, len(seg) - 1)
        f = (t - s[i]) / max(seg[i], 1e-9)
        out.append((P[i] * (1 - f) + P[i + 1] * f, i))
    return out


class Lamps:
    """White lamp bulbs (chrome bezel + LED_WHITE dome), as in the CAD."""
    def __init__(self):
        self.leds = LedGroup('E01_lamps')
        self.bezel = Mesh('E01_lamp_bezels', smooth_angle=40)

    def add(self, pos, normal, r=17.0):
        n = np.asarray(normal, float); n /= np.linalg.norm(n); p = np.asarray(pos, float)
        B = look_basis(p, n) @ mat_rot('x', 90)
        P, UV = lathe([(0.0, 0.0), (r + 5, 0.0), (r + 5, 2.5), (r + 2, 4.0), (0.0, 4.0)], 20, M=B)
        self.bezel.add('METAL', P, UV)
        self.leds.bulb(p + n * 3.0, n, color=(1, 1, 1), r=r, h=r * 0.75, mat='LED_WHITE')


# ------------------------------------------------------------------------------------------ base
def build_base():
    nodes = []
    y0, y1 = D['plate_y']; bev = D['bevel']
    fr = Mesh('B04_base_frame', smooth_angle=30)
    tp = Mesh('D20_stand_tread_plate', smooth_angle=20)
    # rear plate (under the machine), front edge bevelled
    z0, z1 = D['plate_rear_z']
    solid_box(fr, 'BLACK_STEEL', 0, D['W'], y0, y1, z0, z1, skip=('+z', '-y'))
    qface(fr, 'BLACK_STEEL', [(0, y0, z1), (D['W'], y0, z1), (D['W'], y1 - 6, z1 + 6), (0, y1 - 6, z1 + 6)], [0, 0.3, 1])

    def stand(x0, x1, za, zb, front_bevel, left_open=False, back_open=True):
        # tread plate top + bevelled front, black edges
        zt = zb - front_bevel
        K = 1 / 59.0
        def tread(pts, n):
            pts = np.asarray(pts, float)
            P = np.array([[pts[0], pts[i], pts[i + 1]] for i in range(1, len(pts) - 1)])
            UV = np.stack([P[..., 0] * K, P[..., 2] * K], -1)
            P, UV = orient_with_uv(P, UV, n); tp.add('DIAMOND_PLATE', P, UV)
        tread([(x0, y1, za), (x1, y1, za), (x1, y1, zt), (x0, y1, zt)], [0, 1, 0])
        tread([(x0, y1, zt), (x1, y1, zt), (x1, y0 + 2, zb), (x0, y0 + 2, zb)], [0, 1, front_bevel / 30.0])
        qface(fr, 'BLACK_STEEL', [(x0, y0, za), (x0, y1, za), (x0, y1, zt), (x0, y0 + 2, zb), (x0, y0, zb)], [-1, 0, 0])
        qface(fr, 'BLACK_STEEL', [(x1, y0, za), (x1, y1, za), (x1, y1, zt), (x1, y0 + 2, zb), (x1, y0, zb)], [1, 0, 0])
    stand(*D['stand_wide'][:2], D['stand_wide'][2], D['stand_wide'][3], bev)
    stand(*D['stand_arm'][:2], D['stand_arm'][2] - 1, D['stand_arm'][3], 32.0)
    nodes += [('B04_base_frame', 'BASE', fr), ('D20_stand_tread_plate', 'BASE', tp)]
    ft = Mesh('D21_base_feet', smooth_angle=40)
    for (fx, fz) in ((90, 60), (700, 60), (1290, 60), (90, 480), (700, 480), (1290, 470), (150, 1100)):
        P, UV = lathe([(0, 0), (36, 0), (40, 2), (40, y0), (0, y0)], 24, M=mat_translate(fx, 0, fz))
        ft.add('RUBBER', P, UV)
    nodes.append(('D21_base_feet', 'BASE', ft))
    return nodes


# ------------------------------------------------------------------------------------------ boxer column + kicker
def build_column(L):
    nodes = []
    m = Mesh('B01_body', smooth_angle=30)
    x0 = D['col_x0']; z0, zf = D['col_z']; zk = D['kick_z']; yk = D['kick_top']; y0 = D['kick_y0']
    ytop = D['col_top']; ys1, ys0 = D['col_slant_y']; xrl = D['col_xr_low']; xrt = D['col_xr_top']
    ych = ys0                                         # chamfer top = start of the slant (646)
    # side profile (z, y), CCW seen from -X
    prof = [(z0, y0), (zk, y0), (zk, yk), (zf, ych), (zf, ytop), (z0, ytop)]
    # left side
    qface(m, 'BODY_PAINT', [(x0, y, z) for z, y in prof], [-1, 0, 0])
    # right side: lower part x = 844 (kicker profile), slanted middle, upper part x = 683
    qface(m, 'BODY_PAINT', [(xrl, y0, z0), (xrl, y0, zk), (xrl, yk, zk), (xrl, ych, zf), (xrl, ych, z0)], [1, 0, 0])
    qface(m, 'BODY_PAINT', [(xrl, ych, z0), (xrl, ych, zf), (xrt, ys1, zf), (xrt, ys1, z0)], [1, 0.14, 0])
    qface(m, 'BODY_PAINT', [(xrt, ys1, z0), (xrt, ys1, zf), (xrt, ytop, zf), (xrt, ytop, z0)], [1, 0, 0])
    # back (doors are added in build_rear)
    qface(m, 'BODY_PAINT', [(x0, y0, z0), (xrl, y0, z0), (xrl, ych, z0), (xrt, ys1, z0), (xrt, ytop, z0), (x0, ytop, z0)], [0, 0, -1])
    # column front (z 435) from the chamfer up to the canopy underside, with the screen
    yc = D['can_y'][0]
    sx0, sy0, sx1, sy1 = D['screen']
    qface(m, 'BODY_PAINT', [(x0, ych, zf), (xrl, ych, zf), (xrt, ys1, zf), (xrt, yc, zf), (x0, yc, zf)], [0, 0, 1])
    # kicker chamfer + front with the opening
    qface(m, 'BODY_PAINT', [(x0, yk, zk), (xrl, yk, zk), (xrl, ych, zf), (x0, ych, zf)], [0, 1, 1.1])
    ox0, oy0, ox1, oy1 = D['kick_open']
    for pts in ([(x0, y0, zk), (xrl, y0, zk), (xrl, oy0, zk), (x0, oy0, zk)], [(x0, oy1, zk), (xrl, oy1, zk), (xrl, yk, zk), (x0, yk, zk)],
                [(x0, oy0, zk), (ox0, oy0, zk), (ox0, oy1, zk), (x0, oy1, zk)], [(ox1, oy0, zk), (xrl, oy0, zk), (xrl, oy1, zk), (ox1, oy1, zk)]):
        qface(m, 'BODY_PAINT', pts, [0, 0, 1])
    nodes.append(('B01_body', 'BODY', m))

    # kicker recess: red walls, dark back, green turf floor
    kr = Mesh('K01_kicker_recess', smooth_angle=30)
    zb = zk - D['kick_depth']; ins = 22.0
    bx0, by0, bx1, by1 = ox0 + ins, oy0, ox1 - ins, oy1 - ins
    qface(kr, 'BODY_PAINT', [(ox0, oy1, zk), (ox1, oy1, zk), (bx1, by1, zb), (bx0, by1, zb)], [0, -1, 0])
    qface(kr, 'BODY_PAINT', [(ox0, oy0, zk), (ox0, oy1, zk), (bx0, by1, zb), (bx0, by0, zb)], [1, 0, 0])
    qface(kr, 'BODY_PAINT', [(ox1, oy0, zk), (bx1, by0, zb), (bx1, by1, zb), (ox1, oy1, zk)], [-1, 0, 0])
    qface(kr, 'TURF_GREEN', [(ox0, oy0 + 1, zk), (ox1, oy0 + 1, zk), (bx1, by0 + 1, zb), (bx0, by0 + 1, zb)], [0, 1, 0])
    qface(kr, 'CAVITY_DARK', [(bx0, by0, zb), (bx1, by0, zb), (bx1, by1, zb), (bx0, by1, zb)], [0, 0, 1])
    # speaker grille (perforated, top left of the opening)
    for i in range(6):
        for j in range(2):
            P, UV = disc(8.5, 14, M=mat_translate(ox0 + 70 + i * 21 + j * 10, oy1 - 30 - j * 18, zb + 1))
            kr.add('BLACK_PLASTIC', P, UV)
    nodes.append(('K01_kicker_recess', 'KICKER', kr))

    # kicker ball + arm (at rest, horizontal inside the opening)
    ka = Mesh('K02_kicker_arm', smooth_angle=45)
    ax0, ax1, ay, az, ar = D['arm']
    cyl(ka, 'BLACK_PLASTIC', (ax0, ay, az), (ax1, ay, az), ar, seg=28, round_r=4)
    cyl(ka, 'BLACK_PLASTIC', (ax0 - 40, ay, az), (ax0 + 5, ay, az), ar * 0.72, seg=24)
    box(ka, 'METAL', (ax1, ay - 40, az - 45), (ax1 + 150, ay + 40, zk - 2), r=4, seg=2)
    box(ka, 'BLACK_PLASTIC', (ax1 + 20, ay - 55, az - 30), (ax1 + 130, ay + 55, az + 30), r=4, seg=2)
    nodes.append(('K02_kicker_arm', 'KICKER', ka))
    kb = Mesh('K03_kicker_ball', smooth_angle=60)
    bxc, byc, bzc, br = D['ball']
    sphere_gores(kb, ['BALL_BLACK', 'BALL_WHITE'], (bxc, byc, bzc), br, n=8, axis=(1, 0, 0.0))
    nodes.append(('K03_kicker_ball', 'KICKER', kb))

    # screen (black glass in a thin black frame), coin acceptor, lock
    fp = Mesh('F01_screen', smooth_angle=20)
    box(fp, 'BLACK_PLASTIC', (sx0, sy0, zf - 2), (sx1, sy1, zf + 6), r=2, seg=1)
    qface(fp, 'MONITOR', [(sx0 + 12, sy0 + 12, zf + 6.5), (sx1 - 12, sy0 + 12, zf + 6.5), (sx1 - 12, sy1 - 12, zf + 6.5), (sx0 + 12, sy1 - 12, zf + 6.5)], [0, 0, 1])
    nodes.append(('F01_screen', 'FRONT_PANEL', fp))
    cp = Mesh('F02_coin_acceptor', smooth_angle=30)
    cx0, cy0, cx1, cy1 = D['coin']
    box(cp, 'BLACK_PLASTIC', (cx0, cy0, zf - 2), (cx1, cy1, zf + 10), r=2, seg=1)
    cxm = (cx0 + cx1) / 2
    box(cp, 'BUTTON_RED', (cxm - 14, (cy0 + cy1) / 2 - 9, zf + 9), (cxm + 14, (cy0 + cy1) / 2 + 9, zf + 15), r=2, seg=2)
    for yy in (cy1 - 45, cy0 + 20):
        box(cp, 'CAVITY_DARK', (cxm - 2.5, yy, zf + 10), (cxm + 2.5, yy + 28, zf + 10.6), r=0.5, seg=1)
    for sx in (cx0 + 7, cx1 - 7):
        for sy in (cy0 + 7, cy1 - 7):
            P, UV = disc(3, 10, M=mat_translate(sx, sy, zf + 10.3)); cp.add('METAL', P, UV)
    lx, ly = D['lock']
    P, UV = lathe([(0, 0), (11, 0), (11, 3), (9, 6), (0, 6)], 24, M=look_basis(np.array([lx, ly, zf]), [0, 0, 1]) @ mat_rot('x', 90))
    cp.add('METAL', P, UV)
    nodes.append(('F02_coin_acceptor', 'FRONT_PANEL', cp))

    # lamps around the kicker front (top row + both sides)
    zl = zk
    for x in np.linspace(26, 822, 8):
        L.add((x, 539, zl), (0, 0, 1))
    for y in (426, 312, 199, 86):
        L.add((26, y, zl), (0, 0, 1)); L.add((822, y, zl), (0, 0, 1))
    return nodes


# ------------------------------------------------------------------------------------------ canopy
# plans (x, z): canopy box top, box bottom (front facets 40 mm further back), lid outline
BOX_TOP = ccw([(4, 151), (683, 151), (683, 440), (630, 1035), (480, 1231), (209, 1231), (57, 1035), (4, 440)])
BOX_BOT = ccw([(4, 151), (683, 151), (683, 440), (632, 995), (480, 1191), (209, 1191), (55, 995), (4, 440)])
LID = ccw([(-81, 45), (770, 45), (770, 440), (715, 1122), (529, 1359), (160, 1359), (-24, 1122), (-81, 440)])


def lid_top_y(z):
    if z <= 1122: return D['lid_top']
    return D['lid_top'] + (min(z, 1359) - 1122) / (1359 - 1122) * (D['lid_top_front'] - D['lid_top'])


def build_canopy(L):
    nodes = []
    ya, yb, yc = D['can_y']                 # underside, wall bottom, wall top
    cb = Mesh('B02_canopy_box', smooth_angle=25)
    top3 = [np.array([x, yc, z]) for x, z in BOX_TOP]
    bot3 = [np.array([x, yb, z]) for x, z in BOX_BOT]
    cen = np.array([343.5, 1960, 600])
    # walls (skip the back edge: index of the (4,0)->(683,0) segment)
    def edges(Pl):
        out = []
        n = len(Pl)
        for i in range(n):
            a, b = Pl[i], Pl[(i + 1) % n]
            out.append((i, (i + 1) % n, a, b))
        return out
    back = lambda a, b: abs(a[1] - 151) < 1e-6 and abs(b[1] - 151) < 1e-6
    for i, j, a, b in edges(BOX_TOP):
        if back(a, b): continue
        q = [bot3[i], bot3[j], top3[j], top3[i]]
        qface(cb, 'BODY_PAINT', q, np.r_[np.mean(q, 0)[0] - cen[0], 0, np.mean(q, 0)[2] - cen[2]])
    # lamp strip: chamfer from the wall bottom (1875) to the underside (1827), 30 mm inset
    UND = offset_poly(BOX_BOT, -30.0); UND[np.abs(np.asarray(BOX_BOT)[:, 1] - 151) < 1e-6, 1] = 151.0
    und3 = [np.array([x, ya, z]) for x, z in UND]
    strip_quads = []
    for i, j, a, b in edges(BOX_BOT):
        if back(a, b): continue
        q = [und3[i], und3[j], bot3[j], bot3[i]]
        cq = np.mean(q, 0)
        qface(cb, 'BODY_PAINT', q, np.r_[cq[0] - cen[0], -60.0, cq[2] - cen[2]])
        strip_quads.append(q)
    # underside: flat, with the bag opening, from the column front (z 435) forward
    zf = D['col_z'][1]
    pts = np.array([[4 + 30, zf], [683 - 30, zf]] + [tuple(p) for p in UND if p[1] > 441])
    oc = np.array([343.5, 760.0])
    pts = pts[np.argsort(np.arctan2(pts[:, 1] - oc[1], pts[:, 0] - oc[0]))]
    hole = (250.0, 438.0, 560.0, 900.0)       # bag opening (x0, x1, z0, z1)
    hx0, hx1, hz0, hz1 = hole
    rect = np.array([[hx0, hz0], [hx1, hz0], [hx1, hz1], [hx0, hz1]])
    angs = np.linspace(0, 2 * math.pi, 160, endpoint=False)
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    ro = ray_polygon(oc, angs, pts); ri = ray_polygon(oc, angs, rect)
    outer = oc + dirs * ro[:, None]; inner = oc + dirs * ri[:, None]
    Pu, UVu = ring_cap(outer, inner, X3, Z3, Y3, h=ya, facing=-1)
    cb.add('BODY_PAINT', Pu, UVu * 0.001)
    # the canopy box is flush with the column back (z 151); only plate + lid overhang to z 45
    qface(cb, 'BODY_PAINT', [(4, yb, 151), (4, yc, 151), (683, yc, 151), (683, yb, 151)], [0, 0, -1])
    nodes.append(('B02_canopy_box', 'CANOPY', cb))
    # bag cavity
    cv = Mesh('B03_canopy_cavity', smooth_angle=30)
    hy = ya + 210
    for q, n in (([(hx0, ya, hz0), (hx0, hy, hz0), (hx0, hy, hz1), (hx0, ya, hz1)], [1, 0, 0]),
                 ([(hx1, ya, hz0), (hx1, ya, hz1), (hx1, hy, hz1), (hx1, hy, hz0)], [-1, 0, 0]),
                 ([(hx0, ya, hz0), (hx1, ya, hz0), (hx1, hy, hz0), (hx0, hy, hz0)], [0, 0, 1]),
                 ([(hx0, ya, hz1), (hx0, hy, hz1), (hx1, hy, hz1), (hx1, ya, hz1)], [0, 0, -1]),
                 ([(hx0, hy, hz0), (hx1, hy, hz0), (hx1, hy, hz1), (hx0, hy, hz1)], [0, -1, 0])):
        qface(cv, 'CAVITY_DARK', q, n)
    nodes.append(('B03_canopy_cavity', 'CANOPY', cv))

    # ledge plate (38 mm) between box and lid
    lp = Mesh('B02_canopy_plate', smooth_angle=25)
    PL = offset_poly(BOX_TOP, 22.0); PL[np.abs(np.asarray(BOX_TOP)[:, 1] - 151) < 1e-6, 1] = 45.0
    PL[:, 1] = np.maximum(PL[:, 1], 45.0)
    yp0, yp1 = yc, yc + D['plate_t']
    p0 = [np.array([x, yp0, z]) for x, z in PL]; p1 = [np.array([x, yp1, z]) for x, z in PL]
    n = len(PL)
    for i in range(n):
        j = (i + 1) % n
        q = [p0[i], p0[j], p1[j], p1[i]]; cq = np.mean(q, 0)
        qface(lp, 'BODY_PAINT', q, np.r_[cq[0] - cen[0], 0, cq[2] - cen[2]])
    ctr = np.array([343.5, yp0, 700.0])
    for i in range(n):
        j = (i + 1) % n
        qface(lp, 'BODY_PAINT', [p0[i], p0[j], ctr], [0, -1, 0])
    nodes.append(('B02_canopy_plate', 'CANOPY', lp))

    # lid: sloped rim (lamps) from the plate up and out to the lid outline, thin lip, tray floor
    ld = Mesh('B02_canopy_lid', smooth_angle=25)
    outer = [np.array([x, lid_top_y(z), z]) for x, z in LID]
    PLr = PL.copy()
    base3 = [np.array([x, yp1, z]) for x, z in PLr]
    for i in range(n):
        j = (i + 1) % n
        q = [base3[i], base3[j], outer[j], outer[i]]; cq = np.mean(q, 0)
        qface(ld, 'BODY_PAINT', q, np.r_[cq[0] - cen[0], 0.0, cq[2] - cen[2]] + np.array([0, 40.0, 0]))
    INN = offset_poly(LID, -10.0)
    inner = [np.array([x, lid_top_y(z), z]) for x, z in INN]
    floor = [np.array([x, D['lid_floor'], z]) for x, z in offset_poly(LID, -14.0)]
    for i in range(n):
        j = (i + 1) % n
        qface(ld, 'BODY_PAINT', [outer[i], outer[j], inner[j], inner[i]], [0, 1, 0])
        q = [inner[i], inner[j], floor[j], floor[i]]; cq = np.mean(q, 0)
        qface(ld, 'BODY_PAINT', q, -np.r_[cq[0] - cen[0], 0.0, cq[2] - cen[2]])
    face(ld, 'BODY_PAINT', floor, [0, 1, 0])
    # round cap on the lid floor (top view, back left)
    P, UV = lathe([(0, 0), (58, 0), (58, 4), (48, 12), (14, 16), (0, 16)], 36, M=mat_translate(76, D['lid_floor'], 224))
    ld.add('BODY_PAINT', P, UV)
    P, UV = lathe([(0, 15), (12, 15), (12, 24), (0, 26)], 20, M=mat_translate(76, D['lid_floor'], 224))
    ld.add('METAL', P, UV)
    nodes.append(('B02_canopy_lid', 'CANOPY', ld))

    # lamps on the lid rim (mid-line of the sloped face), skipping the back edge
    for i in range(n):
        j = (i + 1) % n
        a0, b0 = base3[i], base3[j]; a1, b1 = outer[i], outer[j]
        if abs(LID[i][1] - 45) < 1 and abs(LID[j][1] - 45) < 1: continue
        ma = (a0 + a1) / 2; mb = (b0 + b1) / 2
        Lg = np.linalg.norm(mb - ma); k = max(int(round(Lg / 123.0)), 1)
        nrm = poly_normal([a0, b0, b1, a1], np.r_[(ma + mb)[0] / 2 - cen[0], 0, (ma + mb)[2] / 2 - cen[2]] + np.array([0, 40.0, 0]))
        for t in (np.arange(k) + 0.5) / k:
            L.add(ma + (mb - ma) * t, nrm, r=15.0)
    # lamps on the lower strip; START button at the front centre
    for q in strip_quads:
        a = (q[0] + q[3]) / 2; b = (q[1] + q[2]) / 2
        Lg = np.linalg.norm(b - a); k = max(int(round(Lg / 100.0)), 1)
        nrm = poly_normal(q, np.r_[(a + b)[0] / 2 - cen[0], -60.0, (a + b)[2] / 2 - cen[2]])
        for t in (np.arange(k) + 0.5) / k:
            p = a + (b - a) * t
            if abs(p[0] - 343.5) < 40 and p[2] > 1100: continue
            if p[2] < 470: continue                  # inside the column
            L.add(p, nrm, r=13.0)
    st = Mesh('D12_start_button', smooth_angle=35)
    q = strip_quads[[i for i, q in enumerate(strip_quads) if abs(np.mean(q, 0)[0] - 343.5) < 5 and np.mean(q, 0)[2] > 1100][0]]
    nrm = poly_normal(q, [0, -1, 1]); pos = np.mean(q, 0)
    P, UV = lathe([(0, 0), (16, 0), (16, 3), (14, 5), (0, 5)], 28, M=look_basis(pos, nrm) @ mat_rot('x', 90)); st.add('METAL', P, UV)
    P, UV = lathe([(0, 4.5), (7, 4.5), (6.5, 8), (0, 8.5)], 20, M=look_basis(pos, nrm) @ mat_rot('x', 90)); st.add('BUTTON_RED', P, UV)
    nodes.append(('D12_start_button', 'DETAILS', st))
    # two down-lights in the underside next to the opening
    dl = Mesh('E02_down_lights', smooth_angle=30)
    for x in (205.0, 482.0):
        P, UV = lathe([(0, 0), (24, 0), (26, 2), (0, 2)], 24, M=mat_translate(x, ya - 2, 760) @ mat_rot('x', 180)); dl.add('METAL', P, UV)
        P, UV = disc(19, 24, M=mat_translate(x, ya - 2.5, 760) @ mat_rot('x', 90)); dl.add('LED_WHITE', P, UV)
    nodes.append(('E02_down_lights', 'EMISSION', dl))
    return nodes


def build_bag():
    """Punch bag folded up into the canopy (CAD state): only the lower half of the ball shows."""
    bg = Mesh('D13_bag', smooth_angle=55)
    x, y, z, r = D['bag']
    for g in range(4):
        a0 = 2 * math.pi * g / 4 + math.pi / 4; a1 = a0 + math.pi / 2
        prof = [(r * math.sin(ph) * (1 + 0.08 * math.cos(ph)), r * 1.12 * math.cos(ph)) for ph in np.linspace(math.pi, 0, 26)]
        P, UV = lathe(prof, 10, M=axis_basis((x, y, z), (0, 0, 1)), a0=a0, a1=a1)
        bg.add('BOXING_BAG_RED' if g % 2 else 'BOXING_BAG_BLACK', P, UV)
    nk = Mesh('D14_bag_mount', smooth_angle=45)
    cyl(nk, 'LEATHER_BLACK', (x, y, z + r * 1.05), (x, y, z + r * 1.05 + 140), 34, seg=24, round_r=6)
    box(nk, 'BLACK_PLASTIC', (x - 40, y - 30, z + r * 1.05 + 120), (x + 40, y + 60, z + r * 1.05 + 200), r=6, seg=2)
    return [('D13_bag', 'BAG', bg), ('D14_bag_mount', 'BAG', nk)]


# ------------------------------------------------------------------------------------------ hammer station
def build_hammer(L):
    nodes = []
    tw = Mesh('T01_tower', smooth_angle=25)
    z0, zf = D['tower_z']; ya, yb = D['tower_y']
    wx0, wy0, wx1, wy1 = D['tower_win']
    # front face (z 151) around the window, from the anvil box top up to the cap
    yfa = D['anvil_box'][3]
    def xl(y): return col_xr(y)
    rows = np.unique(np.r_[np.linspace(ya, yb, 30), wy0, wy1])
    for y0_, y1_ in zip(rows[:-1], rows[1:]):
        xa0, xa1 = xl(y0_), xl(y1_); xr0, xr1 = tower_xr(y0_), tower_xr(y1_)
        if y1_ <= wy0 + 1e-6 or y0_ >= wy1 - 1e-6:
            qface(tw, 'BODY_PAINT', [(xa0, y0_, zf), (xr0, y0_, zf), (xr1, y1_, zf), (xa1, y1_, zf)], [0, 0, 1])
        else:
            qface(tw, 'BODY_PAINT', [(xa0, y0_, zf), (wx0, y0_, zf), (wx0, y1_, zf), (xa1, y1_, zf)], [0, 0, 1])
            qface(tw, 'BODY_PAINT', [(wx1, y0_, zf), (xr0, y0_, zf), (xr1, y1_, zf), (wx1, y1_, zf)], [0, 0, 1])
    # window: rows exactly at the window bounds
    # right side (slanted), back (black)
    qface(tw, 'BODY_PAINT', [(tower_xr(ya), ya, z0), (tower_xr(ya), ya, zf), (tower_xr(yb), yb, zf), (tower_xr(yb), yb, z0)], [1, 0.08, 0])
    qface(tw, 'BLACK_STEEL', [(xl(ya), ya, z0), (xl(yb), yb, z0), (tower_xr(yb), yb, z0), (tower_xr(ya), ya, z0)], [0, 0, -1])
    qface(tw, 'BODY_PAINT', [(xl(ya), ya, z0), (xl(ya), ya, zf), (xl(D['col_slant_y'][0]), D['col_slant_y'][0], zf), (xl(D['col_slant_y'][0]), D['col_slant_y'][0], z0)], [-1, -0.14, 0])
    qface(tw, 'BODY_PAINT', [(xl(D['col_slant_y'][0]), D['col_slant_y'][0], z0), (xl(D['col_slant_y'][0]), D['col_slant_y'][0], zf), (xl(yb), yb, zf), (xl(yb), yb, z0)], [-1, 0, 0])
    qface(tw, 'BODY_PAINT', [(xl(ya), ya, z0), (tower_xr(ya), ya, z0), (tower_xr(ya), ya, zf), (xl(ya), ya, zf)], [0, -1, 0])
    # cap
    c0, c1 = D['tower_cap']
    box(tw, 'BODY_PAINT', (col_xr(c1) - 2, c0, z0 - 3), (tower_xr(c0) + 8, c1, zf + 6), r=2, seg=1)
    nodes.append(('T01_tower', 'TOWER', tw))
    # window: dark glass recessed 18 mm, red reveal
    wn = Mesh('T02_tower_window', smooth_angle=20)
    zr = zf - 18
    for q, nn in (([(wx0, wy0, zf), (wx0, wy1, zf), (wx0, wy1, zr), (wx0, wy0, zr)], [1, 0, 0]),
                  ([(wx1, wy0, zf), (wx1, wy0, zr), (wx1, wy1, zr), (wx1, wy1, zf)], [-1, 0, 0]),
                  ([(wx0, wy1, zf), (wx1, wy1, zf), (wx1, wy1, zr), (wx0, wy1, zr)], [0, -1, 0]),
                  ([(wx0, wy0, zf), (wx0, wy0, zr), (wx1, wy0, zr), (wx1, wy0, zf)], [0, 1, 0])):
        qface(wn, 'BODY_PAINT', q, nn)
    qface(wn, 'MONITOR', [(wx0, wy0, zr), (wx1, wy0, zr), (wx1, wy1, zr), (wx0, wy1, zr)], [0, 0, 1])
    # fill the face rows that cross the window edges exactly
    nodes.append(('T02_tower_window', 'TOWER', wn))
    # raised lamp strip on the right of the tower front (12 lamps) + top row
    ls = Mesh('T03_lamp_strip', smooth_angle=30)
    xs0 = D['tower_strip_x']; ys_a, ys_b = D['pad_y'][1], yb - 4
    pts = [(xs0, ys_a, zf), (tower_xr(ys_a) - 3, ys_a, zf), (tower_xr(ys_b) - 3, ys_b, zf), (xs0 + (tower_xr(ys_b) - tower_xr(ys_a)) * 0, ys_b, zf)]
    qface(ls, 'BODY_PAINT', [(p[0], p[1], p[2] + 8) for p in pts], [0, 0, 1])
    for k in range(4):
        a, b = pts[k], pts[(k + 1) % 4]
        q = [a, b, (b[0], b[1], b[2] + 8), (a[0], a[1], a[2] + 8)]
        c = np.mean(q, 0); ctr = np.mean(pts, 0)
        qface(ls, 'BODY_PAINT', q, np.r_[c[0] - ctr[0], c[1] - ctr[1], 0])
    nodes.append(('T03_lamp_strip', 'TOWER', ls))
    for y in np.linspace(2028, 655, 12):
        xm = (xs0 + tower_xr(y)) / 2
        L.add((xm, y, zf + 8), (0, 0, 1), r=15.0)
    for x in (804, 923, 1043):
        L.add((x, 2035, zf), (0, 0, 1), r=15.0)

    # middle box (between kicker and anvil): red top band, black front panel, small lock
    mb = Mesh('H01_middle_box', smooth_angle=25)
    x0, x1, y0, y1, bz0, bz1 = D['mid_box']
    solid_box(mb, 'BODY_PAINT', x0, x1, y0, y1, bz0, bz1, skip=('-y',))
    box(mb, 'BLACK_PLASTIC', (x0 + 6, y0 + 2, bz1 - 3), (x1 - 8, 334, bz1 + 2), r=1.5, seg=1)
    P, UV = lathe([(0, 0), (9, 0), (9, 3), (7, 5), (0, 5)], 20, M=look_basis(np.array([974, 384, bz1]), [0, 0, 1]) @ mat_rot('x', 90))
    mb.add('METAL', P, UV)
    nodes.append(('H01_middle_box', 'HAMMER', mb))
    # anvil box with chamfered top edge (lamps on the chamfer)
    ab = Mesh('H02_anvil_box', smooth_angle=25)
    x0, x1, y0, y1, bz0, bz1 = D['anvil_box']; c = 22.0
    yc_ = y1 - c
    qface(ab, 'BODY_PAINT', [(x0, y0, bz1), (x1, y0, bz1), (x1, yc_, bz1), (x0, yc_, bz1)], [0, 0, 1])
    qface(ab, 'BODY_PAINT', [(x1, y0, bz0), (x1, yc_, bz0), (x1, yc_, bz1), (x1, y0, bz1)], [1, 0, 0])
    qface(ab, 'BODY_PAINT', [(x0, y0, bz0), (x0, y0, bz1), (x0, yc_, bz1), (x0, yc_, bz0)], [-1, 0, 0])
    qface(ab, 'BODY_PAINT', [(x0, y0, bz0), (x0, yc_, bz0), (x1, yc_, bz0), (x1, y0, bz0)], [0, 0, -1])
    qface(ab, 'BODY_PAINT', [(x0, yc_, bz1), (x1, yc_, bz1), (x1 - c, y1, bz1 - c), (x0 + c, y1, bz1 - c)], [0, 1, 1])
    qface(ab, 'BODY_PAINT', [(x1, yc_, bz1), (x1, yc_, bz0), (x1 - c, y1, bz0), (x1 - c, y1, bz1 - c)], [1, 1, 0])
    qface(ab, 'BODY_PAINT', [(x0, yc_, bz0), (x0, yc_, bz1), (x0 + c, y1, bz1 - c), (x0 + c, y1, bz0)], [-1, 1, 0])
    qface(ab, 'BODY_PAINT', [(x0 + c, y1, bz0), (x0 + c, y1, bz1 - c), (x1 - c, y1, bz1 - c), (x1 - c, y1, bz0)], [0, 1, 0])
    nodes.append(('H02_anvil_box', 'HAMMER', ab))
    for x in np.linspace(x0 + 45, x1 - 45, 4):
        L.add((x, y1 - c / 2, bz1 - c / 2), (0, 1, 1), r=13.0)
    for z in np.linspace(bz1 - 60, bz0 + 200, 4):
        L.add((x1 - c / 2, y1 - c / 2, z), (1, 1, 0), r=13.0)
    for z in np.linspace(bz1 - 60, bz0 + 200, 4):
        L.add((x0 + c / 2, y1 - c / 2, z), (-1, 1, 0), r=13.0)
    # bellows + strike pad
    pd = Mesh('H03_strike_pad', smooth_angle=40)
    px, pz, pr = D['pad']; b0, b1, brr = D['bellows']; py0, py1 = D['pad_y']
    prof = []
    for k, y in enumerate(np.linspace(b0, b1, 41)):
        rr = brr - 14 + 14 * abs(math.sin((y - b0) / (b1 - b0) * 5 * math.pi))
        prof.append((rr, y))
    prof = [(0, b0)] + prof + [(0, b1)]
    P, UV = lathe(prof, 40, M=mat_translate(px, 0, pz)); pd.add('RUBBER', P, UV)
    cyl(pd, 'PAD_RUBBER', (px, py0, pz), (px, py1, pz), pr, seg=56, round_r=10)
    nodes.append(('H03_strike_pad', 'HAMMER', pd))
    # hammer: head lying on the middle box (axis front-back), handle leaning on the column
    hm = Mesh('H04_hammer', smooth_angle=40)
    hx, hy, hz, hr, hl = D['hammer_head']
    cyl(hm, 'METAL', (hx, hy, hz - hl / 2), (hx, hy, hz + hl / 2), hr, seg=40, round_r=8)
    tx, ty = D['hammer_top']
    d = np.array([tx - hx, ty - hy, 0.0]); Lh = np.linalg.norm(d); d /= Lh
    p_in = np.array([hx, hy, hz]) + d * (hr - 6)
    cyl(hm, 'METAL', p_in, p_in + d * (Lh * 0.62 - hr), 13.0, seg=20)
    cyl(hm, 'METAL', p_in + d * (Lh * 0.62 - hr), np.array([tx, ty, hz]) - d * 14, 17.0, seg=20, round_r=3)
    cyl(hm, 'METAL', np.array([tx, ty, hz]) - d * 16, np.array([tx, ty, hz]), 19.0, seg=20, round_r=6)
    nodes.append(('H04_hammer', 'HAMMER', hm))
    return nodes


# ------------------------------------------------------------------------------------------ rear
def build_rear():
    nodes = []
    rr = Mesh('R01_rear_doors', smooth_angle=30)
    def door(x0, y0, x1, y1, lock_at, z=D['col_z'][0]):
        box(rr, 'BLACK_STEEL', (x0, y0, z - 4), (x1, y1, z + 1), r=1.5, seg=1)
        g = 18.0
        box(rr, 'BLACK_STEEL', (x0 + g, y0 + g, z - 6), (x1 - g, y1 - g, z - 3.5), r=1.0, seg=1)
        for (a, b, c_, d_) in ((x0 + g - 3, y0 + g - 3, x1 - g + 3, y0 + g), (x0 + g - 3, y1 - g, x1 - g + 3, y1 - g + 3),
                               (x0 + g - 3, y0 + g, x0 + g, y1 - g), (x1 - g, y0 + g, x1 - g + 3, y1 - g)):
            qface(rr, 'GAP_DARK', [(a, b, z - 4.2), (c_, b, z - 4.2), (c_, d_, z - 4.2), (a, d_, z - 4.2)], [0, 0, -1])
        lx, ly = lock_at
        P, UV = lathe([(0, 0), (10, 0), (10, 2.5), (8.5, 5), (0, 5)], 24, M=look_basis(np.array([lx, ly, z - 6]), [0, 0, -1]) @ mat_rot('x', 90))
        rr.add('METAL', P, UV)
    door(43, 999, 648, 1885, (600, 1380))
    door(254, 514, 504, 814, (461, 663))
    door(315, 30 + 12, 784, 500, (735, 296))
    door(878, 54, 1332, 354, (1288, 196), z=0.0)
    # power entry (hexagon)
    P, UV = lathe([(0, 0), (26, 0), (26, 10), (0, 10)], 6, M=look_basis(np.array([648, 934, D['col_z'][0]]), [0, 0, -1]) @ mat_rot('x', 90))
    rr.add('BLACK_PLASTIC', P, UV)
    nodes.append(('R01_rear_doors', 'REAR', rr))
    wh = Mesh('R02_wheels', smooth_angle=40)
    for xc in (113.0, 570.0):                       # transport wheels at the top of the back
        zb_ = D['col_z'][0]
        box(wh, 'METAL', (xc - 45, 1953, zb_ - 6), (xc + 45, 2054, zb_ + 0.5), r=2, seg=1)
        for sg in (-1, 1):
            box(wh, 'METAL', (xc + sg * 24 - 2, 1965, zb_ - 62), (xc + sg * 24 + 2, 2040, zb_ - 5), r=1, seg=1)
        P, UV = lathe([(0, -11), (30, -11), (38, -7), (40, 0), (38, 7), (30, 11), (0, 11)], 32, M=axis_basis((xc, 2003, zb_ - 40), (1, 0, 0)))
        wh.add('TYRE_GREY', P, UV)
    for xc in (149.0, 1224.0):                      # castors at the back of the base
        P, UV = lathe([(0, -10), (22, -10), (25, 0), (22, 10), (0, 10)], 28, M=axis_basis((xc, 25, -38), (1, 0, 0)))
        wh.add('TYRE_YELLOW', P, UV)
        box(wh, 'METAL', (xc - 14, 12, -40), (xc + 14, 40, -6), r=2, seg=1)
    nodes.append(('R02_wheels', 'REAR', wh))
    return nodes


# ------------------------------------------------------------------------------------------ sticker zones (invisible for now)
def build_zones():
    nodes = []
    zf = D['col_z'][1]; ych = D['col_slant_y'][1]; yc = D['can_y'][0]
    fr = Mesh('Z01_front_graphic', smooth_angle=60)     # column front, screen cut out by drawing order
    xs = (D['col_x0'] + 2, D['col_xr_top'] - 2)
    pts = [(xs[0], ych + 2, zf + 1.2), (D['col_xr_low'] - 2, ych + 2, zf + 1.2), (D['col_xr_top'] - 2, D['col_slant_y'][0], zf + 1.2),
           (xs[1], yc - 2, zf + 1.2), (xs[0], yc - 2, zf + 1.2)]
    X0, X1, Y0, Y1 = xs[0], D['col_xr_low'] - 2, ych + 2, yc - 2
    P = np.array([[pts[0], pts[i], pts[i + 1]] for i in range(1, len(pts) - 1)])
    UV = np.stack([(P[..., 0] - X0) / (X1 - X0), (Y1 - P[..., 1]) / (Y1 - Y0)], -1)
    P, UV = orient_with_uv(P, UV, [0, 0, 1]); fr.add('GFX_FRONT', P, UV)
    nodes.append(('Z01_front_graphic', 'GRAPHICS', fr))
    # canopy band: the five front facets of the canopy box
    bd = Mesh('Z02_canopy_band', smooth_angle=60)
    ya_, yb_, yc_ = D['can_y']
    ids = [2, 3, 4, 5, 6]   # BOX_TOP indices of the front facets (after ccw)
    T = np.asarray(BOX_TOP); B = np.asarray(BOX_BOT)
    seq = [i for i in range(len(T)) if T[i][1] > 1]          # vertices not on the back edge, in CCW order
    # order from the left (x small) round the front to the right
    start = int(np.argmin([T[i][0] if T[i][1] > 1 else 1e9 for i in range(len(T))]))
    order = [(start + k) % len(T) for k in range(len(T))]
    order = [i for i in order if T[i][1] > 1]
    if T[order[1]][1] < T[order[0]][1]: order = order[::-1]
    s = [0.0]
    for a, b in zip(order[:-1], order[1:]):
        s.append(s[-1] + np.linalg.norm(T[b] - T[a]))
    Ltot = s[-1]
    cen = np.array([343.5, 600.0])
    for k, (a, b) in enumerate(zip(order[:-1], order[1:])):
        def pt(i, y, top):
            P2 = (T if top else B)[i]
            d = P2 - cen; d = d / np.linalg.norm(d)
            return np.array([P2[0] + d[0] * 1.5, y, P2[1] + d[1] * 1.5])
        q = [pt(a, yb_, False), pt(b, yb_, False), pt(b, yc_, True), pt(a, yc_, True)]
        uv = [[s[k] / Ltot, 1], [s[k + 1] / Ltot, 1], [s[k + 1] / Ltot, 0], [s[k] / Ltot, 0]]
        Pq = np.array([[q[0], q[1], q[2]], [q[0], q[2], q[3]]]); UVq = np.array([[uv[0], uv[1], uv[2]], [uv[0], uv[2], uv[3]]])
        cq = np.mean(q, 0)
        Pq, UVq = orient_with_uv(Pq, UVq, np.r_[cq[0] - cen[0], 0, cq[2] - cen[1]])
        bd.add('GFX_BAND', Pq, UVq)
    nodes.append(('Z02_canopy_band', 'GRAPHICS', bd))
    BAND_LEN.append(Ltot); BAND_LEN.append(yc_ - yb_)
    # left side (column + kicker side, below the canopy)
    lf = Mesh('Z03_left_graphic', smooth_angle=60)
    x = D['col_x0'] - 1.2
    za, zb, ya2, yb2 = D['col_z'][0] + 12, D['col_z'][1] - 8, 50.0, D['can_y'][1] - 5
    P = np.array([[(x, ya2, za), (x, ya2, zb), (x, yb2, zb)], [(x, ya2, za), (x, yb2, zb), (x, yb2, za)]], float)
    UV = np.stack([(P[..., 2] - za) / (zb - za), (yb2 - P[..., 1]) / (yb2 - ya2)], -1)
    P, UV = orient_with_uv(P, UV, [-1, 0, 0]); lf.add('GFX_LEFT', P, UV)
    nodes.append(('Z03_left_graphic', 'GRAPHICS', lf))
    # right side of the hammer box (anvil box, x 1370)
    rt = Mesh('Z04_hammer_side_graphic', smooth_angle=60)
    x0_, x1_, y0_, y1_, z0_, z1_ = D['anvil_box']
    x = x1_ + 1.2; za3, zb3, ya3, yb3 = z0_ + 10, z1_ - 10, y0_ + 10, y1_ - 26
    P = np.array([[(x, ya3, zb3), (x, ya3, za3), (x, yb3, za3)], [(x, ya3, zb3), (x, yb3, za3), (x, yb3, zb3)]], float)
    UV = np.stack([(zb3 - P[..., 2]) / (zb3 - za3), (yb3 - P[..., 1]) / (yb3 - ya3)], -1)
    P, UV = orient_with_uv(P, UV, [1, 0, 0]); rt.add('GFX_RIGHT', P, UV)
    nodes.append(('Z04_hammer_side_graphic', 'GRAPHICS', rt))
    return nodes


BAND_LEN = []


def build_all():
    L = Lamps()
    nodes = []
    nodes += build_base()
    nodes += build_column(L)
    nodes += build_canopy(L)
    nodes += build_bag()
    nodes += build_hammer(L)
    nodes += build_rear()
    nodes += build_zones()
    nodes.append(('E01_lamp_bezels', 'EMISSION', L.bezel))
    nodes.append(('E01_lamps', 'EMISSION', L.leds.mesh))
    M = mat_scale(0.001) @ mat_translate(-CENTRE[0], 0, -CENTRE[2])
    nodes = [(n, p, m.transformed(M)) for n, p, m in nodes]
    return nodes, {'E01_lamps': L.leds}


ROOT_NAME = 'BOXER_MONSTER_3IN1'
GROUPS = ['BODY', 'CANOPY', 'BASE', 'FRONT_PANEL', 'KICKER', 'HAMMER', 'TOWER', 'BAG', 'REAR', 'DETAILS', 'GRAPHICS', 'EMISSION']
ZONES = {
    'front': dict(label='FRONT PANEL', material='GFX_FRONT', meshes=['Z01_front_graphic'], size=[0.836, 1.177]),
    'band': dict(label='CANOPY BAND', material='GFX_BAND', meshes=['Z02_canopy_band'], size=[2.929, 0.213]),
    'left': dict(label='LEFT SIDE', material='GFX_LEFT', meshes=['Z03_left_graphic'], size=[0.264, 1.82]),
    'right': dict(label='HAMMER BOX SIDE', material='GFX_RIGHT', meshes=['Z04_hammer_side_graphic'], size=[0.465, 0.356]),
}
_SRC = 'drawing Boxer Monster 3 in 1 (1:10, 28.09.2026) + CAD renders 23.10.2026'
META = {}
PARAMS = {k: (v if not isinstance(v, tuple) else tuple(v), 'measured on the drawing (mm)') for k, v in D.items()}
