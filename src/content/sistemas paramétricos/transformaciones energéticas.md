

## Entropy

### Mechanistic view
$$
dS = \frac{\delta Q_{rev}}{T}
$$


- Fórmula: $dS = \frac{\delta Q_{rev}}{T}$
- Viene de la termodinámica clásica. Entropía como cociente entre el calor reversible y la temperatura.
- En nuestro marco, puede modelar procesos musicales como transformaciones energéticas: por ejemplo, la energía acústica que fluye en un sistema (instrumento, performer, espacio) siempre está modulada por una “temperatura” metafórica (condiciones del medio, resistencia, tensión).
- Se traduce en un modelo performático de flujo controlado: cada acción sonora puede leerse como un intercambio de energía reversible o irreversible, donde la pérdida o el residuo (ruido, silencio, distorsión) es análogo a la entropía producida.

### Statistical view
$$
S = k_B \ln \Omega
$$


- Fórmula: $S = k_B \ln \Omega$
- Boltzmann: entropía como medida del número de microestados accesibles ($\Omega$).
- En música, esto permite pensar el espacio de configuraciones posibles de un material (variaciones de ritmo, afinación, timbre). Cuantos más microestados posibles admite un sistema compositivo, mayor es la entropía estética del mismo.
- Se convierte en un modelo generativo: un algoritmo musical puede ser evaluado en términos de cuántos estados posibles genera y cuán distribuida está la exploración de esos estados.

### Informational view
$$
H = -\sum_i p_i \log p_i
$$


- Fórmula: $H = -\sum_i p_i \log p_i$
- Shannon: entropía como medida de la incertidumbre de una fuente de información.
- En el paradigma que desarrollamos, esto se traduce directamente a la métrica de diversidad informacional de una obra: cuán predecible o impredecible es una secuencia sonora.
- Permite trabajar con modelos de escucha: el oyente percibe mayor o menor entropía según la distribución de probabilidades de eventos musicales. Un sistema puede ser entrenado para equilibrar orden y sorpresa a través de este formalismo.


### Síntesis 
	- Mecánico → energía sonora como flujo físico y material.
	- Estadístico → cantidad de configuraciones posibles del material sonoro.
	- Informacional → grado de incertidumbre y sorpresa en la percepción.

los tres niveles no son excluyentes sino complementarios: nos permiten pasar del cuerpo material del sonido (termodinámica) al espacio de posibilidades (estadística) y de ahí al horizonte perceptivo y comunicativo (información).



