#operativos/sistemasparamétricos 
```dataviewjs
(async () => {
  // ---------- UI ----------
  const root = (typeof dv !== 'undefined' && dv.container) ? dv.container : this.container;
  const W = Math.min(840, window.innerWidth * 0.95), H = 320;

  const wrap = document.createElement('div'); wrap.style.margin = '8px 0';
  const ui   = document.createElement('div');
  ui.style.display = 'flex'; ui.style.flexWrap = 'wrap'; ui.style.gap = '10px'; ui.style.alignItems = 'center';
  wrap.appendChild(ui);

  function mkSlider(min, max, val, step, label, width='160px') {
    const box = document.createElement('label'); box.style.display='flex'; box.style.alignItems='center'; box.style.gap='8px';
    const span = document.createElement('span'); span.textContent = `${label}${val}`; span.style.fontFamily='ui-monospace';
    const s = document.createElement('input');
    s.type='range'; s.min=min; s.max=max; s.step=step; s.value=val; s.style.width=width;
    box.appendChild(span); box.appendChild(s); ui.appendChild(box);
    return { s, span, set(v){ span.textContent = `${label}${v}`; } };
  }

  const slTemp    = mkSlider(0.1, 5, 1, 0.1, 'T (temperatura)=' ); 
  const slRest    = mkSlider(0, 0.6, 0.2, 0.01, 'p_silencio=' );     
  const slDurTot  = mkSlider(2, 30, 8, 0.5, 'dur_total_s=' );        
  const slNEvents = mkSlider(3, 400, 20, 1, 'n_eventos=', '220px');   

  const btnPlay = document.createElement('button');
  btnPlay.textContent = '▶︎ Play';
  Object.assign(btnPlay.style, {padding:'6px 10px', border:'1px solid #000', background:'#fff', cursor:'pointer'});
  ui.appendChild(btnPlay);

  const btnRegen = document.createElement('button');
  btnRegen.textContent = '↻ Regenerate';
  Object.assign(btnRegen.style, {padding:'6px 10px', border:'1px solid #000', background:'#fff', cursor:'pointer'});
  ui.appendChild(btnRegen);

  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  cvs.style.background='#fff'; cvs.style.boxShadow='0 0 0 1px #0002 inset'; cvs.style.display='block'; cvs.style.marginTop='8px';
  wrap.appendChild(cvs);
  root.appendChild(wrap);

  // ---------- Modelo ----------
  const ctx2d = cvs.getContext('2d');
  const MIN_MIDI = 48, MAX_MIDI = 84; 

  function hz(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }

  // Boltzmann-like distribution: P(E) ∝ exp(-E/T)
  function boltzmannSample(T) {
    const domain = [];
    for(let m=MIN_MIDI;m<=MAX_MIDI;m++){ 
      const E = (m-MIN_MIDI)/(MAX_MIDI-MIN_MIDI);
      domain.push({m,E});
    }
    const probs = domain.map(d => Math.exp(-d.E/T));
    const sum = probs.reduce((a,b)=>a+b,0);
    let r = Math.random()*sum;
    for(let i=0;i<domain.length;i++){ r -= probs[i]; if(r<=0) return domain[i].m; }
    return domain[domain.length-1].m;
  }

  function generateSeq(Tsec, Temp, pRest, nEvents){
    const events=[];
    const step=Tsec/nEvents;
    for(let i=0;i<nEvents;i++){
      const t=i*step;
      const dur=step*(0.8+Math.random()*0.6);
      const isRest=Math.random()<pRest;
      const midi=isRest?null:boltzmannSample(Temp);
      events.push({t,dur,midi});
    }
    return events;
  }

  // ---------- Audio ----------
  let AC=null; let playing=false; let reverbBuf=null;
  function createReverbIR(ctx, seconds=2, decay=2){
    const len=Math.floor(seconds*ctx.sampleRate);
    const buf=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const d=buf.getChannelData(ch);
      for(let i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); }
    }
    return buf;
  }

  function ensureAC(){
    if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)();
    if(!reverbBuf) reverbBuf=createReverbIR(AC,2.4,3.2);
  }

  function playSeq(seq){
    ensureAC();
    const t0=AC.currentTime+0.05;
    const master=AC.createGain(); master.gain.value=0.9;
    const limiter=AC.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-6, AC.currentTime);
    limiter.knee.setValueAtTime(1, AC.currentTime);
    limiter.ratio.setValueAtTime(20, AC.currentTime);
    limiter.attack.setValueAtTime(0.001, AC.currentTime);
    limiter.release.setValueAtTime(0.05, AC.currentTime);
    master.connect(limiter).connect(AC.destination);

    const convolver=AC.createConvolver(); convolver.buffer=reverbBuf;
    const wet=AC.createGain(); wet.gain.value=0.6;
    const dry=AC.createGain(); dry.gain.value=0.4;
    convolver.connect(wet); wet.connect(master);

    seq.forEach(ev=>{
      if(ev.midi==null) return;
      const f=hz(ev.midi);
      const osc=AC.createOscillator(); osc.type='sine'; osc.frequency.value=f;
      const g=AC.createGain();
      osc.connect(g); g.connect(dry); g.connect(convolver);
      const a=0.01, d=0.08, s=0.3, r=0.15;
      const tOn=t0+ev.t, tOff=tOn+ev.dur;
      g.gain.setValueAtTime(0,tOn);
      g.gain.linearRampToValueAtTime(1,tOn+a);
      g.gain.linearRampToValueAtTime(s,tOn+a+d);
      g.gain.setValueAtTime(s,tOff);
      g.gain.linearRampToValueAtTime(0,tOff+r);
      osc.start(tOn); osc.stop(tOff+r+0.05);
    });
    playing=true;
  }
  function stopAll(){ if(!AC)return; try{AC.close();}catch{} AC=null; playing=false; }

  // ---------- Visual ----------
  function mapX(t,Tsec){ return 40+(W-60)*(t/Tsec); }
  function mapY(m){ const r=(m-MIN_MIDI)/(MAX_MIDI-MIN_MIDI); return (H-20)-r*(H-40); }
  function drawSeq(seq){
    ctx2d.clearRect(0,0,W,H);
    ctx2d.fillStyle='#000';
    seq.forEach(ev=>{
      if(ev.midi==null) return;
      const x=mapX(ev.t,parseFloat(slDurTot.s.value));
      const w=(mapX(ev.t+ev.dur,parseFloat(slDurTot.s.value))-x);
      const y=mapY(ev.midi);
      ctx2d.fillRect(x,y-3,w,6);
    });
  }

  // ---------- Estado ----------
  let currentSeq=[];
  function regen(){
    [slTemp,slRest,slDurTot,slNEvents].forEach(s=>s.set(s.s.value));
    currentSeq=generateSeq(parseFloat(slDurTot.s.value),parseFloat(slTemp.s.value),parseFloat(slRest.s.value),parseInt(slNEvents.s.value));
    drawSeq(currentSeq);
  }
  regen();
  [slTemp.s,slRest.s,slDurTot.s,slNEvents.s].forEach(el=>el.addEventListener('input',regen));
  btnRegen.addEventListener('click',regen);
  btnPlay.addEventListener('click',()=>{ if(!playing){ playSeq(currentSeq); btnPlay.textContent='■ Stop'; setTimeout(()=>{stopAll();btnPlay.textContent='▶︎ Play';}, (parseFloat(slDurTot.s.value)+0.5)*1000);} else { stopAll(); btnPlay.textContent='▶︎ Play'; } });
})();
```



