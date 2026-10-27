/* MONSTER GAME – PRO-GAMES browser platformer starring the MONSTER 3IN1 mascot.
   Pure canvas + WebAudio, no dependencies. Internal resolution 400×225, 16 px tiles. */
(() => {
'use strict';
const root = document.getElementById('monster-game');
if (!root) return;
const LANG = root.dataset.lang === 'pl' ? 'pl' : 'en';
const LEVELS = window.MONSTER_LEVELS;
let W = 400, H = 225;
const T = 16, ROWS = 15, DT = 1 / 60, VH = 225;
const canvas = root.querySelector('canvas.mg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
ctx.imageSmoothingEnabled = false;
// Narrow screens (phones in portrait) get a 4:3 view so the monster is bigger.
let fitKey = '';
function fitView(force) {
  const narrow = root.clientWidth < 640 && !document.fullscreenElement;
  const stage = root.querySelector('.mg-stage');
  root.classList.toggle('is-narrow', narrow);
  // phones: the game screen grows down to the bottom of the viewport (touch buttons stay visible)
  const key = narrow + ':' + root.clientWidth + ':' + Math.round(innerHeight / 120);
  if (!force && key === fitKey) return;
  fitKey = key;
  let nw = narrow ? 300 : 400, nh = VH;
  if (narrow) {
    const touch = root.querySelector('.mg-touch');
    const top = stage.getBoundingClientRect().top + scrollY;
    const avail = innerHeight - top - (touch && root.classList.contains('is-touch') ? touch.offsetHeight : 0) - 22;
    const hpx = Math.max(stage.clientWidth * 0.75, Math.min(avail, stage.clientWidth * 1.45));
    stage.style.height = Math.round(hpx) + 'px';
    nh = Math.max(VH, Math.min(430, Math.round(nw * hpx / stage.clientWidth)));
  } else stage.style.height = '';
  if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false; skyTheme = -1; }
}
addEventListener('resize', () => fitView());
addEventListener('orientationchange', () => setTimeout(() => fitView(true), 300));


/* ---------- text ---------- */
const STR = {
  en: {
    stage: 'STAGE', time: 'TIME', rage: 'RAGE', lives: 'x', paused: 'PAUSED',
    hints: {
      1: ['ARROWS = MOVE   SPACE = JUMP', 'USE ◀ ▶ TO RUN, TAP JUMP TO JUMP'],
      2: ['J = PUNCH!  BREAK THE CRATES', 'PUNCH!  BREAK THE CRATES'],
      3: ['JUMP ON BAGGERS OR PUNCH THEM', 'JUMP ON BAGGERS OR PUNCH THEM'],
      4: ['K = KICK THE BALL', 'KICK = KICK THE BALL'],
      5: ['IN THE AIR ↓ = HAMMER SMASH', 'IN THE AIR SMASH = HAMMER DROP'],
      6: ['SMASH THE SPRING = MEGA JUMP', 'SMASH THE SPRING = MEGA JUMP'],
      7: ['REACH THE MONSTER MACHINE!', 'REACH THE MONSTER MACHINE!'],
      8: ['SPARKIES ZAP! PUNCH OR KICK THEM', 'SPARKIES ZAP! PUNCH OR KICK THEM'],
      9: ['GLOVERS CHARGE! JUMP OR SMASH', 'GLOVERS CHARGE! JUMP OR SMASH'],
      0: ['↓ ON THE GROUND BREAKS CRACKED WALLS', 'SMASH ON THE GROUND BREAKS WALLS']
    },
    pops: { rage: 'MONSTER RAGE!', save: 'SAVED!', heart: '+HEART', life: '1UP!', ko: 'K.O.!', boss: 'BIG BAG!', ready: 'READY?', go: 'GO!' }
  },
  pl: {
    stage: 'ETAP', time: 'CZAS', rage: 'SZAŁ', lives: 'x', paused: 'PAUZA',
    hints: {
      1: ['STRZAŁKI = RUCH   SPACJA = SKOK', '◀ ▶ = BIEGNIJ   SKOK = SKACZ'],
      2: ['J = CIOS!  ROZBIJ SKRZYNIE', 'CIOS!  ROZBIJ SKRZYNIE'],
      3: ['SKACZ NA WORKI ALBO JE UDERZ', 'SKACZ NA WORKI ALBO JE UDERZ'],
      4: ['K = KOPNIJ PIŁKĘ', 'KOP = KOPNIJ PIŁKĘ'],
      5: ['W POWIETRZU ↓ = UDERZENIE MŁOTEM', 'W POWIETRZU MŁOT = UDERZENIE'],
      6: ['MŁOT NA SPRĘŻYNĘ = MEGA SKOK', 'MŁOT NA SPRĘŻYNĘ = MEGA SKOK'],
      7: ['DOBIEGNIJ DO AUTOMATU MONSTER!', 'DOBIEGNIJ DO AUTOMATU MONSTER!'],
      8: ['ISKRY RAŻĄ! UDERZ LUB KOPNIJ', 'ISKRY RAŻĄ! UDERZ LUB KOPNIJ'],
      9: ['RĘKAWICE SZARŻUJĄ! SKOCZ LUB MŁOT', 'RĘKAWICE SZARŻUJĄ! SKOCZ LUB MŁOT'],
      0: ['↓ NA ZIEMI KRUSZY PĘKNIĘTE ŚCIANY', 'MŁOT NA ZIEMI KRUSZY ŚCIANY']
    },
    pops: { rage: 'SZAŁ MONSTERA!', save: 'ZAPIS!', heart: '+SERCE', life: '+ŻYCIE!', ko: 'K.O.!', boss: 'BIG BAG!', ready: 'GOTOWY?', go: 'START!' }
  }
}[LANG];

/* ---------- storage (best scores, unlocked stages, sound) ---------- */
const KEY = 'pg-monster-game-v1';
const save = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
save.unlocked = Math.max(1, Math.min(LEVELS.length, save.unlocked | 0 || 1));
save.best = save.best || {};
save.top = save.top | 0;
if (save.music === undefined) save.music = true;
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode */ } }

/* ---------- bitmap font 5×7 ---------- */
const FONT_SRC = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110',
  D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000',
  G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
  J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001', N: '10001100011100110101100111000110001', O: '01110100011000110001100011000101110',
  P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001',
  S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110',
  V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111',
  0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
  3: '11111000100010000010000011000101110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
  6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110',
  9: '01110100011000101111000010001001100',
  '!': '00100001000010000100001000000000100', '?': '01110100010000100010001000000000100', '.': '00000000000000000000000000110001100',
  ',': '00000000000000000000011000010001000', ':': '00000011000110000000011000110000000', '-': '00000000000000011111000000000000000',
  '+': '00000001000010011111001000010000000', '/': '00001000100001000100010000100010000', "'": '00100001000100000000000000000000000',
  '=': '00000000001111100000111110000000000', '×': '00000100010101000100010101000100000',
  '←': '00000001000100011111010000010000000', '→': '00000001000001011111000100010000000',
  '↑': '00100011101010100100001000010000000', '↓': '00000001000010000100101010111000100',
  '◀': '00010001100111011111011100011000010', '▶': '01000011000111011111011100110001000',
  '♥': '00000010101111111111011100010000000', '(': '00010001000100001000010000010000010', ')': '01000001000001000010000100010001000',
  '#': '01010010101111101010111110101001010', '_': '00000000000000000000000000000011111', i: '00100000000110000100001000010001110', n: '00000000001011011001100011000110001', '%': '11001110010001000100010001001110011', ' ': '00000000000000000000000000000000000'
};
const DIA = { 'Ą': ['A', 'og'], 'Ć': ['C', 'ac'], 'Ę': ['E', 'og'], 'Ł': ['L', 'st'], 'Ń': ['N', 'ac'], 'Ó': ['O', 'ac'], 'Ś': ['S', 'ac'], 'Ź': ['Z', 'ac'], 'Ż': ['Z', 'dot'] };
const FONT = {};
for (const [ch, bits] of Object.entries(FONT_SRC)) FONT[ch] = bits;
function textWidth(s, scale = 1) { return s.length * 6 * scale - scale; }
function glyph(g, ch, x, y, s) {
  let base = ch, mark = null;
  if (DIA[ch]) [base, mark] = DIA[ch];
  const bits = FONT[base] || FONT['?'];
  for (let i = 0; i < 35; i++) if (bits[i] === '1') g.fillRect(x + (i % 5) * s, y + ((i / 5) | 0) * s, s, s);
  if (mark === 'ac') { g.fillRect(x + 3 * s, y - 2 * s, s, s); g.fillRect(x + 2 * s, y - s, s, s); }
  else if (mark === 'dot') g.fillRect(x + 2 * s, y - 2 * s, s, s);
  else if (mark === 'og') { g.fillRect(x + 3 * s, y + 7 * s, s, s); g.fillRect(x + 4 * s, y + 8 * s, s, s); }
  else if (mark === 'st') { g.fillRect(x + 2 * s, y + 2 * s, s, s); g.fillRect(x + 1 * s, y + 4 * s, s, s); }
}
function drawText(g, str, x, y, color, opt = {}) {
  const s = opt.scale || 1, txt = [...String(str)].map(c => FONT[c] ? c : c.toUpperCase()).join('');
  const w = textWidth(txt, s);
  let x0 = Math.round(opt.align === 'center' ? x - w / 2 : opt.align === 'right' ? x - w : x);
  y = Math.round(y);
  if (opt.outline) {
    g.fillStyle = opt.outline;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]])
      for (let i = 0; i < txt.length; i++) glyph(g, txt[i], x0 + i * 6 * s + dx * Math.max(1, s >> 1), y + dy * Math.max(1, s >> 1), s);
  }
  if (opt.shadow) { g.fillStyle = opt.shadow; for (let i = 0; i < txt.length; i++) glyph(g, txt[i], x0 + i * 6 * s + s, y + s, s); }
  g.fillStyle = color;
  for (let i = 0; i < txt.length; i++) glyph(g, txt[i], x0 + i * 6 * s, y, s);
  return w;
}

/* ---------- utils ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const C = {
  out: '#0a1f0e', g1: '#157e20', g2: '#35a427', g3: '#75e533', g4: '#c4ff7a',
  h1: '#1a0844', h2: '#3c1765', h3: '#6b3fa8', eye: '#fff7b0', eye2: '#ffe14a',
  m1: '#3a0419', m2: '#7a0d24', tongue: '#fc567e', tooth: '#ffffff',
  gl1: '#7a0d1a', gl2: '#e8283c', gl3: '#ff8a8a', cyan: '#63fafe', mag: '#fc567e', yel: '#ffe14a', white: '#ffffff', ink: '#06041a'
};
const THEMES = [
  { sky: ['#12062d', '#2b1049'], far: '#1a0844', far2: '#22105a', base: '#341356', lite: '#5b2a8f', dark: '#1a0844', edge: '#fc567e', edge2: '#63fafe', bolt: '#63fafe', bolt2: '#fc567e' },
  { sky: ['#06041a', '#102041'], far: '#0b162c', far2: '#13284a', base: '#133557', lite: '#21638f', dark: '#0b162c', edge: '#ffe14a', edge2: '#63fafe', bolt: '#ffe14a', bolt2: '#63fafe' },
  { sky: ['#07010c', '#1d235e'], far: '#0d0f2e', far2: '#161a45', base: '#3a0419', lite: '#6a1030', dark: '#14021e', edge: '#63fafe', edge2: '#fc567e', bolt: '#c8f6ff', bolt2: '#63fafe', rain: true },
  { sky: ['#0d0626', '#3a0419'], far: '#1c0618', far2: '#2a0a24', base: '#2b1049', lite: '#461a79', dark: '#12062d', edge: '#8bed36', edge2: '#fc567e', bolt: '#8bed36', bolt2: '#fc567e' },
  { sky: ['#06041a', '#2b0b4f'], far: '#120530', far2: '#1c0844', base: '#1c3a12', lite: '#35a427', dark: '#0b1d0a', edge: '#8bed36', edge2: '#ffe14a', bolt: '#c4ff7a', bolt2: '#fc567e', arena: true }
];

/* ---------- monster sprite (procedural pixel art, faces right) ---------- */
function monsterCanvas(o) {
  const c = document.createElement('canvas'); c.width = 24; c.height = 26;
  const g = c.getContext('2d');
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const glove = (x, y) => { P(x, y, 5, 5, C.gl1); P(x, y, 5, 4, C.gl2); P(x + 1, y, 2, 1, C.gl3); P(x + 1, y + 4, 3, 1, C.white); };
  const hy = 4 + (o.bob || 0), hx = o.hx || 0;
  // back glove + arm
  glove(o.gb[0], o.gb[1]);
  // legs
  const leg = (x, dy, ext) => {
    if (ext) { P(15, 19, 6, 3, C.g1); P(15, 19, 6, 1, C.g2); P(21, 18, 2, 4, C.out); return; }
    P(x, 20 + dy, 3, 4, C.g1); P(x, 20 + dy, 1, 4, C.g2); P(x - 1, 24 + dy, 4, 2, C.out);
  };
  leg(8, o.lb || 0, false); leg(13, o.lf || 0, o.kick);
  // torso
  P(7, 15, 10, 7, C.out); P(8, 15, 8, 6, C.g2); P(10, 16, 4, 4, C.g3);
  // head
  const X = hx;
  P(X + 6, hy, 12, 1, C.out); P(X + 5, hy + 1, 14, 1, C.out); P(X + 4, hy + 2, 16, 9, C.out); P(X + 5, hy + 11, 14, 1, C.out); P(X + 6, hy + 12, 12, 1, C.out);
  P(X + 6, hy + 1, 12, 1, C.g2); P(X + 5, hy + 2, 14, 9, C.g2); P(X + 6, hy + 11, 12, 1, C.g2);
  P(X + 7, hy + 2, 9, 2, C.g3); P(X + 8, hy + 2, 4, 1, C.g4); P(X + 5, hy + 9, 14, 2, C.g1);
  // ears
  P(X + 2, hy + 4, 3, 3, C.g2); P(X + 1, hy + 3, 1, 2, C.g2); P(X + 0, hy + 2, 1, 1, C.out); P(X + 2, hy + 7, 3, 1, C.out);
  P(X + 19, hy + 4, 3, 3, C.g2); P(X + 22, hy + 3, 1, 2, C.g2); P(X + 23, hy + 2, 1, 1, C.out); P(X + 19, hy + 7, 3, 1, C.out);
  // hair (mohawk)
  P(X + 5, hy - 1, 14, 3, C.h2); P(X + 5, hy - 1, 14, 1, C.h3);
  for (const [sx, sy] of [[4, -3], [8, -4], [12, -4], [16, -3]]) { P(X + sx, hy + sy, 3, 2, C.h2); P(X + sx + 1, hy + sy - 1, 1, 1, C.h3); P(X + sx, hy + sy + 1, 1, 1, C.h1); }
  // brow + eyes
  P(X + 6, hy + 3, 12, 1, C.g1);
  if (o.blink) { P(X + 8, hy + 5, 3, 1, C.g1); P(X + 14, hy + 5, 3, 1, C.g1); }
  else if (o.hurt) { P(X + 8, hy + 4, 1, 1, C.out); P(X + 10, hy + 4, 1, 1, C.out); P(X + 9, hy + 5, 1, 1, C.out); P(X + 8, hy + 6, 1, 1, C.out); P(X + 10, hy + 6, 1, 1, C.out);
    P(X + 14, hy + 4, 1, 1, C.out); P(X + 16, hy + 4, 1, 1, C.out); P(X + 15, hy + 5, 1, 1, C.out); P(X + 14, hy + 6, 1, 1, C.out); P(X + 16, hy + 6, 1, 1, C.out); }
  else {
    P(X + 8, hy + 4, 3, 3, C.eye2); P(X + 8, hy + 4, 2, 2, C.eye); P(X + 10, hy + 4, 1, 1, C.g1);
    P(X + 14, hy + 4, 3, 3, C.eye2); P(X + 15, hy + 4, 2, 2, C.eye); P(X + 14, hy + 4, 1, 1, C.g1);
  }
  P(X + 12, hy + 6, 2, 1, C.g1);
  // mouth
  if (o.mouth === 'closed') { P(X + 7, hy + 8, 11, 2, C.m1); for (const tx of [8, 10, 12, 14, 16]) P(X + tx, hy + 8, 1, 1, C.tooth); }
  else {
    P(X + 7, hy + 7, 11, 4, C.m1); P(X + 8, hy + 8, 9, 2, C.m2); P(X + 10, hy + 9, 5, 2, C.tongue);
    for (const tx of [8, 10, 12, 14, 16]) P(X + tx, hy + 7, 1, 1, C.tooth);
    P(X + 8, hy + 9, 1, 2, C.tooth); P(X + 16, hy + 9, 1, 2, C.tooth);
  }
  // front glove + arm
  if (o.punch) { P(14, 16, 6, 2, C.g1); P(14, 16, 6, 1, C.g2); }
  glove(o.gf[0], o.gf[1]);
  return c;
}
function tinted(src, color) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}
function flipped(src) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c;
}
const FRAME_DEFS = {
  idle0: { gb: [2, 16], gf: [17, 16], mouth: 'closed' },
  idle1: { gb: [2, 17], gf: [17, 17], bob: 1, mouth: 'closed' },
  blink: { gb: [2, 16], gf: [17, 16], mouth: 'closed', blink: true },
  run0: { gb: [3, 14], gf: [16, 17], lb: -1, lf: 1 },
  run1: { gb: [2, 16], gf: [17, 15], bob: 1 },
  run2: { gb: [3, 17], gf: [16, 14], lb: 1, lf: -1 },
  run3: { gb: [2, 15], gf: [17, 16], bob: 1 },
  jump: { gb: [1, 13], gf: [18, 12], lb: -2, lf: -1 },
  fall: { gb: [0, 15], gf: [19, 14], lb: 0, lf: 0 },
  punch: { gb: [5, 16], gf: [19, 13], punch: true, hx: 1 },
  kick: { gb: [3, 13], gf: [14, 14], kick: true, lb: 0 },
  smash: { gb: [7, 0], gf: [12, 0], lb: -1, lf: -1 },
  hurt: { gb: [0, 12], gf: [19, 12], hurt: true },
  win: { gb: [2, 6], gf: [17, 6], lb: 0 }
};
const SPR = {};
for (const [k, d] of Object.entries(FRAME_DEFS)) {
  const r = monsterCanvas(d);
  SPR[k] = [r, flipped(r)];
  const rg = tinted(r, 'rgba(255,70,40,.45)');
  SPR[k + '_rage'] = [rg, flipped(rg)];
  const wh = tinted(r, 'rgba(255,255,255,.85)');
  SPR[k + '_white'] = [wh, flipped(wh)];
}

