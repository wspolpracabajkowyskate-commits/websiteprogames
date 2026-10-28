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
      0: ['↓ ON THE GROUND BREAKS CRACKED WALLS', 'SMASH ON THE GROUND BREAKS WALLS'],
      A: ['LOW GRAVITY! YOU JUMP HIGHER', 'LOW GRAVITY! YOU JUMP HIGHER'],
      C: ['UFOS SHOOT DOWN! STOMP OR PUNCH', 'UFOS SHOOT DOWN! STOMP OR PUNCH'],
      E: ['GHOSTS FADE - HIT THEM WHEN VISIBLE', 'GHOSTS FADE - HIT THEM WHEN VISIBLE'],
      G: ['PUMPKINS JUMP AT YOU! STOMP THEM', 'PUMPKINS JUMP AT YOU! STOMP THEM'],
      N: ['CRUMBLING BLOCKS - KEEP MOVING!', 'CRUMBLING BLOCKS - KEEP MOVING!'],
      J: ['ICE IS SLIPPERY - BRAKE EARLY!', 'ICE IS SLIPPERY - BRAKE EARLY!'],
      L: ['WATCH OUT FOR FALLING ICICLES!', 'WATCH OUT FOR FALLING ICICLES!'],
      O: ['LAVA BURNS! FIREBALLS JUMP OUT', 'LAVA BURNS! FIREBALLS JUMP OUT'],
      Q: ['GOLDEN ARENA: MEGA BAG IS WAITING!', 'GOLDEN ARENA: MEGA BAG IS WAITING!'],
      a: ['PUNCH THE TARGET = SWITCH THE BLOCKS', 'PUNCH THE TARGET = SWITCH THE BLOCKS'],
      d: ['CONVEYORS PUSH YOU - RUN AGAINST THEM', 'CONVEYORS PUSH YOU - RUN AGAINST THEM'],
      i: ['K = KICK THE BALL INTO FAR TARGETS', 'KICK THE BALL INTO FAR TARGETS'],
      m: ['LASERS BLINK - CROSS WHEN THEY ARE OFF', 'LASERS BLINK - CROSS WHEN THEY ARE OFF'],
      n: ['SMASH THE PAD FROM THE AIR = 1000!', 'SMASH THE PAD FROM THE AIR = 1000!'],
      r: ['FANS BLOW YOU UP - FLOAT ACROSS', 'FANS BLOW YOU UP - FLOAT ACROSS'],
      w: ['SHORT CIRCUIT! RUN FROM THE STORM!', 'SHORT CIRCUIT! RUN FROM THE STORM!'],
      x: ['CURRENT RUNS ALONG THE TRACKS - JUMP IT', 'CURRENT RUNS ALONG THE TRACKS - JUMP IT'],
      y: ['THE CORE OF THE MACHINE: GIGA BAG!', 'THE CORE OF THE MACHINE: GIGA BAG!']
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
      0: ['↓ NA ZIEMI KRUSZY PĘKNIĘTE ŚCIANY', 'MŁOT NA ZIEMI KRUSZY ŚCIANY'],
      A: ['NISKA GRAWITACJA! SKACZESZ WYŻEJ', 'NISKA GRAWITACJA! SKACZESZ WYŻEJ'],
      C: ['UFO STRZELA W DÓŁ! SKOCZ LUB UDERZ', 'UFO STRZELA W DÓŁ! SKOCZ LUB UDERZ'],
      E: ['DUCHY ZNIKAJĄ - BIJ, GDY SĄ WIDOCZNE', 'DUCHY ZNIKAJĄ - BIJ, GDY SĄ WIDOCZNE'],
      G: ['DYNIE SKACZĄ NA CIEBIE! SKOCZ NA NIE', 'DYNIE SKACZĄ NA CIEBIE! SKOCZ NA NIE'],
      N: ['KRUSZĄCE BLOKI - NIE STÓJ W MIEJSCU!', 'KRUSZĄCE BLOKI - NIE STÓJ W MIEJSCU!'],
      J: ['LÓD JEST ŚLISKI - HAMUJ WCZEŚNIEJ!', 'LÓD JEST ŚLISKI - HAMUJ WCZEŚNIEJ!'],
      L: ['UWAŻAJ NA SPADAJĄCE SOPLE!', 'UWAŻAJ NA SPADAJĄCE SOPLE!'],
      O: ['LAWA PARZY! UWAGA NA KULE OGNIA', 'LAWA PARZY! UWAGA NA KULE OGNIA'],
      Q: ['ZŁOTA ARENA: CZEKA MEGA BAG!', 'ZŁOTA ARENA: CZEKA MEGA BAG!'],
      a: ['UDERZ W TARCZĘ = PRZEŁĄCZ BLOKI', 'UDERZ W TARCZĘ = PRZEŁĄCZ BLOKI'],
      d: ['TAŚMY CIĘ PCHAJĄ - BIEGNIJ POD PRĄD', 'TAŚMY CIĘ PCHAJĄ - BIEGNIJ POD PRĄD'],
      i: ['K = KOPNIJ PIŁKĘ W DALEKĄ TARCZĘ', 'KOP = KOPNIJ PIŁKĘ W DALEKĄ TARCZĘ'],
      m: ['LASERY MIGAJĄ - PRZEJDŹ, GDY ZGASNĄ', 'LASERY MIGAJĄ - PRZEJDŹ, GDY ZGASNĄ'],
      n: ['MŁOT Z POWIETRZA W SIŁOMIERZ = 1000!', 'MŁOT Z POWIETRZA W SIŁOMIERZ = 1000!'],
      r: ['WENTYLATORY UNOSZĄ - PRZELEĆ NAD', 'WENTYLATORY UNOSZĄ - PRZELEĆ NAD'],
      w: ['SPIĘCIE! UCIEKAJ PRZED BURZĄ!', 'SPIĘCIE! UCIEKAJ PRZED BURZĄ!'],
      x: ['PRĄD BIEGNIE PO ŚCIEŻKACH - PRZESKOCZ', 'PRĄD BIEGNIE PO ŚCIEŻKACH - PRZESKOCZ'],
      y: ['SERCE AUTOMATU: GIGA BAG!', 'SERCE AUTOMATU: GIGA BAG!']
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
// players who beat BIG BAG before stages 6-10 existed go straight on to stage 6
if ((save.best[4] | 0) > 0) save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, 6));
if ((save.best[9] | 0) > 0) save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, 11));
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
  { sky: ['#06041a', '#2b0b4f'], far: '#120530', far2: '#1c0844', base: '#1c3a12', lite: '#35a427', dark: '#0b1d0a', edge: '#8bed36', edge2: '#ffe14a', bolt: '#c4ff7a', bolt2: '#fc567e', arena: true },
  // 5 GAGARINA – space station
  { sky: ['#02010a', '#0b1236'], far: '#141a3a', far2: '#1c2450', base: '#2a3352', lite: '#5a6a9a', dark: '#141a30', edge: '#63fafe', edge2: '#ffe14a', bolt: '#63fafe', bolt2: '#ffe14a', space: true, metal: true },
  // 6 Halloween night
  { sky: ['#07020f', '#2a0f2e'], far: '#140818', far2: '#1e0c24', base: '#2e1a24', lite: '#5a3040', dark: '#160a12', edge: '#ff8a1e', edge2: '#a46bff', bolt: '#ff8a1e', bolt2: '#a46bff', halloween: true },
  // 7 frozen hall
  { sky: ['#06122a', '#1b4a7a'], far: '#14304f', far2: '#1a3d60', base: '#2a5d8a', lite: '#7cc4ee', dark: '#163a5c', edge: '#ffffff', edge2: '#63fafe', bolt: '#c8f6ff', bolt2: '#8bed36', ice: true, snow: true },
  // 8 volcano
  { sky: ['#140303', '#5a1408'], far: '#2a0806', far2: '#3a0e08', base: '#3a1a14', lite: '#6e3020', dark: '#1e0a08', edge: '#ff8a1e', edge2: '#ffe14a', bolt: '#ffe14a', bolt2: '#ff8a1e', lava: true },
  // 9 final round – golden arena
  { sky: ['#0a0418', '#3a1a05'], far: '#1e0c20', far2: '#2a1030', base: '#3a2a0e', lite: '#c8871e', dark: '#1a1006', edge: '#ffe14a', edge2: '#fc567e', bolt: '#ffe14a', bolt2: '#fc567e', arena: true, gold: true },
  // ACT III – inside the MONSTER 3in1 machine
  // 10 boxer works: steel and red
  { sky: ['#0c0408', '#3a0e14'], far: '#1e0a10', far2: '#2a1018', base: '#3c4058', lite: '#8a8fa8', dark: '#1c1e2c', edge: '#e8283c', edge2: '#ffe14a', bolt: '#e8283c', bolt2: '#ffe14a', machine: 'boxer', metal: true },
  // 11 kicker stadium: night pitch under floodlights
  { sky: ['#030a14', '#0c2a3c'], far: '#0a1c2a', far2: '#102838', base: '#1c3a2a', lite: '#35a427', dark: '#0b1d12', edge: '#c4ff7a', edge2: '#63fafe', bolt: '#63fafe', bolt2: '#c4ff7a', machine: 'kicker' },
  // 12 hammer tower: purple and gold scale lights
  { sky: ['#0a0418', '#2a0f4a'], far: '#180a2e', far2: '#22103e', base: '#3a2060', lite: '#7a4ab8', dark: '#1a0c30', edge: '#ffe14a', edge2: '#fc567e', bolt: '#ffe14a', bolt2: '#fc567e', machine: 'hammer' },
  // 13 short circuit: dark cable tunnel, green storm
  { sky: ['#020604', '#0c1a10'], far: '#0a140c', far2: '#0e1c12', base: '#1e2a22', lite: '#3e5a46', dark: '#0a120c', edge: '#8bed36', edge2: '#63fafe', bolt: '#8bed36', bolt2: '#c4ff7a', machine: 'cables' },
  // 14 the green circuit board
  { sky: ['#021006', '#06301a'], far: '#0a3a1a', far2: '#0e4a22', base: '#0f5a26', lite: '#2a9a4a', dark: '#063015', edge: '#c4ff7a', edge2: '#e0b040', bolt: '#c4ff7a', bolt2: '#ffffff', board: true }
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
  thud() { tone(70, 0.4, 'sine', 0.5, -20); noise(0.3, 0.3, 400); },
  laser() { tone(1400, 0.12, 'square', 0.06, -900); },
  crumble() { noise(0.18, 0.18, 900); },
  crack() { noise(0.08, 0.12, 5000); tone(1800, 0.05, 'triangle', 0.05, -400); },
  shatter() { noise(0.2, 0.2, 6000); tone(2200, 0.08, 'triangle', 0.06, -1200); },
  fire() { noise(0.25, 0.14, 1400); tone(160, 0.2, 'sawtooth', 0.06, 120); },
  boo() { tone(330, 0.35, 'triangle', 0.08, -120); tone(392, 0.35, 'triangle', 0.06, -150, 0.05); },
  ding() { tone(1568, 0.12, 'square', 0.09); tone(2093, 0.18, 'triangle', 0.08, 0, 0.06); },
  bell() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, 0, i * 0.05)); noise(0.1, 0.2, 3000); },
  thunder() { noise(0.6, 0.45, 1600); tone(60, 0.5, 'sawtooth', 0.2, -20); },
  storm() { noise(0.2, 0.08, 3500); tone(90 + Math.random() * 40, 0.15, 'sawtooth', 0.04, 30); },
  zapLine() { tone(2400, 0.06, 'square', 0.03, -1200); }
};
function sfx(name) { if (!muted && AC) try { SFX[name](); } catch (e) { /* ignore */ } }
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = [
  { bpm: 138, bass: [45, 45, 57, 45, 48, 48, 60, 48, 43, 43, 55, 43, 40, 40, 52, 47], lead: [69, 72, 76, 72, 72, 76, 79, 76, 67, 71, 74, 71, 64, 68, 71, 76] },
  { bpm: 128, bass: [38, 38, 50, 38, 41, 41, 53, 41, 36, 36, 48, 36, 43, 43, 55, 45], lead: [62, 65, 69, 74, 65, 69, 72, 77, 60, 64, 67, 72, 67, 71, 74, 79] },
  { bpm: 146, bass: [40, 40, 52, 40, 43, 43, 55, 43, 38, 38, 50, 38, 35, 35, 47, 42], lead: [64, 67, 71, 76, 67, 71, 74, 79, 62, 66, 69, 74, 59, 63, 66, 71] },
  { bpm: 152, bass: [41, 41, 53, 41, 44, 44, 56, 44, 39, 39, 51, 39, 36, 36, 48, 43], lead: [65, 68, 72, 77, 68, 72, 75, 80, 63, 67, 70, 75, 60, 64, 67, 72] },
  { bpm: 164, bass: [33, 33, 45, 33, 34, 34, 46, 34, 36, 36, 48, 36, 32, 32, 44, 39], lead: [69, 72, 75, 81, 70, 73, 76, 82, 72, 75, 78, 84, 68, 71, 74, 80] },
  // GAGARINA: floaty, wide intervals
  { bpm: 120, bass: [36, 36, 43, 36, 41, 41, 48, 41, 38, 38, 45, 38, 43, 43, 50, 47], lead: [72, 79, 84, 79, 77, 84, 89, 84, 74, 81, 86, 81, 79, 86, 91, 86] },
  // Halloween: minor, creepy chromatic steps
  { bpm: 132, bass: [38, 38, 50, 38, 37, 37, 49, 37, 36, 36, 48, 36, 37, 37, 49, 41], lead: [62, 65, 69, 70, 69, 65, 62, 61, 60, 63, 67, 68, 67, 63, 61, 62] },
  // frozen hall: bright, staccato
  { bpm: 144, bass: [40, 40, 47, 40, 45, 45, 52, 45, 43, 43, 50, 43, 38, 38, 45, 42], lead: [76, 79, 83, 88, 81, 84, 88, 93, 79, 83, 86, 91, 74, 78, 81, 86] },
  // volcano: heavy and fast
  { bpm: 158, bass: [33, 33, 33, 45, 34, 34, 34, 46, 31, 31, 31, 43, 33, 33, 36, 40], lead: [57, 60, 64, 63, 58, 62, 65, 64, 55, 58, 62, 61, 57, 60, 64, 69] },
  // golden arena
  { bpm: 170, bass: [33, 33, 45, 33, 36, 36, 48, 36, 31, 31, 43, 31, 35, 35, 47, 40], lead: [69, 72, 76, 81, 72, 76, 79, 84, 67, 71, 74, 79, 71, 75, 78, 83] },
  // boxer works: punchy, mechanical
  { bpm: 140, bass: [38, 38, 38, 50, 38, 38, 41, 43, 36, 36, 36, 48, 36, 36, 39, 41], lead: [74, 74, 77, 74, 79, 77, 74, 72, 72, 72, 75, 72, 77, 75, 72, 70] },
  // kicker stadium: chant-like, major
  { bpm: 136, bass: [43, 43, 50, 43, 48, 48, 55, 48, 45, 45, 52, 45, 50, 50, 57, 50], lead: [79, 79, 83, 86, 84, 84, 88, 91, 81, 81, 84, 88, 86, 83, 79, 83] },
  // hammer tower: rising steps
  { bpm: 148, bass: [36, 43, 48, 43, 38, 45, 50, 45, 40, 47, 52, 47, 41, 48, 53, 55], lead: [72, 74, 76, 79, 74, 76, 79, 81, 76, 79, 81, 84, 79, 81, 84, 88] },
  // short circuit: tense, fast
  { bpm: 176, bass: [33, 33, 33, 33, 34, 34, 34, 34, 33, 33, 33, 33, 31, 31, 32, 32], lead: [69, 68, 69, 72, 70, 69, 70, 74, 69, 68, 69, 76, 67, 68, 71, 75] },
  // green board: epic finale
  { bpm: 172, bass: [33, 45, 33, 45, 29, 41, 29, 41, 31, 43, 31, 43, 28, 40, 32, 44], lead: [76, 81, 84, 88, 77, 81, 84, 89, 79, 83, 86, 91, 80, 83, 88, 92] }
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
    icicles: [], fires: [], shots: [], crumble: {}, G: def.gravity || 1,
    lasers: [], fans: [], sw: false, swT: 0, strikes: [], chase: null,
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
      case 'Z': L.boss = makeBoss(px + T / 2, py, def); break;
      case 'D': L.doors.push({ c, r }); break;
      case 'u': L.enemies.push(makeEnemy('ufo', px + 1, py + 4)); break;
      case 'q': L.enemies.push(makeEnemy('ghost', px + 2, py + 1)); break;
      case 'p': L.enemies.push(makeEnemy('pumpkin', px + 1, py + 3)); break;
      case 'v': L.icicles.push({ x: px + 4, y: py, w: 8, h: 14, hy: py, state: 'hang', t: 0, vy: 0 }); break;
      case 'f': L.fires.push({ x: px + 3, y: py + 4, w: 10, h: 10, y0: py + 4, vy: 0, t: 0.6 + hash(c, r) * 1.6, up: false }); grid[r][c] = '~'; keep = true; break;
      default:
        if (HINT_IDS.includes(ch)) L.hints.push({ x: px, y: py, id: ch });
        else keep = true;
    }
    if (!keep) grid[r][c] = '.';
  }
  // act III: lasers shoot down from their emitter, fans blow up to 8 tiles high
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < x0; c++) {
    if (grid[r][c] === 'l') L.lasers.push({ c, r, ph: (c * 0.12) % 3 });
    if (grid[r][c] === 'k') { let top = r - 1; while (top > 0 && r - top < 8 && !SOLID[grid[top - 1][c]]) top--; L.fans.push({ c, r, top }); }
  }
  if (def.chase) L.chase = { x: L.start.x - 7 * T, speed: def.chase, on: false };
  L.totalTokens = L.tokens.length + countCrateTokens(grid);
  return L;
}
function countCrateTokens(grid) { let n = 0; for (const row of grid) for (const ch of row) if (ch === 'B') n += 3; return n; }
const HINT_IDS = '0123456789ACEGJLNOQadimnrwxy';
// T target, < > conveyors, Y hammer pad, k fan, l laser emitter, e electric track; R / U switch blocks (see isSolid)
const SOLID = { '#': 1, 'B': 1, 'H': 1, 'X': 1, 'S': 1, 'I': 1, 'c': 1, 'T': 1, '<': 1, '>': 1, 'Y': 1, 'k': 1, 'l': 1, 'e': 1 };
const HAZARD = { '^': 1, '~': 1 };
function tile(c, r) {
  if (c < 0 || c >= level.cols) return '#';
  if (r < 0 || r >= ROWS) return '.';
  return level.grid[r][c];
}
// switch blocks: red ones stand while the switch is off, blue ones while it is on
const isSolid = ch => ch === 'R' ? !level.sw : ch === 'U' ? level.sw : !!SOLID[ch];
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
  if (type === 'ufo') { e.w = 14; e.h = 9; e.bx = x; e.by = y; e.vx = 0; e.shoot = 1.2 + Math.random(); }
  if (type === 'ghost') { e.w = 12; e.h = 14; e.vx = 0; e.vis = true; }
  if (type === 'pumpkin') { e.w = 14; e.h = 13; e.vx = -20; e.hop = rnd(0.8, 1.6); }
  return e;
}
// ghosts can only be hit (and only hurt) while they are visible
const canHit = e => e.alive && (e.type !== 'ghost' || e.vis);
function makeBoss(cx, y, def) {
  const hp = (def && def.bossHp) || 8;
  return { cx, x: cx - 20, y: y - 10, w: 40, h: 56, hp, maxHp: hp, state: 'wait', t: 0, swing: 0, vy: 0, inv: 0, hits: 0, next: 2.5, hangY: 2 * T, flash: 0, sparkT: 0,
    name: (def && def.bossName) || 'BIG BAG', mega: hp > 8, giga: !!(def && def.bossStyle === 'giga'), boltT: 3, extra: [] };
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
/* act III: targets flip every switch block in the stage */
function hitTarget(c, r) {
  if (tile(c, r) !== 'T' || level.swT > 0) return false;
  level.sw = !level.sw; level.swT = 0.35; level.tflash = { c, r, t: 0.5 };
  sfx('ding'); shake = Math.max(shake, 0.1);
  burst(c * T + 8, r * T + 8, 10, [level.sw ? '#4aa8ff' : C.gl2, C.white, C.yel], 120, 200, 1);
  pop(c * T + 8, r * T - 4, LANG === 'pl' ? 'KLIK!' : 'CLICK!', level.sw ? '#7ac8ff' : C.gl3, 1, 0.8);
  // anything caught inside a block that just appeared is pushed up onto it
  unstick(player);
  for (const e of level.enemies) if (e.alive && e.type !== 'ghost' && e.type !== 'ufo' && e.type !== 'sparky') unstick(e);
  return true;
}
function unstick(b) {
  for (let n = 0; n < 4; n++) {
    let top = null;
    for (let r = Math.floor(b.y / T); r <= Math.floor((b.y + b.h - 0.001) / T); r++)
      for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - 0.001) / T); c++) if (isSolid(tile(c, r))) top = top === null ? r : Math.min(top, r);
    if (top === null) return;
    b.y = top * T - b.h; b.vy = Math.min(b.vy || 0, 0);
  }
}
function nudgeX(b, dx) {
  b.x += dx; const dir = Math.sign(dx); if (!dir) return;
  const c = Math.floor((dir > 0 ? b.x + b.w - 0.001 : b.x) / T);
  for (let r = Math.floor(b.y / T); r <= Math.floor((b.y + b.h - 0.001) / T); r++) if (isSolid(tile(c, r))) { b.x = dir > 0 ? c * T - b.w : (c + 1) * T; break; }
}
const CONVEYOR = 55;
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
    for (let c = Math.floor(rect.x / T); c <= Math.floor((rect.x + rect.w - 1) / T); c++) if (breakCrate(c, r) || hitTarget(c, r)) hit = true;
  // enemies
  for (const e of level.enemies) if (canHit(e) && overlap(rect, e)) { killEnemy(e, kind, rect.x + rect.w / 2 < e.x + e.w / 2 ? 1 : -1); hit = true; }
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
  const bc = { sparky: [C.cyan, C.white], glover: [C.gl2, C.white], ufo: [C.cyan, '#c0c4d8', C.g3], ghost: [C.white, '#c9c2e6'], pumpkin: ['#e8701e', C.yel, '#35a427'] }[e.type] || [C.h3, C.cyan];
  burst(e.x + e.w / 2, e.y + e.h / 2, 10, bc, 150, 300, 2);
  if (e.type === 'ghost') sfx('boo');
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
  if (B.hp <= 0) {
    B.state = 'ko'; B.t = 0; addScore(5000); pop(B.x + B.w / 2, B.y - 20, STR.pops.ko, C.mag, 4, 2); sfx('clear'); stopMusic();
    // the fight is over: shockwaves vanish and nothing can hurt the monster any more
    waves = []; B.extra = []; level.shots = []; level.strikes = [];
    for (const e of level.enemies) if (e.alive && e.spawned) killEnemy(e, 'smash', 1);
    player.inv = Math.max(player.inv, 3);
  }
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
  balls = []; waves = []; level.shots = []; level.strikes = [];
  if (level.chase) { level.chase.x = cp.x - 10 * T; level.chase.wait = 1.5; }
  if (level.boss && level.boss.state !== 'gone' && level.boss.state !== 'ko' && level.boss.state !== 'wait') resetBossArena();
  else if (level.boss && (level.boss.state === 'gone' || level.boss.state === 'ko')) openArena();
  state = 'play'; startMusic(level.def.theme);
}
function openArena() { for (const d of level.doors) setTile(d.c, d.r, '.'); }
function resetBossArena() {
  const B = level.boss, nb = makeBoss(B.cx, B.y, level.def);
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
  const ice = p.onGround && p.groundTile === 'I', G = level.G;
  if (!locked) {
    if (dir) {
      const acc = ice ? 380 : p.onGround ? 1100 : 780;
      if (Math.sign(p.vx) !== dir && p.onGround) p.vx += dir * (ice ? 520 : 1500) * dt; else p.vx += dir * acc * dt;
      p.vx = clamp(p.vx, -maxRun, maxRun); p.face = dir;
    } else {
      const dec = (ice ? 90 : p.onGround ? 1400 : 300) * dt;
      p.vx = Math.abs(p.vx) <= dec ? 0 : p.vx - Math.sign(p.vx) * dec;
    }
    if (ice && Math.abs(p.vx) > 60 && (dir === 0 || Math.sign(p.vx) !== dir) && Math.random() < dt * 30)
      particles.push({ x: p.x + 6, y: p.y + p.h - 1, vx: -p.vx * 0.2, vy: rnd(-40, -10), life: 0.3, t: 0, color: '#e6f8ff', size: 1, grav: 200 });
  } else if (p.smashing) p.vx = 0; else p.vx *= ice ? 0.97 : 0.8;
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
  else p.vy = Math.min(p.vy + 980 * G * dt, G < 1 ? 300 : 430);
  // fans: an updraft above every fan tile
  p.inFan = false;
  if (!p.smashing) for (const f of level.fans)
    if (p.x + p.w > f.c * T + 2 && p.x < f.c * T + T - 2 && p.y + p.h > f.top * T && p.y + p.h <= f.r * T + 1) { p.vy = Math.max(p.vy - 2300 * dt, -240); p.inFan = true; break; }
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
  // conveyor belts carry the monster
  if (p.onGround && (p.groundTile === '<' || p.groundTile === '>')) nudgeX(p, (p.groundTile === '>' ? 1 : -1) * CONVEYOR * dt);
  // spring
  if (p.onGround && p.groundTile === 'S') {
    const strong = p.smashing;
    p.vy = (strong ? -700 : -520) * Math.sqrt(level.G); p.onGround = false; p.springing = true; p.smashing = false; p.act = null;
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
  // crumbling blocks under the feet start to shake
  if (p.onGround && !p.onPlat) {
    const r = Math.floor((p.y + p.h) / T);
    for (const c of [Math.floor(p.x / T), Math.floor((p.x + p.w - 1) / T)]) if (tile(c, r) === 'c') crumbleAt(c, r);
  }
  // safe spot for pit respawn
  if (p.onGround && !p.onPlat && p.groundTile !== 'S') {
    const r = Math.floor((p.y + p.h) / T);
    const l = tile(Math.floor(p.x / T), r), rr = tile(Math.floor((p.x + p.w - 1) / T), r);
    const firm = ch => (isSolid(ch) || ch === '=') && ch !== 'c';
    if (firm(l) && firm(rr) && !hazardAt(p)) p.safe = { x: p.x, y: p.y };
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
  if (rage) for (const e of level.enemies) if (canHit(e) && overlap(p, e)) killEnemy(e, 'rage', p.x < e.x ? 1 : -1);
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
    if (HAZARD[tile(c, r)] && b.y + b.h > r * T + 7) return true;
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
    hitTarget(c, r);
  }
  if (broke) pop(p.x + 6, p.y - 8, 'SMASH!', C.yel, 2, 0.9);
  // shockwave
  const zone = { x: p.x - 52, y: p.y - 10, w: p.w + 104, h: p.h + 14 };
  for (const e of level.enemies) if (canHit(e) && overlap(zone, e)) killEnemy(e, 'smash', e.x > p.x ? 1 : -1);
  const B = level.boss;
  if (B && Math.abs(B.x + B.w / 2 - (p.x + 6)) < 72 && B.state === 'dazed') hitBoss(2, 'smash');
  for (let i = 0; i < 2; i++) particles.push({ ring: true, x: p.x + 6, y: p.y + p.h, r: 4, vr: 220, t: 0, life: 0.3, color: i ? C.cyan : C.yel });
  burst(p.x + 6, p.y + p.h, 14, ['#9b8fb8', C.yel, C.white], 160, 400, 2);
  // hammer strength tester: a smash from the air rings the bell and throws the monster up
  const pc = [Math.floor(p.x / T), Math.floor((p.x + p.w - 1) / T)].find(c => tile(c, r) === 'Y');
  if (pc !== undefined) {
    p.vy = -620 * Math.sqrt(level.G); p.onGround = false; p.springing = true;
    level.padT = level.padT || {}; level.padT[pc + ',' + r] = 1.2;
    sfx('bell'); pop(p.x + 6, p.y - 10, '1000!', C.yel, 2, 1); flash = Math.max(flash, 0.1);
  }
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
    } else if (e.type === 'ufo') {
      // hovers, drifts towards the monster (within its patrol zone) and fires down
      const dx = p.x + p.w / 2 - (e.x + e.w / 2);
      const want = Math.abs(dx) < 8 * T ? Math.sign(dx) * 34 : 0;
      e.vx += (want - e.vx) * Math.min(1, dt * 2);
      e.x = clamp(e.x + e.vx * dt, e.bx - 5 * T, e.bx + 5 * T);
      e.y = e.by + Math.sin(e.t * 2) * 5;
      if (e.vx) e.dir = Math.sign(e.vx);
      e.shoot -= dt;
      if (e.shoot <= 0.35 && !e.charge) e.charge = true;
      if (e.shoot <= 0) {
        e.charge = false; e.shoot = 2.4;
        if (Math.abs(dx) < 7 * T && p.y > e.y) { level.shots.push({ x: e.x + e.w / 2 - 2, y: e.y + e.h, w: 4, h: 7, vx: 0, vy: 115, life: 3 }); sfx('laser'); }
      }
    } else if (e.type === 'ghost') {
      // floats through walls towards the monster; visible 2.4 s, faded 1.3 s
      const cyc = (e.t + e.x * 0.01) % 3.7;
      e.vis = cyc < 2.4;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + 6 - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1;
      const sp = d < 9 * T ? (e.vis ? 26 : 40) : 0;
      e.x += dx / d * sp * dt; e.y += dy / d * sp * dt + Math.sin(e.t * 3) * 6 * dt;
      e.y = clamp(e.y, 0, level.h - e.h - T);
      if (dx) e.dir = Math.sign(dx);
    } else {
      if (e.type === 'glover') {
        const dx = p.x - e.x, seen = Math.abs(dx) < 7 * T && Math.abs(p.y + p.h - (e.y + e.h)) < 28;
        if (e.state === 'walk' && seen && Math.sign(dx) === Math.sign(e.vx || e.dir)) { e.state = 'wind'; e.st = 0.45; e.dir = Math.sign(dx); e.vx = 0; }
        else if (e.state === 'wind') { e.st -= dt; e.vx = 0; if (e.st <= 0) { e.state = 'charge'; e.vx = e.dir * 175; } }
        else if (e.state === 'dizzy') { e.st -= dt; e.vx = 0; if (e.st <= 0) { e.state = 'walk'; e.vx = -e.dir * 36; } }
      }
      if (e.type === 'bagger') { e.hop -= dt; if (e.hop <= 0 && e.onGround) { e.vy = -170; e.hop = rnd(1.6, 3.2); } }
      if (e.type === 'pumpkin') {
        // jack-o'-lantern: creeps, then leaps at the monster
        e.hop -= dt;
        if (e.onGround) {
          if (e.leaping) { e.leaping = false; e.vx = e.dir * 20; }
          if (e.hop <= 0 && Math.abs(p.x - e.x) < 8 * T) { const d = Math.sign(p.x - e.x) || e.dir; e.vy = -250; e.vx = d * 62; e.dir = d; e.leaping = true; e.hop = rnd(1.3, 2.2); }
        }
      }
      e.vy = Math.min(e.vy + 900 * level.G * dt, 400);
      const before = e.vx;
      moveBody(e, dt);
      if (e.onGround && (e.groundTile === '<' || e.groundTile === '>')) nudgeX(e, (e.groundTile === '>' ? 1 : -1) * CONVEYOR * dt);
      if (e.hitWall) {
        if (e.state === 'charge') { e.state = 'dizzy'; e.st = 1.1; shake = 0.1; sfx('thud'); }
        else e.vx = -before;
      }
      // turn at ledges
      if (e.onGround && e.vx && !e.leaping) {
        const fx = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
        const below = tile(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
        if (!isSolid(below) && below !== '=') { if (e.state === 'charge') { e.state = 'dizzy'; e.st = 1.1; } e.vx = e.state === 'dizzy' ? 0 : -e.vx; }
      }
      if (e.vx) e.dir = Math.sign(e.vx);
      if (e.y > level.h + 40) e.alive = false;
    }
    // vs player
    if (!p.dying && canHit(e) && overlap(p, e)) {
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
      hitTarget(b.wallC, b.wallR);
    }
    if (b.onGround && b.groundTile === 'T') hitTarget(b.groundC, b.groundR);
    if (b.onGround) { b.vy = -Math.max(80, Math.abs(b.vy) + 140) * 0.9; if (Math.abs(b.vx) < 60) b.life = Math.min(b.life, 0.3); }
    if (b.hitCeil) { breakCrate(b.ceilC, Math.floor(b.y / T) - 1); hitTarget(b.ceilC, Math.floor(b.y / T) - 1); }
    for (const e of level.enemies) if (canHit(e) && overlap(b, e)) { killEnemy(e, 'ball', Math.sign(b.vx) || 1); b.hits++; b.vx *= 0.9; }
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
  const phase2 = B.hp <= B.maxHp / 2, phase3 = B.mega && B.hp <= B.maxHp / 4;
  const A = 9 * T;
  // delayed shockwaves (game time, so nothing spawns while the game is paused)
  for (const x of B.extra) { x.t -= dt; if (x.t <= 0 && B.state !== 'ko') { waves.push({ x: x.x, y: floorY - 12, w: 12, h: 12, dir: x.dir, speed: x.speed, life: 3 }); } }
  B.extra = B.extra.filter(x => x.t > 0);
  // GIGA BAG calls lightning down on the monster (more bolts in later phases)
  if (B.giga && (B.state === 'swing' || B.state === 'tele' || B.state === 'dazed' || B.state === 'rise')) {
    B.boltT -= dt;
    if (B.boltT <= 0) {
      const n = phase3 ? 3 : phase2 ? 2 : 1;
      for (let i = 0; i < n; i++) level.strikes.push({ x: i === 0 ? p.x + p.w / 2 : clamp(B.cx + rnd(-11, 11) * T, B.cx - 13 * T, B.cx + 13 * T), t: 0.85, s: 'warn' });
      B.boltT = phase3 ? 2.4 : phase2 ? 3.2 : 4.4;
    }
  }
  switch (B.state) {
    case 'wait':
      B.y = -B.h - 10;
      if (p.x > B.cx - 13 * T) {
        for (const d of level.doors) setTile(d.c, d.r, '#');
        B.state = 'intro'; B.t = 0; sfx('thud'); shake = 0.4; pop(B.cx, 4 * T, B.name + '!', B.giga ? C.g3 : B.mega ? C.yel : C.mag, 3, 1.6);
      }
      break;
    case 'intro':
      B.y = Math.min(B.hangY, B.y + 160 * dt); B.x = B.cx - B.w / 2;
      if (B.t > 1.6) { B.state = 'swing'; B.t = 0; B.swing = 0; B.next = 2.2; }
      break;
    case 'swing':
      B.swing += dt * (B.mega ? (phase3 ? 2.2 : phase2 ? 1.85 : 1.35) : phase2 ? 1.6 : 1.1);
      B.x = B.cx + Math.sin(B.swing) * A - B.w / 2; B.y = B.hangY + Math.abs(Math.cos(B.swing)) * 6;
      B.next -= dt;
      if (B.next <= 0) { B.state = 'tele'; B.t = 0; pop(B.x + B.w / 2, B.y - 8, '!', C.yel, 3, 0.6); }
      break;
    case 'tele':
      if (B.t > (phase3 ? 0.32 : phase2 ? 0.45 : B.mega ? 0.55 : 0.65)) { B.state = 'drop'; B.vy = 0; }
      break;
    case 'drop':
      B.vy += 1700 * dt; B.y += B.vy * dt;
      if (B.y + B.h >= floorY) {
        B.y = floorY - B.h; B.state = 'dazed'; B.t = 0; B.hits = 0; shake = 0.5; sfx('thud'); sfx('smash');
        const sp = (phase2 ? 170 : 140) + (B.mega ? 20 : 0);
        const mk = dir => waves.push({ x: B.x + (dir > 0 ? B.w - 4 : -8), y: floorY - 12, w: 12, h: 12, dir, speed: sp, life: 3 });
        mk(1); mk(-1);
        const later = (t, speed) => { B.extra.push({ t, x: B.x + B.w - 4, dir: 1, speed }); B.extra.push({ t, x: B.x - 8, dir: -1, speed }); };
        if (phase2) later(0.45, 120);
        if (phase3) later(0.9, 150);
        burst(B.x + B.w / 2, floorY, 20, ['#9b8fb8', C.yel, C.white], 200, 500, 2);
        const helpers = level.enemies.filter(e => e.alive && e.spawned).length;
        if (phase2 && helpers < (phase3 ? 3 : 2)) {
          // helpers drop in somewhere inside the arena, near the monster
          const kind = phase3 && helpers % 2 ? 'pumpkin' : 'sparky';
          const hx = clamp(p.x, B.cx - 12 * T, B.cx + 12 * T);
          const e = makeEnemy(kind, kind === 'sparky' ? B.x + B.w / 2 - 6 : hx, 6 * T); e.spawned = true; e.bx = hx; level.enemies.push(e);
        }
      }
      break;
    case 'dazed':
      if (B.t > (B.mega ? (phase3 ? 1.6 : phase2 ? 1.9 : 2.3) : phase2 ? 2.1 : 2.6)) { B.state = 'rise'; B.t = 0; }
      break;
    case 'rise':
      B.y -= 140 * dt;
      if (B.y <= B.hangY) {
        B.y = B.hangY; B.state = 'swing'; B.next = phase3 ? rnd(1, 1.6) : phase2 ? rnd(1.4, 2.2) : rnd(2.2, 3.2);
        B.swing = Math.asin(clamp((B.x + B.w / 2 - B.cx) / A, -1, 1));
      }
      break;
    case 'ko':
      if (Math.random() < dt * 20) burst(B.x + rnd(0, B.w), B.y + rnd(0, B.h), 6, [C.h3, C.cyan, C.yel, C.mag], 180, 300, 2);
      B.y += 20 * dt;
      if (B.t > 2.2) {
        B.state = 'gone'; shake = 0.6; flash = 0.4; sfx('smash');
        openArena();
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
    if (t.y > level.h + 20) { t.got = true; level.totalTokens--; } // fell into a pit: no longer counts for ALL TOKENS
  }
  for (const h of level.hearts) if (h.loose && !h.got) { h.vx = 0; h.vy = (h.vy || 0) + 700 * dt; moveBody(h, dt); }
}

/* ---------- stage hazards: crumbling blocks, icicles, fireballs, UFO shots ---------- */
const CRUMBLE_DELAY = 0.5, CRUMBLE_BACK = 4;
function crumbleAt(c, r) {
  const k = c + ',' + r;
  if (!level.crumble[k]) { level.crumble[k] = { c, r, state: 'shake', t: CRUMBLE_DELAY }; sfx('crack'); }
}
function updateHazards(dt) {
  const p = player, G = level.G;
  // crumbling blocks: shake, fall away, grow back when nothing stands in the way
  for (const k in level.crumble) {
    const b = level.crumble[k];
    b.t -= dt;
    if (b.state === 'shake' && b.t <= 0) {
      setTile(b.c, b.r, '.'); b.state = 'gone'; b.t = CRUMBLE_BACK; sfx('crumble');
      burst(b.c * T + 8, b.r * T + 8, 8, [level.theme.lite, level.theme.base, level.theme.edge], 90, 500, 2);
    } else if (b.state === 'gone' && b.t <= 0) {
      const cell = { x: b.c * T, y: b.r * T, w: T, h: T };
      if (overlap(cell, p) || level.enemies.some(e => e.alive && overlap(cell, e))) b.t = 0.3;
      else { setTile(b.c, b.r, 'c'); delete level.crumble[k]; burst(b.c * T + 8, b.r * T + 8, 5, [level.theme.edge], 40, 0, 1); }
    }
  }
  // icicles: drop when the monster walks below, shatter, grow back
  for (const ic of level.icicles) {
    ic.t -= dt;
    const below = p.y > ic.hy && Math.abs(p.x + p.w / 2 - (ic.x + 4)) < 26 && !p.dying;
    if (ic.state === 'hang' && below) { ic.state = 'shake'; ic.t = 0.4; sfx('crack'); }
    else if (ic.state === 'shake' && ic.t <= 0) { ic.state = 'fall'; ic.vy = 0; }
    else if (ic.state === 'fall') {
      ic.vy = Math.min(ic.vy + 900 * G * dt, 420); ic.y += ic.vy * dt;
      if (!p.dying && overlap(p, ic)) { hurtPlayer(ic.x + 4); shatterIcicle(ic); }
      else if (isSolid(tile(Math.floor((ic.x + 4) / T), Math.floor((ic.y + ic.h) / T))) || ic.y > level.h) shatterIcicle(ic);
      else for (const e of level.enemies) if (canHit(e) && e.type !== 'ufo' && overlap(e, ic)) { killEnemy(e, 'smash', 1); shatterIcicle(ic); break; }
    } else if (ic.state === 'gone' && ic.t <= 0) { ic.state = 'grow'; ic.t = 0.8; ic.y = ic.hy; }
    else if (ic.state === 'grow' && ic.t <= 0) ic.state = 'hang';
  }
  // fireballs leap out of the lava and fall back in
  for (const f of level.fires) {
    if (!f.up) {
      f.t -= dt;
      if (f.t <= 0) { f.up = true; f.vy = -400; f.y = f.y0; if (Math.abs(f.x - p.x) < W) sfx('fire'); }
    } else {
      f.vy += 900 * dt; f.y += f.vy * dt;
      if (Math.random() < dt * 25) particles.push({ x: f.x + rnd(2, 8), y: f.y + 8, vx: rnd(-15, 15), vy: rnd(10, 40), life: 0.35, t: 0, color: Math.random() < 0.5 ? '#ff8a1e' : C.yel, size: 2, grav: 0 });
      if (f.y >= f.y0 && f.vy > 0) { f.up = false; f.y = f.y0; f.t = 1.4 + hash(Math.floor(f.x), Math.floor(time)) * 1.2; burst(f.x + 5, f.y0, 6, ['#ff8a1e', C.yel], 60, 300, 1); }
      if (!p.dying && overlap(p, f)) hurtPlayer(f.x + 5);
    }
  }
  // UFO shots
  for (const s of level.shots) {
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if (isSolid(tile(Math.floor((s.x + 2) / T), Math.floor((s.y + s.h) / T)))) { s.life = 0; burst(s.x + 2, s.y + s.h, 4, [C.g3, C.white], 50, 100, 1); }
    else if (!p.dying && overlap(p, s)) { s.life = 0; hurtPlayer(s.x + 2); }
  }
  level.shots = level.shots.filter(s => s.life > 0 && s.y < level.h + 10);
  // act III timers
  level.swT = Math.max(0, level.swT - dt);
  if (level.tflash) { level.tflash.t -= dt; if (level.tflash.t <= 0) level.tflash = null; }
  if (level.padT) for (const k in level.padT) level.padT[k] = Math.max(0, level.padT[k] - dt);
  // lasers: on 1.3 s out of every 3 s, flickering 0.45 s before they fire
  for (const L of level.lasers) {
    const ph = (time + L.ph) % 3, was = L.on;
    L.on = ph < 1.3; L.warn = !L.on && ph > 3 - 0.45;
    let r = L.r + 1; while (r < ROWS && !isSolid(tile(L.c, r))) r++; L.end = r;
    if (L.on && !was && Math.abs(L.c * T - p.x) < W * 0.6) sfx('zapLine');
    if (L.on && Math.random() < dt * 18) particles.push({ x: L.c * T + 8, y: r * T - 1, vx: rnd(-50, 50), vy: rnd(-90, -20), life: 0.25, t: 0, color: C.yel, size: 1, grav: 300 });
    if (L.on && !p.dying && overlap(p, { x: L.c * T + 5, y: (L.r + 1) * T, w: 6, h: (r - L.r - 1) * T })) { hurtPlayer(L.c * T + 8); sfx('zap'); }
  }
  // electric tracks: pulses of current run along them towards the monster
  if (p.onGround && !p.dying) {
    const r = Math.floor((p.y + p.h) / T);
    for (const c of [Math.floor((p.x + 2) / T), Math.floor((p.x + p.w - 3) / T)]) if (tile(c, r) === 'e' && trackLive(c)) { hurtPlayer(c * T + 8); if (!p.dying) { p.vy = -240; sfx('zap'); } break; }
  }
  // short circuit: the storm wall chases the monster and never falls far behind the screen
  const ch = level.chase;
  if (ch && state === 'play') {
    if (ch.wait > 0) ch.wait -= dt; else if (stageTime > 1) ch.on = true;
    if (ch.on && !(ch.wait > 0)) {
      ch.x = Math.max(ch.x + ch.speed * dt, cam.x - 56);
      if (Math.random() < dt * 3) sfx('storm');
      if (!p.dying && p.x < ch.x + 6) { flash = 0.3; killPlayer(); }
    }
  }
  // GIGA BAG lightning: warning marks, then the bolt
  for (const b of level.strikes) {
    b.t -= dt;
    if (b.s === 'warn' && b.t <= 0) { b.s = 'hit'; b.t = 0.28; sfx('thunder'); shake = Math.max(shake, 0.3); burst(b.x, 13 * T, 16, [C.g3, C.white, C.g4], 180, 400, 2); }
    else if (b.s === 'hit') { if (!p.dying && Math.abs(p.x + p.w / 2 - b.x) < 12) hurtPlayer(b.x); }
  }
  level.strikes = level.strikes.filter(b => b.t > 0 || b.s === 'warn');
}
// a pulse of current is 2 tiles long and comes every 16 tiles, running right to left
const trackLive = c => ((time * 6 + c) % 16 + 16) % 16 < 2;
function shatterIcicle(ic) {
  ic.state = 'gone'; ic.t = 3; sfx('shatter');
  burst(ic.x + 4, ic.y + ic.h, 10, ['#e6f8ff', '#9be4ff', C.white], 110, 500, 1);
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
  if (th.space) return drawSpaceBg(th, t);
  if (th.ice) return drawIceBg(th, t);
  if (th.halloween) return drawHalloweenBg(th, t);
  if (th.lava) return drawVolcanoBg(th, t);
  if (th.machine) return drawMachineBg(th, t);
  if (th.board) return drawBoardBg(th, t);
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
/* backgrounds of stages 6-10 */
const wrap = (v, m) => ((v % m) + m) % m;
function disc(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); ctx.fill(); }
function drawSpaceBg(th, t) {
  // nebula + deep star field
  for (const [px, py, r, col] of [[0.3, 0.35, 95, '252,86,126'], [0.9, 0.22, 75, '99,250,254']]) {
    const nx = wrap(W * px - cam.x * 0.02, W + 200) - 100, ny = H * py, g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r);
    g.addColorStop(0, `rgba(${col},.13)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(nx - r, ny - r, r * 2, r * 2);
  }
  for (let i = 0; i < 90; i++) {
    const x = wrap(hash(i, 51) * W * 4 - cam.x * 0.1, W), y = hash(i, 52) * H * 0.85;
    ctx.fillStyle = hash(i, 53) > 0.8 ? C.yel : '#cfd8ff'; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + hash(i, 54)) + i)); ctx.fillRect(x | 0, y | 0, 1, 1);
  }
  ctx.globalAlpha = 1;
  // the Earth, seen from orbit
  const ex = wrap(W * 0.78 - cam.x * 0.03, W + 140) - 70, ey = 48 - cam.y * 0.05, er = 30;
  ctx.globalAlpha = 0.25; disc(ex, ey, er + 4, C.cyan); ctx.globalAlpha = 1;
  disc(ex, ey, er, '#1d5fa8');
  ctx.save(); ctx.beginPath(); ctx.arc(Math.round(ex), Math.round(ey), er, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#35a427';
  for (const [dx, dy, w, h] of [[-20, -14, 16, 10], [-14, -6, 10, 14], [4, -18, 14, 8], [8, -8, 18, 12], [-4, 10, 12, 8], [14, 8, 8, 10]]) ctx.fillRect(Math.round(ex + dx - (t * 2) % 8), Math.round(ey + dy), w, h);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(Math.round(ex - 26 + (t * 3) % 10), Math.round(ey - 4), 20, 2); ctx.fillRect(Math.round(ex - 6), Math.round(ey + 16), 18, 2);
  ctx.fillStyle = 'rgba(2,1,10,.55)'; ctx.beginPath(); ctx.arc(Math.round(ex + 14), Math.round(ey + 6), er, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  disc(wrap(W * 0.18 - cam.x * 0.06, W + 60) - 30, 30 - cam.y * 0.05, 7, '#b8b4c8');
  // far: orbital station modules with solar wings
  const par1 = 0.2, ox = cam.x * par1, by = H - 96 - cam.y * 0.1;
  ctx.fillStyle = th.far; ctx.fillRect(0, by + 6, W, 3);
  for (let k = Math.floor(ox / 150) - 1; k < Math.floor((ox + W) / 150) + 2; k++) {
    const x = k * 150 - ox;
    ctx.fillStyle = th.far; ctx.fillRect(x | 0, by, 56, 16); ctx.fillRect((x + 56) | 0, by + 3, 10, 10);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = (Math.floor(t * 2) + i + k) % 5 ? 'rgba(255,225,74,.45)' : 'rgba(99,250,254,.6)'; ctx.fillRect((x + 6 + i * 10) | 0, by + 6, 3, 3); }
    ctx.fillStyle = th.far2; ctx.fillRect((x + 26) | 0, by - 16, 2, 16); ctx.fillRect((x + 26) | 0, by + 16, 2, 14);
    for (const yy of [by - 30, by + 30]) { ctx.fillStyle = '#1d3a7a'; ctx.fillRect((x + 10) | 0, yy | 0, 34, 14); ctx.fillStyle = '#2f5fb0'; for (let i = 0; i < 4; i++) ctx.fillRect((x + 11 + i * 8.5) | 0, (yy + 1) | 0, 7, 12); }
  }
  // mid: launch towers with rockets
  const ox2 = cam.x * 0.45, b2 = H - 18 - cam.y * 0.2;
  for (let k = Math.floor(ox2 / 260) - 1; k < Math.floor((ox2 + W) / 260) + 2; k++) {
    const x = Math.round(k * 260 - ox2 + 60);
    ctx.fillStyle = th.far2; ctx.fillRect(x, b2 - 70, 4, 90); ctx.fillRect(x + 22, b2 - 70, 4, 90);
    for (let i = 0; i < 9; i++) ctx.fillRect(x, b2 - 70 + i * 10, 26, 1);
    const rx = x + 34;
    ctx.fillStyle = '#d8dcec'; ctx.fillRect(rx, b2 - 62, 12, 62); ctx.fillStyle = '#9aa0b8'; ctx.fillRect(rx + 9, b2 - 62, 3, 62);
    ctx.fillStyle = C.gl2; ctx.fillRect(rx + 2, b2 - 70, 8, 8); ctx.fillRect(rx + 4, b2 - 74, 4, 4); ctx.fillRect(rx - 4, b2 - 12, 4, 12); ctx.fillRect(rx + 12, b2 - 12, 4, 12);
    ctx.fillStyle = C.cyan; ctx.fillRect(rx + 4, b2 - 50, 4, 4);
    ctx.fillStyle = C.gl2; ctx.fillRect(rx, b2 - 30, 12, 2);
  }
}
function drawHalloweenBg(th, t) {
  // moon with an orange halo
  const mx = wrap(W * 0.76 - cam.x * 0.02, W + 80) - 40, my = 42 - cam.y * 0.05;
  ctx.globalAlpha = 0.12; disc(mx, my, 34, '#ff8a1e'); ctx.globalAlpha = 0.2; disc(mx, my, 26, '#ffd27a'); ctx.globalAlpha = 1;
  disc(mx, my, 20, '#f6e7b0'); disc(mx - 6, my - 5, 4, '#e0cf94'); disc(mx + 7, my + 4, 3, '#e0cf94'); disc(mx - 2, my + 9, 2, '#e0cf94');
  // clouds drifting over the moon
  ctx.fillStyle = 'rgba(30,12,40,.75)';
  for (let i = 0; i < 4; i++) { const cx = wrap(hash(i, 81) * W * 2 + t * (6 + i * 2) - cam.x * 0.03, W + 120) - 60, cy = 24 + i * 16 - cam.y * 0.05; ctx.fillRect(cx | 0, cy | 0, 52, 5); ctx.fillRect((cx + 8) | 0, (cy - 3) | 0, 30, 3); }
  // bats
  for (let i = 0; i < 6; i++) {
    const bx = wrap(hash(i, 61) * W * 2 + t * (22 + hash(i, 62) * 20), W + 40) - 20, byy = 18 + hash(i, 63) * 70 + Math.sin(t * 3 + i) * 6, up = Math.floor(t * 8 + i) % 2;
    ctx.fillStyle = '#05010a'; ctx.fillRect(bx | 0, byy | 0, 3, 2);
    if (up) { ctx.fillRect((bx - 3) | 0, (byy - 2) | 0, 3, 2); ctx.fillRect((bx + 3) | 0, (byy - 2) | 0, 3, 2); } else { ctx.fillRect((bx - 3) | 0, (byy + 1) | 0, 3, 1); ctx.fillRect((bx + 3) | 0, (byy + 1) | 0, 3, 1); }
  }
  // far: rolling hills and a haunted house
  const ox = cam.x * 0.2, b1 = H - 40 - cam.y * 0.1;
  ctx.fillStyle = th.far;
  for (let x = 0; x < W; x += 4) { const h = 26 + Math.sin((x + ox) * 0.012) * 14 + Math.sin((x + ox) * 0.031) * 6; ctx.fillRect(x, (b1 - h) | 0, 4, h + 60); }
  for (let k = Math.floor(ox / 360) - 1; k < Math.floor((ox + W) / 360) + 2; k++) {
    const x = Math.round(k * 360 - ox + 120), y = Math.round(b1 - 60), hc = '#241030';
    ctx.fillStyle = hc; ctx.fillRect(x, y, 56, 60); ctx.fillRect(x + 40, y - 22, 14, 24);
    for (let i = 0; i < 10; i++) ctx.fillRect(x - 4 + i * 3, y - i * 2, 64 - i * 6, 2);
    ctx.fillRect(x + 44, y - 30, 6, 8); ctx.fillRect(x + 46, y - 36, 2, 6);
    for (const [wx, wy] of [[8, 10], [24, 10], [8, 24], [44, -14]]) { ctx.fillStyle = (Math.floor(t * 1.5) + wx + k) % 4 ? 'rgba(255,170,40,.8)' : 'rgba(255,225,74,.95)'; ctx.fillRect(x + wx, y + wy, 6, 7); ctx.fillStyle = hc; ctx.fillRect(x + wx + 2, y + wy, 1, 7); }
    ctx.fillStyle = '#140818'; ctx.fillRect(x + 24, y + 26, 10, 14);
  }
  // mid: graveyard
  const ox2 = cam.x * 0.45, b2 = H - 18 - cam.y * 0.2;
  for (let k = Math.floor(ox2 / 46) - 1; k < Math.floor((ox2 + W) / 46) + 2; k++) {
    const x = Math.round(k * 46 - ox2), kind = hash(k, 91);
    ctx.fillStyle = th.far2; ctx.fillRect(x - 2, b2 - 6, 50, 30);
    if (kind < 0.35) { ctx.fillRect(x + 10, b2 - 22, 12, 16); ctx.fillRect(x + 12, b2 - 24, 8, 2); }
    else if (kind < 0.6) { ctx.fillRect(x + 14, b2 - 28, 4, 22); ctx.fillRect(x + 9, b2 - 22, 14, 4); }
    else if (kind < 0.8) { // dead tree
      ctx.fillRect(x + 20, b2 - 50, 4, 44); ctx.fillRect(x + 10, b2 - 42, 10, 2); ctx.fillRect(x + 10, b2 - 48, 2, 6); ctx.fillRect(x + 24, b2 - 36, 12, 2); ctx.fillRect(x + 34, b2 - 42, 2, 6); ctx.fillRect(x + 22, b2 - 56, 2, 6);
    }
    // fence
    ctx.fillRect(x, b2 - 14, 46, 1); for (let i = 0; i < 46; i += 6) ctx.fillRect(x + i, b2 - 17, 1, 11);
  }
  // fog
  ctx.globalAlpha = 0.1; ctx.fillStyle = '#a46bff';
  for (let i = 0; i < 3; i++) ctx.fillRect(0, (b2 - 8 + i * 10 + Math.sin(t * 0.7 + i) * 3) | 0, W, 6);
  ctx.globalAlpha = 1;
}
function drawIceBg(th, t) {
  // northern lights
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i === 1 ? C.cyan : C.g3; ctx.globalAlpha = 0.09;
    for (let x = 0; x < W; x += 4) { const y = 26 + i * 12 + Math.sin((x + cam.x * 0.05) * 0.02 + t * 0.5 + i) * 10; ctx.fillRect(x, y | 0, 4, 16 + Math.sin(x * 0.05 + t + i) * 6); }
  }
  ctx.globalAlpha = 1;
  // far: snowy mountains
  const ox = cam.x * 0.15, b1 = H - 34 - cam.y * 0.1;
  for (let k = Math.floor(ox / 110) - 1; k < Math.floor((ox + W) / 110) + 2; k++) {
    const x = k * 110 - ox, h = 70 + hash(k, 71) * 50;
    for (let i = 0; i < h + 40; i += 2) { const w = (i / h) * 140; ctx.fillStyle = i < h * 0.22 ? '#e6f4ff' : '#2b5a88'; ctx.fillRect((x + 55 - w / 2) | 0, (b1 - h + i) | 0, Math.max(1, w | 0), 2); ctx.fillStyle = i < h * 0.22 ? '#b8d8f0' : '#22496f'; ctx.fillRect((x + 55) | 0, (b1 - h + i) | 0, Math.max(1, (w / 2) | 0), 2); }
  }
  // mid: pine trees
  const ox2 = cam.x * 0.45, b2 = H - 16 - cam.y * 0.2;
  for (let k = Math.floor(ox2 / 34) - 1; k < Math.floor((ox2 + W) / 34) + 2; k++) {
    const x = Math.round(k * 34 - ox2), s = 0.7 + hash(k, 73) * 0.5;
    ctx.fillStyle = th.far2; ctx.fillRect(x - 1, b2 - 4, 36, 30); ctx.fillRect(x + 15, b2 - 10, 4, 8);
    for (let j = 0; j < 3; j++) { const ww = Math.round((24 - j * 6) * s), yy = Math.round(b2 - 10 - (j + 1) * 12 * s); ctx.fillStyle = th.far2; for (let i = 0; i < 12 * s; i += 2) { const w2 = Math.round(ww * (i / (12 * s))); ctx.fillRect(x + 17 - (w2 >> 1), yy + i, w2, 2); } ctx.fillStyle = '#e6f4ff'; ctx.fillRect(x + 16, yy, 2, 2); }
  }
  // snowfall
  ctx.fillStyle = C.white;
  for (let i = 0; i < 60; i++) {
    const x = wrap(hash(i, 74) * W + Math.sin(t + i) * 10 - cam.x * 0.5, W), y = wrap(hash(i, 75) * H + t * (18 + hash(i, 76) * 22), H);
    ctx.globalAlpha = 0.4 + hash(i, 77) * 0.5; ctx.fillRect(x | 0, y | 0, hash(i, 78) > 0.7 ? 2 : 1, hash(i, 78) > 0.7 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}
function drawVolcanoBg(th, t) {
  // glowing horizon
  for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.05; ctx.fillStyle = '#ff5a1e'; ctx.fillRect(0, H - 90 + i * 12 - cam.y * 0.1, W, 90); }
  ctx.globalAlpha = 1;
  // far: volcanoes with lava streams, smoke and sparks
  const ox = cam.x * 0.15, b1 = H - 40 - cam.y * 0.1;
  for (let k = Math.floor(ox / 230) - 1; k < Math.floor((ox + W) / 230) + 2; k++) {
    const x = k * 230 - ox + 40, h = 80 + hash(k, 41) * 30, top = b1 - h;
    for (let i = 0; i < h + 60; i += 2) { const w = 18 + i * 1.3; ctx.fillStyle = th.far; ctx.fillRect((x + 60 - w / 2) | 0, (top + i) | 0, w | 0, 2); }
    ctx.fillStyle = '#ff5a1e'; ctx.fillRect((x + 54) | 0, top | 0, 12, 2);
    ctx.fillStyle = 'rgba(255,138,30,.7)'; for (let i = 0; i < 40; i += 2) ctx.fillRect((x + 58 + Math.sin(i * 0.3 + k) * 3 + i * 0.4) | 0, (top + 2 + i) | 0, 2, 2);
    for (let i = 0; i < 5; i++) { const ph = (t * 0.4 + i * 0.2 + hash(k, i)) % 1; ctx.globalAlpha = 0.25 * (1 - ph); disc(x + 60 + Math.sin(ph * 6 + i) * 8, top - ph * 70, 6 + ph * 10, '#3a2a2a'); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const ph = (t * 0.9 + i / 6 + hash(k, 50 + i)) % 1; ctx.fillStyle = i % 2 ? C.yel : '#ff8a1e'; ctx.fillRect((x + 60 + (hash(k, 60 + i) - 0.5) * 50 * ph) | 0, (top - 60 * ph + 120 * ph * ph) | 0, 2, 2); }
  }
  // mid: jagged rock spires with glowing cracks
  const ox2 = cam.x * 0.45, b2 = H - 18 - cam.y * 0.2;
  for (let k = Math.floor(ox2 / 52) - 1; k < Math.floor((ox2 + W) / 52) + 2; k++) {
    const x = Math.round(k * 52 - ox2), h = 22 + hash(k, 43) * 40;
    ctx.fillStyle = th.far2; ctx.fillRect(x + 6, Math.round(b2 - h), 18, h + 40); ctx.fillRect(x + 10, Math.round(b2 - h - 8), 8, 8); ctx.fillRect(x, Math.round(b2 - h * 0.5), 34, h);
    ctx.fillStyle = (Math.floor(t * 2) + k) % 3 ? '#c4401a' : '#ff8a1e'; ctx.fillRect(x + 14, Math.round(b2 - h + 10), 1, 10); ctx.fillRect(x + 15, Math.round(b2 - h + 20), 3, 1);
  }
  // embers
  for (let i = 0; i < 40; i++) {
    const x = wrap(hash(i, 44) * W + Math.sin(t * 2 + i) * 6 - cam.x * 0.3, W), y = wrap(H - (hash(i, 45) * H + t * (20 + hash(i, 46) * 30)), H);
    ctx.fillStyle = hash(i, 47) > 0.5 ? C.yel : '#ff8a1e'; ctx.globalAlpha = 0.5 + hash(i, 48) * 0.5; ctx.fillRect(x | 0, y | 0, 1, 1);
  }
  ctx.globalAlpha = 1;
}
/* ACT III backgrounds: inside the MONSTER 3in1 */
function drawMachineBg(th, t) {
  const ox = cam.x * 0.2, b1 = H - 40 - cam.y * 0.1, ox2 = cam.x * 0.45, b2 = H - 18 - cam.y * 0.2;
  if (th.machine === 'boxer') {
    // giant punching bags on chains and spring-loaded gloves
    for (let k = Math.floor(ox / 120) - 1; k < Math.floor((ox + W) / 120) + 2; k++) {
      const x = k * 120 - ox + 40, sw = Math.sin(t * 1.4 + k) * 6;
      ctx.fillStyle = th.far; ctx.fillRect((x + 14 + sw * 0.3) | 0, 0, 3, (b1 - 120) | 0);
      ctx.fillRect((x + sw) | 0, (b1 - 120) | 0, 32, 70); ctx.fillRect((x + 3 + sw) | 0, (b1 - 124) | 0, 26, 4);
      ctx.fillStyle = 'rgba(232,40,60,.18)'; ctx.fillRect((x + sw) | 0, (b1 - 80) | 0, 32, 3);
    }
    for (let k = Math.floor(ox2 / 180) - 1; k < Math.floor((ox2 + W) / 180) + 2; k++) {
      const x = Math.round(k * 180 - ox2), ph = (t * 0.8 + k * 0.37) % 1, ext = ph < 0.12 ? ph / 0.12 * 40 : ph < 0.3 ? 40 * (1 - (ph - 0.12) / 0.18) : 0;
      ctx.fillStyle = th.far2; ctx.fillRect(x, b2 - 70, 14, 90);
      for (let i = 0; i < 6; i++) ctx.fillRect(x + 14 + i * (6 + ext / 6), b2 - 52 + (i % 2) * 6, 3, 10);
      // spring-loaded glove (dark, so it never looks like a switch block)
      const gx = Math.round(x + 50 + ext);
      ctx.fillStyle = '#2c0c14'; ctx.fillRect(gx, b2 - 62, 22, 24); ctx.fillRect(gx + 22, b2 - 58, 4, 16); ctx.fillRect(gx + 4, b2 - 66, 14, 4);
      ctx.fillStyle = '#3e1220'; ctx.fillRect(gx + 2, b2 - 60, 18, 18); ctx.fillRect(gx - 4, b2 - 52, 6, 10);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(gx + 4, b2 - 58, 8, 2); ctx.fillStyle = '#1c0a10'; ctx.fillRect(gx - 6, b2 - 48, 4, 8);
      // girder with warning stripes
      ctx.fillStyle = th.far2; ctx.fillRect(x - 10, b2 - 6, 200, 8);
      for (let i = 0; i < 200; i += 12) { ctx.fillStyle = 'rgba(255,225,74,.35)'; ctx.fillRect(x - 10 + i, b2 - 6, 6, 3); }
    }
  } else if (th.machine === 'kicker') {
    // night stadium: stands full of fans, floodlights, goals
    for (let row = 0; row < 5; row++) {
      const y = b1 - 70 + row * 12;
      ctx.fillStyle = row % 2 ? th.far : th.far2; ctx.fillRect(0, y | 0, W, 12);
      for (let i = 0; i < W; i += 6) { const k = Math.floor((i + ox) / 6); if (hash(k, row) > 0.25) { ctx.fillStyle = ['#e8283c', '#ffe14a', '#63fafe', '#ffffff', '#35a427'][(k + row) % 5]; ctx.globalAlpha = 0.35 + 0.3 * (Math.sin(t * 6 + k + row) > 0.6); ctx.fillRect(i - wrap(ox, 6), (y + 3 + (Math.sin(t * 8 + k) > 0.8 ? -2 : 0)) | 0, 2, 3); } }
      ctx.globalAlpha = 1;
    }
    for (let k = Math.floor(ox / 200) - 1; k < Math.floor((ox + W) / 200) + 2; k++) {
      const x = Math.round(k * 200 - ox + 80);
      ctx.fillStyle = th.far; ctx.fillRect(x + 8, b1 - 150, 4, 90);
      ctx.fillStyle = '#c8f6ff'; ctx.fillRect(x, b1 - 158, 20, 10); ctx.fillStyle = C.white; for (let i = 0; i < 4; i++) ctx.fillRect(x + 2 + i * 5, b1 - 156, 3, 6);
      ctx.globalAlpha = 0.06; ctx.fillStyle = '#c8f6ff'; ctx.beginPath(); ctx.moveTo(x, b1 - 150); ctx.lineTo(x + 20, b1 - 150); ctx.lineTo(x + 120, H); ctx.lineTo(x - 80, H); ctx.fill(); ctx.globalAlpha = 1;
    }
    for (let k = Math.floor(ox2 / 260) - 1; k < Math.floor((ox2 + W) / 260) + 2; k++) {
      const x = Math.round(k * 260 - ox2 + 30);
      ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x, b2 - 36, 3, 40); ctx.fillRect(x + 57, b2 - 36, 3, 40); ctx.fillRect(x, b2 - 36, 60, 3);
      ctx.fillStyle = 'rgba(200,220,240,.25)'; for (let i = 4; i < 58; i += 5) ctx.fillRect(x + i, b2 - 33, 1, 37); for (let j = 0; j < 36; j += 5) ctx.fillRect(x + 3, b2 - 33 + j, 54, 1);
    }
  } else if (th.machine === 'hammer') {
    // giant strength testers with a running light and a bell
    for (let k = Math.floor(ox / 170) - 1; k < Math.floor((ox + W) / 170) + 2; k++) {
      const x = Math.round(k * 170 - ox + 60), top = b1 - 170, lit = Math.floor((Math.sin(t * 1.3 + k * 1.7) * 0.5 + 0.5) * 10);
      ctx.fillStyle = th.far; ctx.fillRect(x, top, 26, 180);
      for (let i = 0; i < 10; i++) { const y = top + 150 - i * 15; ctx.fillStyle = i <= lit ? (i > 7 ? C.mag : i > 4 ? C.yel : C.g3) : th.far2; ctx.fillRect(x + 4, y, 18, 10); }
      disc(x + 13, top - 10, 10, i_bell(lit)); ctx.fillStyle = th.far; ctx.fillRect(x + 11, top - 2, 4, 4);
    }
    for (let k = Math.floor(ox2 / 90) - 1; k < Math.floor((ox2 + W) / 90) + 2; k++) {
      const x = Math.round(k * 90 - ox2), h = 30 + hash(k, 5) * 40;
      ctx.fillStyle = th.far2; ctx.fillRect(x, Math.round(b2 - h), 60, h + 30);
      ctx.fillStyle = 'rgba(255,225,74,.25)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 8 + i * 18, Math.round(b2 - h + 8), 10, 2);
    }
  } else {
    // short circuit: cable tunnel with sparking junctions
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 ? th.far : th.far2; ctx.lineWidth = 6 - i; ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 10) { const y = 30 + i * 24 + Math.sin((x + ox * (0.6 + i * 0.2)) * 0.012 + i) * 12 - cam.y * 0.1; x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    for (let k = Math.floor(ox2 / 140) - 1; k < Math.floor((ox2 + W) / 140) + 2; k++) {
      const x = Math.round(k * 140 - ox2 + 30), y = Math.round(b2 - 60);
      ctx.fillStyle = th.far2; ctx.fillRect(x, y, 34, 26); ctx.fillRect(x + 14, y + 26, 6, 60);
      ctx.fillStyle = Math.floor(t * 5 + k) % 4 ? '#2a3a2a' : C.g3; ctx.fillRect(x + 4, y + 4, 6, 4);
      ctx.fillStyle = 'rgba(255,225,74,.4)'; ctx.fillRect(x + 20, y + 6, 10, 2); ctx.fillRect(x + 22, y + 10, 6, 2);
      if ((t * 2 + k * 0.7) % 3 < 0.25) { ctx.strokeStyle = Math.floor(t * 30) % 2 ? C.g4 : C.white; ctx.beginPath(); let ax = x + 34, ay = y + 8; ctx.moveTo(ax, ay); for (let j = 0; j < 4; j++) { ax += 8; ay += (hash(j, Math.floor(t * 30)) - 0.5) * 16; ctx.lineTo(ax, ay); } ctx.stroke(); }
    }
    if ((t * 0.7) % 1 < 0.04) { ctx.fillStyle = 'rgba(139,237,54,.08)'; ctx.fillRect(0, 0, W, H); }
  }
}
const i_bell = lit => lit >= 9 ? C.yel : '#7a5a10';
function drawBoardBg(th, t) {
  // the main board of the machine: traces, chips, capacitors and running current
  const ox = cam.x * 0.25, oy = cam.y * 0.1;
  ctx.strokeStyle = 'rgba(200,154,48,.35)';
  for (let k = Math.floor(ox / 40) - 1; k < Math.floor((ox + W) / 40) + 2; k++) {
    const x = Math.round(k * 40 - ox), y1 = 20 + hash(k, 1) * 60 - oy, y2 = 90 + hash(k, 2) * 90 - oy;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.lineTo(x + 40, y2); ctx.stroke();
    ctx.fillStyle = '#e0b040'; ctx.fillRect(x - 1, Math.round(y1) - 1, 3, 3);
    const ph = wrap(t * 0.8 + hash(k, 3), 1), py = y1 + (y2 - y1) * ph;
    ctx.fillStyle = C.g4; ctx.fillRect(x - 1, Math.round(py), 3, 3);
  }
  // chips
  for (let k = Math.floor(ox / 230) - 1; k < Math.floor((ox + W) / 230) + 2; k++) {
    const x = Math.round(k * 230 - ox + 50), y = Math.round(50 - oy + hash(k, 4) * 30), w = 70, h = 44;
    ctx.fillStyle = '#c0c4d8'; for (let i = 4; i < w - 2; i += 6) { ctx.fillRect(x + i, y - 4, 2, 4); ctx.fillRect(x + i, y + h, 2, 4); }
    ctx.fillStyle = '#101418'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#20262c'; ctx.fillRect(x + 2, y + 2, w - 4, 3);
    drawText(ctx, k % 2 ? 'MONSTER' : '3in1', x + w / 2, y + 18, '#6a7a72', { align: 'center' });
    ctx.fillStyle = Math.floor(t * 3 + k) % 2 ? C.g3 : '#1a3a1a'; ctx.fillRect(x + w - 8, y + h - 8, 3, 3);
  }
  // capacitors and LEDs (closer layer)
  const ox2 = cam.x * 0.45, b2 = H - 18 - cam.y * 0.2;
  for (let k = Math.floor(ox2 / 70) - 1; k < Math.floor((ox2 + W) / 70) + 2; k++) {
    const x = Math.round(k * 70 - ox2), v = hash(k, 9);
    if (v < 0.5) { ctx.fillStyle = '#1d3a7a'; ctx.fillRect(x, b2 - 46, 22, 46); ctx.fillStyle = '#3a6ad0'; ctx.fillRect(x + 2, b2 - 46, 5, 46); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x, b2 - 48, 22, 3); ctx.fillStyle = '#0e2050'; ctx.fillRect(x + 14, b2 - 42, 3, 38); }
    else { ctx.fillStyle = '#d8c890'; ctx.fillRect(x, b2 - 18, 30, 10); for (const [cx, col] of [[6, '#7a3a06'], [12, '#101418'], [18, '#e8283c']]) { ctx.fillStyle = col; ctx.fillRect(x + cx, b2 - 18, 3, 10); } ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x - 8, b2 - 14, 8, 2); ctx.fillRect(x + 30, b2 - 14, 8, 2); }
    ctx.fillStyle = (Math.floor(t * 4) + k) % 3 ? '#1a3a1a' : (v > 0.7 ? C.gl2 : C.g3); ctx.fillRect(x + 40, b2 - 30, 4, 4);
  }
  // electric glow
  ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 3); ctx.fillStyle = C.g3; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
}
function drawTiles(th, t) {
  const c0 = Math.floor(cam.x / T), c1 = Math.ceil((cam.x + W) / T), r0 = Math.floor(cam.y / T), r1 = Math.ceil((cam.y + H) / T);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const ch = tile(c, r); if (ch === '.' || r < 0 || r >= ROWS) continue;
    const x = Math.round(c * T - cam.x), y = Math.round(r * T - cam.y);
    if (ch === '#') {
      const top = !isSolid(tile(c, r - 1)) && !HAZARD[tile(c, r - 1)];
      ctx.fillStyle = th.base; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = th.dark;
      if (th.board) {
        ctx.fillRect(x, y + T - 1, T, 1);
        ctx.fillStyle = '#c89a30'; const v = hash(c, r);
        if (v < 0.35) { ctx.fillRect(x, y + 6, T, 1); ctx.fillRect(x + 10, y + 6, 1, 6); }
        else if (v < 0.6) { ctx.fillRect(x + 4, y, 1, T); ctx.fillRect(x + 4, y + 10, 8, 1); }
        ctx.fillStyle = '#e0b040'; if (v > 0.8) { ctx.fillRect(x + 6, y + 6, 3, 3); ctx.fillStyle = th.dark; ctx.fillRect(x + 7, y + 7, 1, 1); }
      } else if (th.metal) { ctx.fillRect(x, y + T - 1, T, 1); ctx.fillRect(x + T - 1, y, 1, T); ctx.fillStyle = th.lite; ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + T - 4, y + 2, 1, 1); ctx.fillRect(x + 2, y + T - 4, 1, 1); ctx.fillRect(x + T - 4, y + T - 4, 1, 1); }
      else { ctx.fillRect(x, y + 7, T, 1); ctx.fillRect(x + ((r % 2) ? 4 : 11), y, 1, 7); ctx.fillRect(x + ((r % 2) ? 11 : 4), y + 8, 1, 8); }
      if (hash(c, r) > 0.8) { ctx.fillStyle = th.lava ? (Math.floor(t * 3 + c) % 3 ? '#ff8a1e' : C.yel) : th.lite; ctx.fillRect(x + 2 + ((hash(c, r + 9) * 10) | 0), y + 3 + ((hash(r, c) * 9) | 0), 2, 1); }
      if (top) {
        ctx.fillStyle = th.lite; ctx.fillRect(x, y, T, 3); ctx.fillStyle = th.edge; ctx.fillRect(x, y, T, 1); ctx.globalAlpha = 0.25; ctx.fillRect(x, y - 2, T, 2); ctx.globalAlpha = 1;
        if (th.snow) { ctx.fillStyle = '#f2fbff'; ctx.fillRect(x, y - 1, T, 3); if (hash(c, 77) > 0.5) ctx.fillRect(x + 3 + ((hash(c, 78) * 8) | 0), y + 2, 2, 2 + ((hash(c, 79) * 3) | 0)); }
      }
      if (!isSolid(tile(c - 1, r))) { ctx.fillStyle = th.lite; ctx.fillRect(x, y, 1, T); }
      if (!isSolid(tile(c + 1, r))) { ctx.fillStyle = th.dark; ctx.fillRect(x + T - 1, y, 1, T); }
    } else if (ch === 'I') {
      // ice block
      ctx.fillStyle = '#4aa8d8'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#9be4ff'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      ctx.fillStyle = '#c8f2ff'; ctx.fillRect(x + 2, y + 2, 5, 1); ctx.fillRect(x + 2, y + 3, 1, 3); ctx.fillRect(x + 9, y + 9, 1, 3); ctx.fillRect(x + 10, y + 8, 3, 1);
      ctx.fillStyle = '#6cc6ee'; ctx.fillRect(x + 1, y + T - 3, T - 2, 2);
      if (!isSolid(tile(c, r - 1))) { ctx.fillStyle = C.white; ctx.fillRect(x, y, T, 1); if ((Math.floor(t * 2) + c) % 7 === 0) { ctx.fillRect(x + 5, y + 2, 1, 1); ctx.fillRect(x + 4, y + 3, 3, 1); ctx.fillRect(x + 5, y + 4, 1, 1); } }
    } else if (ch === 'c') {
      // crumbling block (shakes before it falls)
      const cr = level.crumble[c + ',' + r], j = cr && cr.state === 'shake' ? Math.round(Math.sin(t * 70 + c) * 1) : 0;
      const wood = th.halloween;
      ctx.fillStyle = wood ? '#3a2214' : th.dark; ctx.fillRect(x + j, y, T, T);
      ctx.fillStyle = wood ? '#7a4a24' : th.lite; ctx.fillRect(x + j + 1, y + 1, T - 2, wood ? 6 : T - 2);
      if (wood) { ctx.fillRect(x + j + 1, y + 8, T - 2, 6); ctx.fillStyle = '#2a160c'; ctx.fillRect(x + j + 4, y + 2, 1, 1); ctx.fillRect(x + j + 11, y + 10, 1, 1); }
      else { ctx.fillStyle = th.dark; ctx.fillRect(x + j + 4, y + 2, 1, 5); ctx.fillRect(x + j + 5, y + 7, 4, 1); ctx.fillRect(x + j + 9, y + 8, 1, 5); ctx.fillRect(x + j + 12, y + 3, 1, 3); }
      ctx.fillStyle = th.edge; ctx.globalAlpha = cr ? 0.9 : 0.55; ctx.fillRect(x + j, y, T, 1); ctx.globalAlpha = 1;
    } else if (ch === '~') {
      // lava
      const wv = Math.sin(t * 3 + c * 1.3) * 1.5;
      ctx.fillStyle = '#b8240c'; ctx.fillRect(x, y + 4 + wv, T, T - 4 - wv);
      ctx.fillStyle = '#ff5a1e'; ctx.fillRect(x, y + 3 + wv, T, 3);
      ctx.fillStyle = C.yel; ctx.fillRect(x + ((c * 5) % 12), y + 3 + wv, 3, 1);
      if ((Math.floor(t * 4) + c) % 5 === 0) { ctx.fillStyle = '#ff8a1e'; ctx.fillRect(x + 6, y + 8, 3, 3); ctx.fillStyle = C.yel; ctx.fillRect(x + 7, y + 8, 1, 1); }
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 5 + c); ctx.fillStyle = '#ff8a1e'; ctx.fillRect(x, y - 6, T, 9); ctx.globalAlpha = 1;
    } else if (ch === 't') {
      // gravestone
      ctx.fillStyle = '#1e1526'; ctx.fillRect(x + 2, y + 5, 12, 11); ctx.fillRect(x + 3, y + 4, 10, 1); ctx.fillRect(x + 4, y + 3, 8, 1);
      ctx.fillStyle = '#6a6278'; ctx.fillRect(x + 3, y + 5, 10, 11); ctx.fillRect(x + 4, y + 4, 8, 1);
      ctx.fillStyle = '#8f88a0'; ctx.fillRect(x + 4, y + 5, 2, 9);
      ctx.fillStyle = '#3a3248'; ctx.fillRect(x + 7, y + 7, 2, 6); ctx.fillRect(x + 5, y + 9, 6, 2);
      ctx.fillStyle = '#35a427'; ctx.fillRect(x + 1, y + 15, 14, 1); ctx.fillRect(x + 2, y + 14, 1, 1); ctx.fillRect(x + 12, y + 14, 1, 1);
    } else if (ch === 'T') {
      // boxing target: hit it to flip the switch blocks
      const fl = level.tflash && level.tflash.c === c && level.tflash.r === r && Math.floor(t * 20) % 2;
      ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#4a4e66'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      ctx.fillStyle = fl ? C.white : C.white; disc(x + 8, y + 8, 6, fl ? C.yel : C.white); disc(x + 8, y + 8, 4, level.sw ? '#2f7ae0' : C.gl2); disc(x + 8, y + 8, 2, C.white);
      ctx.fillStyle = C.yel; ctx.fillRect(x + 7, y + 7, 2, 2);
    } else if (ch === 'R' || ch === 'U') {
      // switch blocks: red stand while the switch is off, blue while it is on
      const solid = isSolid(ch), col = ch === 'R' ? C.gl2 : '#3a8ef0', dk = ch === 'R' ? C.gl1 : '#163e7a';
      if (solid) {
        ctx.fillStyle = dk; ctx.fillRect(x, y, T, T); ctx.fillStyle = col; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 2, y + 2, T - 4, 2);
        ctx.fillStyle = dk; ctx.fillRect(x + 5, y + 6, 6, 4); ctx.fillStyle = C.white; ctx.fillRect(x + 6, y + 7, 4, 2);
      } else {
        ctx.fillStyle = col; ctx.globalAlpha = 0.55;
        for (let i = 0; i < T; i += 4) { ctx.fillRect(x + i, y, 2, 1); ctx.fillRect(x + i, y + T - 1, 2, 1); ctx.fillRect(x, y + i, 1, 2); ctx.fillRect(x + T - 1, y + i, 1, 2); }
        ctx.globalAlpha = 1;
      }
    } else if (ch === '<' || ch === '>') {
      // conveyor belt
      const d = ch === '>' ? 1 : -1, sh = Math.floor(wrap(t * CONVEYOR * d, 8));
      ctx.fillStyle = '#1c1e2c'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#4a4e66'; ctx.fillRect(x, y, T, 5);
      ctx.fillStyle = C.yel; for (let i = -8; i < T; i += 8) { const ax = x + i + sh; if (ax >= x && ax + 3 <= x + T) { ctx.fillRect(ax, y + 1, 2, 1); ctx.fillRect(ax + (d > 0 ? 1 : -1) + 1, y + 2, 2, 1); ctx.fillRect(ax, y + 3, 2, 1); } }
      ctx.fillStyle = '#8a8fa8'; disc(x + 4, y + 10, 3, '#8a8fa8'); disc(x + 12, y + 10, 3, '#8a8fa8'); ctx.fillStyle = '#1c1e2c'; ctx.fillRect(x + 3, y + 9, 2, 2); ctx.fillRect(x + 11, y + 9, 2, 2);
    } else if (ch === 'Y') {
      // hammer strength tester pad
      const k = level.padT && level.padT[c + ',' + r] || 0;
      ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x + 1, y, T - 2, 4);
      ctx.fillStyle = k > 0 ? C.yel : C.gl2; ctx.fillRect(x + 3, y + 1, T - 6, 2);
      ctx.fillStyle = '#4a4e66'; ctx.fillRect(x + 2, y + 5, T - 4, 10);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = (k > 0 ? (Math.floor(t * 20) + i) % 2 : (Math.floor(t * 3) + i) % 4 === 0) ? C.yel : '#7a4a10'; ctx.fillRect(x + 4 + i * 2 + i, y + 7, 2, 6); }
      if (!isSolid(tile(c, r - 1)) && Math.floor(t * 2) % 2) drawText(ctx, '↓', x + 8, y - 9, C.yel, { align: 'center' });
    } else if (ch === 'k') {
      // fan
      ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#4a4e66'; ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      const a = t * 18 + c; ctx.fillStyle = '#c0c4d8';
      for (let i = 0; i < 3; i++) { const an = a + i * 2.09; ctx.fillRect(Math.round(x + 8 + Math.cos(an) * 4) - 1, Math.round(y + 8 + Math.sin(an) * 4) - 1, 3, 3); }
      ctx.fillStyle = C.cyan; ctx.fillRect(x + 7, y + 7, 2, 2); ctx.fillStyle = '#8a8fa8'; for (let i = 1; i < T; i += 3) ctx.fillRect(x + i, y, 1, 2);
    } else if (ch === 'l') {
      // laser emitter (ceiling)
      const L = level.lasers.find(l => l.c === c && l.r === r);
      ctx.fillStyle = '#2a2d40'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#4a4e66'; ctx.fillRect(x + 2, y + 1, T - 4, T - 4);
      ctx.fillStyle = L && L.on ? C.gl2 : L && L.warn && Math.floor(t * 16) % 2 ? C.yel : '#5a1222'; ctx.fillRect(x + 5, y + T - 4, 6, 4);
    } else if (ch === 'e') {
      // electric track on the circuit board
      const live = trackLive(c);
      ctx.fillStyle = th.base; ctx.fillRect(x, y, T, T); ctx.fillStyle = th.dark; ctx.fillRect(x, y + T - 1, T, 1);
      ctx.fillStyle = live ? C.white : '#c89a30'; ctx.fillRect(x, y, T, 3); ctx.fillStyle = live ? C.g4 : '#e0b040'; ctx.fillRect(x, y + 1, T, 1);
      if (live) { ctx.globalAlpha = 0.5; ctx.fillStyle = C.g3; ctx.fillRect(x, y - 6, T, 6); ctx.globalAlpha = 1; ctx.fillStyle = C.white; for (let i = 0; i < 3; i++) ctx.fillRect(x + ((hash(c * 3 + i, Math.floor(t * 20)) * 14) | 0), y - 2 - ((hash(i, c + Math.floor(t * 20)) * 5) | 0), 1, 2); }
      else if ((Math.floor(t * 6) + c) % 9 === 0) { ctx.fillStyle = C.g3; ctx.fillRect(x + 6, y + 1, 3, 1); }
    } else if (ch === 'j') {
      // jack-o'-lantern
      const gl = 0.5 + 0.5 * Math.sin(t * 6 + c * 2);
      ctx.globalAlpha = 0.15 + gl * 0.15; ctx.fillStyle = '#ff8a1e'; ctx.beginPath(); ctx.arc(x + 8, y + 11, 11, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#7a3a06'; ctx.fillRect(x + 2, y + 7, 12, 9); ctx.fillStyle = '#e8701e'; ctx.fillRect(x + 3, y + 7, 10, 8); ctx.fillRect(x + 2, y + 9, 12, 5);
      ctx.fillStyle = '#c4561a'; ctx.fillRect(x + 7, y + 8, 1, 7); ctx.fillStyle = '#35a427'; ctx.fillRect(x + 7, y + 5, 2, 2);
      ctx.fillStyle = gl > 0.3 ? C.yel : '#ffb04a'; ctx.fillRect(x + 4, y + 9, 2, 2); ctx.fillRect(x + 10, y + 9, 2, 2); ctx.fillRect(x + 5, y + 12, 6, 1); ctx.fillRect(x + 6, y + 13, 1, 1); ctx.fillRect(x + 9, y + 13, 1, 1);
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
  } else if (e.type === 'ufo') {
    if (e.charge && Math.floor(t * 16) % 2) { ctx.globalAlpha = 0.35; ctx.fillStyle = C.g3; ctx.fillRect(4, 9, 6, 10); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#63fafe'; ctx.globalAlpha = 0.85; ctx.fillRect(4, -1, 6, 4); ctx.fillRect(5, -2, 4, 1); ctx.globalAlpha = 1;
    ctx.fillStyle = C.g3; ctx.fillRect(6, 0, 2, 2); ctx.fillStyle = C.ink; ctx.fillRect(6, 0, 1, 1);
    ctx.fillStyle = '#4a4e66'; ctx.fillRect(0, 4, 14, 3); ctx.fillStyle = '#c0c4d8'; ctx.fillRect(1, 3, 12, 2); ctx.fillStyle = '#8a8fa8'; ctx.fillRect(3, 7, 8, 2);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = (Math.floor(t * 8) + i) % 4 === 0 ? C.yel : (i % 2 ? C.mag : C.cyan); ctx.fillRect(1 + i * 4, 5, 1, 1); }
  } else if (e.type === 'ghost') {
    const a = e.alive ? (e.vis ? 0.92 : 0.12 + (Math.floor(t * 10) % 2) * 0.06) : 0.9;
    ctx.globalAlpha = a;
    const wob = Math.floor(t * 6) % 2;
    ctx.fillStyle = '#c9c2e6'; ctx.fillRect(1, 2, 10, 11); ctx.fillRect(2, 1, 8, 1); ctx.fillRect(3, 0, 6, 1);
    ctx.fillStyle = C.white; ctx.fillRect(2, 2, 8, 10); ctx.fillRect(3, 1, 6, 1);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = (i + wob) % 2 ? C.white : '#c9c2e6'; ctx.fillRect(1 + i * 3, 12 + ((i + wob) % 2), 2, 2); }
    ctx.fillStyle = C.ink; ctx.fillRect(f ? 6 : 3, 4, 2, 3); ctx.fillRect(f ? 9 : 6, 4, 2, 3); ctx.fillRect(f ? 7 : 4, 9, 2, 2);
    ctx.globalAlpha = 1;
  } else if (e.type === 'pumpkin') {
    const sq = e.squash ? 6 : 0;
    ctx.fillStyle = '#7a3a06'; ctx.fillRect(0, 3 + sq, 14, 10 - sq); ctx.fillRect(1, 2 + sq, 12, 12 - sq);
    ctx.fillStyle = '#e8701e'; ctx.fillRect(1, 3 + sq, 12, 9 - sq); ctx.fillStyle = '#ff9a3a'; ctx.fillRect(2, 4 + sq, 2, Math.max(1, 5 - sq));
    ctx.fillStyle = '#c4561a'; ctx.fillRect(5, 3 + sq, 1, 9 - sq); ctx.fillRect(9, 3 + sq, 1, 9 - sq);
    if (!e.squash) {
      ctx.fillStyle = '#35a427'; ctx.fillRect(6, 0, 2, 3); ctx.fillRect(8, 0, 2, 1);
      const glow = Math.floor(t * 8) % 3 ? C.yel : '#fff6b0';
      ctx.fillStyle = glow; ctx.fillRect(f ? 4 : 2, 5, 3, 2); ctx.fillRect(f ? 9 : 7, 5, 3, 2); ctx.fillRect(3, 9, 8, 2);
      ctx.fillStyle = '#e8701e'; ctx.fillRect(5, 9, 1, 1); ctx.fillRect(8, 9, 1, 1); ctx.fillRect(4, 10, 1, 1); ctx.fillRect(9, 10, 1, 1);
    }
  }
  ctx.restore();
}
function drawHazards(t) {
  // laser beams
  for (const L of level.lasers) {
    const x = Math.round(L.c * T - cam.x), y0 = Math.round((L.r + 1) * T - cam.y), len = ((L.end || L.r + 1) - L.r - 1) * T;
    if (x < -20 || x > W + 20 || len <= 0) continue;
    if (L.on) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = C.gl2; ctx.fillRect(x + 3, y0, 10, len); ctx.globalAlpha = 1;
      ctx.fillStyle = Math.floor(t * 30) % 2 ? '#ff6a7a' : C.gl2; ctx.fillRect(x + 6, y0, 4, len); ctx.fillStyle = C.white; ctx.fillRect(x + 7, y0, 2, len);
    } else if (L.warn && Math.floor(t * 16) % 2) { ctx.fillStyle = 'rgba(232,40,60,.45)'; ctx.fillRect(x + 7, y0, 2, len); }
  }
  // fans: rising air
  for (const f of level.fans) {
    const x = f.c * T - cam.x; if (x < -20 || x > W + 20) continue;
    const h = (f.r - f.top) * T;
    ctx.fillStyle = 'rgba(200,240,255,.35)';
    for (let i = 0; i < 5; i++) { const yy = f.r * T - cam.y - wrap(t * 140 + i * h / 5 + f.c * 7, h); ctx.fillRect(Math.round(x + 3 + ((i * 5 + f.c) % 10)), Math.round(yy), 1, 5); }
  }
  // GIGA BAG lightning
  for (const b of level.strikes) {
    const x = Math.round(b.x - cam.x), fy = Math.round(13 * T - cam.y);
    if (b.s === 'warn') {
      ctx.fillStyle = Math.floor(t * 14) % 2 ? C.g3 : C.yel; ctx.fillRect(x - 10, fy - 2, 20, 2); ctx.fillRect(x - 1, fy - 10, 2, 6);
      ctx.globalAlpha = 0.12; ctx.fillStyle = C.g3; ctx.fillRect(x - 10, -cam.y, 20, fy + cam.y); ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.45; ctx.fillStyle = C.g4; ctx.fillRect(x - 12, 0, 24, fy); ctx.globalAlpha = 1;
      ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.beginPath(); let bx = x, by = 0; ctx.moveTo(bx, by);
      while (by < fy) { by += 14; bx = x + (hash(Math.floor(t * 30), by) - 0.5) * 16; ctx.lineTo(bx, Math.min(by, fy)); }
      ctx.stroke(); ctx.lineWidth = 1;
    }
  }
  for (const ic of level.icicles) {
    if (ic.state === 'gone') continue;
    let x = Math.round(ic.x - cam.x), y = Math.round(ic.y - cam.y);
    if (x < -20 || x > W + 20) continue;
    if (ic.state === 'shake') x += Math.round(Math.sin(t * 80));
    const len = ic.state === 'grow' ? Math.round(ic.h * (1 - ic.t / 0.8)) : ic.h;
    for (let i = 0; i < len; i++) { const w = Math.max(1, Math.round(8 * (1 - i / ic.h))); ctx.fillStyle = i < 3 ? '#e6f8ff' : '#9be4ff'; ctx.fillRect(x + 4 - Math.ceil(w / 2), y + i, w, 1); }
    ctx.fillStyle = C.white; ctx.fillRect(x + 2, y, 1, Math.min(len, 6));
  }
  for (const f of level.fires) {
    if (!f.up) continue;
    const x = Math.round(f.x - cam.x), y = Math.round(f.y - cam.y);
    if (x < -20 || x > W + 20) continue;
    const fl = Math.floor(t * 14) % 2, down = f.vy > 0;
    ctx.fillStyle = '#b8240c'; ctx.fillRect(x + 1, y + 1, 8, 8); ctx.fillRect(x, y + 2, 10, 6);
    ctx.fillStyle = '#ff5a1e'; ctx.fillRect(x + 1, y + 2, 8, 6); ctx.fillStyle = C.yel; ctx.fillRect(x + 3, y + 3, 4, 4); ctx.fillStyle = '#fff6b0'; ctx.fillRect(x + 4, y + 4, 2, 2);
    ctx.fillStyle = '#ff8a1e';
    if (down) { ctx.fillRect(x + 2, y - 3, 2, 3); ctx.fillRect(x + 6, y - 2 - fl, 2, 2 + fl); } else { ctx.fillRect(x + 2, y + 10, 2, 3); ctx.fillRect(x + 6, y + 10, 2, 2 + fl); }
    ctx.fillStyle = C.ink; ctx.fillRect(x + 3, y + 4, 1, 2); ctx.fillRect(x + 6, y + 4, 1, 2);
  }
  for (const s of level.shots) {
    const x = Math.round(s.x - cam.x), y = Math.round(s.y - cam.y);
    ctx.fillStyle = C.g3; ctx.fillRect(x, y, 4, 7); ctx.fillStyle = C.white; ctx.fillRect(x + 1, y + 1, 2, 5);
    ctx.globalAlpha = 0.35; ctx.fillStyle = C.g3; ctx.fillRect(x - 1, y - 4, 6, 4); ctx.globalAlpha = 1;
  }
}
// the short-circuit storm wall
function drawChase(t) {
  const ch = level.chase; if (!ch) return;
  const ex = Math.round(ch.x - cam.x); if (ex < -30) return;
  ctx.globalAlpha = 0.75; ctx.fillStyle = '#04140a'; ctx.fillRect(0, 0, Math.max(0, ex - 8), H); ctx.globalAlpha = 1;
  for (let y = -cam.y % 8 - 8; y < H; y += 8) {
    const j = Math.round((hash(Math.floor(t * 20), Math.floor((y + cam.y) / 8)) - 0.5) * 10);
    ctx.fillStyle = C.g3; ctx.globalAlpha = 0.4; ctx.fillRect(ex - 18 + j, y, 18, 8); ctx.globalAlpha = 1;
    ctx.fillStyle = Math.floor(t * 24 + y) % 3 ? C.g4 : C.white; ctx.fillRect(ex + j, y, 3, 8);
  }
  ctx.strokeStyle = C.white; ctx.beginPath();
  for (let i = 0; i < 3; i++) { let bx = ex - 4, by = hash(i, Math.floor(t * 10)) * H; ctx.moveTo(bx, by); for (let k = 0; k < 4; k++) { bx -= 10 + hash(i, k) * 12; by += (hash(k, i + Math.floor(t * 10)) - 0.5) * 30; ctx.lineTo(Math.round(bx), Math.round(by)); } }
  ctx.stroke();
}
function drawBoss(t) {
  const B = level.boss; if (!B || B.state === 'gone' || B.state === 'wait') return;
  let x = Math.round(B.x - cam.x), y = Math.round(B.y - cam.y);
  if (B.state === 'tele') x += Math.round(Math.sin(t * 60) * 2);
  // chain
  if (B.state !== 'dazed' && B.state !== 'ko') { ctx.fillStyle = '#8a8fa8'; for (let cy = y - 2; cy > -cam.y - 4; cy -= 6) ctx.fillRect(x + 18, cy - 4, 4, 4); }
  const hurt = B.flash > 0 && Math.floor(t * 30) % 2;
  const gg = B.giga, mg = B.mega && !gg;
  if (gg) { // electric aura
    ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 14); ctx.fillStyle = C.g3; ctx.fillRect(x - 4, y - 4, 48, 64); ctx.globalAlpha = 1;
    ctx.strokeStyle = Math.floor(t * 20) % 2 ? C.g4 : C.white; ctx.beginPath();
    for (let i = 0; i < 3; i++) { let ax = x + 20 + Math.sin(t * 7 + i * 2) * 26, ay = y + 4 + i * 18; ctx.moveTo(ax, ay); for (let j = 0; j < 3; j++) { ax += (hash(i * 9 + j, Math.floor(t * 15)) - 0.5) * 14; ay += 6; ctx.lineTo(Math.round(ax), Math.round(ay)); } }
    ctx.stroke();
  }
  ctx.fillStyle = gg ? '#063015' : mg ? '#4a2a06' : '#1a0844'; ctx.fillRect(x + 2, y, 36, 56); ctx.fillRect(x, y + 4, 40, 48);
  ctx.fillStyle = hurt ? C.white : gg ? '#1f8a3a' : mg ? '#d89a26' : C.h3; ctx.fillRect(x + 2, y + 2, 36, 52); ctx.fillRect(x + 1, y + 5, 38, 46);
  ctx.fillStyle = hurt ? C.white : gg ? C.g3 : mg ? '#ffe14a' : '#9a6ad8'; ctx.fillRect(x + 5, y + 4, 8, 16);
  ctx.fillStyle = gg ? C.yel : mg ? C.mag : C.cyan; ctx.fillRect(x + 1, y + 36, 38, 3);
  if (mg || gg) { ctx.fillStyle = C.white; for (let i = 0; i < 5; i++) ctx.fillRect(x + 4 + i * 8, y + 37, 3, 1); }
  if (gg) { ctx.fillStyle = '#e0b040'; for (let i = 0; i < 4; i++) { ctx.fillRect(x + 6 + i * 9, y + 44, 1, 8); ctx.fillRect(x + 6 + i * 9, y + 51, 5, 1); } }
  ctx.fillStyle = '#c0c4d8'; ctx.fillRect(x + 14, y - 3, 12, 4);
  if (gg) { // lightning horns
    ctx.fillStyle = C.yel; ctx.fillRect(x + 6, y - 10, 4, 8); ctx.fillRect(x + 9, y - 14, 3, 5); ctx.fillRect(x + 30, y - 10, 4, 8); ctx.fillRect(x + 28, y - 14, 3, 5);
    ctx.fillStyle = C.white; ctx.fillRect(x + 7, y - 9, 1, 4); ctx.fillRect(x + 31, y - 9, 1, 4);
  }
  if (mg) { // champion's crown
    ctx.fillStyle = '#7a4a10'; ctx.fillRect(x + 9, y - 9, 22, 7); ctx.fillStyle = C.yel; ctx.fillRect(x + 10, y - 8, 20, 5);
    ctx.fillRect(x + 10, y - 12, 3, 4); ctx.fillRect(x + 18, y - 13, 4, 5); ctx.fillRect(x + 27, y - 12, 3, 4);
    ctx.fillStyle = C.mag; ctx.fillRect(x + 19, y - 7, 2, 2); ctx.fillStyle = C.cyan; ctx.fillRect(x + 13, y - 6, 2, 2); ctx.fillRect(x + 25, y - 6, 2, 2);
  }
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
  ctx.fillStyle = gg ? '#063015' : mg ? '#4a2a06' : '#1a0844';
  const dmg = (B.maxHp - B.hp) * 8 / B.maxHp;
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
    drawText(ctx, B.name, W / 2, by - 8, B.giga ? C.g3 : B.mega ? C.yel : C.mag, { align: 'center' });
    ctx.fillStyle = '#2b1049'; ctx.fillRect(bx, by, bw, 6); ctx.fillStyle = B.flash > 0 ? C.white : B.giga ? C.g3 : B.mega ? '#d89a26' : C.h3; ctx.fillRect(bx, by, Math.round(bw * B.hp / B.maxHp), 6);
    ctx.fillStyle = C.cyan; ctx.fillRect(bx, by, bw, 1);
  }
}
function drawIntro() {
  const a = Math.min(1, introT / 0.4);
  ctx.globalAlpha = Math.min(1, a) * 0.85; ctx.fillStyle = C.ink; ctx.fillRect(0, H / 2 - 34, W, 68); ctx.globalAlpha = 1;
  ctx.fillStyle = C.mag; ctx.fillRect(0, H / 2 - 34, W, 2); ctx.fillStyle = C.cyan; ctx.fillRect(0, H / 2 + 32, W, 2);
  if (level.def.act !== undefined && UI.acts[level.def.act]) {
    const al = UI.acts[level.def.act], sc = textWidth(al, 2) + 16 <= W - 8 ? 2 : 1, aw = textWidth(al, sc) + 16;
    ctx.globalAlpha = Math.min(1, a) * 0.9; ctx.fillStyle = C.ink; ctx.fillRect(W / 2 - aw / 2, H / 2 - 62, aw, 22); ctx.globalAlpha = 1;
    ctx.fillStyle = C.yel; ctx.fillRect(W / 2 - aw / 2, H / 2 - 62, aw, 1); ctx.fillRect(W / 2 - aw / 2, H / 2 - 41, aw, 1);
    drawText(ctx, al, W / 2, H / 2 - (sc === 2 ? 58 : 55), C.white, { align: 'center', scale: sc, shadow: '#3a0419' });
  }
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
  drawHazards(time);
  drawBalls(time);
  drawPlayer(time);
  drawFx();
  drawChase(time);
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
    end1: 'YOU BEAT GIGA BAG!', end2: 'YOU ARE THE REAL MONSTER!', again: 'PLAY AGAIN', machine: 'THE REAL MONSTER 3in1',
    locked: '??????', nextPage: 'NEXT ▶', prevPage: '◀ PREVIOUS', copy: '(C) 2026 PRO-GAMES POLAND',
    rank: 'RANKING', nick: 'NICK', enterNick: 'ENTER YOUR NICK', nickHint: 'LETTERS AND DIGITS - MAX 10', tapType: 'TAP THE BOX TO TYPE', ok: 'OK',
    online: 'ALL PLAYERS - ONLINE', offline: 'OFFLINE - THIS DEVICE ONLY', place: 'PLACE', newBest: 'NEW PERSONAL BEST!', yourBest: 'YOUR BEST', empty: 'NO SCORES YET - BE THE FIRST!', player: 'PLAYER', end: 'END',
    pages: ['CONTROLS', 'ENEMIES AND ITEMS', 'STAGES 6-10', 'STAGES 11-15', 'GOAL'],
    acts: ['ACT I - NEON CITY', 'ACT II - THE JOURNEY', 'ACT III - INSIDE THE MACHINE'],
    keys: [['← →', 'RUN'], ['SPACE / ↑', 'JUMP (HOLD = HIGHER)'], ['J / X', 'PUNCH - BREAKS CRATES'], ['K / C', 'KICK THE BALL'], ['↓ IN THE AIR', 'HAMMER SMASH'], ['↓ ON THE GROUND', 'HAMMER SWING - BREAKS WALLS'], ['P / ESC', 'PAUSE']],
    touch: [['◀ ▶', 'RUN'], ['JUMP', 'JUMP (HOLD = HIGHER)'], ['PUNCH', 'BREAKS CRATES'], ['KICK', 'KICK THE BALL'], ['SMASH IN AIR', 'HAMMER SMASH'], ['SMASH ON GROUND', 'BREAKS CRACKED WALLS'], ['=', 'MENU / PAUSE']],
    things: [['bagger', 'BAGGER - STOMP OR PUNCH IT'], ['sparky', "SPARKY - DON'T STOMP! PUNCH OR KICK"], ['glover', 'GLOVER - CHARGES AT YOU'], ['token', '100 TOKENS = EXTRA LIFE'], ['heart', 'HEART - RESTORES HEALTH'],
      ['crate', 'CRATE - HIDES TOKENS OR HEARTS'], ['cracked', 'CRACKED BLOCK - SMASH IT'], ['spring', 'SPRING - SMASH IT = MEGA JUMP'], ['check', 'SMALL MACHINE - CHECKPOINT'], ['rage', 'FULL RAGE BAR = 7 S INVINCIBLE']],
    things2: [['ufo', 'UFO - SHOOTS DOWN, STOMP IT'], ['ghost', 'GHOST - HIT IT WHILE VISIBLE'], ['pumpkin', 'PUMPKIN - LEAPS AT YOU'], ['ice', 'ICE - SLIPPERY, BRAKE EARLY'], ['icicle', 'ICICLE - FALLS WHEN YOU PASS'],
      ['crumble', 'CRUMBLING BLOCK - KEEP MOVING'], ['lava', 'LAVA - BURNS LIKE SPARKS'], ['fire', 'FIREBALL - JUMPS OUT OF LAVA'], ['space', 'GAGARINA - LOW GRAVITY'], ['mega', 'MEGA BAG - THE FINAL BOSS']],
    things3: [['target', 'TARGET - HIT IT TO SWITCH BLOCKS'], ['switch', 'RED / BLUE BLOCKS - TAKE TURNS'], ['conveyor', 'CONVEYOR - PUSHES YOU'], ['laser', 'LASER - CROSS WHEN IT IS OFF'], ['pad', 'STRENGTH PAD - SMASH = 1000!'],
      ['fan', 'FAN - BLOWS YOU UP'], ['storm', 'STORM WALL - RUN, DO NOT LOOK BACK'], ['track', 'ELECTRIC TRACK - JUMP THE CURRENT'], ['giga', 'GIGA BAG - CALLS DOWN LIGHTNING']],
    goal: ['REACH THE MONSTER MACHINE', 'AT THE END OF EVERY STAGE.', '', 'BOSSES: BIG BAG, MEGA BAG', 'AND GIGA BAG (STAGES 5, 10, 15).', 'HIT THEM WHILE THEY LIE DAZED', 'AND JUMP OVER THE SHOCKWAVES!', '', 'PROGRESS IS SAVED', 'AUTOMATICALLY.']
  },
  pl: {
    newGame: 'NOWA GRA', cont: 'KONTYNUUJ', stage: 'ETAP', select: 'WYBÓR ETAPU', howto: 'INSTRUKCJA', options: 'OPCJE', exit: 'WYJŚCIE',
    back: 'POWRÓT', top: 'TOP', best: 'REKORD', sound: 'DŹWIĘK', music: 'MUZYKA', on: 'WŁ', off: 'WYŁ', full: 'PEŁNY EKRAN', reset: 'USUŃ ZAPIS',
    sure: 'USUNĄĆ ZAPIS I REKORDY?', yes: 'TAK', no: 'NIE', deleted: 'ZAPIS USUNIĘTY',
    pause: 'PAUZA', resume: 'GRAJ DALEJ', restart: 'ETAP OD NOWA', quit: 'WYJDŹ DO MENU',
    clear: 'UKOŃCZONY!', next: 'NASTĘPNY ETAP', go: 'DALEJ', menu: 'MENU',
    tokens: 'ŻETONY', time: 'CZAS', timeBonus: 'BONUS ZA CZAS', perfect: 'BEZ TRAFIENIA', allTokens: 'WSZYSTKIE ŻETONY', hearts: 'BONUS ZA SERCA', stageScore: 'WYNIK ETAPU', total: 'RAZEM',
    over: 'GAME OVER', score: 'WYNIK', retry: 'KONTYNUUJ', retryNote: 'TEN SAM ETAP - WYNIK OD ZERA',
    end1: 'POKONAŁEŚ GIGA BAG!', end2: 'JESTEŚ PRAWDZIWYM MONSTEREM!', again: 'ZAGRAJ PONOWNIE', machine: 'AUTOMAT MONSTER 3in1',
    locked: '??????', nextPage: 'DALEJ ▶', prevPage: '◀ WSTECZ', copy: '(C) 2026 PRO-GAMES POLAND',
    rank: 'RANKING', nick: 'NICK', enterNick: 'WPISZ SWÓJ NICK', nickHint: 'LITERY I CYFRY - MAX 10', tapType: 'DOTKNIJ POLA, ABY PISAĆ', ok: 'OK',
    online: 'WSZYSCY GRACZE - ONLINE', offline: 'OFFLINE - TYLKO TO URZĄDZENIE', place: 'MIEJSCE', newBest: 'NOWY REKORD GRACZA!', yourBest: 'TWÓJ REKORD', empty: 'BRAK WYNIKÓW - BĄDŹ PIERWSZY!', player: 'GRACZ', end: 'META',
    pages: ['STEROWANIE', 'PRZECIWNICY I PRZEDMIOTY', 'ETAPY 6-10', 'ETAPY 11-15', 'CEL GRY'],
    acts: ['AKT I - MIASTO NEONÓW', 'AKT II - WIELKA PODRÓŻ', 'AKT III - WNĘTRZE AUTOMATU'],
    keys: [['← →', 'BIEG'], ['SPACJA / ↑', 'SKOK (TRZYMAJ = WYŻEJ)'], ['J / X', 'CIOS - ROZBIJA SKRZYNIE'], ['K / C', 'KOPNIĘCIE PIŁKI'], ['↓ W POWIETRZU', 'UDERZENIE MŁOTEM'], ['↓ NA ZIEMI', 'MŁOT KRUSZY ŚCIANY'], ['P / ESC', 'PAUZA']],
    touch: [['◀ ▶', 'BIEG'], ['SKOK', 'SKOK (TRZYMAJ = WYŻEJ)'], ['CIOS', 'ROZBIJA SKRZYNIE'], ['KOP', 'KOPNIĘCIE PIŁKI'], ['MŁOT W GÓRZE', 'UDERZENIE MŁOTEM'], ['MŁOT NA ZIEMI', 'KRUSZY ŚCIANY'], ['=', 'MENU / PAUZA']],
    things: [['bagger', 'WOREK - SKOCZ NA NIEGO LUB UDERZ'], ['sparky', 'ISKRA - NIE SKACZ! UDERZ LUB KOPNIJ'], ['glover', 'RĘKAWICA - SZARŻUJE NA CIEBIE'], ['token', '100 ŻETONÓW = DODATKOWE ŻYCIE'], ['heart', 'SERCE - ODNAWIA ZDROWIE'],
      ['crate', 'SKRZYNIA - KRYJE ŻETONY I SERCA'], ['cracked', 'PĘKNIĘTY BLOK - ROZBIJ MŁOTEM'], ['spring', 'SPRĘŻYNA - MŁOT = MEGA SKOK'], ['check', 'MAŁY AUTOMAT - PUNKT ZAPISU'], ['rage', 'PEŁNY PASEK SZAŁ = 7 S NIETYKALNOŚCI']],
    things2: [['ufo', 'UFO - STRZELA W DÓŁ, SKOCZ NA NIE'], ['ghost', 'DUCH - BIJ, GDY JEST WIDOCZNY'], ['pumpkin', 'DYNIA - SKACZE NA CIEBIE'], ['ice', 'LÓD - ŚLISKI, HAMUJ WCZEŚNIEJ'], ['icicle', 'SOPEL - SPADA, GDY PRZECHODZISZ'],
      ['crumble', 'KRUSZĄCY BLOK - NIE STÓJ'], ['lava', 'LAWA - PARZY JAK ISKRY'], ['fire', 'KULA OGNIA - WYSKAKUJE Z LAWY'], ['space', 'GAGARINA - NISKA GRAWITACJA'], ['mega', 'MEGA BAG - OSTATNI BOSS']],
    things3: [['target', 'TARCZA - UDERZ, BY PRZEŁĄCZYĆ BLOKI'], ['switch', 'BLOKI CZERWONE / NIEBIESKIE'], ['conveyor', 'TAŚMOCIĄG - PCHA CIĘ'], ['laser', 'LASER - PRZEJDŹ, GDY ZGAŚNIE'], ['pad', 'SIŁOMIERZ - MŁOT Z GÓRY = 1000!'],
      ['fan', 'WENTYLATOR - UNOSI W GÓRĘ'], ['storm', 'ŚCIANA BURZY - UCIEKAJ!'], ['track', 'ŚCIEŻKA PRĄDU - PRZESKOCZ IMPULS'], ['giga', 'GIGA BAG - SPROWADZA PIORUNY']],
    goal: ['DOJDŹ DO AUTOMATU MONSTER', 'NA KOŃCU KAŻDEGO ETAPU.', '', 'BOSSOWIE: BIG BAG, MEGA BAG', 'I GIGA BAG (ETAPY 5, 10, 15).', 'UDERZAJ ICH, GDY LEŻĄ', 'OGŁUSZENI, I PRZESKAKUJ FALE!', '', 'POSTĘP ZAPISUJE SIĘ', 'AUTOMATYCZNIE.']
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
      it.push({ label: UI.select, act: () => { ui.act = Math.min(2, Math.floor((save.unlocked - 1) / 5)); openScreen('select'); ui.sel = 1; } });
      it.push({ label: UI.howto, act: () => { ui.page = 0; openScreen('howto'); } });
      it.push({ label: UI.options, act: () => openScreen('options') });
      it.push({ label: UI.rank, act: () => { ui.lastRank = null; fetchGlobal(); openScreen('ranking'); } });
      it.push({ label: UI.exit, act: () => { location.href = HOME; } });
      return it;
    }
    if (ui.screen === 'select') {
      // stages are grouped in acts of five: item 0 switches the act, then the act's stages, then BACK
      const acts = Math.ceil(LEVELS.length / 5), a = clamp(ui.act | 0, 0, acts - 1);
      const flip = d => { ui.act = (a + d + acts) % acts; sfx('move'); };
      const it = [{ label: '◀ ' + (UI.acts[a] || '') + ' ▶', act: () => flip(1), stage: -1 }];
      for (let i = a * 5; i < Math.min(LEVELS.length, a * 5 + 5); i++)
        it.push({ label: (i + 1) + ' ' + (i < save.unlocked ? LEVELS[i].name[LANG] : UI.locked), dis: i >= save.unlocked, stage: i, act: withNick(() => newGame(i)) });
      it.push({ label: UI.back, act: () => openScreen('main', true), stage: -1 });
      it.onLR = d => flip(d);
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
    else if (kind === 'ufo') drawEnemy({ type: 'ufo', x: x + 1, y: y + 2, w: 14, h: 9, alive: true, dir: 1, t: time }, time);
    else if (kind === 'ghost') drawEnemy({ type: 'ghost', x: x + 2, y: y - 2, w: 12, h: 14, alive: true, vis: true, dir: 1, t: time }, time);
    else if (kind === 'pumpkin') drawEnemy({ type: 'pumpkin', x: x + 1, y: y - 1, w: 14, h: 13, alive: true, dir: 1, t: time }, time);
    else if (kind === 'icicle') { for (let i = 0; i < 11; i++) { const w = Math.max(1, Math.round(8 * (1 - i / 12))); ctx.fillStyle = i < 3 ? '#e6f8ff' : '#9be4ff'; ctx.fillRect(x + 8 - Math.ceil(w / 2), y - 2 + i, w, 1); } }
    else if (kind === 'fire') { ctx.fillStyle = '#ff5a1e'; ctx.fillRect(x + 3, y, 10, 10); ctx.fillStyle = C.yel; ctx.fillRect(x + 5, y + 2, 6, 6); ctx.fillStyle = '#ff8a1e'; ctx.fillRect(x + 5, y + 10, 2, 3); ctx.fillRect(x + 9, y + 10, 2, 2); }
    else if (kind === 'space') { disc(x + 8, y + 5, 6, '#1d5fa8'); ctx.fillStyle = '#35a427'; ctx.fillRect(x + 5, y + 2, 4, 3); ctx.fillRect(x + 9, y + 6, 3, 3); }
    else if (kind === 'mega') { ctx.fillStyle = '#d89a26'; ctx.fillRect(x + 3, y + 1, 10, 12); ctx.fillStyle = C.yel; ctx.fillRect(x + 4, y + 2, 3, 5); ctx.fillStyle = C.mag; ctx.fillRect(x + 3, y + 9, 10, 1); ctx.fillStyle = C.yel; ctx.fillRect(x + 4, y - 2, 8, 2); ctx.fillRect(x + 4, y - 4, 2, 2); ctx.fillRect(x + 10, y - 4, 2, 2); }
    else if (kind === 'laser') { ctx.fillStyle = '#4a4e66'; ctx.fillRect(x + 3, y - 2, 10, 4); ctx.fillStyle = C.gl2; ctx.fillRect(x + 6, y + 2, 4, 10); ctx.fillStyle = C.white; ctx.fillRect(x + 7, y + 2, 2, 10); }
    else if (kind === 'storm') { ctx.fillStyle = '#04140a'; ctx.fillRect(x + 1, y - 2, 8, 14); ctx.fillStyle = C.g4; ctx.fillRect(x + 9, y - 2, 2, 14); ctx.fillStyle = C.white; ctx.fillRect(x + 11, y + 2, 3, 1); ctx.fillRect(x + 11, y + 7, 4, 1); }
    else if (kind === 'giga') { ctx.fillStyle = '#1f8a3a'; ctx.fillRect(x + 3, y + 1, 10, 12); ctx.fillStyle = C.g3; ctx.fillRect(x + 4, y + 2, 3, 5); ctx.fillStyle = C.yel; ctx.fillRect(x + 3, y + 9, 10, 1); ctx.fillRect(x + 3, y - 3, 2, 4); ctx.fillRect(x + 11, y - 3, 2, 4); }
    else if (['crate', 'cracked', 'spring', 'ice', 'crumble', 'lava', 'target', 'switch', 'conveyor', 'pad', 'fan', 'track'].includes(kind)) {
      const sv = level; // reuse tile painter on a 1-tile fake level
      level = { cols: 1, grid: Array.from({ length: ROWS }, () => ['.']), springT: null, crumble: {}, lasers: [], sw: false, padT: null, tflash: null };
      level.grid[0][0] = { crate: 'B', cracked: 'X', spring: 'S', ice: 'I', crumble: 'c', lava: '~', target: 'T', switch: 'R', conveyor: '>', pad: 'Y', fan: 'k', track: 'e' }[kind];
      ctx.save(); ctx.translate(x - 1, y - 2); ctx.beginPath(); ctx.rect(1, 1, 14, 12); ctx.clip();
      drawTiles(kind === 'crumble' || kind === 'lava' ? THEMES[8] : kind === 'track' ? THEMES[14] : THEMES[0], time);
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
    const x0 = Math.round(W / 2 - (W >= 400 ? 100 : 104));
    menuRects = [];
    // act switcher
    const al = items[0].label, aw = textWidth(al), sel0 = ui.sel === 0;
    drawText(ctx, al, W / 2, 38, sel0 ? C.yel : C.cyan, { align: 'center' });
    if (sel0) drawCursor(W / 2 - aw / 2 - 14, 38);
    menuRects.push({ x: W / 2 - aw / 2 - 16, y: 34, w: aw + 32, h: 14, i: 0 });
    for (let k = 1; k < items.length; k++) {
      const it = items[k], y = 54 + (k - 1) * 22, sel = ui.sel === k, w = textWidth(it.label, 2);
      drawText(ctx, it.label, x0, y, it.dis ? '#5d4f80' : sel ? C.yel : C.white, { scale: 2, shadow: it.dis ? null : '#3a0419' });
      if (sel && !it.dis) drawCursor(x0 - 14, y + 4);
      menuRects.push({ x: x0 - 18, y: y - 3, w: w + 36, h: 20, i: k });
    }
    const cur = items[ui.sel];
    if (cur && cur.stage >= 0 && !cur.dis) drawText(ctx, UI.best + ' ' + fmt(save.best[cur.stage] || 0), W / 2, 206, C.cyan, { align: 'center' });
  } else if (ui.screen === 'howto') {
    drawText(ctx, (ui.page + 1) + '/' + UI.pages.length + '  ' + UI.pages[ui.page], W / 2, 38, C.cyan, { align: 'center' });
    if (ui.page === 0) {
      const rows = lastTouch ? UI.touch : UI.keys;
      const kw = Math.max(...rows.map(r => textWidth(r[0]))), dw = Math.max(...rows.map(r => textWidth(r[1])));
      const x0 = Math.round(W / 2 - (kw + 12 + dw) / 2);
      rows.forEach((r, i) => { const y = 54 + i * 15; drawText(ctx, r[0], x0, y, C.yel); drawText(ctx, r[1], x0 + kw + 12, y, C.white); });
    } else if (ui.page >= 1 && ui.page <= 3) {
      const rows = [UI.things, UI.things2, UI.things3][ui.page - 1], dw = Math.max(...rows.map(r => textWidth(r[1])));
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
    if (state === 'play' || state === 'dying') { updateEnemies(dt); updateBalls(dt); updateWaves(dt); updateBoss(dt); updateLoose(dt); updateHazards(dt); }
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