Las máquinas de Boltzmann provienen de la física estadística y se aplican a redes neuronales y procesos estocásticos para modelar sistemas con muchas variables interdependientes.

La idea fundamental es que **la probabilidad de un estado depende de su energía relativa y de una temperatura global** que regula el grado de aleatoriedad. 

En música, esta metáfora permite generar secuencias de eventos donde la “altura” (frecuencia de una nota) puede pensarse como un **estado**, y su selección sigue una distribución de Boltzmann: los estados con menor energía son más probables, pero estados de mayor energía también aparecen con cierta probabilidad, especialmente cuando la “temperatura” es alta.

En el ejemplo interactivo, cada evento musical (una nota o un silencio) se genera siguiendo esta distribución.

La temperatura controla la dispersión de alturas: con temperatura baja el sistema se concentra en pocas alturas cercanas (estados de baja energía), mientras que con temperatura alta se exploran alturas en todo el rango. Esto refleja el principio de exploración/explotación de los sistemas estocásticos. Los silencios se introducen como probabilidad independiente, de manera que no todo evento se traduce en sonido. Además, se puede ajustar la cantidad total de eventos y la duración global de la secuencia, lo que influye en la densidad y en el grado de superposición de sonidos.

Para evitar saturación acústica cuando hay muchos eventos simultáneos, se incluye un limitador antes de la salida de audio, lo que simula el rol de un sistema dinámico de compresión: incluso cuando el número de notas crece de manera explosiva, el resultado sonoro mantiene un rango controlado. Esta combinación de probabilidad, energía y control dinámico traduce la noción de máquina de Boltzmann en un instrumento generativo y musicalmente exploratorio.

---


- Temperatura $T$:
$$P(E) \propto e^{-E/T}$$
Alturas bajas (energía baja) son más probables con $T$ pequeño. Con $T$ alto, la distribución se aplana.
- Probabilidad de silencio $p_{rest}$:
$$P(\text{silencio}) = p_{rest}, \quad P(\text{nota}) = 1-p_{rest}$$
- Duración total $T_{sec}$:
Secuencia ocupa $[0,T_{sec}]$ segundos. El espaciamiento base es
$$\Delta t = \frac{T_{sec}}{N}$$
- Número de eventos $N$:
Cantidad total de notas o silencios. Las duraciones se escalan alrededor de $\Delta t$, generando posibles solapamientos.