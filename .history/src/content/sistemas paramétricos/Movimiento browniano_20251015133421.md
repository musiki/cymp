---
concept:
tags:
  - matemática
  - operativos/sistemasparamétricos
---
 
El movimiento browniano se formaliza en matemáticas como un proceso estocástico de tiempo continuo. La representación más básica es la ecuación diferencial estocástica que define el movimiento browniano estándar (Wiener):

---

Definición del movimiento browniano estándar

Un proceso $B(t)$ es un movimiento browniano si cumple:
1.	$B(0)=0$
2.	Tiene incrementos independientes
3.	$B(t)-B(s)\sim \mathcal{N}(0,t-s)$ para $t>s$
4.	Trayectorias continuas casi seguramente

---

Fórmula diferencial (forma estocástica)

El movimiento browniano en una dimensión se define como

$$
dX_t = \mu,dt + \sigma,dW_t
$$

donde:
	- $X_t$ es la posición en el tiempo $t$,
	- $\mu$ es el término de deriva (drift),
	- $\sigma$ es la intensidad de la difusión,
	- $dW_t$ representa el incremento de un [[proceso de Wiener]] (ruido gaussiano con varianza $dt$).

---

Solución explícita

La solución es

$$
X_t = X_0 + \mu t + \sigma W_t
$$

donde $W_t$ es el movimiento browniano estándar con media $0$ y varianza $t$.

---

Distribución de $X_t$

Para cada instante $t$,

$$
X_t \sim \mathcal{N}(X_0 + \mu t, , \sigma^2 t)
$$

---

En arte electrónico y música generativa, lo que se suele usar es la forma discreta simulada (random walk gaussiano):

$$
X_{n+1} = X_n + \mu \Delta t + \sigma \sqrt{\Delta t},\xi_n
$$

donde $\xi_n \sim \mathcal{N}(0,1)$ es una variable normal independiente.

---




## version 1


1.	espacio e imagen

- cubo contenedor: lado N; grilla de N×N×N; centros de celda en {−N/2+0.5,…,N/2−0.5}.
- emisor rojo: tamaño 1×1×1 (una celda). se mueve con random walk discreto por la grilla.
- estela: curva Catmull–Rom de las posiciones visitadas; geometría de tubo con radio configurable; halo aditivo para efecto glow.
- grids: seis GridHelper alineados a cada cara del contenedor para referencia espacial.
- cámara: posición automática según N para encuadrar el cubo; orbit manual con arrastre y zoom.

2.	mapeos de posición → parámetros de síntesis FM

- eje y → frecuencia del carrier: f_c = map(y,−L→L, fmin→fmax).
- eje x → índice de modulación: I = map(x,−L→L, 0→Imax). mayor x aumenta la desviación de frecuencia del carrier.
- eje z → frecuencia del modulador: f_m = map(z,−L→L, fmmin→fmmax).

3.	espacialización del sonido

- panner 3D HRTF recibe la posición del emisor en cada frame:
- x desplaza izquierda/derecha (pan lateral).
- z acerca/aleja frontalmente (profundidad).
- y eleva/desciente la fuente (altitud).
- distancia y rolloff controlan atenuación con la distancia desde la cámara (que porta el oyente implícito).

4.	mezcla y envolvente

- reverb: wet/dry con convolver; slider reverb wet controla la mezcla de la cola reverberante.
- volumen de salida: ataque fijo corto al iniciar; release controlable con el slider Release al detener, para acortar o alargar la cola audible del sonido completo (incluida la reverb por mezcla).


