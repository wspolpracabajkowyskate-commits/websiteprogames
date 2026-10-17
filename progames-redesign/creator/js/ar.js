// "View in your room" — augmented reality preview of the configured machine at real size.
//  • iPhone / iPad (Safari, Chrome, …): the current configuration is exported in the browser to USDZ
//    and opened in Apple AR Quick Look (no app, no upload — everything stays on the device).
//  • Android (Chrome + Google Play Services for AR): WebXR immersive-ar session in the page itself,
//    with floor detection (hit-test), tap to place, rotate and live LED effects.
//  • Desktop: QR code that opens the same machine and colour on a phone.
import * as THREE from '/creator/vendor/three/three.module.min.js';

const ua = navigator.userAgent;
export const IS_IOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_WKWEBVIEW = Boolean(window.webkit && window.webkit.messageHandlers);
export const QUICKLOOK = (() => {
  if (!IS_IOS) return false;
  if (IS_WKWEBVIEW) return /CriOS\/|EdgiOS\/|FxiOS\/|GSA\/|DuckDuckGo\//.test(ua);
  const a = document.createElement('a');
  return Boolean(a.relList && a.relList.supports && a.relList.supports('ar'));
})();
const IS_ANDROID = /Android/i.test(ua);
const IS_MOBILE = IS_IOS || IS_ANDROID || /Mobi/i.test(ua);

export async function detectAR() {
  if (QUICKLOOK) return 'quicklook';
  try {
    if (navigator.xr && window.isSecureContext && await navigator.xr.isSessionSupported('immersive-ar')) return 'webxr';
  } catch (e) { /* not supported */ }
  return IS_MOBILE ? 'unsupported' : 'qr';
}

export class ARView {
  /**
   * @param {object} o
   * @param {import('./studio.js').Studio} o.studio
   * @param {() => THREE.Object3D} o.getModel
   * @param {object} o.product
   * @param {() => object} o.getState
   * @param {(msg: string, ms?: number) => void} o.toast
   */
  constructor(o) {
    Object.assign(this, o);
    this.mode = null;
    this.active = false;
    this.usdz = null; // { key, url }
    this.busy = false;
  }

  async init(button) {
    this.button = button;
    this.mode = await detectAR();
    button.dataset.mode = this.mode;
    button.hidden = false;
    button.addEventListener('click', () => this.open());
    return this.mode;
  }

  open() {
    if (this.busy) return;
    if (this.mode === 'quicklook') return this.quickLook();
    if (this.mode === 'webxr') return this.startWebXR();
    return this.showModal(this.mode);
  }

  // ------------------------------------------------------------------ iOS: AR Quick Look
  configKey() {
    const s = this.getState();
    return JSON.stringify({ c: s.bodyColor, g: s.graphics, t: s.graphicsTransforms, o: s.options, v: this.product.id });
  }

