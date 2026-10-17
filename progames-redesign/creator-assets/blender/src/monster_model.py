"""
monster_model.py - PRO GAMES "Ultimate Monster 3in1" (boxer + kicker + hammer).

Source: the generated product views supplied with the brief (no photographs, no drawings).  The
views are not orthographic and differ slightly from each other, so one consistent geometry was
chosen from features that repeat across them:
  * heights and depths: the left side view (n11, ~624 px/m, nearly orthographic),
  * widths: the front view (n13) measured relative to the screen frame (n11 height 0.75 m),
  * layout of the hammer station / tower: front view + both 3/4 views (n12, n14),
  * details and prints: the close-ups (n02 front panel, n03 hammer, n05 canopy, n06 kicker, n09 bag).
Overall: height 2.30 m (spec), width 1.40 m (spec), depth 1.30 m (views; the spec states 1.40 m).

State: punch bag LOWERED (hanging vertically under the canopy), kicker arm at rest, hammer lying on
the strike pad with its safety cable, doors closed.

Axes: metres, glTF (Y up, +Z = machine front, +X = machine right as seen from the front).
"""
import math, os, json
import numpy as np
from meshlib import (Mesh, lathe, disc, rounded_box_tris, ray_polygon, mat_translate, mat_rot, look_basis,
                     apply, orient_with_uv, grid_tris)

_TEX_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'textures', 'monster', 'monster_textures.json')
TEXMETA = json.load(open(_TEX_JSON))
ATLAS = TEXMETA['atlas']

# ------------------------------------------------------------------------------------------ dimensions
D = dict(
    plate_top=0.055,
    # boxer column (front face is a trapezoid: right edge leans out towards the kicker)
    col_x0=-0.58, col_x1_top=0.12, col_x1_low=0.20, col_slant_y=(1.81, 0.69),
    col_z0=-0.585, col_z1=-0.312,
    # canopy
    can_xc=-0.23, band_y=(1.86, 2.10), under_y=1.81, top_y=(2.19, 2.30), rim_chamfer=0.013,
    # kicker cabinet
    kick_z=-0.224, kick_top=0.645, kick_back_top=0.69,
    recess_out=(-0.554, 0.116, 0.025, 0.569), recess_in=(-0.385, 0.279, 0.017, 0.489), recess_depth=0.17,
    # screen frame
    frame=(-0.553, 0.99, 0.075, 1.74),
    # hammer station
    ham_left=(0.20, 0.40, -0.53, -0.26, 0.56), ham_box=(0.40, 0.70, -0.53, -0.12, 0.58),
    pad=(0.55, -0.32, 0.165), pad_y=(0.70, 0.76), head_c=(0.535, 0.832, -0.30), head_r=0.072, head_len=0.24,   # n11/n07/n13: pad top ~0.76, head Ø 145 mm
    # tower
    tower_z=(-0.70, -0.53), tower_top=2.06, tower_x1=(0.70, 0.62),   # rear views: black slab stands out behind the column
    # bag (lowered)
    bag_hang=(-0.23, 0.24), bag_c_y=1.475, bag_rx=0.115, bag_ry=0.12,
)
PT = D['plate_top']
CX0 = D['col_x0']; CZ0, CZ1 = D['col_z0'], D['col_z1']
KZ = D['kick_z']
XC = D['can_xc']
Y3 = np.array([0, 1.0, 0]); X3 = np.array([1.0, 0, 0]); Z3 = np.array([0, 0, 1.0])


def col_xr(y):
    """Right edge of the boxer column (and left edge of the tower) at height y."""
    y0, y1 = D['col_slant_y']
    if y >= y0:
        return D['col_x1_top']
    if y <= y1:
        return D['col_x1_low']
    t = (y0 - y) / (y0 - y1)
    return D['col_x1_top'] + t * (D['col_x1_low'] - D['col_x1_top'])


def tower_xr(y):
    a, b = D['tower_x1']
    t = min(max((y - 0.58) / (1.90 - 0.58), 0.0), 1.0)
    return a + (b - a) * t


def canopy_top(z):
    return D['top_y'][0] + min((z + 0.649) / 1.249, 1.0) * (D['top_y'][1] - D['top_y'][0])


# ------------------------------------------------------------------------------------------ helpers
def V(*a):
    return np.array(a, float)


def poly(mesh, mat, pts, normal, uv=None):
    """Convex planar polygon (fan), oriented along `normal`."""
    pts = [np.asarray(p, float) for p in pts]
    P = np.array([[pts[0], pts[i], pts[i + 1]] for i in range(1, len(pts) - 1)])
    UVa = None
    if uv is not None:
        uv = [np.asarray(u, float) for u in uv]
        UVa = np.array([[uv[0], uv[i], uv[i + 1]] for i in range(1, len(uv) - 1)])
    else:
        from meshlib import box_uv
        UVa = box_uv(P)
    P, UVa = orient_with_uv(P, UVa, normal)
    mesh.add(mat, P, UVa)


def quadfill(mesh, mat, a, b, c, d, normal, uv=None):
    poly(mesh, mat, [a, b, c, d], normal, uv)


def atlas_uv(name):
    x, y, w, h = ATLAS['rects'][name]
    AW, AH = ATLAS['size']
    return x / AW, y / AH, (x + w) / AW, (y + h) / AH


def decal(mesh, name, tl, tr, br, bl, normal, sub=None, mat='DECALS'):
    """Atlas sticker on a planar quad (corners as seen from the front of the sticker)."""
    u0, v0, u1, v1 = atlas_uv(name) if sub is None else sub
    n = np.asarray(normal, float); n = n / np.linalg.norm(n)
    off = n * 0.0012
    poly(mesh, mat, [np.asarray(p) + off for p in (tl, tr, br, bl)], n, [(u0, v0), (u1, v0), (u1, v1), (u0, v1)])


def frame_on(origin, U, Vv, w, h):
    """Corners of a w x h rectangle centred at origin spanning unit vectors U (right) and Vv (up)."""
    o = np.asarray(origin, float); U = np.asarray(U, float); Vv = np.asarray(Vv, float)
    return (o - U * w / 2 + Vv * h / 2, o + U * w / 2 + Vv * h / 2, o + U * w / 2 - Vv * h / 2, o - U * w / 2 - Vv * h / 2)


def box(mesh, mat, lo, hi, r=0.002, seg=1):
    mesh.add(mat, rounded_box_tris(lo, hi, r, seg=seg, step=1))


def cyl(mesh, mat, p0, p1, r, seg=16, caps=True, prof=None):
    p0 = np.asarray(p0, float); p1 = np.asarray(p1, float)
    d = p1 - p0; L = np.linalg.norm(d)
    M = look_basis(p0, d / L) @ mat_rot('x', 90)
    pr = prof if prof is not None else ([(0.0, 0.0)] if caps else []) + [(r, 0.0), (r, L)] + ([(0.0, L)] if caps else [])
    P, UV = lathe(pr, seg, M=M)
    mesh.add(mat, P, UV)


def inset(poly2, d):
    """Inset a convex CCW polygon (x,z) by d (positive = inwards)."""
    P = np.asarray(poly2, float); n = len(P)
    lines = []
    for i in range(n):
        a, b = P[i], P[(i + 1) % n]
        t = (b - a) / np.linalg.norm(b - a)
        nrm = np.array([t[1], -t[0]])            # outward for CCW
        lines.append((a - nrm * d, t))
    out = []
    for i in range(n):
        (p1, t1), (p2, t2) = lines[i - 1], lines[i]
        A = np.array([t1, -t2]).T
        s = np.linalg.solve(A, p2 - p1)
        out.append(p1 + t1 * s[0])
    return np.array(out)


def lamp(dome, base, pos, normal, r=0.019):
    """Marquee lamp: milky hemispherical dome on a toothed white base ring."""
    M = look_basis(np.asarray(pos, float), normal) @ mat_rot('x', 90)
    prof = [(r * math.cos(t), 0.004 + 0.85 * r * math.sin(t)) for t in np.linspace(0, math.pi / 2, 6)]
    P, UV = lathe(prof + [(0.0, 0.004 + 0.85 * r)], 14, M=M)
    dome.add('LAMP_DOME', P, UV)
    rb = r * 1.27
    P, UV = lathe([(rb * 0.8, -0.0005), (rb, -0.0005), (rb, 0.003), (r * 0.98, 0.0045)], 28, M=M,
                  radial_fn=lambda a, y, rr: rr * (1 + (0.05 * (0.5 + 0.5 * math.cos(28 * a)) if rr > r else 0)))
    base.add('LAMP_BASE', P, UV)


