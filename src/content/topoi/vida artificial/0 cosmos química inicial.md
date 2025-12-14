# _
- vida: nucleosíntesis ligera, química preorgánica, acidez básica para definir $[H^+]$ y gradientes.
- a-life/ai: reglas mínimas y autómatas elementales.
- música: piedra-percusión, gesto-resonancia, voz como excitador primario.


# autómatas celulares (von Neumman, S. Ulam 1948-1952)
- modelar **auto-reproducción** y **complejidad emergente** en sistemas puramente **discretos**, sin hardware biológico.
- Von Neumann diseña un autómata de 29 estados en una cuadrícula que podía copiar su propia “descripción” y construirse a sí mismo.
- Ulam introduce la idea de espacios de celdas con reglas locales, lo que abre el camino a los modelos de autopoiesis y evolución artificial.




```dataviewjs
// === VIDA-A/CA SONIC LAB — 28 COMBOS ===
// 4 macro-sintes (A,B,C,D) × 7 pitches = 28 combinaciones únicas.
// A cubre: white + saw | B: FM sq + tri-sub | C: 10 senos (odd/even/fib/log envelopes)
// D: brown noise biquad + Karplus-Strong.  Todos pasan por EQ + random mod.
//
// ---------- UI ----------
const root=dv.container; Object.assign(root.style,{fontFamily:'ui-monospace,monospace'});
const ui=document.createElement('div'); ui.style.display='flex'; ui.style.gap='8px'; ui.style.flexWrap='wrap'; root.appendChild(ui);
const log=document.createElement('div'); log.style.margin='8px 0'; log.style.color='#ccc'; root.appendChild(log);
function msg(s){log.textContent=s}

// ---------- AudioCtx & helpers ----------
let AC, MASTER;
function ensureAC(){
  if(AC) return; AC=new (window.AudioContext||window.webkitAudioContext)();
  const master=AC.createGain(); master.gain.value=0.5; // master -6dB
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-12; comp.ratio.value=3;
  master.connect(comp).connect(AC.destination); MASTER=master;
}
function stopAt(node,t){ try{node.stop(t)}catch{} }
function noiseBuf(ac,len=1){const b=ac.createBuffer(1,ac.sampleRate*len,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b;}
function white(ac){const s=ac.createBufferSource(); s.buffer=noiseBuf(ac,2); s.loop=true; return s;}
function brown(ac){ // brown/red noise via 1-pole filter on white
  const src=white(ac), biq=ac.createBiquadFilter(); biq.type='lowshelf'; biq.frequency.value=200; biq.gain.value=12;
  src.connect(biq); return {node:src,out:biq};
}
function eq3(ac){ // 3-band EQ
  const low=ac.createBiquadFilter(); low.type='lowshelf'; low.frequency.value=180;
  const mid=ac.createBiquadFilter(); mid.type='peaking'; mid.frequency.value=1200; mid.Q.value=1.0;
  const high=ac.createBiquadFilter(); high.type='highshelf'; high.frequency.value=4500;
  low.connect(mid).connect(high); return {in:low,out:high,low,mid,high};
}
function envGain(ac,a=0.01,d=0.12,s=0.3,r=0.3,peak=0.9){
  const g=ac.createGain(); g.gain.value=0;
  return {node:g, fire:(t)=>{g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(peak, t+a);
    g.gain.linearRampToValueAtTime(peak*s, t+a+d);
    g.gain.exponentialRampToValueAtTime(0.0008, t+a+d+r);
  }};
}
function biqs(ac,cut=1200,q=0.7){const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=cut; lp.Q.value=q; return lp;}
function lfo(ac,rate=0.5,amp=50, param){
  const o=ac.createOscillator(); o.type='sine'; o.frequency.value=rate;
  const g=ac.createGain(); g.gain.value=amp; o.connect(g).connect(param); o.start(); return o;
}
function fmSquare(ac, fCar=220, fMod=90, idx=40){ // carrier square via waveshaper
  const car=ac.createOscillator(); car.type='square'; car.frequency.value=fCar;
  const mod=ac.createOscillator(); mod.type='sine'; mod.frequency.value=fMod;
  const g=ac.createGain(); g.gain.value=idx; mod.connect(g).connect(car.frequency);
  car.start(); mod.start(); return {out:car, mod};
}
function saw(ac,f=220){const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.start(); return o;}
function tri(ac,f=220){const o=ac.createOscillator(); o.type='triangle'; o.frequency.value=f; o.start(); return o;}
function additive10(ac,f=220, mode='odd'){ // 10 partials
  const mix=ac.createGain(); mix.gain.value=1;
  const partials=[];
  for(let k=1;k<=10;k++){
    const allow = (mode==='odd' && k%2===1) || (mode==='even' && k%2===0) || (mode==='fib' && [1,2,3,5,8].includes(k)) || (mode==='log');
    const o=ac.createOscillator(); o.type='sine';
    const g=ac.createGain();
    let amp=allow? 1/k : 0.15/k;
    if(mode==='log'){ amp = Math.log(1+k)/k/1.8; }
    g.gain.value=amp*0.3; o.frequency.value=f*k; o.connect(g).connect(mix); o.start(); partials.push({o,g});
  }
  return {out:mix, partials};
}
function karplus(ac, f=220, decay=0.98, damp=2000){ // simple plucked
  const len=Math.round(ac.sampleRate/f);
  const buf=ac.createBuffer(1,len,ac.sampleRate);
  const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1);
  const src=ac.createBufferSource(); src.buffer=buf; src.loop=true;
  const del=ac.createDelay(); del.delayTime.value=len/ac.sampleRate;
  const fb=ac.createGain(); fb.gain.value=decay;
  const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=damp; lp.Q.value=0.2;
  src.connect(del); del.connect(lp).connect(fb).connect(del); // feedback loop
  return {src, out:lp, loop:del, fb, lp};
}

// ---------- Macro-sintes (A..D) ----------
const PITCHES=[300,400,500,600,700,800,900];
function macroA(tone){ // white + saw (con envolvente y LP)
  const now=AC.currentTime;
  const eq=eq3(AC);
  const env=envGain(AC,0.01,0.12,0.35,0.4,0.8); const lp=biqs(AC, 1000+Math.random()*4000, 0.6+Math.random()*0.6);
  const w=white(AC), o=saw(AC,tone);
  const mix=AC.createGain(); mix.gain.value=0.6+Math.random()*0.3;
  w.connect(mix); o.connect(mix);
  mix.connect(lp).connect(eq.in); env.node.connect(eq.out).connect(MASTER);
  env.fire(now); // VCA
  // sidechain VCA
  const vca=AC.createGain(); vca.gain.value=0; eq.out.disconnect(); eq.out.connect(vca).connect(MASTER);
  env.node.gain.cancelScheduledValues(now); env.node.gain.setValueAtTime(0,now);
  env.node.gain.linearRampToValueAtTime(1.0, now+0.02);
  // subtle LFO on LP
  lfo(AC, 0.2+Math.random()*0.4, 200+Math.random()*500, lp.frequency);
  // stop
  const T=1.2; stopAt(w, now+T); stopAt(o, now+T);
}
function macroB(tone){ // FM sq + tri-sub (tri -> LP with env)
  const now=AC.currentTime;
  const eq=eq3(AC); eq.low.gain.value = (-3 + Math.random()*6); eq.mid.gain.value=( -2 + Math.random()*4); eq.high.gain.value=( -2 + Math.random()*6);
  const fm=fmSquare(AC, tone, tone*0.5, 30+Math.random()*40);
  const triOsc=tri(AC, tone*0.5);
  const lp=biqs(AC, 800+Math.random()*5000, 0.8+Math.random()*0.8);
  const env=envGain(AC,0.005,0.08,0.25,0.35,0.9);
  const mix=AC.createGain(); mix.gain.value=0.5+Math.random()*0.3;
  fm.out.connect(mix); triOsc.connect(mix); mix.connect(lp).connect(eq.in);
  env.node.connect(eq.out).connect(MASTER); env.fire(now);
  const T=1.0; stopAt(fm.out, now+T); stopAt(fm.mod, now+T); stopAt(triOsc, now+T);
}
function macroC(tone){ // additive 10 sines, 4 perfiles de envolvente ciclando
  const modes=['odd','even','fib','log']; const mode=modes[(Math.floor(Math.random()*modes.length))];
  const now=AC.currentTime;
  const ad=additive10(AC, tone, mode);
  const eq=eq3(AC); const env=envGain(AC,0.01,0.18,0.6,0.6,0.7);
  // envolventes distintas por parcial: odd/even/fib/log
  ad.partials.forEach(({o,g},i)=>{ const t0=now, a=0.01+0.003*i, d=0.05+0.01*i, r=0.25+0.02*i;
    g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0,t0);
    g.gain.linearRampToValueAtTime(g.gain.value+0.12, t0+a);
    g.gain.linearRampToValueAtTime(g.gain.value*0.4, t0+a+d);
    g.gain.exponentialRampToValueAtTime(0.0008, t0+a+d+r);
  });
  ad.out.connect(eq.in); env.node.connect(eq.out).connect(MASTER); env.fire(now);
  // gentle vibrato global
  lfo(AC, 5+Math.random()*3, 3+Math.random()*5, ad.out.gain);
  const T=1.4; ad.partials.forEach(({o})=>stopAt(o, now+T));
}
function macroD(tone){ // brown bi-filtered + Karplus-Strong
  const now=AC.currentTime;
  const br=brown(AC); const lp=biqs(AC, 1000+Math.random()*3000, 0.7); const hp=AC.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=50+Math.random()*200;
  const eq=eq3(AC); const env=envGain(AC,0.002,0.05,0.2,0.25,1.0);
  br.out.connect(lp).connect(hp).connect(eq.in); env.node.connect(eq.out).connect(MASTER); env.fire(now);
  const ks=karplus(AC, tone, 0.985+Math.random()*0.01, 1500+Math.random()*2000);
  const gks=AC.createGain(); gks.gain.value=0.5+Math.random()*0.3; ks.src.connect(ks.out).connect(gks).connect(MASTER); ks.src.start();
  const T=1.2; stopAt(br.node, now+T); stopAt(ks.src, now+T);
}

// ---------- Router de 28 combos ----------
const MACROS=[macroA, macroB, macroC, macroD];
const COMBOS=[]; // {name, fn, freq}
for(let m=0;m<MACROS.length;m++){
  for(let p=0;p<PITCHES.length;p++){
    COMBOS.push({name:`${['A','B','C','D'][m]} @ ${PITCHES[p]}Hz`, fn:MACROS[m], freq:PITCHES[p]});
  }
}
// UI botones
const btnPlayAll=document.createElement('button'); btnPlayAll.textContent='Play all (seq)'; btnPlayAll.style.padding='4px 8px';
btnPlayAll.onclick=async()=>{
  ensureAC(); if(AC.state!=='running') await AC.resume();
  let t=0; for(const c of COMBOS){ setTimeout(()=>{msg(c.name); c.fn(c.freq);}, t); t+=260; }
};
ui.appendChild(btnPlayAll);
COMBOS.forEach((c,i)=>{ const b=document.createElement('button'); b.textContent=(i+1)+': '+c.name;
  b.style.padding='4px 6px'; b.onclick=async()=>{ensureAC(); if(AC.state!=='running') await AC.resume(); msg(c.name); c.fn(c.freq); };
  ui.appendChild(b);
});
msg('28 combinaciones listas. Usa “Play all (seq)” o pulsa cualquier combo.');
```



