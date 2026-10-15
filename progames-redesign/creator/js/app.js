// PRO GAMES Creator - main controller (vanilla ES modules, three.js r170).
// Loaded only by /creator/index.html, so nothing here touches the public site.
import * as THREE from '/creator/vendor/three/three.module.min.js';
import { GLTFLoader } from '/creator/vendor/three/addons/loaders/GLTFLoader.js';
import { PRODUCTS, DEFAULT_PRODUCT, BODY_COLORS, CAMERA_PRESETS } from './config.js?v=9';
import { Studio, detectQuality } from './studio.js?v=9';
import { ZoneGraphics, DEFAULT_TRANSFORM, loadImage, normalizeUpload } from './graphics.js?v=9';
import { loadState, saveState, clearState, putImage, getImage, deleteImage } from './storage.js?v=9';
import { ARView } from './ar.js?v=9';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const LAST_KEY = 'progames-creator:last-model';
const lastModel = (() => { try { return localStorage.getItem(LAST_KEY); } catch (e) { return null; } })();
const product = PRODUCTS[params.get('model')] || PRODUCTS[lastModel] || PRODUCTS[DEFAULT_PRODUCT];
try { localStorage.setItem(LAST_KEY, product.id); } catch (e) { /* ignore */ }
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

// ------------------------------------------------------------------ state
function defaultState() {
  const options = {};
  for (const o of product.options) options[o.id] = o.default;
  return {
    version: 1,
    model: product.id,
    bodyColor: (() => { const c = BODY_COLORS.find((b) => b.id === product.defaultColor) || BODY_COLORS[0]; return { id: c.id, hex: c.hex }; })(),
    graphics: {},            // zoneId -> { type: 'factory'|'custom'|'none', imageId?, name? }
    graphicsTransforms: {},  // zoneId -> { scale, x, y, rotation, mode }
    selectedZone: product.defaultZone || product.zones[0].id,
    cameraPreset: product.defaultPreset,
    camera: null,            // { pos, target } when the user orbited freely
    options,
  };
}
let state = Object.assign(defaultState(), loadState(product.id) || {});
state.options = Object.assign(defaultState().options, state.options || {});
// colour handed over from another device (QR code of "View in your room")
if (/^[0-9a-f]{6}$/i.test(params.get('color') || '')) {
  const hex = `#${params.get('color').toLowerCase()}`;
  const preset = BODY_COLORS.find((c) => c.hex.toLowerCase() === hex);
  state.bodyColor = { id: preset ? preset.id : 'custom', hex };
}
const persist = () => saveState(product.id, state);

// ------------------------------------------------------------------ studio
const quality = detectQuality();
const studio = new Studio($('#stage'), quality);
const { scene, camera, renderer, controls } = studio;
let graphics = null;
let modelRoot = null;
const paintMaterials = [];
const leds = { rgb: [], strips: [], white: [] };
let screenMaterials = [];

function toast(msg, ms = 2200) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

// ------------------------------------------------------------------ load model
const loader = new GLTFLoader();
const stage = (t) => { window.__creatorStage = t; const el = $('#loadingText'); if (el && !$('#loading').classList.contains('error')) el.textContent = t; };
const showError = (where, err) => {
  console.error('[creator]', where, err);
  window.__creatorFailed = true;
  $('#loading').classList.add('error');
  $('#loadingText').textContent = `Error (${where}): ${(err && (err.message || err)) || 'unknown'}`;
};
stage('Downloading 3D model…');
loader.load(product.model, (g) => {
  try { stage('Building the scene…'); onLoaded(g); }
  catch (e) { showError('scene setup', e); }
}, (e) => {
  stage(`Downloading 3D model… ${(e.loaded / 1048576).toFixed(1)} MB`);
  const total = e.total || 3.6e6; // server may gzip and hide the length
  $('#loadingBar').style.width = `${Math.min(99, Math.round((e.loaded / total) * 100))}%`;
}, (err) => {
  showError('model download/parse', err);
});

