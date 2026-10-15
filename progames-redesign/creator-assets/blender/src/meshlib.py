"""
meshlib.py - small, dependency-free (numpy only) mesh construction toolkit used by
build_double_strike.py.  Runs both inside Blender (bpy ships numpy) and in plain Python.

Conventions (glTF): Y up, metres, machine front = +Z, machine right = +X.
UVs are stored in glTF convention (0,0 = top-left of the image).
"""
import math
import numpy as np


# ----------------------------------------------------------------------------
# Mesh container
# ----------------------------------------------------------------------------
class Mesh:
    """Triangle soup grouped by material.  Every triangle carries per-corner UV,
    optional per-corner colour and optional per-corner integer 'led' id."""

    def __init__(self, name, smooth_angle=35.0):
        self.name = name
        self.smooth_angle = smooth_angle
        self.groups = {}  # material -> dict(P=[], UV=[], C=[], L=[])

    def add(self, mat, P, UV=None, C=None, L=None):
        P = np.asarray(P, dtype=np.float64).reshape(-1, 3, 3)
        n = len(P)
        if n == 0:
            return
        if UV is None:
            UV = box_uv(P)
        UV = np.asarray(UV, dtype=np.float64).reshape(n, 3, 2)
        if C is None:
            C = np.ones((n, 3, 3))
        C = np.asarray(C, dtype=np.float64).reshape(n, 3, 3)
        if L is None:
            L = np.zeros((n, 3))
        L = np.asarray(L, dtype=np.float64).reshape(n, 3)
        g = self.groups.setdefault(mat, dict(P=[], UV=[], C=[], L=[]))
        g['P'].append(P); g['UV'].append(UV); g['C'].append(C); g['L'].append(L)

    def merge(self, other):
        for mat, g in other.groups.items():
            for P, UV, C, L in zip(g['P'], g['UV'], g['C'], g['L']):
                self.add(mat, P, UV, C, L)

    def transformed(self, M):
        out = Mesh(self.name, self.smooth_angle)
        for mat, g in self.groups.items():
            for P, UV, C, L in zip(g['P'], g['UV'], g['C'], g['L']):
                out.add(mat, apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3), UV, C, L)
        return out

    def tri_count(self):
        return sum(sum(len(p) for p in g['P']) for g in self.groups.values())

    # ------------------------------------------------------------------
    def finalize(self):
        """Weld, compute auto-smooth normals, de-duplicate corners.
        Returns dict(material -> dict(positions, normals, uvs, colors, leds, indices))
        and the welded topology (verts, loops) used by the Blender builder."""
        mats = list(self.groups.keys())
        P = []; UV = []; C = []; L = []; M = []
        for mi, m in enumerate(mats):
            g = self.groups[m]
            p = np.concatenate(g['P']); P.append(p)
            UV.append(np.concatenate(g['UV'])); C.append(np.concatenate(g['C'])); L.append(np.concatenate(g['L']))
            M.append(np.full(len(p), mi))
        P = np.concatenate(P); UV = np.concatenate(UV); C = np.concatenate(C); L = np.concatenate(L); M = np.concatenate(M)
        # drop degenerate triangles
        e1 = P[:, 1] - P[:, 0]; e2 = P[:, 2] - P[:, 0]
        fn = np.cross(e1, e2)
        area2 = np.linalg.norm(fn, axis=1)
        keep = area2 > 1e-12
        P, UV, C, L, M, fn, area2 = P[keep], UV[keep], C[keep], L[keep], M[keep], fn[keep], area2[keep]
        T = len(P)
        fnu = fn / area2[:, None]
        # weld positions
        flat = P.reshape(-1, 3)
        key = np.round(flat / 2e-5).astype(np.int64)
        _, vid, = np.unique(key, axis=0, return_inverse=True)[0:2]
        vid = vid.reshape(-1)
        nv = vid.max() + 1
        verts = np.zeros((nv, 3)); verts[vid] = flat
        F = vid.reshape(T, 3)
        ok = (F[:, 0] != F[:, 1]) & (F[:, 1] != F[:, 2]) & (F[:, 0] != F[:, 2])
        if not ok.all():
            P, UV, C, L, M, fn, area2, F = P[ok], UV[ok], C[ok], L[ok], M[ok], fn[ok], area2[ok], F[ok]
            fnu = fnu[ok]
            T = len(P)
        # corner angle weights
        def ang(a, b, c):
            u = b - a; v = c - a
            nu = np.linalg.norm(u, axis=1); nv_ = np.linalg.norm(v, axis=1)
            cosv = np.einsum('ij,ij->i', u, v) / np.maximum(nu * nv_, 1e-20)
            return np.arccos(np.clip(cosv, -1, 1))
        W = np.stack([ang(P[:, 0], P[:, 1], P[:, 2]), ang(P[:, 1], P[:, 2], P[:, 0]), ang(P[:, 2], P[:, 0], P[:, 1])], 1)
        cos_t = math.cos(math.radians(self.smooth_angle))
        # vertex -> incident corners
        corner_v = F.reshape(-1)
        order = np.argsort(corner_v, kind='stable')
        sv = corner_v[order]
        starts = np.searchsorted(sv, np.arange(nv)); ends = np.searchsorted(sv, np.arange(nv), side='right')
        N = np.zeros((T * 3, 3))
        Wf = W.reshape(-1)
        for v in range(nv):
            cs = order[starts[v]:ends[v]]
            if len(cs) == 0:
                continue
            fs = cs // 3
            fns = fnu[fs]
            w = Wf[cs][:, None] * fns
            dots = fns @ fns.T
            msk = dots > cos_t
            acc = msk.astype(np.float64) @ w
            nrm = np.linalg.norm(acc, axis=1, keepdims=True)
            acc = np.where(nrm > 1e-12, acc / np.maximum(nrm, 1e-12), fns)
            N[cs] = acc
        N = N.reshape(T, 3, 3)
        out = {}
        for mi, m in enumerate(mats):
            sel = M == mi
            if not sel.any():
                continue
            p = P[sel].reshape(-1, 3); n = N[sel].reshape(-1, 3); uv = UV[sel].reshape(-1, 2)
            c = C[sel].reshape(-1, 3); l = L[sel].reshape(-1)
            k = np.concatenate([np.round(p / 2e-5), np.round(n * 1000), np.round(uv * 1e5), np.round(c * 255), l[:, None]], 1).astype(np.int64)
            uk, first, inv = np.unique(k, axis=0, return_index=True, return_inverse=True)
            inv = inv.reshape(-1)
            out[m] = dict(positions=p[first].astype(np.float32), normals=n[first].astype(np.float32),
                          uvs=uv[first].astype(np.float32), colors=c[first].astype(np.float32),
                          leds=l[first].astype(np.float32), indices=inv.astype(np.uint32))
        topo = dict(verts=verts, faces=F, loop_normals=N, loop_uvs=UV, loop_colors=C, loop_leds=L,
                    face_mat=M, materials=mats)
        return out, topo


