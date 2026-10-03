window.PG_SITE={origin:'https://www.progamespoland.com',languages:['en','es']};
window.PG_ROUTES={home:lang=>lang==='es'?'/es.html':'/',product:(lang,slug)=>`/${lang==='es'?'es/productos':'en/products'}/${encodeURIComponent(slug)}.html`,collection:lang=>lang==='es'?'/boxer-standard-es.html':'/boxer-standard.html',catalog:lang=>lang==='es'?'/catalog-es.html':'/catalog.html'};

// Shared catalogue of enquiry options. Selection requests a quote; availability is confirmed by sales.
window.PG_QUOTE_OPTIONS=[
 {id:'banknotes',group:'payment',en:'Additional bank-note acceptor',es:'Aceptador adicional de billetes',icon:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M6 9h12M6 15h3m6 0h3"/><circle cx="12" cy="12" r="2"/>'},
 {id:'coins',group:'payment',en:'Additional coin slot',es:'Ranura adicional para monedas',icon:'<rect x="13" y="3" width="8" height="18" rx="3"/><path d="M17 7v5"/><circle cx="7" cy="14" r="5"/><path d="M7 12v4"/>'},
 {id:'capsules',group:'payment',en:'Capsule dispenser',es:'Dispensador de cápsulas',icon:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 14h16M9 18h6"/><circle cx="12" cy="8" r="3"/><path d="M9 8h6"/>'},
 {id:'tickets',group:'payment',en:'Ticket Dispenser',es:'Dispensador de tickets',icon:'<rect x="3" y="3" width="18" height="10" rx="3"/><path d="M7 8h10v13l-2-1-3 1-3-1-2 1V8Zm3 4h4m-4 4h4"/>'},
 {id:'stickers',group:'extras',en:'Custom stickers',es:'Adhesivos personalizados',icon:'<path d="M14 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h8l7-7V6a3 3 0 0 0-3-3h-4ZM14 21v-4a3 3 0 0 1 3-3h4M7 8h7M7 12h3"/>'},
 {id:'wifi',group:'extras',en:'Internet Wi-Fi Boxnet',es:'Internet Wi-Fi Boxnet',icon:'<rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 18h.01M11 18h.01M12 14V9M7 6a8 8 0 0 1 10 0M4 3a12 12 0 0 1 16 0"/>'},

];
window.PG_QUOTE_SELECTION=search=>{const ids=new Set((search.get('options')||'').split(','));return window.PG_QUOTE_OPTIONS.filter(o=>ids.has(o.id));};
window.PG_INQUIRY_URL=data=>'mailto:office@progames.pl?subject='+encodeURIComponent('Pro Games inquiry — '+(data.get('product')||'General'))+'&body='+encodeURIComponent([...data].map(([name,value])=>`${name}: ${value}`).join('\r\n'));
