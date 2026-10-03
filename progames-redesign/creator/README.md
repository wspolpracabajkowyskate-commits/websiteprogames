# PRO GAMES CREATOR — Double Strike 2 prototype

Standalone route: `/creator/`

This directory is intentionally isolated from the existing product cards. The page lazy-loads `app.js`, Three.js and the GLB only after **START CREATING** is pressed.

## Files

- `model/pro-games-double-strike-2.glb` — web model with reference-derived decals embedded in the GLB.
- `model/manifest.json` — stable object/material names used by the configurator.
- `source/model_source.py` — procedural source used to generate the GLB with `trimesh`.
- `source/extract_reference_assets.py` — creates the artwork textures from the supplied real-machine reference images.
- `source/reference/` — the nine supplied references (kept as source material; excluded from Vercel deployment by `.vercelignore`).
- `app.js` — Three.js runtime: orbit/zoom, materials, equipment visibility, branding canvases, JSON state, ID generation, screenshot, reset and inquiry payload.
- `bootstrap.js` — lightweight lazy entry point.
- `config/default.json` — default state.

## Controlled GLB nodes

Body color: `BODY_MAIN`, `LEFT_PANEL`, `RIGHT_PANEL`, `BODY_COLUMN`, `BACK_PANEL`, `TOP_SECTION`, `TOP_LIP`, `FRONT_FRAME_*`, `REAR_SERVICE_*`.

Branding: `CUSTOM_FRONT`, `CUSTOM_LEFT`, `CUSTOM_RIGHT`.

Equipment: `COIN_ACCEPTOR`, `BANKNOTE_ACCEPTOR`, `CARD_READER`, `TICKET_DISPENSER`, `CAPSULE_DISPENSER` + `CAPSULE_BASE`.

Display: `DISPLAY` and `DISPLAY_GLASS`.

The runtime also exposes `window.PRO_GAMES_CREATOR.getConfiguration()`, `reset()` and a `setDisplayCanvas(draw)` hook for future dynamic display content.