# ----------------------------------------------------------------------------
# Generic helpers
# ----------------------------------------------------------------------------
def apply(M, pts):
    pts = np.asarray(pts, dtype=np.float64)
    h = np.concatenate([pts, np.ones((len(pts), 1))], 1)
    return (h @ M.T)[:, :3]


def mat_translate(x, y, z):
    M = np.eye(4); M[:3, 3] = [x, y, z]; return M


def mat_scale(x, y=None, z=None):
    if y is None: y = x
    if z is None: z = x
    return np.diag([x, y, z, 1.0])


def mat_rot(axis, deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    M = np.eye(4)
    if axis == 'x': M[1:3, 1:3] = [[c, -s], [s, c]]
    elif axis == 'y': M[0, 0], M[0, 2], M[2, 0], M[2, 2] = c, s, -s, c
    else: M[0:2, 0:2] = [[c, -s], [s, c]]
    return M


def mat_basis(origin, X, Y, Z):
    """Matrix mapping local x,y,z -> origin + x*X + y*Y + z*Z"""
    M = np.eye(4)
    M[:3, 0] = X; M[:3, 1] = Y; M[:3, 2] = Z; M[:3, 3] = origin
    return M


def look_basis(origin, normal, up=(0, 1, 0)):
    """Basis whose local +Z points along `normal`, local +Y as close to `up` as possible."""
    n = np.asarray(normal, float); n = n / np.linalg.norm(n)
    u = np.asarray(up, float)
    if abs(np.dot(u, n)) > 0.98:
        u = np.array([0, 0, -1.0]) if abs(n[1]) > 0.9 else np.array([0, 1.0, 0])
    x = np.cross(u, n); x /= np.linalg.norm(x)
    y = np.cross(n, x)
    return mat_basis(origin, x, y, n)


def box_uv(P, scale=1.0):
    """Box-projection UVs (1 UV unit = 1 m / scale) chosen by dominant face normal."""
    fn = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
    ax = np.argmax(np.abs(fn), axis=1)
    UV = np.zeros(P.shape[:2] + (2,))
    for a, (i, j) in enumerate([(2, 1), (0, 2), (0, 1)]):
        s = ax == a
        UV[s, :, 0] = P[s][:, :, i] * scale
        UV[s, :, 1] = -P[s][:, :, j] * scale
    return UV


def grid_tris(V, UV=None, flip=False, cell_mask=None):
    """V: (nu, nv, 3) grid -> triangles. UV: (nu, nv, 2)."""
    nu, nv = V.shape[:2]
    tris = []; uvs = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            if cell_mask is not None and not cell_mask[i, j]:
                continue
            a, b, c, d = (i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)
            for t in ((a, b, c), (a, c, d)):
                if flip: t = (t[0], t[2], t[1])
                tris.append([V[x] for x in t])
                if UV is not None: uvs.append([UV[x] for x in t])
    P = np.array(tris).reshape(-1, 3, 3)
    U = np.array(uvs).reshape(-1, 3, 2) if UV is not None else None
    return P, U


def orient_tris(P, want_dir, per_triangle=False):
    """Orient triangles so normals follow want_dir (vector or callable(centroid)->vector).
    Default: one global decision (keeps the consistent winding of generated grids)."""
    P = P.copy()
    fn = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
    cen = P.mean(1)
    W = np.array([want_dir(c) for c in cen]) if callable(want_dir) else np.tile(np.asarray(want_dir, float), (len(P), 1))
    d = np.einsum('ij,ij->i', fn, W)
    if per_triangle:
        bad = d < 0
    else:
        bad = np.full(len(P), d.sum() < 0)
    P[bad] = P[bad][:, ::-1]
    return P, bad


def orient_volume(P, UV, ref):
    """Flip all triangles if the signed volume w.r.t. ref is negative (normals pointing inward)."""
    Q = P - np.asarray(ref, float)
    vol = np.einsum('ij,ij->i', Q[:, 0], np.cross(Q[:, 1], Q[:, 2])).sum()
    if vol < 0:
        P = P[:, ::-1].copy(); UV = UV[:, ::-1].copy()
    return P, UV


def orient_with_uv(P, UV, want_dir, per_triangle=False):
    P2, bad = orient_tris(P, want_dir, per_triangle)
    UV = UV.copy(); UV[bad] = UV[bad][:, ::-1]
    return P2, UV


# ----------------------------------------------------------------------------
# Rounded box with per-side radii and optional face holes
# ----------------------------------------------------------------------------
class RoundedBox:
    SIDES = ['-x', '+x', '-y', '+y', '-z', '+z']

    def __init__(self, lo, hi, r):
        self.lo = np.asarray(lo, float); self.hi = np.asarray(hi, float)
        self.rlo = np.array([max(r.get('-x', 0), 1e-4), max(r.get('-y', 0), 1e-4), max(r.get('-z', 0), 1e-4)])
        self.rhi = np.array([max(r.get('+x', 0), 1e-4), max(r.get('+y', 0), 1e-4), max(r.get('+z', 0), 1e-4)])

    def project(self, p):
        """Project point(s) lying on the base box surface onto the rounded surface.
        Returns positions, normals."""
        p = np.atleast_2d(np.asarray(p, float))
        ilo = self.lo + self.rlo; ihi = self.hi - self.rhi
        inner = np.clip(p, ilo, ihi)
        d = p - inner
        r = np.where(d < 0, self.rlo, self.rhi)
        u = d / r
        nu = np.linalg.norm(u, axis=1, keepdims=True)
        u = np.where(nu > 1e-12, u / np.maximum(nu, 1e-12), 0)
        pos = inner + u * r
        n = u / r
        n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
        return pos, n

    def surface_point(self, face, a, b, offset=0.0):
        """Point on face given in-plane coords (a,b) (see _face_axes). Returns pos, normal."""
        ax, ia, ib, val = self._face_axes(face)
        p = np.zeros(3); p[ax] = val; p[ia] = a; p[ib] = b
        pos, n = self.project(p)
        return pos[0] + n[0] * offset, n[0]

    def _face_axes(self, face):
        ax = 'xyz'.index(face[1]); sign = face[0]
        others = [i for i in range(3) if i != ax]
        val = self.hi[ax] if sign == '+' else self.lo[ax]
        return ax, others[0], others[1], val

    def axis_samples(self, axis, seg=8, step=0.1, extra=()):
        lo, hi = self.lo[axis], self.hi[axis]; rlo, rhi = self.rlo[axis], self.rhi[axis]
        n = max(seg // 2, 1)
        th = np.linspace(math.pi / 4, 0, n + 1)
        s_lo = lo + rlo * (1 - np.tan(th)) if rlo > 2e-4 else np.array([lo, lo + rlo])
        s_hi = hi - rhi * (1 - np.tan(th[::-1])) if rhi > 2e-4 else np.array([hi - rhi, hi])
        a, b = lo + rlo, hi - rhi
        m = max(int(math.ceil((b - a) / step)), 1)
        mid = np.linspace(a, b, m + 1)
        xs = np.concatenate([s_lo, mid, s_hi, np.asarray(extra, float)])
        xs = np.unique(np.round(xs, 7))
        return xs[(xs >= lo - 1e-9) & (xs <= hi + 1e-9)]

    def build(self, mesh, material, seg=8, step=0.1, holes=None, skip=(), extra=None, matfn=None, deform=None):
        holes = holes or {}
        extra = extra or {}
        for face in self.SIDES:
            if face in skip:
                continue
            ax, ia, ib, val = self._face_axes(face)
            sa = self.axis_samples(ia, seg, step, extra.get((face, ia), ()) )
            sb = self.axis_samples(ib, seg, step, extra.get((face, ib), ()) )
            A, B = np.meshgrid(sa, sb, indexing='ij')
            G = np.zeros(A.shape + (3,)); G[..., ax] = val; G[..., ia] = A; G[..., ib] = B
            mask = np.ones((len(sa) - 1, len(sb) - 1), bool)
            for (a0, a1, b0, b1) in holes.get(face, []):
                ca = 0.5 * (sa[:-1] + sa[1:]); cb = 0.5 * (sb[:-1] + sb[1:])
                CA, CB = np.meshgrid(ca, cb, indexing='ij')
                mask &= ~((CA > a0) & (CA < a1) & (CB > b0) & (CB < b1))
            pos, _ = self.project(G.reshape(-1, 3))
            pos = pos.reshape(G.shape)
            if deform is not None:
                pos = deform(pos.reshape(-1, 3)).reshape(G.shape)
            P, _ = grid_tris(pos, None, cell_mask=mask)
            outward = np.zeros(3); outward[ax] = 1 if face[0] == '+' else -1
            P, _ = orient_tris(P, outward)
            if matfn is None:
                mesh.add(material, P)
            else:
                cen = P.mean(1)
                fn = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
                fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
                mats = np.array([matfn(c, n, face) or material for c, n in zip(cen, fn)])
                for m in np.unique(mats):
                    mesh.add(str(m), P[mats == m])

    def decal_grid(self, face, a0, a1, b0, b1, offset=0.0015, na=24, nb=24, holes=(), deform=None, deform_normal=None):
        """Conforming decal patch on a face, (a,b) are the face's two in-plane axes in xyz order.
        UVs are oriented automatically so the image reads correctly for a viewer facing the surface.
        Returns P, UV (glTF uv)."""
        ax, ia, ib, val = self._face_axes(face)
        n0 = np.zeros(3); n0[ax] = 1 if face[0] == '+' else -1
        up = np.array([0, 1.0, 0])
        if ax == 1:
            up = np.array([0, 0, -1.0]) if face[0] == '+' else np.array([0, 0, 1.0])
        right = np.cross(up, n0)
        ea = np.zeros(3); ea[ia] = 1; eb = np.zeros(3); eb[ib] = 1
        u_is_a = abs(ea @ right) > abs(eb @ right)
        su = np.sign((ea if u_is_a else eb) @ right)
        sv = np.sign((eb if u_is_a else ea) @ up)
        sa = list(np.linspace(a0, a1, na + 1)); sb = list(np.linspace(b0, b1, nb + 1))
        for (h0, h1, k0, k1) in holes:
            sa += [h0, h1]; sb += [k0, k1]
        sa = np.unique(np.round(np.clip(sa, a0, a1), 7)); sb = np.unique(np.round(np.clip(sb, b0, b1), 7))
        A, B = np.meshgrid(sa, sb, indexing='ij')
        G = np.zeros(A.shape + (3,)); G[..., ax] = val; G[..., ia] = A; G[..., ib] = B
        pos, nrm = self.project(G.reshape(-1, 3))
        if deform is not None:
            pos = deform(pos)
            nrm = deform_normal(nrm) if deform_normal is not None else nrm
        pos = pos + nrm * offset
        pos = pos.reshape(G.shape)
        Ta = (A - a0) / (a1 - a0); Tb = (B - b0) / (b1 - b0)
        U, V = (Ta, Tb) if u_is_a else (Tb, Ta)
        if su < 0: U = 1 - U
        if sv < 0: V = 1 - V
        UVg = np.stack([U, 1 - V], -1)
        mask = np.ones((len(sa) - 1, len(sb) - 1), bool)
        ca = 0.5 * (sa[:-1] + sa[1:]); cb = 0.5 * (sb[:-1] + sb[1:])
        CA, CB = np.meshgrid(ca, cb, indexing='ij')
        for (h0, h1, k0, k1) in holes:
            mask &= ~((CA > h0) & (CA < h1) & (CB > k0) & (CB < k1))
        P, UV = grid_tris(pos, UVg, cell_mask=mask)
        outward = np.zeros(3); outward[ax] = 1 if face[0] == '+' else -1
        P, UV = orient_with_uv(P, UV, outward)
        return P, UV


# ----------------------------------------------------------------------------
# 2D contour utilities
# ----------------------------------------------------------------------------
def convex_hull(pts):
    pts = sorted(map(tuple, np.asarray(pts, float)))
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return np.array(lower[:-1] + upper[:-1])  # CCW


def fillet(poly, radius_fn, seg=8):
    """Round polygon corners. radius_fn(point)->radius (0 = keep)."""
    out = []
    n = len(poly)
    for i in range(n):
        p0, p1, p2 = poly[i - 1], poly[i], poly[(i + 1) % n]
        r = radius_fn(p1)
        if r <= 0:
            out.append(p1); continue
        d1 = p0 - p1; d2 = p2 - p1
        l1 = np.linalg.norm(d1); l2 = np.linalg.norm(d2)
        d1 /= l1; d2 /= l2
        ang = math.acos(np.clip(np.dot(d1, d2), -1, 1))
        if ang > math.pi - 1e-3:
            out.append(p1); continue
        t = r / math.tan(ang / 2)
        t = min(t, 0.45 * l1, 0.45 * l2)
        a = p1 + d1 * t; b = p1 + d2 * t
        bis = d1 + d2; bis /= np.linalg.norm(bis)
        # circle centre lies on the bisector at distance t / cos(half-angle)
        half = ang / 2
        rr = t * math.tan(half)
        c = p1 + bis * (t / math.cos(half))
        a0 = math.atan2(*(a - c)[::-1]); a1 = math.atan2(*(b - c)[::-1])
        da = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
        for k in range(seg + 1):
            aa = a0 + da * k / seg
            out.append(c + rr * np.array([math.cos(aa), math.sin(aa)]))
    return np.array(out)


def resample_closed(poly, n):
    poly = np.asarray(poly, float)
    P = np.vstack([poly, poly[:1]])
    seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    t = np.linspace(0, s[-1], n, endpoint=False)
    x = np.interp(t, s, P[:, 0]); y = np.interp(t, s, P[:, 1])
    return np.stack([x, y], 1)


def polygon_area(poly):
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)


def contour_normals(poly):
    """Outward normals for a closed CCW polygon (a,b) plane."""
    if polygon_area(poly) < 0:
        raise ValueError('expected CCW polygon')
    nxt = np.roll(poly, -1, 0); prv = np.roll(poly, 1, 0)
    t = nxt - prv
    t /= np.linalg.norm(t, axis=1, keepdims=True)
    return np.stack([t[:, 1], -t[:, 0]], 1)


def offset_contour(poly, d):
    return poly + contour_normals(poly) * d


def ccw(poly):
    return poly if polygon_area(poly) > 0 else poly[::-1].copy()


# ----------------------------------------------------------------------------
# Sweep a profile along a closed (or open) 2D contour placed in 3D
# ----------------------------------------------------------------------------
def sweep(contour, profile, U, V, W, origin=(0, 0, 0), hfunc=None, closed=True, uv_scale=1.0):
    """contour: (N,2) CCW in (U,V) plane.  profile: list of (offset, h) where offset is along the
    outward contour normal and h along W.  hfunc(a,b,h)->h allows tilting.  Returns P, UV."""
    U = np.asarray(U, float); V = np.asarray(V, float); W = np.asarray(W, float); O = np.asarray(origin, float)
    C = np.asarray(contour, float)
    Nn = contour_normals(C) if closed else _open_normals(C)
    prof = np.asarray(profile, float)
    nc = len(C); npf = len(prof)
    G = np.zeros((nc + (1 if closed else 0), npf, 3))
    UVg = np.zeros(G.shape[:2] + (2,))
    seglen = np.linalg.norm(np.diff(np.vstack([C, C[:1]]) if closed else C, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seglen)])
    plen = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(prof, axis=0), axis=1))])
    for i in range(G.shape[0]):
        ci = i % nc
        for j in range(npf):
            off, h = prof[j]
            a, b = C[ci] + Nn[ci] * off
            hh = hfunc(a, b, h) if hfunc else h
            G[i, j] = O + a * U + b * V + hh * W
            UVg[i, j] = [s[i] * uv_scale, plen[j] * uv_scale]
    P, UVt = grid_tris(G, UVg)
    return P, UVt, G


