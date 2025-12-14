
Esta conexión –ADN como ácido de la vida, ácidos en uranio como ácido de la energía nuclear, y fermentación como ácido de la transformación orgánica– es poética y válida filosóficamente: sugiere que la acidez es un principio unificador, un "campo difuso" donde la materia se reorganiza para complejidad mayor, desde átomos a conciencia. No es coincidencia; es cómo la química subyace a la "organización" del cosmos. Si profundizas, lee sobre filosofía de la química para más insights.

Ácido no es “la primera sustancia” del cosmos. Tras el Big Bang solo aparecen $^1$H, $^4$He y trazas de $^7$Li; “acidez” exige ya química molecular y, en la práctica biológica, un medio donde definir $[H^+]$ y $pH=-\log_{10}[H^+]$. En química hay dos nociones compatibles: Brønsted-Lowry (ácido=donor de $H^+$, base=aceptor de $H^+$) y Lewis (ácido=aceptor de par electrónico, base=donor de par electrónico). Muchas especies son ambas cosas según el contexto (p.ej. $H^+$ es Brønsted ácido y Lewis ácido porque acepta un par electrónico para formar enlace). Biológicamente, los gradientes de $H^+$ sostienen quimiosmosis: $Δμ_{H^+}=Δψ-2.303,RT/F·ΔpH$ impulsa síntesis y transporte. Teleología: ninguna requerida; hay condiciones fuera de equilibrio que estabilizan ciclos materia-energía-información.

Controles generativos mínimos desde pensamiento computacional
- Relojes y contadores: tick discreto/continuo, división, mod, phase-locked loops
- Autómatas finitos y máquinas de estados: reglas locales, transición y salida
- Event streams y reactividad: suscripción, filtrado, throttling, debouncing
- Retroalimentación y control: PID, compuertas, homeostasis de recursos
- Estocasticidad: Poisson, Bernoulli, ruido 1/f, caminatas
- Campos y difusión: grillas, gradientes, reacción-difusión
- Agentes y juegos: payoff, cooperación/competencia, scheduling
- Gramáticas/reescritura: L-systems, grafos, reglas productivas
- Conservación de recursos: presupuestos, colas, inventarios
- Caos y complejidad: mapas logísticos, acoplamientos de Kuramoto

# casos

##  “metabolismo” mínimo con un reloj (contador)
un gradiente protónico simulado, y una reacción que se dispara cuando $ΔpH$ supera umbral. 