```dataviewjs
/***** VON NEUMANN CA — SONIFICACIÓN + DIRECCIONES + REGLAS 5/6/8/9 + PRESETS + ANCLA 10 PULSOS *****/
// ====== Parámetros ======
const W=36, H=20, CELL=18, MARGIN=40, SPEED=6; // SPEED = ticks/seg (define los "pulsos")
const COLORS=['#1f2937','#22c55e','#f59e0b','#38bdf8','#a78bfa','#f43f5e','#f97316','#06b6d4','#84cc16','#eab308',
  '#14b8a6','#ef4444','#8b5cf6','#10b981','#e879f9','#60a5fa','#fca5a5','#fde047','#34d399','#93c5fd',
  '#ffffff','#94a3b8','#cbd5e1','#e2e8f0','#64748b','#0ea5e9','#4338ca','#16a34a','#e11d48'];
// conductores base (1,3,4,5,8,9,12,13) — 5 conduce solo si su gate está abierto; 6 no conduce nunca
const COND_BASE=new Set([1,3,4,5,8,9,12,13]);

// ====== Layout fijo ======
const root=dv.container;
Object.assign(root.style,{fontFamily:'ui-monospace,monospace',background:'transparent',position:'relative',width:(MARGIN+W*CELL+10)+'px'});

// Header (paleta + controles + presets)
const header=document.createElement('div');
Object.assign(header.style,{display:'grid',gridTemplateColumns:'minmax(260px,1fr) 1fr',gap:'8px',alignItems:'start',marginBottom:'8px'});
root.appendChild(header);

// Paleta
const palWrap=document.createElement('div'); Object.assign(palWrap.style,{display:'flex',flexDirection:'column',gap:'6px'});
const palTitle=document.createElement('div'); palTitle.textContent='Estados (0–28)'; palTitle.style.color='#ccc';
const pal=document.createElement('div'); Object.assign(pal.style,{display:'grid',gridTemplateColumns:'repeat(15,20px)',gap:'2px'});
palWrap.append(palTitle,pal); header.appendChild(palWrap);

// Controles + Presets
const ctrlWrap=document.createElement('div');
Object.assign(ctrlWrap.style,{display:'grid',gridTemplateColumns:'repeat(3,auto)',gap:'8px',alignItems:'center'});
const mkBtn=t=>{const b=document.createElement('button'); b.textContent=t; b.style.padding='4px 8px'; b.style.cursor='pointer'; return b;}
const btnStep=mkBtn('Step'), btnPlay=mkBtn('Play/Stop'), btnClear=mkBtn('Clear');
const btnSeed=mkBtn('Seed'), btnSeedFB=mkBtn('Seed +fallback');
const presetLabel=document.createElement('label'); presetLabel.textContent='Preset:'; presetLabel.style.color='#ccc';
const presetSel=document.createElement('select'); presetSel.style.padding='4px 6px'; presetSel.style.minWidth='200px';
const btnLoad=mkBtn('Load');
ctrlWrap.append(btnStep,btnPlay,btnClear, btnSeed,btnSeedFB,document.createElement('div'), presetLabel,presetSel,btnLoad);
header.appendChild(ctrlWrap);

// Canvas fijo
const canvas=document.createElement('canvas');
canvas.width=MARGIN+W*CELL+10; canvas.height=H*CELL+50;
Object.assign(canvas.style,{background:'transparent',border:'1px solid #3333',display:'block'});
root.appendChild(canvas);
const ctx=canvas.getContext('2d');

// HUD abajo
const hud=document.createElement('div'); Object.assign(hud.style,{marginTop:'8px',color:'#ccc',minHeight:'18px'});
root.appendChild(hud); const log=s=>hud.textContent=s;

// ====== Grilla, direcciones y reloj ======
const grid=new Uint8Array(W*H).fill(0);
const dirGrid=new Int8Array(W*H).fill(-1); // 0=N,1=E,2=S,3=O para estado 2
const anchorCount=new Int8Array(W*H).fill(0); // cuenta regresiva (pulsos) para anclas activas
const idx=(x,y)=>y*W+x, inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const RIGHT=d=> (d+1)&3, LEFT=d=> (d+3)&3, BACK=d=> (d+2)&3;

// reloj para gates (estado 5)
let T=0, gatePeriod=8, gateDuty=4; // 50% duty
const gateOpenAt=(x,y)=> ((T + ((x*17 + y*31) % gatePeriod)) % gatePeriod) < gateDuty;

// ====== Dibujo ======
function blendColor(col, alphaWhite){ // mezcla hacia blanco para “brillo”
  // col: "#rrggbb"
  const r=parseInt(col.slice(1,3),16), g=parseInt(col.slice(3,5),16), b=parseInt(col.slice(5,7),16);
  const R=Math.round(r+(255-r)*alphaWhite), G=Math.round(g+(255-g)*alphaWhite), B=Math.round(b+(255-b)*alphaWhite);
  return `rgb(${R},${G},${B})`;
}
function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#99a'; ctx.fillText('x',MARGIN+W*CELL-8,12); ctx.fillText('y',8,H*CELL+20);
  ctx.strokeStyle='#ffffff16';
  for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(MARGIN+x*CELL,20);ctx.lineTo(MARGIN+x*CELL,20+H*CELL);ctx.stroke()}
  for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(MARGIN,20+y*CELL);ctx.lineTo(MARGIN+W*CELL,20+y*CELL);ctx.stroke()}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=idx(x,y), s=grid[i]; if(s===0) continue;
    let fillCol=COLORS[s];
    // si es ancla (9) y está activa, aplicar gradiente opaco→brillante→opaco en 10 pulsos
    if(s===9 && anchorCount[i]>0){
      const k=10 - anchorCount[i];           // 0..9 (progreso)
      const ph = k/9;                        // 0..1
      const up = ph<=0.5 ? ph/0.5 : (1-ph)/0.5; // 0→1→0
      const bright = Math.min(0.8, up*0.8);  // cuánto se acerca a blanco
      fillCol = blendColor(COLORS[9], bright);
    }
    ctx.fillStyle=fillCol;
    ctx.fillRect(MARGIN+x*CELL+1,20+y*CELL+1,CELL-2,CELL-2);
    ctx.fillStyle=(s===0?'#fff':'#000'); ctx.font='10px ui-mono';
    ctx.fillText(String(s),MARGIN+x*CELL+4,20+y*CELL+12);
  }
}
function hoverInfo(e){
  const x=Math.floor((e.offsetX-MARGIN)/CELL), y=Math.floor((e.offsetY-20)/CELL);
  if(!inb(x,y)) return; const s=grid[idx(x,y)];
  hud.textContent=`(x=${x}, y=${y}) estado=${s}`;
}
function pickInitDir(x,y){
  const order=[1,2,3,0]; // E,S,O,N
  for(const d of order){
    const [dx,dy]=DIRS[d], nx=x+dx, ny=y+dy;
    if(inb(nx,ny) && isConductor(nx,ny)) return d;
  }
  return 1;
}
function paintAt(px,py,cycle=false){
  const x=Math.floor((px-MARGIN)/CELL), y=Math.floor((py-20)/CELL);
  if(!inb(x,y)) return -1; const i=idx(x,y);
  const newState=cycle? ((grid[i]+1)%29) : brush;
  grid[i]=newState; dirGrid[i]=(newState===2? pickInitDir(x,y) : -1);
  if(newState!==9) anchorCount[i]=0; // limpiar marca si se cambia
  playState(newState, y);
  return i;
}

// Paleta
let brush=2;
for(let i=0;i<29;i++){
  const sw=document.createElement('div');
  Object.assign(sw.style,{width:'20px',height:'20px',background:COLORS[i],border:'1px solid #0007',cursor:'pointer',
    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:(i===0?'#fff':'#000'),userSelect:'none'});
  sw.textContent=i; sw.title=`estado ${i}`; sw.onclick=()=>{brush=i; log(`pincel=${i}`)}; pal.appendChild(sw);
}

// ====== Interacción canvas ======
let mouseDown=false, lastCell=-1;
canvas.addEventListener('mousedown',e=>{mouseDown=true; lastCell=paintAt(e.offsetX,e.offsetY,e.shiftKey); drawGrid(); hoverInfo(e)});
canvas.addEventListener('mousemove',e=>{ if(mouseDown){const id=paintAt(e.offsetX,e.offsetY,e.shiftKey); if(id!==-1&&id!==lastCell){lastCell=id; drawGrid();}} hoverInfo(e) });
canvas.addEventListener('mouseup',()=>{mouseDown=false; lastCell=-1});
canvas.addEventListener('mouseleave',()=>{mouseDown=false; lastCell=-1});

// ====== Lógica de conductor con reglas especiales ======
function isConductor(x,y){
  const s=grid[idx(x,y)];
  if(!COND_BASE.has(s)) return false;
  if(s===5) return gateOpenAt(x,y); // 5: puerta rítmica
  if(s===6) return false;           // 6: barrera total
  return true;
}

// ====== Step con direcciones + 5/6/8/9 ======
function step(){
  T++;
  const prev=grid.slice(), prevDir=dirGrid.slice();
  const next=grid.slice(), nextDir=dirGrid.slice();

  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=idx(x,y);
    if(prev[i]!==2) continue;

    let d=prevDir[i];
    if(d<0){
      const neigh=[]; for(let k=0;k<4;k++){const [dx,dy]=DIRS[k], nx=x+dx, ny=y+dy; if(inb(nx,ny)&&isConductor(nx,ny)) neigh.push(k)}
      d=(neigh.length===1)? neigh[0] : (neigh[0]??1);
    }

    const order=[d, RIGHT(d), LEFT(d), BACK(d)];
    let moved=false;

    for(const nd of order){
      const [dx,dy]=DIRS[nd], nx=x+dx, ny=y+dy; if(!inb(nx,ny)) continue;
      const j=idx(nx,ny), s2=prev[j];

      // 6: barrera/silencio (absorbe + duck)
      if(s2===6){
        next[i]= (COND_BASE.has(prev[i]) && prev[i]!==5 && prev[i]!==6)? prev[i] : 0;
        nextDir[i]=-1; playSilenceDuck(); moved=true; break;
      }

      // 5: puerta rítmica con noise audible — solo conduce si gate abierto
      if(s2===5){
        playState(5, ny); // que suene el modulador
        if(!gateOpenAt(nx,ny)) continue; // bloquea
      }

      if(!isConductor(nx,ny)) continue;

      // 8: extensión / ramificación lateral
      if(s2===8){
        next[j]=2; nextDir[j]=nd;
        for(const sd of [LEFT(nd), RIGHT(nd)]){
          const [sx,sy]=DIRS[sd], rx=nx+sx, ry=ny+sy;
          if(inb(rx,ry) && isConductor(rx,ry)){ const r=idx(rx,ry); next[r]=2; nextDir[r]=sd; }
        }
      }else{
        next[j]=2; nextDir[j]=nd;
      }

      // 9: ancla (activar 10 pulsos y lanzar sweep)
      if(s2===9){
        triggerAnchor(j, ny); // marca 10 pulsos y sonido
      }

      // limpiar origen
      next[i] = (COND_BASE.has(prev[i]) && prev[i]!==5 && prev[i]!==6) ? prev[i] : 1;
      nextDir[i] = -1;
      moved=true; break;
    }

    if(!moved){
      next[i] = (COND_BASE.has(prev[i]) && prev[i]!==5 && prev[i]!==6) ? prev[i] : 0;
      nextDir[i] = -1;
    }
  }

  // Sonificar cambios
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const k=idx(x,y); if(next[k]!==prev[k]) playState(next[k], y);
  }

  // Decaer anclas activas (1 pulso menos)
  for(let i=0;i<anchorCount.length;i++){ if(anchorCount[i]>0) anchorCount[i]--; }

  grid.set(next); dirGrid.set(nextDir); drawGrid();
}

// ====== Play/Stop & Seed ======
let playing=false, loopId=null;
btnStep.onclick=()=>step();
btnPlay.onclick=()=>{
  playing=!playing;
  if(playing){ btnPlay.textContent='Stop'; loopId=setInterval(step,1000/Math.max(1,SPEED)); }
  else{ btnPlay.textContent='Play/Stop'; clearInterval(loopId); loopId=null; }
};
btnClear.onclick=()=>{ if(loopId){clearInterval(loopId); loopId=null; playing=false; btnPlay.textContent='Play/Stop';}
  grid.fill(0); dirGrid.fill(-1); anchorCount.fill(0); drawGrid(); log('limpio');};

// Seed sin fallback
function seedFromGrid({fallback=false}={}){
  const spots=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(isConductor(x,y)){
      let near=false; for(const [dx,dy] of DIRS){const nx=x+dx, ny=y+dy; if(inb(nx,ny)&&grid[idx(nx,ny)]===2){near=true;break}}
      if(!near) spots.push([x,y]);
    }
  }
  if(spots.length===0){
    if(!fallback){ log('Seed: no hay conductores.'); return; }
    const y0=Math.floor(H/2); for(let x=5;x<Math.min(W-5,30);x++) grid[idx(x,y0)]=1;
    grid[idx(8,y0)]=2; dirGrid[idx(8,y0)]=pickInitDir(8,y0); drawGrid(); log('Seed +fallback: riel central.'); return;
  }
  for(let k=spots.length-1;k>0;k--){const r=Math.floor(Math.random()*(k+1)); [spots[k],spots[r]]=[spots[r],spots[k]];}
  const nSeeds=Math.min(8, Math.max(2, Math.floor(spots.length/12)));
  let planted=0; for(const [x,y] of spots){ if(planted>=nSeeds) break; grid[idx(x,y)]=2; dirGrid[idx(x,y)]=pickInitDir(x,y); playState(2,y); planted++; }
  drawGrid(); log(`Seed: ${planted} señales sembradas.`);
}
btnSeed.onclick=()=>seedFromGrid({fallback:false});
btnSeedFB.onclick=()=>seedFromGrid({fallback:true});

// ====== PRESETS (10 snapshots) ======
const PRESETS=[
  {key:'flow', name:'Flujo conductor', paint:(g)=>{
      const ys=[4,7,12,15];
      ys.forEach((y,i)=>{ for(let x=3;x<W-3;x++) g[idx(x,y)]=[1,4,5,8][i%4];
        g[idx(6,y)]=20; g[idx(22,y)]=21; g[idx(12,y)]=3; g[idx(26,y)]=13; });
    }},
  {key:'impact', name:'Choque y propagación', paint:(g)=>{
      for(let y=3;y<H-3;y++) g[idx(Math.floor(W/2),y)]=14;
      for(let x=3;x<W-3;x++) g[idx(x,Math.floor(H/2))]=16;
      [[6,6],[28,6],[6,14],[28,14],[18,10]].forEach(([x,y])=>g[idx(x,y)]=2);
      g[idx(10,5)]=22; g[idx(26,15)]=23; g[idx(20,10)]=7;
    }},
  {key:'loops', name:'Auto-replicación y bucles', paint:(g)=>{
      for(let y=5;y<15;y++){ g[idx(8,y)]=12; g[idx(27,y)]=12; }
      for(let x=8;x<=27;x++){ g[idx(x,5)]=13; g[idx(x,14)]=13; }
      g[idx(10,7)]=24; g[idx(12,12)]=25; g[idx(23,8)]=24; g[idx(20,11)]=25;
      g[idx(18,10)]=19; g[idx(17,10)]=15;
    }},
  {key:'emerge', name:'Emergencia compleja', paint:(g)=>{
      for(let y=4;y<H-4;y++) for(let x=5;x<W-5;x++){
        if((x+y)%7===0) g[idx(x,y)]=5;
        else if((x*y)%13===0) g[idx(x,y)]=8;
      }
      g[idx(12,8)]=26; g[idx(24,12)]=27; g[idx(18,10)]=16; g[idx(19,10)]=17; g[idx(20,10)]=6;
    }},
  {key:'regime', name:'Perturbación y equilibrio', paint:(g)=>{
      for(let y=6;y<=13;y++) for(let x=4;x<W-4;x++) g[idx(x,y)]=[1,3,4,5][(x+y)%4];
      for(let x=6;x<W-6;x++) g[idx(x,10)]=14;
      g[idx(8,10)]=2; g[idx(W-9,10)]=2; g[idx(6,8)]=20; g[idx(W-7,12)]=21; g[idx(Math.floor(W/2),9)]=28;
    }},
  // nuevos
  {key:'gates', name:'Puertas rítmicas (5) + noise', paint:(g)=>{
      for(let y=4;y<H-4;y++) for(let x=4;x<W-4;x++) g[idx(x,y)]=(x%4===0?5:1);
      [5,9,13,16].forEach(y=>{g[idx(5,y)]=2;});
    }},
  {key:'silence', name:'Barreras (6) y silencios', paint:(g)=>{
      for(let x=6;x<W-6;x++){ const y = 4 + ((x%6)<3 ? (x%6) : 6-(x%6)); g[idx(x, y+6)]=6; }
      for(let y=5;y<H-5;y++) g[idx(8,y)]=1;
      for(let y=5;y<H-5;y+=3) g[idx(8,y)]=2;
    }},
  {key:'branch8', name:'Ramificaciones (8) conector lateral', paint:(g)=>{
      for(let y=3;y<H-3;y++) g[idx(Math.floor(W/2),y)]=1;
      [5,8,11,14].forEach(y=>{ g[idx(Math.floor(W/2),y)]=8; });
      g[idx(Math.floor(W/2),6)]=2;
      [5,8,11,14].forEach(y=>{
        for(let x=Math.floor(W/2)+1; x<Math.floor(W/2)+6; x++) g[idx(x,y)]=1;
        for(let x=Math.floor(W/2)-1; x>Math.floor(W/2)-6; x--) g[idx(x,y)]=1;
      });
    }},
  {key:'anchors', name:'Anclas (9) melódicas 10 pulsos', paint:(g)=>{
      for(let y=6;y<14;y++) for(let x=4;x<W-4;x++) g[idx(x,y)]=1;
      [[6,7],[12,9],[18,11],[24,13],[30,8]].forEach(([x,y])=>g[idx(x,y)]=9);
      g[idx(5,10)]=2;
    }},
  {key:'maze', name:'Laberinto con 5/6/8/9', paint:(g)=>{
      for(let y=4;y<H-4;y+=2) for(let x=4;x<W-4;x++) g[idx(x,y)]=6;
      for(let x=4;x<W-4;x+=6) for(let y=4;y<H-4;y++) g[idx(x,y)]=6;
      for(let y=5;y<H-5;y+=4) g[idx(10,y)]=5, g[idx(22,y)]=5;
      for(let y=5;y<H-5;y++) for(let x=5;x<W-5;x++) if(g[idx(x,y)]!==6) g[idx(x,y)]=1;
      [[12,7],[18,9],[24,11]].forEach(([x,y])=>g[idx(x,y)]=8);
      [[28,13],[6,13]].forEach(([x,y])=>g[idx(x,y)]=9);
      g[idx(6,5)]=2; g[idx(30,5)]=2;
    }},
];
PRESETS.forEach(p=>{const o=document.createElement('option'); o.value=p.key; o.textContent=p.name; presetSel.appendChild(o);});
function applyPreset(key){
  if(loopId){clearInterval(loopId); loopId=null; playing=false; btnPlay.textContent='Play/Stop';}
  grid.fill(0); dirGrid.fill(-1); anchorCount.fill(0);
  const p=PRESETS.find(x=>x.key===key)||PRESETS[0]; p.paint(grid); drawGrid(); log(`Preset cargado: ${p.name}`);
}
presetSel.value=PRESETS[0].key;
btnLoad.onclick=()=>applyPreset(presetSel.value);

// ====== AUDIO (master 50%, duck, reverb 65% wet, compresor global) ======
let AC, MASTER, DUCK, CONV, COMP;
function ensureAC(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  MASTER=AC.createGain(); MASTER.gain.value=0.5;
  DUCK=AC.createGain(); DUCK.gain.value=1.0;

  const irLen=AC.sampleRate*1.2, ir=AC.createBuffer(2,irLen,AC.sampleRate);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch); let a=1.0; for(let i=0;i<irLen;i++){d[i]=(Math.random()*2-1)*a; a*=0.9992;}}
  CONV=AC.createConvolver(); CONV.buffer=ir;
  const dry=AC.createGain(); dry.gain.value=0.35;
  const wet=AC.createGain(); wet.gain.value=0.65;

  COMP=AC.createDynamicsCompressor();
  COMP.threshold.value=-22; COMP.knee.value=6; COMP.ratio.value=8; COMP.attack.value=0.002; COMP.release.value=0.22;

  MASTER.connect(DUCK);
  DUCK.connect(dry); DUCK.connect(CONV); CONV.connect(wet);
  dry.connect(COMP); wet.connect(COMP); COMP.connect(AC.destination);
}
function duck(depth=0.6, t=0.08){
  ensureAC(); const now=AC.currentTime;
  DUCK.gain.cancelScheduledValues(now);
  DUCK.gain.setValueAtTime(DUCK.gain.value, now);
  DUCK.gain.linearRampToValueAtTime(1.0-depth, now+0.005);
  DUCK.gain.linearRampToValueAtTime(1.0, now+t);
}
function stopAt(node,t){try{node.stop(t)}catch{}}
const mapFreq=y=>{const min=220,max=1200; const ny=1 - (y/(H-1)); return min*Math.pow(max/min, ny);};
function envBlip(g,t,dur=0.1,peak=0.9){g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+dur*0.25); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);}
function envHold(g,t,hold=0.5,peak=0.25){g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+0.02); g.gain.setValueAtTime(peak,t+hold-0.05); g.gain.exponentialRampToValueAtTime(0.0008,t+hold);}
function osc(type,f){const o=AC.createOscillator(); o.type=type; o.frequency.value=f; o.start(); return o;}
function white(){const s=AC.createBufferSource(); const b=AC.createBuffer(1,AC.sampleRate*0.5,AC.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; s.buffer=b; s.loop=true; return s;}
function brown(){const src=white(), sh=AC.createBiquadFilter(); sh.type='lowshelf'; sh.frequency.value=200; sh.gain.value=12; src.connect(sh); return {node:src,out:sh};}
function fmSquare(fCar,fMod,idx){const car=osc('square',fCar); const mod=osc('sine',fMod); const g=AC.createGain(); g.gain.value=idx; mod.connect(g).connect(car.frequency); return {car,mod};}
function add10(f,mode){const mix=AC.createGain(); const partials=[]; for(let k=1;k<=10;k++){const allowed=(mode==='odd'&&k%2===1)||(mode==='even'&&k%2===0)||(mode==='fib'&&[1,2,3,5,8].includes(k))||(mode==='log'); const o=osc('sine',f*k); const g=AC.createGain(); let amp=allowed?1/k:0.12/k; if(mode==='log') amp=Math.log(1+k)/k/1.8; g.gain.value=amp*0.35; o.connect(g).connect(mix); partials.push(o);} return {mix,partials};}
function karplusSafe(f, fbAmt=0.965, damp=1800){const len=Math.max(2,Math.round(AC.sampleRate/f)); const buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1);
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true; const delay=AC.createDelay(); delay.delayTime.value=len/AC.sampleRate; const fb=AC.createGain(); fb.gain.value=fbAmt; const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=damp; lp.Q.value=0.2; src.connect(delay); delay.connect(lp).connect(fb).connect(delay); return {src,out:lp};}
function eq3(){const low=AC.createBiquadFilter(); low.type='lowshelf'; low.frequency.value=180; const mid=AC.createBiquadFilter(); mid.type='peaking'; mid.frequency.value=1200; mid.Q.value=1.0; const high=AC.createBiquadFilter(); high.type='highshelf'; high.frequency.value=4500; low.connect(mid).connect(high); return {in:low,out:high,low,mid,high};}
function voiceLimiter(th=-26, ratio=24, atk=0.0008, rel=0.15){const c=AC.createDynamicsCompressor(); c.threshold.value=th; c.knee.value=0; c.ratio.value=ratio; c.attack.value=atk; c.release.value=rel; return c;}

// ====== ANCLA: 10 pulsos con sweep y cresc-decresc ======
function triggerAnchor(i, y){
  anchorCount[i] = 10;                    // activar 10 pulsos
  // sonido: duración = 10 pulsos * (1/SPEED) seg
  const dur = 10 / SPEED;
  const f0 = mapFreq(y);
  ensureAC();
  const now=AC.currentTime;

  // oscilador + EQ + ganancia
  const o = osc('triangle', f0);
  const g = AC.createGain(); g.gain.value=0;
  const eq = eq3();
  o.connect(eq.in); eq.out.connect(g).connect(MASTER);

  // sweep de frecuencia: f0 -> 1.2f0 -> f0
  o.frequency.cancelScheduledValues(now);
  o.frequency.setValueAtTime(f0, now);
  o.frequency.linearRampToValueAtTime(f0*1.2, now + dur*0.5);
  o.frequency.linearRampToValueAtTime(f0,     now + dur);

  // cresc-decresc
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.35, now + dur*0.45);
  g.gain.exponentialRampToValueAtTime(0.0008, now + dur);

  stopAt(o, now + dur + 0.01);
}
function playAnchor(y){ /* se dispara desde triggerAnchor */ } // mantenemos stub por compatibilidad

// ====== Sonificación por estado (100 ms para el resto) ======
function playSilenceDuck(){ ensureAC(); duck(0.6,0.09); }
function playState(state,y){
  ensureAC(); if(AC.state!=='running') AC.resume();
  const now=AC.currentTime, dur=0.1, f=mapFreq(y);
  const engine=state%7, variant=Math.floor(state/7);
  const eq=eq3(); eq.low.gain.value=(-2+variant); eq.high.gain.value=(-1+0.5*variant);

  if(state===6) return; // silencio puro (el duck se dispara en la lógica)

  switch(engine){
    case 0:{ const n=white(); const g=AC.createGain(); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1200+variant*600; lp.Q.value=0.6+0.2*variant; n.connect(lp).connect(eq.in); eq.out.connect(g).connect(MASTER); envBlip(g,now,dur,0.6); n.start(now); stopAt(n,now+dur); break;}
    case 1:{ const o=osc('sawtooth',f*(1+variant*0.02)); const g=AC.createGain(); o.connect(eq.in); eq.out.connect(g).connect(MASTER); envBlip(g,now,dur,0.7); stopAt(o,now+dur); break;}
    case 2:{ const fm=fmSquare(f*(1+variant*0.01), f*0.5, 20+variant*12); const g=AC.createGain(); fm.car.connect(eq.in); eq.out.connect(g).connect(MASTER); envBlip(g,now,dur,0.8); stopAt(fm.car,now+dur); stopAt(fm.mod,now+dur); break;}
    case 3:{ const o=osc('triangle', f); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=800+variant*900; lp.Q.value=0.9; const g=AC.createGain(); o.connect(lp).connect(eq.in); eq.out.connect(g).connect(MASTER); envBlip(g,now,dur,0.7); stopAt(o,now+dur); break;}
    case 4:{ const modes=['odd','even','fib','log']; const ad=add10(f, modes[variant%4]); const g=AC.createGain(); ad.mix.connect(eq.in); eq.out.connect(g).connect(MASTER); envBlip(g,now,dur,0.6); ad.partials.forEach(o=>stopAt(o,now+dur)); break;}
    case 5:{ const br=brown(); const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=f*(0.7+0.15*variant); bp.Q.value=6+variant; const g=AC.createGain(); br.out.connect(bp).connect(eq.in); eq.out.connect(g).connect(MASTER); envBlip(g,now,dur,0.65); br.node.start(now); stopAt(br.node,now+dur); break;}
    case 6:{ /* reservado a silencio por lógica */ break;}
  }
}

// ====== Inicial ======
drawGrid(); log('Elegí un preset y Load. 9=ancla: 10 pulsos con gradiente visual + sweep crescendo/decrescendo según Y.');

// ====== Play/Stop, Step ya están arriba (no repetir) ======
```













