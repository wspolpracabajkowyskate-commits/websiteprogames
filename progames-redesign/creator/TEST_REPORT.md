# PRO GAMES CREATOR — prototype verification

## Completed checks

- **GLB parse:** PASS — model loads through `trimesh` as a valid scene.
- **Physical bounds:** PASS — exported extents are **1.42 × 2.19 × 1.22 m** (width × height × depth), matching the Double Strike 2 specification in the supplied site data.
- **Required object names:** PASS — color targets, `DISPLAY`, three custom branding surfaces and all requested equipment nodes are present in the GLB.
- **Embedded reference artwork:** PASS — the GLB contains embedded image textures for the main score panel, top banner, side posters/logos, game rules and rear logo.
- **Modular model structure:** PASS — controllable body, branding, display and equipment are separate nodes; the machine is not one merged mesh.
- **Source regeneration:** PASS — `source/model_source.py` regenerates the GLB and `source/extract_reference_assets.py` regenerates the reference-derived artwork textures.
- **JavaScript syntax:** PASS — `app.js` and `bootstrap.js` pass `node --check`.
- **Default config:** PASS — valid JSON and matches UI defaults.
- **Route isolation:** PASS — no existing product HTML, product JS, home page, styles or product data files were changed.
- **Deployment isolation:** PASS — source/reference files remain in the delivered ZIP but are excluded from Vercel deployment by `.vercelignore`.
- **Lazy loading:** PASS by code inspection — Three.js / GLTF runtime is dynamically imported only after `START CREATING`; the GLB is requested inside that runtime.
- **Responsive safeguards:** PASS by code inspection — no horizontal page overflow, single-column breakpoint under 980 px, mobile touch targets and reduced DPR/shadows under 700 px.

## Browser-only checks to repeat after deployment

The execution environment used to build this package blocks browser navigation/network access, so a live WebGL end-to-end run against the CDN could not be executed here. After deployment, verify the following in Chrome/Safari on desktop and phone: model load, OrbitControls gestures, PNG download, file upload, and browser console. The implementation paths for all of these features are present and were statically validated.