/* ---------- audio ---------- */
let AC = null, master = null, musicGain = null, musicTimer = null, musicStep = 0, nextNoteTime = 0, musicTheme = -1;
let muted = !!save.muted;
function ensureAudio() {
  try {
    if (!AC) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      AC = new A(); master = AC.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(AC.destination);
      musicGain = AC.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function tone(freq, dur, type = 'square', vol = 0.15, slide = 0, delay = 0, dest) {
  if (!AC) return;
  const t0 = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g); g.connect(dest || master); o.start(t0); o.stop(t0 + dur + 0.02);
}
let noiseBuf = null;
function noise(dur, vol = 0.2, freq = 2000, delay = 0) {
  if (!AC) return;
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t0 = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
}
const SFX = {
  jump() { tone(300, 0.14, 'square', 0.1, 380); },
  token() { tone(988, 0.06, 'square', 0.08); tone(1480, 0.12, 'square', 0.08, 0, 0.05); },
  punch() { noise(0.09, 0.28, 1800); tone(150, 0.09, 'triangle', 0.3, -70); },
  kick() { tone(220, 0.12, 'triangle', 0.35, -140); noise(0.06, 0.12, 3500); },
  smash() { noise(0.4, 0.5, 700); tone(95, 0.35, 'sawtooth', 0.25, -55); },
  swing() { noise(0.12, 0.15, 1200); tone(180, 0.12, 'triangle', 0.2, -80); },
  hurt() { tone(260, 0.3, 'sawtooth', 0.16, -180); },
  stomp() { tone(560, 0.09, 'square', 0.14, -320); },
  spring() { tone(180, 0.32, 'triangle', 0.3, 760); },
  crate() { noise(0.14, 0.25, 2600); tone(320, 0.06, 'square', 0.08, -120); },
  zap() { noise(0.12, 0.12, 7000); tone(1200, 0.08, 'sawtooth', 0.05, -600); },
  heart() { [660, 880, 1100].forEach((f, i) => tone(f, 0.1, 'triangle', 0.18, 0, i * 0.06)); },
  checkpoint() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 'square', 0.1, 0, i * 0.07)); },
  rage() { [220, 277, 330, 440, 554, 660].forEach((f, i) => tone(f, 0.12, 'sawtooth', 0.12, 0, i * 0.05)); },
  bosshit() { noise(0.2, 0.35, 1200); tone(110, 0.25, 'square', 0.2, -40); },
  death() { [440, 370, 311, 262, 220, 165].forEach((f, i) => tone(f, 0.16, 'square', 0.12, 0, i * 0.12)); },
  clear() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i > 5 ? 0.5 : 0.13, 'square', 0.12, 0, i * 0.11)); },
  life() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, 'square', 0.12, 0, i * 0.08)); },
  pause() { tone(660, 0.08, 'square', 0.1); tone(440, 0.1, 'square', 0.1, 0, 0.08); },
  thud() { tone(70, 0.4, 'sine', 0.5, -20); noise(0.3, 0.3, 400); }
};
function sfx(name) { if (!muted && AC) try { SFX[name](); } catch (e) { /* ignore */ } }
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = [
  { bpm: 138, bass: [45, 45, 57, 45, 48, 48, 60, 48, 43, 43, 55, 43, 40, 40, 52, 47], lead: [69, 72, 76, 72, 72, 76, 79, 76, 67, 71, 74, 71, 64, 68, 71, 76] },
  { bpm: 128, bass: [38, 38, 50, 38, 41, 41, 53, 41, 36, 36, 48, 36, 43, 43, 55, 45], lead: [62, 65, 69, 74, 65, 69, 72, 77, 60, 64, 67, 72, 67, 71, 74, 79] },
  { bpm: 146, bass: [40, 40, 52, 40, 43, 43, 55, 43, 38, 38, 50, 38, 35, 35, 47, 42], lead: [64, 67, 71, 76, 67, 71, 74, 79, 62, 66, 69, 74, 59, 63, 66, 71] },
  { bpm: 152, bass: [41, 41, 53, 41, 44, 44, 56, 44, 39, 39, 51, 39, 36, 36, 48, 43], lead: [65, 68, 72, 77, 68, 72, 75, 80, 63, 67, 70, 75, 60, 64, 67, 72] },
  { bpm: 164, bass: [33, 33, 45, 33, 34, 34, 46, 34, 36, 36, 48, 36, 32, 32, 44, 39], lead: [69, 72, 75, 81, 70, 73, 76, 82, 72, 75, 78, 84, 68, 71, 74, 80] }
];
function startMusic(theme) {
  if (!AC || muted || !save.music) { musicTheme = theme; stopMusic(); return; }
  stopMusic(); musicTheme = theme; musicStep = 0; nextNoteTime = AC.currentTime + 0.05;
  musicTimer = setInterval(() => {
    if (!AC || state !== 'play') return;
    const song = SONGS[musicTheme] || SONGS[0], step = 60 / song.bpm / 2;
    while (nextNoteTime < AC.currentTime + 0.12) {
      const i = musicStep % 16, delay = Math.max(0, nextNoteTime - AC.currentTime);
      tone(midi(song.bass[i]), step * 0.9, 'triangle', 0.5, 0, delay, musicGain);
      if (musicStep % 2 === 0 || musicStep % 32 > 15) tone(midi(song.lead[(i + (musicStep >> 4)) % 16]), step * 0.5, 'square', 0.07, 0, delay, musicGain);
      if (i % 4 === 0) { /* kick drum */ tone(90, 0.08, 'sine', 0.35, -50, delay, musicGain); }
      nextNoteTime += step; musicStep++;
    }
  }, 30);
}
function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }
function setMuted(m) {
  muted = m; save.muted = m; persist();
  if (master) master.gain.value = m ? 0 : 0.55;
  if (!m && level && state === 'play') { ensureAudio(); startMusic(level.def.theme); }
}
function setMusic(on) {
  save.music = on; persist();
  if (!on) stopMusic(); else if (level && state === 'play') { ensureAudio(); startMusic(level.def.theme); }
}

/* ---------- input ---------- */
const keys = { left: 0, right: 0, up: 0, down: 0, jump: 0, punch: 0, kick: 0, smash: 0 };
const pressed = {};
let lastTouch = false;
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', KeyZ: 'jump',
  ArrowDown: 'smash', KeyS: 'smash', KeyL: 'smash', KeyJ: 'punch', KeyX: 'punch', KeyK: 'kick', KeyC: 'kick'
};
const MENU_PAD = { left: 'left', right: 'right', jump: 'ok', punch: 'up', smash: 'down', kick: 'back', up: 'up' };
function press(a) {
  if (menuActive()) { if (MENU_PAD[a]) menuInput(MENU_PAD[a]); return; }
  if (!keys[a]) pressed[a] = true; keys[a] = 1;
}
function release(a) { keys[a] = 0; }
let engaged = true; // false after the visitor clicks elsewhere on the page (arrow keys then scroll the page)
function gameFocused() { return engaged || (state !== 'menu'); }
const MENU_KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyJ: 'ok', KeyZ: 'ok', Escape: 'back', Backspace: 'back', KeyK: 'back', KeyX: 'back' };
addEventListener('keydown', e => {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (!gameFocused()) return;
  const a = KEYMAP[e.code];
  if (state === 'menu' && ui.screen === 'nick' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // typing on a keyboard: letters go straight in and the cursor jumps to OK, so Enter confirms
    if (e.key.length === 1 && e.key !== ' ' && cleanNick(e.key)) { e.preventDefault(); nickType(e.key); ui.sel = NICK_KEYS.indexOf('OK'); return; }
    if (e.key === 'Backspace') { e.preventDefault(); nickDel(); return; }
    if (e.key === 'Escape') { e.preventDefault(); cancelNick(); return; }
    if (e.key === 'Enter' || e.key === 'NumpadEnter') { e.preventDefault(); nickPress(ui.sel); return; }
  }
  if (menuActive()) {
    const m = MENU_KEYS[e.code];
    if (m || e.code === 'KeyP') e.preventDefault();
    if (e.repeat && m !== 'up' && m !== 'down') return;
    lastTouch = false;
    if (e.code === 'KeyP' && state === 'pause') { resumeGame(); return; }
    if (m) menuInput(m);
    return;
  }
  if (a || e.code === 'Escape' || e.code === 'KeyP' || e.code === 'KeyM') e.preventDefault();
  if (e.repeat) return;
  lastTouch = false;
  if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pauseGame(); return; }
  if (e.code === 'KeyM') { setMuted(!muted); return; }
  if (a) press(a);
});
addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) release(a); });
addEventListener('blur', () => { for (const k in keys) keys[k] = 0; if (state === 'play') pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') pauseGame(); });
// touch buttons
root.querySelectorAll('[data-btn]').forEach(btn => {
  const a = btn.dataset.btn;
  const down = e => { e.preventDefault(); lastTouch = true; engaged = true; ensureAudio(); press(a); btn.classList.add('is-down'); try { btn.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } };
  const up = e => { e.preventDefault(); release(a); btn.classList.remove('is-down'); };
  btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
  btn.addEventListener('contextmenu', e => e.preventDefault());
});
// gamepad
const padPrev = {};
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const p = pads && [...pads].find(Boolean);
  if (!p) return;
  const b = i => p.buttons[i] && p.buttons[i].pressed;
  const ax = p.axes[0] || 0;
  const ay = p.axes[1] || 0;
  const map = { left: ax < -0.4 || b(14), right: ax > 0.4 || b(15), jump: b(0), punch: b(2), kick: b(1), smash: b(3) || b(13) || ay > 0.6, up: b(12) || ay < -0.6 };
  for (const [a, v] of Object.entries(map)) { if (v && !padPrev[a]) { engaged = true; press(a); } if (!v && padPrev[a]) release(a); padPrev[a] = v; }
  const st = b(9); if (st && !padPrev.start) { engaged = true; if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); else if (menuActive()) menuInput('ok'); } padPrev.start = st;
}

/* ---------- level ---------- */
let level = null;
function buildLevel(idx) {
  const def = LEVELS[idx];
  const grid = Array.from({ length: ROWS }, () => []);
  let x0 = 0;
  for (const chunk of def.chunks) {
    const w = Math.max(...chunk.map(s => s.length)), pad = ROWS - chunk.length;
    for (let r = 0; r < ROWS; r++) { const s = r < pad ? '' : chunk[r - pad]; for (let c = 0; c < w; c++) grid[r][x0 + c] = s[c] || '.'; }
    x0 += w;
  }
  const L = {
    idx, def, theme: THEMES[def.theme], cols: x0, w: x0 * T, h: ROWS * T, grid,
    tokens: [], hearts: [], hints: [], checkpoints: [], plats: [], enemies: [], doors: [], finish: null, boss: null,
    start: { x: 2 * T, y: 11 * T }, totalTokens: 0
  };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < x0; c++) {
    const ch = grid[r][c], px = c * T, py = r * T;
    let keep = false;
    switch (ch) {
      case 'P': L.start = { x: px + 2, y: py - 4 }; break;
      case 'o': L.tokens.push({ x: px + 4, y: py + 4, w: 8, h: 8, got: false, ph: hash(c, r) * 6 }); break;
      case 'h': L.hearts.push({ x: px + 4, y: py + 4, w: 9, h: 8, got: false }); break;
      case 'K': L.checkpoints.push({ x: px + 2, y: py - 8, w: 12, h: 24, on: false, c, r }); break;
      case 'F': L.finish = { x: px - 18, y: py + T - 90, w: 51, h: 90 }; break;
      case 'b': L.enemies.push(makeEnemy('bagger', px + 1, py + 2)); break;
      case 's': L.enemies.push(makeEnemy('sparky', px + 2, py + 2)); break;
      case 'g': L.enemies.push(makeEnemy('glover', px, py + 4)); break;
      case 'M': L.plats.push({ x: px, y: py, w: 48, h: 6, bx: px, by: py, axis: 'x', range: 32, speed: 0.9, ph: 0, dx: 0, dy: 0 }); break;
      case 'V': case 'W': L.plats.push({ x: px, y: py, w: 48, h: 6, bx: px, by: py, axis: 'y', range: 48, speed: 0.7, ph: ch === 'W' ? Math.PI : 0, dx: 0, dy: 0 }); break;
      case 'Z': L.boss = makeBoss(px + T / 2, py); break;
      case 'D': L.doors.push({ c, r }); break;
      default:
        if (ch >= '0' && ch <= '9') L.hints.push({ x: px, y: py, id: ch });
        else keep = true;
    }
    if (!keep) grid[r][c] = '.';
  }
  L.totalTokens = L.tokens.length + countCrateTokens(grid);
  return L;
}
function countCrateTokens(grid) { let n = 0; for (const row of grid) for (const ch of row) if (ch === 'B') n += 3; return n; }
const SOLID = { '#': 1, 'B': 1, 'H': 1, 'X': 1, 'S': 1 };
function tile(c, r) {
  if (c < 0 || c >= level.cols) return '#';
  if (r < 0 || r >= ROWS) return '.';
  return level.grid[r][c];
}
const isSolid = ch => !!SOLID[ch];
function setTile(c, r, ch) { if (c >= 0 && c < level.cols && r >= 0 && r < ROWS) level.grid[r][c] = ch; }

/* ---------- physics ---------- */
function moveBody(b, dt, oneway = true) {
  b.hitWall = 0; b.hitCeil = false;
  b.x += b.vx * dt;
  if (b.vx !== 0) {
    const dir = b.vx > 0 ? 1 : -1;
    const c = Math.floor((dir > 0 ? b.x + b.w - 0.001 : b.x) / T);
    for (let r = Math.floor(b.y / T); r <= Math.floor((b.y + b.h - 0.001) / T); r++) {
      if (isSolid(tile(c, r))) { b.x = dir > 0 ? c * T - b.w : (c + 1) * T; b.vx = 0; b.hitWall = dir; b.wallC = c; b.wallR = r; break; }
    }
  }
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt;
  b.onGround = false;
  if (b.vy >= 0) {
    const r = Math.floor((b.y + b.h - 0.001) / T);
    for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - 0.001) / T); c++) {
      const ch = tile(c, r);
      if (isSolid(ch) || (oneway && ch === '=' && prevBottom <= r * T + 1 && !b.dropThrough)) {
        b.y = r * T - b.h; b.vy = 0; b.onGround = true; b.groundTile = ch; b.groundC = c; b.groundR = r; break;
      }
    }
  } else {
    const r = Math.floor(b.y / T);
    for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - 0.001) / T); c++) {
      if (isSolid(tile(c, r))) { b.y = (r + 1) * T; b.vy = 0; b.hitCeil = true; b.ceilC = c; break; }
    }
  }
}

/* ---------- entities ---------- */
function makeEnemy(type, x, y) {
  const e = { type, x, y, vx: 0, vy: 0, dir: -1, alive: true, dead: 0, t: Math.random() * 3, state: 'walk', hp: 1 };
  if (type === 'bagger') { e.w = 14; e.h = 14; e.vx = -28; e.hop = rnd(1.5, 3); }
  if (type === 'sparky') { e.w = 12; e.h = 12; e.bx = x; e.by = y; e.vx = 20; }
  if (type === 'glover') { e.w = 16; e.h = 12; e.vx = -36; }
  return e;
}
function makeBoss(cx, y) {
  return { cx, x: cx - 20, y: y - 10, w: 40, h: 56, hp: 8, maxHp: 8, state: 'wait', t: 0, swing: 0, vy: 0, inv: 0, hits: 0, next: 2.5, hangY: 2 * T, flash: 0, sparkT: 0 };
}

/* ---------- game state ---------- */
let state = 'menu';
let player = null, cam = { x: 0, y: 0 }, particles = [], popups = [], balls = [], waves = [];
let shake = 0, flash = 0, time = 0, stageTime = 0, introT = 0, clearT = 0;
let run = { score: 0, lives: 3, tokens: 0 };
let stageStats = null;

function newPlayer(x, y) {
  return {
    x, y, w: 12, h: 20, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0,
    hearts: 3, inv: 0, act: null, actT: 0, cdPunch: 0, cdKick: 0, cdSmash: 0, smashing: false,
    rage: 0, rageT: 0, anim: 0, blinkT: 2, onPlat: null, dropT: 0, safe: { x, y }, dying: 0, combo: 0, hitThisStage: false
  };
}
function startStage(idx, keepRun) {
  level = buildLevel(idx);
  if (!keepRun) run = { score: 0, lives: 3, tokens: 0 };
  player = newPlayer(level.start.x, level.start.y);
  player.check = { x: level.start.x, y: level.start.y };
  particles = []; popups = []; balls = []; waves = [];
  stageStats = { tokens: 0, startScore: run.score, enemies: 0, deaths: 0 };
  stageTime = 0; introT = 1.8; shake = 0; flash = 0;
  cam.x = clamp(player.x - W * 0.35, 0, level.w - W); cam.y = level.h <= H ? level.h - H : clamp(player.y - H * 0.55, 0, level.h - H);
  state = 'intro';
  // save: resume this stage with the score and lives it was started with
  save.run = { stage: idx, score: run.score, lives: run.lives, tokens: run.tokens, token: run.token || null }; persist();
  ensureAudio(); startMusic(level.def.theme);
  root.classList.add('is-playing');
}
function addScore(n, x, y, text, color) {
  run.score += n;
  if (x !== undefined) popups.push({ x, y, text: text || ('+' + n), color: color || C.white, t: 0, life: 0.9, scale: text && text.length < 8 && /!/.test(text) ? 2 : 1 });
}
function pop(x, y, text, color, scale = 2, life = 0.9) { popups.push({ x, y, text, color, t: 0, life, scale }); }
function burst(x, y, n, colors, speed = 120, grav = 400, size = 2) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rnd(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.3, life: rnd(0.35, 0.8), t: 0, color: colors[i % colors.length], size, grav });
  }
}
function addRage(n) {
  if (player.rageT > 0) return;
  player.rage = Math.min(100, player.rage + n);
  if (player.rage >= 100) { player.rageT = 7; player.rage = 100; sfx('rage'); pop(player.x + 6, player.y - 10, STR.pops.rage, C.yel, 2, 1.4); flash = 0.25; }
}
function gainToken(x, y) {
  run.tokens++; stageStats.tokens++; addScore(10); addRage(1); sfx('token');
  burst(x, y, 5, [C.yel, '#fff6b0'], 60, 200, 1);
  if (run.tokens % 100 === 0) { run.lives++; sfx('life'); pop(player.x + 6, player.y - 14, STR.pops.life, C.g3, 2, 1.2); }
}

/* ---------- breaking things ---------- */
function breakCrate(c, r) {
  const ch = tile(c, r);
  if (ch !== 'B' && ch !== 'H') return false;
  setTile(c, r, '.');
  sfx('crate'); shake = Math.max(shake, 0.08);
  burst(c * T + 8, r * T + 8, 12, ['#8a5a2b', '#c48a4a', C.mag, '#3c1765'], 140, 500, 2);
  addScore(50); addRage(3);
  if (ch === 'B') for (let i = 0; i < 3; i++) level.tokens.push({ x: c * T + 4, y: r * T + 4, w: 8, h: 8, got: false, ph: i, vx: (i - 1) * 50, vy: -160 - i * 20, loose: true });
  else level.hearts.push({ x: c * T + 4, y: r * T + 2, w: 9, h: 8, got: false, vy: -120, loose: true });
  return true;
}
function breakCracked(c, r) {
  // flood-fill connected cracked blocks
  const stack = [[c, r]]; let n = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (tile(x, y) !== 'X') continue;
    setTile(x, y, '.'); n++;
    burst(x * T + 8, y * T + 8, 8, ['#9b8fb8', '#d8d0ee', '#5d4f80'], 160, 600, 2);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  if (n) { addScore(20 * n); shake = Math.max(shake, 0.3); }
  return n;
}
function hitRect(rect, power, kind) {
  // crates
  let hit = false;
  for (let r = Math.floor(rect.y / T); r <= Math.floor((rect.y + rect.h - 1) / T); r++)
    for (let c = Math.floor(rect.x / T); c <= Math.floor((rect.x + rect.w - 1) / T); c++) if (breakCrate(c, r)) hit = true;
  // enemies
  for (const e of level.enemies) if (e.alive && overlap(rect, e)) { killEnemy(e, kind, rect.x + rect.w / 2 < e.x + e.w / 2 ? 1 : -1); hit = true; }
  // boss
  const B = level.boss;
  if (B && B.state !== 'gone' && B.state !== 'ko' && overlap(rect, B)) { if (hitBoss(power, kind)) hit = true; }
  return hit;
}
function killEnemy(e, kind, dir) {
  if (!e.alive) return;
  e.alive = false; e.dead = 1.2; e.killKind = kind; stageStats.enemies++;
  const words = { punch: 'POW!', kick: 'KICK!', smash: 'SMASH!', stomp: 'BAM!', rage: 'POW!', ball: 'KICK!' };
  if (kind === 'stomp') { e.squash = true; e.vx = 0; e.vy = 0; }
  else { e.vx = dir * 140; e.vy = -220; }
  player.combo = kind === 'stomp' ? player.combo + 1 : player.combo;
  // boss-spawned sparkies: flat 100, at most 20 per stage (keeps scores verifiable)
  const pts = e.spawned ? ((stageStats.spawnKills = (stageStats.spawnKills || 0) + 1) <= 20 ? 100 : 0) : kind === 'stomp' ? Math.min(1000, 100 * Math.pow(2, Math.max(0, player.combo - 1))) : 100;
  addScore(pts);
  pop(e.x + e.w / 2, e.y - 4, words[kind] || 'POW!', kind === 'kick' || kind === 'ball' ? C.g3 : kind === 'smash' ? C.yel : C.white, 2, 0.8);
  popups.push({ x: e.x + e.w / 2, y: e.y + 8, text: '+' + pts, color: C.yel, t: 0, life: 0.8, scale: 1 });
  burst(e.x + e.w / 2, e.y + e.h / 2, 10, e.type === 'sparky' ? [C.cyan, C.white] : e.type === 'glover' ? [C.gl2, C.white] : [C.h3, C.cyan], 150, 300, 2);
  sfx(kind === 'stomp' ? 'stomp' : kind === 'smash' ? 'smash' : 'punch');
  addRage(10);
  shake = Math.max(shake, 0.1);
}
function hitBoss(power, kind) {
  const B = level.boss;
  if (B.state !== 'dazed' || B.inv > 0) { if (B.state !== 'wait') { sfx('thud'); } return false; }
  B.hp = Math.max(0, B.hp - power); B.inv = 0.45; B.flash = 0.2; B.hits++;
  addScore(300); sfx('bosshit'); shake = 0.25;
  const words = { punch: 'POW!', kick: 'KICK!', ball: 'KICK!', smash: 'SMASH!', stomp: 'BAM!', rage: 'POW!' };
  pop(B.x + B.w / 2, B.y - 6, words[kind] || 'BAM!', C.yel, 3, 0.9);
  burst(B.x + B.w / 2, B.y + B.h / 2, 16, [C.h3, C.cyan, C.white], 200, 300, 2);
  if (B.hp <= 0) { B.state = 'ko'; B.t = 0; addScore(5000); pop(B.x + B.w / 2, B.y - 20, STR.pops.ko, C.mag, 4, 2); sfx('clear'); stopMusic(); }
  else if (B.hits >= 3) { B.state = 'rise'; B.t = 0; }
  return true;
}