function onLoaded(gltf) {
  modelRoot = gltf.scene;
  modelRoot.name = product.id;
  modelRoot.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (product.paintMaterials.includes(m.name)) paintMaterials.includes(m) || paintMaterials.push(m);
    if (m.name === 'SCREEN') screenMaterials.includes(m) || screenMaterials.push(m);
    if (m.name === 'LED_RGB') setupRgbLeds(o);
    else if (m.name === 'LED_STRIP') setupStrip(o);
    else if (m.name === 'LED_WHITE') setupWhite(o);
    const transparent = m.transparent || m.alphaMode === 'BLEND';
    o.castShadow = !transparent && !m.name.startsWith('LED');
    o.receiveShadow = !transparent && !m.name.startsWith('LED');
    if (m.map) m.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  });
  // decals & stickers: draw on top of the paint without z-fighting
  modelRoot.traverse((o) => {
    if (o.isMesh && (o.material.name === 'DECALS')) {
      o.material.polygonOffset = true; o.material.polygonOffsetFactor = -2; o.material.polygonOffsetUnits = -2;
      o.material.depthWrite = false; o.renderOrder = 2;
    }
  });
  scene.add(modelRoot);
  graphics = new ZoneGraphics(product, modelRoot, renderer);

  // the camera may never enter these volumes
  const boxes = [];
  for (const name of ['body_lower', 'body_column', 'top_canopy_drum', 'top_canopy', 'top_canopy_lower', 'metal_platform']) {
    const obj = modelRoot.getObjectByName(name);
    if (obj) boxes.push(new THREE.Box3().setFromObject(obj).expandByScalar(0.12));
  }
  studio.setKeepOut(boxes);
  studio.buildContactShadow(modelRoot);

  buildUI();
  applyColor(state.bodyColor.hex, false);
  applyOptions();
  stage('Applying saved configuration…');
  const done = () => $('#loading').classList.add('done');
  Promise.race([restoreGraphics(), new Promise((r) => setTimeout(r, 4000))]).then(done, (e) => { console.warn(e); done(); });
  if (state.cameraPreset === 'custom' && state.camera) {
    camera.position.fromArray(state.camera.pos); controls.target.fromArray(state.camera.target);
  } else {
    const p = CAMERA_PRESETS[state.cameraPreset] || CAMERA_PRESETS[product.defaultPreset];
    camera.position.set(p.pos[0] * 1.35, p.pos[1] + 0.4, p.pos[2] * 1.35);
    controls.target.fromArray(p.target);
    studio.flyTo(p.pos, p.target, 1600);
  }
  markPreset(state.cameraPreset);
  selectZone(state.selectedZone, { fly: false, flash: false });
  window.__creator.ready = true;
  ar.init($('#arButton')).then((mode) => {
    if (params.get('ar') === '1' && (mode === 'quicklook' || mode === 'webxr')) {
      $('#arButton').classList.add('cr-attn');
      toast('Tap “View in your room” to place the machine on your floor', 4500);
    }
  });
}

