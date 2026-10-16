// PRO GAMES Creator - product configuration.
// Everything the viewer needs to know about a machine lives here, so another model can be
// added by appending an entry to PRODUCTS (see /creator-assets/README.md).

export const STORAGE_KEY = 'progames-creator:v1';

export const BODY_COLORS = [
  { id: 'blue', label: 'PRO GAMES Blue', hex: '#0052d6' },
  { id: 'red', label: 'Red', hex: '#c40d1e' },
  { id: 'black', label: 'Black', hex: '#141518' },
  { id: 'white', label: 'White', hex: '#eef0f3' },
  { id: 'yellow', label: 'Yellow', hex: '#f5c400' },
  { id: 'orange', label: 'Orange', hex: '#ff5a0a' },
  { id: 'green', label: 'Green', hex: '#009a4e' },
];

// Camera presets: position / target in metres (glTF axes: +Z = machine front, +X = machine right)
export const CAMERA_PRESETS = {
  front: { label: 'Front', pos: [0, 1.3, 6.6], target: [0, 1.06, 0.12] },
  left: { label: 'Left', pos: [-6.6, 1.35, 0.25], target: [0, 1.06, 0.2] },
  right: { label: 'Right', pos: [6.6, 1.35, 0.25], target: [0, 1.06, 0.2] },
  back: { label: 'Back', pos: [0, 1.35, -6.6], target: [0, 1.06, 0.1] },
  q34: { label: '3/4', pos: [4.1, 2.05, 5.4], target: [0, 1.02, 0.15] },
};