# ------------------------------------------------------------------------------------------ platform
def build_platform():
    """Diamond (5-bar) tread plate on black steel frames: the strip under the cabinet, the long
    left walkway in front of the bag and the shorter part in front of the kicker (stepped front
    edge as in all front views), plus the black plinth under the hammer station and tower."""
    plate = Mesh('B05_tread_plate', smooth_angle=20)
    frame = Mesh('B04_base_frame', smooth_angle=30)
    K = 1 / 0.059
    ch = 0.012
    h = PT

    def slab(x0, x1, z0, z1):
        xi0, xi1, zi0, zi1 = x0 + ch, x1 - ch, z0 + ch, z1 - ch
        def pl(pts, n):
            uv = [(p[0] * K, p[2] * K) for p in pts]
            poly(plate, 'DIAMOND_PLATE', pts, n, uv)
        pl([V(xi0, h, zi1), V(xi1, h, zi1), V(xi1, h, zi0), V(xi0, h, zi0)], Y3)
        hb = h - ch
        pl([V(xi0, h, zi1), V(xi1, h, zi1), V(x1, hb, z1), V(x0, hb, z1)], [0, 1, 1])
        pl([V(xi0, h, zi0), V(xi1, h, zi0), V(x1, hb, z0), V(x0, hb, z0)], [0, 1, -1])
        pl([V(xi0, h, zi0), V(xi0, h, zi1), V(x0, hb, z1), V(x0, hb, z0)], [-1, 1, 0])
        pl([V(xi1, h, zi0), V(xi1, h, zi1), V(x1, hb, z1), V(x1, hb, z0)], [1, 1, 0])
        # folded plate edge (vertical, 8 mm) and black frame below
        for (a, b, n) in (((x0, z1), (x1, z1), Z3), ((x0, z0), (x1, z0), -Z3), ((x0, z0), (x0, z1), -X3), ((x1, z0), (x1, z1), X3)):
            pl([V(a[0], hb, a[1]), V(b[0], hb, b[1]), V(b[0], hb - 0.008, b[1]), V(a[0], hb - 0.008, a[1])], n)
        box(frame, 'BLACK_STEEL', [x0 + 0.004, 0.004, z0 + 0.004], [x1 - 0.004, hb - 0.008, z1 - 0.004], 0.003)

    slab(-0.62, 0.20, -0.633, KZ)          # under the cabinet (visible along the left side and at the back)
    slab(-0.62, -0.16, KZ, 0.633)          # walkway in front of the bag
    slab(-0.16, 0.20, KZ, 0.14)            # in front of the kicker
    # plinth under the hammer station + tower
    box(frame, 'BLACK_STEEL', [0.12, 0.0, -0.715], [0.715, PT, -0.10], 0.004, seg=2)
    return [('B05_tread_plate', 'BASE', plate), ('B04_base_frame', 'BASE', frame)]


# ------------------------------------------------------------------------------------------ boxer column
def build_column(dome, base):
    nodes = []
    col = Mesh('B01_column_body', smooth_angle=30)
    ytop = D['band_y'][0]
    # cross-section in x-y (left edge vertical, right edge leaning) extruded from z0 to z1
    sec = [V(CX0, PT), V(col_xr(0.0), PT), V(col_xr(0.69), 0.69), V(col_xr(1.81), 1.81), V(col_xr(1.81), ytop), V(CX0, ytop)]
    front = [V(p[0], p[1], CZ1) for p in sec]
    back = [V(p[0], p[1], CZ0) for p in sec]
    poly(col, 'BODY_PAINT', front, Z3)
    poly(col, 'BODY_PAINT', back, -Z3)
    for i in range(len(sec)):
        a, b = sec[i], sec[(i + 1) % len(sec)]
        if a[1] == ytop and b[1] == ytop:
            continue
        t = b - a; n = np.array([t[1], -t[0], 0.0])
        quadfill(col, 'BODY_PAINT', V(a[0], a[1], CZ1), V(b[0], b[1], CZ1), V(b[0], b[1], CZ0), V(a[0], a[1], CZ0), n)
    nodes.append(('B01_column_body', 'BODY', col))

    # --- front panel: screen frame, screen, header/footer prints, glass, coin mech, start button
    fp = Mesh('F01_screen_frame', smooth_angle=30)
    x0, y0, x1, y1 = D['frame']
    zf = CZ1
    box(fp, 'BLACK_PLASTIC', [x0, y0, zf - 0.002], [x1, y1, zf + 0.008], 0.003, seg=2)
    W, H = x1 - x0, y1 - y0
    for fx in (0.027, 0.973):
        for fy in (0.03, 0.285, 0.66, 0.96):
            c = V(x0 + fx * W, y1 - fy * H, zf + 0.008)
            P, UV = lathe([(0.0, 0.0), (0.0065, 0.0), (0.0062, 0.0015), (0.004, 0.0028), (0.0, 0.003)], 14,
                          M=look_basis(c, Z3) @ mat_rot('x', 90))
            fp.add('METAL', P, UV)
    nodes.append(('F01_screen_frame', 'FRONT_PANEL', fp))
    ix0, ix1 = x0 + 0.056 * W, x0 + 0.944 * W
    hy0, hy1 = y1 - 0.117 * H, y1 - 0.014 * H          # header strip
    fy0, fy1 = y1 - 0.979 * H, y1 - 0.834 * H          # footer strip
    scr = Mesh('F02_screen', smooth_angle=10)
    quadfill(scr, 'MONITOR', V(ix0, fy1, zf + 0.0085), V(ix1, fy1, zf + 0.0085), V(ix1, hy0, zf + 0.0085), V(ix0, hy0, zf + 0.0085), Z3,
             [(0, 1), (1, 1), (1, 0), (0, 0)])
    nodes.append(('F02_screen', 'FRONT_PANEL', scr))
    st = Mesh('G10_stickers', smooth_angle=10)
    decal(st, 'screen_header', V(ix0, hy1, zf + 0.0085), V(ix1, hy1, zf + 0.0085), V(ix1, hy0, zf + 0.0085), V(ix0, hy0, zf + 0.0085), Z3)
    decal(st, 'screen_footer', V(ix0, fy1, zf + 0.0085), V(ix1, fy1, zf + 0.0085), V(ix1, fy0, zf + 0.0085), V(ix0, fy0, zf + 0.0085), Z3)
    gl = Mesh('F03_screen_glass', smooth_angle=10)
    quadfill(gl, 'GLASS', V(ix0, fy0, zf + 0.0105), V(ix1, fy0, zf + 0.0105), V(ix1, hy1, zf + 0.0105), V(ix0, hy1, zf + 0.0105), Z3)
    nodes.append(('F03_screen_glass', 'FRONT_PANEL', gl))
    # coin mech (raised black box, its face printed from the close-up) + price label in the panel print
    cm = Mesh('F04_coin_mech', smooth_angle=30)
    cx0, cy0, cx1, cy1 = -0.087, 0.801, -0.030, 0.931
    box(cm, 'BLACK_PLASTIC', [cx0, cy0, zf - 0.002], [cx1, cy1, zf + 0.012], 0.003, seg=2)
    decal(cm, 'coin_mech', V(cx0, cy1, zf + 0.012), V(cx1, cy1, zf + 0.012), V(cx1, cy0, zf + 0.012), V(cx0, cy0, zf + 0.012), Z3)
    nodes.append(('F04_coin_mech', 'FRONT_PANEL', cm))
    bt = Mesh('F05_start_kicker_button', smooth_angle=35)
    c = V(0.035, 0.939, zf)
    P, UV = lathe([(0.0, 0.0005), (0.024, 0.0005), (0.024, 0.004), (0.019, 0.006), (0.0175, 0.0045), (0.0, 0.0055)], 28,
                  M=look_basis(c, Z3) @ mat_rot('x', 90))
    bt.add('METAL', P, UV)
    nodes.append(('F05_start_kicker_button', 'FRONT_PANEL', bt))
    # front zone print (stickers below the frame) - column front trapezoid between kicker and canopy
    G = TEXMETA['front']
    gm = Mesh('G01_front_graphic', smooth_angle=10)
    ys = np.linspace(0.69, D['under_y'], 9)
    for ya, yb in zip(ys[:-1], ys[1:]):
        pts = [V(CX0, ya, zf + 0.0012), V(col_xr(ya), ya, zf + 0.0012), V(col_xr(yb), yb, zf + 0.0012), V(CX0, yb, zf + 0.0012)]
        uv = [((p[0] - G['x'][0]) / (G['x'][1] - G['x'][0]), (G['y'][1] - p[1]) / (G['y'][1] - G['y'][0])) for p in pts]
        poly(gm, 'GFX_FRONT', pts, Z3, uv)
    nodes.append(('G01_front_graphic', 'GRAPHICS', gm))

    # --- side prints (L-shaped: canopy band side + column side + kicker side)
    by0, by1 = D['band_y']
    Lm = TEXMETA['left']
    lg = Mesh('G03_left_graphic', smooth_angle=10)
    xL = CX0 - 0.0012
    def side_rect(mesh, mat, xfun, z0, z1, ya, yb, uvf, n):
        for yy0, yy1 in zip(np.linspace(ya, yb, 5)[:-1], np.linspace(ya, yb, 5)[1:]):
            pts = [V(xfun(yy0), yy0, z0), V(xfun(yy0), yy0, z1), V(xfun(yy1), yy1, z1), V(xfun(yy1), yy1, z0)]
            poly(mesh, mat, pts, n, [uvf(p) for p in pts])
    luv = lambda p: ((p[2] - Lm['z'][0]) / (Lm['z'][1] - Lm['z'][0]), (Lm['y'][1] - p[1]) / (Lm['y'][1] - Lm['y'][0]))
    # one continuous, neatly trimmed print per side: canopy band side + column side + kicker side with
    # the diagonal step - outlines measured on the side view n11 (the print stops ~20 mm inside the
    # black rear profile and the red front edge)
    def panel(mesh, mat, pieces, xfun, n, uvf):
        for pc in pieces:
            pts = [V(xfun(y), y, z) for (z, y) in pc]
            poly(mesh, mat, pts, n, [uvf(p) for p in pts])
    GZ0, GZB1, GY0, GY1 = -0.526, 0.32, 1.875, 2.095
    left_pieces = [[(GZ0, 0.08), (-0.262, 0.08), (-0.262, 0.57), (GZ0, 0.57)],
                   [(GZ0, 0.57), (-0.262, 0.57), (-0.325, 0.665), (GZ0, 0.665)],
                   [(GZ0, 0.665), (-0.325, 0.665), (-0.325, GY0), (GZ0, GY0)],
                   [(GZ0, GY0), (GZB1, GY0), (GZB1, GY1), (GZ0, GY1)]]
    for pc in left_pieces[2:]:
        pass
    # split the tall pieces so the mesh follows the face closely
    def split(pc, k=4):
        (z0, y0), _, _, (z3, y3) = pc
        out = []
        for t0, t1 in zip(np.linspace(0, 1, k + 1)[:-1], np.linspace(0, 1, k + 1)[1:]):
            out.append([(pc[0][0], pc[0][1] + (pc[3][1] - pc[0][1]) * t0), (pc[1][0] + (pc[2][0] - pc[1][0]) * t0, pc[1][1] + (pc[2][1] - pc[1][1]) * t0),
                        (pc[1][0] + (pc[2][0] - pc[1][0]) * t1, pc[1][1] + (pc[2][1] - pc[1][1]) * t1), (pc[0][0], pc[0][1] + (pc[3][1] - pc[0][1]) * t1)])
        return out
    panel(lg, 'GFX_LEFT', [q for pc in left_pieces for q in split(pc)], lambda y: CX0 - 0.0012, -X3, luv)
    nodes.append(('G03_left_graphic', 'GRAPHICS', lg))
    Rm = TEXMETA['right']
    rg = Mesh('G04_right_graphic', smooth_angle=10)
    ruv = lambda p: ((Rm['z'][1] - p[2]) / (Rm['z'][1] - Rm['z'][0]), (Rm['y'][1] - p[1]) / (Rm['y'][1] - Rm['y'][0]))
    right_pieces = [[(-0.52, 0.60), (-0.325, 0.60), (-0.325, GY0), (-0.52, GY0)],
                    [(GZ0, GY0), (GZB1, GY0), (GZB1, GY1), (GZ0, GY1)]]
    panel(rg, 'GFX_RIGHT', [q for pc in right_pieces for q in split(pc, 8)], lambda y: col_xr(y) + 0.0012, [1, 0.07, 0], ruv)
    nodes.append(('G04_right_graphic', 'GRAPHICS', rg))

    # --- black edge profiles on the rear vertical edges of the column
    pr = Mesh('R06_edge_profiles', smooth_angle=30)
    box(pr, 'BLACK_STEEL', [CX0 - 0.003, PT, CZ0 - 0.003], [CX0 + 0.004, by1, CZ0 + 0.040], 0.0015)
    box(pr, 'BLACK_STEEL', [CX0 - 0.003, PT, CZ0 - 0.003], [CX0 + 0.040, by1, CZ0 + 0.004], 0.0015)
    box(pr, 'BLACK_STEEL', [0.12 - 0.040, PT, CZ0 - 0.003], [0.12 + 0.003, by1, CZ0 + 0.004], 0.0015)
    nodes.append(('R06_edge_profiles', 'BODY', pr))
    nodes.append(('G10_stickers', 'GRAPHICS', st))
    return nodes, st


