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

  const slBias    = mkSlider(0, 1, 0.5, 0.01, 'bias_altura=' );      // 0 graves, 1 agudos
  const slRest    = mkSlider(0, 0.6, 0.2, 0.01, 'p_silencio=' );     // 0..0.6
  const slRVar    = mkSlider(0, 1, 0.55, 0.01, 'var_ritmo='  );      // 0 largas, 1 cortas
  const slDurTot  = mkSlider(2, 30, 8, 0.5, 'dur_total_s=' );        // 2..30 s
  const slNEvents = mkSlider(3, 400, 3, 1, 'n_eventos=', '220px');   // 3..400

  // Checkbox color Newton
  const chkWrap = document.createElement('label'); chkWrap.style.marginLeft = '12px';
  const chk = document.createElement('input'); chk.type='checkbox'; chk.checked=false;
  const chkTxt = document.createElement('span'); chkTxt.textContent=' color Newton';
  chkWrap.appendChild(chk); chkWrap.appendChild(chkTxt); ui.appendChild(chkWrap);

  // Botones
  const btnPlay = document.createElement('button');
  btnPlay.textContent = '▶︎ Play';
  Object.assign(btnPlay.style, {padding:'6px 10px', border:'1px solid #000', background:'#fff', cursor:'pointer'});
  ui.appendChild(btnPlay);

  const btnRegen = document.createElement('button');
  btnRegen.textContent = '↻ Regenerate';
  Object.assign(btnRegen.style, {padding:'6px 10px', border:'1px solid #000', background:'#fff', cursor:'pointer'});
  ui.appendChild(btnRegen);

  // Canvas (partitura)
  const cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H;
  cvs.style.background='#fff'; cvs.style.boxShadow='0 0 0 1px #0002 inset'; cvs.style.display='block'; cvs.style.marginTop='8px';
  wrap.appendChild(cvs);
  root.appendChild(wrap);

  // ---------- Modelo ----------
  const ctx2d = cvs.getContext('2d');
  const MIN_MIDI = 48, MAX_MIDI = 84; // C3..C6
  const SCALE = Array.from({length: (MAX_MIDI - MIN_MIDI + 1)}, (_,i)=>MIN_MIDI + i);

  function samplePitch(bias) {
    // skew exponencial sencillo controlado por bias
    const k = bias < 0.5 ? 2 - (bias*2) : 0.5 + (1 - bias)*1.0;
    const u = Math.random();
    const x = Math.pow(u, k);
    const idx = Math.min(SCALE.length-1, Math.floor(x * SCALE.length));
    return SCALE[idx];
  }

  // Factores de duración relativos al "step" temporal; var→corto/largo
  function sampleDurFactor(var01) {
    // factores que pueden provocar overlap si >1
    const factors = [0.4, 0.8, 1.2, 1.8];
    // pesos: empuja hacia cortas si var01 alto
    const wShort = 0.6*var01 + 0.1;
    const wLong  = 0.6*(1-var01) + 0.1;
    const weights = [0.45*wShort, 0.35, 0.2, 0.55*wLong];
    const sum = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*sum;
    for (let i=0;i<factors.length;i++){ r -= weights[i]; if (r<=0) return factors[i]; }
    return factors[factors.length-1];
  }

  // Genera n eventos dentro de T; starts espaciados; overlap si dur>step.
  function generateSequence(T, bias, pRest, varR, nEvents) {
    const events = [];
    const step = T / nEvents;
    for (let i=0;i<nEvents;i++){
      const t = i * step;
      const dur = sampleDurFactor(varR) * step;
      const isRest = Math.random() < pRest;
      const midi = isRest ? null : samplePitch(bias);
      events.push({ t, dur, midi });
    }
    return events;
  }

  // ---------- Audio ----------
  let AC = null;
  let playing = false;
  let scheduled = [];
  let reverbBuf = null;

  function hz(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }

  function createReverbIR(ctx, seconds=2.2, decay=3.0) {
    const rate = ctx.sampleRate;
    const len = Math.floor(seconds * rate);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch=0; ch<2; ch++){
      const data = buf.getChannelData(ch);
      for (let i=0;i<len;i++){
        const t = i/len;
        // ruido con decaimiento exponencial
        data[i] = (Math.random()*2-1) * Math.pow(1 - t, decay);
      }
    }
    return buf;
  }

  function ensureAC(){
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!reverbBuf) reverbBuf = createReverbIR(AC, 2.4, 3.2);
  }

  function playSeq(seq) {
    ensureAC();
    const t0 = AC.currentTime + 0.05;

    // Master
    const master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);

    // Reverb (fixed 60% wet)
    const convolver = AC.createConvolver(); convolver.buffer = reverbBuf;
    const wet = AC.createGain(); wet.gain.value = 0.60;
    const dry = AC.createGain(); dry.gain.value = 0.40;

    convolver.connect(wet); wet.connect(master);
    // Cada voz enviará a dry y a convolver en paralelo

    // Sched voces
    seq.forEach(ev => {
      if (ev.midi == null || ev.dur <= 0) return;
      const f   = hz(ev.midi);

      const osc1= AC.createOscillator(); osc1.type='sine';     osc1.frequency.value=f;
      const osc2= AC.createOscillator(); osc2.type='triangle'; osc2.frequency.value=f*2;

      const g   = AC.createGain();
      const lpf = AC.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value = 4000;

      osc1.connect(g); osc2.connect(g); g.connect(lpf);

      // split dry/wet
      const splitDry = AC.createGain(); // unity
      lpf.connect(splitDry); splitDry.connect(dry); dry.connect(master);
      const splitWet = AC.createGain(); // unity
      lpf.connect(splitWet); splitWet.connect(convolver);

      // ADSR corto
      const a=0.005, d=0.08, s=0.25, r=0.18;
      const tOn = t0 + ev.t;
      const tOff= tOn + Math.max(0.08, ev.dur);

      g.gain.setValueAtTime(0, tOn);
      g.gain.linearRampToValueAtTime(1.0, tOn+a);
      g.gain.linearRampToValueAtTime(s, tOn+a+d);
      g.gain.setValueAtTime(s, tOff);
      g.gain.linearRampToValueAtTime(0, tOff+r);

      osc1.start(tOn); osc2.start(tOn);
      osc1.stop(tOff+r+0.02); osc2.stop(tOff+r+0.02);

      scheduled.push(osc1,osc2,g,lpf,splitDry,splitWet);
    });

    playing = true;
  }

  function stopAll(){
    if (!AC) return;
    try { AC.close(); } catch {}
    AC = null; playing = false; scheduled = [];
  }

  // ---------- Visualización ----------
  function colorForPitch(midi, colorNewton) {
    if (!colorNewton) return '#000';
    const H = 240 - ((midi - MIN_MIDI) / (MAX_MIDI - MIN_MIDI)) * 240;
    return `hsl(${Math.round(H)}, 90%, 45%)`;
  }

  function drawSeq(seq, colorNewton) {
    ctx2d.clearRect(0,0,W,H);
    // ejes
    ctx2d.strokeStyle = '#000'; ctx2d.lineWidth = 1;
    ctx2d.beginPath(); ctx2d.moveTo(40, 10); ctx2d.lineTo(40, H-20); ctx2d.lineTo(W-10, H-20); ctx2d.stroke();

    // guías Y
    ctx2d.save(); ctx2d.globalAlpha = 0.15;
    for (let m = MIN_MIDI; m <= MAX_MIDI; m += 4) {
      const y = mapY(m);
      ctx2d.beginPath(); ctx2d.moveTo(40, y); ctx2d.lineTo(W-10, y); ctx2d.stroke();
    }
    ctx2d.restore();

    // ticks X
    const T = parseFloat(slDurTot.s.value);
    ctx2d.save(); ctx2d.globalAlpha = 0.25;
    for (let t=0; t<=T; t+=1) {
      const x = mapX(t, T);
      ctx2d.beginPath(); ctx2d.moveTo(x, H-20); ctx2d.lineTo(x, H-24); ctx2d.stroke();
      ctx2d.font = '10px ui-monospace'; ctx2d.fillStyle = '#000'; ctx2d.textAlign='center';
      ctx2d.fillText(String(t), x, H-6);
    }
    ctx2d.restore();

    // eventos
    for (const ev of seq) {
      const x = mapX(ev.t, T);
      const w = Math.max(1, (mapX(ev.t+ev.dur, T) - x));
      if (ev.midi == null){
        // silencio: rectángulo vacío (borde punteado)
        ctx2d.save(); ctx2d.setLineDash([4,4]); ctx2d.strokeStyle='#000'; ctx2d.globalAlpha=0.25;
        ctx2d.strokeRect(x, 20, w, H-40);
        ctx2d.restore();
      } else {
        const y = mapY(ev.midi);
        const h = 6;
        ctx2d.fillStyle = colorForPitch(ev.midi, colorNewton);
        ctx2d.fillRect(x, y - h/2, w, h);
      }
    }

    // etiquetas
    ctx2d.font = '11px ui-monospace'; ctx2d.fillStyle = '#000';
    ctx2d.fillText('tiempo →', W-70, H-26);
    ctx2d.save(); ctx2d.translate(12, H/2); ctx2d.rotate(-Math.PI/2);
    ctx2d.fillText('altura (MIDI) ↑', 0, 0);
    ctx2d.restore();
  }

  function mapX(t, T){ return 40 + (W-60) * (t / T); }
  function mapY(m){ const r = (m - MIN_MIDI) / (MAX_MIDI - MIN_MIDI); return (H-20) - r*(H-40); }

  // ---------- Estado + regeneración ----------
  function regenAndRedraw(){
    [slBias, slRest, slRVar, slDurTot, slNEvents].forEach(s=>s.set(s.s.value));
    currentSeq = generateSequence(
      parseFloat(slDurTot.s.value),
      parseFloat(slBias.s.value),
      parseFloat(slRest.s.value),
      parseFloat(slRVar.s.value),
      parseInt(slNEvents.s.value,10)
    );
    drawSeq(currentSeq, chk.checked);
  }

  let currentSeq = [];
  regenAndRedraw();

  [slBias.s, slRest.s, slRVar.s, slDurTot.s, slNEvents.s, chk].forEach(el => el.addEventListener('input', regenAndRedraw));
  btnRegen.addEventListener('click', () => {
    if (playing){ stopAll(); btnPlay.textContent='▶︎ Play'; }
    regenAndRedraw();
  });

  btnPlay.addEventListener('click', () => {
    if (!playing) {
      btnPlay.textContent = '■ Stop';
      playSeq(currentSeq);
      const T = parseFloat(slDurTot.s.value);
      setTimeout(()=>{ stopAll(); btnPlay.textContent = '▶︎ Play'; }, (T+0.5)*1000);
    } else {
      stopAll();
      btnPlay.textContent = '▶︎ Play';
    }
  });
})();
```




## Controles del sistema probabilístico

### 1. bias_altura
Este control regula el **sesgo de la distribución de alturas** entre graves y agudos.  
Cuando $bias=0$ la probabilidad se concentra en las notas graves, mientras que con $bias=1$ se concentra en las agudas.  
El muestreo se realiza transformando una variable uniforme $u \in [0,1]$ en un índice de nota mediante una potencia:

$$
x = u^k, \qquad idx = \lfloor x \cdot N \rfloor
$$

donde $N$ es el número de notas posibles y $k$ depende de $bias$ (valores mayores de $k$ sesgan hacia graves, menores de $k$ hacia agudos).

---

### 2. p_silencio
Define la **probabilidad de que un evento sea un silencio** en lugar de una nota.  
Se modela como una variable Bernoulli:

$$
P(\text{silencio}) = p, \quad P(\text{nota}) = 1-p
$$

De esta forma, al incrementar $p$ se introducen más espacios en blanco dentro de la secuencia.

---

### 3. var_ritmo
Controla la **variabilidad rítmica**: hacia $0$ predomina la duración larga, hacia $1$ predominan las duraciones cortas.  
La duración se elige entre un conjunto discreto $D=\{d_1, d_2, d_3, d_4\}$ con pesos $w_i$ dependientes de $var\_ritmo$:

$$
P(d_i) = \frac{w_i(var\_ritmo)}{\sum_j w_j(var\_ritmo)}
$$

Esto implementa un proceso estocástico donde la densidad de notas aumenta con valores altos del control.

---

### 4. dur_total_s
Define la **duración total de la secuencia** en segundos.  
Las duraciones relativas seleccionadas estocásticamente se normalizan para ajustarse a este tiempo:

$$
s = \frac{T}{\sum_{i=1}^n d_i}, \qquad d_i' = s \cdot d_i
$$

donde $T$ es la duración total especificada, $d_i$ las duraciones generadas y $d_i'$ las duraciones finales escaladas.

---

## Resumen
- **bias_altura ($bias$):** transforma la distribución uniforme de notas en una distribución sesgada hacia graves o agudos.  
- **p_silencio ($p$):** probabilidad directa de silencio.  
- **var_ritmo:** ajusta las distribuciones de duraciones mediante pesos dinámicos.  
- **dur_total_s ($T$):** asegura que la secuencia completa ocupe exactamente $T$ segundos.