```dataviewjs
try{
  const r=this.container;

  // -------- loader multi-CDN --------
  const tried=new Set();
  async function loadOne(url){ if([...document.scripts].some(s=>s.src.includes(url))) return; return new Promise((ok,ko)=>{ const t=document.createElement('script'); t.src=url; t.async=true; t.onload=ok; t.onerror=()=>ko(new Error(`ERROR cargando: ${url}`)); document.head.appendChild(t); }); }
  async function loadAny(paths){ let last=null; for(const p of paths){ if(tried.has(p))continue; tried.add(p); try{await loadOne(p); return;}catch(e){last=e;} } throw last||new Error('No se pudo cargar'); }

  // -------- UI --------
  const panel=document.createElement('div');
  const row=(label,input)=>{const w=document.createElement('div');w.style.display='flex';w.style.alignItems='center';w.style.gap='6px';const lb=document.createElement('label');lb.textContent=label;lb.style.width='160px';w.append(lb,input);return w;};
  const mkRange=(min,max,step,val)=>{const i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=val;i.style.flex='1';return i;};
  panel.style.display='grid'; panel.style.gridTemplateColumns='repeat(2,minmax(320px,1fr))'; panel.style.gap='8px'; panel.style.marginBottom='8px';
  const btn=document.createElement('button'); btn.textContent='▶ Play'; btn.style.width='120px';

  const iN    = mkRange(2,100,1,2);
  const iSpd  = mkRange(1,240,1,1);
  const iTail = mkRange(0,4000,10,0);
  const iTubeR= mkRange(0.02,0.5,0.01,0.12);

  const iFcMin= mkRange(40,1000,1,110);
  const iFcMax= mkRange(200,6000,1,880);
  const iFmMin= mkRange(0.5,1000,0.5,1);
  const iFmMax= mkRange(1,6000,1,220);
  const iIMax = mkRange(0,4000,1,700);

  const iWet  = mkRange(0,1,0.01,0.5);
  const iRel  = mkRange(0.01,2.0,0.01,0.25);

  const labelVal=(label,inp,fmt=(v)=>v)=>{const outer=row(label,inp);const out=document.createElement('span');out.textContent=fmt(inp.value);out.style.width='60px';out.style.textAlign='right';outer.append(out);inp.addEventListener('input',()=>out.textContent=fmt(inp.value));return outer;};

  r.appendChild(panel);
  panel.append(
    btn,
    labelVal('N (lado y grilla)',iN,v=>v),
    labelVal('Velocidad (steps/s)',iSpd,v=>v),
    labelVal('Largo estela',iTail,v=>v),
    labelVal('Radio estela',iTubeR,v=>(+v).toFixed(2)),
    labelVal('Carrier f min (Hz)',iFcMin,v=>v),
    labelVal('Carrier f max (Hz)',iFcMax,v=>v),
    labelVal('Mod f min (Hz)',iFmMin,v=>v),
    labelVal('Mod f max (Hz)',iFmMax,v=>v),
    labelVal('Índice max (Hz)',iIMax,v=>v),
    labelVal('Reverb wet',iWet,v=>(+v).toFixed(2)),
    labelVal('Release (s)',iRel,v=>(+v).toFixed(2))
  );

  // -------- canvas --------
  const W=r.clientWidth||640, H=460;
  const stage=document.createElement('div');
  stage.style.width='100%'; stage.style.height=H+'px'; stage.style.border='1px solid var(--text-muted)';
  r.appendChild(stage);

  // -------- three r149 --------
  await loadAny(['https://unpkg.com/three@0.149.0/build/three.min.js','https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js']);

  // -------- renderer / escena / cámara --------
  const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  const w=stage.clientWidth||W; ren.setSize(w,H); stage.appendChild(ren.domElement);
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.05;

  const scn=new THREE.Scene(); scn.background=new THREE.Color(0x060606);
  const cam=new THREE.PerspectiveCamera(60,w/H,.1,2000);
  function positionCameraForN(N){ const radius=Math.max(8,N*1.6); cam.position.set(radius, radius*0.75, radius*1.2); cam.near=0.01; cam.far=Math.max(1000,radius*10); cam.updateProjectionMatrix(); }
  positionCameraForN(+iN.value);

  scn.add(new THREE.AmbientLight(0xffffff,.25));
  const dl=new THREE.DirectionalLight(0xffffff,.8); dl.position.set(6,9,4); scn.add(dl);
  scn.add(new THREE.AxesHelper(2.0));

  // -------- Orbit --------
  class Orbit{
    constructor(c,d){ this.c=c; this.d=d; this.t=new THREE.Vector3();
      this.s=new THREE.Spherical().setFromVector3(c.position.clone());
      this.min=.01; this.max=Math.PI-.01; this.rmin=1; this.rmax=4000; this.rot=.008; this.zoom=1.1;
      this.drag=false; this.p={x:0,y:0};
      d.addEventListener('pointerdown',e=>{this.drag=true;this.p.x=e.clientX;this.p.y=e.clientY;});
      d.addEventListener('pointerup',()=>this.drag=false);
      d.addEventListener('pointermove',e=>{ if(!this.drag)return; const dx=e.clientX-this.p.x,dy=e.clientY-this.p.y; this.p.x=e.clientX; this.p.y=e.clientY; this.s.theta-=dx*this.rot; this.s.phi=Math.min(this.max,Math.max(this.min,this.s.phi-dy*this.rot)); this.upd(); });
      d.addEventListener('wheel',e=>{ e.preventDefault(); this.s.radius=e.deltaY>0?Math.min(this.rmax,this.s.radius*this.zoom):Math.max(this.rmin,this.s.radius/this.zoom); this.upd(); },{passive:false});
      this.upd();
    }
    upd(){ this.c.position.setFromSpherical(this.s).add(this.t); this.c.lookAt(this.t); }
  }
  const orbit=new Orbit(cam,ren.domElement);

  // -------- contenedor y grids --------
  let boxMesh=null, grids=[];
  function clearGrids(){ grids.forEach(g=>scn.remove(g)); grids=[]; }
  function addGrids(N){
    clearGrids();
    const L=N/2, size=2*L, div=N, color=0x2244aa, e=L+0.001;
    const mk=(rot,tx,ty,tz)=>{
      const g=new THREE.GridHelper(size,div,color,color);
      g.material.transparent=true; g.material.opacity=0.35;
      g.rotation.set(rot.x,rot.y,rot.z); g.position.set(tx,ty,tz);
      scn.add(g); grids.push(g);
    };
    mk(new THREE.Euler(0,0,0), 0,-e,0);
    mk(new THREE.Euler(0,0,0), 0, e,0);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0,-e);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0, e);
    mk(new THREE.Euler(0,0,Math.PI/2), -e,0,0);
    mk(new THREE.Euler(0,0,Math.PI/2),  e,0,0);
  }
  function rebuildBox(N){
    if(boxMesh) scn.remove(boxMesh);
    const L=N/2;
    boxMesh=new THREE.Mesh(new THREE.BoxGeometry(2*L,2*L,2*L),
      new THREE.MeshBasicMaterial({color:0x4477ff,wireframe:true,transparent:true,opacity:0.18}));
    scn.add(boxMesh); addGrids(N);
  }
  rebuildBox(+iN.value);
  iN.addEventListener('input',()=>{const N=+iN.value; rebuildBox(N); positionCameraForN(N); resetGridState(N);});

  // -------- emisor con halo --------
  const emitterCore=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({color:0xdd2222,emissive:0x660000,roughness:.25,metalness:.15}));
  const emitterHalo=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),
    new THREE.MeshBasicMaterial({color:0xff3333, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false}));
  const emitter=new THREE.Group(); emitter.add(emitterCore); emitter.add(emitterHalo);
  const pl=new THREE.PointLight(0xff4444,2.2,Math.max(14, +iN.value*2),2.0); emitter.add(pl);
  scn.add(emitter);

  // -------- estela tubular + halo --------
  let tailMax=+iTail.value|0;
  let tailPts=[];
  let tube=null, tubeHalo=null, tubeMat=null, tubeHaloMat=null;
  function rebuildTubes(){
    if(tube) scn.remove(tube); if(tubeHalo) scn.remove(tubeHalo);
    const r=+iTubeR.value;
    const pts = tailPts.length ? tailPts : [new THREE.Vector3(), new THREE.Vector3(0,0,0.001)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubularSegments = Math.max(8, Math.min(2048, pts.length*3));
    const geo = new THREE.TubeGeometry(curve, tubularSegments, r, 16, false);
    const geoHalo = new THREE.TubeGeometry(curve, tubularSegments, r*1.6, 16, false);
    if(!tubeMat) tubeMat = new THREE.MeshStandardMaterial({color:0xff2222,emissive:0x330000,roughness:.5,metalness:.1});
    if(!tubeHaloMat) tubeHaloMat = new THREE.MeshBasicMaterial({color:0xff3333,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false});
    tube = new THREE.Mesh(geo, tubeMat);
    tubeHalo = new THREE.Mesh(geoHalo, tubeHaloMat);
    scn.add(tube); scn.add(tubeHalo);
  }
  function pushTail(p){ tailPts.unshift(p.clone()); if(tailPts.length>tailMax) tailPts.pop(); }
  iTail.addEventListener('input',()=>{ tailMax=+iTail.value|0; tailPts.length=0; rebuildTubes(); });
  iTubeR.addEventListener('input', rebuildTubes);

  // -------- estado discreto NxNxN --------
  let Ncur=+iN.value, Lhalf=Ncur/2;
  let posDiscrete = new THREE.Vector3(0.5,0.5,0.5);
  function clampToGrid(v,N){ const L=N/2; v.x=Math.max(-L+0.5,Math.min(L-0.5,v.x)); v.y=Math.max(-L+0.5,Math.min(L-0.5,v.y)); v.z=Math.max(-L+0.5,Math.min(L-0.5,v.z)); }
  function resetGridState(N){ Ncur=N; Lhalf=N/2; posDiscrete.set(0.5,0.5,0.5); tailPts.length=0; rebuildTubes(); pl.distance=Math.max(14,N*2); }
  function stepRandomWalk(){ const axis=(Math.random()*3|0), dir=Math.random()<0.5?-1:1; if(axis===0) posDiscrete.x+=dir; if(axis===1) posDiscrete.y+=dir; if(axis===2) posDiscrete.z+=dir; clampToGrid(posDiscrete,Ncur); }
  const gridToWorld=(v)=>new THREE.Vector3(v.x,v.y,v.z);

  // ======== AUDIO: creación LAZY en Play, sin nodos residuales ========
  let audio = null; // guardo estado para limpiar
  async function createAudio(){
    // si hay uno previo, cerrarlo
    if(audio){
      try{
        if(audio.running){ await stopAudio(true); } // hard stop
        await audio.ctx.close();
      }catch(_){}
      audio=null;
    }
    const AudioCtx = window.AudioContext||window.webkitAudioContext;
    const ctx = new AudioCtx();

    const carrier=ctx.createOscillator(); carrier.type='square';
    const mod=ctx.createOscillator();     mod.type='sine';
    const modGain=ctx.createGain();
    const outGain=ctx.createGain(); outGain.gain.value=0.0; // mute inicial

    // IR simple
    function makeIR(seconds=2.2, decay=3.2){
      const rate=ctx.sampleRate, len=Math.floor(seconds*rate), buf=ctx.createBuffer(2,len,rate);
      for(let ch=0; ch<2; ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++){const t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay);} }
      return buf;
    }
    const convolver=ctx.createConvolver(); convolver.buffer=makeIR(2.2,3.2);
    const dryGain=ctx.createGain(), wetGain=ctx.createGain();
    dryGain.gain.value=1.0-+iWet.value; wetGain.gain.value=+iWet.value;
    iWet.addEventListener('input',()=>{dryGain.gain.setValueAtTime(1-+iWet.value,ctx.currentTime);wetGain.gain.setValueAtTime(+iWet.value,ctx.currentTime);});

    const panner=ctx.createPanner();
    panner.panningModel='HRTF'; panner.distanceModel='inverse';
    panner.refDistance=1.6; panner.rolloffFactor=1.4;

    // FM
    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(outGain);

    // mezcla
    const splitter=ctx.createGain();
    outGain.connect(panner); panner.connect(splitter);
    splitter.connect(dryGain).connect(ctx.destination);
    splitter.connect(convolver).connect(wetGain).connect(ctx.destination);

    // no arrancamos nada aún
    return {
      ctx, carrier, mod, modGain, outGain, panner,
      dryGain, wetGain,
      running:false, started:false
    };
  }

  function mapLinear(v,a,b,A,B){ return A + ((v-a)*(B-A))/(b-a); }
  function updateFMFromPos(px,py,pz){
    if(!audio) return;
    const {ctx, carrier, mod, modGain} = audio;
    const L=Lhalf;
    const fmin=+iFcMin.value, fmax=+iFcMax.value;
    const fmmin=+iFmMin.value, fmmax=+iFmMax.value;
    const Imax=+iIMax.value;
    const yHz = mapLinear(py,-L,L,fmin,fmax);
    const xI  = Math.max(0,mapLinear(px,-L,L,0,Imax));
    const zFm = Math.max(fmmin,mapLinear(pz,-L,L,fmmin,fmmax));
    carrier.frequency.setTargetAtTime(yHz, ctx.currentTime, 0.01);
    mod.frequency.setTargetAtTime(zFm, ctx.currentTime, 0.01);
    modGain.gain.setTargetAtTime(xI, ctx.currentTime, 0.01);
  }
  function updatePanner(px,py,pz){
    if(!audio) return;
    const {ctx, panner} = audio;
    panner.positionX.setValueAtTime(px, ctx.currentTime);
    panner.positionY.setValueAtTime(py, ctx.currentTime);
    panner.positionZ.setValueAtTime(pz, ctx.currentTime);
  }

  async function startAudio(){
    if(!audio) audio = await createAudio();
    const {ctx, carrier, mod, outGain} = audio;
    if(ctx.state!=='running') await ctx.resume();
    if(!audio.started){
      carrier.start(); mod.start(); audio.started=true;
    }
    // fade in
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    audio.running=true;
  }

  async function stopAudio(hard=false){
    if(!audio) return;
    const {ctx, carrier, mod, outGain} = audio;
    const rel = Math.max(0.01, +iRel.value);
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + (hard?0.01:rel));
    audio.running=false;
    // detener osciladores luego del release
    await new Promise(res=>setTimeout(res, (hard?0.02:rel*1000)+20));
    try{ carrier.stop(); mod.stop(); }catch(_){}
  }

  // -------- Play/Stop --------
  let running=false;
  btn.onclick=async ()=>{
    running=!running; btn.textContent=running?'■ Stop':'▶ Play';
    if(running){
      await startAudio();
    }else{
      await stopAudio(false);
    }
  };
  // también habilita audio con gesto en el canvas (si está en Play)
  stage.addEventListener('pointerdown',async ()=>{ if(running){ await startAudio(); } });

  // -------- render loop --------
  let last=performance.now(), acc=0;
  function animate(){
    requestAnimationFrame(animate);
    const now=performance.now(), dt=(now-last)/1000; last=now;
    const speed=+iSpd.value; acc+=dt*speed;

    if(running){
      while(acc>=1){
        acc-=1;
        stepRandomWalk();
        const p=gridToWorld(posDiscrete);
        emitter.position.copy(p);
        pushTail(p);
        rebuildTubes(); // 1x por step (velocidad baja por defecto)
        updatePanner(p.x,p.y,p.z);
        updateFMFromPos(p.x,p.y,p.z);
      }
    }

    orbit.upd();
    ren.render(scn,cam);
  }
  animate();

  // -------- resize --------
  window.addEventListener('resize',()=>{
    const w2=stage.clientWidth||w; ren.setSize(w2,H); cam.aspect=w2/H; cam.updateProjectionMatrix();
  });

}catch(e){
  const pre=document.createElement('pre');
  pre.textContent='ERROR:\n'+(e && (e.stack || e.message || String(e)));
  this.container.appendChild(pre);
}
```




## version 2 

1.	Modo continuo

- Si no hay movimiento en un frame (rest), el nivel cae con el release. Al reanudar, hay ataque corto. Ideal para “respirar” en micro-pausas.

2.	Ducking automático

- Calcula energía ~ pasos por frame. A más energía:
- reduce el wet de la reverb,
- aplica leve compresión del nivel de salida.
- Control con slider Ducking auto (0–1).

3.	Filtro de ruido browniano

- Persistencia: probabilidad de repetir eje/dirección (low-pass en la dirección).
- Prob. de rest: chance de “quedarse” (genera silencios en modo continuo).
- Color de ruido:
- white: dirección/axis totalmente aleatorios.
- pink: agrega sesgo lento (1/f) a la dirección.
- brown: favorece continuar el eje y la dirección anteriores (random walk más “pegajoso”).

4.	Color reactivo

- El cubo, su halo y la estela cambian de rojo profundo a ámbar según energía (sensibilidad ajustable).
- El emisivo también sube con energía.