def _open_normals(C):
    t = np.gradient(C, axis=0)
    t /= np.linalg.norm(t, axis=1, keepdims=True)
    return np.stack([t[:, 1], -t[:, 0]], 1)


def cap(contour, U, V, W, origin=(0, 0, 0), h=0.0, hfunc=None, facing=+1, center=None, uv_scale=1.0):
    """Fan-triangulated cap of a star-shaped contour. facing=+1 -> normal along +W."""
    U = np.asarray(U, float); V = np.asarray(V, float); W = np.asarray(W, float); O = np.asarray(origin, float)
    C = np.asarray(contour, float)
    c = C.mean(0) if center is None else np.asarray(center, float)
    def to3(p):
        hh = hfunc(p[0], p[1], h) if hfunc else h
        return O + p[0] * U + p[1] * V + hh * W
    ctr = to3(c)
    tris = []; uvs = []
    n = len(C)
    for i in range(n):
        p, q = C[i], C[(i + 1) % n]
        tris.append([ctr, to3(p), to3(q)])
        uvs.append([c * uv_scale, p * uv_scale, q * uv_scale])
    P = np.array(tris); UV = np.array(uvs) * np.array([1, -1])
    P, UV = orient_with_uv(P, UV, W * facing)
    return P, UV


def ring_cap(outer, inner, U, V, W, origin=(0, 0, 0), h=0.0, hfunc=None, facing=+1, uv_scale=1.0):
    """Triangulate the ring between two contours with equal point counts."""
    U = np.asarray(U, float); V = np.asarray(V, float); W = np.asarray(W, float); O = np.asarray(origin, float)
    def to3(p):
        hh = hfunc(p[0], p[1], h) if hfunc else h
        return O + p[0] * U + p[1] * V + hh * W
    n = len(outer)
    tris = []; uvs = []
    for i in range(n):
        j = (i + 1) % n
        a, b, c, d = outer[i], outer[j], inner[j], inner[i]
        tris += [[to3(a), to3(b), to3(c)], [to3(a), to3(c), to3(d)]]
        uvs += [[a, b, c], [a, c, d]]
    P = np.array(tris); UV = np.array(uvs) * uv_scale * np.array([1, -1])
    P, UV = orient_with_uv(P, UV, W * facing)
    return P, UV