# ------------------------------------------------------------------------------------------ canopy
def band_outline():
    """Band (lower canopy tier) plan, CCW in (x, z)."""
    h, zs, zf, hf = 0.35, 0.337, 0.437, 0.252
    pts = [(-h, CZ0), (-h, zs), (-hf, zf), (hf, zf), (h, zs), (h, CZ0)]
    P = np.array([(XC + x, z) for x, z in pts])
    # CCW in (x,z): reverse if needed
    a = 0.5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])
    return P if a > 0 else P[::-1].copy()


def top_outline():
    h, zs, zf, hf, zb = 0.47, 0.43, 0.60, 0.28, -0.649     # steeper front fascia (IMG_0532 / n05)
    pts = [(-h, zb), (-h, zs), (-hf, zf), (hf, zf), (h, zs), (h, zb)]
    P = np.array([(XC + x, z) for x, z in pts])
    a = 0.5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])
    return P if a > 0 else P[::-1].copy()


def outward(a, b):
    """Outward normal (x,z) of edge a->b of a CCW (x,z) polygon -> 3D."""
    t = b - a
    return np.array([t[1], 0.0, -t[0]])


def build_canopy(dome, base, st):
    nodes = []
    by0, by1 = D['band_y']
    B = band_outline()
    T = top_outline()
    # thick moulded rim on top of the band (IMG_0532/0546/n05): it projects ~30 mm all round with
    # bevelled lower and upper edges; the crown fascia starts on top of it
    RIM_H = 0.046
    yR = by1 + RIM_H
    Bo = inset(B, -0.030)                      # rim outer face
    Bi = inset(B, -0.016)                      # foot of the crown fascia (rim top, after the upper bevel)
    Tr = T.copy()
    ch = D['rim_chamfer']
    Tc = inset(T, ch)

    band = Mesh('B02_canopy_band', smooth_angle=25)
    n = len(B)
    for i in range(n):
        a, b = B[i], B[(i + 1) % n]
        nrm = outward(a, b)
        quadfill(band, 'BODY_PAINT', V(a[0], by0, a[1]), V(b[0], by0, b[1]), V(b[0], by1, b[1]), V(a[0], by1, a[1]), nrm)
        # rim: lower bevel, vertical face, upper bevel
        ao, bo, ai, bi = Bo[i], Bo[(i + 1) % n], Bi[i], Bi[(i + 1) % n]
        quadfill(band, 'BODY_PAINT', V(a[0], by1, a[1]), V(b[0], by1, b[1]), V(bo[0], by1 + 0.013, bo[1]), V(ao[0], by1 + 0.013, ao[1]), nrm + np.array([0, -1.0, 0]))
        quadfill(band, 'BODY_PAINT', V(ao[0], by1 + 0.013, ao[1]), V(bo[0], by1 + 0.013, bo[1]), V(bo[0], yR - 0.012, bo[1]), V(ao[0], yR - 0.012, ao[1]), nrm)
        quadfill(band, 'BODY_PAINT', V(ao[0], yR - 0.012, ao[1]), V(bo[0], yR - 0.012, bo[1]), V(bi[0], yR, bi[1]), V(ai[0], yR, ai[1]), nrm + np.array([0, 1.0, 0]))
    nodes.append(('B02_canopy_band', 'CANOPY', band))

    crown = Mesh('B02_canopy_crown', smooth_angle=20)
    for i in range(n):
        a, b = Bi[i], Bi[(i + 1) % n]
        c, d = T[(i + 1) % n], T[i]
        ca, cb = Tc[i], Tc[(i + 1) % n]
        ya, yb = canopy_top(d[1]) - ch, canopy_top(c[1]) - ch
        nrm = outward(T[i], T[(i + 1) % n]) + np.array([0, -0.5, 0])   # the flared fascia overhangs: normal points out and down
        # straight flared fascia from the band ledge up to the rim
        quadfill(crown, 'BODY_PAINT', V(a[0], yR, a[1]), V(b[0], yR, b[1]), V(c[0], yb, c[1]), V(d[0], ya, d[1]), nrm)
        # sharp, cut-off top edge (13 mm chamfer) - as on the Boxer Champion
        quadfill(crown, 'BODY_PAINT', V(d[0], ya, d[1]), V(c[0], yb, c[1]), V(cb[0], canopy_top(cb[1]), cb[1]), V(ca[0], canopy_top(ca[1]), ca[1]),
                 outward(T[i], T[(i + 1) % n]) + np.array([0, 2.0, 0]))
    poly(crown, 'BODY_PAINT', [V(p[0], canopy_top(p[1]), p[1]) for p in Tc], [0, 1, -0.085])
    nodes.append(('B02_canopy_crown', 'CANOPY', crown))

    # ---- front band print (zone 'band'): left chamfer, front, right chamfer
    bm = Mesh('G02_band_graphic', smooth_angle=10)
    i_lf = [k for k in range(n) if abs(B[k][1] - 0.337) < 1e-6 and B[k][0] < XC][0]
    # walk the polyline left-side end -> left front -> right front -> right-side end
    lpts = [np.array([XC - 0.35, 0.337]), np.array([XC - 0.252, 0.437]), np.array([XC + 0.252, 0.437]), np.array([XC + 0.35, 0.337])]
    seg = np.linalg.norm(np.diff(lpts, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)]); Ltot = s[-1]
    m0, m1 = 0.012, Ltot - 0.012
    gy0, gy1 = by0 + 0.018, by1 - 0.010
    def at(sv):
        k = min(np.searchsorted(s, sv, side='right') - 1, 2)
        t = (sv - s[k]) / seg[k]
        p = lpts[k] + (lpts[k + 1] - lpts[k]) * t
        e = lpts[k + 1] - lpts[k]; nn = np.array([-e[1], e[0]]); nn /= np.linalg.norm(nn)
        if nn[1] < 0:
            nn = -nn
        return p + nn * 0.0012, nn
    samples = sorted(set(list(np.linspace(m0, m1, 40)) + [s[1], s[2]]))
    for sa, sb in zip(samples[:-1], samples[1:]):
        (pa, na), (pb, nb) = at(sa), at(sb + 1e-9 if sb in (s[1], s[2]) else sb)
        pb, nb = at(sb - 1e-9) if sb in (s[1], s[2]) else (pb, nb)
        ua, ub = (sa - m0) / (m1 - m0), (sb - m0) / (m1 - m0)
        nn = (na + nb) / 2
        poly(bm, 'GFX_BAND', [V(pa[0], gy0, pa[1]), V(pb[0], gy0, pb[1]), V(pb[0], gy1, pb[1]), V(pa[0], gy1, pa[1])],
             V(nn[0], 0, nn[1]), [(ua, 1), (ub, 1), (ub, 0), (ua, 0)])
    nodes.append(('G02_band_graphic', 'GRAPHICS', bm))

    # ---- bottom: chamfered lamp ledge around the open part, underside with the bag opening
    uy = D['under_y']
    ring = [np.array([XC - 0.35, CZ1]), np.array([XC - 0.35, 0.337]), np.array([XC - 0.252, 0.437]),
            np.array([XC + 0.252, 0.437]), np.array([XC + 0.35, 0.337]), np.array([XC + 0.35, CZ1])]
    inner = [np.array([XC - 0.30, CZ1]), np.array([XC - 0.30, 0.316]), np.array([XC - 0.231, 0.387]),
             np.array([XC + 0.231, 0.387]), np.array([XC + 0.30, 0.316]), np.array([XC + 0.30, CZ1])]
    und = Mesh('B03_canopy_underside', smooth_angle=25)
    for k in range(5):
        a, b, ai, bi = ring[k], ring[k + 1], inner[k], inner[k + 1]
        e = b - a; nn = np.array([-e[1], 0, e[0]]); nn = -nn if (nn[0] * (a[0] - XC) + nn[2] * (a[1] - 0.1)) < 0 else nn
        quadfill(und, 'BODY_PAINT', V(a[0], by0, a[1]), V(b[0], by0, b[1]), V(bi[0], uy, bi[1]), V(ai[0], uy, ai[1]), nn + np.array([0, -1.0, 0]))
    # underside: ring between the inner ledge outline (+ column front line) and the bag opening
    hx, hz = D['bag_hang']
    outer_poly = np.array(inner)                     # closed by the column-front segment
    op_w, op_d, op_r = 0.165, 0.13, 0.075        # large rounded opening (IMG_0542)
    def rrect(w, d, r, nseg=6):
        pts = []
        for (cx, cz, a0) in ((hx + w - r, hz + d - r, 0), (hx - w + r, hz + d - r, 90), (hx - w + r, hz - d + r, 180), (hx + w - r, hz - d + r, 270)):
            for t in np.linspace(a0, a0 + 90, nseg):
                pts.append([cx + r * math.cos(math.radians(t)), cz + r * math.sin(math.radians(t))])
        return np.array(pts)
    hole = rrect(op_w, op_d, op_r)
    N = 120
    angs = np.linspace(0, 2 * math.pi, N, endpoint=False)
    c = np.array([hx, hz])
    ro = ray_polygon(c, angs, outer_poly)
    ri = ray_polygon(c, angs, hole)
    dirs = np.stack([np.cos(angs), np.sin(angs)], 1)
    for k in range(N):
        k2 = (k + 1) % N
        a, b = c + dirs[k] * ro[k], c + dirs[k2] * ro[k2]
        ai, bi = c + dirs[k] * ri[k], c + dirs[k2] * ri[k2]
        quadfill(und, 'BODY_PAINT', V(a[0], uy, a[1]), V(b[0], uy, b[1]), V(bi[0], uy, bi[1]), V(ai[0], uy, ai[1]), -Y3)
    # opening: short funnel up into the canopy, dark cavity, black neck mount
    hole2 = rrect(op_w - 0.03, op_d - 0.025, op_r * 0.6)
    ri2 = ray_polygon(c, angs, hole2)
    for k in range(N):
        k2 = (k + 1) % N
        a, b = c + dirs[k] * ri[k], c + dirs[k2] * ri[k2]
        ai, bi = c + dirs[k] * ri2[k], c + dirs[k2] * ri2[k2]
        quadfill(und, 'BODY_PAINT', V(a[0], uy, a[1]), V(b[0], uy, b[1]), V(bi[0], uy + 0.05, bi[1]), V(ai[0], uy + 0.05, ai[1]),
                 V(-(a[0] + b[0]) / 2 + hx, -0.3, -(a[1] + b[1]) / 2 + hz))
        quadfill(und, 'CAVITY_DARK', V(ai[0], uy + 0.05, ai[1]), V(bi[0], uy + 0.05, bi[1]), V(hx, uy + 0.05, hz), V(hx, uy + 0.05, hz), -Y3)
    nodes.append(('B03_canopy_underside', 'CANOPY', und))

    # downlights (two round LED spots either side of the opening)
    dl = Mesh('E01_downlights', smooth_angle=30)
    dlr = Mesh('E01_downlight_rings', smooth_angle=30)
    for sx in (-1, 1):
        p = V(hx + sx * 0.235, uy, hz + 0.07)
        M = look_basis(p, -Y3) @ mat_rot('x', 90)
        P, UV = lathe([(0.026, 0.0), (0.036, 0.0), (0.036, 0.002), (0.028, 0.004), (0.026, 0.0035)], 28, M=M)
        dlr.add('METAL', P, UV)
        P, UV = disc(0.026, 24, M=look_basis(p - Y3 * 0.0025, -Y3))
        dl.add('LED_WHITE', P, UV)
    nodes.append(('E01_downlights', 'EMISSION', dl))
    nodes.append(('E01_downlight_rings', 'CANOPY', dlr))

    # START BOXER button on the front of the lamp ledge
    a, b, ai, bi = ring[2], ring[3], inner[2], inner[3]
    pc = (a + b + ai + bi) / 4
    p3 = V(pc[0], (by0 + uy) / 2, pc[1])
    nl = V(0, -0.05 / 0.05, 0.05 / 0.05); nl /= np.linalg.norm(nl)
    upv = V(0, 1.0, 1.0); upv /= np.linalg.norm(upv)
    tl, tr, br, bl = frame_on(p3, X3, upv, 0.062, 0.062)
    decal(st, 'st_start_boxer', tl, tr, br, bl, nl)
    btn = Mesh('F06_start_boxer_button', smooth_angle=35)
    P, UV = lathe([(0.0, 0.0), (0.016, 0.0), (0.016, 0.003), (0.012, 0.0045), (0.0, 0.0045)], 24, M=look_basis(p3, nl) @ mat_rot('x', 90))
    btn.add('METAL', P, UV)
    nodes.append(('F06_start_boxer_button', 'CANOPY', btn))

    # ---- lamps
    def lamps_on_ledge(a, b, ai, bi, ts):
        for t in ts:
            p = (a + (b - a) * t + ai + (bi - ai) * t) / 2
            e = b - a; nn = np.array([-e[1], e[0]]); nn /= np.linalg.norm(nn)
            if np.dot(nn, a - np.array([XC, 0.0])) < 0:
                nn = -nn
            nrm = V(nn[0], -1.0, nn[1]); nrm /= np.linalg.norm(nrm)
            lamp(dome, base, V(p[0], (by0 + uy) / 2, p[1]) + nrm * 0.002, nrm)
    lamps_on_ledge(ring[2], ring[3], inner[2], inner[3], [0.5 - 0.19 / 0.504, 0.5 - 0.08 / 0.504, 0.5 + 0.08 / 0.504, 0.5 + 0.19 / 0.504])
    lamps_on_ledge(ring[1], ring[2], inner[1], inner[2], [0.5])
    lamps_on_ledge(ring[3], ring[4], inner[3], inner[4], [0.5])
    zs_side = np.linspace(-0.22, 0.25, 5)
    for k, zz in ((0, zs_side), (4, zs_side)):
        a, b, ai, bi = ring[k], ring[k + 1], inner[k], inner[k + 1]
        lamps_on_ledge(a, b, ai, bi, [(z - a[1]) / (b[1] - a[1]) for z in zz])

    def fascia_point(i, s, t):
        """Point on crown facet i (edge Bi[i]->Bi[i+1] at the bottom, T[i]->T[i+1] at the rim)."""
        a, b = Bi[i], Bi[(i + 1) % n]; c, d = T[(i + 1) % n], T[i]
        pb = a + (b - a) * s; pt = d + (c - d) * s
        yb = yR; yt = canopy_top(pt[1]) - ch
        p = pb + (pt - pb) * t
        y = yb + (yt - yb) * t
        e1 = V(b[0] - a[0], 0, b[1] - a[1]); e2 = V(pt[0] - pb[0], yt - yb, pt[1] - pb[1])
        nrm = np.cross(e1, e2); nrm /= np.linalg.norm(nrm)
        if np.dot(nrm, V(pb[0] - XC, 0, pb[1] - 0.0)) < 0:
            nrm = -nrm
        return V(p[0], y, p[1]), nrm, e1 / np.linalg.norm(e1), e2 / np.linalg.norm(e2)
    # identify crown facets: front (both z at 0.649), left/right chamfers, sides
    def facet_kind(i):
        d, c = T[i], T[(i + 1) % n]
        if abs(d[1] - 0.60) < 1e-6 and abs(c[1] - 0.60) < 1e-6:
            return 'front'
        if abs(d[1] + 0.649) < 1e-6 and abs(c[1] + 0.649) < 1e-6:
            return 'back'
        if abs(d[0] - c[0]) < 1e-6:
            return 'side'
        return 'chamfer'
    for i in range(n):
        kind = facet_kind(i)
        if kind == 'front':
            for s_ in (0.5 - 0.175 / 0.53, 0.5, 0.5 + 0.175 / 0.53):
                p, nrm, _, _ = fascia_point(i, s_, 0.80)
                lamp(dome, base, p, nrm)
            p, nrm, e1, e2 = fascia_point(i, 0.5, 0.38)
            if np.dot(e1, X3) < 0:
                e1 = -e1
            decal(st, 'st_vs_hammer', *frame_on(p, e1, e2, 0.42, 0.167), nrm)
        elif kind == 'chamfer':
            for s_ in (0.2, 0.5, 0.8):
                p, nrm, _, _ = fascia_point(i, s_, 0.78)
                lamp(dome, base, p, nrm)
            p, nrm, e1, e2 = fascia_point(i, 0.5, 0.36)
            if np.dot(e1, X3) < 0:
                e1 = -e1
            left = p[0] < XC
            decal(st, 'st_boxer' if left else 'st_kicker', *frame_on(p, e1, e2, 0.16, 0.16), nrm)
        elif kind == 'side':
            d, c = T[i], T[(i + 1) % n]
            for zz in np.linspace(-0.55, 0.40, 8):
                s_ = (zz - d[1]) / (c[1] - d[1])
                if 0.02 < s_ < 0.98:
                    p, nrm, _, _ = fascia_point(i, s_, 0.62)
                    lamp(dome, base, p, nrm)
    return nodes


