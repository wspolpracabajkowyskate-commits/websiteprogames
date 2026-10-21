# Boxer Champion – model report (v10: shape from the manufacturer CAD renders)

## v10 changes (21.10.2026)
Only the SHAPE changed; graphics, colours and materials are those of v9.
- **Reference:** SolidWorks renders (front, both sides, top, 3/4 from above and from below). The side
  view is the scale reference (642.5 px/m, total height 2.19 m); the top view gives the lid and base
  plan; the front view was corrected for its perspective.
- **Column:** 0.70 m wide (v9 0.645), 0.321 m deep, standing on a flat base plate 0.72 × 1.137 m
  (33 mm, short front bevel instead of the long ramp, 97 mm of plate behind the column, 4 levelling feet).
  Corner rails narrowed to 20 mm.
- **Canopy:** one box as wide as the column, sides flush with the column, semicircular front (r 0.35 m),
  1.858–2.103 m, chamfered lower tray, flat underside (the v9 'chin' is gone), thin ledge under the lid.
  Underside opening, two lamps and the START button moved to the CAD positions (START on the tray chamfer).
- **Lid:** flat 'U' shell 0.838 × 1.296 m, top at 2.19 m (no visor slope), rounded nose, underside rising
  from the box to the rim, recessed top panel with 4 screw heads and a round cap at the back right.
- **Score shield:** crest outline from the CAD (horns at the top corners, pointed bottom at 0.85 m),
  raised glass face with a sloped red bevel. Coin acceptor at its CAD position.
- **Print files re-fitted** (`blender/src/fit_champion_cad_textures.py`, sources in `reference/sticker_v9/`):
  front panel warped so the printed shield window sits exactly under the new glass face and the printed
  bezel under the new bevel (displays and rules plate follow the print); canopy band re-laid onto the
  longer wall (CHAMPION panel +18 %, side artwork stretched); side panels unchanged.
- Zone sizes in `creator/js/config.js`: front 0.707 × 1.817, band 2.577 × 0.192, sides 0.251 × 1.813 m.
- `models/boxer-champion.glb` rebuilt with `export_glb.py` (same writer as v9). `boxer-champion.blend`
  and the Blender renders in `blender/renders/` are still v9 – rebuild them with
  `DS_MODEL=champion_model blender -b -P build_double_strike_blend.py -- --out creator-assets`.
  Comparison with the CAD: `renders/compare/v10_cad_side_top.webp`.

---

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

## v9 changes
- **Front corner profiles (D09, IMG_0575 as marked):** the front face of the profile is now a concave channel. An inner lip and an outer lip frame a trough recessed about 5 mm into the profile, and a small radius turns the corner onto the side. The run and the sizes are unchanged.
- **Height:** the model is scaled to exactly 2.19 m, the catalogue height, so AR shows the published height. The scale factor is 0.997.
  - The overall envelope taken from the photos stays 94 cm wide (lid) × 130 cm long (lid front to rear wheels).
  - Base plate 69 × 104 cm.
  - The catalogue states 72 × 115 cm.
- **Canopy band upload:**
  - New "Stretch" mode stretches the upload over the whole band: left side, front and right side, up to the rear profiles.
  - The scale range now goes to 600 %.
  - Long zones get a 4096 px canvas.

## v8 changes
- **Lid lower edge (IMG_0575):** a concave cove, the arc recessed into the lid between its ends, replaces the bead.
- **Rear doors:** the keys are removed. Locks and doors are unchanged (D01_upper_lock_key and D02_lower_lock_key no longer exist).
- **Front artwork above the shield:** made transparent above the sticker edge, so the dark bag neck from the photo no longer shows there. The body paint shows instead and follows the chosen body colour.

## v7 changes
- **Score shield bezel:** the top edge is no longer straight. It follows the wavy top of the sticker as measured on the front bake (IMG_0513 / studio set): highest in the middle (1.773 m), dipping about 2.5 cm on both sides of centre, then rising again to the shoulders. The brim chin follows the same line.
- **Front graphics:** the factory front artwork has stronger contrast and saturation (levels, contrast, colour, light unsharp mask). The sides and band got a milder pass. The acrylic over the shield is clearer (6 % dark tint instead of 10 % grey).

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
- Doors are closed. Each has a frame, a recessed leaf and a geometric gap, plus a lock rosette (D01/D02, keys left out).
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