def ray_polygon(center, angles, poly):
    """Distance from center along each angle to the polygon boundary (max hit)."""
    P = np.asarray(poly, float); Q = np.roll(P, -1, 0)
    out = []
    for a in angles:
        d = np.array([math.cos(a), math.sin(a)])
        e = Q - P
        # solve center + t d = P + u e
        den = d[0] * e[:, 1] - d[1] * e[:, 0]
        w = P - center
        with np.errstate(divide='ignore', invalid='ignore'):
            t = (w[:, 0] * e[:, 1] - w[:, 1] * e[:, 0]) / den
            u = (w[:, 0] * d[1] - w[:, 1] * d[0]) / den
        ok = (np.abs(den) > 1e-12) & (u >= -1e-9) & (u <= 1 + 1e-9) & (t > 0)
        out.append(t[ok].max() if ok.any() else 0.0)
    return np.array(out)


# ----------------------------------------------------------------------------
# Lathe / revolve
# ----------------------------------------------------------------------------
def lathe(profile, segments=48, M=None, radial_fn=None, a0=0.0, a1=2 * math.pi, uv_mode='cyl'):
    """profile: list of (r, y). Revolve around +Y. radial_fn(angle, y, r)->r for displacement.
    Returns P, UV"""
    prof = np.asarray(profile, float)
    full = abs((a1 - a0) - 2 * math.pi) < 1e-9
    na = segments
    angs = np.linspace(a0, a1, na + 1)
    G = np.zeros((na + 1, len(prof), 3)); UVg = np.zeros((na + 1, len(prof), 2))
    plen = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(prof, axis=0), axis=1))])
    plen = plen / max(plen[-1], 1e-9)
    for i, a in enumerate(angs):
        for j, (r, y) in enumerate(prof):
            rr = radial_fn(a, y, r) if radial_fn else r
            G[i, j] = [rr * math.sin(a), y, rr * math.cos(a)]
            UVg[i, j] = [(a - a0) / (a1 - a0), plen[j]]
    P, UV = grid_tris(G, UVg)
    P, UV = orient_volume(P, UV, [0, float(prof[:, 1].mean()), 0])
    if M is not None:
        P = apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3)
    return P, UV