# ------------------------------------------------------------------------------------------ kicker
def build_kicker(dome, base, st):
    nodes = []
    k = Mesh('K01_kicker_cabinet', smooth_angle=30)
    x0, x1 = CX0, D['col_x1_low']
    y0, y1, yb = PT, D['kick_top'], D['kick_back_top']
    ox0, oy0, ox1, oy1 = D['recess_out']
    ix0, iy0, ix1, iy1 = D['recess_in']
    zb = KZ - D['recess_depth']
    F = lambda x, y: V(x, y, KZ)
    # front face around the opening
    quadfill(k, 'BODY_PAINT', F(x0, y0), F(x1, y0), F(x1, oy0), F(x0, oy0), Z3)
    quadfill(k, 'BODY_PAINT', F(x0, oy1), F(x1, oy1), F(x1, y1), F(x0, y1), Z3)
    quadfill(k, 'BODY_PAINT', F(x0, oy0), F(ox0, oy0), F(ox0, oy1), F(x0, oy1), Z3)
    quadfill(k, 'BODY_PAINT', F(ox1, oy0), F(x1, oy0), F(x1, oy1), F(ox1, oy1), Z3)
    # sloped top (smash panel) and sides
    quadfill(k, 'BODY_PAINT', F(x0, y1), F(x1, y1), V(x1, yb, CZ1), V(x0, yb, CZ1), [0, 1, 0.6])
    for xs, nn in ((x0, -X3), (x1, X3)):
        poly(k, 'BODY_PAINT', [V(xs, y0, KZ), V(xs, y1, KZ), V(xs, yb, CZ1), V(xs, y0, CZ1)], nn)
    # recess: tapered walls (top, left and floor slope inwards; the right wall is straight)
    O = [V(ox0, oy0, KZ), V(ox1, oy0, KZ), V(ox1, oy1, KZ), V(ox0, oy1, KZ)]
    I = [V(ix0, iy0, zb), V(ix1, iy0, zb), V(ix1, iy1, zb), V(ix0, iy1, zb)]
    cen = V((ix0 + ix1) / 2, (iy0 + iy1) / 2, KZ)
    for a in range(4):
        b = (a + 1) % 4
        mid = (O[a] + O[b] + I[a] + I[b]) / 4
        quadfill(k, 'BODY_PAINT', O[a], O[b], I[b], I[a], cen - mid)
    quadfill(k, 'BODY_PAINT', I[0], I[1], I[2], I[3], Z3)
    nodes.append(('K01_kicker_cabinet', 'KICKER', k))
    # printed face (stickers + 3in1 + comet) and the comet on the recess floor
    u0, v0, u1, v1 = atlas_uv('kicker_face')
    def fuv(x, y):
        return (u0 + (x - x0) / (x1 - x0) * (u1 - u0), v0 + (y1 - y) / (y1 - y0) * (v1 - v0))
    for (xa, ya, xb, yb_) in ((x0, y0, x1, oy0), (x0, oy1, x1, y1), (x0, oy0, ox0, oy1), (ox1, oy0, x1, oy1)):
        pts = [V(xa, ya, KZ + 0.0012), V(xb, ya, KZ + 0.0012), V(xb, yb_, KZ + 0.0012), V(xa, yb_, KZ + 0.0012)]
        poly(st, 'DECALS', pts, Z3, [fuv(p[0], p[1]) for p in pts])
    fl0, fl1 = O[0], O[1]; bl0, bl1 = I[0], I[1]
    def floor_pt(s, t):
        a = fl0 + (fl1 - fl0) * s; b = bl0 + (bl1 - bl0) * s
        return a + (b - a) * t
    nf = np.cross(fl1 - fl0, bl0 - fl0); nf = nf / np.linalg.norm(nf); nf = nf if nf[1] > 0 else -nf
    decal(st, 'kicker_floor', floor_pt(0.20, 0.82), floor_pt(0.86, 0.82), floor_pt(0.86, 0.12), floor_pt(0.20, 0.12), nf)
    # smash panel on the sloped top
    sp0, sp1 = -0.565, 0.11
    tl, tr = V(sp0, yb - 0.004, CZ1 + 0.008), V(sp1, yb - 0.004, CZ1 + 0.008)
    br, bl = V(sp1, y1 + 0.003, KZ - 0.006), V(sp0, y1 + 0.003, KZ - 0.006)
    decal(st, 'smash', tl, tr, br, bl, [0, 1, 0.6])
    # lamps (n06): 6 across the top, 3 down each side of the opening
    for x in (-0.555, -0.454, -0.319, -0.169, -0.015, 0.174):
        lamp(dome, base, V(x, 0.608, KZ), Z3)
    for y in (0.509, 0.382, 0.249):
        lamp(dome, base, V(-0.566, y, KZ), Z3)
    for y in (0.473, 0.323, 0.176):
        lamp(dome, base, V(0.174, y, KZ), Z3)

    # ---- kick mechanism: ball, sleeve, bracket, mount plate, stop block
    bc = V(-0.466, 0.358, -0.149); br_ = 0.10
    nodes += kicker_ball(bc, br_)
    sl = Mesh('K03_kicker_arm_sleeve', smooth_angle=60)
    xa, xb = bc[0] + br_ - 0.012, -0.012
    L = xb - xa
    prof = [(0.0, 0.0), (0.05, 0.0)] + [(0.062, t * L) for t in np.linspace(0.02, 0.98, 30)] + [(0.05, L), (0.0, L)]
    def wr(a, y, r):
        if r < 0.06:
            return r
        u = y / L
        return r * (1 + 0.07 * math.sin(7 * a + 9 * u) * math.sin(math.pi * u * 5) + 0.03 * math.cos(3 * a - 14 * u))
    M = look_basis(V(xa, bc[1], bc[2]), X3) @ mat_rot('x', 90)
    P, UV = lathe(prof, 36, M=M, radial_fn=wr)
    sl.add('LEATHER_BLACK', P, UV)
    cyl(sl, 'BLACK_PLASTIC', V(xa - 0.02, bc[1], bc[2]), V(xa + 0.004, bc[1], bc[2]), 0.034, 20)
    nodes.append(('K03_kicker_arm_sleeve', 'KICKER', sl))
    mt = Mesh('K04_kicker_mount', smooth_angle=30)
    box(mt, 'BLACK_PLASTIC', [-0.016, 0.292, -0.206], [0.024, 0.418, -0.096], 0.006, seg=2)
    box(mt, 'BLACK_PLASTIC', [0.0, 0.286, KZ - 0.002], [0.086, 0.412, KZ + 0.024], 0.004, seg=2)
    for sx in (0.068, 0.078):
        for sy in (0.300, 0.398):
            P, UV = lathe([(0, 0), (0.005, 0), (0.0045, 0.002), (0, 0.0025)], 10, M=look_basis(V(sx, sy, KZ + 0.024), Z3) @ mat_rot('x', 90))
            mt.add('METAL', P, UV)
    box(mt, 'BLACK_PLASTIC', [-0.378, 0.412, zb], [-0.228, 0.456, KZ - 0.06], 0.006, seg=2)     # stop block
    nodes.append(('K04_kicker_mount', 'KICKER', mt))
    return nodes