/* ---------- player ---------- */
function hurtPlayer(srcX) {
  const p = player;
  if (p.inv > 0 || p.rageT > 0 || p.dying) return;
  p.hearts--; p.hitThisStage = true;
  p.inv = 1.5; p.vy = -220; p.vx = (p.x + p.w / 2 < srcX ? -1 : 1) * 140; p.act = null; p.smashing = false;
  sfx('hurt'); shake = 0.2; flash = 0.12;
  burst(p.x + 6, p.y + 8, 8, [C.mag, C.white], 120, 300, 2);
  if (p.hearts <= 0) killPlayer();
}
function killPlayer() {
  const p = player;
  if (p.dying) return;
  p.dying = 1; p.vy = -320; p.vx = 0; p.hearts = 0; stageStats.deaths++;
  state = 'dying'; stopMusic(); sfx('death');
}
function respawn() {
  const p = player;
  run.lives--;
  if (run.lives < 0) { gameOver(); return; }
  const cp = p.check;
  const np = newPlayer(cp.x, cp.y);
  np.check = cp; np.hitThisStage = true; np.inv = 1.5; np.rage = Math.floor(p.rage / 2);
  player = np;
  balls = []; waves = [];
  if (level.boss && level.boss.state !== 'gone' && level.boss.state !== 'ko' && level.boss.state !== 'wait') resetBossArena();
  state = 'play'; startMusic(level.def.theme);
}
function resetBossArena() {
  const B = level.boss, nb = makeBoss(B.cx, B.y);
  nb.hp = B.hp; nb.y = nb.hangY - 40; level.boss = nb;
  for (const d of level.doors) setTile(d.c, d.r, '.');
  level.enemies = level.enemies.filter(e => !e.spawned);
}
function updatePlayer(dt) {
  const p = player;
  if (p.dying) {
    p.vy += 900 * dt; p.y += p.vy * dt; p.dying += dt;
    if (p.dying > 2.4) respawn();
    return;
  }
  const rage = p.rageT > 0;
  const maxRun = rage ? 160 : 125;
  // timers
  p.inv = Math.max(0, p.inv - dt); p.cdPunch -= dt; p.cdKick -= dt; p.cdSmash -= dt; p.actT -= dt; p.dropT -= dt;
  if (p.rageT > 0) { p.rageT -= dt; if (p.rageT <= 0) { p.rage = 0; } }
  if (p.actT <= 0 && !p.smashing) p.act = null;
  // horizontal
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const locked = p.smashing || (p.act === 'swing' && p.onGround);
  if (!locked) {
    if (dir) {
      const acc = p.onGround ? 1100 : 780;
      if (Math.sign(p.vx) !== dir && p.onGround) p.vx += dir * 1500 * dt; else p.vx += dir * acc * dt;
      p.vx = clamp(p.vx, -maxRun, maxRun); p.face = dir;
    } else {
      const dec = (p.onGround ? 1400 : 300) * dt;
      p.vx = Math.abs(p.vx) <= dec ? 0 : p.vx - Math.sign(p.vx) * dec;
    }
  } else if (p.smashing) p.vx = 0; else p.vx *= 0.8;
  // jump (coyote + buffer + variable height)
  p.coyote = p.onGround ? 0.1 : p.coyote - dt;
  if (pressed.jump) p.jumpBuf = 0.13; else p.jumpBuf -= dt;
  if (p.jumpBuf > 0 && keys.smash && p.onGround && p.groundTile === '=') { p.dropThrough = true; p.dropT = 0.25; p.jumpBuf = 0; p.onGround = false; }
  else if (p.jumpBuf > 0 && p.coyote > 0 && !p.smashing) {
    p.vy = rage ? -365 : -345; p.onGround = false; p.coyote = 0; p.jumpBuf = 0; p.onPlat = null; sfx('jump');
    burst(p.x + 6, p.y + p.h, 4, ['#9b8fb8', C.white], 40, 50, 1);
  }
  if (!keys.jump && p.vy < -120 && !p.springing) p.vy = -120;
  if (p.vy >= 0) p.springing = false;
  if (p.dropT <= 0) p.dropThrough = false;
  // actions
  if (pressed.punch && p.cdPunch <= 0) { p.act = 'punch'; p.actT = 0.2; p.cdPunch = 0.3; p.punchHit = false; sfx('swing'); }
  if (pressed.kick && p.cdKick <= 0) {
    p.act = 'kick'; p.actT = 0.25; p.cdKick = 0.55; p.kickHit = false; sfx('kick');
    if (!balls.length) balls.push({ x: p.face > 0 ? p.x + p.w : p.x - 8, y: p.y + 10, w: 8, h: 8, vx: p.face * 230 + p.vx * 0.3, vy: -90, life: 2.6, spin: 0, hits: 0 });
  }
  if (pressed.smash && !keys.jump) {
    if (!p.onGround && !p.smashing) { p.smashing = true; p.act = 'smash'; p.vy = 120; p.vx = 0; sfx('swing'); }
    else if (p.onGround && p.cdSmash <= 0 && !p.smashing) { p.act = 'swing'; p.actT = 0.3; p.cdSmash = 0.6; groundSwing(); }
  }
  // gravity
  if (p.smashing) p.vy = Math.min(p.vy + 2400 * dt, 600);
  else p.vy = Math.min(p.vy + 980 * dt, 430);
  // moving platform carry
  if (p.onPlat) { p.x += p.onPlat.dx; p.y = p.onPlat.y - p.h; }
  const wasAir = !p.onGround, fallSpeed = p.vy;
  moveBody(p, dt);
  // platforms (one-way tops)
  p.onPlat = null;
  if (p.vy >= 0 && !p.dropThrough) {
    for (const pl of level.plats) {
      const prevBottom = p.y + p.h - p.vy * dt - pl.dy;
      if (p.x + p.w > pl.x && p.x < pl.x + pl.w && p.y + p.h >= pl.y && prevBottom <= pl.y + 3) {
        p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.onPlat = pl; p.groundTile = '='; break;
      }
    }
  }
  // spring
  if (p.onGround && p.groundTile === 'S') {
    const strong = p.smashing;
    p.vy = strong ? -700 : -520; p.onGround = false; p.springing = true; p.smashing = false; p.act = null;
    sfx('spring'); level.springT = level.springT || {}; level.springT[p.groundC + ',' + p.groundR] = 0.3;
    if (strong) pop(p.x + 6, p.y - 6, 'MEGA!', C.yel, 2, 0.8);
  }
  // landing
  if (p.onGround && wasAir) {
    p.combo = 0;
    if (p.smashing) smashLand();
    else if (fallSpeed > 300) burst(p.x + 6, p.y + p.h, 5, ['#9b8fb8', C.white], 50, 60, 1);
  }
  if (p.onGround && p.smashing) smashLand();
  // safe spot for pit respawn
  if (p.onGround && !p.onPlat && p.groundTile !== 'S') {
    const r = Math.floor((p.y + p.h) / T);
    const l = tile(Math.floor(p.x / T), r), rr = tile(Math.floor((p.x + p.w - 1) / T), r);
    if ((isSolid(l) || l === '=') && (isSolid(rr) || rr === '=') && !hazardAt(p)) p.safe = { x: p.x, y: p.y };
  }
  // punch / kick hitboxes
  if (p.act === 'punch' && p.actT < 0.17 && !p.punchHit) {
    const rect = { x: p.face > 0 ? p.x + p.w - 2 : p.x - 16, y: p.y + 3, w: 18, h: 13 };
    if (hitRect(rect, 1, 'punch')) { p.punchHit = true; burst(rect.x + rect.w / 2, rect.y + 6, 6, [C.yel, C.white], 90, 100, 1); }
  }
  if (p.act === 'kick' && p.actT < 0.2 && !p.kickHit) {
    const rect = { x: p.face > 0 ? p.x + p.w - 2 : p.x - 14, y: p.y + 10, w: 16, h: 10 };
    if (hitRect(rect, 1, 'kick')) p.kickHit = true;
  }
  // rage contact kills
  if (rage) for (const e of level.enemies) if (e.alive && overlap(p, e)) killEnemy(e, 'rage', p.x < e.x ? 1 : -1);
  if (rage && level.boss && overlap(p, level.boss) && level.boss.state === 'dazed') hitBoss(1, 'rage');
  // hazards
  if (hazardAt(p)) { hurtPlayer(p.x + p.w / 2 - p.face * 4); if (!p.dying) { p.vy = -260; sfx('zap'); } }
  // pits
  if (p.y > level.h + 30) {
    p.hearts--; p.hitThisStage = true;
    if (p.hearts <= 0) { p.y = level.h + 30; killPlayer(); }
    else { p.x = p.safe.x; p.y = p.safe.y; p.vx = 0; p.vy = 0; p.inv = 1.5; sfx('hurt'); flash = 0.15; }
  }
  // pickups
  for (const t of level.tokens) if (!t.got && overlap(p, t)) { t.got = true; gainToken(t.x + 4, t.y + 4); }
  for (const h of level.hearts) if (!h.got && overlap(p, h)) {
    h.got = true; sfx('heart');
    if (p.hearts < 3) { p.hearts++; pop(p.x + 6, p.y - 8, STR.pops.heart, C.mag, 1, 1); } else { addScore(500, p.x + 6, p.y - 8); }
  }
  for (const k of level.checkpoints) if (!k.on && overlap(p, k)) {
    k.on = true; p.check = { x: k.x, y: k.y + k.h - p.h }; sfx('checkpoint');
    pop(k.x + 6, k.y - 8, STR.pops.save, C.g3, 1, 1.2); burst(k.x + 6, k.y, 12, [C.g3, C.yel], 100, 200, 1);
    if (p.hearts < 3) p.hearts = 3;
  }
  if (level.finish && overlap(p, level.finish) && p.onGround) stageClear();
  // anim
  p.anim += dt * (Math.abs(p.vx) / 40 + 1);
  p.blinkT -= dt; if (p.blinkT < -0.12) p.blinkT = rnd(2, 4);
}
function hazardAt(b) {
  const r0 = Math.floor((b.y + 4) / T), r1 = Math.floor((b.y + b.h - 1) / T);
  for (let r = r0; r <= r1; r++) for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - 1) / T); c++)
    if (tile(c, r) === '^' && b.y + b.h > r * T + 7) return true;
  return false;
}
function groundSwing() {
  const p = player; sfx('smash'); shake = 0.15;
  const rect = { x: p.face > 0 ? p.x + p.w - 2 : p.x - 18, y: p.y, w: 20, h: p.h };
  hitRect(rect, 1, 'smash');
  // cracked walls next to the monster
  const c = p.face > 0 ? Math.floor((p.x + p.w + 3) / T) : Math.floor((p.x - 4) / T);
  for (let r = Math.floor(p.y / T); r <= Math.floor((p.y + p.h - 1) / T); r++) if (tile(c, r) === 'X') { breakCracked(c, r); pop(c * T + 8, r * T, 'SMASH!', C.yel, 2, 0.8); }
  burst(rect.x + rect.w / 2, p.y + p.h, 8, ['#9b8fb8', C.yel], 120, 300, 1);
}
function smashLand() {
  const p = player;
  p.smashing = false; p.act = 'smash'; p.actT = 0.25;
  sfx('smash'); shake = 0.35;
  const r = Math.floor((p.y + p.h + 1) / T);
  let broke = 0;
  for (let c = Math.floor((p.x - 4) / T); c <= Math.floor((p.x + p.w + 3) / T); c++) {
    if (tile(c, r) === 'X') broke += breakCracked(c, r);
    if (tile(c, r) === 'B' || tile(c, r) === 'H') breakCrate(c, r);
  }
  if (broke) pop(p.x + 6, p.y - 8, 'SMASH!', C.yel, 2, 0.9);
  // shockwave
  const zone = { x: p.x - 52, y: p.y - 10, w: p.w + 104, h: p.h + 14 };
  for (const e of level.enemies) if (e.alive && overlap(zone, e)) killEnemy(e, 'smash', e.x > p.x ? 1 : -1);
  const B = level.boss;
  if (B && Math.abs(B.x + B.w / 2 - (p.x + 6)) < 72 && B.state === 'dazed') hitBoss(2, 'smash');
  for (let i = 0; i < 2; i++) particles.push({ ring: true, x: p.x + 6, y: p.y + p.h, r: 4, vr: 220, t: 0, life: 0.3, color: i ? C.cyan : C.yel });
  burst(p.x + 6, p.y + p.h, 14, ['#9b8fb8', C.yel, C.white], 160, 400, 2);
}