- Diseño sonoro (28 combos): 7 motores en 4 macro-sintes para cumplir “sintes × 7 alturas = 28 combinaciones”, cubriendo todos tus motores en el conjunto:
- A = ruido blanco + saw
- B = FM (carrier cuadrada) + sustractiva de triángulo
- C = aditiva de 10 senos en relaciones armónicas con 4 envolventes (pares, impares, Fibonacci, log)
- D = brown noise bi-filtrado + Karplus-Strong
- Alturas: 300, 400, 500, 600, 700, 800, 900 Hz.
- Varianza: cada disparo añade sutil modulación aleatoria, EQ de 3 bandas y pequeñas diferencias de ganancia.



⸻

## Categorías recurrentes  del 29-estados

- 0 Quiescente: fondo inerte; en música, silencio/ambiente.
- 1 Conductor: “cable” por donde viaja la señal; riel rítmico.
- 2 Señal: excitación que se propaga; trigger/ataque.
- 3 Encrucijada: cruce con prioridad; en música, bifurcación métrica.
- 4 Revestimiento: “aislante” que protege conductores; envolvente/filtro que evita acoples.
- 5 Control: celdas que abren/cierran paso; puertas lógicas rítmicas.
- 6 Barrera: bloquea/absorbe señal; compuerta de silencio.
- 7 Cabezal: punto de lectura/escritura local; onset maker.
- 8 Tallo: extensión del cabezal; prolongación de gesto.
- 9 Ancla: fija geometrías; pedal/ostinato estructural.
- 10 Puntero: direcciona hacia memoria; índice de fraseo.
- 11 Brida: sujeción entre módulos; acople de capas.
- 12 Buffer: intermedio de tiempo; retardo/cola.
- 13 Ruteo: deriva de la señal; envío/return.
- 14 Bloqueo: inhibición temporal; sidechain/ducking.
- 15–18 Transiciones (A–D): estados fugaces que resuelven ambigüedades; grit microtemporal.
- 19 Cursor: escaneo de programa; compás móvil.
- 20–23 Flechas ↑→↓←: preferencia direccional; desplazamientos (pan/altura).
- 24–27 Marcadores (1–4): “banderas” para macros; secciones formales.
- 28 Reserva: comodín/expansión; meta-estado.