def kicker_ball(c, R):
    """Stitched football: truncated icosahedron projected on a sphere, each panel slightly puffed so
    the seams read as grooves.  Pentagons black, hexagons black/white (n06)."""
    ball = Mesh('K02_kicker_ball', smooth_angle=48)
    ph = (1 + 5 ** 0.5) / 2
    ico = []
    for a in (-1, 1):
        for b in (-ph, ph):
            ico += [(0, a, b), (a, b, 0), (b, 0, a)]
    ico = np.array(ico, float); ico /= np.linalg.norm(ico[0])
    d = np.linalg.norm(ico[:, None] - ico[None], axis=2)
    el = d[d > 1e-6].min()
    nb = [np.where(np.abs(d[i] - el) < 1e-3)[0] for i in range(12)]
    faces = []
    for i in range(12):
        for j in nb[i]:
            for k in nb[i]:
                if j < k and abs(d[j, k] - el) < 1e-3 and i < j:
                    faces.append((i, j, k))
    # orient: front of the ball (+Z) shows a black pentagon (n06)
    rot = look_basis(np.zeros(3), ico[0])[:3, :3].T
    polys = []
    for i in range(12):
        ring = [ico[i] + (ico[j] - ico[i]) / 3 for j in nb[i]]
        polys.append(('p', ring))
    for (i, j, k) in faces:
        A, Bv, C = ico[i], ico[j], ico[k]
        polys.append(('h', [A + (Bv - A) / 3, A + 2 * (Bv - A) / 3, Bv + (C - Bv) / 3, Bv + 2 * (C - Bv) / 3, C + (A - C) / 3, C + 2 * (A - C) / 3]))
    rng = np.random.RandomState(7)
    white = set(rng.choice(20, 8, replace=False).tolist())
    hi = 0
    for kind, ring in polys:
        ring = [rot @ p for p in ring]
        cen = np.mean(ring, 0)
        nrm = cen / np.linalg.norm(cen)
        # sort ring around the centre
        ref = ring[0] - cen; ref /= np.linalg.norm(ref); oth = np.cross(nrm, ref)
        ring = sorted(ring, key=lambda p: math.atan2(np.dot(p - cen, oth), np.dot(p - cen, ref)))
        mat = 'BALL_BLACK'
        if kind == 'h':
            if hi in white:
                mat = 'BALL_WHITE'
            hi += 1
        rings = 4
        G = []
        for r_ in range(rings + 1):
            t = r_ / rings
            row = []
            for p in ring + [ring[0]]:
                q = cen + (p - cen) * t
                q = q / np.linalg.norm(q)
                puff = 1.0 - 0.045 * (t ** 3)
                row.append(c + q * R * puff)
            G.append(row)
        for r_ in range(rings):
            for m in range(len(ring)):
                a, b = G[r_][m], G[r_][m + 1]; cc, dd = G[r_ + 1][m + 1], G[r_ + 1][m]
                tri = np.array([[a, cc, b], [a, dd, cc]]) if r_ > 0 else np.array([[a, cc, dd]])
                Pp, UVp = orient_with_uv(tri, np.zeros(tri.shape[:2] + (2,)), lambda q: q - c, per_triangle=True)
                ball.add(mat, Pp, UVp + np.array([0.0, 0.0]) + (Pp[..., :2] - c[:2]) * 6)
    return [('K02_kicker_ball', 'KICKER', ball)]


