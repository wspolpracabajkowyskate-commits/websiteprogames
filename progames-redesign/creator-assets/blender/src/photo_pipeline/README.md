# Boxer Champion – photo pipeline

Geometry dimensions and all four graphics zones of the Boxer Champion are measured from the
reference photos of the real machine (iPhone 15 Pro, HEIC → `heic2jpg.py`).

1. `ba.py` – joint bundle adjustment: 4 cameras (IMG_0507, 0508, 0516, 0571), key model dimensions and
   ~1000 SIFT-matched points on the flat front panel → `../calib/ba_*.json` + `ba_model.json`.
2. `front3.py` + `comp.py` + `finalize_front.py` – projective bake of the front panel from the 3 front-facing
   photos, blended by texel resolution → `champion_zone_front.webp`, coin/rules/START atlas.
3. `band.py` + `band_comp2.py` – bake of the canopy band (curved drum) from 4 photos, seams placed in letter gaps.
4. `sides.py` – side panels.

`bake.py` projects every texel of a 3D surface into each calibrated photo and keeps the sharpest view.
Paths at the top of each script point to the working folders used when the model was built.