def uv_sphere(radius, nu=48, nv=24, M=None, squash=1.0):
    """UV sphere with equirectangular glTF UVs (u around, v from top)."""
    G = np.zeros((nu + 1, nv + 1, 3)); UVg = np.zeros((nu + 1, nv + 1, 2))
    for i in range(nu + 1):
        th = 2 * math.pi * i / nu
        for j in range(nv + 1):
            ph = math.pi * j / nv
            G[i, j] = [radius * math.sin(ph) * math.sin(th), radius * math.cos(ph) * squash, radius * math.sin(ph) * math.cos(th)]
            UVg[i, j] = [i / nu, j / nv]
    P, UV = grid_tris(G, UVg)
    P, UV = orient_volume(P, UV, [0, 0, 0])
    if M is not None:
        P = apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3)
    return P, UV


def box(lo, hi, M=None):
    rb = RoundedBox(lo, hi, {})
    m = Mesh('tmp')
    rb.build(m, 'x', seg=2, step=10)
    P = np.concatenate(m.groups['x']['P'])
    if M is not None:
        P = apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3)
    return P


def rounded_box_tris(lo, hi, r, seg=6, step=0.05, M=None):
    rb = RoundedBox(lo, hi, {k: r for k in RoundedBox.SIDES} if not isinstance(r, dict) else r)
    m = Mesh('tmp')
    rb.build(m, 'x', seg=seg, step=step)
    P = np.concatenate(m.groups['x']['P'])
    if M is not None:
        P = apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3)
    return P