# ------------------------------------------------------------------------------------------ hammer station
def chamfer_box(mesh, mat, x0, x1, y0, y1, z0, z1, c, normal_ref=None):
    """Box with the top-front and top-right edges chamfered (hammer station, n03)."""
    A = V(x1 - c, y1, z1 - c); Bp = V(x1, y1 - c, z1)
    quadfill(mesh, mat, V(x0, y1, z0), V(x1 - c, y1, z0), V(x1 - c, y1, z1 - c), V(x0, y1, z1 - c), Y3)            # top
    poly(mesh, mat, [V(x0, y1 - c, z1), Bp, A, V(x0, y1, z1 - c)], [0, 1, 1])                                       # front chamfer
    poly(mesh, mat, [V(x1, y1 - c, z0), Bp, A, V(x1 - c, y1, z0)], [1, 1, 0])                                       # right chamfer
    quadfill(mesh, mat, V(x0, y0, z1), V(x1, y0, z1), V(x1, y1 - c, z1), V(x0, y1 - c, z1), Z3)                    # front
    quadfill(mesh, mat, V(x1, y0, z0), V(x1, y0, z1), V(x1, y1 - c, z1), V(x1, y1 - c, z0), X3)                    # right
    poly(mesh, mat, [V(x0, y0, z0), V(x0, y0, z1), V(x0, y1 - c, z1), V(x0, y1, z1 - c), V(x0, y1, z0)], -X3)      # left
    quadfill(mesh, mat, V(x0, y0, z0), V(x1, y0, z0), V(x1, y1 - c, z0), V(x0, y1, z0), -Z3)                       # back (hidden)


def build_hammer(dome, base, st):
    nodes = []
    hb = Mesh('H01_hammer_base', smooth_angle=30)
    lx0, lx1, lz0, lz1, ly = D['ham_left']
    rx0, rx1, rz0, rz1, ry = D['ham_box']
    chamfer_box(hb, 'BODY_PAINT', lx0, lx1, PT, ly, lz0, lz1, 0.03)
    chamfer_box(hb, 'BODY_PAINT', rx0, rx1, PT, ry, rz0, rz1, 0.045)
    nodes.append(('H01_hammer_base', 'HAMMER', hb))
    # prints: emblem panel (left front), 3in1 + comet (box front), comet (box right side),
    # START HAMMER and the round start-button sticker on the top of the left part
    decal(st, 'emblem_panel', V(lx0 + 0.012, ly - 0.05, lz1), V(lx1 - 0.012, ly - 0.05, lz1), V(lx1 - 0.012, PT + 0.03, lz1), V(lx0 + 0.012, PT + 0.03, lz1), Z3)
    decal(st, 'st_hammer_front', V(rx0 + 0.025, ry - 0.07, rz1), V(rx1 - 0.025, ry - 0.07, rz1), V(rx1 - 0.025, PT + 0.04, rz1), V(rx0 + 0.025, PT + 0.04, rz1), Z3)
    decal(st, 'st_comet', V(rx1, 0.47, rz1 - 0.05), V(rx1, 0.47, rz0 + 0.07), V(rx1, 0.15, rz0 + 0.07), V(rx1, 0.15, rz1 - 0.05), X3)
    yt = ly
    decal(st, 'st_start_hammer', V(lx0 + 0.008, yt, lz0 + 0.03), V(lx1 - 0.004, yt, lz0 + 0.03), V(lx1 - 0.004, yt, lz0 + 0.155), V(lx0 + 0.008, yt, lz0 + 0.155), Y3)
    bcen = V((lx0 + lx1) / 2 - 0.02, yt, lz1 - 0.065)
    decal(st, 'st_hammer_button', *frame_on(bcen, X3, -Z3, 0.075, 0.075), Y3)
    btn = Mesh('H07_start_hammer_button', smooth_angle=35)
    P, UV = lathe([(0.0, 0.0), (0.017, 0.0), (0.017, 0.003), (0.0125, 0.0047), (0.0, 0.0047)], 24, M=look_basis(bcen, Y3) @ mat_rot('x', 90))
    btn.add('METAL', P, UV)
    nodes.append(('H07_start_hammer_button', 'HAMMER', btn))
    # lamps along the chamfers of the box (n03): 3 on the front, 3 on the right
    c = 0.045
    n_f = V(0, 1, 1) / math.sqrt(2); n_r = V(1, 1, 0) / math.sqrt(2)
    for x in (0.47, 0.55, 0.63):
        lamp(dome, base, V(x, ry - c / 2, rz1 - c / 2), n_f)
    for z in (-0.44, -0.33, -0.22):
        lamp(dome, base, V(rx1 - c / 2, ry - c / 2, z), n_r)
    # strike pad on bellows
    px, pz, pr = D['pad']
    bl = Mesh('H03_bellows', smooth_angle=55)
    prof = [(0.0, ry), (0.13, ry), (0.13, ry + 0.008)]
    yb0, yb1 = ry + 0.008, D['pad_y'][0]
    for t in np.linspace(0, 1, 51):
        rr = 0.098 + 0.022 * (0.5 + 0.5 * math.cos(t * 5 * 2 * math.pi))
        prof.append((rr, yb0 + (yb1 - yb0) * t))
    prof.append((0.0, yb1))
    P, UV = lathe(prof, 40, M=mat_translate(px, 0, pz))
    bl.add('RUBBER', P, UV)
    nodes.append(('H03_bellows', 'HAMMER', bl))
    pd = Mesh('H02_strike_pad', smooth_angle=45)
    y0p, y1p = D['pad_y']
    prof = [(0.0, y0p), (pr - 0.006, y0p), (pr, y0p + 0.006), (pr, y1p - 0.006), (pr - 0.006, y1p), (0.0, y1p)]
    P, UV = lathe(prof, 56, M=mat_translate(px, 0, pz))
    pd.add('PAD_RUBBER', P, UV)
    nodes.append(('H02_strike_pad', 'HAMMER', pd))
    # hammer: red cylindrical head with studded ends lying on the pad, black handle leaning back
    hc = V(*D['head_c']); hr, hl = D['head_r'], D['head_len']
    ax = V(math.cos(math.radians(28)), 0, math.sin(math.radians(28)))
    hd = Mesh('H04_hammer_head', smooth_angle=40)
    p0 = hc - ax * hl / 2
    M = look_basis(p0, ax) @ mat_rot('x', 90)
    prof = [(0.0, -0.002), (hr * 0.82, -0.002), (hr - 0.004, 0.0), (hr, 0.006), (hr, hl - 0.006), (hr - 0.004, hl), (hr * 0.82, hl + 0.002), (0.0, hl + 0.002)]
    P, UV = lathe(prof, 40, M=M)
    hd.add('HAMMER_RED', P, UV)
    for end, sgn in ((p0 - ax * 0.002, -1), (p0 + ax * (hl + 0.002), 1)):
        nrm = ax * sgn
        Bm = look_basis(end, nrm)
        for ring_r, cnt in ((0.046, 14), (0.024, 6)):
            for kk in range(cnt):
                a = 2 * math.pi * kk / cnt
                q = apply(Bm, np.array([[ring_r * math.cos(a), ring_r * math.sin(a), 0.0]]))[0]
                P, UV = lathe([(0.0068, 0.0), (0.0066, 0.002), (0.0045, 0.0055), (0.0, 0.0068)], 10, M=look_basis(q, nrm) @ mat_rot('x', 90))
                hd.add('HAMMER_RED', P, UV)
    nodes.append(('H04_hammer_head', 'HAMMER', hd))
    hn = Mesh('H05_hammer_handle', smooth_angle=50)
    hdir = V(-0.10, 1.0, -0.32); hdir /= np.linalg.norm(hdir)
    h0 = hc + V(0, hr - 0.01, 0)
    cyl(hn, 'BLACK_PLASTIC', hc + V(0, hr - 0.025, 0), hc + V(0, hr + 0.014, 0), 0.031, 20)
    h1 = h0 + hdir * 0.24
    cyl(hn, 'BLACK_PLASTIC', h0, h1, 0.020, 18, caps=False)
    h2 = h1 + hdir * 0.17
    cyl(hn, 'GRIP_BLACK', h1, h2, 0.0235, 18)
    nodes.append(('H05_hammer_handle', 'HAMMER', hn))
    # safety cable: from the handle down to an eye bolt on the box front (n03, n14)
    cb = Mesh('H06_safety_cable', smooth_angle=70)
    eye = V(0.655, 0.115, rz1)
    a = h0 + hdir * 0.08
    pts = []
    for t in np.linspace(0, 1, 26):
        p = a + (eye - a) * t
        p = p + V(0.03, -0.06, 0.02) * math.sin(math.pi * t)
        pts.append(p)
    for pa, pb in zip(pts[:-1], pts[1:]):
        cyl(cb, 'METAL', pa, pb, 0.0016, 6, caps=False)
    P, UV = lathe([(0.009, -0.002), (0.012, 0.0), (0.009, 0.002), (0.006, 0.0), (0.009, -0.002)], 18,
                  M=look_basis(eye + V(0, 0, 0.012), X3) @ mat_rot('x', 90))
    cb.add('METAL', P, UV)
    cyl(cb, 'METAL', eye, eye + V(0, 0, 0.006), 0.007, 12)
    nodes.append(('H06_safety_cable', 'HAMMER', cb))
    return nodes


