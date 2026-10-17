# Ultimate Monster 3in1 – model report (v1)

## Deliverables
| File | Contents |
| --- | --- |
| `models/ultimate-monster.glb` | Web model for /creator: glTF, Y up, metres, origin on the floor. Size 3.8 MB, about 50k triangles. |
| `blender/src/monster_model.py` | Parametric source. All main dimensions are in `D` at the top. |
| `blender/src/make_monster_textures.py` | Rebuilds every print from the reference views. It rectifies each print, keys the body paint out to alpha, removes lamps and reflections, and packs the stickers into an atlas. |
| `textures/monster/` | Zone prints: front, canopy front, left, right and tower. Also the sticker atlas and the LED meter texture. |
| `.blend` | Not built yet: the Blender machine was offline. The builder supports `DS_MODEL=monster_model`. |

## Source and method
- **Source:** the supplied generated views (no photographs). They are not orthographic and they differ in details, so one consistent geometry was chosen.
- **Heights and depths:** from the left side view (n11), which is close to orthographic at about 624 px/m.
- **Widths:** from the front view (n13), measured relative to the screen frame.
- **Hammer station and tower layout:** from the front view and both 3/4 views.
- **Details and prints:** from the close-ups (front panel, canopy, kicker, hammer, bag).
- **Prints:** rectified onto the physical size of their faces. The body paint is keyed out, so the configurator colour shows through around every sticker.

## Overall size
| | Model | Spec |
| --- | --- | --- |
| Height | 2.30 m | 230 cm |
| Width | 1.40 m (crown left edge to tower) | 140 cm |
| Depth | 1.30 m (canopy front to rear rollers / castors) | 140 cm |

All the views agree on a depth of about 1.28–1.30 m. Stretching the model to 1.40 would distort it, so it was left at 1.30 m (open item M1).

## Structure (object names)
- **Body:**
  - `B01_column_body` – the boxer column. Its front is a trapezoid: the right edge leans out towards the kicker.
  - `R06_edge_profiles` – black edge profiles.
- **Canopy:**
  - `B02_canopy_band` – the band. Its front has three facets: left chamfer, front, right chamfer.
  - `B02_canopy_crown` – the flared crown, with a sharp 13 mm cut-off top edge as on the Boxer Champion.
  - `B03_canopy_underside` – the underside with the bag opening and two LED down-lights.
- **Front:** screen frame with 8 screws, glossy screen, header and footer prints, glass, coin mech, START KICKER button.
- **Kicker:**
  - `K01` – cabinet with a tapered recess and the smash panel.
  - `K02` – stitched football, made of 12 pentagons and 20 hexagons.
  - `K03` – folded leather sleeve.
  - `K04` – mount plate, bracket and stop block.
- **Hammer:**
  - `H01` – base with chamfered top edges and lamps.
  - `H02`, `H03` – strike pad and rubber bellows.
  - `H04` – red head with studded ends.
  - `H05`, `H06` – handle and safety cable with an eye bolt.
  - `H07` – START HAMMER button.
- **Tower:** `T01` – body; `T02` – recessed LED meter; `T03` – black profiles. It also carries 16 lamps.
- **Bag:** `D13_bag`, `D14_neck`, `D14_neck_mount`. The bag is lowered and hangs vertically under the canopy.
- **Rear:** 4 black service doors with round locks (keys left out, as on the Boxer Champion), rating plate, transport rollers with a handle bar on top, yellow castors.
- **Lamps:** about 80 milky domes on toothed bases (`L01`, `L02`).
- **Configurator zones:** `GFX_FRONT`, `GFX_BAND`, `GFX_LEFT`, `GFX_RIGHT`, `GFX_TOWER`. The body paint (`BODY_PAINT`) follows the colour picker.

## Open items
| ID | Item |
| --- | --- |
| M1 | Depth 1.30 m from the views vs 1.40 m in the spec. A plan view or one tape measurement would settle it. |
| M2 | The views disagree on the hammer base prints: "3in1" and the comet appear on the front in the front view and on the side in the 3/4 view. The front view was followed, and a comet was added on the right side. |
| M3 | The smash panel text differs between views ("SMASH THE SCORE" / "KICK TO THE SCORE"). "SMASH THE SCORE" was used: it appears in the front close-up and the front view. |
| M4 | The tower print below the hammer head is hidden in every view. It was filled by inpainting, and the hammer covers it on the model. |
| M5 | No print files: the prints come from the views, sharp to about 1.4 px/mm. Original artwork files would make them crisp. |