// ------------------------------------------------------------------ LEDs
let glowTexture = null;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.12)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(c); glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}
function setupRgbLeds(mesh) {
  const g = mesh.geometry;
  const col0 = g.getAttribute('color');
  const id = g.getAttribute('_led');
  if (!col0 || !id) return;
  // exporters may store COLOR_0 as normalized integers: switch to a float attribute we can animate
  const col = new THREE.BufferAttribute(new Float32Array(col0.count * 3), 3);
  for (let i = 0; i < col0.count; i++) col.setXYZ(i, col0.getX(i), col0.getY(i), col0.getZ(i));
  col.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('color', col);
  const pos = g.getAttribute('position'), nor = g.getAttribute('normal');
  const nv = col.count;
  const vid = new Uint16Array(nv);
  let n = 0;
  for (let i = 0; i < nv; i++) { vid[i] = Math.round(id.getX(i)); n = Math.max(n, vid[i] + 1); }
  // per-bulb centre, mean normal and factory colour
  const cen = new Float32Array(n * 3), nrm = new Float32Array(n * 3), base = new Float32Array(n * 3), cnt = new Uint16Array(n);
  for (let i = 0; i < nv; i++) {
    const k = vid[i]; cnt[k]++;
    cen[k * 3] += pos.getX(i); cen[k * 3 + 1] += pos.getY(i); cen[k * 3 + 2] += pos.getZ(i);
    nrm[k * 3] += nor.getX(i); nrm[k * 3 + 1] += nor.getY(i); nrm[k * 3 + 2] += nor.getZ(i);
    base[k * 3] = col.getX(i); base[k * 3 + 1] = col.getY(i); base[k * 3 + 2] = col.getZ(i);
  }
  const glowPos = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const c = Math.max(cnt[k], 1);
    const v = new THREE.Vector3(nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]).normalize();
    nrm.set([v.x, v.y, v.z], k * 3);
    for (let j = 0; j < 3; j++) { cen[k * 3 + j] /= c; glowPos[k * 3 + j] = cen[k * 3 + j] + nrm[k * 3 + j] * 0.012; }
  }
  // frosted dome: hot centre, darker rim
  const shade = new Float32Array(nv);
  for (let i = 0; i < nv; i++) {
    const k = vid[i];
    const d = nor.getX(i) * nrm[k * 3] + nor.getY(i) * nrm[k * 3 + 1] + nor.getZ(i) * nrm[k * 3 + 2];
    shade[i] = 0.38 + 0.62 * Math.pow(Math.max(d, 0), 1.6);
  }
  mesh.material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, name: 'LED_RGB' });
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
  const gcol = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
  pg.setAttribute('color', gcol);
  const glow = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.085, map: getGlowTexture(), vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false, opacity: 0.9 }));
  glow.renderOrder = 5; glow.raycast = () => {};
  mesh.add(glow);
  leds.rgb.push({ mesh, col, vid, shade, base, n, gcol, cur: new Float32Array(n * 3), offset: leds.rgb.length * 0.13 });
}
function setupStrip(mesh) {
  const map = mesh.material.emissiveMap || mesh.material.map;
  if (map) { map.wrapS = THREE.RepeatWrapping; map.needsUpdate = true; }
  mesh.material = new THREE.MeshBasicMaterial({ map, toneMapped: false, name: 'LED_STRIP' });
  leds.strips.push(mesh);
}
function setupWhite(mesh) {
  mesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, name: 'LED_WHITE' });
  leds.white.push(mesh);
}
const tmpColor = new THREE.Color();
function animateLeds(t) {
  const fx = state.options.ledEffect;
  const br = state.options.ledBrightness;
  for (const L of leds.rgb) {
    const c = L.cur;
    for (let k = 0; k < L.n; k++) {
      let r, g, b;
      if (fx === 'off') { r = g = b = 0.1; }
      else if (fx === 'chase') {
        const hue = (((k * 0.083 + L.offset - t * 0.22) % 1) + 1) % 1;
        tmpColor.setHSL(hue, 0.85, 0.62);
        const wave = 0.55 + 0.45 * Math.max(0, Math.sin(k * 0.9 - t * 5.0 + L.offset * 9));
        r = tmpColor.r * wave * br; g = tmpColor.g * wave * br; b = tmpColor.b * wave * br;
      } else {
        const pulse = fx === 'pulse' ? 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.4 + k * 0.35)) : 1;
        r = L.base[k * 3] * pulse * br; g = L.base[k * 3 + 1] * pulse * br; b = L.base[k * 3 + 2] * pulse * br;
      }
      c[k * 3] = r; c[k * 3 + 1] = g; c[k * 3 + 2] = b;
    }
    const a = L.col.array;
    for (let i = 0; i < L.vid.length; i++) {
      const k = L.vid[i], s = L.shade[i];
      a[i * 3] = c[k * 3] * s + (fx === 'off' ? 0 : 0.12 * s * s); a[i * 3 + 1] = c[k * 3 + 1] * s + (fx === 'off' ? 0 : 0.12 * s * s); a[i * 3 + 2] = c[k * 3 + 2] * s + (fx === 'off' ? 0 : 0.12 * s * s);
    }
    L.col.needsUpdate = true;
    const ga = L.gcol.array, gk = fx === 'off' ? 0 : 0.55;
    for (let j = 0; j < ga.length; j++) ga[j] = c[j] * gk;
    L.gcol.needsUpdate = true;
  }
  for (const s of leds.strips) {
    if (s.material.map) s.material.map.offset.x = fx === 'chase' ? -t * 0.18 : 0;
    s.material.color.setScalar(fx === 'off' ? 0.12 : br * (fx === 'pulse' ? 0.5 + 0.5 * Math.abs(Math.sin(t * 1.2)) : 1));
  }
  for (const w of leds.white) w.material.color.setScalar(fx === 'off' ? 0.2 : Math.min(br, 1.2));
}

