/* Editorial dictionaries for the eight additional locales; no external translation service. */
(()=>{
 const dict=window.PG_DICTIONARY||{};
 const normalize=s=>String(s).replace(/\s+/g,' ').trim();
 const lower=new Map(Object.keys(dict).map(k=>[k.toLowerCase(),k]));
 function t(value){
  if(value==null)return value;
  const raw=String(value),s=normalize(raw);if(window.PG_BRANDS?.includes(s))return raw;let result=dict[s];
  if(result===undefined&&lower.has(s.toLowerCase()))result=dict[lower.get(s.toLowerCase())];
  if(result===undefined){let m;
   if((m=s.match(/^(\d+) (models shown|products \/ collections|machine shown|machines shown)$/)))result=t(m[2]==='models shown'?'Models shown':'Products / collections')+': '+m[1];
   else if((m=s.match(/^(Show |View )(.+)$/)))result=t(m[1].trim())+' '+t(m[2]);
   else if((m=s.match(/^Artwork (\d+)(.*)$/)))result=t('Artwork')+' '+m[1]+(m[2]?' · '+t(m[2].replace(/^\s*·\s*/,'')):'');
   else if((m=s.match(/^(.+) is listed in the PRO GAMES catalogue\. Contact sales to confirm the current specification and available configuration\.$/)))result=m[1]+': '+t('Contact PRO GAMES for the product description, technical specifications and available equipment for this model.');
   else if((m=s.match(/^(.+) – (.+) (by|available from) PRO GAMES\. Explore photos, specifications and configuration options\. Request a quote\.$/)))result=m[1]+' — '+t('Professional amusement machines made in Poland.')+' '+t('Request a quote');
   else if(s.includes(' — '))result=s.split(' — ').map(t).join(' — ');
   else if(s.includes(' | '))result=s.split(' | ').map(t).join(' | ');
   else if(s.includes(' · '))result=s.split(' · ').map(t).join(' · ');
   else if(s.startsWith('← '))result='← '+t(s.slice(2));
   else return raw;
  }
  return raw.replace(raw.trim(),result);
 }
 window.PG_T=t;
 window.PG_LOCALIZE=(root=document)=>{
  function walk(n){
   if(!n)return;
   if(n.nodeType===3){n.textContent=t(n.textContent);return;}
   if(['SCRIPT','STYLE','SVG'].includes(n.nodeName)||n.hasAttribute?.('data-no-translate'))return;
   n.normalize?.();
   for(const c of [...n.childNodes])walk(c);
   if(n.getAttribute)for(const a of ['aria-label','placeholder','title','alt']){const v=n.getAttribute(a);if(v)n.setAttribute(a,t(v));}
  }
  walk(root);
 };
})();