# ------------------------------------------------------------------------------------------ tower
def build_tower(dome, base, st):
    nodes = []
    tw = Mesh('T01_tower_body', smooth_angle=25)
    tz0, tz1 = D['tower_z']
    ytop = D['tower_top']
    ys = [PT, 0.58, 0.69, 1.81, 1.90, ytop]
    # front (graphic underneath), right side (black), back (black), top (black)
    for ya, yb in zip(ys[:-1], ys[1:]):
        quadfill(tw, 'BODY_PAINT', V(col_xr(ya), ya, tz1), V(tower_xr(ya), ya, tz1), V(tower_xr(yb), yb, tz1), V(col_xr(yb), yb, tz1), Z3)
        n_r = V(1, (tower_xr(ya) - tower_xr(yb)) / (yb - ya), 0)
        quadfill(tw, 'BLACK_STEEL', V(tower_xr(ya), ya, tz0), V(tower_xr(ya), ya, tz1), V(tower_xr(yb), yb, tz1), V(tower_xr(yb), yb, tz0), n_r)
        quadfill(tw, 'BLACK_STEEL', V(col_xr(ya), ya, tz0), V(tower_xr(ya), ya, tz0), V(tower_xr(yb), yb, tz0), V(col_xr(yb), yb, tz0), -Z3)
        quadfill(tw, 'BLACK_STEEL', V(col_xr(ya), ya, tz0), V(col_xr(ya), ya, tz1), V(col_xr(yb), yb, tz1), V(col_xr(yb), yb, tz0), -X3)
    quadfill(tw, 'BLACK_STEEL', V(col_xr(ytop), ytop, tz0), V(tower_xr(ytop), ytop, tz0), V(tower_xr(ytop), ytop, tz1), V(col_xr(ytop), ytop, tz1), Y3)
    nodes.append(('T01_tower_body', 'TOWER', tw))
    # front print (zone 'tower')
    G = TEXMETA['tower']
    tg = Mesh('G05_tower_graphic', smooth_angle=10)
    yy = np.linspace(PT, 1.90, 24)
    quadfill(tg, 'BLACK_STEEL', V(col_xr(1.90), 1.90, tz1 + 0.0012), V(tower_xr(1.90), 1.90, tz1 + 0.0012),
             V(tower_xr(ytop), ytop, tz1 + 0.0012), V(col_xr(ytop), ytop, tz1 + 0.0012), Z3)
    for ya, yb in zip(yy[:-1], yy[1:]):
        pts = [V(col_xr(ya), ya, tz1 + 0.0012), V(tower_xr(ya) - 0.018, ya, tz1 + 0.0012), V(tower_xr(yb) - 0.018, yb, tz1 + 0.0012), V(col_xr(yb), yb, tz1 + 0.0012)]
        uv = [(0, (G['y'][1] - ya) / (G['y'][1] - G['y'][0])), (1, (G['y'][1] - ya) / (G['y'][1] - G['y'][0])),
              (1, (G['y'][1] - yb) / (G['y'][1] - G['y'][0])), (0, (G['y'][1] - yb) / (G['y'][1] - G['y'][0]))]
        poly(tg, 'GFX_TOWER', pts, Z3, uv)
    nodes.append(('G05_tower_graphic', 'GRAPHICS', tg))
    # black edge profiles: right edge and top
    pr = Mesh('T03_tower_profiles', smooth_angle=30)
    for ya, yb in zip(ys[:-1], ys[1:]):
        a0, a1 = tower_xr(ya), tower_xr(yb)
        quadfill(pr, 'BLACK_STEEL', V(a0 - 0.022, ya, tz1 + 0.004), V(a0 + 0.002, ya, tz1 + 0.004), V(a1 + 0.002, yb, tz1 + 0.004), V(a1 - 0.022, yb, tz1 + 0.004), Z3)
        quadfill(pr, 'BLACK_STEEL', V(a0 + 0.002, ya, tz1), V(a0 + 0.002, ya, tz1 + 0.004), V(a1 + 0.002, yb, tz1 + 0.004), V(a1 + 0.002, yb, tz1), X3)
    box(pr, 'BLACK_STEEL', [col_xr(ytop), ytop - 0.02, tz1 - 0.002], [tower_xr(ytop) + 0.002, ytop + 0.003, tz1 + 0.004], 0.0015)
    nodes.append(('T03_tower_profiles', 'TOWER', pr))
    # recessed LED meter strip
    mt = Mesh('T02_tower_meter', smooth_angle=30)
    mx0, mx1, my0, my1 = 0.327, 0.524, 0.68, 1.833
    box(mt, 'BLACK_PLASTIC', [mx0, my0, tz1], [mx1, my1, tz1 + 0.010], 0.003, seg=2)
    quadfill(mt, 'METER', V(mx0 + 0.010, my0 + 0.010, tz1 + 0.0105), V(mx1 - 0.010, my0 + 0.010, tz1 + 0.0105),
             V(mx1 - 0.010, my1 - 0.010, tz1 + 0.0105), V(mx0 + 0.010, my1 - 0.010, tz1 + 0.0105), Z3, [(0, 1), (1, 1), (1, 0), (0, 0)])
    nodes.append(('T02_tower_meter', 'TOWER', mt))
    # lamps: right column (13) + top row (3 more)
    def tx(u, y):
        return col_xr(y) + u * (tower_xr(y) - col_xr(y))
    for y in np.linspace(1.87, 0.69, 13):
        lamp(dome, base, V(tx(0.88, y), y, tz1), Z3)
    for u in (0.214, 0.43, 0.66):
        lamp(dome, base, V(tx(u, 1.87), 1.87, tz1), Z3)
    # back: lower red panel with a small service door; screws on the black panels
    rr = Mesh('R01_rear_panels', smooth_angle=30)
    quadfill(rr, 'BODY_PAINT', V(col_xr(PT), PT, tz0 - 0.002), V(0.70, PT, tz0 - 0.002), V(0.70, 0.45, tz0 - 0.002), V(col_xr(0.45), 0.45, tz0 - 0.002), -Z3)
    nodes.append(('R01_rear_panels', 'REAR', rr))
    sc = Mesh('R07_screws', smooth_angle=40)
    for x in (0.16, 0.40, 0.64):
        for y in np.linspace(0.6, 1.85, 6):
            if x > tower_xr(y) - 0.03:
                continue
            P, UV = lathe([(0, 0), (0.0045, 0), (0.004, 0.0012), (0, 0.0016)], 10, M=look_basis(V(x, y, tz0), -Z3) @ mat_rot('x', 90))
            sc.add('METAL', P, UV)
    for z in (tz0 + 0.025, tz1 - 0.025):
        for y in np.linspace(0.2, 1.8, 7):
            P, UV = lathe([(0, 0), (0.0045, 0), (0.004, 0.0012), (0, 0.0016)], 10, M=look_basis(V(tower_xr(y), y, z), X3) @ mat_rot('x', 90))
            sc.add('METAL', P, UV)
    nodes.append(('R07_screws', 'REAR', sc))
    return nodes


# ------------------------------------------------------------------------------------------ rear
def door(mesh, lk, x0, y0, x1, y1, z, lock_at):
    """Black steel service door on the rear face (raised leaf) with a round lock."""
    box(mesh, 'BLACK_STEEL', [x0, y0, z - 0.005], [x1, y1, z + 0.001], 0.002, seg=2)
    box(mesh, 'BLACK_STEEL', [x0 + 0.012, y0 + 0.012, z - 0.008], [x1 - 0.012, y1 - 0.012, z - 0.004], 0.002, seg=2)
    p = V(lock_at[0], lock_at[1], z - 0.008)
    P, UV = lathe([(0, 0), (0.011, 0), (0.011, 0.002), (0.0095, 0.0045), (0, 0.005)], 24, M=look_basis(p, -Z3) @ mat_rot('x', 90))
    lk.add('METAL', P, UV)
    box(lk, 'BLACK_PLASTIC', [p[0] - 0.001, p[1] - 0.005, p[2] - 0.0058], [p[0] + 0.001, p[1] + 0.005, p[2] - 0.0045], 0.0004)
    # key (n07/n08): short blade in the lock, bow hanging down, split ring with a second key
    zk = p[2] - 0.009
    box(lk, 'METAL', [p[0] - 0.0012, p[1] - 0.012, zk - 0.004], [p[0] + 0.0012, p[1] + 0.002, zk + 0.004], 0.0005)
    box(lk, 'METAL', [p[0] - 0.0045, p[1] - 0.034, zk - 0.0012], [p[0] + 0.0045, p[1] - 0.012, zk + 0.0012], 0.0012)
    P, UV = lathe([(0.0085, -0.0009), (0.0095, 0.0), (0.0085, 0.0009), (0.0075, 0.0), (0.0085, -0.0009)], 18,
                  M=look_basis(V(p[0], p[1] - 0.043, zk - 0.003), -X3) @ mat_rot('x', 90))
    lk.add('METAL', P, UV)
    box(lk, 'METAL', [p[0] - 0.004, p[1] - 0.078, zk - 0.004], [p[0] + 0.004, p[1] - 0.050, zk - 0.0016], 0.0012)


