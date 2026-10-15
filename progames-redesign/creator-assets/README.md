# PRO GAMES Creator – assets (dev preview)

Hidden configurator: **/creator** (default machine: Boxer Champion; `/creator/?model=double-strike` for Double Strike) (not linked anywhere, `noindex, nofollow`, not in `sitemap.xml`).

```
creator/                      web app (static, vanilla ES modules, three.js r170 vendored)
  index.html                  page (robots noindex) – the only HTML of the module
  creator.css                 isolated styles (does not touch styles.css)
  js/config.js                PRODUCT CONFIG: colours, camera presets, graphics zones, options
  js/app.js                   controller: loading, LEDs, colour, zones, upload, save preview, state
  js/studio.js                renderer, studio lighting, soft + contact shadows, camera limits
  js/graphics.js              zone graphics (canvas texture through the zone UVs)
  js/storage.js               localStorage (config) + IndexedDB (uploaded images)
  vendor/three/               three.module.min.js + OrbitControls, GLTFLoader, RoomEnvironment
creator-assets/
  blender/boxer-champion.blend source Blender project – Boxer Champion (Blender 5.2.2)
  blender/double-strike.blend source Blender project – Double Strike (Blender 5.2.2)
  blender/src/                build pipeline (Python)
    champion_model.py         Boxer Champion geometry (reference photos + 219 x 72 x 115 cm)
    make_champion_textures.py Boxer Champion graphics from the photos (bag removed via 3/4 photo)
    double_strike_model.py    parametric geometry reconstructed from the reference photos
    meshlib.py                mesh toolkit (rounded boxes, sweeps, lathes, conforming decals, UVs)
    materials.py              PBR material library (shared by Blender + GLB writer)
    make_textures.py          factory graphics extracted from photos + procedural PBR maps
    build_double_strike_blend.py  builds the .blend, control renders, exports the GLB
    export_glb.py             pure-python GLB writer (CI / fallback, same geometry)
  blender/renders/            control renders from Blender (front / left / right / back / 3-4, .webp)
  models/boxer-champion.glb   Boxer Champion web model (Blender export)
  models/double-strike.glb    Double Strike web model (Blender export)
  textures/                   all texture sources
  reference/                  reference photos used for modelling (.webp)
```

## Rebuild the model

```
# 1. textures (Python 3 + numpy + Pillow)
python3 creator-assets/blender/src/make_textures.py creator-assets/reference creator-assets/textures
# 2. Blender: geometry + materials + UV + .blend + GLB + control renders
blender -b -P creator-assets/blender/src/build_double_strike_blend.py -- --out creator-assets
# Boxer Champion:
python3 creator-assets/blender/src/make_champion_textures.py creator-assets/reference creator-assets/textures/champion
DS_MODEL=champion_model blender -b -P creator-assets/blender/src/build_double_strike_blend.py -- --out creator-assets
```
Dimensions live in `D = dict(...)` at the top of `double_strike_model.py`
(height is normalised to 219 cm). Change a value, re-run step 2, deploy the new GLB.

## Add a graphics zone
1. In `double_strike_model.py` create a decal mesh named `decal_<zone>` with its own
   material `GFX_<ZONE>` (helpers: `RoundedBox.decal_grid` for cabinet faces,
   `contour_strip` for the curved canopy, `quad` for flat panels). UVs are 0–1 over the zone.
2. Add the material to `materials.py` (factory artwork texture, `alpha='BLEND'`).
3. Add `{ id, label, material: 'GFX_<ZONE>', size: [w, h] (m), camera }` to
   `PRODUCTS[...].zones` in `creator/js/config.js`. No other code changes are needed.

## Add another machine
1. Build/export its GLB to `creator-assets/models/<id>.glb` using the same naming rules
   (`BODY_PAINT` for recolourable paint, `GFX_*` per zone, `LED_*` for lights).
2. Add an entry to `PRODUCTS` in `creator/js/config.js`; open `/creator/?model=<id>`.

## Options
`options[]` in config: `select`, `range`, `toggle`. A toggle with `model: '/creator-assets/models/x.glb'`
and `anchor: '<node name>'` loads that GLB and attaches it when switched on.

## Material names in the GLB
BODY_PAINT, BLACK_PLASTIC, RUBBER, METAL, DIAMOND_PLATE, BOXING_BAG_RED, BOXING_BAG_BLACK,
LEATHER_BLACK, BALL, SCREEN, LED_RGB, LED_WHITE, LED_STRIP, DECALS,
GFX_TOP_FRONT, GFX_SCORE, GFX_LEFT, GFX_RIGHT, GFX_LOWER_FRONT, GFX_KICKER, GFX_TOP_SIDE, GFX_BACK.

Factory graphics in `textures/zone_*.webp` were extracted from the product photos and are
low resolution – replace them with the production print files (same file names) and rebuild.