/* ---------- enemies, balls, platforms, boss ---------- */
function updatePlats(dt) {
  for (const pl of level.plats) {
    const ox = pl.x, oy = pl.y;
    const s = Math.sin(time * pl.speed + pl.ph) * pl.range;
    if (pl.axis === 'x') pl.x = pl.bx + s; else pl.y = pl.by + s;
    pl.dx = pl.x - ox; pl.dy = pl.y - oy;
  }
}
function updateEnemies(dt) {
  const p = player;
  for (const e of level.enemies) {
    e.t += dt;
    if (!e.alive) {
      e.dead -= dt;
      if (!e.squash) { e.vy += 900 * dt; e.x += e.vx * dt; e.y += e.vy * dt; }
      continue;
    }
    if (Math.abs(e.x - p.x) > W * 1.3 && e.type !== 'sparky') continue; // sleep off-screen
    if (e.type === 'sparky') {
      e.x += e.vx * dt;
      if (Math.abs(e.x - e.bx) > 40) { e.vx = -e.vx; e.x = e.bx + Math.sign(e.x - e.bx) * 40; }
      e.y = e.by + Math.sin(e.t * 2.4) * 14;
      if (Math.random() < dt * 2) particles.push({ x: e.x + rnd(0, 12), y: e.y + rnd(0, 12), vx: rnd(-30, 30), vy: rnd(-30, 30), life: 0.2, t: 0, color: C.cyan, size: 1, grav: 0 });
    } else {
      if (e.type === 'glover') {
        const dx = p.x - e.x, seen = Math.abs(dx) < 7 * T && Math.abs(p.y + p.h - (e.y + e.h)) < 28;
        if (e.state === 'walk' && seen && Math.sign(dx) === Math.sign(e.vx || e.dir)) { e.state = 'wind'; e.st = 0.45; e.dir = Math.sign(dx); e.vx = 0; }
        else if (e.state === 'wind') { e.st -= dt; e.vx = 0; if (e.st <= 0) { e.state = 'charge'; e.vx = e.dir * 175; } }
        else if (e.state === 'dizzy') { e.st -= dt; e.vx = 0; if (e.st <= 0) { e.state = 'walk'; e.vx = -e.dir * 36; } }
      }
      if (e.type === 'bagger') { e.hop -= dt; if (e.hop <= 0 && e.onGround) { e.vy = -170; e.hop = rnd(1.6, 3.2); } }
      e.vy = Math.min(e.vy + 900 * dt, 400);
      const before = e.vx;
      moveBody(e, dt);
      if (e.hitWall) {
        if (e.state === 'charge') { e.state = 'dizzy'; e.st = 1.1; shake = 0.1; sfx('thud'); }
        else e.vx = -before;
      }
      // turn at ledges
      if (e.onGround && e.vx) {
        const fx = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
        const below = tile(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
        if (!isSolid(below) && below !== '=') { if (e.state === 'charge') { e.state = 'dizzy'; e.st = 1.1; } e.vx = e.state === 'dizzy' ? 0 : -e.vx; }
      }
      if (e.vx) e.dir = Math.sign(e.vx);
      if (e.y > level.h + 40) e.alive = false;
    }
    // vs player
    if (!p.dying && overlap(p, e)) {
      const stomping = p.vy > 40 && p.y + p.h - e.y < 10 && e.type !== 'sparky';
      if (p.smashing && e.type !== 'sparky') { killEnemy(e, 'smash', 1); }
      else if (stomping) { killEnemy(e, 'stomp', 1); p.vy = keys.jump ? -360 : -240; p.y = e.y - p.h; }
      else if (p.rageT > 0) killEnemy(e, 'rage', p.x < e.x ? 1 : -1);
      else { hurtPlayer(e.x + e.w / 2); if (e.type === 'sparky') sfx('zap'); }
    }
  }
  level.enemies = level.enemies.filter(e => e.alive || e.dead > 0);
}
function updateBalls(dt) {
  for (const b of balls) {
    b.life -= dt; b.vy = Math.min(b.vy + 700 * dt, 400); b.spin += b.vx * dt * 0.2;
    const vx = b.vx;
    moveBody(b, dt, true);
    if (b.hitWall) {
      b.vx = -vx * 0.8;
      // break crates the ball hits
      if (breakCrate(b.wallC, b.wallR)) { b.vx = -b.vx; }
    }
    if (b.onGround) { b.vy = -Math.max(80, Math.abs(b.vy) + 140) * 0.9; if (Math.abs(b.vx) < 60) b.life = Math.min(b.life, 0.3); }
    if (b.hitCeil) breakCrate(b.ceilC, Math.floor(b.y / T) - 1);
    for (const e of level.enemies) if (e.alive && overlap(b, e)) { killEnemy(e, 'ball', Math.sign(b.vx) || 1); b.hits++; b.vx *= 0.9; }
    const B = level.boss;
    if (B && B.state !== 'gone' && B.state !== 'ko' && overlap(b, B) && !b.bossHit) { b.bossHit = true; hitBoss(1, 'ball'); b.vx = -b.vx * 0.7; b.vy = -200; }
    if (b.y > level.h + 20) b.life = 0;
  }
  balls = balls.filter(b => b.life > 0);
}
function updateWaves(dt) {
  for (const w of waves) {
    w.x += w.dir * w.speed * dt; w.life -= dt;
    const c = Math.floor((w.dir > 0 ? w.x + w.w : w.x) / T), r = Math.floor((w.y + w.h - 2) / T);
    if (isSolid(tile(c, r))) w.life = 0;
    if (!player.dying && overlap(player, w)) hurtPlayer(w.x + w.w / 2);
    if (Math.random() < dt * 30) particles.push({ x: w.x + rnd(0, w.w), y: w.y + w.h, vx: rnd(-20, 20), vy: rnd(-80, -20), life: 0.3, t: 0, color: w.dir > 0 ? C.cyan : C.mag, size: 1, grav: 100 });
  }
  waves = waves.filter(w => w.life > 0);
}
function updateBoss(dt) {
  const B = level.boss; if (!B || B.state === 'gone') return;
  const p = player, floorY = 13 * T;
  B.t += dt; B.inv = Math.max(0, B.inv - dt); B.flash = Math.max(0, B.flash - dt);
  const phase2 = B.hp <= B.maxHp / 2;
  const A = 9 * T;
  switch (B.state) {
    case 'wait':
      B.y = -B.h - 10;
      if (p.x > B.cx - 13 * T) {
        for (const d of level.doors) setTile(d.c, d.r, '#');
        B.state = 'intro'; B.t = 0; sfx('thud'); shake = 0.4; pop(B.cx, 4 * T, STR.pops.boss, C.mag, 3, 1.6);
      }
      break;
    case 'intro':
      B.y = Math.min(B.hangY, B.y + 160 * dt); B.x = B.cx - B.w / 2;
      if (B.t > 1.6) { B.state = 'swing'; B.t = 0; B.swing = 0; B.next = 2.2; }
      break;
    case 'swing':
      B.swing += dt * (phase2 ? 1.6 : 1.1);
      B.x = B.cx + Math.sin(B.swing) * A - B.w / 2; B.y = B.hangY + Math.abs(Math.cos(B.swing)) * 6;
      B.next -= dt;
      if (B.next <= 0) { B.state = 'tele'; B.t = 0; pop(B.x + B.w / 2, B.y - 8, '!', C.yel, 3, 0.6); }
      break;
    case 'tele':
      if (B.t > (phase2 ? 0.45 : 0.65)) { B.state = 'drop'; B.vy = 0; }
      break;
    case 'drop':
      B.vy += 1700 * dt; B.y += B.vy * dt;
      if (B.y + B.h >= floorY) {
        B.y = floorY - B.h; B.state = 'dazed'; B.t = 0; B.hits = 0; shake = 0.5; sfx('thud'); sfx('smash');
        const mk = (dir, delay) => waves.push({ x: B.x + (dir > 0 ? B.w - 4 : -8), y: floorY - 12, w: 12, h: 12, dir, speed: phase2 ? 170 : 140, life: 3 + delay, delay });
        mk(1, 0); mk(-1, 0);
        if (phase2) setTimeout(() => { if (level && level.boss === B && B.state !== 'ko') { waves.push({ x: B.x + B.w - 4, y: floorY - 12, w: 12, h: 12, dir: 1, speed: 120, life: 3 }); waves.push({ x: B.x - 8, y: floorY - 12, w: 12, h: 12, dir: -1, speed: 120, life: 3 }); } }, 450);
        burst(B.x + B.w / 2, floorY, 20, ['#9b8fb8', C.yel, C.white], 200, 500, 2);
        if (phase2 && level.enemies.filter(e => e.alive && e.spawned).length < 2) {
          const e = makeEnemy('sparky', B.x + B.w / 2 - 6, 6 * T); e.spawned = true; e.bx = clamp(p.x, 4 * T, 26 * T); level.enemies.push(e);
        }
      }
      break;
    case 'dazed':
      if (B.t > (phase2 ? 2.1 : 2.6)) { B.state = 'rise'; B.t = 0; }
      break;
    case 'rise':
      B.y -= 140 * dt;
      if (B.y <= B.hangY) {
        B.y = B.hangY; B.state = 'swing'; B.next = phase2 ? rnd(1.4, 2.2) : rnd(2.2, 3.2);
        B.swing = Math.asin(clamp((B.x + B.w / 2 - B.cx) / A, -1, 1));
      }
      break;
    case 'ko':
      if (Math.random() < dt * 20) burst(B.x + rnd(0, B.w), B.y + rnd(0, B.h), 6, [C.h3, C.cyan, C.yel, C.mag], 180, 300, 2);
      B.y += 20 * dt;
      if (B.t > 2.2) {
        B.state = 'gone'; shake = 0.6; flash = 0.4; sfx('smash');
        burst(B.x + B.w / 2, B.y + B.h / 2, 60, [C.h3, C.cyan, C.yel, C.mag, C.white], 260, 300, 3);
        level.finish = { x: B.cx + 8 * T - 26, y: floorY - 90, w: 51, h: 90, appear: 0 };
        for (let i = 0; i < 12; i++) level.tokens.push({ x: B.x + B.w / 2, y: B.y + 20, w: 8, h: 8, got: false, ph: i, vx: rnd(-140, 140), vy: rnd(-320, -160), loose: true });
        for (const e of level.enemies) if (e.alive) killEnemy(e, 'smash', 1);
        startMusic(level.def.theme);
      }
      break;
  }
  // contact
  if (!p.dying && overlap(p, B) && B.state !== 'ko' && B.state !== 'wait') {
    if (B.state === 'dazed') {
      if (p.vy > 40 && p.y + p.h - B.y < 12) { hitBoss(1, 'stomp'); p.vy = -330; p.y = B.y - p.h; }
    } else hurtPlayer(B.x + B.w / 2);
  }
}
function updateLoose(dt) {
  for (const t of level.tokens) if (t.loose && !t.got) {
    t.vy = (t.vy || 0) + 700 * dt; t.vx = (t.vx || 0) * 0.99;
    moveBody(t, dt); if (t.onGround) { t.vy = 0; t.vx *= 0.8; }
    if (t.y > level.h + 20) t.got = true;
  }
  for (const h of level.hearts) if (h.loose && !h.got) { h.vx = 0; h.vy = (h.vy || 0) + 700 * dt; moveBody(h, dt); }
}
function updateFx(dt) {
  for (const q of particles) {
    q.t += dt;
    if (q.ring) { q.r += q.vr * dt; continue; }
    q.vy += q.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt;
  }
  particles = particles.filter(q => q.t < q.life);
  if (particles.length > 500) particles.splice(0, particles.length - 500);
  for (const q of popups) { q.t += dt; q.y -= 22 * dt; }
  popups = popups.filter(q => q.t < q.life);
  shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
  if (level.springT) for (const k in level.springT) level.springT[k] = Math.max(0, level.springT[k] - dt);
}
function updateCamera(dt, snap) {
  const p = player;
  const look = p.face * 40 + p.vx * 0.15;
  const tx = clamp(p.x + p.w / 2 - W / 2 + look, 0, Math.max(0, level.w - W));
  const ty = level.h <= H ? level.h - H : clamp(p.y + p.h / 2 - H * 0.55, 0, level.h - H);
  if (snap) { cam.x = tx; cam.y = ty; return; }
  cam.x += (tx - cam.x) * Math.min(1, dt * 6);
  cam.y += (ty - cam.y) * Math.min(1, dt * 4);
}

/* ---------- stage flow ---------- */
function stageClear() {
  if (state !== 'play') return;
  state = 'clear'; clearT = 0; stopMusic(); sfx('clear');
  const def = level.def, tokens = stageStats.tokens, total = Math.max(1, level.totalTokens);
  const timeBonus = Math.max(0, Math.round(def.par - stageTime)) * 20;
  const perfect = !player.hitThisStage ? 2000 : 0;
  const allTokens = tokens >= total ? 1000 : 0;
  const heartsBonus = player.hearts * 300;
  run.score += timeBonus + perfect + allTokens + heartsBonus;
  const stageScore = run.score - stageStats.startScore;
  claimStage(run, level.idx, Math.floor(stageTime), stageScore);
  const pts = (tokens / total) * 60 + (!player.hitThisStage ? 20 : 0) + (stageTime <= def.par ? 20 : 0);
  const prevBest = save.best[level.idx] | 0;
  let rank = pts >= 80 ? 'monster' : pts >= 50 ? 'great' : 'good';
  const record = prevBest > 0 && stageScore > prevBest;
  if (stageScore > prevBest) save.best[level.idx] = stageScore;
  if (record) rank = 'record';
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, level.idx + 2));
  save.top = Math.max(save.top, run.score);
  persist();
  player.vx = 0; player.act = 'win';
  const last = level.idx === LEVELS.length - 1;
  save.run = last ? null : { stage: level.idx + 1, score: run.score, lives: run.lives, tokens: run.tokens, token: run.token || null };
  persist();
  ui.tally = {
    t: -1.2, shown: 0, last, rank,
    rows: [
      [UI.tokens, tokens + '/' + total],
      [UI.time, Math.floor(stageTime) + ' S'],
      [UI.timeBonus, '+' + timeBonus],
      [UI.perfect, perfect ? '+' + perfect : '-'],
      [UI.allTokens, allTokens ? '+' + allTokens : '-'],
      [UI.hearts, '+' + heartsBonus],
      [UI.stageScore, fmt(stageScore)],
      [UI.total, fmt(run.score)]
    ]
  };
  ui.sel = 0;
}
function gameOver() {
  state = 'over'; stopMusic(); ui.sel = 0;
  save.top = Math.max(save.top, run.score); persist();
  recordRun('E' + (level.idx + 1));
}
function pauseGame() { if (state !== 'play') return; state = 'pause'; ui.screen = 'pause'; ui.sel = 0; sfx('pause'); stopMusic(); }
function resumeGame() { if (state !== 'pause') return; state = 'play'; ensureAudio(); startMusic(level.def.theme); }

