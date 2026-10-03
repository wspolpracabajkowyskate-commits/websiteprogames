# CHANGES v26 — PRO GAMES CREATOR realistic 3D model update

## Added / upgraded
- Rebuilt the `/creator/` Double Strike 2 web model into a more realistic high-fidelity 3D presentation.
- Kept the existing configurator logic unchanged: color switching, equipment toggles, branding upload, preview export, and inquiry payload still work on the same route.
- Regenerated the GLB with richer geometry and additional details:
  - deeper front kicker recess,
  - textured floor plate,
  - improved rear service area,
  - extra lighting/LED details,
  - more product-like proportions and visual separation of parts.
- Updated the creator viewer presentation for a cleaner studio-style look.

## Files touched
- `creator/source/model_source.py`
- `creator/model/pro-games-double-strike-2.glb`
- `creator/model/manifest.json`
- `creator/app.js`
- `creator/index.html`

## Intention
This update improves the realism of the 3D machine shown in the configurator while preserving the already working creator flow and integration path.
