# Pro Games Poland — Boxer Standard collection v6

Static website, English and Spanish, ready for a static HTTP host such as Vercel.

- 28 homepage cards: 27 individual products and one Boxer Standard collection.
- The Boxer Standard collection contains the 15 models from the supplied screenshots, in the same order, on `boxer-standard.html` and `boxer-standard-es.html`.
- 42 individual products remain available with all 222 verified colour/artwork/model variants.
- Homepage search includes collection member names. Each Standard product links back to its family page.
- All product photos are included in `assets/products/` as WebP files.
- Each variant has a stable ID, a colour/artwork label, its own local image, the original image URL and the source filename.
- `variant-audit.json` records the mapping and product source pages.
- Product selection is preserved in the URL, language switch and quote link.
- A failed image request preserves the previous photo and label. Stale responses from earlier clicks cannot overwrite the last selection.
- The contact form prepares an email in the visitor's mail application. There is no backend email delivery or CRM integration.

## Run locally

From this directory: `python3 -m http.server 8000`, then open `http://localhost:8000`.
Use an HTTP server; root-relative URLs require the project at the host root. Opening HTML with `file://` is not supported.

## Checks and remaining limitations

See `RAPORT_KONTROLI.md`. Logic was tested on all 84 English/Spanish product pages with a DOM simulator. A real-browser desktop/mobile visual regression could not be run in the execution environment. Do not treat that check as passed. Product variant images themselves were inspected visually and all 222 local images were decoded successfully.

The website has not been deployed to the public domain. Source photographs document the published options; they do not establish stock levels.
