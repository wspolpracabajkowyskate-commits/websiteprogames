"""make_tread_plate.py - aluminium 5-bar tread plate as measured on the Boxer Champion platform
(rectified top view from calibrated photos F01/F10, autocorrelation): groups of 5 lens-shaped bars
repeat every 59 mm along both plate edges; the two group orientations sit on a diagonal half-step
and their bars run at +45 / -45 degrees to the plate edges (= classic 5-bar laid at 45 deg).
One texture tile = 59 x 59 mm (UV scale 16.95 / m).
usage: python3 make_tread_plate.py <out_dir>"""
import sys, os, math, numpy as np, cv2
OUT = sys.argv[1]; N = 1024
T = 1.0                                   # tile in texture units
u, v = np.meshgrid((np.arange(N) + 0.5) / N, (np.arange(N) + 0.5) / N)
h = np.zeros((N, N), np.float32)
c = T / math.sqrt(2)                      # classic cell size (in tile units) = 41.7 mm
L, Wb, pitch = 0.28 * c, 0.048 * c, 0.13 * c
def group(cx, cy, ang):
    dx = (u - cx + 0.5) % 1.0 - 0.5; dy = (v - cy + 0.5) % 1.0 - 0.5
    ca, sa = math.cos(ang), math.sin(ang)
    a = dx * ca + dy * sa                  # along the bars
    b = -dx * sa + dy * ca                 # across the bars
    g = np.zeros_like(u)
    for k in range(-2, 3):
        bb = b - k * pitch
        prof = np.clip(1 - (a / L) ** 2, 0, 1)
        d = 1 - (bb / np.maximum(Wb * np.sqrt(prof), 1e-4)) ** 2
        g = np.maximum(g, np.clip(d, 0, 1) ** 0.55 * prof ** 0.35)
    return g
h = np.maximum(group(0.0, 0.0, math.radians(45)), group(0.5, 0.5, math.radians(-45)))
h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 1.2)
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * N / 40.0
gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * N / 40.0
n = np.dstack([-gx, gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
cv2.imwrite(os.path.join(OUT, 'tread_plate_normal.png'), cv2.cvtColor(((n * 0.5 + 0.5) * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
rng = np.random.RandomState(7)
noise = cv2.GaussianBlur(rng.rand(N, N).astype(np.float32), (0, 0), 3)
noise = (noise - noise.min()) / (noise.max() - noise.min())
streak = cv2.GaussianBlur(rng.rand(N, N).astype(np.float32), (0, 0), sigmaX=40, sigmaY=1.2)   # rolling marks
streak = (streak - streak.min()) / (streak.max() - streak.min())
rough = 0.26 + 0.08 * noise + 0.06 * streak - 0.12 * h      # bar tops polished
ao = 1.0 - 0.35 * np.clip(cv2.GaussianBlur(h, (0, 0), 4) - h, 0, 1) * 3
orm = np.dstack([np.clip(ao, 0, 1), np.clip(rough, 0.05, 1), np.ones_like(h)])
cv2.imwrite(os.path.join(OUT, 'tread_plate_orm.png'), cv2.cvtColor((orm * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))
print('ok')