Estas etiquetas no pretenden replicar la codificación exacta histórica (muy específica y técnica), sino hacer visibles los roles funcionales recurrentes en el ecosistema del autómata (y sus análogos musicales).

--- 

## Sinopsis: la teoría de Von Neumann (muy breve)

- Problema: ¿Es lógicamente posible un constructor universal que se auto-reproduzca y evolucione?
- Solución formal: Von Neumann propone un autómata celular en vecindad de von Neumann (N, E, S, O) con 29 estados y una tabla de transición que implementa:
	1.	una fábrica universal (constructor),
	2.	una descripción (cinta) del propio sistema,
	3.	un control que copia la descripción a la descendencia y pone a trabajar a la fábrica,
	4.	la posibilidad de mutar la descripción (no necesaria en la prueba, pero prevista).
Con esto demuestra la factibilidad lógica de la autorreproducción y sienta bases para pensar evolución artificial en medios discretos.  ￼
- Desarrollos clave:
- Codd (1968) simplifica a 8 estados y muestra patrones auto-replicantes funcionales.  ￼
- Langton (1984) prueba que la construcción universal no es condición necesaria para la auto-reproducción: basta con mecanismos más “locales” y liberales. Esto abre el campo moderno de Artificial Life (1987–1989).  ￼
- Resúmenes históricos y técnicos: Wikipedia técnica (29 estados) y presentaciones académicas posteriores.  ￼

