# PRO GAMES CREATOR — reference analysis

Model: **Double Strike 2**.

Product specification taken from the supplied website product data: **219 cm height × 142 cm width × 122 cm length, 170 kg**.

Reference mapping:

- `01-front.png` — main front orthographic-like view; overall proportions, lower kicker bay, top canopy, LED layout.
- `02-left-side.png` — side depth, lower shell profile, left vertical Boxer/Kicker poster, Kicker side logo.
- `03-right-side.png` — opposite side profile and mirrored poster/logo placement.
- `04-rear.png` — rear service doors, vents, rear logo, black vertical rails.
- `05-front-three-quarter.png` — primary 3/4 proportions and depth relationship between base, tower and canopy.
- `06-front-elevated.png` — canopy width, front overhang, score panel and lower housing relationship.
- `07-top-detail.png` — punching bag shape, canopy underside, spotlights and top banner.
- `08-score-detail.png` — score/control shield, coin acceptor, game rules, Kicker Smart logo and side poster detail.
- `09-lower-detail.png` — kicker ball/arm, lower recess, LED border, side shell and base/platform detail.

Implementation choices:

- Geometry is intentionally web optimized rather than CAD-grade.
- Major controllable pieces are separate named nodes.
- The six colors in the supplied site data are applied through one dynamic body material state; no duplicate model per color.
- Branding uses three transparent canvas-textured surfaces: front, left and right.
- Coin acceptor is based on the reference. Bill acceptor / card reader / ticket dispenser / capsule dispenser are separate optional prototype modules; the first three correspond to options named in the supplied product data, while the capsule mount is retained because it is explicitly requested by the creator brief but is not visible in the reference photography.