```dataviewjs
(()=>{
  // === CONFIG ===
  const LILY_DIR="05-obs/lib", LY_NAME="score";
  const widthCm=20, heightCm=5, zoom=1.35;
  const ΔQmin=0.1, ΔQmax=5.0, Tmin=0.2, Tmax=5.0;
  const tickMin=100, tickMax=1000;

  // === UI ===
  const wrap=dv.el("div","");
  wrap.innerHTML=`
    <style>
      .row{margin:6px 0; display:flex; gap:10px; align-items:center; flex-wrap:wrap}
      .mini{font:12px system-ui;color:var(--text-muted)} .num{font:12px ui-monospace}
      .svgwrap{overflow:auto; border:1px solid var(--background-modifier-border); padding:4px}
      .zoom{transform:scale(${zoom}); transform-origin: top left; display:inline-block}
      label{width:28px}
    </style>
    <div class="row"><button id="go">Generar</button><span id="status" class="mini">inactivo</span></div>
    <div class="row">
      <label>ΔQ</label><input id="Q" type="range" min="${ΔQmin}" max="${ΔQmax}" step="0.01" value="1.00"><span id="qV" class="num">1.00</span>
      <label>T</label><input id="T" type="range" min="${Tmin}" max="${Tmax}" step="0.01" value="1.00"><span id="tV" class="num">1.00</span>
      <span id="fx" class="mini">$$ dS = \\frac{\\delta Q_{rev}}{T} = 1.00 $$</span>
    </div>
    <div id="msg" class="mini"></div>
    <div class="svgwrap"><div id="svg" class="zoom"></div></div>
  `;
  const btn=wrap.querySelector("#go"), status=wrap.querySelector("#status");
  const qS=wrap.querySelector("#Q"), tS=wrap.querySelector("#T");
  const qV=wrap.querySelector("#qV"), tV=wrap.querySelector("#tV"), fx=wrap.querySelector("#fx");
  const svgDiv=wrap.querySelector("#svg"), msg=wrap.querySelector("#msg");

  // === OBSIDIAN I/O ===
  const LY_PATH=`${LILY_DIR}/${LY_NAME}.ly`, SVG_PATH=`${LILY_DIR}/${LY_NAME}.svg`;
  function getVaultUrl(rel){ const f=app.vault.getAbstractFileByPath(rel); return f?app.vault.adapter.getResourcePath(f.path):null; }
  async function ensureFolder(dir){ if(!app.vault.getAbstractFileByPath(dir)) await app.vault.createFolder(dir); }
  async function saveLy(text){ await ensureFolder(LILY_DIR); const f=app.vault.getAbstractFileByPath(LY_PATH); if(!f) await app.vault.create(LY_PATH,text); else await app.vault.modify(f,text); }
  function typeset(){ try{ if(window.MathJax?.typeset) MathJax.typeset([fx]); }catch{} }

  // Espera al SVG listo (onload) antes de mostrar
  function showSvgWhenReady(maxTries=80, delay=250){
    let tries=0;
    return new Promise((resolve,reject)=>{
      const loop=()=>{
        const url=getVaultUrl(SVG_PATH);
        if(!url){ tries++; return tries<maxTries? setTimeout(loop,delay): reject(new Error("SVG no existe aún")); }
        const img=new Image();
        img.onload=()=>{ svgDiv.innerHTML=""; svgDiv.appendChild(img); resolve(); };
        img.onerror=()=>{ tries++; tries<maxTries? setTimeout(loop,delay): reject(new Error("No pude cargar el SVG")); };
        img.src=url+"?t="+Date.now();
      };
      loop();
    });
  }

  // === MOTOR ABSOLUTO (C mayor), CLAMP C4..C6 ===
  const scale=['c','d','e','f','g','a','b'];      // 0..6
  const durSet=['16','16.','8','8.','4','4.','2','2.','1'];

  // índice absoluto diatónico: idx = octava*7 + grado, con octava en [4..6]
  const MIN_IDX=4*7+0; // C4
  const MAX_IDX=6*7+0; // C6
  let running=false, melody=[], idxAbs=5*7+0; // seed en C5

  function updateEntropyUI(){
    const Q=+qS.value, T=+tS.value, dS=Q/T;
    qV.textContent=Q.toFixed(2); tV.textContent=T.toFixed(2);
    fx.innerText=`$$ dS = \\\\frac{\\\\delta Q_{rev}}{T} = ${dS.toFixed(2)} $$`; typeset();
    return dS;
  }

  function pickDuration(dS){
    const bias=Math.max(0, Math.min(1, dS/3));
    const base=[1,1,2,2,3,2,1,1,0.5], hot=[2,3,2,3,2,3,2,3,1.5];
    const w=base.map((b,i)=>b*(1-bias)+hot[i]*bias), sum=w.reduce((a,b)=>a+b,0);
    let r=Math.random()*sum; for(let i=0;i<w.length;i++){ if((r-=w[i])<0) return durSet[i]; }
    return '4';
  }

  // pasos diatónicos ±1..±3 (con guardarraíl duro en C4..C6)
  function pickStep(dS){
    const bias=Math.max(0, Math.min(1, dS/3));
    const steps=[-1,1,-2,2,-3,3];
    const wb=[3,3,1.8,1.8,0.9,0.9], wh=[2.2,2.2,2.2,2.2,1.6,1.6];
    const w=wb.map((b,i)=>b*(1-bias)+wh[i]*bias), sum=w.reduce((a,b)=>a+b,0);
    let r=Math.random()*sum; for(let i=0;i<w.length;i++){ if((r-=w[i])<0) return steps[i]; }
    return 1;
  }

  // nombre Lily absoluto con octava explícita (c'==C4)
  function lilyPitchFromIdx(idx){
    // clamp
    if(idx<MIN_IDX) idx=MIN_IDX;
    if(idx>MAX_IDX) idx=MAX_IDX;
    const deg=idx%7, oct=Math.floor(idx/7); // oct: 4=>C4 (c'), 5=>c'', 6=>c'''
    const name=scale[deg];
    const apostrophes = (oct>=4) ? (oct-3) : 0;  // C4 → 1 apóstrofe
    const commas      = (oct<4)  ? (4-oct) : 0;
    return name + (apostrophes? "'".repeat(apostrophes): "") + (commas? ",".repeat(commas): "");
  }

  function buildLilyAbsolute(body){
    return `
\\version "2.24.0"
\\paper {
  tagline = ##f
  paper-width  = #(* ${widthCm} cm)
  paper-height = #(* ${heightCm} cm)
  system-count = #1
}
\\score {
  {
    \\clef treble
    \\key c \\major
    \\cadenzaOn
    ${body}
    \\cadenzaOff
  }
  \\layout { }
}
`.trim();
  }

  async function tick(){
    if(!running) return;
    const dS=updateEntropyUI();
    // propone paso y aplica clamp duro
    let step=pickStep(dS);
    let nextIdx = idxAbs + step;
    if(nextIdx<MIN_IDX) nextIdx=MIN_IDX + Math.floor(Math.random()*3);       // rebote suave
    if(nextIdx>MAX_IDX) nextIdx=MAX_IDX - Math.floor(Math.random()*3);
    idxAbs = Math.max(MIN_IDX, Math.min(MAX_IDX, nextIdx));

    const dur=pickDuration(dS);
    melody.push(`${lilyPitchFromIdx(idxAbs)}${dur}`);
    if(Math.random()<0.18) melody.push('|');

    await saveLy(buildLilyAbsolute(melody.join(' ')));
    msg.textContent=`Guardado ${LILY_DIR}/${LY_NAME}.ly · compilando…`;
    try{ await showSvgWhenReady(100, 200); status.textContent='generando…'; }
    catch(e){ msg.textContent=e.message; }

    const next=tickMin + Math.floor(Math.random()*(tickMax-tickMin));
    setTimeout(tick,next);
  }

  // === Eventos ===
  btn.addEventListener('click', async ()=>{
    if(!running){
      running=true; btn.textContent='Stop'; status.textContent='generando…';
      if(melody.length===0){ melody=['c\'4']; idxAbs=5*7+0; } // seed en C5 → escribe c'4 (C4) para arrancar visible
      await tick();
    } else {
      running=false; btn.textContent='Generar'; status.textContent='inactivo';
    }
  });
  qS.addEventListener('input', updateEntropyUI);
  tS.addEventListener('input', updateEntropyUI);

  // inicial
  updateEntropyUI();
  showSvgWhenReady(2,0).catch(()=>{ /* no-op */ });
})();
```