// ------------------------------------------------------------------ body colour
function applyColor(hex, save = true) {
  for (const m of paintMaterials) m.color.set(hex);
  state.bodyColor.hex = hex;
  const preset = BODY_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase() && c.id === state.bodyColor.id) ||
                 BODY_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  state.bodyColor.id = preset ? preset.id : 'custom';
  $('#colorName').textContent = preset ? preset.label : 'Custom colour';
  $('#colorHex').textContent = hex.toUpperCase();
  document.querySelectorAll('.cr-sw').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === state.bodyColor.id)));
  if (save) persist();
}

// ------------------------------------------------------------------ options
function applyOptions() {
  for (const m of screenMaterials) {
    if (m.userData.emis === undefined) m.userData.emis = m.emissiveIntensity;
    m.emissiveIntensity = state.options.screens ? m.userData.emis : 0.0;
  }
}

// ------------------------------------------------------------------ graphics
async function restoreGraphics() {
  for (const z of product.zones) {
    const g = state.graphics[z.id];
    if (!g || g.type === 'factory') continue;
    if (g.type === 'none') { graphics.remove(z.id); continue; }
    if (g.type === 'custom' && g.imageId) {
      const blob = await getImage(g.imageId);
      if (!blob) { state.graphics[z.id] = { type: 'factory' }; continue; }
      try {
        const img = await loadImage(blob);
        graphics.setImage(z.id, img, state.graphicsTransforms[z.id]);
      } catch (e) { state.graphics[z.id] = { type: 'factory' }; }
    }
  }
  refreshZoneUI();
}

async function handleFile(file) {
  const zone = state.selectedZone;
  if (!file) return;
  if (!ACCEPT.includes(file.type) && !/\.svg$/i.test(file.name)) { toast('Please use a PNG, JPG, WEBP or SVG file.'); return; }
  try {
    const blob = await normalizeUpload(file.type ? file : new Blob([await file.arrayBuffer()], { type: 'image/svg+xml' }));
    const img = await loadImage(blob);
    const prev = state.graphics[zone];
    const imageId = `${product.id}:${zone}:${Date.now()}`;
    const stored = await putImage(imageId, blob);
    if (prev?.imageId) deleteImage(prev.imageId);
    state.graphics[zone] = { type: 'custom', imageId: stored ? imageId : null, name: file.name };
    state.graphicsTransforms[zone] = { ...DEFAULT_TRANSFORM };
    graphics.setImage(zone, img, state.graphicsTransforms[zone]);
    graphics.flash(zone);
    persist();
    refreshZoneUI();
    toast(stored ? `Graphic applied to ${zoneDef(zone).label}` : 'Graphic applied (browser storage unavailable — it will not survive a reload)');
  } catch (e) {
    console.error(e);
    toast('This file could not be read as an image.');
  }
}

const zoneDef = (id) => product.zones.find((z) => z.id === id);

function selectZone(id, { fly = true, flash = true } = {}) {
  if (!zoneDef(id)) id = product.zones[0].id;
  state.selectedZone = id;
  persist();
  document.querySelectorAll('.cr-zone').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.zone === id)));
  const z = zoneDef(id);
  $('#zoneLabel').textContent = z.label;
  $('#zoneHint').textContent = z.hint;
  refreshZoneUI();
  if (flash && graphics) graphics.flash(id);
  if (fly && z.camera) { studio.flyTo(z.camera.pos, z.camera.target); state.cameraPreset = 'custom'; markPreset(null); }
}

