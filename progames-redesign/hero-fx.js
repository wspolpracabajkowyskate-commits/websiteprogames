/* PRO-GAMES hero: punch impact -> slow motion. Canvas layer over the hero photo. */
(function(){
  'use strict';
  var hero=document.querySelector('.hero.hero-cinematic');
  var img=hero&&hero.querySelector('.hero-cinematic-bg');
  if(!hero||!img||!window.requestAnimationFrame) return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Contact point glove/bag and image size, in source-image pixels.
  var IMG_W=1983, IMG_H=793, HIT_X=1030, HIT_Y=392;
  var LOOP=12, FIRST=0.9;            // seconds between impacts / delay before the first
  var WIND=0.42;                     // anticipation before the hit
  var SLOW=0.05, SLOW_HOLD=3.4;      // slow-motion time scale and how long it holds
  var BASE_SCALE=1.035;

  var canvas=document.createElement('canvas');
  canvas.className='hero-fx-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:-3;pointer-events:none;mix-blend-mode:screen;will-change:transform';
  img.insertAdjacentElement('afterend',canvas);
  img.style.willChange='transform,filter';
  img.style.transition='filter .35s ease';
  var ctx=canvas.getContext('2d');
  if(!ctx) return;

  var W=0,H=0,dpr=1,hit={x:0,y:0},unit=1,small=false;
  function parsePos(v,free){
    if(v==null) return .5;
    if(v.indexOf('%')>-1) return parseFloat(v)/100;
    if(v==='left'||v==='top') return 0;
    if(v==='right'||v==='bottom') return 1;
    if(v==='center') return .5;
    var px=parseFloat(v); return free?Math.max(0,Math.min(1,px/free)):.5;
  }
  function resize(){
    var r=hero.getBoundingClientRect();
    W=Math.max(1,Math.round(r.width)); H=Math.max(1,Math.round(r.height));
    small=W<700;
    dpr=Math.min(window.devicePixelRatio||1,small?1.25:1.5);
    canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
    var s=Math.max(W/IMG_W,H/IMG_H), dw=IMG_W*s, dh=IMG_H*s;
    var op=(getComputedStyle(img).objectPosition||'50% 50%').split(' ');
    var ox=(W-dw)*parsePos(op[0],W-dw), oy=(H-dh)*parsePos(op[1]||'50%',H-dh);
    hit.x=ox+HIT_X*s; hit.y=oy+HIT_Y*s;
    unit=Math.max(.55,Math.min(1.5,dh/793));
    var o=(hit.x/W*100).toFixed(2)+'% '+(hit.y/H*100).toFixed(2)+'%';
    img.style.transformOrigin=o; canvas.style.transformOrigin=o;
  }

  // Pre-rendered soft sprites.
  function sprite(size,stops){
    var c=document.createElement('canvas'); c.width=c.height=size;
    var g=c.getContext('2d'), gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    for(var i=0;i<stops.length;i++) gr.addColorStop(stops[i][0],stops[i][1]);
    g.fillStyle=gr; g.fillRect(0,0,size,size); return c;
  }
  var glowWarm=sprite(64,[[0,'rgba(255,240,210,1)'],[.25,'rgba(255,150,60,.55)'],[1,'rgba(255,40,20,0)']]);
  var glowCool=sprite(64,[[0,'rgba(235,245,255,1)'],[.3,'rgba(150,190,255,.45)'],[1,'rgba(80,120,255,0)']]);
  var flashSp=sprite(256,[[0,'rgba(255,255,255,1)'],[.18,'rgba(255,225,190,.85)'],[.45,'rgba(255,70,40,.35)'],[1,'rgba(255,20,20,0)']]);
  var smokeSp=sprite(256,[[0,'rgba(190,200,220,.5)'],[.5,'rgba(150,160,190,.18)'],[1,'rgba(120,130,160,0)']]);

  var rnd=function(a,b){return a+Math.random()*(b-a)};
  var parts=[], smoke=[], embers=[];
  function burst(){
    var n=small?100:210, i, a, sp, cool;
    for(i=0;i<n;i++){
      // Punch travels right -> left: most debris sprays left in a cone, the rest goes radial.
      a=Math.random()<.68?Math.PI+rnd(-.95,.95):rnd(0,Math.PI*2);
      sp=Math.pow(Math.random(),1.7)*2300+260;
      cool=Math.random()<.34;
      parts.push({x:hit.x+rnd(-8,8)*unit,y:hit.y+rnd(-14,14)*unit,vx:Math.cos(a)*sp*unit,vy:Math.sin(a)*sp*unit-rnd(0,160)*unit,
        life:0,max:rnd(.55,1.25),size:rnd(1.1,3.3)*unit,cool:cool,drag:rnd(1.6,3.2),tw:rnd(0,6.28)});
    }
  }
  function initAmbient(){
    smoke.length=0; embers.length=0;
    var i;
    for(i=0;i<(small?4:7);i++) smoke.push({x:rnd(0,1),y:rnd(.62,1.02),r:rnd(.22,.42),v:rnd(.006,.016)*(Math.random()<.5?-1:1),a:rnd(.10,.2),p:rnd(0,6.28)});
    for(i=0;i<(small?8:16);i++) embers.push({x:rnd(.25,1),y:rnd(0,1),v:rnd(.012,.04),s:rnd(.6,1.6),p:rnd(0,6.28),cool:Math.random()<.3});
  }

  var clock=-FIRST;   // real seconds relative to current impact cycle (wind-up starts at 0)
  var sim=0;          // slowed "world" seconds since impact
  var fired=false, last=0, running=false, visible=true, filt='';
  var ease=function(t){return t<0?0:t>1?1:t*t*(3-2*t)};

  function timeScale(ti){ // ti = real seconds since impact
    if(ti<0) return 1;
    if(ti<.07) return 1;
    if(ti<.24) return 1+(SLOW-1)*ease((ti-.07)/.17);
    if(ti<.24+SLOW_HOLD) return SLOW;
    if(ti<.24+SLOW_HOLD+.7) return SLOW+(1-SLOW)*ease((ti-.24-SLOW_HOLD)/.7);
    return 1;
  }
  function setFilter(f){ if(f!==filt){filt=f; img.style.filter=f;} }

  function frame(now){
    if(!running) return;
    var dt=Math.min(.05,(now-last)/1000||0); last=now;
    clock+=dt;
    if(clock>=LOOP){clock=0; fired=false;}
    var ti=clock-WIND, ts=timeScale(ti), sdt=dt*ts, t=now/1000, i, p;
    if(ti>=0&&!fired){fired=true; sim=0; burst();}
    if(fired) sim+=sdt;

    // Camera: anticipation pull-back, hit punch-in, slow push during slow motion, settle.
    var scale=BASE_SCALE, sx=0, sy=0;
    if(clock>=0&&ti<0){ scale=BASE_SCALE-.022*Math.sin(Math.PI*.5*ease(clock/WIND)); setFilter('brightness(.9)'); }
    else if(ti>=0){
      var end=.24+SLOW_HOLD;
      if(ti<end+.7){
        var kick=.05*(1-Math.exp(-ti*40));
        scale=BASE_SCALE+kick+.03*ease(ti/end);
        if(ti>end) scale=BASE_SCALE+(scale-BASE_SCALE)*(1-ease((ti-end)/.7))+0;
        setFilter(ti<end?'contrast(1.1) saturate(1.18) brightness(1.04)':'');
      } else setFilter('');
      if(ti<end+2.2&&ti>=end+.7){ scale=BASE_SCALE; }
      var sh=Math.exp(-ti*9)*(small?7:13)*unit;
      if(sh>.15){ sx=Math.sin(ti*95)*sh; sy=Math.cos(ti*81)*sh*.7; }
    } else setFilter('');
    var tf='translate3d('+sx.toFixed(2)+'px,'+sy.toFixed(2)+'px,0) scale('+scale.toFixed(4)+')';
    img.style.transform=tf; canvas.style.transform=tf;

    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation='source-over';
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';

    // Stage lights breathing (ambient, slowed with the world).
    var lt=t*(.35+.65*ts);
    var la=.10+.07*Math.sin(lt*1.7), lb=.09+.06*Math.sin(lt*1.3+2);
    ctx.globalAlpha=la; ctx.drawImage(flashSp,W*.74-W*.3,-H*.45,W*.6,H*.9);
    ctx.globalAlpha=lb; ctx.drawImage(glowCool,-W*.2,-H*.4,W*.55,H*.9);

    // Smoke drifting along the floor.
    for(i=0;i<smoke.length;i++){
      p=smoke[i]; p.x+=p.v*sdt*4+p.v*dt*.25; if(p.x>1.3)p.x=-.3; if(p.x<-.3)p.x=1.3;
      var r=p.r*W*(small?1.5:1);
      ctx.globalAlpha=p.a*(.75+.25*Math.sin(t*.4+p.p));
      ctx.drawImage(smokeSp,p.x*W-r,p.y*H-r*.6,r*2,r*1.2);
    }
    // Floating embers.
    for(i=0;i<embers.length;i++){
      p=embers[i]; p.y-=p.v*(sdt*3+dt*.15); if(p.y<-.05){p.y=1.05;p.x=rnd(.25,1);}
      var ex=(p.x+Math.sin(t*.5+p.p)*.012)*W, es=p.s*unit*7;
      ctx.globalAlpha=.35+.3*Math.sin(t*2.2+p.p);
      ctx.drawImage(p.cool?glowCool:glowWarm,ex-es,p.y*H-es,es*2,es*2);
    }

    if(fired){
      // Flash: hard pop in real time, then a lingering glow that lives in slow motion.
      var pop=Math.exp(-ti*13), linger=.38*Math.exp(-sim*5);
      var fa=Math.min(1,pop+linger);
      if(fa>.01){
        var fr=(170+520*(1-Math.exp(-ti*20))+sim*500)*unit;
        ctx.globalAlpha=fa; ctx.drawImage(flashSp,hit.x-fr,hit.y-fr,fr*2,fr*2);
        if(pop>.25){ ctx.globalAlpha=(pop-.25)*.5; ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); }
      }
      // Shockwave rings expand in world time, so they crawl during slow motion.
      for(i=0;i<2;i++){
        var rs=sim-i*.035; if(rs<=0) continue;
        var rr=(30+1500*Math.pow(rs,.62))*unit, ra=Math.max(0,.3-rs*.7)*(i?.5:1);
        if(ra<=.005) continue;
        ctx.globalAlpha=ra; ctx.lineWidth=Math.max(1.5,(12-rs*20))*unit; ctx.strokeStyle=i?'#9cc4ff':'#ffd9b0';
        ctx.beginPath(); ctx.ellipse(hit.x,hit.y,rr,rr*.86,0,0,6.2832); ctx.stroke();
      }
      // Sparks and droplets.
      ctx.lineCap='round';
      for(i=parts.length-1;i>=0;i--){
        p=parts[i]; p.life+=sdt;
        if(p.life>p.max||p.x<-60||p.x>W+60||p.y>H+60){parts.splice(i,1);continue;}
        var d=Math.exp(-p.drag*sdt); p.vx*=d; p.vy=p.vy*d+520*unit*sdt;
        p.x+=p.vx*sdt; p.y+=p.vy*sdt;
        var k=1-p.life/p.max, al=Math.min(1,k*1.6)*(.72+.28*Math.sin(t*9+p.tw));
        var trail=.012+.03*ts, tx=p.x-p.vx*trail, ty=p.y-p.vy*trail;
        ctx.globalAlpha=al; ctx.strokeStyle=p.cool?'#dbe9ff':(k>.6?'#fff1d6':'#ff8a3c');
        ctx.lineWidth=p.size; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(p.x,p.y); ctx.stroke();
        var gs=p.size*(3.2+2.2*(1-ts));
        ctx.globalAlpha=al*.8; ctx.drawImage(p.cool?glowCool:glowWarm,p.x-gs,p.y-gs,gs*2,gs*2);
      }
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(frame);
  }

  function start(){ if(running||!visible||document.hidden) return; running=true; last=performance.now(); requestAnimationFrame(frame); }
  function stop(){ running=false; }
  function boot(){
    resize(); initAmbient();
    var rt; window.addEventListener('resize',function(){clearTimeout(rt); rt=setTimeout(resize,120);},{passive:true});
    if('IntersectionObserver' in window) new IntersectionObserver(function(e){visible=e[0].isIntersecting; visible?start():stop();},{threshold:.05}).observe(hero);
    document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
    start();
  }
  if(img.complete&&img.naturalWidth) boot(); else img.addEventListener('load',boot,{once:true});
})();