```dataviewjs
// === SETUP (editables) ===
const P={fps:20,seed:40,thr:0.7,drift:0.003,pump:0.2,leak:0.05};
const RUL={pump:t=>P.pump*(0.5+0.5*Math.sin(2*Math.PI*(t/64))),
           react:s=>{if(s.dpH>P.thr){s.atp++;s.energy+=s.dpH;s.dpH*=0.35;s.pulse=2;return 1}return 0}};
// === DIBUJO (caja negra) ===
function draw(el,st){
  if(!el.canvas){const c=document.createElement('canvas');c.width=600;c.height=140;el.appendChild(c);el.canvas=c}
  const cx=el.canvas.getContext('2d'),W=el.canvas.width,H=el.canvas.height;
  cx.clearRect(0,0,W,H);cx.fillStyle='#111';cx.fillRect(0,0,W,H);
  cx.fillStyle='#aaa';cx.fillRect(40,30,2,H-60);cx.fillRect(40,H-30,W-80,2);
  cx.fillStyle='#fff';cx.fillText(`tick:${st.t}  ΔpH:${st.dpH.toFixed(3)}  ATP:${st.atp}  E:${st.energy.toFixed(2)}`,50,20);
  cx.strokeStyle='#6cf';cx.lineWidth=2;cx.beginPath();const L=st.hist.length,K=W-80;
  for(let i=0;i<L;i++){const x=40+(i/(L-1))*K,y=H-30-(st.hist[i]*(H-80));i?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke();
  cx.setLineDash([6,6]);cx.strokeStyle='#f66';cx.beginPath();
  cx.moveTo(40,H-30-(P.thr*(H-80)));cx.lineTo(W-40,H-30-(P.thr*(H-80)));cx.stroke();cx.setLineDash([]);
  if(st.pulse>0){cx.fillStyle='rgba(255,255,255,0.25)';cx.fillRect(0,0,W,H);st.pulse--}
}
// === RNG, ESTADO, DOM ===
function rng(sd){let s=sd>>>0;return ()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}}
const rnd=rng(P.seed), el=dv.container;el.style.border='1px solid #333';el.style.padding='6px';el.style.fontFamily='ui-monospace,monospace';
const S={t:0,dpH:0.5,atp:0,energy:0,hist:Array(120).fill(0.5),pulse:0};
// === AUDIO: toggle fiable + filtros fuertes dependientes de ΔpH ===
function makeAudio(){
  const A={};A.ac=new (window.AudioContext||window.webkitAudioContext)();
  const master=A.ac.createGain();master.gain.value=0.5; // master 50%
  const env=A.ac.createGain();env.gain.value=0.0;
  // ruido blanco -> IIR pink -> HPF -> LPF -> env -> master -> dest
  const buf=A.ac.createBuffer(1,A.ac.sampleRate*2,A.ac.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const src=A.ac.createBufferSource();src.buffer=buf;src.loop=true;
  const ff=new Float32Array([0.049922,0.095993,0.050612,-0.004408]);
  const fb=new Float32Array([1.0,-2.494956,2.017265,-0.522189]);
  const iir=A.ac.createIIRFilter(ff,fb);
  const hpf=A.ac.createBiquadFilter();hpf.type='highpass';hpf.frequency.value=60;hpf.Q.value=0.7;
  const lpf=A.ac.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=1200;lpf.Q.value=0.7;
  src.connect(iir).connect(hpf).connect(lpf).connect(env).connect(master).connect(A.ac.destination);src.start();
  A.src=src;A.iir=iir;A.hpf=hpf;A.lpf=lpf;A.env=env;A.master=master;return A;
}
function ensureButton(){
  if(el.btn) return;const b=document.createElement('button');b.textContent='Audio: OFF';b.style.margin='6px';
  b.onclick=async()=>{
    if(!el.A){el.A=makeAudio();b.textContent='Audio: ON';return}
    if(el.A.ac.state==='running'){await el.A.ac.suspend();b.textContent='Audio: OFF'}else{await el.A.ac.resume();b.textContent='Audio: ON'}
  };
  el.appendChild(b);el.btn=b;
}
ensureButton();
// === STEP LOOP ===
function step(){
  if(!document.body.contains(el)){clearInterval(el._loop);return}
  S.t++;const infl=RUL.pump(S.t)+P.drift+(rnd()-0.5)*0.01, out=P.leak*S.dpH;
  S.dpH=Math.max(0,Math.min(1,S.dpH+infl-out));RUL.react(S);
  S.hist.push(S.dpH);if(S.hist.length>120)S.hist.shift();draw(el,S);
  if(el.A){const now=el.A.ac.currentTime, x=S.dpH;
    // envolvente -> gain y filtro (más pronunciado)
    el.A.env.gain.setTargetAtTime(0.01+0.75*x,now,0.05);                // más nivel con ΔpH
    el.A.lpf.frequency.setTargetAtTime(200+9000*Math.pow(x,3),now,0.05); // abre fuerte con ΔpH
    el.A.lpf.Q.setTargetAtTime(0.5+10*x*x,now,0.08);
    el.A.hpf.frequency.setTargetAtTime(20+1500*Math.pow(1-x,3),now,0.05);// cierra graves cuando ΔpH bajo
    el.A.hpf.Q.setTargetAtTime(0.6+6*(1-x)*(1-x),now,0.08);
  }
}
draw(el,S);
if(el._loop) clearInterval(el._loop);
el._loop=setInterval(step,1000/P.fps);
```




##  protonación de un carboxilato proteico (–COO⁻⇄–COOH)

 análogo a cómo $H^+$ se une a Asp/Glu del rotor de la ATP sintasa y gatilla un cambio conformacional. Lo controlamos con Henderson–Hasselbalch: $f_{prot}=1/(1+10^{(pH-pK_a)})$.

slider de $pK_a$ (5–9) que regula la sensibilidad del encuentro