/* ---------- rendering ---------- */
let skyGrad = null, skyTheme = -1;
function drawBackground(th, t) {
  if (skyTheme !== level.def.theme) { skyGrad = ctx.createLinearGradient(0, 0, 0, H); skyGrad.addColorStop(0, th.sky[0]); skyGrad.addColorStop(1, th.sky[1]); skyTheme = level.def.theme; }
  ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, H);
  // stars
  for (let i = 0; i < 50; i++) {
    const x = ((hash(i, 1) * W * 3 - cam.x * 0.05) % W + W) % W, y = hash(i, 2) * H * 0.6;
    ctx.fillStyle = hash(i, 3) > 0.7 ? th.edge2 : '#ffffff'; ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + i)); ctx.fillRect(x | 0, y | 0, 1, 1);
  }
  ctx.globalAlpha = 1;
  // big lightning (sky)
  const boltCycle = (t * 0.35) % 1;
  if (boltCycle < 0.06 || (th.rain && (t * 0.6) % 1 < 0.05)) {
    const seed = Math.floor(t * 0.35 + (th.rain ? t * 0.6 : 0)), bx = hash(seed, 9) * W;
    ctx.strokeStyle = hash(seed, 4) > 0.5 ? th.bolt : th.bolt2; ctx.lineWidth = 2; ctx.beginPath();
    let x = bx, y = 0; ctx.moveTo(x, y);
    for (let i = 0; i < 8; i++) { x += (hash(seed, i + 20) - 0.5) * 30; y += 14; ctx.lineTo(x, y); }
    ctx.stroke(); ctx.lineWidth = 1;
    if (th.rain) { ctx.fillStyle = 'rgba(200,240,255,.08)'; ctx.fillRect(0, 0, W, H); }
  }
  // far layer: arcade/city silhouettes
  const par1 = 0.2, ox = cam.x * par1, base1 = H - 40 - cam.y * 0.1;
  for (let k = Math.floor(ox / 34) - 1; k < Math.floor((ox + W) / 34) + 2; k++) {
    const h = 30 + hash(k, 7) * 70, w = 22 + hash(k, 8) * 12, x = k * 34 - ox;
    ctx.fillStyle = th.far; ctx.fillRect(x | 0, (base1 - h) | 0, w | 0, h + 60);
    if (hash(k, 11) > 0.55) { ctx.fillStyle = hash(k, 12) > 0.5 ? th.edge : th.edge2; ctx.globalAlpha = 0.35; ctx.fillRect((x + 4) | 0, (base1 - h + 6) | 0, (w - 8) | 0, 2); ctx.globalAlpha = 1; }
    for (let j = 0; j < 6; j++) if (hash(k, 30 + j) > 0.75) { ctx.fillStyle = 'rgba(255,225,74,.25)'; ctx.fillRect((x + 4 + (j % 3) * 6) | 0, (base1 - h + 14 + ((j / 3) | 0) * 10) | 0, 2, 3); }
  }
  // mid layer
  const par2 = 0.45, ox2 = cam.x * par2, base2 = H - 18 - cam.y * 0.2;
  for (let k = Math.floor(ox2 / 60) - 1; k < Math.floor((ox2 + W) / 60) + 2; k++) {
    const x = k * 60 - ox2, h = 18 + hash(k, 17) * 34;
    ctx.fillStyle = th.far2; ctx.fillRect(x | 0, (base2 - h) | 0, 44, h + 40);
    if (level.def.theme === 1) { // gears
      const cx = x + 22, cy = base2 - h - 10, rr = 9 + hash(k, 3) * 6;
      ctx.save(); ctx.translate(cx | 0, cy | 0); ctx.rotate(t * (k % 2 ? 0.6 : -0.6));
      ctx.fillStyle = th.far2; for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-2, -rr - 3, 4, 5); }
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = th.sky[1]; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (hash(k, 19) > 0.5) { // neon sign
      ctx.fillStyle = hash(k, 21) > 0.5 ? th.edge : th.edge2; ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3 + k);
      ctx.fillRect((x + 8) | 0, (base2 - h - 14) | 0, 28, 8); ctx.globalAlpha = 1;
      ctx.fillStyle = th.far2; ctx.fillRect((x + 12) | 0, (base2 - h - 6) | 0, 2, 6); ctx.fillRect((x + 30) | 0, (base2 - h - 6) | 0, 2, 6);
      drawText(ctx, ['POW', 'KO', 'BAM', 'WIN', 'HIT', '3in1'][((k % 6) + 6) % 6], x + 22, base2 - h - 13, th.sky[0], { align: 'center' });
    }
  }
  if (th.rain) {
    ctx.strokeStyle = 'rgba(150,200,255,.35)'; ctx.beginPath();
    for (let i = 0; i < 70; i++) { const x = ((hash(i, 40) * W + t * 60 - cam.x * 0.6) % W + W) % W, y = ((hash(i, 41) * H + t * 340) % H); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 8); }
    ctx.stroke();
  }
  if (th.arena) { // spotlights
    ctx.globalAlpha = 0.08; ctx.fillStyle = th.edge;
    for (let i = 0; i < 3; i++) { const sx = W * (0.2 + i * 0.3) + Math.sin(t + i) * 30; ctx.beginPath(); ctx.moveTo(sx - 6, 0); ctx.lineTo(sx + 6, 0); ctx.lineTo(sx + 50, H); ctx.lineTo(sx - 50, H); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}
function drawTiles(th, t) {
  const c0 = Math.floor(cam.x / T), c1 = Math.ceil((cam.x + W) / T), r0 = Math.floor(cam.y / T), r1 = Math.ceil((cam.y + H) / T);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const ch = tile(c, r); if (ch === '.' || r < 0 || r >= ROWS) continue;
    const x = Math.round(c * T - cam.x), y = Math.round(r * T - cam.y);
    if (ch === '#') {
      const top = !isSolid(tile(c, r - 1)) && tile(c, r - 1) !== '^';
      ctx.fillStyle = th.base; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = th.dark; ctx.fillRect(x, y + 7, T, 1); ctx.fillRect(x + ((r % 2) ? 4 : 11), y, 1, 7); ctx.fillRect(x + ((r % 2) ? 11 : 4), y + 8, 1, 8);
      if (hash(c, r) > 0.8) { ctx.fillStyle = th.lite; ctx.fillRect(x + 2 + ((hash(c, r + 9) * 10) | 0), y + 3 + ((hash(r, c) * 9) | 0), 2, 1); }
      if (top) { ctx.fillStyle = th.lite; ctx.fillRect(x, y, T, 3); ctx.fillStyle = th.edge; ctx.fillRect(x, y, T, 1); ctx.globalAlpha = 0.25; ctx.fillRect(x, y - 2, T, 2); ctx.globalAlpha = 1; }
      if (!isSolid(tile(c - 1, r))) { ctx.fillStyle = th.lite; ctx.fillRect(x, y, 1, T); }
      if (!isSolid(tile(c + 1, r))) { ctx.fillStyle = th.dark; ctx.fillRect(x + T - 1, y, 1, T); }
    } else if (ch === '=') {
      ctx.fillStyle = '#8a8fa8'; ctx.fillRect(x, y, T, 3); ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y + 3, T, 2);
      ctx.fillStyle = th.edge2; ctx.fillRect(x, y, T, 1); ctx.fillStyle = '#2a2d40'; for (let i = 2; i < T; i += 4) ctx.fillRect(x + i, y + 1, 1, 2);
      ctx.globalAlpha = 0.18; ctx.fillStyle = th.edge2; ctx.fillRect(x, y + 5, T, 3); ctx.globalAlpha = 1;
    } else if (ch === 'B' || ch === 'H') {
      ctx.fillStyle = '#2b1049'; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = ch === 'H' ? C.mag : '#c48a4a'; ctx.fillRect(x, y, T, 2); ctx.fillRect(x, y + T - 2, T, 2); ctx.fillRect(x, y, 2, T); ctx.fillRect(x + T - 2, y, 2, T);
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x + 2, y + 2, T - 4, T - 4); ctx.fillStyle = '#6b4220'; ctx.fillRect(x + 2, y + 7, T - 4, 2);
      if (ch === 'H') drawHeart(x + 4, y + 4, C.mag);
      else { ctx.fillStyle = C.yel; ctx.fillRect(x + 7, y + 3, 3, 3); ctx.fillRect(x + 6, y + 6, 3, 2); ctx.fillRect(x + 7, y + 8, 3, 3); ctx.fillRect(x + 6, y + 10, 2, 2); }
    } else if (ch === 'X') {
      ctx.fillStyle = '#5d4f80'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#7d6fa3'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      ctx.fillStyle = '#d8d0ee'; ctx.fillRect(x + 3, y + 3, 1, 4); ctx.fillRect(x + 4, y + 7, 3, 1); ctx.fillRect(x + 7, y + 8, 1, 4); ctx.fillRect(x + 10, y + 2, 1, 3); ctx.fillRect(x + 11, y + 5, 2, 1); ctx.fillRect(x + 12, y + 10, 1, 4);
      ctx.fillStyle = '#3a2f58'; ctx.fillRect(x, y + T - 1, T, 1);
    } else if (ch === 'S') {
      const k = c + ',' + r, sq = level.springT && level.springT[k] ? 4 : 0;
      ctx.fillStyle = '#2a2d40'; ctx.fillRect(x + 1, y + 12, T - 2, 4);
      ctx.fillStyle = '#c0c4d8'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 3, y + 5 + sq / 2 + i * (3 - sq / 4), T - 6, 1);
      ctx.fillStyle = C.yel; ctx.fillRect(x, y + 2 + sq, T, 4); ctx.fillStyle = C.mag; ctx.fillRect(x, y + 2 + sq, T, 1);
      drawText(ctx, 'M', x + 5, y + 2 + sq - 0, '#3a0419');
    } else if (ch === '^') {
      ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y + 12, T, 4); ctx.fillStyle = '#4a4e66'; ctx.fillRect(x + 2, y + 11, 3, 2); ctx.fillRect(x + 10, y + 11, 3, 2);
      ctx.strokeStyle = (Math.floor(t * 12 + c) % 2) ? C.cyan : C.white; ctx.beginPath();
      let px = x + 3, py = y + 11; ctx.moveTo(px, py);
      for (let i = 0; i < 4; i++) { px += 3; py = y + 11 - 3 - hash(c * 7 + i, Math.floor(t * 12)) * 6; ctx.lineTo(px, py); }
      ctx.stroke();
      ctx.globalAlpha = 0.25; ctx.fillStyle = C.cyan; ctx.fillRect(x, y + 6, T, 6); ctx.globalAlpha = 1;
    }
  }
}
function drawHeart(x, y, col, small) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = col;
  if (small) { ctx.fillRect(x, y + 1, 2, 2); ctx.fillRect(x + 3, y + 1, 2, 2); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x + 3, y, 1, 1); ctx.fillRect(x, y + 1, 5, 2); ctx.fillRect(x + 1, y + 3, 3, 1); ctx.fillRect(x + 2, y + 4, 1, 1); return; }
  ctx.fillRect(x + 1, y, 2, 1); ctx.fillRect(x + 5, y, 2, 1); ctx.fillRect(x, y + 1, 8, 3); ctx.fillRect(x + 1, y + 4, 6, 1); ctx.fillRect(x + 2, y + 5, 4, 1); ctx.fillRect(x + 3, y + 6, 2, 1);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 1, y + 1, 1, 1);
}
function drawToken(x, y, t) {
  const w = [8, 6, 4, 2, 4, 6][Math.floor(t * 10) % 6];
  const cx = Math.round(x + 4);
  ctx.fillStyle = '#c8871e'; ctx.fillRect(cx - w / 2, y, w, 8);
  ctx.fillStyle = C.yel; ctx.fillRect(cx - w / 2 + (w > 2 ? 1 : 0), y + 1, Math.max(1, w - 2), 6);
  if (w >= 6) { ctx.fillStyle = '#c8871e'; ctx.fillRect(cx - 1, y + 2, 2, 4); ctx.fillRect(cx, y + 2, 1, 1); }
  ctx.fillStyle = '#fff6b0'; ctx.fillRect(cx - w / 2 + 1, y + 1, 1, 2);
}
function drawItems(t) {
  for (const tk of level.tokens) if (!tk.got) { const bob = tk.loose ? 0 : Math.sin(t * 3 + tk.ph) * 1.5; drawToken(tk.x - cam.x, tk.y - cam.y + bob, t + tk.ph); }
  for (const h of level.hearts) if (!h.got) drawHeart(h.x - cam.x, h.y - cam.y + (h.loose ? 0 : Math.sin(t * 4) * 1.5), C.mag);
  for (const hint of (state === 'menu' ? [] : level.hints)) {
    const txt = (STR.hints[hint.id] || ['', ''])[lastTouch ? 1 : 0];
    const w = textWidth(txt) + 12, x = Math.round(hint.x - cam.x), y = Math.round(hint.y - cam.y);
    if (x > W || x + w < 0) continue;
    ctx.fillStyle = 'rgba(6,4,26,.82)'; ctx.fillRect(x, y, w, 15);
    ctx.fillStyle = C.mag; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + 14, w, 1); ctx.fillStyle = C.cyan; ctx.fillRect(x, y, 1, 15); ctx.fillRect(x + w - 1, y, 1, 15);
    if (hint.posts === undefined) {
      const post = px => { const c = Math.floor(px / T); for (let r = Math.floor(hint.y / T) + 1; r < ROWS; r++) { const ch = tile(c, r); if (isSolid(ch) || ch === '=') return r * T - (hint.y + 15); } return 0; };
      hint.posts = [post(hint.x + 7), post(hint.x + w - 7)];
    }
    ctx.fillStyle = '#2a2d40';
    if (hint.posts[0] > 0) { ctx.fillRect(x + 6, y + 15, 2, hint.posts[0]); ctx.fillRect(x + 4, y + 15 + hint.posts[0] - 2, 6, 2); }
    if (hint.posts[1] > 0) { ctx.fillRect(x + w - 8, y + 15, 2, hint.posts[1]); ctx.fillRect(x + w - 10, y + 15 + hint.posts[1] - 2, 6, 2); }
    drawText(ctx, txt, x + 6, y + 4, Math.floor(t * 2) % 7 ? C.white : C.yel);
  }
  for (const k of level.checkpoints) {
    const x = Math.round(k.x - cam.x), y = Math.round(k.y - cam.y);
    ctx.fillStyle = '#1a0844'; ctx.fillRect(x, y, 12, 24); ctx.fillStyle = k.on ? C.g2 : '#3c1765'; ctx.fillRect(x + 1, y + 1, 10, 22);
    ctx.fillStyle = k.on ? (Math.floor(t * 4) % 2 ? C.yel : C.mag) : '#2b1049'; ctx.fillRect(x + 1, y + 1, 10, 3);
    ctx.fillStyle = k.on ? '#0b1d0a' : C.ink; ctx.fillRect(x + 2, y + 6, 8, 7);
    if (k.on) { ctx.fillStyle = C.g3; ctx.fillRect(x + 3, y + 7, 6, 5); ctx.fillStyle = C.eye2; ctx.fillRect(x + 4, y + 8, 1, 1); ctx.fillRect(x + 7, y + 8, 1, 1); ctx.fillStyle = C.m1; ctx.fillRect(x + 4, y + 10, 4, 1); }
    ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x + 3, y + 16, 6, 1); ctx.fillStyle = C.gl2; ctx.fillRect(x + 4, y + 18, 4, 3);
  }
  if (level.finish) drawFinish(level.finish, t);
}
// the real PRO-GAMES MONSTER 3in1 cabinet as a pixel sprite (finish line of every stage)
const MACHINE = new Image();
MACHINE.src = '/games/assets/monster-3in1-machine.png';
const SCREEN = new Image();
SCREEN.src = '/games/assets/machine-screen.png';
const HAMMER = new Image();
HAMMER.src = '/games/assets/machine-hammer.png';
const LED_ROWS = [[2, [12, 17, 23, 30, 36]], [16, [7, 12, 17, 23, 29, 35]], [65, [10, 16, 21, 26, 31]]];
const LED_COLS = [C.white, C.cyan, C.mag, C.yel];
function drawFinish(f, t) {
  const x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y);
  if (x > W + 70 || x < -70) return;
  if (MACHINE.complete && MACHINE.naturalWidth) {
    // pulsing floor glow + spotlight
    ctx.globalAlpha = 0.16 + 0.08 * Math.sin(t * 4); ctx.fillStyle = C.g3;
    ctx.beginPath(); ctx.ellipse(x + 25, y + 89, 34, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.07; ctx.beginPath(); ctx.moveTo(x + 15, y - 30); ctx.lineTo(x + 36, y - 30); ctx.lineTo(x + 62, y + 90); ctx.lineTo(x - 11, y + 90); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(MACHINE, x, y);
    // chasing LED lights
    const step = Math.floor(t * 8);
    for (const [ly, xs] of LED_ROWS) xs.forEach((lx, i) => { if ((i + step) % 3 === 0) { ctx.fillStyle = LED_COLS[(i + step) % 4]; ctx.fillRect(x + lx, y + ly, 2, 2); } });
    // screen: the real MONSTER 3in1 attract animation (MONSTER, PUNCH, KICK, SMASH)
    if (SCREEN.complete && SCREEN.naturalWidth) {
      const fi = Math.floor(t * 2.5) % 25;
      ctx.drawImage(SCREEN, fi * 12, 0, 12, 13, x + 14, y + 34, 12, 13);
      ctx.globalAlpha = 0.18; ctx.fillStyle = C.cyan; ctx.fillRect(x + 14, y + 34 + (Math.floor(t * 20) % 13), 12, 1); ctx.globalAlpha = 1;
    }
    // side panel: the HAMMER score column (100 ... 1000) from the real machine
    if (HAMMER.complete && HAMMER.naturalWidth) ctx.drawImage(HAMMER, (Math.floor(t * 6) % 18) * 6, 0, 6, 40, x + 35, y + 21, 6, 40);
    if (Math.floor(t * 3) % 2) drawText(ctx, '↓', x + 25, y - 18, C.g3, { align: 'center', scale: 2, outline: C.ink });
    return;
  }
  // glow
  ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 4); ctx.fillStyle = C.g3; ctx.fillRect(x - 6, y - 6, 56, 68); ctx.globalAlpha = 1;
  // body
  ctx.fillStyle = '#1a0844'; ctx.fillRect(x, y, 44, 56); ctx.fillStyle = '#3c1765'; ctx.fillRect(x + 2, y + 2, 40, 54);
  ctx.fillStyle = C.mag; ctx.fillRect(x + 2, y + 2, 2, 54); ctx.fillStyle = C.cyan; ctx.fillRect(x + 40, y + 2, 2, 54);
  // marquee
  ctx.fillStyle = C.yel; ctx.fillRect(x + 1, y - 10, 42, 11); drawText(ctx, 'MONSTER', x + 22, y - 8, '#3a0419', { align: 'center' });
  for (let i = 0; i < 7; i++) { ctx.fillStyle = (Math.floor(t * 6) + i) % 2 ? C.white : C.mag; ctx.fillRect(x + 3 + i * 6, y - 12, 2, 2); }
  // screen with monster face
  ctx.fillStyle = C.ink; ctx.fillRect(x + 7, y + 6, 30, 20);
  ctx.fillStyle = C.g2; ctx.fillRect(x + 14, y + 9, 16, 14); ctx.fillStyle = C.h2; ctx.fillRect(x + 14, y + 8, 16, 3);
  ctx.fillStyle = C.eye2; ctx.fillRect(x + 16, y + 13, 3, 2); ctx.fillRect(x + 25, y + 13, 3, 2);
  ctx.fillStyle = C.m1; ctx.fillRect(x + 17, y + 17, 10, 4); ctx.fillStyle = C.tooth; ctx.fillRect(x + 18, y + 17, 1, 1); ctx.fillRect(x + 21, y + 17, 1, 1); ctx.fillRect(x + 24, y + 17, 1, 1);
  // control panel: bag, ball, hammer
  ctx.fillStyle = '#2b1049'; ctx.fillRect(x + 4, y + 30, 36, 8);
  ctx.fillStyle = C.h3; ctx.fillRect(x + 8, y + 31, 6, 6); ctx.fillStyle = C.white; ctx.fillRect(x + 19, y + 31, 6, 6); ctx.fillStyle = C.ink; ctx.fillRect(x + 21, y + 33, 2, 2);
  ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x + 31, y + 31, 2, 6); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x + 29, y + 31, 6, 3);
  drawText(ctx, '3in1', x + 22, y + 42, C.yel, { align: 'center' });
  ctx.fillStyle = '#1a0844'; ctx.fillRect(x + 6, y + 50, 32, 6);
  // arrow above
  if (Math.floor(t * 3) % 2) drawText(ctx, '↓', x + 22, y - 24, C.g3, { align: 'center', scale: 2, outline: C.ink });
}
function drawPlats() {
  for (const pl of level.plats) {
    const x = Math.round(pl.x - cam.x), y = Math.round(pl.y - cam.y);
    ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y, pl.w, 6); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x, y, pl.w, 2);
    ctx.fillStyle = C.cyan; ctx.fillRect(x + 2, y + 3, pl.w - 4, 1);
    ctx.fillStyle = (Math.floor(time * 6) % 2) ? C.yel : C.mag; ctx.fillRect(x + 2, y + 4, 2, 2); ctx.fillRect(x + pl.w - 4, y + 4, 2, 2);
    if (pl.axis === 'y') { ctx.globalAlpha = 0.3; ctx.fillStyle = C.cyan; ctx.fillRect(x + pl.w / 2 - 1, y + 6, 2, 8); ctx.globalAlpha = 1; }
  }
}
function drawEnemy(e, t) {
  const x = Math.round(e.x - cam.x), y = Math.round(e.y - cam.y);
  if (x < -40 || x > W + 40) return;
  ctx.save();
  if (!e.alive && !e.squash) { ctx.translate(x + e.w / 2, y + e.h / 2); ctx.rotate(t * 12); ctx.translate(-e.w / 2, -e.h / 2); }
  else ctx.translate(x, y);
  const f = (e.dir || -1) > 0;
  if (e.type === 'bagger') {
    const sq = e.squash ? 8 : 0;
    ctx.fillStyle = '#2e1850'; ctx.fillRect(1, sq + 1, 12, 14 - sq); ctx.fillRect(2, sq, 10, 15 - sq);
    ctx.fillStyle = C.h3; ctx.fillRect(2, sq + 1, 10, 12 - sq); ctx.fillStyle = '#9a6ad8'; ctx.fillRect(3, sq + 2, 3, Math.max(1, 5 - sq));
    ctx.fillStyle = C.cyan; ctx.fillRect(2, sq + 9 - (sq ? 4 : 0), 10, 1);
    if (!e.squash) {
      ctx.fillStyle = '#c0c4d8'; ctx.fillRect(6, -3, 2, 3);
      ctx.fillStyle = C.white; ctx.fillRect(f ? 6 : 3, 4, 2, 2); ctx.fillRect(f ? 10 : 7, 4, 2, 2);
      ctx.fillStyle = C.ink; ctx.fillRect(f ? 7 : 3, 5, 1, 1); ctx.fillRect(f ? 11 : 7, 5, 1, 1); ctx.fillRect(f ? 6 : 3, 3, 2, 1); ctx.fillRect(f ? 10 : 7, 3, 2, 1);
      ctx.fillStyle = C.m1; ctx.fillRect(f ? 7 : 4, 7, 4, 1);
      const leg = Math.floor(e.t * 8) % 2; ctx.fillStyle = '#1a0844'; ctx.fillRect(3, 14 - leg, 3, 1 + leg); ctx.fillRect(8, 13 + leg, 3, 2 - leg);
    } else { ctx.fillStyle = C.ink; ctx.fillRect(4, 11, 2, 1); ctx.fillRect(8, 11, 2, 1); }
  } else if (e.type === 'sparky') {
    const fl = Math.floor(t * 14) % 2;
    ctx.fillStyle = fl ? C.cyan : C.white;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 3; ctx.fillRect(Math.round(6 + Math.cos(a) * 8) - 1, Math.round(6 + Math.sin(a) * 8) - 1, 2, 2); }
    ctx.fillStyle = '#1d6f9c'; ctx.fillRect(1, 2, 10, 8); ctx.fillRect(2, 1, 8, 10); ctx.fillStyle = C.cyan; ctx.fillRect(2, 2, 8, 8); ctx.fillStyle = C.white; ctx.fillRect(3, 3, 3, 2);
    ctx.fillStyle = C.ink; ctx.fillRect(3, 5, 2, 2); ctx.fillRect(7, 5, 2, 2); ctx.fillRect(4, 8, 4, 1); ctx.fillStyle = C.yel; ctx.fillRect(3, 5, 1, 1); ctx.fillRect(7, 5, 1, 1);
  } else if (e.type === 'glover') {
    if (e.state === 'wind' && Math.floor(t * 20) % 2) ctx.translate(1, 0);
    const fx = v => f ? v : 16 - v - 1;
    const body = (xx, yy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(f ? xx : 16 - xx - w, yy, w, h); };
    body(1, 0, 12, 10, C.gl1); body(2, 0, 10, 9, C.gl2); body(3, 1, 4, 2, C.gl3); body(11, 3, 4, 5, C.gl2); body(13, 3, 2, 2, C.gl3);
    body(0, 2, 2, 7, C.white);
    ctx.fillStyle = C.white; ctx.fillRect(fx(8), 3, 2, 2); ctx.fillStyle = C.ink; ctx.fillRect(fx(9), 4, 1, 1); ctx.fillRect(fx(7), 2, 3, 1);
    const leg = Math.floor(e.t * (e.state === 'charge' ? 20 : 8)) % 2; ctx.fillStyle = C.gl1; ctx.fillRect(4, 10, 2, 2 - leg); ctx.fillRect(9, 10, 2, 1 + leg);
    if (e.state === 'charge') { ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 3; i++) ctx.fillRect(f ? -6 - i * 3 : 18 + i * 3, 2 + i * 3, 4, 1); }
    if (e.state === 'dizzy') { ctx.fillStyle = C.yel; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.fillRect(Math.round(8 + Math.cos(a) * 7), Math.round(-3 + Math.sin(a) * 2), 2, 2); } }
  }
  ctx.restore();
}
function drawBoss(t) {
  const B = level.boss; if (!B || B.state === 'gone' || B.state === 'wait') return;
  let x = Math.round(B.x - cam.x), y = Math.round(B.y - cam.y);
  if (B.state === 'tele') x += Math.round(Math.sin(t * 60) * 2);
  // chain
  if (B.state !== 'dazed' && B.state !== 'ko') { ctx.fillStyle = '#8a8fa8'; for (let cy = y - 2; cy > -cam.y - 4; cy -= 6) ctx.fillRect(x + 18, cy - 4, 4, 4); }
  const hurt = B.flash > 0 && Math.floor(t * 30) % 2;
  ctx.fillStyle = '#1a0844'; ctx.fillRect(x + 2, y, 36, 56); ctx.fillRect(x, y + 4, 40, 48);
  ctx.fillStyle = hurt ? C.white : C.h3; ctx.fillRect(x + 2, y + 2, 36, 52); ctx.fillRect(x + 1, y + 5, 38, 46);
  ctx.fillStyle = hurt ? C.white : '#9a6ad8'; ctx.fillRect(x + 5, y + 4, 8, 16);
  ctx.fillStyle = C.cyan; ctx.fillRect(x + 1, y + 36, 38, 3);
  ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x + 14, y - 3, 12, 4);
  // face
  const dazed = B.state === 'dazed' || B.state === 'ko';
  if (dazed) {
    ctx.fillStyle = C.ink; for (const ex of [10, 25]) { ctx.fillRect(x + ex, y + 14, 5, 1); ctx.fillRect(x + ex + 2, y + 12, 1, 5); }
    ctx.fillStyle = C.yel; for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.57; ctx.fillRect(Math.round(x + 20 + Math.cos(a) * 16), Math.round(y - 6 + Math.sin(a) * 4), 3, 3); }
    ctx.fillStyle = C.m1; ctx.fillRect(x + 13, y + 24, 14, 5);
  } else {
    ctx.fillStyle = C.white; ctx.fillRect(x + 9, y + 12, 8, 6); ctx.fillRect(x + 23, y + 12, 8, 6);
    const lx = clamp(Math.round((player.x - B.x - 20) / 30), -2, 2);
    ctx.fillStyle = '#e8283c'; ctx.fillRect(x + 12 + lx, y + 14, 3, 3); ctx.fillRect(x + 26 + lx, y + 14, 3, 3);
    ctx.fillStyle = C.ink; ctx.fillRect(x + 8, y + 10, 10, 2); ctx.fillRect(x + 22, y + 10, 10, 2); ctx.fillRect(x + 16, y + 11, 2, 2); ctx.fillRect(x + 22, y + 11, 2, 2);
    ctx.fillStyle = C.m1; ctx.fillRect(x + 10, y + 23, 20, 7);
    ctx.fillStyle = C.tooth; for (let i = 0; i < 5; i++) { ctx.fillRect(x + 11 + i * 4, y + 23, 2, 2); ctx.fillRect(x + 13 + i * 4, y + 28, 2, 2); }
  }
  // cracks by damage
  ctx.fillStyle = '#1a0844';
  const dmg = B.maxHp - B.hp;
  if (dmg > 1) { ctx.fillRect(x + 30, y + 40, 1, 6); ctx.fillRect(x + 31, y + 46, 3, 1); }
  if (dmg > 3) { ctx.fillRect(x + 6, y + 26, 1, 8); ctx.fillRect(x + 7, y + 34, 3, 1); }
  if (dmg > 5) { ctx.fillRect(x + 20, y + 44, 1, 8); ctx.fillRect(x + 21, y + 41, 4, 1); }
}
function drawPlayer(t) {
  const p = player;
  if (p.inv > 0 && !p.dying && Math.floor(t * 20) % 2) return;
  let fr;
  if (p.dying) fr = 'hurt';
  else if (state === 'clear') fr = 'win';
  else if (p.smashing || p.act === 'swing' || (p.act === 'smash' && p.actT > 0)) fr = 'smash';
  else if (p.act === 'punch') fr = 'punch';
  else if (p.act === 'kick') fr = 'kick';
  else if (p.inv > 1.2) fr = 'hurt';
  else if (!p.onGround) fr = p.vy < 0 ? 'jump' : 'fall';
  else if (Math.abs(p.vx) > 10) fr = 'run' + (Math.floor(p.anim * 1.6) % 4);
  else fr = p.blinkT < 0 ? 'blink' : 'idle' + (Math.floor(t * 2) % 2);
  const rage = p.rageT > 0;
  let set = SPR[fr + (rage ? (Math.floor(t * 10) % 2 ? '_rage' : '') : '')] || SPR[fr];
  if (!set) { (window.__mgBad = window.__mgBad || []).push(fr); set = SPR.idle0; }
  const img = set[p.face > 0 ? 0 : 1];
  const x = Math.round(p.x + p.w / 2 - 12 - cam.x), y = Math.round(p.y + p.h - 26 - cam.y);
  if (rage) { ctx.globalAlpha = 0.35; ctx.fillStyle = Math.floor(t * 10) % 2 ? C.yel : C.mag; ctx.fillRect(x + 2, y + 2, 20, 24); ctx.globalAlpha = 1; }
  if (p.dying) { ctx.save(); ctx.translate(x + 12, y + 13); ctx.rotate(p.dying * 4); ctx.drawImage(img, -12, -13); ctx.restore(); return; }
  // hammer for smash
  if (fr === 'smash') {
    const hx = x + 12, down = p.smashing || p.act === 'swing';
    ctx.fillStyle = '#8a5a2b';
    if (p.smashing) { ctx.fillRect(hx - 1, y - 8, 2, 12); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(hx - 6, y - 14, 12, 7); ctx.fillStyle = '#6a6e86'; ctx.fillRect(hx - 6, y - 8, 12, 1); }
    else if (down) { const s = p.face; ctx.fillRect(hx + s * 4, y + 12, s * 12, 2); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(hx + s * 14 - (s < 0 ? 6 : 0), y + 14, 7, 12); }
    else { ctx.fillRect(hx + p.face * 6, y + 14, 2, 10); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(hx + p.face * 6 - 5, y + 21, 12, 5); }
  }
  ctx.drawImage(img, x, y);
  if (p.act === 'punch' && p.actT > 0.1) { ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) ctx.fillRect(p.face > 0 ? x + 25 + i * 2 : x - 3 - i * 2, y + 12 + i * 3, 3, 1); }
}
function drawBalls(t) {
  for (const b of balls) {
    const x = Math.round(b.x - cam.x), y = Math.round(b.y - cam.y);
    if (b.life < 0.4 && Math.floor(t * 20) % 2) continue;
    ctx.fillStyle = C.ink; ctx.fillRect(x + 1, y, 6, 8); ctx.fillRect(x, y + 1, 8, 6);
    ctx.fillStyle = C.white; ctx.fillRect(x + 1, y + 1, 6, 6);
    const s = Math.floor(b.spin) % 2; ctx.fillStyle = C.ink; ctx.fillRect(x + 3, y + 3, 2, 2); ctx.fillRect(s ? x + 1 : x + 5, y + 1, 1, 1); ctx.fillRect(s ? x + 5 : x + 1, y + 6, 1, 1);
    if (Math.abs(b.vx) > 120) { ctx.fillStyle = 'rgba(139,237,54,.5)'; ctx.fillRect(b.vx > 0 ? x - 6 : x + 9, y + 3, 5, 2); }
  }
  for (const w of waves) {
    const x = Math.round(w.x - cam.x), y = Math.round(w.y - cam.y);
    ctx.fillStyle = w.dir > 0 ? C.cyan : C.mag; ctx.fillRect(x, y + 4, w.w, 8); ctx.fillStyle = C.white; ctx.fillRect(x + 2, y + 6, w.w - 4, 4);
    ctx.globalAlpha = 0.4; ctx.fillStyle = w.dir > 0 ? C.cyan : C.mag; ctx.fillRect(x - w.dir * 8, y + 6, 8, 6); ctx.globalAlpha = 1;
  }
}
function drawFx() {
  for (const q of particles) {
    const a = 1 - q.t / q.life;
    if (q.ring) { ctx.globalAlpha = a; ctx.strokeStyle = q.color; ctx.beginPath(); ctx.ellipse(q.x - cam.x, q.y - cam.y, q.r, q.r * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); continue; }
    ctx.globalAlpha = Math.min(1, a * 2); ctx.fillStyle = q.color; ctx.fillRect(Math.round(q.x - cam.x), Math.round(q.y - cam.y), q.size, q.size);
  }
  ctx.globalAlpha = 1;
  for (const q of popups) {
    const a = q.t / q.life, wob = q.scale > 1 ? Math.round(Math.sin(q.t * 30) * (1 - a)) : 0;
    ctx.globalAlpha = a > 0.7 ? (1 - a) / 0.3 : 1;
    drawText(ctx, q.text, q.x - cam.x + wob, q.y - cam.y, q.color, { align: 'center', scale: q.scale, outline: C.ink });
  }
  ctx.globalAlpha = 1;
}
const fmt = n => String(Math.max(0, n | 0)).padStart(6, '0');
function drawHUD(t) {
  const p = player;
  ctx.fillStyle = 'rgba(6,4,26,.55)'; ctx.fillRect(0, 0, W, 18);
  ctx.fillStyle = C.mag; ctx.fillRect(0, 18, W, 1);
  // hearts
  for (let i = 0; i < 3; i++) drawHeart(5 + i * 10, 3, i < p.hearts ? C.mag : '#3c1765');
  // lives
  const head = SPR.idle0[0]; ctx.drawImage(head, 0, 0, 24, 18, 36, 0, 24, 18);
  drawText(ctx, STR.lives + Math.max(0, run.lives), 58, 6, C.white);
  // rage bar
  const rx = 82, rw = 44;
  ctx.fillStyle = '#1a0844'; ctx.fillRect(rx, 5, rw + 2, 7);
  const fill = p.rageT > 0 ? (p.rageT / 7) : p.rage / 100;
  ctx.fillStyle = p.rageT > 0 ? (Math.floor(t * 12) % 2 ? C.yel : C.mag) : p.rage >= 70 ? C.yel : C.mag;
  ctx.fillRect(rx + 1, 6, Math.round(rw * fill), 5);
  drawText(ctx, STR.rage, rx + rw / 2 + 1, 6, p.rage > 50 || p.rageT > 0 ? C.ink : C.white, { align: 'center' });
  // stage + time
  drawText(ctx, STR.stage + ' ' + (level.idx + 1), W / 2, 2, C.cyan, { align: 'center' });
  drawText(ctx, STR.time + ' ' + Math.floor(stageTime), W / 2, 10, C.white, { align: 'center' });
  // tokens + score
  drawToken(W - 100, 5, t); drawText(ctx, '×' + String(run.tokens % 100).padStart(2, '0'), W - 90, 6, C.white);
  drawText(ctx, fmt(run.score), W - 5, 6, C.yel, { align: 'right', shadow: '#7a3a00' });
  // boss bar
  const B = level.boss;
  if (B && B.state !== 'wait' && B.state !== 'gone') {
    const bw = 140, bx = W / 2 - bw / 2, by = H - 14;
    ctx.fillStyle = 'rgba(6,4,26,.8)'; ctx.fillRect(bx - 2, by - 9, bw + 4, 19);
    drawText(ctx, 'BIG BAG', W / 2, by - 8, C.mag, { align: 'center' });
    ctx.fillStyle = '#2b1049'; ctx.fillRect(bx, by, bw, 6); ctx.fillStyle = B.flash > 0 ? C.white : C.h3; ctx.fillRect(bx, by, Math.round(bw * B.hp / B.maxHp), 6);
    ctx.fillStyle = C.cyan; ctx.fillRect(bx, by, bw, 1);
  }
}
function drawIntro() {
  const a = Math.min(1, introT / 0.4);
  ctx.globalAlpha = Math.min(1, a) * 0.85; ctx.fillStyle = C.ink; ctx.fillRect(0, H / 2 - 34, W, 68); ctx.globalAlpha = 1;
  ctx.fillStyle = C.mag; ctx.fillRect(0, H / 2 - 34, W, 2); ctx.fillStyle = C.cyan; ctx.fillRect(0, H / 2 + 32, W, 2);
  drawText(ctx, STR.stage + ' ' + (level.idx + 1), W / 2, H / 2 - 26, C.cyan, { align: 'center', scale: 1 });
  drawText(ctx, level.def.name[LANG], W / 2, H / 2 - 12, C.yel, { align: 'center', scale: 3, outline: '#3a0419' });
  drawText(ctx, introT > 0.6 ? STR.pops.ready : STR.pops.go, W / 2, H / 2 + 18, C.white, { align: 'center', scale: 1 });
}
function render() {
  const th = level.theme;
  ctx.save();
  if (shake > 0) ctx.translate(Math.round(rnd(-3, 3) * Math.min(1, shake * 4)), Math.round(rnd(-2, 2) * Math.min(1, shake * 4)));
  drawBackground(th, time);
  drawTiles(th, time);
  drawPlats();
  drawItems(time);
  drawBoss(time);
  for (const e of level.enemies) drawEnemy(e, time);
  drawBalls(time);
  drawPlayer(time);
  drawFx();
  ctx.restore();
  if (flash > 0) { ctx.globalAlpha = Math.min(0.6, flash * 2); ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (player.rageT > 0) { ctx.globalAlpha = 0.12 + 0.06 * Math.sin(time * 12); ctx.fillStyle = C.mag; ctx.fillRect(0, 0, W, 4); ctx.fillRect(0, H - 4, W, 4); ctx.fillRect(0, 0, 4, H); ctx.fillRect(W - 4, 0, 4, H); ctx.globalAlpha = 1; }
  drawHUD(time);
  if (state === 'intro') drawIntro();
}

/* ---------- attract mode (menu background) ---------- */
let attract = null;
function renderAttract(dt) {
  if (!attract) { level = buildLevel(0); attract = { x: 0 }; player = newPlayer(60, 12 * T - 20); particles = []; popups = []; balls = []; waves = []; }
  time += dt; attract.x += dt * 40;
  cam.x = attract.x % (level.w - W); cam.y = level.h - H;
  player.x = cam.x + W * 0.22; player.y = 13 * T - player.h; player.vx = 60; player.onGround = true; player.face = 1; player.anim += dt * 2.5;
  player.act = null; player.inv = 0; player.dying = 0; player.rageT = 0;
  drawBackground(level.theme, time); drawTiles(level.theme, time); drawPlats(); drawItems(time);
  ctx.fillStyle = 'rgba(6,4,26,.6)'; ctx.fillRect(0, 0, W, H);
}

/* ---------- pixel UI: menus, pause, results ---------- */
const UI = {
  en: {
    newGame: 'NEW GAME', cont: 'CONTINUE', stage: 'STAGE', select: 'STAGE SELECT', howto: 'HOW TO PLAY', options: 'OPTIONS', exit: 'EXIT',
    back: 'BACK', top: 'TOP', best: 'BEST', sound: 'SOUND', music: 'MUSIC', on: 'ON', off: 'OFF', full: 'FULLSCREEN', reset: 'DELETE SAVE',
    sure: 'DELETE SAVE AND RECORDS?', yes: 'YES', no: 'NO', deleted: 'SAVE DELETED',
    pause: 'PAUSE', resume: 'RESUME', restart: 'RESTART STAGE', quit: 'QUIT TO MENU',
    clear: 'CLEAR!', next: 'NEXT STAGE', go: 'CONTINUE', menu: 'MENU',
    tokens: 'TOKENS', time: 'TIME', timeBonus: 'TIME BONUS', perfect: 'NO-HIT BONUS', allTokens: 'ALL TOKENS', hearts: 'HEARTS BONUS', stageScore: 'STAGE SCORE', total: 'TOTAL',
    over: 'GAME OVER', score: 'SCORE', retry: 'CONTINUE', retryNote: 'SAME STAGE - SCORE RESETS TO ZERO',
    end1: 'YOU BEAT BIG BAG!', end2: 'YOU ARE THE REAL MONSTER!', again: 'PLAY AGAIN', machine: 'THE REAL MONSTER 3in1',
    locked: '??????', nextPage: 'NEXT ▶', prevPage: '◀ PREVIOUS', copy: '(C) 2026 PRO-GAMES POLAND',
    rank: 'RANKING', nick: 'NICK', enterNick: 'ENTER YOUR NICK', nickHint: 'LETTERS AND DIGITS - MAX 10', tapType: 'TAP THE BOX TO TYPE', ok: 'OK',
    online: 'ALL PLAYERS - ONLINE', offline: 'OFFLINE - THIS DEVICE ONLY', place: 'PLACE', newBest: 'NEW PERSONAL BEST!', yourBest: 'YOUR BEST', empty: 'NO SCORES YET - BE THE FIRST!', player: 'PLAYER', end: 'END',
    pages: ['CONTROLS', 'ENEMIES AND ITEMS', 'GOAL'],
    keys: [['← →', 'RUN'], ['SPACE / ↑', 'JUMP (HOLD = HIGHER)'], ['J / X', 'PUNCH - BREAKS CRATES'], ['K / C', 'KICK THE BALL'], ['↓ IN THE AIR', 'HAMMER SMASH'], ['↓ ON THE GROUND', 'HAMMER SWING - BREAKS WALLS'], ['P / ESC', 'PAUSE']],
    touch: [['◀ ▶', 'RUN'], ['JUMP', 'JUMP (HOLD = HIGHER)'], ['PUNCH', 'BREAKS CRATES'], ['KICK', 'KICK THE BALL'], ['SMASH IN AIR', 'HAMMER SMASH'], ['SMASH ON GROUND', 'BREAKS CRACKED WALLS'], ['=', 'MENU / PAUSE']],
    things: [['bagger', 'BAGGER - STOMP OR PUNCH IT'], ['sparky', "SPARKY - DON'T STOMP! PUNCH OR KICK"], ['glover', 'GLOVER - CHARGES AT YOU'], ['token', '100 TOKENS = EXTRA LIFE'], ['heart', 'HEART - RESTORES HEALTH'],
      ['crate', 'CRATE - HIDES TOKENS OR HEARTS'], ['cracked', 'CRACKED BLOCK - SMASH IT'], ['spring', 'SPRING - SMASH IT = MEGA JUMP'], ['check', 'SMALL MACHINE - CHECKPOINT'], ['rage', 'FULL RAGE BAR = 7 S INVINCIBLE']],
    goal: ['REACH THE MONSTER MACHINE', 'AT THE END OF EVERY STAGE.', '', 'STAGE 5: BEAT BIG BAG.', 'HIT IT WHILE IT LIES DAZED', 'AFTER A SLAM AND JUMP', 'OVER ITS SHOCKWAVES!', '', 'PROGRESS IS SAVED', 'AUTOMATICALLY.']
  },
  pl: {
    newGame: 'NOWA GRA', cont: 'KONTYNUUJ', stage: 'ETAP', select: 'WYBÓR ETAPU', howto: 'INSTRUKCJA', options: 'OPCJE', exit: 'WYJŚCIE',
    back: 'POWRÓT', top: 'TOP', best: 'REKORD', sound: 'DŹWIĘK', music: 'MUZYKA', on: 'WŁ', off: 'WYŁ', full: 'PEŁNY EKRAN', reset: 'USUŃ ZAPIS',
    sure: 'USUNĄĆ ZAPIS I REKORDY?', yes: 'TAK', no: 'NIE', deleted: 'ZAPIS USUNIĘTY',
    pause: 'PAUZA', resume: 'GRAJ DALEJ', restart: 'ETAP OD NOWA', quit: 'WYJDŹ DO MENU',
    clear: 'UKOŃCZONY!', next: 'NASTĘPNY ETAP', go: 'DALEJ', menu: 'MENU',
    tokens: 'ŻETONY', time: 'CZAS', timeBonus: 'BONUS ZA CZAS', perfect: 'BEZ TRAFIENIA', allTokens: 'WSZYSTKIE ŻETONY', hearts: 'BONUS ZA SERCA', stageScore: 'WYNIK ETAPU', total: 'RAZEM',
    over: 'GAME OVER', score: 'WYNIK', retry: 'KONTYNUUJ', retryNote: 'TEN SAM ETAP - WYNIK OD ZERA',
    end1: 'POKONAŁEŚ BIG BAG!', end2: 'JESTEŚ PRAWDZIWYM MONSTEREM!', again: 'ZAGRAJ PONOWNIE', machine: 'AUTOMAT MONSTER 3in1',
    locked: '??????', nextPage: 'DALEJ ▶', prevPage: '◀ WSTECZ', copy: '(C) 2026 PRO-GAMES POLAND',
    rank: 'RANKING', nick: 'NICK', enterNick: 'WPISZ SWÓJ NICK', nickHint: 'LITERY I CYFRY - MAX 10', tapType: 'DOTKNIJ POLA, ABY PISAĆ', ok: 'OK',
    online: 'WSZYSCY GRACZE - ONLINE', offline: 'OFFLINE - TYLKO TO URZĄDZENIE', place: 'MIEJSCE', newBest: 'NOWY REKORD GRACZA!', yourBest: 'TWÓJ REKORD', empty: 'BRAK WYNIKÓW - BĄDŹ PIERWSZY!', player: 'GRACZ', end: 'META',
    pages: ['STEROWANIE', 'PRZECIWNICY I PRZEDMIOTY', 'CEL GRY'],
    keys: [['← →', 'BIEG'], ['SPACJA / ↑', 'SKOK (TRZYMAJ = WYŻEJ)'], ['J / X', 'CIOS - ROZBIJA SKRZYNIE'], ['K / C', 'KOPNIĘCIE PIŁKI'], ['↓ W POWIETRZU', 'UDERZENIE MŁOTEM'], ['↓ NA ZIEMI', 'MŁOT KRUSZY ŚCIANY'], ['P / ESC', 'PAUZA']],
    touch: [['◀ ▶', 'BIEG'], ['SKOK', 'SKOK (TRZYMAJ = WYŻEJ)'], ['CIOS', 'ROZBIJA SKRZYNIE'], ['KOP', 'KOPNIĘCIE PIŁKI'], ['MŁOT W GÓRZE', 'UDERZENIE MŁOTEM'], ['MŁOT NA ZIEMI', 'KRUSZY ŚCIANY'], ['=', 'MENU / PAUZA']],
    things: [['bagger', 'WOREK - SKOCZ NA NIEGO LUB UDERZ'], ['sparky', 'ISKRA - NIE SKACZ! UDERZ LUB KOPNIJ'], ['glover', 'RĘKAWICA - SZARŻUJE NA CIEBIE'], ['token', '100 ŻETONÓW = DODATKOWE ŻYCIE'], ['heart', 'SERCE - ODNAWIA ZDROWIE'],
      ['crate', 'SKRZYNIA - KRYJE ŻETONY I SERCA'], ['cracked', 'PĘKNIĘTY BLOK - ROZBIJ MŁOTEM'], ['spring', 'SPRĘŻYNA - MŁOT = MEGA SKOK'], ['check', 'MAŁY AUTOMAT - PUNKT ZAPISU'], ['rage', 'PEŁNY PASEK SZAŁ = 7 S NIETYKALNOŚCI']],
    goal: ['DOJDŹ DO AUTOMATU MONSTER', 'NA KOŃCU KAŻDEGO ETAPU.', '', 'ETAP 5: POKONAJ BIG BAG.', 'UDERZAJ GO, GDY LEŻY', 'OGŁUSZONY PO UPADKU,', 'I PRZESKAKUJ FALE!', '', 'POSTĘP ZAPISUJE SIĘ', 'AUTOMATYCZNIE.']
  }
}[LANG];
const HOME = LANG === 'pl' ? '/pl/' : '/';
const PRODUCT = LANG === 'pl' ? '/pl/produkty/monster-3in1.html' : '/en/products/monster-3in1.html';
const ui = { screen: 'main', sel: 0, page: 0, from: 'main', tally: null, note: '', noteT: 0, t: 0 };
let menuRects = [], menuOY = 0;
function inMenuArea(fn) {
  const realH = H, oy = Math.max(0, Math.round((H - VH) / 2));
  menuOY = oy; ctx.save(); ctx.translate(0, oy); H = VH;
  try { fn(); } finally { H = realH; ctx.restore(); }
}
SFX.move = () => tone(880, 0.035, 'square', 0.06);
SFX.ok = () => { tone(660, 0.05, 'square', 0.08); tone(990, 0.08, 'square', 0.08, 0, 0.05); };
SFX.back = () => tone(440, 0.07, 'square', 0.07, -120);
SFX.tick = () => tone(1320, 0.03, 'square', 0.05);

function menuActive() { return state === 'menu' || state === 'pause' || state === 'clear' || state === 'over' || state === 'ending'; }
function hasSave() { return !!(save.run && (save.run.stage > 0 || save.run.score > 0)); }
function toggleFull() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const r = (root.requestFullscreen || root.webkitRequestFullscreen); if (r) { const pr = r.call(root); if (pr && pr.then) pr.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (_) { /* noop */ } }).catch(() => {}); } }
  } catch (e) { /* not supported */ }
}
function goMenu() {
  if ((state === 'pause' || state === 'clear') && level && run && run.score > 0) recordRun('E' + (level.idx + 1));
  stopMusic(); state = 'menu'; ui.screen = 'main'; ui.sel = 0; attract = null; level = null;
  root.classList.remove('is-playing');
}
function continueRun() {
  const r = save.run || { stage: 0, score: 0, lives: 3, tokens: 0 };
  run = { score: r.score | 0, lives: r.lives === undefined ? 3 : r.lives, tokens: r.tokens | 0, token: r.token || null };
  if (!run.token && !run.score) beginOnline(run);
  startStage(Math.min(r.stage | 0, save.unlocked - 1), true);
}
function newGame(idx) { run = { score: 0, lives: 3, tokens: 0 }; beginOnline(run); startStage(idx || 0, true); }

