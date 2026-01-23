```dataviewjs
try {
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

// Cleanup previo si existe (hot-reload)
if (root.__vnCleanup) { try{ root.__vnCleanup(); } catch(e){} }
root.innerHTML = "";
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
  // Cleanup automático si el contenedor ya no está en el DOM
  if (!root.isConnected) {
    if(loopId) clearInterval(loopId);
    if(AC) { try{ AC.close(); }catch(e){} AC=null; }
    return;
  }
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
  if(playing){ 
    ensureAC(); if(AC.state!=='running') AC.resume(); // Resume explícito en click
    btnPlay.textContent='Stop'; loopId=setInterval(step,1000/Math.max(1,SPEED)); 
  }
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

// Cleanup hook
root.__vnCleanup = () => {
  if(loopId) clearInterval(loopId);
  if(AC) { try{ AC.close(); }catch(e){} AC=null; }
};

} catch(e) {
  const pre = document.createElement('pre');
  pre.textContent = 'ERROR:\n' + (e && (e.stack || e.message || String(e)));
  this.container.appendChild(pre);
}

// ====== Play/Stop, Step ya están arriba (no repetir) ======
```