const{parseHTML}=require('linkedom'),fs=require('fs'),vm=require('vm'),assert=require('assert');
const checks=[];
for(const language of ['en','es','pl','de','fr']){
 for(const date of ['2026-10-01T12:00:00Z','2026-11-17T12:00:00Z','2026-11-20T22:59:00Z','2026-11-20T23:01:00Z','2027-01-01T12:00:00Z']){
  const {window}=parseHTML(fs.readFileSync(['pl','de','fr'].includes(language)?language+'/index.html':language==='es'?'es.html':'index.html','utf8'));const document=window.document;window.PG_T=undefined;window.PG_LOCALIZE=undefined;let interval;
  class Clock extends Date{constructor(...args){super(...(args.length?args:[date]))}}
  const ctx={window,document,Intl,Date:Clock,setInterval:f=>{interval=f}}; vm.createContext(ctx);if(['pl','de','fr'].includes(language))vm.runInContext(fs.readFileSync('i18n/'+language+'.js','utf8'),ctx);vm.runInContext(fs.readFileSync('trade-map.js','utf8'),ctx);
  const map=document.querySelector('#tradeMap');assert.equal(map.hidden,false);
  const pins=[...document.querySelectorAll('.trade-map-pin')];assert.equal(pins.length,4);
  assert.equal(document.querySelectorAll('.trade-map-tabs button').length,4);
  const orlando=document.querySelector('.trade-map-pin[data-event="orlando"]');const london=document.querySelector('.trade-map-pin[data-event="london"]');
  const expected=date.startsWith('2026-10')?'upcoming':date==='2026-11-17T12:00:00Z'||date==='2026-11-20T22:59:00Z'?'live':'past';
  assert.equal(orlando.dataset.state,expected);assert.equal(london.dataset.state,'past');
  assert(Math.abs(parseFloat(orlando.style.left)-28.27)<.1);assert(Math.abs(parseFloat(orlando.style.top)-39.97)<.1);
  for(const pin of pins){assert.equal(pin.getAttribute('aria-controls'),'tradeMapDetail');assert(parseFloat(pin.style.left)>0&&parseFloat(pin.style.left)<100);assert(parseFloat(pin.style.top)>0&&parseFloat(pin.style.top)<100)}
  london.click();assert.equal(london.getAttribute('aria-pressed'),'true');assert.equal(orlando.getAttribute('aria-pressed'),'false');assert(document.querySelector('#tradeMapDetail').textContent.includes('S2201'));assert(document.querySelector('#tradeMapDetail').textContent.includes('IAAPA EXPO EUROPE 2026'));
  document.querySelector('.trade-map-tabs button[data-event="orlando"]').click();assert.equal(orlando.getAttribute('aria-pressed'),'true');assert(document.querySelector('#tradeMapDetail').textContent.includes('17–20')||document.querySelector('#tradeMapDetail').textContent.includes('17.–20.'));
  const link=document.querySelector('.trade-map-detail a');assert(document.querySelector(link.getAttribute('href')));
  assert.equal(document.querySelectorAll('.trade-show-card.map-selected').length,1);interval();
  checks.push({language,date,status:'PASS'});
 }
}
fs.writeFileSync('verification/trade-map-test-results.json',JSON.stringify({environment:'DOM simulation; browser layout not tested',checks},null,2));console.log('PASS trade map: EN/ES/PL/DE/FR, locations, selection, content sync, Warsaw date boundaries, upcoming/live/past');