/* nickname: arcade-style letter board (tap / click / arrows) + typing on a physical keyboard */
const NICK_RE = /[^A-Z0-9ĄĆĘŁŃÓŚŹŻ_\-. ]/g;
/* keys laid out like a normal (EU QWERTY) keyboard: ← where backspace is, OK where enter is.
   x / w are in key widths, rows are staggered like on a real keyboard */
const NICK_LAYOUT = [
  { x: 0, keys: [...'1234567890', 'DEL'] },
  { x: 0.5, keys: [...'QWERTYUIOP'] },
  { x: 0.75, keys: [...'ASDFGHJKL', 'OK'] },
  { x: 1.25, keys: [...'ZXCVBNM-_'] }
];
const NICK_POS = [];
NICK_LAYOUT.forEach((r, row) => { let x = r.x; r.keys.forEach(k => { const w = k === 'OK' ? 1.25 : 1; NICK_POS.push({ k, row, x, w }); x += w; }); });
const NICK_KEYS = NICK_POS.map(p => p.k), NICK_COLS = 11;
const cleanNick = v => String(v || '').toUpperCase().replace(NICK_RE, '').replace(/^ +/, '').slice(0, 10);
function openNick(next) {
  ui.nickNext = next || null; ui.nickFrom = ui.screen === 'options' ? 'options' : 'main';
  ui.nick = save.nick || ''; ui.screen = 'nick'; ui.sel = NICK_KEYS.indexOf('Q'); sfx('ok');
}
function nickType(ch) { const v = cleanNick((ui.nick || '') + ch); if (v !== ui.nick) { ui.nick = v; sfx('tick'); } else sfx('back'); }
function nickDel() { if (ui.nick) { ui.nick = ui.nick.slice(0, -1); sfx('back'); } }
function confirmNick() {
  let n = cleanNick(ui.nick).trim();
  if (!n) n = UI.player + (10 + Math.floor(Math.random() * 90));
  save.nick = n; persist(); sfx('ok');
  const next = ui.nickNext; ui.nickNext = null;
  if (next) next(); else openScreen(ui.nickFrom || 'main', true);
}
function cancelNick() { ui.nickNext = null; openScreen(ui.nickFrom || 'main', true); }
function nickPress(i) {
  if (i === NICK_KEYS.length) return cancelNick();
  const k = NICK_KEYS[i];
  if (k === 'DEL') nickDel(); else if (k === 'OK') confirmNick(); else nickType(k);
}
function nickNav(k) {
  const n = NICK_KEYS.length, sel = ui.sel, rows = NICK_LAYOUT.length;
  const cur = NICK_POS[sel], inRow = r => NICK_POS.map((p, i) => ({ ...p, i })).filter(p => p.row === r);
  // the key in row r that sits closest under / above the centre cx
  const nearest = (r, cx) => inRow(r).reduce((a, p) => Math.abs(p.x + p.w / 2 - cx) < Math.abs(a.x + a.w / 2 - cx) ? p : a).i;
  if (k === 'left' || k === 'right') {
    if (sel === n) ui.sel = k === 'left' ? n - 1 : 0;
    else { const r = inRow(cur.row), j = r.findIndex(p => p.i === sel); ui.sel = r[(j + (k === 'left' ? r.length - 1 : 1)) % r.length].i; }
  } else if (k === 'up') ui.sel = sel === n ? nearest(rows - 1, NICK_COLS / 2) : cur.row === 0 ? n : nearest(cur.row - 1, cur.x + cur.w / 2);
  else if (k === 'down') ui.sel = sel === n ? nearest(0, NICK_COLS / 2) : cur.row === rows - 1 ? n : nearest(cur.row + 1, cur.x + cur.w / 2);
  else if (k === 'ok') return nickPress(sel);
  else if (k === 'back') return ui.nick ? nickDel() : cancelNick();
  if (ui.sel !== sel) sfx('move');
}
function withNick(fn) { return () => { if (save.nick) fn(); else openNick(fn); }; }