function refreshZoneUI() {
  const id = state.selectedZone;
  const g = state.graphics[id] || { type: 'factory' };
  const st = $('#zoneStatus');
  st.textContent = g.type === 'custom' ? (g.name || 'Custom graphic') : g.type === 'none' ? 'No graphic' : 'Factory artwork';
  st.classList.toggle('custom', g.type === 'custom');
  $('#transform').disabled = g.type !== 'custom';
  const t = { ...DEFAULT_TRANSFORM, ...(state.graphicsTransforms[id] || {}) };
  $('#tScale').value = t.scale; $('#tX').value = t.x; $('#tY').value = t.y; $('#tRot').value = t.rotation;
  outputs(t);
  document.querySelectorAll('#transform [data-act=fit], #transform [data-act=fill]').forEach((b) => b.classList.toggle('active', g.type === 'custom' && b.dataset.act === t.mode));
  document.querySelector('[data-act=restore]').disabled = g.type === 'factory';
  document.querySelector('[data-act=remove]').disabled = g.type === 'none';
  document.querySelectorAll('.cr-zone').forEach((b) => {
    const gt = (state.graphics[b.dataset.zone] || {}).type || 'factory';
    b.querySelector('i').className = gt === 'custom' ? 'custom' : gt === 'none' ? 'none' : '';
  });
}

function outputs(t) {
  $('#oScale').textContent = `${Math.round(t.scale * 100)}%`;
  $('#oX').textContent = t.x.toFixed(2);
  $('#oY').textContent = t.y.toFixed(2);
  $('#oRot').textContent = `${Math.round(t.rotation)}°`;
}

function setTransform(patch) {
  const id = state.selectedZone;
  const t = { ...DEFAULT_TRANSFORM, ...(state.graphicsTransforms[id] || {}), ...patch };
  state.graphicsTransforms[id] = t;
  graphics.setTransform(id, t);
  persist();
  refreshZoneUI();
}

// ------------------------------------------------------------------ camera presets
function markPreset(id) {
  document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === id)));
}
function goPreset(id) {
  const p = CAMERA_PRESETS[id]; if (!p) return;
  studio.flyTo(p.pos, p.target);
  state.cameraPreset = id; state.camera = null; markPreset(id); persist();
}