def build_rear():
    nodes = []
    dm = Mesh('R01_rear_doors', smooth_angle=30)
    lk = Mesh('R02_locks', smooth_angle=35)
    z = CZ0
    # rear layout from the rear views (n07/n08): tall upper door, small middle door, lower door
    door(dm, lk, -0.555, 1.09, 0.095, 2.00, z, (0.045, 1.50))
    door(dm, lk, -0.40, 0.64, -0.11, 0.95, z, (-0.15, 0.80))
    door(dm, lk, -0.33, 0.07, 0.10, 0.55, z, (0.06, 0.31))
    door(dm, lk, 0.24, 0.09, 0.55, 0.42, D['tower_z'][0] - 0.002, (0.28, 0.26))
    nodes.append(('R01_rear_doors', 'REAR', dm))
    nodes.append(('R02_locks', 'REAR', lk))
    rp = Mesh('R03_rating_plate', smooth_angle=30)
    box(rp, 'METAL', [0.0, 0.92, z - 0.0015], [0.075, 0.97, z + 0.001], 0.001)
    nodes.append(('R03_rating_plate', 'REAR', rp))
    # transport rollers at the top of the rear face + handle bar between them (n04, n10)
    ro = Mesh('R04_top_rollers', smooth_angle=40)
    for x, yr in ((-0.545, 1.985), (0.085, 1.90)):
        c = V(x, yr, z - 0.045)
        cyl(ro, 'ROLLER_WHITE', c - X3 * 0.016, c + X3 * 0.016, 0.036, 28)
        cyl(ro, 'METAL', c - X3 * 0.024, c + X3 * 0.024, 0.008, 12)
        for s_ in (-1, 1):
            box(ro, 'METAL', [x + s_ * 0.022 - 0.002, yr - 0.03, z - 0.055], [x + s_ * 0.022 + 0.002, yr + 0.045, z + 0.001], 0.001)
        box(ro, 'METAL', [x - 0.03, yr + 0.035, z - 0.012], [x + 0.03, yr + 0.065, z + 0.001], 0.002)
    # black tube: from the top of the hammer tower slab, across the column back, with one stand-off
    # bracket at its far end (n04/n08/n10 - it does not start at the rollers)
    tz0 = D['tower_z'][0]
    zb_ = z - 0.075
    cyl(ro, 'BLACK_STEEL', V(D['col_x1_top'] + 0.004, 2.035, zb_), V(-0.43, 2.035, zb_), 0.0125, 16)
    cyl(ro, 'BLACK_STEEL', V(-0.43, 2.035, zb_), V(-0.43, 2.035, z), 0.0125, 16)
    box(ro, 'BLACK_STEEL', [-0.455, 2.01, z - 0.004], [-0.405, 2.06, z + 0.001], 0.002)
    box(ro, 'BLACK_STEEL', [D['col_x1_top'] - 0.002, 2.005, zb_ - 0.03], [D['col_x1_top'] + 0.012, 2.065, zb_ + 0.03], 0.002)
    nodes.append(('R04_top_rollers', 'TRANSPORT_WHEELS', ro))
    # yellow castors under the rear corners of the base (n04, n08, n10)
    ca = Mesh('R05_castors', smooth_angle=40)
    for x, zc in ((-0.585, -0.655), (0.685, -0.73)):
        c = V(x, 0.026, zc)
        cyl(ca, 'TYRE_YELLOW', c - X3 * 0.011, c + X3 * 0.011, 0.026, 24)
        cyl(ca, 'METAL', c - X3 * 0.015, c + X3 * 0.015, 0.006, 10)
        for s in (-1, 1):
            box(ca, 'BLACK_STEEL', [x + s * 0.014 - 0.002, 0.02, zc - 0.015], [x + s * 0.014 + 0.002, 0.05, zc + 0.025], 0.001)
        box(ca, 'BLACK_STEEL', [x - 0.02, 0.045, zc - 0.017], [x + 0.02, 0.052, zc + 0.035], 0.001)
    nodes.append(('R05_castors', 'TRANSPORT_WHEELS', ca))
    return nodes


# ------------------------------------------------------------------------------------------ bag
def build_bag():
    """Punch bag LOWERED: black leather neck sleeve from the opening, flaring into a skirt over an
    egg-shaped ball of 4 gores (black front/back, red sides), n09 / n11."""
    nodes = []
    hx, hz = D['bag_hang']
    uy = D['under_y']
    ytop = uy + 0.04
    rx, ry, by = D['bag_rx'], D['bag_ry'], D['bag_c_y']
    yskirt = by + ry * 0.62
    mt = Mesh('D14_neck_mount', smooth_angle=40)
    box(mt, 'BLACK_PLASTIC', [hx - 0.05, uy + 0.01, hz - 0.035], [hx + 0.05, uy + 0.055, hz + 0.035], 0.006, seg=2)
    nodes.append(('D14_neck_mount', 'BAG_LOWERED', mt))
    nk = Mesh('D14_neck', smooth_angle=65)
    prof = []
    for yy in np.linspace(ytop, yskirt, 44):
        t = (ytop - yy) / (ytop - yskirt)
        r = 0.028 + 0.016 * t
        r += 0.005 * math.exp(-((t - 0.45) / 0.04) ** 2)
        if t > 0.72:
            u = (t - 0.72) / 0.28
            r += (0.088 - 0.044) * (u ** 1.5)
        prof.append((r, yy))
    prof += [(0.084, yskirt - 0.006), (0.072, yskirt - 0.004)]
    def wr(a, yy, rr):
        t = min(max((ytop - yy) / (ytop - yskirt), 0.0), 1.0)
        return rr * (1 + 0.04 * math.sin(a * 4 + 0.6) * max(0.0, t - 0.7) / 0.3) * (1 + 0.10 * math.cos(2 * a) * (1 - 0.5 * t))
    P, UV = lathe(prof, 48, M=mat_translate(hx, 0, hz), radial_fn=wr)
    nk.add('LEATHER_BLACK', P, UV)
    nodes.append(('D14_neck', 'BAG_LOWERED', nk))
    bg = Mesh('D13_bag', smooth_angle=50)
    for g in range(4):
        a0 = 2 * math.pi * g / 4 - math.pi / 4; a1 = a0 + math.pi / 2
        prof = []
        for ph in np.linspace(0.04, math.pi - 0.04, 34):
            prof.append((rx * math.sin(ph) * (1.0 + 0.05 * math.cos(ph)), by + ry * math.cos(ph)))
        def seam(a, yy, rr, a0=a0, a1=a1):
            d = min(abs(a - a0), abs(a - a1))
            return rr * (1 - 0.02 * math.exp(-(d / 0.035) ** 2))
        P, UV = lathe(prof, 14, M=mat_translate(hx, 0, hz), radial_fn=seam, a0=a0, a1=a1)
        bg.add('BOXING_BAG_BLACK' if g % 2 == 0 else 'BOXING_BAG_RED', P, UV)
    for ph_c in (0.04, math.pi - 0.04):
        y_ = by + ry * math.cos(ph_c); r_ = rx * math.sin(ph_c)
        Pc, UVc = disc(r_ * 1.01, 16, M=mat_translate(hx, y_, hz) @ mat_rot('x', -90 if ph_c < 1 else 90))
        bg.add('BOXING_BAG_BLACK', Pc, UVc)
    nodes.append(('D13_bag', 'BAG_LOWERED', bg))
    return nodes


# ------------------------------------------------------------------------------------------ assembly
class _NoLeds:
    count = 0


def build_all():
    dome = Mesh('L01_lamp_domes', smooth_angle=70)
    base = Mesh('L02_lamp_bases', smooth_angle=40)
    nodes = []
    nodes += build_platform()
    cn, st = build_column(dome, base)
    nodes += cn
    nodes += build_canopy(dome, base, st)
    nodes += build_kicker(dome, base, st)
    nodes += build_hammer(dome, base, st)
    nodes += build_tower(dome, base, st)
    nodes += build_rear()
    nodes += build_bag()
    nodes.append(('L01_lamp_domes', 'LAMPS', dome))
    nodes.append(('L02_lamp_bases', 'LAMPS', base))
    return nodes, {}


ROOT_NAME = 'ULTIMATE_MONSTER_3IN1'
GROUPS = ['BODY', 'CANOPY', 'BASE', 'FRONT_PANEL', 'KICKER', 'HAMMER', 'TOWER', 'BAG_LOWERED', 'REAR',
          'TRANSPORT_WHEELS', 'LAMPS', 'GRAPHICS', 'EMISSION']
ZONES = {
    'front': dict(label='FRONT PANEL', material='GFX_FRONT', meshes=['G01_front_graphic'], size=[0.70, 1.12]),
    'band': dict(label='CANOPY FRONT', material='GFX_BAND', meshes=['G02_band_graphic'], size=[0.714, 0.216]),
    'left': dict(label='LEFT SIDE', material='GFX_LEFT', meshes=['G03_left_graphic'], size=[0.922, 2.045]),
    'right': dict(label='RIGHT SIDE', material='GFX_RIGHT', meshes=['G04_right_graphic'], size=[0.922, 2.045]),
    'tower': dict(label='HAMMER TOWER', material='GFX_TOWER', meshes=['G05_tower_graphic'], size=[0.58, 1.845]),
}
_V = 'reference views (generated) - proportions, not measured'
META = {k: ('n02,n05,n06,n11,n12,n13', 'medium', _V, k[:3]) for k in (
    'B01_column_body', 'B02_canopy_band', 'B02_canopy_crown', 'B03_canopy_underside', 'K01_kicker_cabinet',
    'H01_hammer_base', 'T01_tower_body', 'D13_bag', 'D14_neck', 'K02_kicker_ball')}
PARAMS = {k: (v, 'from reference views') for k, v in D.items()}
