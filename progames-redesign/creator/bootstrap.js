const start=document.querySelector('#startCreating');
let loading=false;
start.addEventListener('click',async()=>{
  if(loading)return; loading=true; start.disabled=true; start.textContent='LOADING CREATOR…';
  document.querySelector('#hero').classList.add('is-hidden');
  document.querySelector('#creator').classList.remove('is-hidden');
  window.scrollTo(0,0);
  try{const mod=await import('./app.js');await mod.startCreator();}
  catch(err){console.error(err);const loader=document.querySelector('#loader');loader.querySelector('strong').textContent='MODEL LOAD ERROR';loader.querySelector('span').textContent='Check network access for the Three.js CDN and verify creator assets.';document.querySelector('#modelStatus').textContent='Load error';}
});