⸻

## Referencias
```bibtex
@book{vonNeumann1966,
  title   = {Theory of Self-Reproducing Automata},
  author  = {von Neumann, John},
  editor  = {Burks, Arthur W.},
  year    = {1966},
  publisher = {University of Illinois Press},
  address = {Urbana},
  url     = {https://cba.mit.edu/events/03.11.ASE/docs/VonNeumann.pdf}
}

@article{Langton1984,
  title   = {Self-reproduction in cellular automata},
  author  = {Langton, Christopher G.},
  journal = {Physica D: Nonlinear Phenomena},
  volume  = {10},
  number  = {1-2},
  pages   = {135--144},
  year    = {1984},
  doi     = {10.1016/0167-2789(84)90256-2},
  url     = {https://www.sciencedirect.com/science/article/pii/0167278984902562}
}

@proceedings{Langton1989,
  title   = {Artificial Life: Proceedings of an Interdisciplinary Workshop on the Synthesis and Simulation of Living Systems},
  editor  = {Langton, Christopher G.},
  year    = {1989},
  publisher = {Addison-Wesley},
  address = {Redwood City, CA},
  url     = {https://archive.org/details/artificiallifepr00inte}
}

@inproceedings{Burks1969,
  title   = {Von Neumann's Self-Reproducing Automata},
  author  = {Burks, Arthur W.},
  year    = {1969},
  institution = {University of Michigan},
  url     = {https://fab.cba.mit.edu/classes/865.18/replication/Burks.pdf}
}

@misc{CoddGolly,
  title   = {Codd's 8-state self-replicating cellular automaton (Golly documentation)},
  author  = {Golly Team},
  year    = {2005--},
  howpublished = {\url{https://golly.sourceforge.io/Help/Algorithms/RuleLoader.html}}
}

@misc{VonNeumann29ACM,
  title   = {Von Neumann's 29-state cellular automaton},
  author  = {Various},
  howpublished = {ACM Digital Library},
  year    = {1990},
  url     = {https://dl.acm.org/doi/10.1145/76263.76282}
}
```


