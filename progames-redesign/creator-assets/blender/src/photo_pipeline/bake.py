"""Projective texture baking from calibrated photos.
bake(points(H,W,3), normals(H,W,3), views=[(cam_json, image_path, gain)]) -> image, weights"""
import json, numpy as np, cv2

def load_view(camf, imgf):
    cam = json.load(open(camf)); img = cv2.imread(imgf, cv2.IMREAD_COLOR)
    s = img.shape[1] / cam['W']
    R = np.array(cam['R']).reshape(3, 3); t = np.array(cam['t'])
    K = np.array([[cam['fx'] * s, 0, cam['cx'] * s], [0, cam['fy'] * s, cam['cy'] * s], [0, 0, 1]])
    return dict(R=R, t=t, K=K, img=img, C=-R.T @ t)

def bake(P, N, views, sharp=6.0, border=0.03):
    H, W, _ = P.shape
    acc = np.zeros((H, W, 3), np.float64); wsum = np.zeros((H, W), np.float64)
    per = []
    for v in views:
        Xc = P.reshape(-1, 3) @ v['R'].T + v['t']
        z = Xc[:, 2]
        uv = (Xc @ v['K'].T)[:, :2] / np.maximum(z, 1e-6)[:, None]
        ih, iw = v['img'].shape[:2]
        d = v['C'][None, :] - P.reshape(-1, 3); dist = np.linalg.norm(d, axis=1); d /= dist[:, None]
        cosv = np.einsum('ij,ij->i', d, N.reshape(-1, 3))
        res = v['K'][0, 0] / dist * np.clip(cosv, 0, 1)        # texel footprint (px per m)
        mx = np.minimum.reduce([uv[:, 0], iw - 1 - uv[:, 0], uv[:, 1], ih - 1 - uv[:, 1]]) / (border * iw)
        frame = np.clip(mx, 0, 1)
        w = (res ** 2) * frame * (cosv > 0.15) * (z > 0) * v.get('gain', 1.0)
        mapx = uv[:, 0].reshape(H, W).astype(np.float32); mapy = uv[:, 1].reshape(H, W).astype(np.float32)
        smp = cv2.remap(v['img'], mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT).astype(np.float64)
        per.append((smp, w.reshape(H, W)))
    wmax = np.max([w for _, w in per], axis=0) + 1e-12
    for smp, w in per:
        ww = (w / wmax) ** sharp * (w > 0)
        acc += smp * ww[..., None]; wsum += ww
    out = acc / np.maximum(wsum, 1e-9)[..., None]
    return np.clip(out, 0, 255).astype(np.uint8), [w for _, w in per]
