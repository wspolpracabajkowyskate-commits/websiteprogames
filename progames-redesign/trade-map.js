(()=>{
  const map=document.querySelector('#tradeMap');
  if(!map) return;
  const isES=document.documentElement.lang==='es';
  const isPL=false;
  const labels=isPL?{upcoming:'NADCHODZĄCE TARGI',past:'MINIONE TARGI',live:'TRWAJĄ TERAZ',view:'Zobacz wydarzenie na liście ↑',booth:'Stoisko'}:isES?{upcoming:'PRÓXIMA FERIA',past:'FERIA ANTERIOR',live:'EN CURSO',view:'Ver evento en la lista ↑',booth:'Stand'}:{upcoming:'UPCOMING SHOW',past:'PAST SHOW',live:'HAPPENING NOW',view:'View event in the list ↑',booth:'Booth'};
  if(window.PG_T)for(const key of Object.keys(labels))labels[key]=window.PG_T(labels[key]);
  // Read titles, dates, venue and booth from the existing list, keeping both views in sync.
  const events=[...document.querySelectorAll('.trade-show-card[data-event]')].map(card=>({
    card,id:card.dataset.event,city:window.PG_T?.(card.dataset.city)||card.dataset.city,lat:Number(card.dataset.lat),lon:Number(card.dataset.lon),
    start:card.dataset.start,end:card.dataset.end,name:card.querySelector('h3').textContent,
    date:[...card.querySelectorAll('.trade-date strong,.trade-date span')].map(el=>el.textContent).join(' '),
    venue:card.querySelector('.trade-main p').textContent,booth:card.querySelector('.trade-booth strong')?.textContent
  })).filter(e=>Number.isFinite(e.lat)&&Number.isFinite(e.lon));
  if(!events.length) return;
  const pins=map.querySelector('.trade-map-pins');
  const tabs=map.querySelector('.trade-map-tabs');
  const detail=map.querySelector('.trade-map-detail');
  pins.replaceChildren();tabs.replaceChildren();
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const stateOf=(event,date)=>date>event.end?'past':date<event.start?'upcoming':'live';
  const escape=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const pinIcon='<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 30S2 18 2 12a10 10 0 0 1 20 0c0 6-10 18-10 18Z"/><circle cx="12" cy="12" r="3.5"/></svg>';
  let selected=null;
  function updateDetail(event){
    detail.dataset.state=event.state;
    detail.innerHTML=`<div class="trade-map-detail-copy"><p class="trade-map-status">${labels[event.state]}</p><h4>${escape(event.name)}</h4><p class="trade-map-venue">${escape(event.venue)}</p></div><div class="trade-map-detail-meta"><strong>${escape(event.date)}</strong>${event.booth?`<span>${labels.booth} <b>${escape(event.booth)}</b></span>`:''}<a href="#${event.card.id}">${labels.view}</a></div>`;
  }
  function select(id){
    const event=events.find(e=>e.id===id);if(!event) return;
    selected=id;
    events.forEach(e=>{
      const active=e.id===id;
      e.pin.setAttribute('aria-pressed',String(active));e.tab.setAttribute('aria-pressed',String(active));
      e.card.classList.toggle('map-selected',active);
    });
    updateDetail(event);
  }
  events.forEach(event=>{
    const button=document.createElement('button');button.type='button';button.className='trade-map-pin';button.dataset.event=event.id;
    // Same projection and padding as world-outline.svg (1000 × 460).
    button.style.left=`${(20+(event.lon+180)/360*960)/10}%`;
    button.style.top=`${(20+(85-event.lat)/145*420)/460*100}%`;
    button.setAttribute('aria-controls','tradeMapDetail');
    button.innerHTML=`<span class="trade-pin-halo" aria-hidden="true"></span>${pinIcon}<span class="trade-pin-label">${escape(event.city)}</span>`;
    button.addEventListener('click',()=>select(event.id));pins.append(button);event.pin=button;
    const tab=document.createElement('button');tab.type='button';tab.dataset.event=event.id;tab.setAttribute('aria-controls','tradeMapDetail');
    tab.innerHTML=`<i aria-hidden="true"></i>${escape(event.city)}`;tab.addEventListener('click',()=>select(event.id));tabs.append(tab);event.tab=tab;
  });
  function refresh(){
    const date=today();
    events.forEach(event=>{
      event.state=stateOf(event,date);
      event.pin.dataset.state=event.state;event.tab.dataset.state=event.state;
      event.pin.setAttribute('aria-label',`${event.city} — ${event.name}, ${event.date}. ${labels[event.state]}`);
      event.pin.title=`${event.city} · ${event.date}`;
      event.card.querySelector('.trade-status').textContent=labels[event.state];
      event.card.classList.toggle('next',event.state!=='past');
    });
    if(selected) updateDetail(events.find(e=>e.id===selected));
  }
  refresh();
  const first=[...events].filter(e=>e.state!=='past').sort((a,b)=>a.start.localeCompare(b.start))[0]||[...events].sort((a,b)=>b.end.localeCompare(a.end))[0];
  select(first.id);map.hidden=false;
  // Update after crossing a date boundary without requiring a new deployment.
  setInterval(refresh,60000);
})();
