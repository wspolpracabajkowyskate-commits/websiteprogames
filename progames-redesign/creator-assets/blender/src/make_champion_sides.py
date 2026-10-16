"""
make_champion_sides.py - side graphics of the Boxer Champion rectified from the real photographs
(IMG_0508 = right side, almost orthographic; IMG_0516 = left side, 3/4 view).  The camera of each
photo was solved with solvePnP (iPhone 15 Pro, 24 mm eq., f = 3960 px at 4284 px width) against the
model dimensions; calib/*.json hold the result (825x1100 image space).
usage: python3 make_champion_sides.py <photo_dir> <out_dir>
"""
import json, numpy as np, cv2, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PHOTOS, OUT = sys.argv[1], sys.argv[2]
from champion_model import D
def proj(cam, P):
    R = np.array(cam['R']).reshape(3, 3); t = np.array(cam['t'])
    K = np.array([[cam['fx'], 0, cam['cx']], [0, cam['fy'], cam['cy']], [0, 0, 1]])
    X = (R @ np.array(P, float).T).T + t
    x = (K @ X.T).T
    return x[:, :2] / x[:, 2:3]
za, zb = D['col_z0'] + D['back_trim'], D['col_z1'] - D['side_red']
ya, yb = D['col_y0'] + 0.002, D['col_box_y1'] - 0.004
out_w, out_h = 512, int(round(512 * (yb - ya) / (zb - za)))
for name, photo, camf, sx in (('right', 'IMG_0508', '0508', 1), ('left', 'IMG_0516', '0516_0', -1)):
    cam = json.load(open(os.path.join(HERE, 'calib', f'{camf}.json')))
    img = cv2.imread(os.path.join(PHOTOS, f'{photo}.jpg'))
    s = img.shape[1] / cam['W']
    x = sx * D['col_x']
    # decal UV: u along the side from back->front as seen from outside? keep image orientation: left = front for +X side
    if sx > 0:   # viewed from +X: front (+z) is on the left
        corners3 = [[x, yb, zb], [x, yb, za], [x, ya, za], [x, ya, zb]]
    else:        # viewed from -X: back (-z) is on the left
        corners3 = [[x, yb, za], [x, yb, zb], [x, ya, zb], [x, ya, za]]
    src = proj(cam, corners3) * s
    dst = np.float32([[0, 0], [out_w, 0], [out_w, out_h], [0, out_h]])
    Hm = cv2.getPerspectiveTransform(np.float32(src), dst)
    warp = cv2.warpPerspective(img, Hm, (out_w, out_h), flags=cv2.INTER_LANCZOS4)
    cv2.imwrite(os.path.join(OUT, f'side_{name}.png'), warp)
    dbg = img.copy(); cv2.polylines(dbg, [np.int32(src)], True, (255, 255, 0), 8)
    cv2.imwrite(os.path.join(OUT, f'dbg_{name}.jpg'), cv2.resize(dbg, (825, 1100)))
    print(name, src.round(0).tolist(), out_w, out_h)