⸻

Cómo tocar
- Pasa por todos los combos (Play all) e identificar cuál macro-sinte asocian con qué rol del autómata (conductor, señal, barrera…).
- que cada grupo redacte su propia tabla de transición tímbrica: cuándo un combo “se propaga”, cuándo “muere”, cuándo “se bifurca”, y que programen una regla de vecindad musical (usando tu grid CA de antes) que dispare estos 28 sonidos como “señales”.

## ejemplos


1. Flujo conductor

Estados → [1,3,4,5,8,9,12,13,20,21]
Timbres base: triángulo y sierra filtrada (con envolvente lenta), tonos entre 300–700 Hz.
Descripción:
	•	Los conductores (1,3,4,5,8,9,12,13) funcionan como un sustrato continuo de pulsaciones tenues.
	•	Las flechas (20, 21) introducen movimiento direccional: la sensación auditiva de una corriente que se desliza.
	•	Se percibe como una textura suave, casi acuática, con pequeñas modulaciones en el centro del campo estéreo.
Analógicamente: representa la conductividad del autómata; un flujo estable de energía.


2. Choque y propagación

Estados → [2,6,7,14,15,16,17,18,22,23]
Timbres base: FM cuadrada y ruido blanco con env blip (100 ms), + frecuencias altas > 600 Hz.
Descripción:
	•	Los señales (2) son ataques brillantes; los bloqueos y transiciones (14–18) interrumpen el flujo.
	•	Las flechas inferiores (22, 23) producen rebotes sonoros; suenan como ecos cortos.
	•	Este conjunto recrea la propagación–colisión: impulsos que se transmiten y apagan.