```dataviewjs
// === PARAMS (live) ===
const P={fps:20,seed:42,thr:0.7,drift:0.003,pump:0.02,leak:0.015,pKa:6.5};
const SLIDERS=[
  {k:'thr',min:0.3,max:0.95,step:0.01,label:'threshold',hint:'ΔpH level that triggers ATP (ionic encounter). Lower = more frequent bursts.'},
  {k:'drift',min:-0.01,max:0.01,step:0.0005,label:'drift',hint:'Slow bias (environmental push). Positive = net acidifying drift.'},
  {k:'pump',min:0.0,max:0.05,step:0.001,label:'pump',hint:'Proton pumping amplitude (energy input).'},
  {k:'leak',min:0.001,max:0.04,step:0.001,label:'leak',hint:'Membrane leak (dissipation speed).'},
  {k:'pKa',min:5.0,max:9.0,step:0.1,label:'pKa',hint:'Asp/Glu effective pKa for protonation.'}
];
// === RULES ===
const RUL={pump:t=>P.pump*(0.5+0.5*Math.sin(2*Math.PI*(t/64))),
           react:s=>{if(s.dpH>P.thr){s.atp++;s.energy+=s.dpH;s.dpH*=0.35;s.pulse=2;s.shock=1;return 1}return 0}};

// === ROOT LAYOUT: column; slider row above canvas ===
const root=dv.container;
Object.assign(root.style,{background:'transparent',fontFamily:'ui-monospace,monospace',display:'flex',flexDirection:'column',gap:'8px'});

// === SLIDER ROW (own flex space, no overlap) ===
const uiWrap=document.createElement('div');
Object.assign(uiWrap.style,{display:'flex',gap:'0',alignItems:'flex-end',background:'transparent',height:'120px',position:'relative'});
const tip=document.createElement('div');
Object.assign(tip.style,{position:'absolute',zIndex:10,display:'none',maxWidth:'280px',padding:'6px 8px',background:'rgba(0,0,0,0.85)',color:'#fff',fontSize:'12px',borderRadius:'6px',pointerEvents:'none'});
uiWrap.appendChild(tip);
function showTip(txt,x,y){const R=uiWrap.getBoundingClientRect();tip.textContent=txt;tip.style.left=(x-R.left+10)+'px';tip.style.top=(y-R.top+10)+'px';tip.style.display='block'}
function hideTip(){tip.style.display='none'}
SLIDERS.forEach((s,i)=>{const sl=document.createElement('input');sl.type='range';sl.min=s.min;sl.max=s.max;sl.step=s.step;sl.value=P[s.k];
  Object.assign(sl.style,{transform:'rotate(-90deg)',width:'120px',margin:'0',padding:'0',background:'transparent',appearance:'none'});
  const col=`hsl(${i*60},80%,60%)`;sl.style.setProperty('--c',col);sl.style.background='linear-gradient(var(--c),var(--c)) no-repeat center/2px 100%';
  sl.oninput=e=>P[s.k]=parseFloat(e.target.value);
  sl.onmouseenter=e=>showTip(`${s.label}: ${s.hint}`,e.clientX,e.clientY);
  sl.onmousemove=e=>showTip(`${s.label}: ${s.hint}`,e.clientX,e.clientY);
  sl.onmouseleave=hideTip;uiWrap.appendChild(sl);
});
const btnRow=document.createElement('div');
Object.assign(btnRow.style,{display:'flex',gap:'8px',marginLeft:'8px',alignItems:'center'});
const btnAudio=document.createElement('button');btnAudio.textContent='Audio: OFF';
const btnIon=document.createElement('button');btnIon.textContent='Ionic event';
btnRow.append(btnAudio,btnIon);root.append(uiWrap,btnRow);

// === CANVAS (separate below UI) ===
const canvas=document.createElement('canvas');canvas.width=720;canvas.height=200;canvas.style.background='transparent';root.appendChild(canvas);
const cx=canvas.getContext('2d');

// === RNG, STATE ===
function rng(sd){let s=sd>>>0;return ()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}}
const rnd=rng(P.seed);
const S={t:0,dpH:0.5,atp:0,energy:0,hist:Array(200).fill(0.5),pulse:0,shock:0,particles:[]};

// === AUDIO graph ===
function pinkShaper(ac,amt=0.5){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){let x=i*2/n-1;c[i]=Math.tanh(x*(1+9*amt))}const ws=ac.createWaveShaper();ws.curve=c;ws.oversample='4x';return ws}
function makeAudio(){
  const A={};A.ac=new (window.AudioContext||window.webkitAudioContext)();
  const m=A.ac.createGain();m.gain.value=0.5;
  const env=A.ac.createGain();env.gain.value=0.0;
  const dry=A.ac.createGain();dry.gain.value=1.0;
  const wet=A.ac.createGain();wet.gain.value=0.0;
  const band=A.ac.createBiquadFilter();band.type='bandpass';band.frequency.value=400;band.Q.value=1.0;
  const sh=pinkShaper(A.ac,0.0);
  const buf=A.ac.createBuffer(1,A.ac.sampleRate*2,A.ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  const src=A.ac.createBufferSource();src.buffer=buf;src.loop=true;
  const ff=new Float32Array([0.049922,0.095993,0.050612,-0.004408]),fb=new Float32Array([1.0,-2.494956,2.017265,-0.522189]);
  const iir=A.ac.createIIRFilter(ff,fb),hpf=A.ac.createBiquadFilter(),lpf=A.ac.createBiquadFilter();
  hpf.type='highpass';hpf.frequency.value=60;hpf.Q.value=0.7;lpf.type='lowpass';lpf.frequency.value=1200;lpf.Q.value=0.7;
  const burst=A.ac.createGain();burst.gain.value=0.0;const burstSrc=A.ac.createBufferSource();burstSrc.buffer=buf;burstSrc.loop=true;
  src.connect(iir).connect(hpf).connect(lpf).connect(env);env.connect(dry).connect(m).connect(A.ac.destination);
  env.connect(sh).connect(wet).connect(m);env.connect(band).connect(m);burstSrc.connect(band);burstSrc.connect(wet);
  src.start();burstSrc.start();Object.assign(A,{m,env,dry,wet,band,sh,hpf,lpf,src,burst,burstSrc});return A}
let A=null;btnAudio.onclick=async()=>{if(!A){A=makeAudio();btnAudio.textContent='Audio: ON';return}
  if(A.ac.state==='running'){await A.ac.suspend();btnAudio.textContent='Audio: OFF'}else{await A.ac.resume();btnAudio.textContent='Audio: ON'}};

// === HELPERS ===
function yFromDpH(dpH){const H=canvas.height;return H-30-(dpH*(H-60))}

// === DRAW ===
function draw(){
  const W=canvas.width,H=canvas.height;cx.clearRect(0,0,W,H);
  cx.fillStyle='#ccc';cx.fillRect(40,28,2,H-56);cx.fillRect(40,H-30,W-80,2);
  cx.fillStyle='#fff';cx.fillText(`tick:${S.t}  ΔpH:${S.dpH.toFixed(3)}  ATP:${S.atp}  E:${S.energy.toFixed(2)}  pKa:${P.pKa.toFixed(1)}`,50,20);
  cx.beginPath();const L=S.hist.length,K=W-80;for(let i=0;i<L;i++){const x=40+(i/(L-1))*K,y=yFromDpH(S.hist[i]);i?cx.lineTo(x,y):cx.moveTo(x,y)}cx.strokeStyle='#6cf';cx.lineWidth=2;cx.stroke();
  cx.setLineDash([6,6]);cx.strokeStyle='#f66';cx.beginPath();cx.moveTo(40,yFromDpH(P.thr));cx.lineTo(W-40,yFromDpH(P.thr));cx.stroke();cx.setLineDash([]);
  // shockwave glued to current envelope vertical position
  if(S.shock>0){
    const cx0=W*0.5, cy0=yFromDpH(S.dpH); // follow ΔpH vertically every frame
    const r=S.shock*(W*0.45), alpha=Math.max(0,1.0-S.shock);
    cx.beginPath();cx.arc(cx0,cy0,r,0,Math.PI*2);cx.strokeStyle=`rgba(255,220,160,${alpha})`;cx.lineWidth=6*(1-S.shock)+1;cx.stroke();
    S.shock*=0.92;if(S.shock<0.01) S.shock=0;
  }
  for(let i=S.particles.length-1;i>=0;i--){const p=S.particles[i];p.x+=p.vx;p.y+=p.vy;p.vy*=0.98;p.life-=0.02;
    cx.fillStyle=`rgba(255,200,130,${Math.max(0,p.life)})`;cx.fillRect(p.x,p.y,2,2);if(p.life<=0) S.particles.splice(i,1)}
  if(S.pulse>0){cx.fillStyle='rgba(255,255,255,0.25)';cx.fillRect(0,0,W,H);S.pulse--}
}

// === IONIC ENCOUNTER (H + Asp/Glu) glued vertically to envelope ===
function triggerIon(force=false){
  if(!A||A.ac.state!=='running') return;
  const pH=9-4*S.dpH, fProt=1/(1+Math.pow(10,(pH-P.pKa))), now=A.ac.currentTime, x=fProt;
  A.env.gain.setTargetAtTime(0.02+0.7*S.dpH,now,0.02);
  A.lpf.frequency.setTargetAtTime(600+12000*Math.pow(S.dpH,3),now,0.025);
  A.lpf.Q.setTargetAtTime(0.8+12*S.dpH*S.dpH,now,0.05);
  A.hpf.frequency.setTargetAtTime(20+1600*Math.pow(1-S.dpH,2),now,0.025);
  A.hpf.Q.setTargetAtTime(0.6+6*(1-S.dpH)*(1-S.dpH),now,0.05);
  A.band.frequency.setValueAtTime(200,now);A.band.frequency.exponentialRampToValueAtTime(4000, now+0.18+0.35*x);
  A.band.Q.setValueAtTime(0.7,now);A.band.Q.linearRampToValueAtTime(8.0, now+0.18+0.35*x);
  A.wet.gain.cancelScheduledValues(now);A.wet.gain.setValueAtTime(0.0,now);
  A.wet.gain.linearRampToValueAtTime(0.1+0.9*x, now+0.03);A.wet.gain.exponentialRampToValueAtTime(0.02, now+0.35+0.4*x);
  A.sh.curve=pinkShaper(A.ac,0.25+0.7*x).curve;
  // particles originate exactly at current envelope vertical position
  const W=canvas.width, cx0=W*0.5, cy0=yFromDpH(S.dpH); S.shock=0.05+0.95*x;
  const N=60+Math.floor(180*x); for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2, sp=1.5+3*Math.random()*x;
    S.particles.push({x:cx0,y:cy0,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0.8+0.6*Math.random()})}
}
btnIon.onclick=()=>triggerIon(true);

// === LOOP ===
function step(){
  if(!document.body.contains(root)){clearInterval(root._loop);return}
  S.t++;const infl=RUL.pump(S.t)+P.drift+(rnd()-0.5)*0.01, out=P.leak*S.dpH;
  S.dpH=Math.max(0,Math.min(1,S.dpH+infl-out));const fired=RUL.react(S);
  S.hist.push(S.dpH);if(S.hist.length>200)S.hist.shift();
  if(A){const now=A.ac.currentTime,x=S.dpH;
    A.env.gain.setTargetAtTime(0.01+0.6*x,now,0.05);
    A.lpf.frequency.setTargetAtTime(200+9000*Math.pow(x,3),now,0.05);
    A.lpf.Q.setTargetAtTime(0.5+10*x*x,now,0.08);
    A.hpf.frequency.setTargetAtTime(20+1500*Math.pow(1-x,3),now,0.05);
    A.hpf.Q.setTargetAtTime(0.6+6*(1-x)*(1-x),now,0.08);
    if(fired) triggerIon(false);
  }
  draw();
}
draw(); if(root._loop) clearInterval(root._loop); root._loop=setInterval(step,1000/P.fps);
```


- Modificar pump, leak, threshold para observar regímenes: sin reacción (agotamiento), oscilación homeostática, estallidos con recuperación.
- Pedir que mapeen eventos ATP a acentos rítmicos: tempo≈tempoBase·(1+energy/k). Quien quiera, agrega un oscilador WebAudio en un bloque aparte.
- Extender rules.react para consumir “recurso” y producir “residuo”, o para acoplar dos compartimentos (gradiente compartido).
Siguientes supracapas
- FSM de tres estados: reposo, bombeo, reacción; transiciones por ΔpH y tiempo mínimo en estado
- Dos compartimentos acoplados por difusión: gradiente espacial 1D (cola circular)
- Un agente “base” (aceptor de H+) que compita por H+; estudiar ciclos límite y punto fijo



