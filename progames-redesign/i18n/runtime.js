/* Exact, editorial translations. EN/ES remain owned by their original templates. */
(()=>{
 const lang=document.documentElement.lang;
 const dict=window.PG_DICTIONARY||{};
 const normalize=s=>String(s).replace(/\s+/g,' ').trim();
 const active=['pl','de','fr'].includes(lang);
 const terms={pl:{show:'Pokaż ',view:'Zobacz ',art:'Wzór ',models:'widocznych modeli',products:'produktów / kolekcji'},de:{show:'Anzeigen: ',view:'Ansehen: ',art:'Design ',models:'Modelle angezeigt',products:'Produkte / Kollektionen'},fr:{show:'Afficher : ',view:'Voir : ',art:'Décor ',models:'modèles affichés',products:'produits / collections'}}[lang];
 function t(value){
  if(!active||value==null)return value;
  const raw=String(value),s=normalize(raw);let result=dict[s];
  if(result===undefined){
   if(s.includes('\n'))return s.split('\n').map(t).join('\n');
   let m;
   if((m=s.match(/^(\d+) (models shown|products \/ collections)$/)))result=m[1]+' '+(m[2]==='models shown'?terms.models:terms.products);
   else if((m=s.match(/^(Show |View )(.+)$/)))result=(m[1]==='Show '?terms.show:terms.view)+t(m[2]);
   else if((m=s.match(/^Artwork (\d+)(.*)$/)))result=terms.art+m[1]+(m[2]?m[2].replace(/[A-Za-z].*$/,x=>t(x)):'');
   else if(s.endsWith(' by Pro Games'))result=t(s.slice(0,-13))+' — Pro Games';
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
  if(!active)return;
  function walk(n){
   if(!n)return;
   if(n.nodeType===3){n.textContent=t(n.textContent);return;}
   if(['SCRIPT','STYLE','SVG'].includes(n.nodeName)||n.hasAttribute?.('data-no-translate'))return;
   // Merge adjacent text nodes (notably HTML entities) before phrase lookup.
   for(let c=n.firstChild;c;c=c.nextSibling){if(c.nodeType===3)while(c.nextSibling?.nodeType===3){c.textContent+=c.nextSibling.textContent;c.nextSibling.remove();}}
   for(const c of [...n.childNodes])walk(c);
   if(n.getAttribute)for(const a of ['aria-label','placeholder','title','alt']){const v=n.getAttribute(a);if(v)n.setAttribute(a,t(v));}
  }
  walk(root);
 };
})();
