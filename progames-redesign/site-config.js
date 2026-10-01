window.PG_SITE={origin:'https://www.progamespoland.com',languages:['en','es']};
window.PG_ROUTES={home:lang=>lang==='es'?'/es.html':'/',product:(lang,slug)=>`/${lang==='es'?'es/productos':'en/products'}/${encodeURIComponent(slug)}.html`,collection:lang=>lang==='es'?'/boxer-standard-es.html':'/boxer-standard.html',catalog:lang=>lang==='es'?'/catalog-es.html':'/catalog.html'};
