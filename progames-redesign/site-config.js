window.PG_SITE={origin:'https://www.progamespoland.com',languages:['pl','en','es']};
window.PG_ROUTES={
 home:lang=>lang==='pl'?'/pl/':lang==='es'?'/es.html':'/',
 product:(lang,slug)=>`/${lang}/${lang==='pl'?'produkty':lang==='es'?'productos':'products'}/${encodeURIComponent(slug)}.html`,
 collection:lang=>lang==='pl'?'/pl/boxer-standard.html':lang==='es'?'/boxer-standard-es.html':'/boxer-standard.html',
 catalog:lang=>lang==='pl'?'/pl/katalog.html':lang==='es'?'/catalog-es.html':'/catalog.html'
};
