"""make_tread_plate.py - procedural 5-bar aluminium tread plate (as on the Boxer Champion platform).
Tile = 2 x 2 cells, each cell holds 5 short raised bars; neighbouring cells are rotated 90 degrees.
usage: python3 make_tread_plate.py <out_dir>   (tile = 50 mm)"""
import sys, os, numpy as np, cv2
OUT = sys.argv[1]; N = 1024; cell = N // 2
h = np.zeros((N, N), np.float32)
yy, xx = np.mgrid[0:cell, 0:cell].astype(np.float32)
def bars(rot):
    g = np.zeros((cell, cell), np.float32)
    L = cell * 0.43; W = cell * 0.05
    for k in range(5):
        cx = cell * (0.5 + (k - 2) * 0.16); cy = cell * 0.5
        # lens-shaped bar: thickest in the middle, tapering to the ends
        u = (yy - cy) / L; v = (xx - cx) / W
        prof = np.clip(1 - u * u, 0, 1)
        d = 1 - (v / np.maximum(np.sqrt(prof), 1e-3)) ** 2
        g = np.maximum(g, np.clip(d, 0, 1) ** 0.6 * np.sqrt(prof))
    return g if not rot else g.T
h[:cell, :cell] = bars(False); h[cell:, cell:] = bars(False)
h[:cell, cell:] = bars(True); h[cell:, :cell] = bars(True)
h = cv2.GaussianBlur(h, (0, 0), 1.6)
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 2.0; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 2.0
s = 2.2
n = np.dstack([-gx * s, gy * s, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
nrm = ((n * 0.5 + 0.5) * 255).astype(np.uint8)
cv2.imwrite(os.path.join(OUT, 'tread_plate_normal.png'), cv2.cvtColor(nrm, cv2.COLOR_RGB2BGR))
rng = np.random.RandomState(3)
noise = cv2.GaussianBlur(rng.rand(N, N).astype(np.float32), (0, 0), 6)
noise = (noise - noise.min()) / (noise.max() - noise.min())
rough = 0.30 + 0.12 * noise - 0.10 * h          # bar tops polished by shoes
ao = 1.0 - 0.25 * np.clip(cv2.GaussianBlur(h, (0, 0), 5) - h, 0, 1) * 4
orm = np.dstack([ao, rough, np.ones_like(h)])   # R=AO, G=roughness, B=metallic
cv2.imwrite(os.path.join(OUT, 'tread_plate_orm.png'), cv2.cvtColor((np.clip(orm, 0, 1) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
print('ok')