// ------------------------------------------------------------------ save preview
async function savePreview() {
  const btn = $('#savePreview'); btn.setAttribute('aria-busy', 'true');
  const el = renderer.domElement;
  const w = el.clientWidth, h = el.clientHeight;
  const prev = renderer.getPixelRatio();
  const ratio = Math.min(Math.max(2400 / w, prev), 4);
  renderer.setPixelRatio(ratio); renderer.setSize(w, h, false);
  studio.update(performance.now());
  const out = document.createElement('canvas'); out.width = el.width; out.height = el.height;
  const ctx = out.getContext('2d');
  const g = ctx.createRadialGradient(out.width / 2, out.height * 0.38, 0, out.width / 2, out.height * 0.38, Math.max(out.width, out.height) * 0.75);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.42, '#f6f7f8'); g.addColorStop(1, '#e4e7ea');
  ctx.fillStyle = g; ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(el, 0, 0);
  ctx.fillStyle = 'rgba(13,16,20,.55)'; ctx.font = `${Math.round(out.width / 90)}px Inter, Arial, sans-serif`;
  ctx.fillText(`PRO GAMES · ${product.name} · ${new Date().toISOString().slice(0, 10)}`, out.width * 0.02, out.height - out.width * 0.02);
  renderer.setPixelRatio(prev); renderer.setSize(w, h, false);
  const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `progames-${product.id}-preview-${Date.now()}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  window.__creator.lastPreview = { width: out.width, height: out.height, bytes: blob.size };
  btn.removeAttribute('aria-busy');
  toast(`Preview saved (${out.width}×${out.height}px)`);
}

// ------------------------------------------------------------------ UI
function buildUI() {
  $('#viewerTitle').textContent = product.name;
  document.title = `${product.name} – PRO GAMES Creator (preview)`;
  $('#productSpec').textContent = product.spec || '';
  $('#productName').innerHTML = `${product.name} <em>${product.subtitle}</em>`;
  const ml = $('#models');
  if (ml && !ml.children.length) {
    for (const p of Object.values(PRODUCTS)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cr-machine'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(p.id === product.id));
      b.innerHTML = `<img src="${p.thumb}" alt="" width="64" height="64" loading="lazy"><span><b>${p.name}</b><small>${p.subtitle}</small></span>`;
      b.addEventListener('click', () => { if (p.id !== product.id) location.search = `?model=${encodeURIComponent(p.id)}`; });
      ml.appendChild(b);
    }
  }
  // swatches
  const sw = $('#swatches');
  sw.innerHTML = '';
  for (const c of BODY_COLORS) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cr-sw'; b.dataset.id = c.id; b.style.setProperty('--c', c.hex);
    b.setAttribute('role', 'radio'); b.setAttribute('aria-label', c.label); b.title = c.label;
    b.addEventListener('click', () => { state.bodyColor.id = c.id; applyColor(c.hex); });
    sw.appendChild(b);
  }
  const custom = document.createElement('label');
  custom.className = 'cr-sw custom'; custom.dataset.id = 'custom'; custom.title = 'Custom colour';
  custom.setAttribute('role', 'radio'); custom.setAttribute('aria-label', 'Custom colour');
  custom.innerHTML = '<input type="color" id="customColor" aria-label="Pick a custom colour">';
  sw.appendChild(custom);
  const cc = custom.querySelector('input');
  cc.value = state.bodyColor.hex;
  cc.addEventListener('input', () => { state.bodyColor.id = 'custom'; applyColor(cc.value, false); });
  cc.addEventListener('change', () => { state.bodyColor.id = 'custom'; applyColor(cc.value); });

  // zones
  const zl = $('#zones'); zl.innerHTML = '';
  for (const z of product.zones) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cr-zone'; b.dataset.zone = z.id; b.setAttribute('role', 'option');
    b.innerHTML = `<span>${z.label}</span><i></i>`;
    b.addEventListener('click', () => selectZone(z.id));
    zl.appendChild(b);
  }

  // upload
  const file = $('#file');
  file.addEventListener('change', () => { handleFile(file.files[0]); file.value = ''; });
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (ev) => handleFile(ev.dataTransfer.files[0]));
  // dropping straight onto the 3D view: target the zone under the cursor
  const vw = $('#viewer');
  vw.addEventListener('dragover', (ev) => ev.preventDefault());
  vw.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const zone = pickZone(ev.clientX, ev.clientY);
    if (zone) selectZone(zone, { fly: false });
    handleFile(ev.dataTransfer.files[0]);
  });

  // transform controls
  $('#tScale').addEventListener('input', (e) => setTransform({ scale: +e.target.value }));
  $('#tX').addEventListener('input', (e) => setTransform({ x: +e.target.value }));
  $('#tY').addEventListener('input', (e) => setTransform({ y: +e.target.value }));
  $('#tRot').addEventListener('input', (e) => setTransform({ rotation: +e.target.value }));
  document.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const id = state.selectedZone;
    switch (b.dataset.act) {
      case 'fit': setTransform({ mode: 'fit', scale: 1, x: 0, y: 0 }); break;
      case 'fill': setTransform({ mode: 'fill', scale: 1, x: 0, y: 0 }); break;
      case 'center': setTransform({ x: 0, y: 0 }); break;
      case 'reset': setTransform({ ...DEFAULT_TRANSFORM }); break;
      case 'restore': {
        const prev = state.graphics[id]; if (prev?.imageId) deleteImage(prev.imageId);
        graphics.restore(id); state.graphics[id] = { type: 'factory' }; delete state.graphicsTransforms[id];
        graphics.flash(id); persist(); refreshZoneUI(); toast('Original artwork restored'); break;
      }
      case 'remove': {
        const prev = state.graphics[id]; if (prev?.imageId) deleteImage(prev.imageId);
        graphics.remove(id); state.graphics[id] = { type: 'none' }; delete state.graphicsTransforms[id];
        graphics.flash(id); persist(); refreshZoneUI(); break;
      }
    }
  }));

  // options
  const op = $('#options'); op.innerHTML = '';
  for (const o of product.options) {
    const row = document.createElement('div'); row.className = 'cr-opt';
    const lab = `<span>${o.label}${o.comingSoon ? '<span class="cr-soon">soon</span>' : ''}</span>`;
    if (o.type === 'select') {
      row.innerHTML = `${lab}<select id="opt-${o.id}" aria-label="${o.label}">${o.choices.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}</select>`;
      const s = row.querySelector('select'); s.value = state.options[o.id];
      s.addEventListener('change', () => { state.options[o.id] = s.value; applyOptions(); persist(); });
    } else if (o.type === 'range') {
      row.innerHTML = `${lab}<input type="range" id="opt-${o.id}" min="${o.min}" max="${o.max}" step="${o.step}" aria-label="${o.label}">`;
      const s = row.querySelector('input'); s.value = state.options[o.id];
      s.addEventListener('input', () => { state.options[o.id] = +s.value; persist(); });
    } else {
      row.innerHTML = `${lab}<label class="cr-switch"><input type="checkbox" id="opt-${o.id}" aria-label="${o.label}" ${o.comingSoon ? 'disabled' : ''}><span></span></label>`;
      const s = row.querySelector('input'); s.checked = !!state.options[o.id];
      s.addEventListener('change', () => { state.options[o.id] = s.checked; applyOptions(); toggleOptionModel(o, s.checked); persist(); });
    }
    op.appendChild(row);
  }

  // camera presets
  document.querySelectorAll('#views button').forEach((b) => b.addEventListener('click', () => goPreset(b.dataset.view)));
  controls.addEventListener('start', () => { studio.tween = null; });
  controls.addEventListener('end', () => {
    state.cameraPreset = 'custom'; markPreset(null);
    state.camera = { pos: camera.position.toArray(), target: controls.target.toArray() };
    persist();
  });

  $('#savePreview').addEventListener('click', savePreview);
  const reset = $('#resetAll');
  reset.addEventListener('click', async () => {
    if (!reset.dataset.armed) {
      reset.dataset.armed = '1'; reset.textContent = 'Confirm reset';
      setTimeout(() => { delete reset.dataset.armed; reset.textContent = 'Reset'; }, 3000);
      return;
    }
    for (const g of Object.values(state.graphics)) if (g.imageId) deleteImage(g.imageId);
    clearState(product.id);
    state = defaultState();
    for (const z of product.zones) graphics.restore(z.id);
    buildUI(); applyColor(state.bodyColor.hex); applyOptions(); selectZone(state.selectedZone, { fly: false });
    goPreset(state.cameraPreset);
    toast('Configuration reset');
  });

  // picking zones on the model
  const el = renderer.domElement;
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const zone = pickZone(e.clientX, e.clientY);
    if (zone) {
      selectZone(zone, { fly: false });
      if (quality.mobile) document.querySelector('#editor').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const zone = pickZone(e.clientX, e.clientY);
    graphics.hover(zone);
    el.style.cursor = zone ? 'pointer' : 'grab';
  });
  el.addEventListener('pointerleave', () => graphics.hover(null));
}

const raycaster = new THREE.Raycaster();
function pickZone(cx, cy) {
  if (!modelRoot) return null;
  const r = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(modelRoot, true);
  for (const h of hits) {
    const zone = graphics.zoneOf(h.object);
    if (zone) return zone;
    // ignore stickers / LEDs sitting on top of a zone, stop at solid geometry
    const n = h.object.material?.name || '';
    if (n === 'DECALS' || n.startsWith('LED')) continue;
    // a zone decal sits 1.6 mm above the body: accept it when it is right behind the hit
    const next = hits.find((k) => k !== h && graphics.zoneOf(k.object));
    if (next && next.distance - h.distance < 0.01) return graphics.zoneOf(next.object);
    return null;
  }
  return null;
}

// optional add-on models (architecture for future options)
const optionObjects = new Map();
function toggleOptionModel(o, on) {
  if (!o.model) return;
  if (on && !optionObjects.has(o.id)) {
    loader.load(o.model, (g) => {
      const anchor = modelRoot.getObjectByName(o.anchor) || modelRoot;
      anchor.add(g.scene); optionObjects.set(o.id, g.scene);
    });
  } else if (optionObjects.has(o.id)) optionObjects.get(o.id).visible = on;
}

// ------------------------------------------------------------------ loop
const ar = new ARView({ studio, product, getModel: () => modelRoot, getState: () => state, toast });
let last = performance.now();
function frame(now, xrFrame) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  if (modelRoot) { animateLeds(now / 1000); graphics.tick(dt); }
  if (ar.active) { ar.onFrame(xrFrame); renderer.render(scene, camera); } // WebXR: the headset/phone pose drives the camera
  else studio.update(now);
}
renderer.setAnimationLoop(frame); // (instead of requestAnimationFrame: required for WebXR sessions)
document.addEventListener('visibilitychange', () => { last = performance.now(); });

window.__creator = { get state() { return state; }, studio, product, get graphics() { return graphics; }, selectZone, goPreset, applyColor, handleFile, savePreview, ar, ready: false };