Analógicamente: la vida mínima — un sistema excitado que se reorganiza en cada impacto.


3. Auto-replicación y bucles

Estados → [0,9,10,11,12,13,15,19,24,25]
Timbres base: aditivos de 10 senos (modos odd y fib), frecuencias medias, ± 500 Hz.
Descripción:
	•	Los buffers (12) y ruteos (13) crean ecos armónicos; los marcadores (24–25) reintroducen variaciones.
	•	Se escucha como un coro granular: múltiples parciales que se realimentan con leves desincronías.
	•	Los transitorios (15, 19) simulan la copia de una forma sonora a otra.
Analógicamente: representa la auto-reproducción del modelo de Von Neumann, traducida a motivos sonoros recurrentes.

4. Emergencia compleja

Estados → [5,6,7,8,9,10,16,17,26,27]
Timbres base: mezcla de brown noise filtrado y Karplus-Strong; registros bajos 300–400 Hz.
Descripción:
	•	Golpes amortiguados, resonancias de cuerda y fricción.
	•	La presencia de transiciones (16–17) genera pulsaciones imprevisibles.
	•	Los marcadores (26–27) funcionan como ganchos tímbricos.
Analógicamente: un ecosistema que se densifica, donde cada célula sonora genera otra antes de extinguirse.


5. Perturbación y equilibrio

Estados → [1,2,3,4,5,14,15,20,21,28]
Timbres base: mezcla de saw + FM, con EQ medio-alto reforzado, ataques cortos de 100 ms.
Descripción:
	•	Los conductores (1–5) son la base, mientras que las transiciones y flechas (14, 15, 20, 21) crean brechas espectrales.
	•	El estado 28 (reserva) cierra con un timbre híbrido entre percusivo y armónico, modulando entre 400 y 900 Hz.
	•	Suena como un “sistema que intenta volver al equilibrio” luego de una perturbación.
Analógicamente: el impacto del meteorito de tu metáfora — una reorganización global del paisaje.


### cómo se pueden  escuchar

1.	En la grilla: pinto sólo esos estados.
2.	Apretar Seed, luego Play, y escuchar cómo el patrón se reorganiza.
3.	Cambiar las coordenadas en Y: las frecuencias varían verticalmente, creando armonías emergentes.
4.	Si querés documentar, grabá la salida del AudioContext y usá los ejemplos como gestos sonoros de tus topologías de vida artificial.
