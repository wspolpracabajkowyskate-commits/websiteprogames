# Additional locales

Greek (el), Italian (it), Arabic (ar), Romanian (ro), Czech (cs), Hungarian (hu), Russian (ru), Bulgarian (bg).

`npm run build:languages` generates 49 core pages per language (home, Standard collection, catalog viewer and 46 products), runtime dictionaries, reciprocal language links, canonical/social metadata and sitemap entries. Vercel invokes this command. Generated directories are not committed; English pages and the five established locales remain the source of the existing design and product structure.

TSV columns are **source, el, it, ar, ro, cs, hu, ru, bg**. Numerical source keys resolve through `product-sources.json`. Editorial equivalents for repeated technical phrases are declared in the generator. All product descriptions, features and equipment entries must have explicit translations; `npm run test:i18n` enforces this. No remote translator or external translation script runs in the visitor's browser. Proper model names, technical values, original images and PDF publications remain unchanged.

`runtime.js` handles dynamic controls, colour names, counters and configuration summaries. `layout.css` applies only to the eight added locales, including RTL Arabic. Shared changes are restricted to routing, the longer language picker, and localized contact messages.

The supplementary English/Polish editorial articles and the separate English Creator application retain their current languages. Links to English-only articles are explicitly labelled English in the added locales. PDF content remains the publisher's original; its viewer controls are localized.

Validation:

```
npm ci
npm run test:seo
npm run test:i18n
npm run test:languages
```

Browser tests use Playwright and intercepted local resources, with mocked contact API responses. They never send email. They cover 320, 390 and 1440 px, all eight locales, product colour changes, query preservation, language selection, PDF viewer switching, localized success messages and document overflow.