def quad(origin, X, Y, w, h, nx=1, ny=1, M=None, flip_u=False):
    """Planar quad centred at origin spanning w along X and h along Y, facing X×Y. glTF UVs."""
    O = np.asarray(origin, float); X = np.asarray(X, float); Y = np.asarray(Y, float)
    us = np.linspace(0, 1, nx + 1); vs = np.linspace(0, 1, ny + 1)
    G = np.zeros((nx + 1, ny + 1, 3)); UVg = np.zeros((nx + 1, ny + 1, 2))
    for i, u in enumerate(us):
        for j, v in enumerate(vs):
            G[i, j] = O + (u - 0.5) * w * X + (v - 0.5) * h * Y
            UVg[i, j] = [1 - u if flip_u else u, 1 - v]
    P, UV = grid_tris(G, UVg)
    n = np.cross(X, Y)
    P, UV = orient_with_uv(P, UV, n)
    if M is not None:
        P = apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3)
    return P, UV


def disc(radius, n=32, M=None):
    """Disc in local XY plane facing +Z, glTF UVs."""
    tris = []; uvs = []
    for i in range(n):
        a0 = 2 * math.pi * i / n; a1 = 2 * math.pi * (i + 1) / n
        p0 = [0, 0, 0]; p1 = [radius * math.cos(a0), radius * math.sin(a0), 0]; p2 = [radius * math.cos(a1), radius * math.sin(a1), 0]
        tris.append([p0, p1, p2])
        uvs.append([[0.5, 0.5], [0.5 + 0.5 * math.cos(a0), 0.5 - 0.5 * math.sin(a0)], [0.5 + 0.5 * math.cos(a1), 0.5 - 0.5 * math.sin(a1)]])
    P = np.array(tris, float); UV = np.array(uvs, float)
    P, UV = orient_with_uv(P, UV, [0, 0, 1])
    if M is not None:
        P = apply(M, P.reshape(-1, 3)).reshape(-1, 3, 3)
    return P, UV