```dataviewjs
try{
  const r=this.container;

  // ---------- loader ----------
  const tried=new Set();
  async function loadOne(url){ if([...document.scripts].some(s=>s.src.includes(url))) return; return new Promise((ok,ko)=>{ const t=document.createElement('script'); t.src=url; t.async=true; t.onload=ok; t.onerror=()=>ko(new Error(`ERROR cargando: ${url}`)); document.head.appendChild(t); }); }
  async function loadAny(paths){ let last=null; for(const p of paths){ if(tried.has(p))continue; tried.add(p); try{await loadOne(p); return;}catch(e){last=e;} } throw last||new Error('No se pudo cargar'); }

  // ---------- UI ----------
  const panel=document.createElement('div');
  const row=(label,input)=>{ const w=document.createElement('div'); w.style.display='flex'; w.style.alignItems='center'; w.style.gap='6px'; const lb=document.createElement('label'); lb.textContent=label; lb.style.width='170px'; w.append(lb,input); return w; };
  const mkRange=(min,max,step,val)=>{ const i=document.createElement('input'); i.type='range'; i.min=min; i.max=max; i.step=step; i.value=val; i.style.flex='1'; return i; };
  const mkCheck=(val)=>{ const i=document.createElement('input'); i.type='checkbox'; i.checked=val; return i; };
  const mkSelect=(opts,val)=>{ const s=document.createElement('select'); opts.forEach(o=>{const op=document.createElement('option'); op.value=o; op.textContent=o; if(o===val) op.selected=true; s.append(op);}); return s; };
  const lbl=(label,el,fmt=v=>v)=>{ const w=row(label,el); const sp=document.createElement('span'); sp.textContent=fmt(el.value ?? (el.checked? 'on':'off')); sp.style.width='70px'; sp.style.textAlign='right'; w.append(sp); const upd=()=>{ sp.textContent=fmt(el.value ?? (el.checked? 'on':'off')); }; el.addEventListener('input',upd); el.addEventListener('change',upd); return w; }

  panel.style.display='grid';
  panel.style.gridTemplateColumns='repeat(2,minmax(340px,1fr))';
  panel.style.gap='8px'; panel.style.marginBottom='8px';

  const btn=document.createElement('button'); btn.textContent='▶ Play'; btn.style.width='120px';

  const iN     = mkRange(2,100,1,2);
  const iSpd   = mkRange(1,240,1,1);
  const iTail  = mkRange(0,4000,10,0);
  const iTubeR = mkRange(0.02,0.5,0.01,0.12);

  const iFcMin = mkRange(40,1000,1,110);
  const iFcMax = mkRange(200,6000,1,880);
  const iFmMin = mkRange(0.5,1000,0.5,1);
  const iFmMax = mkRange(1,6000,1,220);
  const iIMax  = mkRange(0,4000,1,700);

  const iWet   = mkRange(0,1,0.01,0.5);
  const iRel   = mkRange(0.01,2.0,0.01,0.25);

  // Nuevo
  const iCont  = mkCheck(true);                 // modo continuo on/off
  const iRestP = mkRange(0,1,0.01,0.20);        // prob. de “rest” por step
  const iPersist = mkRange(0,1,0.01,0.35);      // persistencia direccional
  const iNoise  = mkSelect(['white','pink','brown'],'brown'); // color de ruido
  const iDuck   = mkRange(0,1,0.01,0.6);        // fuerza de ducking
  const iColorSens = mkRange(0,1,0.01,0.7);     // sensibilidad color/energía

  r.append(panel);
  panel.append(
    btn,
    lbl('N (lado y grilla)', iN, v=>v),
    lbl('Velocidad (steps/s)', iSpd, v=>v),
    lbl('Largo estela', iTail, v=>v),
    lbl('Radio estela', iTubeR, v=>(+v).toFixed(2)),

    lbl('Carrier f min (Hz)', iFcMin, v=>v),
    lbl('Carrier f max (Hz)', iFcMax, v=>v),
    lbl('Mod f min (Hz)', iFmMin, v=>v),
    lbl('Mod f max (Hz)', iFmMax, v=>v),
    lbl('Índice max (Hz)', iIMax, v=>v),

    lbl('Reverb wet', iWet, v=>(+v).toFixed(2)),
    lbl('Release (s)', iRel, v=>(+v).toFixed(2)),

    lbl('Modo continuo', iCont),
    lbl('Prob. de rest', iRestP, v=>(+v).toFixed(2)),
    lbl('Persistencia', iPersist, v=>(+v).toFixed(2)),
    lbl('Color de ruido', iNoise, v=>v),
    lbl('Ducking auto', iDuck, v=>(+v).toFixed(2)),
    lbl('Sens. color', iColorSens, v=>(+v).toFixed(2))
  );

  // ---------- canvas ----------
  const W=r.clientWidth||640, H=460;
  const stage=document.createElement('div');
  stage.style.width='100%'; stage.style.height=H+'px'; stage.style.border='1px solid var(--text-muted)';
  r.appendChild(stage);

  // ---------- three ----------
  await loadAny(['https://unpkg.com/three@0.149.0/build/three.min.js','https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js']);

  const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  const w=stage.clientWidth||W; ren.setSize(w,H); stage.appendChild(ren.domElement);
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.05;

  const scn=new THREE.Scene(); scn.background=new THREE.Color(0x060606);
  const cam=new THREE.PerspectiveCamera(60,w/H,.1,2000);
  function positionCameraForN(N){ const radius=Math.max(8, N*1.6); cam.position.set(radius, radius*0.75, radius*1.2); cam.near=0.01; cam.far=Math.max(1000, radius*10); cam.updateProjectionMatrix(); }
  positionCameraForN(+iN.value);

  scn.add(new THREE.AmbientLight(0xffffff,.25));
  const dl=new THREE.DirectionalLight(0xffffff,.8); dl.position.set(6,9,4); scn.add(dl);

  // Orbit
  class Orbit{
    constructor(c,d){ this.c=c; this.d=d; this.t=new THREE.Vector3();
      this.s=new THREE.Spherical().setFromVector3(c.position.clone());
      this.min=.01; this.max=Math.PI-.01; this.rmin=1; this.rmax=4000; this.rot=.008; this.zoom=1.1;
      this.drag=false; this.p={x:0,y:0};
      d.addEventListener('pointerdown',e=>{this.drag=true;this.p.x=e.clientX;this.p.y=e.clientY;});
      d.addEventListener('pointerup',()=>this.drag=false);
      d.addEventListener('pointermove',e=>{ if(!this.drag)return; const dx=e.clientX-this.p.x,dy=e.clientY-this.p.y; this.p.x=e.clientX; this.p.y=e.clientY; this.s.theta-=dx*this.rot; this.s.phi=Math.min(this.max,Math.max(this.min,this.s.phi-dy*this.rot)); this.upd(); });
      d.addEventListener('wheel',e=>{ e.preventDefault(); this.s.radius=e.deltaY>0?Math.min(this.rmax,this.s.radius*this.zoom):Math.max(this.rmin,this.s.radius/this.zoom); this.upd(); },{passive:false});
      this.upd();
    }
    upd(){ this.c.position.setFromSpherical(this.s).add(this.t); this.c.lookAt(this.t); }
  }
  const orbit=new Orbit(cam,ren.domElement);

  // Contenedor y grids
  let boxMesh=null, grids=[];
  function clearGrids(){ grids.forEach(g=>scn.remove(g)); grids=[]; }
  function addGrids(N){
    clearGrids(); const L=N/2, size=2*L, div=N, color=0x2244aa, e=L+0.001;
    const mk=(rot,tx,ty,tz)=>{
      const g=new THREE.GridHelper(size,div,color,color);
      g.material.transparent=true; g.material.opacity=0.35;
      g.rotation.set(rot.x,rot.y,rot.z); g.position.set(tx,ty,tz);
      scn.add(g); grids.push(g);
    };
    mk(new THREE.Euler(0,0,0), 0,-e,0);
    mk(new THREE.Euler(0,0,0), 0, e,0);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0,-e);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0, e);
    mk(new THREE.Euler(0,0,Math.PI/2), -e,0,0);
    mk(new THREE.Euler(0,0,Math.PI/2),  e,0,0);
  }
  function rebuildBox(N){
    if(boxMesh) scn.remove(boxMesh);
    const L=N/2;
    boxMesh=new THREE.Mesh(new THREE.BoxGeometry(2*L,2*L,2*L),
      new THREE.MeshBasicMaterial({color:0x4477ff,wireframe:true,transparent:true,opacity:0.18}));
    scn.add(boxMesh); addGrids(N);
  }
  rebuildBox(+iN.value);
  iN.addEventListener('input',()=>{const N=+iN.value; rebuildBox(N); positionCameraForN(N); resetGridState(N);});

  // Emisor con halo
  const emitterCore=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({color:0xdd2222,emissive:0x660000,roughness:.25,metalness:.15}));
  const emitterHalo=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),
    new THREE.MeshBasicMaterial({color:0xff3333, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false}));
  const emitter=new THREE.Group(); emitter.add(emitterCore); emitter.add(emitterHalo);
  const pl=new THREE.PointLight(0xff4444,2.2,Math.max(14, +iN.value*2),2.0); emitter.add(pl);
  scn.add(emitter);

  // Estela tubular + halo
  let tailMax=+iTail.value|0;
  let tailPts=[];
  let tube=null, tubeHalo=null, tubeMat=null, tubeHaloMat=null;
  function rebuildTubes(){
    if(tube) scn.remove(tube); if(tubeHalo) scn.remove(tubeHalo);
    const r=+iTubeR.value;
    const pts = tailPts.length ? tailPts : [new THREE.Vector3(), new THREE.Vector3(0,0,0.001)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubularSegments = Math.max(8, Math.min(2048, pts.length*3));
    const geo = new THREE.TubeGeometry(curve, tubularSegments, r, 16, false);
    const geoHalo = new THREE.TubeGeometry(curve, tubularSegments, r*1.6, 16, false);
    if(!tubeMat) tubeMat = new THREE.MeshStandardMaterial({color:0xff2222,emissive:0x330000,roughness:.5,metalness:.1});
    if(!tubeHaloMat) tubeHaloMat = new THREE.MeshBasicMaterial({color:0xff3333,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false});
    tube = new THREE.Mesh(geo, tubeMat);
    tubeHalo = new THREE.Mesh(geoHalo, tubeHaloMat);
    scn.add(tube); scn.add(tubeHalo);
  }
  function pushTail(p){ if(tailMax<=0) return; tailPts.unshift(p.clone()); if(tailPts.length>tailMax) tailPts.pop(); }

  iTail.addEventListener('input',()=>{ tailMax=+iTail.value|0; tailPts.length=0; rebuildTubes(); });
  iTubeR.addEventListener('input', rebuildTubes);

  // Estado discreto y “ruido browniano” direccional
  let Ncur=+iN.value, Lhalf=Ncur/2;
  let posDiscrete = new THREE.Vector3(0.5,0.5,0.5);
  let prevAxis = 0, prevDir = 1;
  let pinkAccum = 0; // para pink
  function clampToGrid(v,N){ const L=N/2; v.x=Math.max(-L+0.5,Math.min(L-0.5,v.x)); v.y=Math.max(-L+0.5,Math.min(L-0.5,v.y)); v.z=Math.max(-L+0.5,Math.min(L-0.5,v.z)); }
  function resetGridState(N){ Ncur=N; Lhalf=N/2; posDiscrete.set(0.5,0.5,0.5); tailPts.length=0; rebuildTubes(); pl.distance=Math.max(14,N*2); prevAxis=0; prevDir=1; pinkAccum=0; }

  function stepRandomWalk(){
    // probabilidad de quedarse (rest)
    if(Math.random() < +iRestP.value){ return false; } // no se mueve
    // elegir eje/dirección con persistencia
    let axis, dir;
    if(Math.random() < +iPersist.value){ axis=prevAxis; dir=prevDir; }
    else { axis=(Math.random()*3|0); dir=Math.random()<0.5?-1:1; }

    // “color” del ruido: modifica la dirección:
    const mode=iNoise.value;
    if(mode==='pink'){ // 1/f: acumular leve sesgo lento
      pinkAccum = 0.98*pinkAccum + 0.02*(Math.random()*2-1);
      if(Math.random() < Math.abs(pinkAccum)) dir = (pinkAccum>=0)? 1 : -1;
    }
    if(mode==='brown'){ // brown: favorecer mantener dirección (más persistencia efectiva)
      if(Math.random() < 0.5) dir = prevDir;
      if(Math.random() < 0.5) axis = prevAxis;
    }
    // aplicar
    if(axis===0) posDiscrete.x += dir;
    if(axis===1) posDiscrete.y += dir;
    if(axis===2) posDiscrete.z += dir;
    clampToGrid(posDiscrete,Ncur);
    prevAxis=axis; prevDir=dir;
    return true;
  }

  const gridToWorld=(v)=>new THREE.Vector3(v.x,v.y,v.z);

  // ---------- AUDIO (lazy) ----------
  let audio=null;
  async function createAudio(){
    if(audio){ try{ if(audio.running) await stopAudio(true); await audio.ctx.close(); }catch(_){} audio=null; }
    const AudioCtx = window.AudioContext||window.webkitAudioContext;
    const ctx=new AudioCtx();
    const carrier=ctx.createOscillator(); carrier.type='square';
    const mod=ctx.createOscillator();     mod.type='sine';
    const modGain=ctx.createGain();
    const outGain=ctx.createGain(); outGain.gain.value=0.0;
    // IR
    function makeIR(seconds=2.2,decay=3.2){ const rate=ctx.sampleRate,len=Math.floor(seconds*rate),buf=ctx.createBuffer(2,len,rate); for(let ch=0; ch<2; ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++){ const t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay);} } return buf; }
    const convolver=ctx.createConvolver(); convolver.buffer=makeIR(2.2,3.2);
    const dryGain=ctx.createGain(), wetGain=ctx.createGain();
    dryGain.gain.value=1.0-+iWet.value; wetGain.gain.value=+iWet.value;
    iWet.addEventListener('input',()=>{dryGain.gain.setValueAtTime(1-+iWet.value,ctx.currentTime);wetGain.gain.setValueAtTime(+iWet.value,ctx.currentTime);});

    const panner=ctx.createPanner(); panner.panningModel='HRTF'; panner.distanceModel='inverse'; panner.refDistance=1.6; panner.rolloffFactor=1.4;

    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(outGain);
    const splitter=ctx.createGain();
    outGain.connect(panner); panner.connect(splitter);
    splitter.connect(dryGain).connect(ctx.destination);
    splitter.connect(convolver).connect(wetGain).connect(ctx.destination);

    return {ctx,carrier,mod,modGain,outGain,panner,dryGain,wetGain,running:false,started:false};
  }
  function mapLinear(v,a,b,A,B){ return A + ((v-a)*(B-A))/(b-a); }
  function updateFMFromPos(px,py,pz){
    if(!audio) return; const {ctx,carrier,mod,modGain}=audio;
    const L=Lhalf, fmin=+iFcMin.value, fmax=+iFcMax.value, fmmin=+iFmMin.value, fmmax=+iFmMax.value, Imax=+iIMax.value;
    const yHz=mapLinear(py,-L,L,fmin,fmax), xI=Math.max(0,mapLinear(px,-L,L,0,Imax)), zFm=Math.max(fmmin,mapLinear(pz,-L,L,fmmin,fmmax));
    carrier.frequency.setTargetAtTime(yHz, ctx.currentTime, 0.01);
    mod.frequency.setTargetAtTime(zFm, ctx.currentTime, 0.01);
    modGain.gain.setTargetAtTime(xI, ctx.currentTime, 0.01);
  }
  function updatePanner(px,py,pz){
    if(!audio) return; const {ctx,panner}=audio;
    panner.positionX.setValueAtTime(px, ctx.currentTime);
    panner.positionY.setValueAtTime(py, ctx.currentTime);
    panner.positionZ.setValueAtTime(pz, ctx.currentTime);
  }
  async function startAudio(){
    if(!audio) audio=await createAudio();
    const {ctx,carrier,mod,outGain}=audio;
    if(ctx.state!=='running') await ctx.resume();
    if(!audio.started){ carrier.start(); mod.start(); audio.started=true; }
    // ataque corto
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime+0.02);
    audio.running=true;
  }
  async function stopAudio(hard=false){
    if(!audio) return; const {ctx,carrier,mod,outGain}=audio;
    const rel=Math.max(0.01,+iRel.value);
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime+(hard?0.01:rel));
    audio.running=false;
    await new Promise(res=>setTimeout(res,(hard?0.02:rel*1000)+20));
    try{ carrier.stop(); mod.stop(); }catch(_){}
  }

  // ---------- Play/Stop ----------
  let running=false;
  btn.onclick=async ()=>{ running=!running; btn.textContent=running?'■ Stop':'▶ Play'; if(running){ await startAudio(); } else { await stopAudio(false); } };
  stage.addEventListener('pointerdown',async ()=>{ if(running){ await startAudio(); } });

  // ---------- Color reactivo ----------
  function setEmitterColor(energy){
    // energy ∈ [0,1] → de rojo oscuro a naranja/amarillo
    const sens=+iColorSens.value;
    const e=Math.min(1, Math.max(0, energy*sens));
    // lerp entre (r,g,b): (0xdd2222) → (0xffcc33)
    const r = Math.round(0xdd + e*(0xff-0xdd));
    const g = Math.round(0x22 + e*(0xcc-0x22));
    const b = Math.round(0x22 + e*(0x33-0x22));
    const color = (r<<16)|(g<<8)|b;
    emitterCore.material.color.setHex(color);
    emitterHalo.material.color.setHex(color);
    pl.color.setHex(color);
    // intensificar emisivo con energía
    emitterCore.material.emissiveIntensity = 0.5 + e*1.5;
    if(tubeMat){ tubeMat.color.setHex(color); tubeMat.emissiveIntensity = 0.3 + e*1.2; }
    if(tubeHaloMat){ tubeHaloMat.color.setHex(color); }
  }

  // ---------- Loop ----------
  let last=performance.now(), acc=0;
  function animate(){
    requestAnimationFrame(animate);
    const now=performance.now(), dt=(now-last)/1000; last=now;
    const targetSteps=+iSpd.value; acc+=dt*targetSteps;

    let stepsThisFrame=0, moved=false;
    if(running){
      while(acc>=1){
        acc-=1;
        const didMove=stepRandomWalk();
        moved = moved || didMove;
        stepsThisFrame += didMove?1:0;
        const p=gridToWorld(posDiscrete);
        emitter.position.copy(p);
        pushTail(p);
      }
      rebuildTubes();

      // actividad/energía normalizada ~ pasos por frame
      const energy = Math.min(1, stepsThisFrame / Math.max(1,targetSteps/60)); // heurística
      setEmitterColor(energy);

      // ducking: reduce wet y un poco el outGain con actividad
      if(audio){
        const {ctx, outGain, wetGain, dryGain} = audio;
        const duck = +iDuck.value * energy;
        const baseOut = 0.06;
        const duckedOut = baseOut * (1 - 0.2*duck); // compresión leve
        const wet = +iWet.value * (1 - 0.8*duck);   // menos reverb cuando hay más movimiento
        const dry = 1 - wet;
        wetGain.gain.setTargetAtTime(wet, ctx.currentTime, 0.03);
        dryGain.gain.setTargetAtTime(dry, ctx.currentTime, 0.03);
        outGain.gain.setTargetAtTime(duckedOut, ctx.currentTime, 0.03);
      }

      // modo continuo: si no hubo movimiento efectivo en este frame, aplicar mini-release
      if(iCont.checked && audio){
        const {ctx,outGain} = audio;
        if(!moved){
          const rel=Math.max(0.01,+iRel.value);
          outGain.gain.cancelScheduledValues(ctx.currentTime);
          outGain.gain.setTargetAtTime(0.0, ctx.currentTime, rel);
        }else{
          // ataque rápido al volver a moverse
          outGain.gain.setTargetAtTime(0.06, audio.ctx.currentTime, 0.02);
        }
      }

      // actualizar audio espacial y FM con última posición
      if(tailPts.length && audio){
        const q=tailPts[0] ?? emitter.position;
        updatePanner(q.x,q.y,q.z);
        updateFMFromPos(q.x,q.y,q.z);
      }
    }

    orbit.upd();
    ren.render(scn,cam);
  }
  animate();

  // ---------- resize ----------
  window.addEventListener('resize',()=>{ const w2=stage.clientWidth||w; ren.setSize(w2,H); cam.aspect=w2/H; cam.updateProjectionMatrix(); });

}catch(e){
  const pre=document.createElement('pre');
  pre.textContent='ERROR:\n'+(e && (e.stack || e.message || String(e)));
  this.container.appendChild(pre);
}
```