export const PRODUCTS = {
  'boxer-champion': {
    id: 'boxer-champion',
    name: 'Boxer Champion',
    subtitle: 'Boxing machine',
    thumb: '/creator-assets/thumbs/boxer-champion.webp',
    spec: 'Boxer · H 219 cm · 69 × 109 cm',
    model: '/creator-assets/models/boxer-champion.glb',
    defaultColor: 'red',
    paintMaterials: ['BODY_PAINT'],
    ledMaterials: ['LED_WHITE'],
    defaultPreset: 'q34',
    zones: [
      { id: 'front', label: 'Front panel', hint: 'Full-height door graphic around the score shield', material: 'GFX_FRONT', size: [0.67, 1.805],
        camera: { pos: [0.6, 1.25, 4.4], target: [0, 1.0, 0.14] } },
      { id: 'band', label: 'Canopy band', hint: 'Wraps the canopy: left side, front, right side', material: 'GFX_BAND', size: [2.39, 0.229],
        camera: { pos: [-1.6, 2.4, 2.6], target: [0, 1.99, 0.4] } },
      { id: 'left', label: 'Left side', hint: 'Full-height side panel', material: 'GFX_LEFT', size: [0.238, 1.859],
        camera: { pos: [-4.5, 1.3, 1.3], target: [-0.31, 1.0, 0.0] } },
      { id: 'right', label: 'Right side', hint: 'Full-height side panel', material: 'GFX_RIGHT', size: [0.238, 1.859],
        camera: { pos: [4.5, 1.3, 1.3], target: [0.31, 1.0, 0.0] } },
    ],
    options: [
      { id: 'ledEffect', label: 'Canopy down-lights', type: 'select', default: 'factory',
        choices: [{ id: 'factory', label: 'On' }, { id: 'pulse', label: 'Pulse' }, { id: 'off', label: 'Off' }] },
      { id: 'ledBrightness', label: 'Light brightness', type: 'range', min: 0, max: 1.5, step: 0.05, default: 1 },
      { id: 'screens', label: 'Score displays on', type: 'toggle', default: true },
      { id: 'ticketDispenser', label: 'Ticket dispenser', type: 'toggle', default: false, model: null, anchor: 'body', comingSoon: true },
      { id: 'billAcceptor', label: 'Banknote acceptor', type: 'toggle', default: false, model: null, anchor: 'body', comingSoon: true },
    ],
  },
  'double-strike': {
    id: 'double-strike',
    name: 'Double Strike',
    subtitle: 'Boxer + Kicker',
    thumb: '/creator-assets/thumbs/double-strike.webp',
    spec: 'Boxer + Kicker · H 219 cm',
    defaultColor: 'blue',
    defaultZone: 'score',
    model: '/creator-assets/models/double-strike.glb',
    dimensions: { height: 2.19, note: 'Height 219 cm (published spec)' },
    // only materials listed here are recoloured by the body colour picker
    paintMaterials: ['BODY_PAINT'],
    ledMaterials: ['LED_RGB', 'LED_WHITE', 'LED_STRIP'],
    defaultPreset: 'q34',
    // Graphics zones. `material` = material in the GLB that carries the artwork; all meshes
    // using it are updated together. `size` = physical size in metres (canvas aspect ratio).
    zones: [
      { id: 'top_front', label: 'Top front', hint: 'Banner on the front of the canopy', material: 'GFX_TOP_FRONT', size: [0.77, 0.178],
        camera: { pos: [0.0, 1.95, 2.6], target: [0, 1.93, 0.6] } },
      { id: 'score', label: 'Score panel', hint: 'Shield graphic around the displays', material: 'GFX_SCORE', size: [0.469, 0.754],
        camera: { pos: [0.35, 1.35, 2.3], target: [0, 1.32, 0.17] } },
      { id: 'left', label: 'Left side', hint: 'Vertical panel on the column', material: 'GFX_LEFT', size: [0.18, 0.89],
        camera: { pos: [-2.6, 1.35, 0.7], target: [-0.29, 1.3, 0.02] } },
      { id: 'right', label: 'Right side', hint: 'Vertical panel on the column', material: 'GFX_RIGHT', size: [0.18, 0.89],
        camera: { pos: [2.6, 1.35, 0.7], target: [0.29, 1.3, 0.02] } },
      { id: 'lower_front', label: 'Lower front', hint: 'Kicker cabinet front, around the opening', material: 'GFX_LOWER_FRONT', size: [1.0, 0.74],
        camera: { pos: [0.4, 0.75, 2.9], target: [0, 0.42, 0.26] } },
      { id: 'kicker', label: 'Kicker panel', hint: 'Both sides of the kicker cabinet', material: 'GFX_KICKER', size: [0.365, 0.62],
        camera: { pos: [-2.5, 0.8, 1.2], target: [-0.53, 0.45, 0.0] } },
      { id: 'top_side', label: 'Top side', hint: 'Both flanks of the canopy', material: 'GFX_TOP_SIDE', size: [0.38, 0.18],
        camera: { pos: [-2.3, 2.15, 1.3], target: [-0.33, 1.92, 0.12] } },
      { id: 'back', label: 'Back logo', hint: 'Logo on the rear of the column', material: 'GFX_BACK', size: [0.54, 0.343],
        camera: { pos: [0.4, 1.6, -2.6], target: [0, 1.64, -0.12] } },
    ],
    // Options: `model` (optional) = extra GLB attached at `anchor` (node name) when enabled.
    options: [
      { id: 'ledEffect', label: 'LED effect', type: 'select', default: 'chase',
        choices: [{ id: 'factory', label: 'Factory colours' }, { id: 'chase', label: 'RGB chase' }, { id: 'pulse', label: 'Pulse' }, { id: 'off', label: 'Off' }] },
      { id: 'ledBrightness', label: 'LED brightness', type: 'range', min: 0, max: 1.5, step: 0.05, default: 1 },
      { id: 'screens', label: 'Score displays on', type: 'toggle', default: true },
      { id: 'ticketDispenser', label: 'Ticket dispenser', type: 'toggle', default: false, model: null, anchor: 'body', comingSoon: true },
      { id: 'billAcceptor', label: 'Banknote acceptor', type: 'toggle', default: false, model: null, anchor: 'body', comingSoon: true },
    ],
  },
};

export const DEFAULT_PRODUCT = 'boxer-champion';
