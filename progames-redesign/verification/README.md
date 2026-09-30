# Verification

Run from the site root. Install Node.js, then:

```sh
npm install --no-save linkedom playwright
node verification/test-dom.cjs
npx playwright install chromium
python3 -m http.server 8000
```

With the server running, in another terminal run:

```sh
node verification/test-browser.cjs
```

DOM tests passed in the delivered environment. Browser tests are provided but were not completed because the available browser runtime could not start and the cloud browser could not access localhost. Do not treat browser layout/mobile checks as passed. The test server must run on port 8000. Browser tests block Google Fonts to make checks independent of external networking.