## version 3 harmonic

- Eje Y: define la frecuencia del carrier f_c con mapeo lineal entre [fmin, fmax].

- Eje Z (modo musical activado): cuantiza la frecuencia del modulador a un conjunto de ratios r ∈ escala elegida, de modo que f_m = r · f_c. Z selecciona el índice del conjunto.

- Eje X (modo musical activado): recorre regímenes clásicos de FM en cinco zonas a lo largo de X, variando el índice (desviación en Hz, limitado por iIMax):
0–0.2 bajo (I ≈ 0–120), 0.2–0.4 pad (120–250), 0.4–0.6 campana (250–600), 0.6–0.8 metal (600–1200), 0.8–1.0 perc (1200–2000).

- Con modo musical desactivado, vuelve al mapeo continuo original: X → índice lineal 0..iIMax, Z → f_m en [fmmin, fmmax].


```dataviewjs
try{
  const r=this.container;

  // ---------- loader ----------
  const tried=new Set();
  async function loadOne(url){ if([...document.scripts].some(s=>s.src.includes(url))) return; return new Promise((ok,ko)=>{ const t=document.createElement('script'); t.src=url; t.async=true; t.onload=ok; t.onerror=()=>ko(new Error(`ERROR cargando: ${url}`)); document.head.appendChild(t); }); }
  async function loadAny(paths){ let last=null; for(const p of paths){ if(tried.has(p))continue; tried.add(p); try{await loadOne(p); return;}catch(e){last=e;} } throw last||new Error('No se pudo cargar'); }

  // ---------- UI ----------
  const panel=document.createElement('div');
  const row=(label,input)=>{ const w=document.createElement('div'); w.style.display='flex'; w.style.alignItems='center'; w.style.gap='6px'; const lb=document.createElement('label'); lb.textContent=label; lb.style.width='170px'; w.append(lb,input); return w; };
  const mkRange=(min,max,step,val)=>{ const i=document.createElement('input'); i.type='range'; i.min=min; i.max=max; i.step=step; i.value=val; i.style.flex='1'; return i; };
  const mkCheck=(val)=>{ const i=document.createElement('input'); i.type='checkbox'; i.checked=val; return i; };
  const mkSelect=(opts,val)=>{ const s=document.createElement('select'); opts.forEach(o=>{const op=document.createElement('option'); op.value=o.value||o; op.textContent=o.label||o; if((o.value||o)===val) op.selected=true; s.append(op);}); return s; };
  const lbl=(label,el,fmt=v=>v)=>{ const w=row(label,el); const sp=document.createElement('span'); sp.textContent=fmt(el.value ?? (el.checked? 'on':'off')); sp.style.width='70px'; sp.style.textAlign='right'; w.append(sp); const upd=()=>{ sp.textContent=fmt(el.value ?? (el.checked? 'on':'off')); }; el.addEventListener('input',upd); el.addEventListener('change',upd); return w; }

  panel.style.display='grid';
  panel.style.gridTemplateColumns='repeat(2,minmax(340px,1fr))';
  panel.style.gap='8px'; panel.style.marginBottom='8px';

  const btn=document.createElement('button'); btn.textContent='▶ Play'; btn.style.width='120px';

  const iN     = mkRange(2,100,1,2);
  const iSpd   = mkRange(1,240,1,1);
  const iTail  = mkRange(0,4000,10,0);
  const iTubeR = mkRange(0.02,0.5,0.01,0.12);

  const iFcMin = mkRange(40,1000,1,110);
  const iFcMax = mkRange(200,6000,1,880);
  const iFmMin = mkRange(0.5,1000,0.5,1);
  const iFmMax = mkRange(1,6000,1,220);
  const iIMax  = mkRange(0,4000,1,700);

  const iWet   = mkRange(0,1,0.01,0.5);
  const iRel   = mkRange(0.01,2.0,0.01,0.25);

  // continuo/ducking/ruido
  const iCont  = mkCheck(true);
  const iRestP = mkRange(0,1,0.01,0.20);
  const iPersist = mkRange(0,1,0.01,0.35);
  const iNoise  = mkSelect([{label:'white',value:'white'},{label:'pink (1/f)',value:'pink'},{label:'brown',value:'brown'}],'brown');
  const iDuck   = mkRange(0,1,0.01,0.6);
  const iColorSens = mkRange(0,1,0.01,0.7);

  // MODO MUSICAL
  const iMusical = mkCheck(true);
  const iScale = mkSelect([
    {label:'Harm 1–8',value:'harm8'},
    {label:'Justa (1, 5/4, 4/3, 3/2, 5/3, 2, 7/4)',value:'just7'},
    {label:'Pent. mayor (1, 9/8, 5/4, 3/2, 5/3)',value:'pentaM'},
    {label:'Octavas (1,2,4,1/2)',value:'octs'}
  ], 'harm8');

  r.append(panel);
  panel.append(
    btn,
    lbl('N (lado y grilla)', iN, v=>v),
    lbl('Velocidad (steps/s)', iSpd, v=>v),
    lbl('Largo estela', iTail, v=>v),
    lbl('Radio estela', iTubeR, v=>(+v).toFixed(2)),
    lbl('Carrier f min (Hz)', iFcMin, v=>v),
    lbl('Carrier f max (Hz)', iFcMax, v=>v),
    lbl('Mod f min (Hz)', iFmMin, v=>v),
    lbl('Mod f max (Hz)', iFmMax, v=>v),
    lbl('Índice max (Hz)', iIMax, v=>v),
    lbl('Reverb wet', iWet, v=>(+v).toFixed(2)),
    lbl('Release (s)', iRel, v=>(+v).toFixed(2)),
    lbl('Modo continuo', iCont),
    lbl('Prob. de rest', iRestP, v=>(+v).toFixed(2)),
    lbl('Persistencia', iPersist, v=>(+v).toFixed(2)),
    lbl('Color de ruido', iNoise, v=>v),
    lbl('Ducking auto', iDuck, v=>(+v).toFixed(2)),
    lbl('Sens. color', iColorSens, v=>(+v).toFixed(2)),
    lbl('Modo musical', iMusical),
    lbl('Escala ratios', iScale, v=>v)
  );

  // ---------- canvas ----------
  const W=r.clientWidth||640, H=460;
  const stage=document.createElement('div');
  stage.style.width='100%'; stage.style.height=H+'px'; stage.style.border='1px solid var(--text-muted)';
  r.appendChild(stage);

  // ---------- three ----------
  await loadAny(['https://unpkg.com/three@0.149.0/build/three.min.js','https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js']);

  const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  const w=stage.clientWidth||W; ren.setSize(w,H); stage.appendChild(ren.domElement);
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.05;

  const scn=new THREE.Scene(); scn.background=new THREE.Color(0x060606);
  const cam=new THREE.PerspectiveCamera(60,w/H,.1,2000);
  function positionCameraForN(N){ const radius=Math.max(8, N*1.6); cam.position.set(radius, radius*0.75, radius*1.2); cam.near=0.01; cam.far=Math.max(1000, radius*10); cam.updateProjectionMatrix(); }
  positionCameraForN(+iN.value);

  scn.add(new THREE.AmbientLight(0xffffff,.25));
  const dl=new THREE.DirectionalLight(0xffffff,.8); dl.position.set(6,9,4); scn.add(dl);

  // Orbit
  class Orbit{
    constructor(c,d){ this.c=c; this.d=d; this.t=new THREE.Vector3();
      this.s=new THREE.Spherical().setFromVector3(c.position.clone());
      this.min=.01; this.max=Math.PI-.01; this.rmin=1; this.rmax=4000; this.rot=.008; this.zoom=1.1;
      this.drag=false; this.p={x:0,y:0};
      d.addEventListener('pointerdown',e=>{this.drag=true;this.p.x=e.clientX;this.p.y=e.clientY;});
      d.addEventListener('pointerup',()=>this.drag=false);
      d.addEventListener('pointermove',e=>{ if(!this.drag)return; const dx=e.clientX-this.p.x,dy=e.clientY-this.p.y; this.p.x=e.clientX; this.p.y=e.clientY; this.s.theta-=dx*this.rot; this.s.phi=Math.min(this.max,Math.max(this.min,this.s.phi-dy*this.rot)); this.upd(); });
      d.addEventListener('wheel',e=>{ e.preventDefault(); this.s.radius=e.deltaY>0?Math.min(this.rmax,this.s.radius*this.zoom):Math.max(this.rmin,this.s.radius/this.zoom); this.upd(); },{passive:false});
      this.upd();
    }
    upd(){ this.c.position.setFromSpherical(this.s).add(this.t); this.c.lookAt(this.t); }
  }
  const orbit=new Orbit(cam,ren.domElement);

  // Caja + grids
  let boxMesh=null, grids=[];
  function clearGrids(){ grids.forEach(g=>scn.remove(g)); grids=[]; }
  function addGrids(N){
    clearGrids(); const L=N/2, size=2*L, div=N, color=0x2244aa, e=L+0.001;
    const mk=(rot,tx,ty,tz)=>{
      const g=new THREE.GridHelper(size,div,color,color);
      g.material.transparent=true; g.material.opacity=0.35;
      g.rotation.set(rot.x,rot.y,rot.z); g.position.set(tx,ty,tz);
      scn.add(g); grids.push(g);
    };
    mk(new THREE.Euler(0,0,0), 0,-e,0);
    mk(new THREE.Euler(0,0,0), 0, e,0);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0,-e);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0, e);
    mk(new THREE.Euler(0,0,Math.PI/2), -e,0,0);
    mk(new THREE.Euler(0,0,Math.PI/2),  e,0,0);
  }
  function rebuildBox(N){
    if(boxMesh) scn.remove(boxMesh);
    const L=N/2;
    boxMesh=new THREE.Mesh(new THREE.BoxGeometry(2*L,2*L,2*L),
      new THREE.MeshBasicMaterial({color:0x4477ff,wireframe:true,transparent:true,opacity:0.18}));
    scn.add(boxMesh); addGrids(N);
  }
  rebuildBox(+iN.value);
  iN.addEventListener('input',()=>{const N=+iN.value; rebuildBox(N); positionCameraForN(N); resetGridState(N);});

  // Emisor + halo
  const emitterCore=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({color:0xdd2222,emissive:0x660000,roughness:.25,metalness:.15}));
  const emitterHalo=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),
    new THREE.MeshBasicMaterial({color:0xff3333, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false}));
  const emitter=new THREE.Group(); emitter.add(emitterCore); emitter.add(emitterHalo);
  const pl=new THREE.PointLight(0xff4444,2.2,Math.max(14, +iN.value*2),2.0); emitter.add(pl);
  scn.add(emitter);

  // Estela tubular + halo
  let tailMax=+iTail.value|0;
  let tailPts=[];
  let tube=null, tubeHalo=null, tubeMat=null, tubeHaloMat=null;
  function rebuildTubes(){
    if(tube) scn.remove(tube); if(tubeHalo) scn.remove(tubeHalo);
    const r=+iTubeR.value;
    const pts = tailPts.length ? tailPts : [new THREE.Vector3(), new THREE.Vector3(0,0,0.001)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubularSegments = Math.max(8, Math.min(2048, pts.length*3));
    const geo = new THREE.TubeGeometry(curve, tubularSegments, r, 16, false);
    const geoHalo = new THREE.TubeGeometry(curve, tubularSegments, r*1.6, 16, false);
    if(!tubeMat) tubeMat = new THREE.MeshStandardMaterial({color:0xff2222,emissive:0x330000,roughness:.5,metalness:.1});
    if(!tubeHaloMat) tubeHaloMat = new THREE.MeshBasicMaterial({color:0xff3333,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false});
    tube = new THREE.Mesh(geo, tubeMat);
    tubeHalo = new THREE.Mesh(geoHalo, tubeHaloMat);
    scn.add(tube); scn.add(tubeHalo);
  }
  function pushTail(p){ if(tailMax<=0) return; tailPts.unshift(p.clone()); if(tailPts.length>tailMax) tailPts.pop(); }
  iTail.addEventListener('input',()=>{ tailMax=+iTail.value|0; tailPts.length=0; rebuildTubes(); });
  iTubeR.addEventListener('input', rebuildTubes);

  // Estado discreto + ruido
  let Ncur=+iN.value, Lhalf=Ncur/2;
  let posDiscrete = new THREE.Vector3(0.5,0.5,0.5);
  let prevAxis = 0, prevDir = 1, pinkAccum = 0;
  function clampToGrid(v,N){ const L=N/2; v.x=Math.max(-L+0.5,Math.min(L-0.5,v.x)); v.y=Math.max(-L+0.5,Math.min(L-0.5,v.y)); v.z=Math.max(-L+0.5,Math.min(L-0.5,v.z)); }
  function resetGridState(N){ Ncur=N; Lhalf=N/2; posDiscrete.set(0.5,0.5,0.5); tailPts.length=0; rebuildTubes(); pl.distance=Math.max(14,N*2); prevAxis=0; prevDir=1; pinkAccum=0; }
  function stepRandomWalk(){
    if(Math.random() < +iRestP.value){ return false; }
    let axis, dir;
    if(Math.random() < +iPersist.value){ axis=prevAxis; dir=prevDir; }
    else { axis=(Math.random()*3|0); dir=Math.random()<0.5?-1:1; }
    const mode=iNoise.value;
    if(mode==='pink'){ pinkAccum = 0.98*pinkAccum + 0.02*(Math.random()*2-1); if(Math.random() < Math.abs(pinkAccum)) dir = (pinkAccum>=0)? 1 : -1; }
    if(mode==='brown'){ if(Math.random() < 0.5) dir = prevDir; if(Math.random() < 0.5) axis = prevAxis; }
    if(axis===0) posDiscrete.x += dir;
    if(axis===1) posDiscrete.y += dir;
    if(axis===2) posDiscrete.z += dir;
    clampToGrid(posDiscrete,Ncur);
    prevAxis=axis; prevDir=dir; return true;
  }
  const gridToWorld=(v)=>new THREE.Vector3(v.x,v.y,v.z);

  // ---------- AUDIO (lazy) ----------
  let audio=null;
  async function createAudio(){
    if(audio){ try{ if(audio.running) await stopAudio(true); await audio.ctx.close(); }catch(_){} audio=null; }
    const AudioCtx = window.AudioContext||window.webkitAudioContext;
    const ctx=new AudioCtx();
    const carrier=ctx.createOscillator(); carrier.type='square';
    const mod=ctx.createOscillator();     mod.type='sine';
    const modGain=ctx.createGain();
    const outGain=ctx.createGain(); outGain.gain.value=0.0;
    // IR
    function makeIR(seconds=2.2,decay=3.2){ const rate=ctx.sampleRate,len=Math.floor(seconds*rate),buf=ctx.createBuffer(2,len,rate); for(let ch=0; ch<2; ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++){ const t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay);} } return buf; }
    const convolver=ctx.createConvolver(); convolver.buffer=makeIR(2.2,3.2);
    const dryGain=ctx.createGain(), wetGain=ctx.createGain();
    const panner=ctx.createPanner(); panner.panningModel='HRTF'; panner.distanceModel='inverse'; panner.refDistance=1.6; panner.rolloffFactor=1.4;

    // conexiones
    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(outGain);
    const splitter=ctx.createGain();
    outGain.connect(panner); panner.connect(splitter);
    splitter.connect(dryGain).connect(ctx.destination);
    splitter.connect(convolver).connect(wetGain).connect(ctx.destination);

    // set initial wet
    dryGain.gain.value=1.0-+iWet.value; wetGain.gain.value=+iWet.value;
    iWet.addEventListener('input',()=>{dryGain.gain.setValueAtTime(1-+iWet.value,ctx.currentTime);wetGain.gain.setValueAtTime(+iWet.value,ctx.currentTime);});

    return {ctx,carrier,mod,modGain,outGain,panner,dryGain,wetGain,running:false,started:false};
  }

  function mapLinear(v,a,b,A,B){ return A + ((v-a)*(B-A))/(b-a); }

  // Ratios musicales
  function ratioSet(kind){
    if(kind==='harm8') return [1,2,3,4,5,6,7,8].map(k=>k/1);
    if(kind==='just7') return [1,5/4,4/3,3/2,5/3,2,7/4];
    if(kind==='pentaM')return [1,9/8,5/4,3/2,5/3];
    if(kind==='octs')  return [0.5,1,2,4];
    return [1];
  }

  // Regímenes clásicos de FM sobre X (in Hz de desviación; se limita por iIMax)
  function regimeIndexFromX(xNorm, Imax){
    // bins de 0..1 en 5 zonas
    const z = Math.min(0.999, Math.max(0, xNorm));
    const seg = Math.floor(z*5); // 0..4
    // rangos típicos (puedes ajustar)
    const ranges = [
      [0,120],     // 0 bajo
      [120,250],   // 1 pad
      [250,600],   // 2 campana
      [600,1200],  // 3 metal
      [1200,2000]  // 4 perc
    ];
    const [a,b]=ranges[seg];
    const t = (z*5 - seg); // posición dentro del segmento
    const I = a + t*(b-a);
    return Math.min(I, Imax);
  }

  function updateFMFromPos(px,py,pz){
    if(!audio) return; const {ctx,carrier,mod,modGain}=audio;
    const L=Lhalf;
    // carrier siempre continuo con Y
    const fmin=+iFcMin.value, fmax=+iFcMax.value;
    const fc = mapLinear(py,-L,L,fmin,fmax);
    carrier.frequency.setTargetAtTime(fc, ctx.currentTime, 0.01);

    let fm;
    if(iMusical.checked){
      const R = ratioSet(iScale.value);
      // mapear Z a índice discreto del vector de ratios
      const z01 = Math.min(1, Math.max(0, (pz - (-L))/(2*L)));
      const k = Math.max(0, Math.min(R.length-1, Math.round(z01*(R.length-1))));
      fm = Math.max(0.1, fc * R[k]); // f_m = r * f_c
    }else{
      const fmmin=+iFmMin.value, fmmax=+iFmMax.value;
      fm = Math.max(fmmin, mapLinear(pz,-L,L,fmmin,fmmax));
    }
    mod.frequency.setTargetAtTime(fm, ctx.currentTime, 0.01);

    // índice (Hz) según X
    const Imax=+iIMax.value;
    let I;
    if(iMusical.checked){
      // X en [-L,L] → [0,1]
      const x01 = Math.min(1, Math.max(0, (px - (-L))/(2*L)));
      I = regimeIndexFromX(x01, Imax);
    }else{
      I = Math.max(0, mapLinear(px,-L,L,0,Imax));
    }
    modGain.gain.setTargetAtTime(I, ctx.currentTime, 0.01);
  }

  function updatePanner(px,py,pz){
    if(!audio) return; const {ctx,panner}=audio;
    panner.positionX.setValueAtTime(px, ctx.currentTime);
    panner.positionY.setValueAtTime(py, ctx.currentTime);
    panner.positionZ.setValueAtTime(pz, ctx.currentTime);
  }

  async function startAudio(){
    if(!audio) audio=await createAudio();
    const {ctx,carrier,mod,outGain}=audio;
    if(ctx.state!=='running') await ctx.resume();
    if(!audio.started){ carrier.start(); mod.start(); audio.started=true; }
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime+0.02);
    audio.running=true;
  }
  async function stopAudio(hard=false){
    if(!audio) return; const {ctx,carrier,mod,outGain}=audio;
    const rel=Math.max(0.01,+iRel.value);
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime+(hard?0.01:rel));
    audio.running=false;
    await new Promise(res=>setTimeout(res,(hard?0.02:rel*1000)+20));
    try{ carrier.stop(); mod.stop(); }catch(_){}
  }

  // ---------- Play/Stop ----------
  let running=false;
  btn.onclick=async ()=>{ running=!running; btn.textContent=running?'■ Stop':'▶ Play'; if(running){ await startAudio(); } else { await stopAudio(false); } };
  stage.addEventListener('pointerdown',async ()=>{ if(running){ await startAudio(); } });

  // ---------- Color reactivo ----------
  function setEmitterColor(energy){
    const sens=+iColorSens.value;
    const e=Math.min(1, Math.max(0, energy*sens));
    const r = Math.round(0xdd + e*(0xff-0xdd));
    const g = Math.round(0x22 + e*(0xcc-0x22));
    const b = Math.round(0x22 + e*(0x33-0x22));
    const color = (r<<16)|(g<<8)|b;
    emitterCore.material.color.setHex(color);
    emitterHalo.material.color.setHex(color);
    pl.color.setHex(color);
    emitterCore.material.emissiveIntensity = 0.5 + e*1.5;
    if(tubeMat){ tubeMat.color.setHex(color); tubeMat.emissiveIntensity = 0.3 + e*1.2; }
    if(tubeHaloMat){ tubeHaloMat.color.setHex(color); }
  }

  // ---------- loop ----------
  let last=performance.now(), acc=0;
  function animate(){
    requestAnimationFrame(animate);
    const now=performance.now(), dt=(now-last)/1000; last=now;
    const targetSteps=+iSpd.value; acc+=dt*targetSteps;

    let stepsThisFrame=0, moved=false;
    if(running){
      while(acc>=1){
        acc-=1;
        const didMove=stepRandomWalk();
        moved = moved || didMove;
        stepsThisFrame += didMove?1:0;
        const p=gridToWorld(posDiscrete);
        emitter.position.copy(p);
        pushTail(p);
        rebuildTubes();
        if(audio){ updatePanner(p.x,p.y,p.z); updateFMFromPos(p.x,p.y,p.z); }
      }

      const energy = Math.min(1, stepsThisFrame / Math.max(1,targetSteps/60));
      setEmitterColor(energy);

      // ducking
      if(audio){
        const {ctx, outGain, wetGain, dryGain} = audio;
        const duck = +iDuck.value * energy;
        const baseOut = 0.06;
        const duckedOut = baseOut * (1 - 0.2*duck);
        const wet = +iWet.value * (1 - 0.8*duck);
        const dry = 1 - wet;
        wetGain.gain.setTargetAtTime(wet, ctx.currentTime, 0.03);
        dryGain.gain.setTargetAtTime(dry, ctx.currentTime, 0.03);
        outGain.gain.setTargetAtTime(duckedOut, ctx.currentTime, 0.03);
      }

      // continuo: micro-silencios en descanso
      if(iCont.checked && audio){
        const {ctx,outGain} = audio;
        if(!moved){
          const rel=Math.max(0.01,+iRel.value);
          outGain.gain.cancelScheduledValues(ctx.currentTime);
          outGain.gain.setTargetAtTime(0.0, ctx.currentTime, rel);
        }else{
          outGain.gain.setTargetAtTime(0.06, audio.ctx.currentTime, 0.02);
        }
      }
    }

    orbit.upd();
    ren.render(scn,cam);
  }
  animate();

  // ---------- resize ----------
  window.addEventListener('resize',()=>{ const w2=stage.clientWidth||w; ren.setSize(w2,H); cam.aspect=w2/H; cam.updateProjectionMatrix(); });

}catch(e){
  const pre=document.createElement('pre');
  pre.textContent='ERROR:\n'+(e && (e.stack || e.message || String(e)));
  this.container.appendChild(pre);
}
```


