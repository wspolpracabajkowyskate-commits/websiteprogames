# Pro Games Poland — redesign prototype

Static, Vercel-ready marketing and product website for Pro Games Poland.

## Included

- English-first responsive homepage
- 42 product entries based on the current Pro Games Poland public range, including the 15 Boxer Standard artwork models and the distributed product families shown on the current website
- Dedicated product page generated from `products.js`
- Real image-based finish / artwork switching: when a product has multiple source images, the selector swaps the actual photograph rather than applying a CSS colour filter
- Current official Pro Games product catalog PDF and spare-parts PDF links
- Distributor network with supplied partner logos
- Trade-show section including IAAPA Expo Orlando 2026
- Contact and service details from the current Pro Games website
- SEO metadata and Product / Organization structured data

## Main files

- `index.html` — homepage
- `product.html` + `product.js` — product detail template
- `products.js` — product database, descriptions, technical data and image variants
- `styles.css` — responsive visual system
- `script.js` — filters, search, mobile navigation and interactions
- `catalog.html` — optional in-site PDF viewer (no upload feature)

## Deployment

The project can be deployed as a static site on Vercel. Product images currently reference the public media assets used by Pro Games / its official Americas distributor. For production, mirroring approved high-resolution originals into the project CDN is recommended for long-term asset control and Core Web Vitals.