/* online ranking (shared by all players): see /api/ranking.js */
const RANK_API = '/api/ranking';
ui.global = null; ui.onlineState = 'idle';
function rankPost(body) {
  return fetch(RANK_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(r => r.ok ? r.json() : Promise.reject(r.status));
}
function fetchGlobal() {
  ui.onlineState = 'loading';
  fetch(RANK_API, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(d => { if (d && Array.isArray(d.top)) { ui.global = d.top; ui.onlineState = 'ok'; } })
    .catch(() => { ui.onlineState = 'off'; });
}
function beginOnline(r) {
  r.token = null;
  r.pending = rankPost({ op: 'start' }).then(d => { r.token = d.token; if (run === r && save.run) { save.run.token = d.token; persist(); } }).catch(() => {});
}
function claimStage(r, stage, time, score) {
  r.pending = (r.pending || Promise.resolve()).then(() => r.token ? rankPost({ op: 'stage', token: r.token, stage, time, score }) : null)
    .then(d => { if (d && d.token) { r.token = d.token; if (run === r && save.run) { save.run.token = d.token; persist(); } } }).catch(() => {});
}
function submitOnline(r, nick, stage, extra) {
  const lr = ui.lastRank;
  (r.pending || Promise.resolve()).then(() => r.token ? rankPost({ op: 'submit', token: r.token, nick, stage, extra }) : Promise.reject(0))
    .then(d => { ui.global = d.top; ui.onlineState = 'ok'; if (lr && ui.lastRank === lr) lr.online = { place: d.place, best: d.best, total: d.total }; })
    .catch(() => { if (lr) lr.offline = true; });
}

/* ranking: best score per nick, kept in this browser */
function recordRun(stageLabel) {
  if (!run || run.recorded || run.score <= 0) return;
  run.recorded = true;
  const name = save.nick || UI.player;
  save.ranking = Array.isArray(save.ranking) ? save.ranking : [];
  let e = save.ranking.find(r => r.n === name), best = false;
  if (!e) { e = { n: name, s: run.score, st: stageLabel, d: Date.now() }; save.ranking.push(e); best = true; }
  else if (run.score > e.s) { e.s = run.score; e.st = stageLabel; e.d = Date.now(); best = true; }
  save.ranking.sort((a, b) => b.s - a.s); save.ranking = save.ranking.slice(0, 50);
  save.top = Math.max(save.top, run.score); persist();
  ui.lastRank = { name, place: save.ranking.indexOf(e) + 1, best, score: run.score };
  const finished = stageLabel === 'END';
  submitOnline(run, name, finished || !level ? -1 : level.idx, finished || !stageStats ? 0 : Math.max(0, run.score - stageStats.startScore));
}
function drawRankTable(y0, count, lh) {
  const list = (ui.global || save.ranking || []).slice(0, count);
  if (!list.length) { drawText(ctx, ui.onlineState === 'loading' ? '...' : UI.empty, W / 2, y0 + 10, '#9b8fb8', { align: 'center' }); return; }
  const wide = W >= 400, xL = Math.round(W / 2 - (wide ? 150 : 128)), xR = Math.round(W / 2 + (wide ? 150 : 128));
  list.forEach((r, i) => {
    const y = y0 + i * lh, me = r.n === save.nick, hl = ui.lastRank && r.n === ui.lastRank.name;
    if (hl) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 6); ctx.fillStyle = C.mag; ctx.fillRect(xL - 4, y - 2, xR - xL + 8, 11); ctx.globalAlpha = 1; }
    const pc = i === 0 ? C.yel : i === 1 ? '#c0c4d8' : i === 2 ? '#e0904a' : '#9b8fb8';
    drawText(ctx, String(i + 1).padStart(2, ' ') + '.', xL, y, pc);
    drawText(ctx, r.n, xL + 24, y, me ? C.yel : C.white);
    const stl = r.st === 'END' ? UI.end : UI.stage + ' ' + String(r.st || '').replace('E', '');
    if (wide) drawText(ctx, stl, xR - 64, y, C.cyan, { align: 'right' });
    drawText(ctx, fmt(r.s ?? r.score), xR, y, me ? C.yel : C.white, { align: 'right' });
  });
}

/* items for the current screen: [{label, act, dis, onLR}] */
function currentItems() {
  if (state === 'menu') {
    if (ui.screen === 'main') {
      const it = [{ label: UI.newGame, act: withNick(() => newGame(0)) }];
      if (hasSave()) it.push({ label: UI.cont + ' - ' + UI.stage + ' ' + (Math.min(save.run.stage, save.unlocked - 1) + 1), act: withNick(continueRun) });
      it.push({ label: UI.select, act: () => openScreen('select') });
      it.push({ label: UI.howto, act: () => { ui.page = 0; openScreen('howto'); } });
      it.push({ label: UI.options, act: () => openScreen('options') });
      it.push({ label: UI.rank, act: () => { ui.lastRank = null; fetchGlobal(); openScreen('ranking'); } });
      it.push({ label: UI.exit, act: () => { location.href = HOME; } });
      return it;
    }
    if (ui.screen === 'select') {
      const it = LEVELS.map((l, i) => ({ label: (i + 1) + ' ' + (i < save.unlocked ? l.name[LANG] : UI.locked), dis: i >= save.unlocked, act: withNick(() => newGame(i)) }));
      it.push({ label: UI.back, act: () => openScreen('main', true) });
      return it;
    }
    if (ui.screen === 'howto') {
      const it = [];
      if (ui.page < UI.pages.length - 1) it.push({ label: UI.nextPage, act: () => { ui.page++; ui.sel = 0; } });
      if (ui.page > 0) it.push({ label: UI.prevPage, act: () => { ui.page--; ui.sel = 0; } });
      it.push({ label: UI.back, act: () => openScreen('main', true) });
      it.onLR = d => { const np = clamp(ui.page + d, 0, UI.pages.length - 1); if (np !== ui.page) { ui.page = np; ui.sel = 0; sfx('move'); } };
      return it;
    }
    if (ui.screen === 'options') return optionItems(true);
    if (ui.screen === 'nick') return NICK_KEYS.map((k, i) => ({ label: k, act: () => nickPress(i) })).concat([{ label: UI.back, act: cancelNick }]);
    if (ui.screen === 'ranking') return [{ label: UI.back, act: () => openScreen('main', true) }];
    if (ui.screen === 'confirm') return [
      { label: UI.no, act: () => openScreen('options', true) },
      { label: UI.yes, act: () => { const m = save.muted, mu = save.music; for (const k of Object.keys(save)) delete save[k]; save.unlocked = 1; save.best = {}; save.top = 0; save.muted = m; save.music = mu; persist(); ui.note = UI.deleted; ui.noteT = 2; openScreen('options', true); } }
    ];
  }
  if (state === 'pause') {
    if (ui.screen === 'options') return optionItems(false);
    return [
      { label: UI.resume, act: resumeGame },
      { label: UI.restart, act: () => { continueRun(); } },
      { label: UI.options, act: () => openScreen('options') },
      { label: UI.quit, act: goMenu }
    ];
  }
  if (state === 'clear') {
    if (!ui.tally || ui.tally.shown <= ui.tally.rows.length) return [];
    return [
      { label: ui.tally.last ? UI.go : UI.next, act: () => { if (ui.tally.last) { state = 'ending'; ui.sel = 0; ui.t = 0; recordRun('END'); } else startStage(level.idx + 1, true); } },
      { label: UI.menu, act: goMenu }
    ];
  }
  if (state === 'over') return [
    { label: UI.retry, act: () => { run = { score: 0, lives: 3, tokens: 0 }; beginOnline(run); startStage(level.idx, true); } },
    { label: UI.rank, act: () => { goMenu(); ui.screen = 'ranking'; ui.sel = 0; } },
    { label: UI.menu, act: goMenu }
  ];
  if (state === 'ending') return [
    { label: UI.again, act: () => newGame(0) },
    { label: UI.machine, act: () => { location.href = PRODUCT; } },
    { label: UI.menu, act: goMenu }
  ];
  return [];
}
function optionItems(fromMenu) {
  const onoff = v => v ? UI.on : UI.off;
  const it = [
    { label: UI.sound + ': ' + onoff(!muted), act: () => setMuted(!muted), lr: true },
    { label: UI.music + ': ' + onoff(save.music), act: () => setMusic(!save.music), lr: true },
    { label: UI.full + ': ' + onoff(!!document.fullscreenElement), act: toggleFull, lr: true }
  ];
  if (fromMenu) it.unshift({ label: UI.nick + ': ' + (save.nick || '-'), act: () => openNick(null) });
  if (fromMenu) it.push({ label: UI.reset, act: () => { openScreen('confirm'); ui.sel = 0; } });
  it.push({ label: UI.back, act: () => { if (state === 'pause') { ui.screen = 'pause'; ui.sel = 2; sfx('back'); } else openScreen('main', true); } });
  it.onLR = () => { const cur = it[ui.sel]; if (cur && cur.lr) { cur.act(); sfx('move'); } };
  return it;
}
function openScreen(name, back) {
  const from = ui.screen;
  ui.screen = name; ui.sel = 0;
  if (back) { // return the cursor to the item that opened the sub-screen
    const map = { select: UI.select, howto: UI.howto, options: UI.options, ranking: UI.rank };
    if (name === 'main' && map[from]) { const i = currentItems().findIndex(x => x.label === map[from]); ui.sel = Math.max(0, i); }
    if (name === 'options' && from === 'confirm') ui.sel = 4;
    sfx('back');
  } else sfx('ok');
}
function menuInput(k) {
  ensureAudio();
  if (state === 'menu' && ui.screen === 'nick') { nickNav(k); return; }
  if (state === 'clear' && ui.tally && ui.tally.shown <= ui.tally.rows.length) {
    if (k === 'ok' || k === 'back') { ui.tally.t = 0; ui.tally.shown = ui.tally.rows.length + 1; ui.tally.revealed = true; rankSound(); }
    return;
  }
  const items = currentItems();
  if (!items.length) return;
  const move = d => {
    let i = ui.sel;
    for (let n = 0; n < items.length; n++) { i = (i + d + items.length) % items.length; if (!items[i].dis) break; }
    if (i !== ui.sel) { ui.sel = i; sfx('move'); }
  };
  if (k === 'up') move(-1);
  else if (k === 'down') move(1);
  else if (k === 'left' || k === 'right') { if (items.onLR) items.onLR(k === 'left' ? -1 : 1); else move(k === 'left' ? -1 : 1); }
  else if (k === 'ok') { const it = items[clamp(ui.sel, 0, items.length - 1)]; if (it && !it.dis) { if (state !== 'menu' || ui.screen === 'main' || it.label !== UI.back) sfx('ok'); it.act(); } }
  else if (k === 'back') {
    if (state === 'pause') { if (ui.screen === 'options') { ui.screen = 'pause'; ui.sel = 2; sfx('back'); } else resumeGame(); }
    else if (state === 'menu' && ui.screen !== 'main') { if (ui.screen === 'confirm') openScreen('options', true); else if (ui.screen === 'nick') cancelNick(); else openScreen('main', true); }
  }
}
function rankSound() { sfx(ui.tally.rank === 'monster' || ui.tally.rank === 'record' ? 'life' : 'checkpoint'); }

