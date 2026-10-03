# Architecture and integration

Independent static module, English prototype UI. Existing EN/ES pages and scripts are unchanged. The HTML imports the bundled app only after an explicit start action. GLTFLoader then loads one GLB from the same origin. No cloud 3D service, remote CDN, authentication, database or paid inference is used.

## Coordinates and model

Y up, +Z front, X lateral. Origin at platform centre on the ground. Scale is approximate metres, not approved manufacturing dimensions. Mesh normals and UVs are supplied. Branding planes have full 0–1 UV coordinates. Geometry is not changed when branding is edited.

Logical groups: `BODY_MAIN`, `FRONT_PANEL`, `LEFT_PANEL`, `RIGHT_PANEL`, `BACK_PANEL`, `TOP_SECTION`, `BASE_HOUSING`, `METAL_ELEMENTS`, `PUNCHING_BAG`, `KICKER_BALL`, `DISPLAY`, `BUTTONS`, `LED_LIGHTS`, `PAYMENT_PANEL`, `FACTORY_GRAPHICS`.

The paint material `PAINT_BLUE` is shared by the colour-changing surfaces in BODY_MAIN, BACK_PANEL, TOP_SECTION and BASE_HOUSING. Side/front shells are faces of CENTRAL_CABINET and respond to the same material. Logical side groups also retain the rear trim. Materials include metal, matte black, rubber/leather, glass, LED emissive and printed graphics. Full actual material and object names are in `model-manifest.json`; some static details are batched per material within their group. Their pre-batch part names remain in `userData.sourceParts` in the GLB and in the source generator.

## Optional modules

| State key | GLB node |
|---|---|
| `coin_acceptor` | `COIN_ACCEPTOR` |
| `banknote_acceptor` | `BANKNOTE_ACCEPTOR` |
| `card_reader` | `CARD_READER` |
| `ticket_dispenser` | `TICKET_DISPENSER` |
| `capsule_dispenser` | `CAPSULE_DISPENSER` |

Each is a separate Group. The application toggles `visible`, with no additional model load. Module geometry and locations are schematic, not approved mounting specifications. The existing standard coin panel stays in the machine; the coin option is additional.

GLB has no native visibility flag. To preserve a clean default in generic viewers while retaining all optional nodes, optional groups and empty branding planes are exported with scale zero and metadata `defaultScale`. `DOUBLE_STRIKE.userData.defaultHidden` lists them. On load the app restores their normal scale, then manages `visible`. When consuming this GLB elsewhere, restore `node.scale.fromArray(node.userData.defaultScale)` before showing an optional group.

## Branding

State `branding.front/left/right` maps to `CUSTOM_FRONT/LEFT/RIGHT`. Each stores a normalized PNG data URL, file name, x/y in [-1,1], scale in [0.1,2], rotation in [-180,180]. Separate 512×1024 front and 256×1024 side canvases are reused. Artwork is composited into these textures at runtime; colour remains on the underlying shell. Branding materials become visible/opaque only when an image exists. The display and protective glass are placed above the front artwork. Clipping at surface edges is intentional.

PNG/JPEG images and a restricted self-contained SVG subset are decoded locally and normalized to at most 1024 px. SVG is rendered into a raster texture, never injected into the document. JSON accepts only embedded PNG/JPEG data URLs, not arbitrary URLs. Inputs and file names are rendered as text. Invalid imports leave the existing configuration intact. Repeated uploads reuse the GPU texture and canvas for a surface.

## Persistence and ID

Schema `progames-creator`, version 1, model `double-strike-reference-1.0`. `design` contains colour, sorted equipment keys, factoryArtwork, leds and branding. The JSON includes graphics, not just file names, so it round-trips without a server. `configurationId` is recalculated from state with SHA-256; first 80 bits are displayed. It is content-derived and stable, not a centrally allocated guaranteed-unique order number. `savedAt` is not part of the hash.

localStorage key: `progames-creator-draft-v1`. Saving can fail in private browsing or when quota is exceeded; the UI asks the user to use JSON. JSON download remains independent of localStorage. Imported model/version and graphics limits are checked before application.

## API and future inquiry integration

After startup `window.PGCreator` exposes:

- `getConfiguration()` — current serializable document.
- `importConfiguration(document)` — async validated replacement.
- `getRequestPayload()` — product, colour, equipment labels, branding metadata, ID and full JSON document.
- `exportPNG()` — async Blob of current camera view, colour, visible equipment, branding and ID.
- `getStats()` — frames, draws, triangles, geometry/texture counts and startup time.
- `setScreenImage(file)` — normalize a raster image and update the independent DISPLAY_SCREEN material.
- `setScreenTexture(texture)` — accepts a Three.js Texture / CanvasTexture / VideoTexture.
- `invalidate()` — render one new frame after an external texture update.
- `dispose()` — release listeners, observers, geometries, textures, renderer and controls. Reload to initialize again after explicit disposal.

The app emits `pgcreator:request` with the payload when Request this configuration is pressed. Current action opens a review dialog and a mailto draft for office@progames.pl. No message is sent automatically. Attachments must be added manually in the email app. Nothing is written to the existing contact form or CRM.

Example future integration (only a developer hook; not installed in current site):

```js
document.addEventListener('pgcreator:request', async ({detail}) => {
  const payload = {...detail, previewPng: await window.PGCreator.exportPNG()};
  // Hand payload.configuration and the Blob to your approved form/backend.
});
```

A future animated screen must explicitly request rendering while the video/canvas changes; the prototype intentionally has no continuous animation loop. `setScreenTexture` uses the glTF material UV convention, so custom textures should be configured with `flipY = false`, `colorSpace = THREE.SRGBColorSpace`. Revoke/dispose externally created video/object URLs in their owning integration.

## Runtime / maintenance

Three.js 0.180.0, vendored locally, MIT license in vendor/THREE-LICENSE.txt. GLTFExporter and geometry helpers are needed by source/export.html, not the runtime bundle. OrbitControls, GLTFLoader, environment and core are bundled into app.js with esbuild 0.25.10. No build is needed for deployment.

The design avoids continuous renders and reallocating textures per input. Orbit controls do not use damping. ResizeObserver sizes the canvas to its container; max mobile DPR 1.5. Camera orbit has polar and distance limits. Touch rotation is explicitly enabled, leaving normal scrolling available by default. Context-loss and loading-error screens offer reload; local draft survives if storage is available.

Official API references used during implementation:
- https://threejs.org/docs/pages/GLTFExporter.html
- https://threejs.org/docs/pages/GLTFLoader.html