  /** Export the configured model to a USDZ blob. LED materials (unlit in the viewer) become emissive PBR. */
  async exportUSDZ() {
    const { USDZExporter } = await import('/creator/vendor/three/addons/exporters/USDZExporter.js');
    const root = this.getModel();
    const swaps = [];
    const state = this.getState();
    const ledsOff = state.options.ledEffect === 'off';
    root.traverse((o) => {
      if (!o.isMesh || !o.material || o.material.isMeshStandardMaterial) return;
      const m = o.material;
      if (!/^LED/.test(m.name || '')) return;
      const avg = new THREE.Color(1, 1, 1);
      const col = o.geometry.getAttribute('color');
      if (col && m.name === 'LED_RGB') {
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < col.count; i++) { r += col.getX(i); g += col.getY(i); b += col.getZ(i); }
        const k = Math.max(r, g, b) || 1; avg.setRGB(r / k, g / k, b / k);
      }
      const std = new THREE.MeshStandardMaterial({
        name: m.name, color: 0x202020, roughness: 0.35, metalness: 0,
        emissive: ledsOff ? 0x000000 : (m.map ? 0xffffff : avg), emissiveMap: m.map || null, emissiveIntensity: 1,
      });
      swaps.push([o, m]); o.material = std;
    });
    // AR Quick Look sorts blended surfaces badly: the (almost clear) acrylic over the score shield hid the
    // print behind it. In the export the glass is left out and printed graphics / decals become alpha
    // cut-outs (opacityThreshold) instead of blended layers, so they always draw on top of the paint.
    const hidden = [], alpha = [];
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const m = o.material;
      if (m.name === 'GLASS') { hidden.push([o, o.parent]); return; }
      if (m.transparent && m.map && (/^GFX_/.test(m.name || '') || m.name === 'DECALS')) {
        alpha.push([m, m.transparent, m.alphaTest, m.depthWrite]);
        m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true;
      }
    });
    for (const [o, p] of hidden) p.remove(o);
    try {
      const exporter = new USDZExporter();
      const data = await exporter.parseAsync(root, { maxTextureSize: 2048, quickLookCompatible: true,
        ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } } });
      return new Blob([data], { type: 'model/vnd.usdz+zip' });
    } finally {
      for (const [o, m] of swaps) { o.material.dispose(); o.material = m; }
      for (const [o, p] of hidden) p.add(o);
      for (const [m, tr, at, dw] of alpha) { m.transparent = tr; m.alphaTest = at; m.depthWrite = dw; m.needsUpdate = true; }
    }
  }

  async quickLook() {
    const key = this.configKey();
    this.setBusy(true, 'Preparing AR…');
    try {
      if (!this.usdz || this.usdz.key !== key) {
        if (this.usdz) URL.revokeObjectURL(this.usdz.url);
        const t0 = performance.now();
        const blob = await this.exportUSDZ();
        this.usdz = { key, url: URL.createObjectURL(blob), size: blob.size };
        // Safari only opens Quick Look from a fresh tap: after a long export ask for one more tap
        if (performance.now() - t0 > 900) {
          this.setBusy(false);
          this.readyLabel(true);
          this.toast('AR model ready — tap “Open AR” to place it in your room', 4000);
          return;
        }
      }
      this.readyLabel(false);
      const a = document.createElement('a');
      a.setAttribute('rel', 'ar');
      a.appendChild(document.createElement('img')); // Safari only treats rel="ar" links containing an image as AR links
      a.href = `${this.usdz.url}#allowsContentScaling=0`; // keep the machine at its real size
      a.download = `progames-${this.product.id}.usdz`;
      a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => a.remove(), 1000);
    } catch (e) {
      console.error('[creator] AR export failed', e);
      this.toast('Could not prepare the AR model on this device.');
    } finally { this.setBusy(false); }
  }

  readyLabel(on) {
    this.ready = on;
    this.button.classList.toggle('cr-attn', on);
    this.button.classList.toggle('cr-ready', on);
    this.setBusy(this.busy);
  }

  setBusy(on, label) {
    this.busy = on;
    const b = this.button; if (!b) return;
    b.setAttribute('aria-busy', String(on));
    const t = b.querySelector('.cr-ar-label');
    if (t) t.textContent = on ? label : this.ready ? 'Open AR' : 'View in your room';
  }

  // ------------------------------------------------------------------ Android: WebXR
  async startWebXR() {
    const { studio } = this;
    const { renderer, scene } = studio;
    const overlay = document.getElementById('arOverlay');
    this.setBusy(true, 'Starting AR…');
    let session;
    try {
      session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root: overlay },
      });
    } catch (e) {
      console.warn('[creator] immersive-ar refused', e);
      this.setBusy(false);
      this.showModal('unsupported');
      return;
    }
    this.setBusy(false);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    await renderer.xr.setSession(session);
    this.session = session;
    this.active = true;
    overlay.hidden = false;
    document.documentElement.classList.add('cr-in-ar');

    // everything that belongs to the machine (model, shadows, its lights) moves as one group
    const group = this.group = new THREE.Group();
    group.visible = false;
    const members = [this.getModel(), studio.catcher, studio.contactPlane, studio.key, studio.key.target, studio.fill].filter(Boolean);
    const cam = studio.camera;
    this.saved = { background: scene.background, members, pos: cam.position.clone(), quat: cam.quaternion.clone(), target: studio.controls.target.clone() };
    scene.background = null;
    for (const m of members) group.add(m);
    scene.add(group);

    // floor reticle
    const ret = this.reticle = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.025, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff4b13, depthWrite: false }));
    // footprint of the machine, so the customer sees how much floor it needs
    const box = new THREE.Box3().setFromObject(this.getModel());
    const fp = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(box.max.x - box.min.x, box.max.z - box.min.z).rotateX(-Math.PI / 2)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    fp.position.set((box.max.x + box.min.x) / 2, 0.002, (box.max.z + box.min.z) / 2);
    this.footprint = fp;
    ret.add(ring, dot, fp);
    ret.matrixAutoUpdate = false; ret.visible = false;
    scene.add(ret);
    this.hitPose = null;
    this.placed = false;
    this.yaw = 0;

    const viewerSpace = await session.requestReferenceSpace('viewer');
    this.hitSource = await session.requestHitTestSource({ space: viewerSpace });
    this.setHint('Point the phone at the floor and move it slowly…');

    // taps on the overlay buttons must not place the machine
    overlay.querySelector('.cr-ar-bar').addEventListener('beforexrselect', (e) => e.preventDefault());
    this.onSelect = () => this.place();
    session.addEventListener('select', this.onSelect);
    session.addEventListener('end', () => this.endWebXR(), { once: true });
    overlay.querySelector('[data-ar=exit]').onclick = () => session.end();
    overlay.querySelector('[data-ar=left]').onclick = () => this.rotate(15);
    overlay.querySelector('[data-ar=right]').onclick = () => this.rotate(-15);
    overlay.querySelector('[data-ar=reset]').onclick = () => { this.placed = false; group.visible = false; this.setHint('Tap the floor to place the machine'); };
  }

  place() {
    if (!this.hitPose) { this.setHint('Floor not found yet — keep moving the phone slowly'); return; }
    const p = new THREE.Vector3().setFromMatrixPosition(this.reticle.matrix);
    this.group.position.copy(p);
    // face the customer
    const cam = new THREE.Vector3().setFromMatrixPosition(this.studio.renderer.xr.getCamera().matrixWorld);
    this.yaw = Math.atan2(cam.x - p.x, cam.z - p.z);
    this.group.rotation.set(0, this.yaw, 0);
    this.group.visible = true;
    this.placed = true;
    this.setHint('Tap the floor to move · use the arrows to rotate');
  }

  rotate(deg) {
    if (!this.placed) return;
    this.yaw += deg * Math.PI / 180;
    this.group.rotation.y = this.yaw;
  }

  setHint(t) { const el = document.getElementById('arHint'); if (el) el.textContent = t; }

  /** called from the render loop while an XR session runs */
  onFrame(xrFrame) {
    if (!xrFrame || !this.hitSource) return;
    const ref = this.studio.renderer.xr.getReferenceSpace();
    const hits = xrFrame.getHitTestResults(this.hitSource);
    if (hits.length) {
      const pose = hits[0].getPose(ref);
      const t = pose.transform.position; // translation only: the floor is horizontal, the yaw is ours
      this.reticle.matrix.makeTranslation(t.x, t.y, t.z);
      // keep the footprint aligned with the direction the machine will face
      const p = new THREE.Vector3().setFromMatrixPosition(this.reticle.matrix);
      const cam = new THREE.Vector3().setFromMatrixPosition(this.studio.renderer.xr.getCamera().matrixWorld);
      this.footprint.rotation.y = Math.atan2(cam.x - p.x, cam.z - p.z);
      this.reticle.visible = true;
      if (!this.hitPose && !this.placed) this.setHint('Tap the floor to place the machine');
      this.hitPose = pose;
      this.footprint.visible = !this.placed;
    } else {
      this.reticle.visible = false;
      this.hitPose = null;
    }
  }

  endWebXR() {
    const { studio } = this;
    const { scene, renderer } = studio;
    this.active = false;
    if (this.hitSource) { this.hitSource.cancel?.(); this.hitSource = null; }
    for (const m of this.saved.members) scene.add(m); // local transforms are the original world transforms
    scene.background = this.saved.background;
    // the XR session drove our camera: put the studio view back where it was
    const cam = studio.camera;
    cam.position.copy(this.saved.pos); cam.quaternion.copy(this.saved.quat); studio.controls.target.copy(this.saved.target);
    cam.updateMatrixWorld(true);
    scene.remove(this.group); scene.remove(this.reticle);
    this.reticle.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    this.group = null; this.reticle = null; this.session = null;
    renderer.xr.enabled = false;
    document.getElementById('arOverlay').hidden = true;
    document.documentElement.classList.remove('cr-in-ar');
    studio.resize();
  }

  // ------------------------------------------------------------------ desktop: QR / unsupported info
  async showModal(kind) {
    const m = document.getElementById('arModal');
    const s = this.getState();
    const url = new URL('/creator/', location.origin);
    url.searchParams.set('model', this.product.id);
    url.searchParams.set('color', s.bodyColor.hex.replace('#', ''));
    url.searchParams.set('ar', '1');
    const body = m.querySelector('.cr-modal-body');
    const custom = Object.values(s.graphics || {}).some((g) => g.type === 'custom');
    if (kind === 'qr') {
      const { default: qrcode } = await import('/creator/vendor/qrcode/qrcode.js');
      const qr = qrcode(0, 'M'); qr.addData(url.toString()); qr.make();
      body.innerHTML = `
        <h3 id="arTitle">View it in your room</h3>
        <p>Scan this code with your phone camera to place the <b>${this.product.name}</b> at real size in your room (iPhone/iPad with Safari or Android with Chrome).</p>
        <div class="cr-qr">${qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, alt: 'QR code: open the creator on your phone' })}</div>
        ${custom ? '<p class="cr-modal-note">Your uploaded graphics are stored only in this browser — upload them again on the phone to see them in AR. Colour and machine are passed on automatically.</p>' : '<p class="cr-modal-note">The machine and body colour you chose open automatically on the phone.</p>'}
        <div class="cr-modal-actions"><button type="button" class="cr-secondary" data-copy>Copy link</button><button type="button" class="cr-primary" data-close>Done</button></div>`;
    } else {
      body.innerHTML = `
        <h3 id="arTitle">AR is not available here</h3>
        <p>Placing the machine in your room needs <b>Safari on iPhone / iPad</b> (iOS 12 or newer) or <b>Chrome on Android</b> with <i>Google Play Services for AR</i>.</p>
        <p class="cr-modal-note">If you opened this page inside another app (Instagram, Facebook, Messenger…), open it in Safari or Chrome instead.</p>
        <div class="cr-modal-actions"><button type="button" class="cr-secondary" data-copy>Copy link</button><button type="button" class="cr-primary" data-close>OK</button></div>`;
    }
    m.hidden = false;
    const close = () => { m.hidden = true; document.removeEventListener('keydown', esc); this.button?.focus(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    m.onclick = (e) => { if (e.target === m) close(); };
    body.querySelector('[data-close]').onclick = close;
    body.querySelector('[data-copy]').onclick = async (e) => {
      try { await navigator.clipboard.writeText(url.toString()); e.target.textContent = 'Link copied'; } catch (err) { e.target.textContent = 'Copy failed'; }
    };
    body.querySelector('[data-close]').focus();
  }
}