/* drawing helpers */
function drawPanel(x, y, w, h) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = C.ink; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = 'rgba(18,6,45,.94)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.h3; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h);
  ctx.fillStyle = '#1a0844'; ctx.fillRect(x, y + h - 2, w, 2); ctx.fillRect(x + w - 2, y, 2, h);
  ctx.fillStyle = C.mag; ctx.fillRect(x + 2, y + 2, w - 4, 1);
  ctx.fillStyle = C.yel; for (const [cx, cy] of [[x + 4, y + 4], [x + w - 6, y + 4], [x + 4, y + h - 6], [x + w - 6, y + h - 6]]) ctx.fillRect(cx, cy, 2, 2);
}
function drawCursor(x, y) {
  x = Math.round(x + (Math.floor(time * 4) % 2)); y = Math.round(y);
  ctx.fillStyle = C.gl1; ctx.fillRect(x, y, 8, 7); ctx.fillStyle = C.gl2; ctx.fillRect(x, y, 7, 6); ctx.fillStyle = C.gl3; ctx.fillRect(x + 1, y, 3, 1);
  ctx.fillStyle = C.white; ctx.fillRect(x - 2, y + 1, 2, 5); ctx.fillStyle = C.gl2; ctx.fillRect(x + 6, y + 2, 3, 3);
}
function drawItemsList(items, y, opts = {}) {
  const s = opts.scale || 2, lh = opts.lh || s * 7 + 4;
  const colX = opts.center ? null : Math.round(W / 2 - Math.max(...items.map(it => textWidth(it.label, s))) / 2 + 6);
  menuRects = [];
  items.forEach((it, i) => {
    const sel = i === ui.sel, w = textWidth(it.label, s);
    const x = opts.x !== undefined ? opts.x : colX !== null ? colX : Math.round(W / 2 - w / 2), yy = y + i * lh;
    const col = it.dis ? '#5d4f80' : sel ? C.yel : C.white;
    drawText(ctx, it.label, x, yy, col, { scale: s, shadow: it.dis ? null : '#3a0419' });
    if (sel && !it.dis) drawCursor(x - 14, yy + (s * 7) / 2 - 3);
    menuRects.push({ x: x - 18, y: yy - 2, w: w + 36, h: lh, i });
  });
}
function drawLogo(cx, y) {
  const w = 196, h = 74, x = Math.round(cx - w / 2);
  // stepped plate (like an arcade marquee)
  ctx.fillStyle = C.ink; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#3c1765'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.h3; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y, 3, h);
  ctx.fillStyle = '#1a0844'; ctx.fillRect(x, y + h - 3, w, 3); ctx.fillRect(x + w - 3, y, 3, h);
  ctx.fillStyle = C.mag; ctx.fillRect(x + 3, y + 3, w - 6, 1); ctx.fillStyle = C.cyan; ctx.fillRect(x + 3, y + h - 4, w - 6, 1);
  ctx.fillStyle = C.yel; for (const [rx, ry] of [[x + 5, y + 5], [x + w - 8, y + 5], [x + 5, y + h - 8], [x + w - 8, y + h - 8]]) { ctx.fillRect(rx, ry, 3, 3); ctx.fillStyle = '#c8871e'; ctx.fillRect(rx + 2, ry + 2, 1, 1); ctx.fillStyle = C.yel; }
  drawText(ctx, 'MONSTER', cx, y + 8, C.yel, { align: 'center', scale: 4, shadow: '#3a0419' });
  drawText(ctx, 'GAME', cx, y + 40, C.white, { align: 'center', scale: 4, shadow: '#3a0419' });
}
function drawBig(img, x, y, s) { ctx.drawImage(img, 0, 0, img.width, img.height, Math.round(x), Math.round(y), img.width * s, img.height * s); }
function withScreenCam(fn) { const sx = cam.x, sy = cam.y; cam.x = 0; cam.y = 0; try { fn(); } finally { cam.x = sx; cam.y = sy; } }
function drawIcon(kind, x, y) {
  withScreenCam(() => {
    if (kind === 'bagger') drawEnemy({ type: 'bagger', x, y: y - 1, w: 14, h: 14, alive: true, dir: 1, t: time }, time);
    else if (kind === 'sparky') drawEnemy({ type: 'sparky', x: x + 1, y: y, w: 12, h: 12, alive: true, dir: 1, t: time }, time);
    else if (kind === 'glover') drawEnemy({ type: 'glover', x: x - 1, y: y + 1, w: 16, h: 12, alive: true, dir: 1, t: time, state: 'walk' }, time);
    else if (kind === 'token') drawToken(x + 3, y + 2, time);
    else if (kind === 'heart') drawHeart(x + 3, y + 3, C.mag);
    else if (kind === 'crate' || kind === 'cracked' || kind === 'spring') {
      const sv = level; // reuse tile painter on a 1-tile fake level
      level = { cols: 1, grid: Array.from({ length: ROWS }, () => ['.']), springT: null };
      level.grid[0][0] = kind === 'crate' ? 'B' : kind === 'cracked' ? 'X' : 'S';
      ctx.save(); ctx.translate(x - 1, y - 2); ctx.beginPath(); ctx.rect(0, 0, 16, 16); ctx.clip();
      drawTiles(THEMES[0], time);
      ctx.restore(); level = sv;
    } else if (kind === 'check') {
      ctx.fillStyle = '#1a0844'; ctx.fillRect(x + 2, y - 2, 10, 16); ctx.fillStyle = C.g2; ctx.fillRect(x + 3, y - 1, 8, 14);
      ctx.fillStyle = '#0b1d0a'; ctx.fillRect(x + 4, y + 1, 6, 5); ctx.fillStyle = C.eye2; ctx.fillRect(x + 5, y + 2, 1, 1); ctx.fillRect(x + 8, y + 2, 1, 1);
    } else if (kind === 'rage') {
      ctx.fillStyle = '#1a0844'; ctx.fillRect(x, y + 3, 16, 7); ctx.fillStyle = Math.floor(time * 10) % 2 ? C.yel : C.mag; ctx.fillRect(x + 1, y + 4, 14, 5);
    }
  });
}

function drawMenuScreen() {
  ui.noteT = Math.max(0, ui.noteT - 1 / 60);
  if (ui.screen === 'main') {
    drawLogo(W / 2, 8);
    drawText(ctx, UI.copy, W / 2, 88, '#9b8fb8', { align: 'center' });
    if (W >= 400) {
      const f = SPR['idle' + (Math.floor(time * 2) % 2)][0];
      drawBig(f, 22, 120, 3);
      withScreenCam(() => drawEnemy({ type: 'bagger', x: W - 52, y: 168, w: 14, h: 14, alive: true, dir: -1, t: time }, time));
      withScreenCam(() => drawEnemy({ type: 'sparky', x: W - 70, y: 132 + Math.sin(time * 2.4) * 6, w: 12, h: 12, alive: true, dir: -1, t: time }, time));
    }
    drawItemsList(currentItems(), 98, { scale: 2, lh: 16 });
    drawText(ctx, UI.top + '- ' + fmt(save.top) + (save.nick ? '   ' + save.nick : ''), W / 2, 213, C.white, { align: 'center', shadow: '#3a0419' });
    return;
  }
  const title = { select: UI.select, howto: UI.howto, options: UI.options, confirm: UI.reset, nick: UI.enterNick, ranking: UI.rank }[ui.screen] || '';
  drawPanel(8, 8, W - 16, H - 16);
  drawText(ctx, title, W / 2, 18, C.yel, { align: 'center', scale: 2, shadow: '#3a0419' });
  if (ui.screen === 'select') {
    const items = currentItems();
    const x0 = Math.round(W / 2 - 90);
    drawItemsList(items, 46, { scale: 2, lh: 20, x: x0 });
    const i = clamp(ui.sel, 0, LEVELS.length - 1);
    if (ui.sel < LEVELS.length) drawText(ctx, i < save.unlocked ? UI.best + ' ' + fmt(save.best[i] || 0) : '', W / 2, 192, C.cyan, { align: 'center' });
  } else if (ui.screen === 'howto') {
    drawText(ctx, (ui.page + 1) + '/' + UI.pages.length + '  ' + UI.pages[ui.page], W / 2, 38, C.cyan, { align: 'center' });
    if (ui.page === 0) {
      const rows = lastTouch ? UI.touch : UI.keys;
      const kw = Math.max(...rows.map(r => textWidth(r[0]))), dw = Math.max(...rows.map(r => textWidth(r[1])));
      const x0 = Math.round(W / 2 - (kw + 12 + dw) / 2);
      rows.forEach((r, i) => { const y = 54 + i * 15; drawText(ctx, r[0], x0, y, C.yel); drawText(ctx, r[1], x0 + kw + 12, y, C.white); });
    } else if (ui.page === 1) {
      const rows = UI.things, dw = Math.max(...rows.map(r => textWidth(r[1])));
      const x0 = Math.round(W / 2 - (dw + 22) / 2);
      rows.forEach((r, i) => { const y = 52 + i * 13; drawIcon(r[0], x0, y - 3); drawText(ctx, r[1], x0 + 22, y, C.white); });
    } else {
      const lines = UI.goal, x0 = W >= 400 ? 30 : Math.round(W / 2 - 80);
      lines.forEach((l, i) => drawText(ctx, l, x0, 56 + i * 11, i === 0 || i === 3 ? C.yel : C.white));
      if (W >= 400) withScreenCam(() => drawFinish({ x: W - 92, y: 62, w: 51, h: 90 }, time));
    }
    const items = currentItems();
    drawItemsList(items, H - 22 - (items.length - 1) * 11, { scale: 1, lh: 11, center: true });
  } else if (ui.screen === 'nick') {
    const bw = 10 * 18 + 16, bx = Math.round(W / 2 - bw / 2), by = 38;
    ctx.fillStyle = C.ink; ctx.fillRect(bx - 2, by - 2, bw + 4, 36);
    ctx.fillStyle = '#12062d'; ctx.fillRect(bx, by, bw, 32); ctx.fillStyle = C.cyan; ctx.fillRect(bx, by, bw, 2); ctx.fillStyle = C.mag; ctx.fillRect(bx, by + 30, bw, 2);
    for (let i = 0; i < 10; i++) { const ch = (ui.nick || '')[i]; const cx = bx + 8 + i * 18;
      if (ch) drawText(ctx, ch, cx, by + 6, C.yel, { scale: 3, shadow: '#3a0419' });
      else { ctx.fillStyle = i === (ui.nick || '').length && Math.floor(time * 3) % 2 ? C.white : '#3c1765'; ctx.fillRect(cx, by + 24, 15, 3); } }
    // letter board
    const cw = W >= 400 ? 27 : 25, ch = 20, gx = Math.round(W / 2 - cw * NICK_COLS / 2), gy = 80;
    menuRects = [];
    NICK_POS.forEach((p, i) => {
      const k = p.k, x = Math.round(gx + p.x * cw), y = gy + p.row * ch, kw = Math.round(p.w * cw), sel = i === ui.sel;
      const wide = k === 'DEL' || k === 'OK';
      ctx.fillStyle = sel ? C.yel : (k === 'OK' ? '#1c5e1a' : k === 'DEL' ? '#5a1222' : '#2b1049'); ctx.fillRect(x + 1, y + 1, kw - 2, ch - 2);
      ctx.fillStyle = sel ? '#fff6b0' : '#4a2a7a'; ctx.fillRect(x + 1, y + 1, kw - 2, 1);
      const label = k === 'DEL' ? '←' : k;
      drawText(ctx, label, x + kw / 2, y + 6, sel ? '#3a0419' : (wide ? C.white : '#e6defa'), { align: 'center' });
      menuRects.push({ x: x, y: y, w: kw, h: ch, i });
    });
    const by2 = gy + 4 * ch + 10, selBack = ui.sel === NICK_KEYS.length;
    const bl = UI.back, blw = textWidth(bl, 2);
    drawText(ctx, bl, W / 2, by2, selBack ? C.yel : C.white, { align: 'center', scale: 2, shadow: '#3a0419' });
    if (selBack) drawCursor(W / 2 - blw / 2 - 14, by2 + 4);
    menuRects.push({ x: W / 2 - blw / 2 - 18, y: by2 - 2, w: blw + 36, h: 18, i: NICK_KEYS.length });
  } else if (ui.screen === 'ranking') {
    drawText(ctx, ui.onlineState === 'off' ? UI.offline : UI.online, W / 2, 36, ui.onlineState === 'off' ? '#9b8fb8' : C.g3, { align: 'center' });
    drawRankTable(50, 10, 13);
    drawItemsList(currentItems(), H - 26, { scale: 1, lh: 11, center: true });
  } else if (ui.screen === 'options') {
    drawItemsList(currentItems(), 46, { scale: 2, lh: 21 });
    if (ui.noteT > 0) drawText(ctx, ui.note, W / 2, 196, C.g3, { align: 'center' });
  } else if (ui.screen === 'confirm') {
    drawText(ctx, UI.sure, W / 2, 70, C.white, { align: 'center', scale: W >= 400 ? 2 : 1 });
    drawItemsList(currentItems(), 110, { scale: 2, lh: 22 });
  }
}
function drawPauseScreen() {
  if (ui.screen === 'options') {
    drawPanel(W / 2 - 130, 22, 260, 182);
    drawText(ctx, UI.options, W / 2, 34, C.yel, { align: 'center', scale: 2, shadow: '#3a0419' });
    drawItemsList(currentItems(), 66, { scale: 2, lh: 24 });
    return;
  }
  drawPanel(W / 2 - 120, 34, 240, 156);
  drawText(ctx, UI.pause, W / 2, 46, C.yel, { align: 'center', scale: 3, shadow: '#3a0419' });
  drawItemsList(currentItems(), 86, { scale: 2, lh: 22 });
}
function drawClearScreen() {
  const tl = ui.tally; if (!tl || tl.t < 0 && tl.shown === 0) return;
  const pw = Math.min(W - 16, 300), px = Math.round(W / 2 - pw / 2);
  drawPanel(px, 8, pw, H - 16);
  drawText(ctx, UI.stage + ' ' + (level.idx + 1) + ' ' + UI.clear, W / 2, 16, C.yel, { align: 'center', scale: 2, shadow: '#3a0419' });
  drawText(ctx, level.def.name[LANG], W / 2, 33, C.cyan, { align: 'center' });
  const x0 = px + 18, x1 = px + pw - 18;
  tl.rows.forEach((r, i) => {
    if (i >= tl.shown) return;
    const y = 46 + i * 11, strong = i >= tl.rows.length - 2;
    drawText(ctx, r[0], x0, y, strong ? C.yel : '#c9c2e6');
    drawText(ctx, r[1], x1, y, strong ? C.yel : C.white, { align: 'right' });
  });
  if (tl.shown > tl.rows.length) {
    const label = { good: 'GOOD', great: 'GREAT!', monster: 'MONSTER!', record: 'RECORD!' }[tl.rank];
    const col = { good: C.white, great: C.cyan, monster: C.g3, record: Math.floor(time * 8) % 2 ? C.mag : C.yel }[tl.rank];
    drawText(ctx, label, W / 2, 136, col, { align: 'center', scale: 3, outline: C.ink });
    drawItemsList(currentItems(), 166, { scale: 2, lh: 18 });
  }
}
function drawRankLine(y) {
  const r = ui.lastRank; if (!r) return;
  const on = r.online, place = on ? on.place : (r.offline ? r.place : null), best = on ? on.best : r.best;
  const txt = r.name + ' - ' + UI.place + ' ' + (place ? '#' + place : '...') + (best && place ? '  ' + UI.newBest : '');
  drawText(ctx, txt, W / 2, y, best ? (Math.floor(time * 6) % 2 ? C.mag : C.yel) : C.cyan, { align: 'center' });
}
function drawOverScreen() {
  drawText(ctx, UI.over, W / 2, 8, C.white, { align: 'center', scale: 3, shadow: '#3a0419' });
  drawText(ctx, UI.score + ' ' + fmt(run.score), W / 2, 34, C.yel, { align: 'center', scale: 2 });
  drawRankLine(54);
  drawRankTable(68, 5, 12);
  drawItemsList(currentItems(), 136, { scale: 2, lh: 19 });
  drawText(ctx, UI.retryNote, W / 2, 213, '#9b8fb8', { align: 'center' });
}
function drawEndingScreen() {
  drawText(ctx, UI.end1, W / 2, 6, C.yel, { align: 'center', scale: 2, shadow: '#3a0419' });
  drawText(ctx, UI.end2, W / 2, 24, C.g3, { align: 'center' });
  drawText(ctx, UI.total + ' ' + fmt(run.score), W / 2, 36, C.white, { align: 'center', scale: 2, shadow: '#3a0419' });
  drawRankLine(56);
  drawRankTable(70, 5, 12);
  drawItemsList(currentItems(), 140, { scale: 2, lh: 20 });
}

/* pointer support for the pixel menus */
function toCanvas(ev) {
  const r = canvas.getBoundingClientRect(), s = Math.min(r.width / W, r.height / H);
  const ox = r.left + (r.width - W * s) / 2, oy = r.top + (r.height - H * s) / 2;
  return { x: (ev.clientX - ox) / s, y: (ev.clientY - oy) / s - menuOY };
}
function rectAt(p) { return menuRects.find(m => p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h); }
canvas.addEventListener('pointermove', e => {
  if (!menuActive() || e.pointerType === 'touch') return;
  const m = rectAt(toCanvas(e)); const items = currentItems();
  if (m && items[m.i] && !items[m.i].dis && ui.sel !== m.i) { ui.sel = m.i; sfx('move'); }
  canvas.style.cursor = m ? 'pointer' : '';
});
canvas.addEventListener('pointerdown', e => {
  engaged = true; ensureAudio();
  if (e.pointerType === 'touch') lastTouch = true;
  if (!menuActive()) return;
  e.preventDefault();
  if (state === 'clear' && ui.tally && ui.tally.shown <= ui.tally.rows.length) { menuInput('ok'); return; }
  const pt = toCanvas(e), m = rectAt(pt); const items = currentItems();
  if (m && items[m.i] && !items[m.i].dis) { ui.sel = m.i; menuInput('ok'); }
});

document.addEventListener('pointerdown', e => { if (!root.contains(e.target)) engaged = false; }, true);

/* ---------- main loop ---------- */
let acc = 0, last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
  pollPad();
  if (state === 'menu') { renderAttract(dt); inMenuArea(drawMenuScreen); return; }
  if (!level) return;
  acc += dt;
  let steps = 0;
  while (acc >= DT && steps < 5) {
    step(DT); acc -= DT; steps++;
    for (const k in pressed) pressed[k] = false;
  }
  if (steps === 5) acc = 0;
  if (state === 'over') { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); inMenuArea(drawOverScreen); return; }
  render();
  if (state === 'pause') { ctx.fillStyle = 'rgba(6,4,26,.65)'; ctx.fillRect(0, 0, W, H); inMenuArea(drawPauseScreen); }
  else if (state === 'clear') inMenuArea(drawClearScreen);
  else if (state === 'ending') { ctx.fillStyle = 'rgba(6,4,26,.6)'; ctx.fillRect(0, 0, W, H); inMenuArea(drawEndingScreen); }
  else menuRects = [];
}
function step(dt) {
  if (state === 'intro') {
    time += dt; introT -= dt; updateCamera(dt); updateFx(dt); updatePlats(dt);
    if (introT <= 0) state = 'play';
    return;
  }
  if (state === 'play' || state === 'dying') {
    time += dt; if (state === 'play') stageTime += dt;
    updatePlats(dt);
    updatePlayer(dt);
    if (state === 'play' || state === 'dying') { updateEnemies(dt); updateBalls(dt); updateWaves(dt); updateBoss(dt); updateLoose(dt); }
    updateFx(dt); updateCamera(dt);
    return;
  }
  if (state === 'clear' || state === 'ending') {
    time += dt; clearT += dt; updateFx(dt); player.anim += dt;
    if (Math.random() < dt * 8) burst(player.x + rnd(-40, 40), player.y - 20, 6, [C.yel, C.mag, C.cyan, C.g3], 120, 200, 2);
    const tl = ui.tally;
    if (state === 'clear' && tl && tl.shown <= tl.rows.length) {
      tl.t += dt;
      if (tl.t >= 0.28) { tl.t = 0; tl.shown++; if (tl.shown > tl.rows.length) rankSound(); else sfx('tick'); }
    }
  }
}

/* ---------- page wiring ---------- */
root.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  ensureAudio(); engaged = true;
  if (b.dataset.act === 'pause') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
});
document.addEventListener('fullscreenchange', () => { root.classList.toggle('is-fullscreen', !!document.fullscreenElement); fitView(); });
if (matchMedia('(pointer: coarse)').matches) { lastTouch = true; root.classList.add('is-touch'); }
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { lastTouch = true; root.classList.add('is-touch'); } }, { passive: true });
// no text selection, magnifier or callout while holding the buttons (iOS)
const touchPad = root.querySelector('.mg-touch');
if (touchPad) {
  touchPad.addEventListener('touchstart', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  touchPad.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  touchPad.addEventListener('touchend', e => { const b = e.target.closest('[data-act]'); if (e.cancelable) e.preventDefault(); if (b) b.click(); }, { passive: false });
}
root.addEventListener('selectstart', e => e.preventDefault());
root.addEventListener('contextmenu', e => e.preventDefault());
root.addEventListener('pointerdown', () => { const sel = window.getSelection && window.getSelection(); if (sel && sel.rangeCount) sel.removeAllRanges(); });
// pixel labels on the touch buttons (same bitmap font as the game)
root.querySelectorAll('[data-label]').forEach(btn => {
  const txt = btn.dataset.label, s = 2, c = document.createElement('canvas');
  c.width = textWidth(txt.toUpperCase(), s) + 4; c.height = 7 * s + 6;
  const g = c.getContext('2d');
  if (txt === '=' || txt === 'II') { c.width = 22; g.fillStyle = '#06041a'; g.fillRect(4, 4, 16, 3); g.fillRect(4, 12, 16, 3); g.fillStyle = '#ffffff'; g.fillRect(3, 3, 16, 3); g.fillRect(3, 11, 16, 3); }
  else drawText(g, txt, 2, 3, '#ffffff', { scale: s, shadow: '#06041a' });
  c.className = 'mg-tb-label'; c.setAttribute('aria-hidden', 'true'); btn.textContent = ''; btn.append(c);
});

fitView(true);
setMuted(muted);
fetchGlobal();
requestAnimationFrame(frame);
// test hook
window.__monsterGame = { get state() { return state; }, get player() { return player; }, get level() { return level; }, get run() { return run; }, get ui() { return ui; }, get rects() { return menuRects.map(r => ({ ...r, y: r.y + menuOY })); }, get view() { return [W, H]; }, keys, press, release, startStage, step, menuInput };
})();
