# Boxer Champion – model report (v6: crown fitted to photos, continuous rear profiles)

## Deliverables

| File | Contents |
| --- | --- |
| `blender/boxer-champion.blend` | Detailed source model. Root `BOXER_CHAMPION`; collections `BODY`, `CANOPY`, `BASE`, `FRONT_PANEL`, `REAR_DOORS`, `BAG_LOWERED`, `TRANSPORT_WHEELS`, `DETAILS`, `GRAPHICS`, `EMISSION`, `SOURCE_CAMERAS`, `UNCERTAIN`. Every object carries the custom properties `source_ids`, `confidence`, `measurement_status`, `detail_id`; the root carries every `param_*` value with its status. |
| `models/boxer-champion.glb` | Web copy used by /creator (glTF Y-up, metres, origin on the floor under the base outline). Same object names; node `extras` hold the same properties. |
| `blender/src/boxer_champion_model.py` | Parametric geometry. All dimensions are in `D` / `PARAMS` at the top (no numbers hidden in geometry functions for the documented parameters). |
| `blender/src/calib/ba_*.json` | Calibrated cameras of F01, F02, F10, F26 (bundle adjustment). They are also in the .blend as `SOURCE_CAMERAS/CAM_F01_IMG_0507` and so on. |
| `blender/renders/` | Orthographic front, back, left, right and top views (one common scale, 2.6 m frame); 3/4 views front-right, front-left, back-right and back-left; neutral versions without graphics or emission; renders through the four source cameras. |
| `blender/renders/compare/*_source_overlay_render.webp` | Photo, photo with the model silhouette, and model render, all from the same calibrated camera and crop. |

## v6 changes
- **Crown fitted to the photos:** the lid plan and its top line were fitted to the top silhouette of the lid in the 4 calibrated photos F01, F02, F10 and F26 (mean error 7.9 px before, 4.1 px after).
  - The lid top rises like a visor, from about 2.11 m at the back to 2.196 m at the front.
  - The sides flare out right behind the band. The lid is 0.74 m wide at the back and about 0.95 m at the widest point.
  - The face runs from the band at a steep incline up to the rim and ends in a 13 mm chamfer ("cut off at the top"). Its lower edge tucks in towards the band (IMG_0575).
  - The underside follows the slope towards the back, leaving a rear face of about 55 mm above the wheels.
- **Black rear profiles:** one continuous piece per edge from the base to the lid. The band drum is now flush with the column at the back, so there is no step.
- **Side graphics:** the band print now runs right up to the black profile. There is no strip of body colour between them.
- **No rescaling:** the model stays in the photogrammetric metric frame. Lid top 2.196 m; the catalogue gives 2.19 m.

## v5 changes (studio product photos + IMG_0514/0515/0518/0519/0520, 0566–0570, 0577)
- **Rear layout:** upper door centre 1.39 m, lower door 0.765 m. The rating plate, power inlet and locks moved with them. Source: F32 shows the upper frame top level with the side flag stripe (≈1.62 m), consistent with the studio rear photo. Screw heads are now at 0.15 / 0.735 / 1.38 / 2.05 m, matching the door levels as in F31.
- **Black rear profiles** run full height to the crown underside.
- **Tread plate:** classic 5-bar pattern at 45° to the plate edges, 59 mm lattice (measured on rectified bakes of F01/F02/F10).
- **Web viewer:** photo-studio light set (grey sweep, overhead softbox, two tall strip boxes, back rims), Khronos Neutral tone mapping so the red stays saturated, darker contact shadow.
- `renders/*_neutral_*` and `renders/*_camera_*` and `compare/` are from v4 (silhouette unchanged except crown and rear details).

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
| upper door (outer frame) | 0.45 × 0.45 m, centre x −0.032 m, y 1.39 m | F31 frontal (size), F32 + studio rear (height) |
| lower door | 0.222 × 0.246 m, centre y 0.765 m | F31 frontal (spacing to upper door) |
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
