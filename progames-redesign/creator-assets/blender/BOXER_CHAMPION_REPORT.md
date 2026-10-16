# Boxer Champion – model report (v4, rebuilt from BOXER_CHAMPION_REFERENCES_CLAUDE_2)

## Deliverables

| File | Contents |
| --- | --- |
| `blender/boxer-champion.blend` | Detailed source model. Root `BOXER_CHAMPION`; collections `BODY`, `CANOPY`, `BASE`, `FRONT_PANEL`, `REAR_DOORS`, `BAG_LOWERED`, `TRANSPORT_WHEELS`, `DETAILS`, `GRAPHICS`, `EMISSION`, `SOURCE_CAMERAS`, `UNCERTAIN`. Every object carries the custom properties `source_ids`, `confidence`, `measurement_status`, `detail_id`; the root carries every `param_*` value with its status. |
| `models/boxer-champion.glb` | Web copy used by /creator (glTF Y-up, metres, origin on the floor under the base outline). Same object names; node `extras` hold the same properties. |
| `blender/src/boxer_champion_model.py` | Parametric geometry. All dimensions are in `D` / `PARAMS` at the top (no numbers hidden in geometry functions for the documented parameters). |
| `blender/src/calib/ba_*.json` | Calibrated cameras of F01, F02, F10, F26 (bundle adjustment). They are also in the .blend as `SOURCE_CAMERAS/CAM_F01_IMG_0507` and so on. |
| `blender/renders/` | Orthographic front, back, left, right and top views (one common scale, 2.6 m frame); 3/4 views front-right, front-left, back-right and back-left; neutral versions without graphics or emission; renders through the four source cameras. |
| `blender/renders/compare/*_source_overlay_render.webp` | Photo, photo with the model silhouette, and model render, all from the same calibrated camera and crop. |

## State
- One punch bag, lowered vertically (F34/F35). The four-panel egg-shaped ball has black panels front and back and red panels at the sides; the black neck cover has one fold and a cuff over the ball. The cavity behind it is only dark – no mechanism is invented.
- Displays show 777 / 649 / 5. These are separate emissive fields with 7-segment polygons; dark inactive segments are kept and there are no decimal points. A thin glass layer covers the shield.
- Two round lamps, plus the START BOXER rosette with a thin warm glowing ring.
- Doors are closed. Each has a frame, a recessed leaf and a geometric gap, plus a lock rosette with the key hanging on its ring (D01/D02).
- There are two transport wheels on the upper rear corners. Each has a base plate with 4 bolts, a fork, a grey wheel and an axle (D06/D07).
- Rear: power inlet with switch (D22) and rating plate 116 KG (D23), both textured from the F31 crops.
- Black rear profiles carry only the screw heads that are visible (D05).
- No hinges, seals, feet under the base or other parts that are not visible in the photos.

## Method
1. A bundle adjustment of F01, F02, F10 and F26 (iPhone 15 Pro, known focal length) gave the camera poses and the main dimensions. It used about 1000 SIFT matches on the flat front panel and manual points (platform corners, rails, lamps, START button). Scale: catalogue height K01 = 2.19 m (no M measurements were available).
2. Graphics are projective bakes of the photos onto the model surfaces. The front blends 3 photos by texel resolution; the CHAMPION band (curved) blends 4 photos with seams placed in letter gaps; each side is baked separately (left and right are not mirrored).
3. Rear details come from F31, which is nearly frontal. The scale is the body width (0.645 m = 525 px, i.e. 814 px/m).

## Main dimensions (photogrammetry unless marked)
| Parameter | Value | Status |
| --- | --- | --- |
| body_width × body_depth | 0.645 × 0.308 m | photogrammetry |
| base_outline | 0.69 × 1.04 m (ramp 0.10) | photogrammetry |
| base_thickness | 0.045 m | estimated (F33) |
| canopy band height (front) | 0.229 m | photogrammetry |
| lid underside | 2.097 m at the sides → 2.132 m at the front centre | photogrammetry |
| upper door (outer frame) | 0.45 × 0.45 m, centre x −0.032 m, y 1.12 m | F31 frontal |
| lower door | 0.222 × 0.246 m, centre y 0.495 m | F31 frontal |
| bag | ball 0.24 × 0.28 m, neck 0.225 m, ball bottom ≈1.37 m | estimated (F34/F35/P01) |
| wheels | Ø 77 mm, 28 mm wide | estimated |

## Validation
- The silhouette of the model, rendered through the calibrated cameras, matches F01, F02, F10 and F26 (see `compare/`). The bag differs on purpose: the photos show it stowed, while the model has it lowered.
- After export, the GLB was re-imported in the web viewer. All 4 graphics zones accept uploads; AR export (USDZ) works; there are no console errors. Emission in the browser does not light the scene (no bloom); the lamps are rendered unlit and bright.

## Open items (from the package register + new)
| ID | Item | Status |
| --- | --- | --- |
| Q01 | Roof and base underside not photographed – the crown top surface and base underside are estimates. | OPEN – needs top/underside photos |
| Q04 | Profile section, door frame thickness and screw head type estimated. | OPEN – needs macro photos with a ruler |
| Q11 | Catalogue 121 kg vs plate 116 KG – the plate texture is kept as photographed. | OPEN |
| N1 | Bag size and hang point estimated from oblique F34/F35/P01 – no straight-on photo of the lowered bag. | OPEN – photo request 4 in the package |
| N2 | Lock rosette Ø23 mm, wheel Ø77 mm, rear screw positions: estimated. | OPEN |
| N3 | P01 is 417×850 – digit shapes of 777/649/5 are drawn as 7-segment polygons following P01/F26, not traced at full resolution. | OPEN |
| N4 | Front graphic: reflections in the source photos could only be partly removed; no print files available. | OPEN – print files requested |
