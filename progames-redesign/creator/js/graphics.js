// Graphics zones: factory artwork <-> customer artwork composed on a canvas texture that is
// mapped through the zone mesh UVs (so it follows curved surfaces exactly).
import * as THREE from '/creator/vendor/three/three.module.min.js';

const MAX_SIDE = 2048;
const MAX_SIDE_WIDE = 4096;   // long thin zones (canopy band) get a wider canvas

export const DEFAULT_TRANSFORM = Object.freeze({ scale: 1, x: 0, y: 0, rotation: 0, mode: 'fit' });

export class ZoneGraphics {
  constructor(product, root, renderer) {
    this.zones = new Map();
    this.renderer = renderer;
    const byMat = new Map();
    root.traverse((o) => {
      if (!o.isMesh) return;
      const name = o.material?.name;
      if (!name) return;
      if (!byMat.has(name)) byMat.set(name, { material: o.material, meshes: [] });
      byMat.get(name).meshes.push(o);
    });
    for (const z of product.zones) {
      const hit = byMat.get(z.material);
      if (!hit) { console.warn('[creator] zone material missing in model:', z.material); continue; }
      const [w, h] = z.size;
      const side = Math.max(w, h) / Math.min(w, h) > 4 ? MAX_SIDE_WIDE : MAX_SIDE;
      const cw = w >= h ? side : Math.round(side * w / h);
      const ch = h > w ? side : Math.round(side * h / w);
      const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
      const tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const m = hit.material;
      m.transparent = true; m.depthWrite = false;
      m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
      for (const mesh of hit.meshes) { mesh.userData.zone = z.id; mesh.renderOrder = 2; }
      // highlight overlay (same geometry, flat translucent tint)
      const hl = new THREE.MeshBasicMaterial({ color: 0xff4b13, transparent: true, opacity: 0, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
      const overlays = hit.meshes.map((mesh) => {
        const ov = new THREE.Mesh(mesh.geometry, hl);
        ov.renderOrder = 3; ov.raycast = () => {};
        mesh.add(ov);
        return ov;
      });
      this.zones.set(z.id, { def: z, material: m, meshes: hit.meshes, factory: m.map, canvas, tex, image: null,
        transform: { ...DEFAULT_TRANSFORM }, state: 'factory', hl, overlays, flash: 0 });
    }
  }

  meshes() { return [...this.zones.values()].flatMap((z) => z.meshes); }

  zoneOf(object) {
    let o = object;
    while (o) { if (o.userData.zone) return o.userData.zone; o = o.parent; }
    return null;
  }

  restore(id) {
    const z = this.zones.get(id); if (!z) return;
    z.state = 'factory'; z.image = null;
    this._setMap(z, z.factory);
  }

  remove(id) {
    const z = this.zones.get(id); if (!z) return;
    z.state = 'none'; z.image = null;
    const ctx = z.canvas.getContext('2d'); ctx.clearRect(0, 0, z.canvas.width, z.canvas.height);
    z.tex.needsUpdate = true;
    this._setMap(z, z.tex);
  }

  setImage(id, img, transform) {
    const z = this.zones.get(id); if (!z) return;
    z.image = img; z.state = 'custom';
    z.transform = { ...DEFAULT_TRANSFORM, ...(transform || {}) };
    this.redraw(id);
    this._setMap(z, z.tex);
  }

  setTransform(id, transform) {
    const z = this.zones.get(id); if (!z) return;
    z.transform = { ...z.transform, ...transform };
    if (z.state === 'custom') this.redraw(id);
  }

  redraw(id) {
    const z = this.zones.get(id); if (!z || !z.image) return;
    const { canvas, image, transform: t } = z;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width, ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    const iw = image.naturalWidth || image.width || 1024, ih = image.naturalHeight || image.height || 1024;
    // fit: whole image visible; fill: cover the zone (crop); stretch: exactly the zone size
    const base = t.mode === 'fill' ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
    const dw = t.mode === 'stretch' ? cw * t.scale : iw * base * t.scale;
    const dh = t.mode === 'stretch' ? ch * t.scale : ih * base * t.scale;
    ctx.save();
    ctx.translate(cw / 2 + t.x * cw / 2, ch / 2 - t.y * ch / 2);
    ctx.rotate(t.rotation * Math.PI / 180);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    z.tex.needsUpdate = true;
  }

  _setMap(z, map) {
    if (z.material.map !== map) {
      z.material.map = map;
      z.material.needsUpdate = true;
    }
  }

  flash(id) {
    const z = this.zones.get(id); if (z) z.flash = 1;
  }

  hover(id) {
    for (const [zid, z] of this.zones) z.hover = zid === id;
  }

  tick(dt) {
    for (const z of this.zones.values()) {
      if (z.flash > 0) z.flash = Math.max(0, z.flash - dt * 0.9);
      const target = Math.max(z.flash * 0.45 * (0.6 + 0.4 * Math.sin(z.flash * 14)), z.hover ? 0.16 : 0);
      z.hl.opacity += (target - z.hl.opacity) * Math.min(1, dt * 12);
      z.overlays.forEach((o) => { o.visible = z.hl.opacity > 0.005; });
    }
  }
}

/** Load a File/Blob (PNG, JPG, WEBP, SVG) into a drawable image element. */
export function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // SVGs without intrinsic size: give them a sensible raster size
      if (!img.naturalWidth || !img.naturalHeight) { img.width = 2048; img.height = 2048; }
      resolve(img);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unsupported or damaged image file')); };
    img.src = url;
  });
}

/** Downscale very large uploads before storing them (keeps IndexedDB and GPU memory sane). */
export async function normalizeUpload(file) {
  if (file.type === 'image/svg+xml') return file; // keep vector source
  const img = await loadImage(file);
  const max = 3072;
  if (img.naturalWidth <= max && img.naturalHeight <= max) return file;
  const k = max / Math.max(img.naturalWidth, img.naturalHeight);
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise((res) => c.toBlob((b) => res(b || file), 'image/png'));
}