## version 4

```dataviewjs
try{
  const r=this.container;

  // ---------- loader ----------
  const tried=new Set();
  async function loadOne(url){ if([...document.scripts].some(s=>s.src.includes(url))) return; return new Promise((ok,ko)=>{ const t=document.createElement('script'); t.src=url; t.async=true; t.onload=ok; t.onerror=()=>ko(new Error(`ERROR cargando: ${url}`)); document.head.appendChild(t); }); }
  async function loadAny(paths){ let last=null; for(const p of paths){ if(tried.has(p))continue; tried.add(p); try{await loadOne(p); return;}catch(e){last=e;} } throw last||new Error('No se pudo cargar'); }

  // ---------- UI ----------
  const panel=document.createElement('div');
  const row=(label,input)=>{ const w=document.createElement('div'); w.style.display='flex'; w.style.alignItems='center'; w.style.gap='6px'; const lb=document.createElement('label'); lb.textContent=label; lb.style.width='170px'; w.append(lb,input); return w; };
  const mkRange=(min,max,step,val)=>{ const i=document.createElement('input'); i.type='range'; i.min=min; i.max=max; i.step=step; i.value=val; i.style.flex='1'; return i; };
  const mkCheck=(val)=>{ const i=document.createElement('input'); i.type='checkbox'; i.checked=val; return i; };
  const mkSelect=(opts,val)=>{ const s=document.createElement('select'); opts.forEach(o=>{const op=document.createElement('option'); op.value=o.value||o; op.textContent=o.label||o; if((o.value||o)===val) op.selected=true; s.append(op);}); return s; };
  const lbl=(label,el,fmt=v=>v)=>{ const w=row(label,el); const sp=document.createElement('span'); sp.textContent=fmt(el.value ?? (el.checked? 'on':'off')); sp.style.width='70px'; sp.style.textAlign='right'; w.append(sp); const upd=()=>{ sp.textContent=fmt(el.value ?? (el.checked? 'on':'off')); }; el.addEventListener('input',upd); el.addEventListener('change',upd); return w; }

  panel.style.display='grid';
  panel.style.gridTemplateColumns='repeat(2,minmax(340px,1fr))';
  panel.style.gap='8px'; panel.style.marginBottom='8px';

  const btn=document.createElement('button'); btn.textContent='▶ Play'; btn.style.width='120px';

  const iN     = mkRange(2,100,1,2);
  const iSpd   = mkRange(1,240,1,1);
  const iTail  = mkRange(0,4000,10,0);
  const iTubeR = mkRange(0.02,0.5,0.01,0.12);

  const iFcMin = mkRange(40,1000,1,110);
  const iFcMax = mkRange(200,6000,1,880);
  const iFmMin = mkRange(0.5,1000,0.5,1);
  const iFmMax = mkRange(1,6000,1,220);
  const iIMax  = mkRange(0,4000,1,700);

  const iWet   = mkRange(0,1,0.01,0.5);
  const iRel   = mkRange(0.01,2.0,0.01,0.25);

  // continuo/ducking/ruido
  const iCont  = mkCheck(true);
  const iRestP = mkRange(0,1,0.01,0.20);
  const iPersist = mkRange(0,1,0.01,0.35);
  const iNoise  = mkSelect([{label:'white',value:'white'},{label:'pink (1/f)',value:'pink'},{label:'brown',value:'brown'}],'brown');
  const iDuck   = mkRange(0,1,0.01,0.6);
  const iColorSens = mkRange(0,1,0.01,0.7);

  // musical
  const iMusical = mkCheck(true);
  const iScale = mkSelect([
    {label:'Harm 1–8',value:'harm8'},
    {label:'Justa (1,5/4,4/3,3/2,5/3,2,7/4)',value:'just7'},
    {label:'Pent. mayor',value:'pentaM'},
    {label:'Octavas',value:'octs'}
  ], 'harm8');

  // afinación
  const iTune  = mkCheck(true);
  const iA4    = mkRange(380,470,0.1,440);
  const iPitchSpan = mkRange(12,84,1,48);
  const iKey   = mkSelect([{label:'C',value:'C'},{label:'C#',value:'C#'},{label:'D',value:'D'},{label:'D#',value:'D#'},{label:'E',value:'E'},{label:'F',value:'F'},{label:'F#',value:'F#'},{label:'G',value:'G'},{label:'G#',value:'G#'},{label:'A',value:'A'},{label:'A#',value:'A#'},{label:'B',value:'B'}],'A');
  const iScalePitch = mkSelect([{label:'Cromática (12)',value:'chrom'},{label:'Mayor',value:'maj'},{label:'Menor natural',value:'min'},{label:'Pent. mayor',value:'pentaM'}],'chrom');

  r.append(panel);
  panel.append(
    btn,
    lbl('N (lado y grilla)', iN, v=>v),
    lbl('Velocidad (steps/s)', iSpd, v=>v),
    lbl('Largo estela', iTail, v=>v),
    lbl('Radio estela', iTubeR, v=>(+v).toFixed(2)),
    lbl('Carrier f min (Hz)', iFcMin, v=>v),
    lbl('Carrier f max (Hz)', iFcMax, v=>v),
    lbl('Mod f min (Hz)', iFmMin, v=>v),
    lbl('Mod f max (Hz)', iFmMax, v=>v),
    lbl('Índice max (Hz)', iIMax, v=>v),
    lbl('Reverb wet', iWet, v=>(+v).toFixed(2)),
    lbl('Release (s)', iRel, v=>(+v).toFixed(2)),
    lbl('Modo continuo', iCont),
    lbl('Prob. de rest', iRestP, v=>(+v).toFixed(2)),
    lbl('Persistencia', iPersist, v=>(+v).toFixed(2)),
    lbl('Color de ruido', iNoise, v=>v),
    lbl('Ducking auto', iDuck, v=>(+v).toFixed(2)),
    lbl('Sens. color', iColorSens, v=>(+v).toFixed(2)),
    lbl('Modo musical', iMusical),
    lbl('Escala ratios', iScale, v=>v),
    lbl('Afinación 12-TET', iTune),
    lbl('A4 (Hz)', iA4, v=>(+v).toFixed(1)),
    lbl('Rango ±semitonos', iPitchSpan, v=>v),
    lbl('Tónica', iKey, v=>v),
    lbl('Escala notas', iScalePitch, v=>v)
  );

  // ---------- canvas ----------
  const W=r.clientWidth||640, H=460;
  const stage=document.createElement('div');
  stage.style.width='100%'; stage.style.height=H+'px'; stage.style.border='1px solid var(--text-muted)';
  r.appendChild(stage);

  // ---------- three ----------
  await loadAny(['https://unpkg.com/three@0.149.0/build/three.min.js','https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js']);

  const ren=new THREE.WebGLRenderer({antialias:true,alpha:true});
  const w=stage.clientWidth||W; ren.setSize(w,H); stage.appendChild(ren.domElement);
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.05;

  const scn=new THREE.Scene(); scn.background=new THREE.Color(0x060606);
  const cam=new THREE.PerspectiveCamera(60,w/H,.1,2000);
  function positionCameraForN(N){ const radius=Math.max(8, N*1.6); cam.position.set(radius, radius*0.75, radius*1.2); cam.near=0.01; cam.far=Math.max(1000, radius*10); cam.updateProjectionMatrix(); }
  positionCameraForN(+iN.value);

  scn.add(new THREE.AmbientLight(0xffffff,.25));
  const dl=new THREE.DirectionalLight(0xffffff,.8); dl.position.set(6,9,4); scn.add(dl);

  // orbit
  class Orbit{
    constructor(c,d){ this.c=c; this.d=d; this.t=new THREE.Vector3();
      this.s=new THREE.Spherical().setFromVector3(c.position.clone());
      this.min=.01; this.max=Math.PI-.01; this.rmin=1; this.rmax=4000; this.rot=.008; this.zoom=1.1;
      this.drag=false; this.p={x:0,y:0};
      d.addEventListener('pointerdown',e=>{this.drag=true;this.p.x=e.clientX;this.p.y=e.clientY;});
      d.addEventListener('pointerup',()=>this.drag=false);
      d.addEventListener('pointermove',e=>{ if(!this.drag)return; const dx=e.clientX-this.p.x,dy=e.clientY-this.p.y; this.p.x=e.clientX; this.p.y=e.clientY; this.s.theta-=dx*this.rot; this.s.phi=Math.min(this.max,Math.max(this.min,this.s.phi-dy*this.rot)); this.upd(); });
      d.addEventListener('wheel',e=>{ e.preventDefault(); this.s.radius=e.deltaY>0?Math.min(this.rmax,this.s.radius*this.zoom):Math.max(this.rmin,this.s.radius/this.zoom); this.upd(); },{passive:false});
      this.upd();
    }
    upd(){ this.c.position.setFromSpherical(this.s).add(this.t); this.c.lookAt(this.t); }
  }
  const orbit=new Orbit(cam,ren.domElement);

  // caja + grids
  let boxMesh=null, grids=[];
  function clearGrids(){ grids.forEach(g=>scn.remove(g)); grids=[]; }
  function addGrids(N){
    clearGrids(); const L=N/2, size=2*L, div=N, color=0x2244aa, e=L+0.001;
    const mk=(rot,tx,ty,tz)=>{
      const g=new THREE.GridHelper(size,div,color,color);
      g.material.transparent=true; g.material.opacity=0.35;
      g.rotation.set(rot.x,rot.y,rot.z); g.position.set(tx,ty,tz);
      scn.add(g); grids.push(g);
    };
    mk(new THREE.Euler(0,0,0), 0,-e,0);
    mk(new THREE.Euler(0,0,0), 0, e,0);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0,-e);
    mk(new THREE.Euler(Math.PI/2,0,0), 0,0, e);
    mk(new THREE.Euler(0,0,Math.PI/2), -e,0,0);
    mk(new THREE.Euler(0,0,Math.PI/2),  e,0,0);
  }
  function rebuildBox(N){
    if(boxMesh) scn.remove(boxMesh);
    const L=N/2;
    boxMesh=new THREE.Mesh(new THREE.BoxGeometry(2*L,2*L,2*L),
      new THREE.MeshBasicMaterial({color:0x4477ff,wireframe:true,transparent:true,opacity:0.18}));
    scn.add(boxMesh); addGrids(N);
  }
  rebuildBox(+iN.value);
  iN.addEventListener('input',()=>{const N=+iN.value; rebuildBox(N); positionCameraForN(N); resetGridState(N);});

  // emisor + halo (DECLARADO UNA SOLA VEZ)
  const emitterCore=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({color:0xdd2222,emissive:0x660000,roughness:.25,metalness:.15}));
  const emitterHalo=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),
    new THREE.MeshBasicMaterial({color:0xff3333, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false}));
  const emitter=new THREE.Group(); emitter.add(emitterCore); emitter.add(emitterHalo);
  const pl=new THREE.PointLight(0xff4444,2.2,Math.max(14, +iN.value*2),2.0); emitter.add(pl);
  scn.add(emitter);

  // estela tubular + halo (materiales declarados acá para que setEmitterColor los vea)
  let tailMax=+iTail.value|0;
  let tailPts=[];
  let tube=null, tubeHalo=null;
  let tubeMat=null, tubeHaloMat=null;
  function rebuildTubes(){
    if(tube) scn.remove(tube); if(tubeHalo) scn.remove(tubeHalo);
    const r=+iTubeR.value;
    const pts = tailPts.length ? tailPts : [new THREE.Vector3(), new THREE.Vector3(0,0,0.001)];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubularSegments = Math.max(8, Math.min(2048, pts.length*3));
    const geo = new THREE.TubeGeometry(curve, tubularSegments, r, 16, false);
    const geoHalo = new THREE.TubeGeometry(curve, tubularSegments, r*1.6, 16, false);
    if(!tubeMat) tubeMat = new THREE.MeshStandardMaterial({color:0xff2222,emissive:0x330000,roughness:.5,metalness:.1});
    if(!tubeHaloMat) tubeHaloMat = new THREE.MeshBasicMaterial({color:0xff3333,transparent:true,opacity:0.28,blending:THREE.AdditiveBlending,depthWrite:false});
    tube = new THREE.Mesh(geo, tubeMat);
    tubeHalo = new THREE.Mesh(geoHalo, tubeHaloMat);
    scn.add(tube); scn.add(tubeHalo);
  }
  function pushTail(p){ if(tailMax<=0) return; tailPts.unshift(p.clone()); if(tailPts.length>tailMax) tailPts.pop(); }
  iTail.addEventListener('input',()=>{ tailMax=+iTail.value|0; tailPts.length=0; rebuildTubes(); });
  iTubeR.addEventListener('input', rebuildTubes);

  // estado + ruido
  let Ncur=+iN.value, Lhalf=Ncur/2;
  let posDiscrete = new THREE.Vector3(0.5,0.5,0.5);
  let prevAxis = 0, prevDir = 1, pinkAccum = 0;
  function clampToGrid(v,N){ const L=N/2; v.x=Math.max(-L+0.5,Math.min(L-0.5,v.x)); v.y=Math.max(-L+0.5,Math.min(L-0.5,v.y)); v.z=Math.max(-L+0.5,Math.min(L-0.5,v.z)); }
  function resetGridState(N){ Ncur=N; Lhalf=N/2; posDiscrete.set(0.5,0.5,0.5); tailPts.length=0; rebuildTubes(); pl.distance=Math.max(14,N*2); prevAxis=0; prevDir=1; pinkAccum=0; }
  function stepRandomWalk(){
    if(Math.random() < +iRestP.value){ return false; }
    let axis, dir;
    if(Math.random() < +iPersist.value){ axis=prevAxis; dir=prevDir; }
    else { axis=(Math.random()*3|0); dir=Math.random()<0.5?-1:1; }
    const mode=iNoise.value;
    if(mode==='pink'){ pinkAccum = 0.98*pinkAccum + 0.02*(Math.random()*2-1); if(Math.random() < Math.abs(pinkAccum)) dir = (pinkAccum>=0)? 1 : -1; }
    if(mode==='brown'){ if(Math.random() < 0.5) dir = prevDir; if(Math.random() < 0.5) axis = prevAxis; }
    if(axis===0) posDiscrete.x += dir;
    if(axis===1) posDiscrete.y += dir;
    if(axis===2) posDiscrete.z += dir;
    clampToGrid(posDiscrete,Ncur);
    prevAxis=axis; prevDir=dir; return true;
  }
  const gridToWorld=(v)=>new THREE.Vector3(v.x,v.y,v.z);

  // ---------- AUDIO (lazy) ----------
  let audio=null;
  async function createAudio(){
    if(audio){ try{ if(audio.running) await stopAudio(true); await audio.ctx.close(); }catch(_){} audio=null; }
    const AudioCtx = window.AudioContext||window.webkitAudioContext;
    const ctx=new AudioCtx();
    const carrier=ctx.createOscillator(); carrier.type='square';
    const mod=ctx.createOscillator();     mod.type='sine';
    const modGain=ctx.createGain();
    const outGain=ctx.createGain(); outGain.gain.value=0.0;
    function makeIR(seconds=2.2,decay=3.2){ const rate=ctx.sampleRate,len=Math.floor(seconds*rate),buf=ctx.createBuffer(2,len,rate); for(let ch=0; ch<2; ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++){ const t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay);} } return buf; }
    const convolver=ctx.createConvolver(); convolver.buffer=makeIR(2.2,3.2);
    const dryGain=ctx.createGain(), wetGain=ctx.createGain();
    const panner=ctx.createPanner(); panner.panningModel='HRTF'; panner.distanceModel='inverse'; panner.refDistance=1.6; panner.rolloffFactor=1.4;

    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(outGain);
    const splitter=ctx.createGain();
    outGain.connect(panner); panner.connect(splitter);
    splitter.connect(dryGain).connect(ctx.destination);
    splitter.connect(convolver).connect(wetGain).connect(ctx.destination);

    dryGain.gain.value=1.0-+iWet.value; wetGain.gain.value=+iWet.value;
    iWet.addEventListener('input',()=>{dryGain.gain.setValueAtTime(1-+iWet.value,ctx.currentTime);wetGain.gain.setValueAtTime(+iWet.value,ctx.currentTime);});

    return {ctx,carrier,mod,modGain,outGain,panner,dryGain,wetGain,running:false,started:false};
  }

  function mapLinear(v,a,b,A,B){ return A + ((v-a)*(B-A))/(b-a); }

  // ratios musicales (Z)
  function ratioSet(kind){
    if(kind==='harm8') return [1,2,3,4,5,6,7,8];
    if(kind==='just7') return [1,5/4,4/3,3/2,5/3,2,7/4];
    if(kind==='pentaM')return [1,9/8,5/4,3/2,5/3];
    if(kind==='octs')  return [0.5,1,2,4];
    return [1];
  }

  // regímenes FM (X)
  function regimeIndexFromX(xNorm, Imax){
    const z=Math.min(0.999,Math.max(0,xNorm)), seg=Math.floor(z*5);
    const ranges=[[0,120],[120,250],[250,600],[600,1200],[1200,2000]];
    const [a,b]=ranges[seg]; const t=(z*5-seg); return Math.min(a+t*(b-a),Imax);
  }

  // afinación 12-TET
  const noteIndex = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  function quantize12TET(fc, A4, keyName, scaleKind){
    const midi = 69 + 12*Math.log2(fc / A4);
    if(scaleKind==='chrom'){
      const mRound = Math.round(midi);
      return A4 * Math.pow(2, (mRound-69)/12);
    }
    const tonic = noteIndex[keyName]||9;
    let mask=[];
    if(scaleKind==='maj')     mask=[0,2,4,5,7,9,11];
    else if(scaleKind==='min')mask=[0,2,3,5,7,8,10];
    else if(scaleKind==='pentaM') mask=[0,2,4,7,9];
    else mask=[...Array(12).keys()];
    const pcTarget = Math.round(midi)%12;
    const oct = Math.floor(Math.round(midi)/12);
    let bestMidi=null, bestDiff=1e9;
    for(let k=-1;k<=1;k++){
      for(const pc of mask){
        const pcAbs=(pc+tonic)%12;
        const m=12*(oct+k)+pcAbs;
        const diff=Math.abs(m - midi);
        if(diff<bestDiff){ bestDiff=diff; bestMidi=m; }
      }
    }
    return A4 * Math.pow(2, (bestMidi-69)/12);
  }

  function updateFMFromPos(px,py,pz){
    if(!audio) return; const {ctx,carrier,mod,modGain}=audio;
    const L=Lhalf;
    // carrier ← Y
    const fmin=+iFcMin.value, fmax=+iFcMax.value;
    let fc = mapLinear(py,-L,L,fmin,fmax);
    if(iTune.checked){ fc = quantize12TET(fc, +iA4.value, iKey.value, iScalePitch.value); }
    carrier.frequency.setTargetAtTime(fc, ctx.currentTime, 0.01);
    // modulador ← Z
    let fm;
    if(iMusical.checked){
      const R=ratioSet(iScale.value);
      const z01 = Math.min(1, Math.max(0, (pz - (-L))/(2*L)));
      const k = Math.max(0, Math.min(R.length-1, Math.round(z01*(R.length-1))));
      fm = Math.max(0.1, fc * R[k]);
    }else{
      const fmmin=+iFmMin.value, fmmax=+iFmMax.value;
      fm = Math.max(fmmin, mapLinear(pz,-L,L,fmmin,fmmax));
    }
    mod.frequency.setTargetAtTime(fm, ctx.currentTime, 0.01);
    // índice ← X
    const Imax=+iIMax.value;
    const x01 = Math.min(1, Math.max(0, (px - (-L))/(2*L)));
    const I = iMusical.checked? regimeIndexFromX(x01,Imax) : Math.max(0, mapLinear(px,-L,L,0,Imax));
    modGain.gain.setTargetAtTime(I, ctx.currentTime, 0.01);
  }

  function updatePanner(px,py,pz){
    if(!audio) return; const {ctx,panner}=audio;
    panner.positionX.setValueAtTime(px, ctx.currentTime);
    panner.positionY.setValueAtTime(py, ctx.currentTime);
    panner.positionZ.setValueAtTime(pz, ctx.currentTime);
  }

  // audio engine
  async function startAudio(){
    if(!audio) audio=await createAudio();
    const {ctx,carrier,mod,outGain}=audio;
    if(ctx.state!=='running') await ctx.resume();
    if(!audio.started){ carrier.start(); mod.start(); audio.started=true; }
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime+0.02);
    audio.running=true;
  }
  async function stopAudio(hard=false){
    if(!audio) return; const {ctx,carrier,mod,outGain}=audio;
    const rel=Math.max(0.01,+iRel.value);
    outGain.gain.cancelScheduledValues(ctx.currentTime);
    outGain.gain.setValueAtTime(outGain.gain.value, ctx.currentTime);
    outGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime+(hard?0.01:rel));
    audio.running=false;
    await new Promise(res=>setTimeout(res,(hard?0.02:rel*1000)+20));
    try{ carrier.stop(); mod.stop(); }catch(_){}
  }

  // Play/Stop
  let running=false;
  btn.onclick=async ()=>{ running=!running; btn.textContent=running?'■ Stop':'▶ Play'; if(running){ await startAudio(); } else { await stopAudio(false); } };
  stage.addEventListener('pointerdown',async ()=>{ if(running){ await startAudio(); } });

  // color reactivo (usa tubeMat/tubeHaloMat ya declarados)
  function setEmitterColor(energy){
    const sens=+iColorSens.value;
    const e=Math.min(1, Math.max(0, energy*sens));
    const r = Math.round(0xdd + e*(0xff-0xdd));
    const g = Math.round(0x22 + e*(0xcc-0x22));
    const b = Math.round(0x22 + e*(0x33-0x22));
    const color = (r<<16)|(g<<8)|b;
    emitterCore.material.color.setHex(color);
    emitterHalo.material.color.setHex(color);
    pl.color.setHex(color);
    emitterCore.material.emissiveIntensity = 0.5 + e*1.5;
    if(tubeMat){ tubeMat.color.setHex(color); tubeMat.emissiveIntensity = 0.3 + e*1.2; }
    if(tubeHaloMat){ tubeHaloMat.color.setHex(color); }
  }

  // loop
  let last=performance.now(), acc=0;
  function animate(){
    requestAnimationFrame(animate);
    const now=performance.now(), dt=(now-last)/1000; last=now;
    const targetSteps=+iSpd.value; acc+=dt*targetSteps;

    let stepsThisFrame=0, moved=false;
    if(running){
      while(acc>=1){
        acc-=1;
        const didMove=stepRandomWalk();
        moved = moved || didMove;
        stepsThisFrame += didMove?1:0;
        const p=gridToWorld(posDiscrete);
        emitter.position.copy(p);
        pushTail(p);
        rebuildTubes();
        if(audio){ updatePanner(p.x,p.y,p.z); updateFMFromPos(p.x,p.y,p.z); }
      }

      // energía para ducking/color
      const energy = Math.min(1, stepsThisFrame / Math.max(1,targetSteps/60));
      setEmitterColor(energy);

      if(audio){
        const {ctx, outGain, wetGain, dryGain} = audio;
        const duck = +iDuck.value * energy;
        const baseOut = 0.06;
        const duckedOut = baseOut * (1 - 0.2*duck);
        const wet = +iWet.value * (1 - 0.8*duck);
        const dry = 1 - wet;
        wetGain.gain.setTargetAtTime(wet, ctx.currentTime, 0.03);
        dryGain.gain.setTargetAtTime(dry, ctx.currentTime, 0.03);
        outGain.gain.setTargetAtTime(duckedOut, ctx.currentTime, 0.03);
      }

      // continuo: micro-silencios en descanso
      if(iCont.checked && audio){
        const {ctx,outGain} = audio;
        if(!moved){
          const rel=Math.max(0.01,+iRel.value);
          outGain.gain.cancelScheduledValues(ctx.currentTime);
          outGain.gain.setTargetAtTime(0.0, ctx.currentTime, rel);
        }else{
          outGain.gain.setTargetAtTime(0.06, audio.ctx.currentTime, 0.02);
        }
      }
    }

    orbit.upd();
    ren.render(scn,cam);
  }
  animate();

  // resize
  window.addEventListener('resize',()=>{ const w2=stage.clientWidth||w; ren.setSize(w2,H); cam.aspect=w2/H; cam.updateProjectionMatrix(); });

}catch(e){
  const pre=document.createElement('pre');
  pre.textContent='ERROR:\n'+(e && (e.stack || e.message || String(e)));
  this.container.appendChild(pre);
}
```

