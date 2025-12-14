

# audio-alpaca


```dataviewjs
/***********************************************************************
  Audio-Alpaca + Ollama semantic search viewer (con WebAudio FX)
***********************************************************************/
const UI = dv.container;
UI.style.fontFamily = 'ui-monospace,monospace';
UI.style.maxWidth = '900px';
UI.innerHTML = '<h3 style="margin-bottom:6px;">🔎 Búsqueda semántica — Audio-Alpaca + Ollama (con FX WebAudio)</h3>';

const HF_BASE = "https://datasets-server.huggingface.co";
const DS = "declare-lab/audio-alpaca";
const CFG = "default";
const SPLIT = "train";

const OLLAMA = "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text"; // asegurate de tenerlo

/* ======= UI superior ======= */
const rowTop = document.createElement('div');
Object.assign(rowTop.style,{display:'grid',gridTemplateColumns:'1fr auto auto',gap:'8px'});
UI.appendChild(rowTop);

const q = document.createElement('input');
q.placeholder = 'consulta (ej: “voz femenina con piano y viento”)';
q.style.padding='8px';
rowTop.appendChild(q);

function mkBtn(t){ const b=document.createElement('button'); b.textContent=t; b.style.padding='6px 10px'; return b; }
const bIndex = mkBtn('Indexar 100 prompts');
const bSearch = mkBtn('Buscar');
rowTop.append(bIndex,bSearch);

/* ======= Panel de FX ======= */
const fxPanel = document.createElement('div');
Object.assign(fxPanel.style,{marginTop:'10px',border:'1px solid #3334',borderRadius:'8px',padding:'10px',display:'grid',gridTemplateColumns:'auto 1fr 1fr 1fr 1fr',gap:'8px',alignItems:'center'});
UI.appendChild(fxPanel);

const bFX = mkBtn('Habilitar FX');
fxPanel.append(bFX);

function mkSlider(lab, min, max, step, val){
  const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='4px';
  const L=document.createElement('label'); L.textContent=lab; L.style.fontSize='12px'; L.style.opacity='0.85';
  const S=document.createElement('input'); S.type='range'; S.min=min; S.max=max; S.step=step; S.value=val;
  wrap.append(L,S); return {wrap, S};
}
const sWet = mkSlider('Reverb Wet', 0, 1, 0.01, 0.5);
const sCut = mkSlider('Cutoff (Hz)', 200, 8000, 1, 2500);
const sPan = mkSlider('Pan', -1, 1, 0.01, 0);
const sGain= mkSlider('Gain', 0, 1, 0.01, 0.7);
fxPanel.append(sWet.wrap, sCut.wrap, sPan.wrap, sGain.wrap);

const out = document.createElement('div'); out.style.marginTop='10px'; UI.appendChild(out);

/* ======= Helpers HF ======= */
async function hfRows(offset=0, length=100){
  const url = `${HF_BASE}/rows?dataset=${encodeURIComponent(DS)}&config=${encodeURIComponent(CFG)}&split=${encodeURIComponent(SPLIT)}&offset=${offset}&length=${length}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error('HF rows '+r.status);
  const j = await r.json();
  return (j.rows||[]).map(x=>x.row);
}
function firstSrc(cell){
  if(!cell) return null;
  if(typeof cell==='string') return cell;
  if(Array.isArray(cell)) return cell[0]?.src||null;
  if(cell.src) return cell.src;
  if(cell.audio?.src) return cell.audio.src;
  if(cell.value?.src) return cell.value.src;
  return null;
}

/* ======= Embeddings Ollama ======= */
function cosine(a,b){let s=0,na=0,nb=0;for(let i=0;i<a.length;i++){s+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return s/(Math.sqrt(na)*Math.sqrt(nb)+1e-9);}
async function embedOne(text){
  const r = await fetch(OLLAMA+'/api/embeddings',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:EMBED_MODEL,prompt:text})
  });
  if(!r.ok) throw new Error('Ollama embeddings '+r.status);
  const j = await r.json();
  if(!j.embedding || !Array.isArray(j.embedding)) throw new Error('Embedding vacío');
  return j.embedding;
}
async function embedBatchSlow(texts, concurrency=4){
  const out = new Array(texts.length); let i=0;
  async function worker(){
    while(i<texts.length){
      const idx=i++;
      try{ out[idx]=await embedOne(texts[idx]); }
      catch(e){ console.warn('embedding fail',idx,e); out[idx]=null; }
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,texts.length)},worker));
  return out;
}

/* ======= WebAudio FX (global) ======= */
let AC=null, MASTER=null, DRY=null, WET=null, BPF=null, CONV=null, COMP=null, PAN=null;
const mediaNodeMap = new Map(); // audioEl -> {srcNode, preGain}

function buildIR(ac, seconds=10.2){
  const ir = ac.createBuffer(2, Math.floor(ac.sampleRate*seconds), ac.sampleRate);
  for(let ch=0; ch<ir.numberOfChannels; ch++){
    const d = ir.getChannelData(ch); let a=1;
    for(let i=0;i<d.length;i++){ d[i]=(Math.random()*2-1)*a; a*=0.9985; } // decaimiento
  }
  return ir;
}
function initAudio(){
  if(AC) return;
  AC = new (window.AudioContext||window.webkitAudioContext)();
  MASTER = AC.createGain(); MASTER.gain.value = parseFloat(sGain.S.value);

  // ramas dry/wet
  DRY = AC.createGain(); DRY.gain.value = 0.5;
  WET = AC.createGain(); WET.gain.value = parseFloat(sWet.S.value);

  // filtro + reverb + paneo + comp
  BPF = AC.createBiquadFilter(); BPF.type='lowpass'; BPF.frequency.value = parseFloat(sCut.S.value);
  CONV = AC.createConvolver(); CONV.buffer = buildIR(AC, 1.1);
  PAN  = AC.createStereoPanner(); PAN.pan.value = parseFloat(sPan.S.value);
  COMP = AC.createDynamicsCompressor(); COMP.threshold.value=-20; COMP.ratio.value=6; COMP.attack.value=0.003; COMP.release.value=0.2;

  // sumas: DRY→BPF, WET→CONV→BPF; luego BPF→PAN→COMP→destination
  DRY.connect(BPF);
  WET.connect(CONV).connect(BPF);
  BPF.connect(PAN).connect(COMP).connect(MASTER).connect(AC.destination);
}

bFX.onclick = async ()=>{
  initAudio();
  if(AC.state==='suspended'){ await AC.resume(); }
  out.textContent = '🎛️ FX habilitado. Activá “Usar FX” en cada resultado para rutear ese audio.';
};

// listeners de sliders
sWet.S.oninput = ()=> { if(WET) WET.gain.value = parseFloat(sWet.S.value); };
sCut.S.oninput = ()=> { if(BPF) BPF.frequency.value = parseFloat(sCut.S.value); };
sPan.S.oninput = ()=> { if(PAN) PAN.pan.value = parseFloat(sPan.S.value); };
sGain.S.oninput= ()=> { if(MASTER) MASTER.gain.value = parseFloat(sGain.S.value); };

/* Ruteo: conecta un <audio> al grafo global, con su preGain propio */
function attachToFX(audioEl){
  if(!AC) return;
  if(!audioEl._fxAttached){
    audioEl.crossOrigin = 'anonymous'; // necesario para CORS + WebAudio
    const src = AC.createMediaElementSource(audioEl);
    const pre = AC.createGain(); pre.gain.value = 1.0;
    // cada fuente entra a DRY y WET (send)
    src.connect(pre);
    pre.connect(DRY);
    pre.connect(WET);
    mediaNodeMap.set(audioEl, {srcNode:src, preGain:pre});
    audioEl._fxAttached = true;
  }
}
function detachFromFX(audioEl){
  // No se puede destruir el MediaElementSource, pero podés mutear el preGain
  const n = mediaNodeMap.get(audioEl);
  if(n){ n.preGain.gain.value = 0; }
}

/* ======= Estado índice ======= */
let vecs=[];

/* ======= Botón indexar ======= */
bIndex.onclick = async ()=>{
  out.textContent = '⏳ Descargando filas y calculando embeddings locales...';
  try{
    const rows = await hfRows(0,100);
    const prompts = rows.map(r=>String(r.prompt||''));
    const embs = await embedBatchSlow(prompts,4);
    vecs = rows.map((r,i)=>({
      prompt:prompts[i],
      v:embs[i],
      chosen:firstSrc(r.chosen),
      rejected:firstSrc(r.rejected),
      strategy:r.strategy||''
    })).filter(x=>Array.isArray(x.v)&&x.v.length>0);
    out.textContent = `✅ Indexados ${vecs.length} prompts con embeddings (de ${rows.length}).`;
  }catch(e){
    out.textContent = '❌ Error: '+e.message;
  }
};

/* ======= Botón buscar ======= */
bSearch.onclick = async ()=>{
  const query = q.value.trim();
  if(!query){ out.textContent='Escribí una consulta.'; return; }
  if(!vecs.length){ out.textContent='Primero indexá (botón “Indexar 100 prompts”).'; return; }
  out.textContent='🔄 Calculando embedding de la consulta...';
  try{
    const qv = await embedOne(query);
    const scored = vecs.map(x=>({...x,score:cosine(qv,x.v)}))
                       .sort((a,b)=>b.score-a.score)
                       .slice(0,10);

    const box = document.createElement('div');
    Object.assign(box.style,{display:'grid',gap:'10px',marginTop:'8px'});

    scored.forEach(item=>{
      const card=document.createElement('div');
      Object.assign(card.style,{border:'1px solid #3334',borderRadius:'8px',padding:'10px',display:'grid',gap:'8px'});

      const head=document.createElement('div'); head.style.display='grid'; head.style.gridTemplateColumns='1fr auto'; head.style.gap='8px';
      const p=document.createElement('div'); p.textContent=item.prompt; p.style.fontWeight='600';
      const sc=document.createElement('div'); sc.textContent=`score: ${item.score.toFixed(3)} | strategy: ${item.strategy}`; sc.style.opacity='0.8';
      head.append(p,sc);

      const row=document.createElement('div');
      Object.assign(row.style,{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',alignItems:'center'});

      function mkAudio(src,label){
        const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='6px';
        const L=document.createElement('div'); L.textContent=label; L.style.opacity='0.8';
        const a=document.createElement('audio'); a.controls=true; a.src=src||''; a.crossOrigin='anonymous';
        const fxLine=document.createElement('div'); fxLine.style.display='flex'; fxLine.style.alignItems='center'; fxLine.style.gap='8px';
        const cb=document.createElement('input'); cb.type='checkbox'; const cbl=document.createElement('label'); cbl.textContent='Usar FX';
        const vol=document.createElement('input'); vol.type='range'; vol.min=0; vol.max=2; vol.step=0.01; vol.value=1; vol.style.width='120px';
        const volLab=document.createElement('span'); volLab.textContent='Vol';
        fxLine.append(cb,cbl,volLab,vol);
        cb.onchange=()=>{
          if(cb.checked){ initAudio(); attachToFX(a); const n=mediaNodeMap.get(a); if(n) n.preGain.gain.value=parseFloat(vol.value); }
          else          { detachFromFX(a); }
        };
        vol.oninput=()=>{ const n=mediaNodeMap.get(a); if(n) n.preGain.gain.value=parseFloat(vol.value); };
        wrap.append(L,a,fxLine); return wrap;
      }

      row.append(mkAudio(item.chosen,'chosen'), mkAudio(item.rejected,'rejected'));
      card.append(head,row);
      box.appendChild(card);
    });

    out.innerHTML=''; out.appendChild(box);
  }catch(e){
    out.textContent='❌ Error: '+e.message;
  }
};
```




---

```dataviewjs
/************************************************************
  AUTOMATA PLAYER — 2 convolvers, reverb 1–30 s, overlap voices,
  slow fades, stop = long global fade (10 s), log sincronizado:
  [term] | [audio title]
  UI mínima: [input] [Send] [Play/Stop] + checks + grid (term|title)
************************************************************/
const UI = dv.container;
UI.style.fontFamily = 'ui-monospace,monospace';
UI.style.maxWidth = '900px';

/* ---------- CONFIG ---------- */
const HF_BASE = "https://datasets-server.huggingface.co";
const DS = "declare-lab/audio-alpaca";
const CFG = "default";
const SPLIT = "train";
const OLLAMA = "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";
const MODEL_TXT = "llama3.1";   // generador de términos EN
const MAX_VOICES = 4;           // superposición máx

/* ---------- LAYOUT ---------- */
const top = document.createElement('div');
Object.assign(top.style,{display:'grid',gridTemplateColumns:'1fr auto auto',gap:'8px'});
UI.appendChild(top);

const inp = document.createElement('input');
inp.placeholder = 'Escribí ideas (cualquier idioma). Autómata destila a queries EN…';
inp.style.padding='8px'; top.appendChild(inp);

function mkBtn(t){ const b=document.createElement('button'); b.textContent=t; b.style.padding='6px 10px'; return b; }
const bSend = mkBtn('Send prompt');
const bPlay = mkBtn('▶ Play');
top.append(bSend,bPlay);

const status = document.createElement('div');
status.style.marginTop='8px'; UI.appendChild(status);

/* Reverb tail control (1–30 s) */
const revRow = document.createElement('div');
Object.assign(revRow.style,{marginTop:'8px',display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'8px',alignItems:'center'});
const revLab = document.createElement('div'); revLab.textContent='Reverb Tail (s)';
const revSlider = document.createElement('input'); revSlider.type='range'; revSlider.min=1; revSlider.max=30; revSlider.step=0.1; revSlider.value=6;
const revVal = document.createElement('div'); revVal.textContent=revSlider.value;
revRow.append(revLab,revSlider,revVal);
UI.appendChild(revRow);

/* Log: 2 columnas [term] | [title] */
const logWrap = document.createElement('div');
logWrap.style.marginTop='8px';
logWrap.style.border='1px solid #3334';
logWrap.style.borderRadius='8px';
logWrap.style.padding='8px';
UI.appendChild(logWrap);

const logHeader = document.createElement('div');
Object.assign(logHeader.style,{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',fontWeight:'700',borderBottom:'1px solid #3334',paddingBottom:'6px',marginBottom:'6px'});
const h1 = document.createElement('div'); h1.textContent='term';
const h2 = document.createElement('div'); h2.textContent='title';
logHeader.append(h1,h2); logWrap.appendChild(logHeader);

const logList = document.createElement('div');
Object.assign(logList.style,{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',rowGap:'4px'});
logWrap.appendChild(logList);

function prependLog(term, title){
  const t = document.createElement('div'); t.textContent = term;
  const tt= document.createElement('div'); tt.textContent = title || '(untitled)';
  // prepend: insert before firstChild of grid by cloning nodes
  logList.prepend(tt); logList.prepend(t);
}

function setStatus(ollamaOk, alpacaOk, idxN){
  status.innerHTML = `Ollama: <b style="color:${ollamaOk?'#22c55e':'#ef4444'}">${ollamaOk?'OK':'OFF'}</b> &nbsp;|&nbsp; Audio-Alpaca: <b style="color:${alpacaOk?'#22c55e':'#ef4444'}">${alpacaOk?'OK':'ERR'}</b> &nbsp;|&nbsp; Index: ${idxN||0}`;
}

/* ---------- HF helpers ---------- */
async function hfRows(offset=0, length=100){
  const url = `${HF_BASE}/rows?dataset=${encodeURIComponent(DS)}&config=${encodeURIComponent(CFG)}&split=${encodeURIComponent(SPLIT)}&offset=${offset}&length=${length}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error('HF rows '+r.status);
  const j = await r.json();
  return (j.rows||[]).map(x=>x.row);
}
async function hfValid(){
  const url = `${HF_BASE}/is-valid?dataset=${encodeURIComponent(DS)}`;
  const r = await fetch(url); if(!r.ok) return false;
  const j = await r.json(); return !!(j && (j.valid ?? j.viewer ?? j.preview));
}
function firstSrc(cell){
  if(!cell) return null;
  if(typeof cell==='string') return cell;
  if(Array.isArray(cell)) return cell[0]?.src||null;
  if(cell.src) return cell.src;
  if(cell.audio?.src) return cell.audio.src;
  if(cell.value?.src) return cell.value.src;
  return null;
}

/* ---------- OLLAMA / embeddings ---------- */
async function checkOllama(){
  try{ const r=await fetch(OLLAMA+'/api/tags'); return r.ok; }catch(e){ return false; }
}
async function embedOne(text){
  const r = await fetch(OLLAMA+'/api/embeddings',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:EMBED_MODEL, prompt:text})
  });
  if(!r.ok) throw new Error('embed '+r.status);
  const j = await r.json();
  if(!j.embedding || !Array.isArray(j.embedding)) throw new Error('embed vacío');
  return j.embedding;
}
function cosine(a,b){ let s=0,na=0,nb=0; for(let i=0;i<a.length;i++){ s+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; } return s/(Math.sqrt(na)*Math.sqrt(nb)+1e-9); }
async function txtNextTermEN(history){
  const last = history.slice(-3).join(', ');
  const prompt = `You are a query generator. Based on these seeds: [${last}],
return ONLY one short English search phrase (<=4 words), different from previous ones.
No quotes, no punctuation, no explanations.`;
  const r = await fetch(OLLAMA+'/api/generate',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:MODEL_TXT, prompt, stream:false, options:{temperature:0.75}})
  });
  if(!r.ok) throw new Error('gen '+r.status);
  const j = await r.json();
  const raw = (j.response||'').trim();
  return raw.replace(/^["'`]|["'`:]$/g,'').replace(/[^\w\s\-]/g,'').slice(0,48) || 'ambient nature';
}

/* ---------- Index local (100 prompts) ---------- */
let INDEX = [];  // {prompt (title), v, url, durGuess}
async function buildIndex(){
  const rows = await hfRows(0,100);
  const prompts = rows.map(r => String(r.prompt||''));       // usamos prompt como "title"
  const urls = rows.map(r => firstSrc(r.chosen) || firstSrc(r.rejected) || null);

  const out = new Array(prompts.length);
  let i=0;
  async function worker(){
    while(i<prompts.length){
      const idx=i++;
      try{ out[idx] = await embedOne(prompts[idx]); }catch(e){ out[idx]=null; }
    }
  }
  await Promise.all([worker(),worker(),worker(),worker()]);

  INDEX = prompts.map((p,i)=>({
    prompt: p,
    v: out[i],
    url: urls[i],
    durGuess: 10.0
  })).filter(x=> Array.isArray(x.v) && x.url);
}

/* ---------- AUDIO: 100% wet, 2 convolvers en serie, overlap (MAX_VOICES) ---------- */
let AC=null, MASTER=null, CONV1=null, CONV2=null;
const voices = []; // {el, src, pre, pan}
let globalStopping = false;

function buildIR(ac, seconds=6.0){
  const ir = ac.createBuffer(2, Math.floor(ac.sampleRate*seconds), ac.sampleRate);
  for(let ch=0; ch<ir.numberOfChannels; ch++){
    const d = ir.getChannelData(ch); let a=1;
    // ruido con decaimiento lento → cola “grande”
    const k = Math.pow(0.9995, 6.0/seconds); // compensar densidad para colas largas/cortas
    for(let i=0;i<d.length;i++){ d[i]=(Math.random()*2-1)*a; a*=k; }
  }
  return ir;
}
function rebuildReverb(seconds){
  if(!AC) return;
  const ir1 = buildIR(AC, seconds);
  const ir2 = buildIR(AC, Math.max(1, seconds*0.85));
  CONV1.buffer = ir1;
  CONV2.buffer = ir2;
}
function audioInit(){
  if(AC) return;
  AC = new (window.AudioContext||window.webkitAudioContext)();
  MASTER = AC.createGain(); MASTER.gain.value = 0.9;
  CONV1 = AC.createConvolver();
  CONV2 = AC.createConvolver();
  rebuildReverb(parseFloat(revSlider.value));
  // Serie: input→CONV1→CONV2→MASTER→dest
  CONV1.connect(CONV2).connect(MASTER).connect(AC.destination);
}
revSlider.oninput = ()=>{
  revVal.textContent = revSlider.value;
  if(AC) rebuildReverb(parseFloat(revSlider.value));
};

function freeOldestIfNeeded(){
  if(voices.length < MAX_VOICES) return;
  const v = voices.shift();
  try{
    v.el.pause(); v.el.src='';
    v.pre.disconnect(); v.pan.disconnect(); v.src.disconnect();
  }catch(e){}
}
function scheduleVoice(url){
  audioInit();
  freeOldestIfNeeded();

  const el = new Audio();
  el.crossOrigin = 'anonymous';
  el.src = url; el.preload = 'auto';

  const src = AC.createMediaElementSource(el);
  const pre = AC.createGain(); pre.gain.value = 0; // fade-in desde 0
  const pan = AC.createStereoPanner();

  // Por-voz: src → pre → pan → CONV1 (→ CONV2 → MASTER global)
  src.connect(pre).connect(pan).connect(CONV1);

  const voice = {el, src, pre, pan};
  voices.push(voice);

  function startWithEnv(){
    const dur = isFinite(el.duration) && el.duration>0 ? el.duration : 10.0;
    const t0 = AC.currentTime + 0.05;

    // Paneo L→R o R→L durante todo el clip
    const dir = Math.random()<0.5 ? -1 : 1;
    pan.pan.cancelScheduledValues(t0);
    pan.pan.setValueAtTime(dir<0? 1 : -1, t0);
    pan.pan.linearRampToValueAtTime(dir<0? -1 : 1, t0 + dur);

    // Envolvente muy lenta: 80% in, 20% out
    pre.gain.cancelScheduledValues(t0);
    pre.gain.setValueAtTime(0, t0);
    pre.gain.linearRampToValueAtTime(1.0, t0 + dur*0.8);
    pre.gain.linearRampToValueAtTime(0.0, t0 + dur);

    el.currentTime = 0;
    el.play().catch(()=>{});

    // cleanup al final
    setTimeout(()=>{
      try{ el.pause(); el.src=''; pre.disconnect(); pan.disconnect(); src.disconnect(); }catch(e){}
      const idx = voices.indexOf(voice);
      if(idx>=0) voices.splice(idx,1);
    }, (dur+0.5)*1000);
  }

  if(isFinite(el.duration) && el.duration>0){
    startWithEnv();
  }else{
    el.addEventListener('loadedmetadata', ()=> startWithEnv(), {once:true});
    setTimeout(()=>{ if(el.readyState<1) startWithEnv(); }, 1200);
  }
}

/* Fade-out global (10 s) al presionar Stop: baja el preGain de cada voz */
function globalFadeOutAndStop(){
  if(!AC) return;
  globalStopping = true;
  const t0 = AC.currentTime + 0.02;
  const T = 10.0; // 10 s
  voices.forEach(v=>{
    try{
      v.pre.gain.cancelScheduledValues(t0);
      const current = v.pre.gain.value;
      v.pre.gain.setValueAtTime(current, t0);
      v.pre.gain.linearRampToValueAtTime(0.0, t0 + T);
      setTimeout(()=>{
        try{ v.el.pause(); v.el.src=''; v.pre.disconnect(); v.pan.disconnect(); v.src.disconnect(); }catch(e){}
        const idx = voices.indexOf(v); if(idx>=0) voices.splice(idx,1);
      }, (T+0.6)*1000);
    }catch(e){}
  });
}

/* ---------- AUTOMATA LOOP ---------- */
let playing=false, timer=null;
const historyTerms = [];

async function stepOnce(){
  if(!playing) return;
  try{
    if(historyTerms.length===0){ historyTerms.push('ambient nature'); }
    const term = await txtNextTermEN(historyTerms);
    historyTerms.push(term);

    const qv = await embedOne(term);
    const scored = INDEX.map(x=> ({...x, score: cosine(qv, x.v)}))
                        .sort((a,b)=> b.score - a.score)
                        .slice(0,5);
    const k = Math.min(3, scored.length);
    const pick = k? scored[Math.floor(Math.random()*k)] : scored[0];

    if(pick && pick.url){
      scheduleVoice(pick.url);
      // log sincronizado: [term] | [title(prompt)]
      prependLog(term, pick.prompt || '');
    }
  }catch(e){
    prependLog(`(err) ${e.message}`, '');
  }finally{
    if(playing){
      const wait = 3000 + Math.random()*2000;
      timer = setTimeout(stepOnce, wait);
    }
  }
}

/* ---------- INIT ---------- */
(async ()=>{
  const [okOllama, okAlpaca] = await Promise.all([checkOllama(), hfValid()]);
  setStatus(okOllama, okAlpaca, 0);
  try{
    await buildIndex();
    setStatus(okOllama, okAlpaca, INDEX.length);
  }catch(e){
    prependLog(`(index) ${e.message}`, '');
  }
})();

/* ---------- UI ---------- */
bSend.onclick = ()=>{
  const raw = (inp.value||'').trim();
  if(!raw) return;
  historyTerms.push(raw);
  prependLog(raw, '(seed)');
  inp.value='';
};
bPlay.onclick = ()=>{
  playing = !playing;
  bPlay.textContent = playing? '■ Stop' : '▶ Play';
  if(playing){
    globalStopping = false;
    if(AC && AC.state==='suspended'){ AC.resume(); }
    stepOnce();
  }else{
    clearTimeout(timer); timer=null;
    globalFadeOutAndStop();
  }
};
```



# super urban 8k

```dataviewjs
/***********************
 * UrbanSound8K Automata Player (robust)
 * - Tests audio output with a 0.5s sine beep at Play
 * - Multiple URL patterns for UrbanSound8K
 * - Better error reporting (UI + console)
 * - Same features: overlap, slow fades, 2 convolvers, random L↔R sweep, term↔file log
 ***********************/

// ====== UI base ======
const UI = this.container;
UI.innerHTML = "";
UI.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial";

// ====== Globals ======
let AC, MASTER, BUS_WET, BUS_DRY, BIG_CONV, SMALL_CONV, PAN, limiter;
let ENGINE_ON = false;
let termTimer = null;
let playTimer = null;
const ACTIVE_SOURCES = new Set();
let didBeep = false;

const OLLAMA_URL = "http://localhost:11434";
const MODEL_TERMS = "llama3.1";

const API = "https://datasets-server.huggingface.co";
const DS  = "danavery/urbansound8K";
const PAGE = 100;
const WANT = 2000;
let rowsCache = null;

let termHistory = [];

// ====== UI Scaffold ======
const uiBar = document.createElement("div");
uiBar.style.display = "grid";
uiBar.style.gridTemplateColumns = "1fr auto auto";
uiBar.style.gap = "8px";
uiBar.style.alignItems = "center";
UI.appendChild(uiBar);

const inPrompt = document.createElement("input");
inPrompt.placeholder = "Escribí términos (dog, siren, drilling, music, etc.)";
inPrompt.style.padding = "8px";
inPrompt.style.border = "1px solid var(--background-modifier-border)";
inPrompt.style.borderRadius = "8px";
uiBar.appendChild(inPrompt);

const bSend = document.createElement("button"); bSend.textContent = "Send";
bSend.style.padding = "8px 12px";
bSend.style.borderRadius = "8px";
uiBar.appendChild(bSend);

const bPlay = document.createElement("button"); bPlay.textContent = "Play";
bPlay.style.padding = "8px 12px";
bPlay.style.borderRadius = "8px";
uiBar.appendChild(bPlay);

const statusLine = document.createElement("div");
statusLine.style.marginTop = "6px";
statusLine.style.fontSize = "12px";
statusLine.style.opacity = "0.9";
statusLine.style.whiteSpace = "pre-wrap";
UI.appendChild(statusLine);

const layout = document.createElement("div");
layout.style.display = "grid";
layout.style.gridTemplateColumns = "1fr 1fr";
layout.style.gap = "8px";
layout.style.marginTop = "8px";
UI.appendChild(layout);

const termsPane = document.createElement("pre");
termsPane.style.margin = "0";
termsPane.style.padding = "8px";
termsPane.style.minHeight = "200px";
termsPane.style.border = "1px solid var(--background-modifier-border)";
termsPane.style.borderRadius = "8px";
termsPane.style.whiteSpace = "pre-wrap";
termsPane.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
layout.appendChild(termsPane);

const logPane = document.createElement("pre");
logPane.style.margin = "0";
logPane.style.padding = "8px";
logPane.style.minHeight = "200px";
logPane.style.border = "1px solid var(--background-modifier-border)";
logPane.style.borderRadius = "8px";
logPane.style.whiteSpace = "pre-wrap";
logPane.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
layout.appendChild(logPane);

function setStatus(msg){ statusLine.textContent = msg; }
function pushRowToLog(term, title, dur){
  const line = `${term}    ${title}    ${dur}`;
  const prev = logPane.textContent.trim();
  logPane.textContent = prev ? (prev + "\n" + line) : line;
}
function refreshTermsPane(){ termsPane.textContent = termHistory.join("\n"); }

// ====== Audio Engine ======
function initAudioOnce(){
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();

  MASTER = AC.createGain(); MASTER.gain.value = 0.9;
  BUS_DRY = AC.createGain(); BUS_DRY.gain.value = 0.0;  // 100% wet
  BUS_WET = AC.createGain(); BUS_WET.gain.value = 1.0;

  PAN = AC.createStereoPanner(); PAN.pan.value = 0;

  function mkIR(seconds){
    const len = Math.max(1, Math.floor(AC.sampleRate * seconds));
    const buf = AC.createBuffer(2, len, AC.sampleRate);
    for (let ch = 0; ch < 2; ch++){
      const d = buf.getChannelData(ch);
      let a = 1.0;
      for (let i = 0; i < len; i++){
        d[i] = (Math.random()*2 - 1) * a;
        a *= 0.9995;
      }
    }
    return buf;
  }
  BIG_CONV   = AC.createConvolver();   BIG_CONV.buffer   = mkIR(14);
  SMALL_CONV = AC.createConvolver();   SMALL_CONV.buffer = mkIR(7);

  limiter = AC.createDynamicsCompressor();
  limiter.threshold.value = -10; limiter.ratio.value = 8;
  limiter.attack.value = 0.003;  limiter.release.value = 0.2;

  BUS_DRY.connect(PAN);
  BUS_WET.connect(SMALL_CONV).connect(BIG_CONV).connect(PAN);
  PAN.connect(limiter).connect(AC.destination);
}

async function ensureRunningAudio(){
  initAudioOnce();
  if (AC.state !== "running") {
    try { await AC.resume(); } catch(e){ console.error(e); }
  }
}

function schedulePanSweep(duration){
  const now = AC.currentTime;
  const dir = Math.random() < 0.5 ? -1 : 1;
  PAN.pan.cancelScheduledValues(now);
  PAN.pan.setValueAtTime(-dir, now);
  PAN.pan.linearRampToValueAtTime(dir, now + duration);
}

function beepHalfSecond(){
  if (didBeep) return;
  didBeep = true;
  const osc = AC.createOscillator();
  const g = AC.createGain();
  g.gain.value = 0.0001;
  osc.frequency.value = 440;
  osc.connect(g).connect(BUS_WET); // 100% wet through reverb, so very washed
  const now = AC.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.5, now + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.start(now);
  osc.stop(now + 0.55);
}

// ====== Dataset fetch ======
async function jget(u){
  const r = await fetch(u);
  if(!r.ok) throw new Error(r.status + " :: " + u);
  return r.json();
}

async function fetchRowsAll(){
  if (rowsCache) return rowsCache;
  const split = "train";
  let out = [];
  for (let offset = 0; out.length < WANT; offset += PAGE){
    const u = `${API}/rows?dataset=${encodeURIComponent(DS)}&config=default&split=${encodeURIComponent(split)}&offset=${offset}&length=${PAGE}`;
    const j = await jget(u);
    if(!j || !j.rows || j.rows.length === 0) break;
    out.push(...j.rows.map(r => r.row));
    if (j.rows.length < PAGE) break;
  }
  if (out.length === 0) throw new Error("No metadata rows.");
  rowsCache = out;
  setStatus(`Ollama: ${await pingOllama()}  |  Dataset rows: ${out.length}`);
  return out;
}

// Try several URL shapes used by mirrors of UrbanSound8K on HF
function buildHFUrl(row){
  const fold =
    row.fold ?? row.Fold ?? row.fold_num ?? row.fold_index ?? row.fold_id ?? '1';
  const file =
    row.slice_file_name ?? row.filename ?? row.file_name ?? row.audio ?? row.path;

  if (!file) return null;

  const candidates = [
    // danavery mirror (most common)
    `https://huggingface.co/datasets/danavery/urbansound8K/resolve/main/audio/fold${fold}/${file}`,
    // lowercase repo name variant
    `https://huggingface.co/datasets/urbansound8k/urbansound8k/resolve/main/audio/fold${fold}/${file}`,
    // some mirrors embed the UrbanSound8K folder name
    `https://huggingface.co/datasets/danavery/urbansound8K/resolve/main/UrbanSound8K/audio/fold${fold}/${file}`,
  ];
  return candidates;
}

async function pickFirstReachable(urls){
  for (const u of urls){
    try {
      const r = await fetch(u, { method: "HEAD" });
      if (r.ok) return u;
    } catch(e){ /* ignore */ }
  }
  return null;
}

// ====== Player ======
async function loadBuffer(url){
  const r = await fetch(url, { mode: "cors" });
  if(!r.ok) throw new Error("audio fetch " + r.status + " :: " + url);
  const ab = await r.arrayBuffer();
  return await AC.decodeAudioData(ab);
}

async function playOneRandom(){
  const rows = await fetchRowsAll().catch(e=>{
    console.error(e);
    setStatus(`Dataset error: ${e.message}`);
    return null;
  });
  if (!rows) return;

  const last = termHistory[termHistory.length - 1];
  let subset = rows;
  if (last){
    const q = last.toLowerCase();
    subset = rows.filter(r=>{
      const lab = (r.class || r.Class || r.category || '') + ' ' + (r.slice_file_name || r.filename || '');
      return lab.toLowerCase().includes(q);
    });
    if (subset.length < 10) subset = rows;
  }
  const pick = subset[Math.floor(Math.random() * subset.length)];

  const urlCandidates = buildHFUrl(pick);
  if (!urlCandidates){ setStatus("No URL candidates built for row."); return; }

  const url = await pickFirstReachable(urlCandidates);
  if (!url){
    console.warn("No reachable URL for row:", pick);
    setStatus("No reachable audio URL (HEAD checks failed). Trying next.");
    return;
  }

  let buf;
  try {
    buf = await loadBuffer(url);
  } catch(e){
    console.error(e);
    setStatus("Load/Decode error: " + (e.message || e));
    return;
  }

  const src = AC.createBufferSource(); src.buffer = buf;
  const g   = AC.createGain(); g.gain.value = 0.0001;
  src.connect(g).connect(BUS_WET);

  const now = AC.currentTime;
  const dur = buf.duration;
  const fadeIn  = Math.min(8.0, dur * 0.6);
  const fadeOut = Math.min(8.0, dur * 0.6);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.8, now + fadeIn);
  g.gain.setValueAtTime(0.8, Math.max(now + 0.001, now + dur - fadeOut));
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  const track = { src, gain: g };
  ACTIVE_SOURCES.add(track);
  src.onended = () => { ACTIVE_SOURCES.delete(track); };

  schedulePanSweep(dur);
  src.start(now);

  const title = (pick.slice_file_name || pick.filename || "audio.wav");
  const term  = termHistory[termHistory.length - 1] || "(random)";
  pushRowToLog(term, title, dur.toFixed(2) + "s");
}

function driveAudio(){
  if (!ENGINE_ON) return;
  playOneRandom().catch(e=>console.error(e));
  const nextIn = 3000 + Math.random()*2500; // overlap
  playTimer = setTimeout(()=> driveAudio(), nextIn);
}

// ====== Terms / Ollama ======
async function pingOllama(){
  try {
    const r = await fetch(OLLAMA_URL + "/api/tags");
    return r.ok ? "OK" : "OFF";
  } catch(_){ return "OFF"; }
}

async function nextTerm(promptUser){
  const last3 = termHistory.slice(-3).join(", ") || "(none)";
  const ask = promptUser?.trim() ? promptUser.trim() : "";
  const sys = `You are a creative tag suggester for sound search. Output ONE short English tag, no punctuation, no quotes.`;
  const user = `Given previous tags: ${last3}\nUser hint (any language): ${ask}\nOne new tag (1-2 words), different from previous:`;
  const body = {
    model: MODEL_TERMS,
    prompt: `SYSTEM:\n${sys}\nUSER:\n${user}\nASSISTANT:`,
    stream: false,
    options: { temperature: 0.8, max_tokens: 8 }
  };
  try{
    const r = await fetch(OLLAMA_URL + "/api/generate", {
      method: "POST", headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const j = await r.json();
    let t = (j.response || "").trim();
    t = t.replace(/["',.;:]/g, "").split(/\s+/).slice(0,3).join(" ");
    if (!t) t = "texture";
    termHistory.push(t);
    if (termHistory.length > 20) termHistory.shift();
    refreshTermsPane();
    return t;
  }catch(e){
    console.error(e);
    setStatus("Ollama error: " + (e.message || e));
    termsPane.textContent = (termHistory.join("\n") + "\n[ollama error]");
    return null;
  }
}

function driveTerms(promptUser = ""){
  if (!ENGINE_ON) return;
  const wait = 3000 + Math.random()*2000;
  termTimer = setTimeout(async ()=>{
    await nextTerm(promptUser);
    driveTerms("");
  }, wait);
}

// ====== Engine control ======
function startEngine(){
  if (ENGINE_ON) return;
  ENGINE_ON = true;
  driveTerms();
  driveAudio();
}

async function stopEngine(){
  ENGINE_ON = false;
  const now = AC.currentTime;
  ACTIVE_SOURCES.forEach(obj=>{
    const {gain} = obj;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 10.0); // 10s fade-out
    } catch(_){}
  });
  if (termTimer) { clearTimeout(termTimer); termTimer = null; }
  if (playTimer) { clearTimeout(playTimer); playTimer = null; }
}

// ====== Handlers ======
bSend.onclick = ()=>{
  const txt = inPrompt.value.trim();
  if (txt) { termHistory.push(txt); if (termHistory.length>20) termHistory.shift(); }
  refreshTermsPane();
};

bPlay.onclick = async ()=>{
  await ensureRunningAudio();
  if (!ENGINE_ON){
    // Confirm output works with a tiny wet beep
    beepHalfSecond();

    const seed = inPrompt.value.trim();
    if (seed) { termHistory.push(seed); if (termHistory.length>20) termHistory.shift(); }
    refreshTermsPane();
    startEngine();
    bPlay.textContent = "Stop";
    setStatus("Starting… (fetching metadata & audio)");
  } else {
    await stopEngine();
    bPlay.textContent = "Play";
    setStatus("Stopped.");
  }
};

// ====== Boot ======
(async ()=>{
  const oll = await pingOllama();
  setStatus(`Ollama: ${oll}  |  Dataset: ${DS}`);
})();
termHistory = ["dog", "siren", "drilling"];
refreshTermsPane();
```









```dataviewjs
// === CONFIG HF ===
const HF_DATASET = "HKUSTAudio/Audio-FLAN-Dataset";
const HF_BASE = "https://datasets-server.huggingface.co";
const HF_REPO_BASE = "https://huggingface.co/datasets/HKUSTAudio/Audio-FLAN-Dataset/resolve/main";
const HF_TOKEN = "hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // <-- tu token

function authHeaders() {
  return HF_TOKEN ? { 'Authorization': 'Bearer ' + HF_TOKEN } : {};
}

// 1) Descubrir splits válidos
async function pickValidSplit() {
  const r = await fetch(`${HF_BASE}/splits?dataset=${encodeURIComponent(HF_DATASET)}`, { headers: authHeaders() });
  if (!r.ok) throw new Error('splits ' + r.status);
  const j = await r.json();
  // preferimos audio/understanding/train_dev (ajustá a gusto)
  const cand = (j.splits || []).find(s =>
    s.config === 'default' &&
    /audio\/understanding\/train_dev/.test(s.split)
  ) || (j.splits || [])[0];
  if (!cand) throw new Error('no splits');
  return { config: cand.config, split: cand.split };
}

// 2) Obtener filas (rows) del split elegido
async function hfRows(dataset, config, split, offset=0, length=100) {
  const url = `${HF_BASE}/rows?dataset=${encodeURIComponent(dataset)}&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}&offset=${offset}&length=${length}`;
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error('rows ' + r.status);
  const j = await r.json();
  return (j.rows || []).map(x => x.row);
}

// 3) Extraer Audio_ID del input (entre <|SOA|> y <|EOA|>)
function extractAudioId(str) {
  if (typeof str !== 'string') return null;
  const m = str.match(/<\|SOA\|\>([^<]+)<\|EOA\|\>/);
  return m ? m[1] : null;
}

// 4) Resolver qué .scp necesito para un Audio_ID
function scpPathForAudioId(audioId) {
  // form: 177_TAU_Urban_Acoustic_Scenes_2022_xxx
  const dsid = audioId.split('_')[0]; // "177"
  // tomamos el nombre del dataset + .scp por dominio 'audio' (ajustá si estás en music/speech)
  // ejemplo robusto: parsear el "dataset name" (las partes desde el segundo token hasta encontrar el último número de dataset antes del clip)
  // Pero en Audio-FLAN proveen por dataset .scp separado. Para TAU_2022:
  //   scp_files/audio/177_TAU_Urban_Acoustic_Scenes_2022.scp
  const rest = audioId.split('_').slice(0, 2).join('_'); // "177_TAU"
  // Mejor: recortar desde 0 hasta antes del último bloque que no es parte del nombre-largo
  // En la práctica, viene como "177_TAU_Urban_Acoustic_Scenes_2022_..."
  const dsname = audioId.split('_').slice(0, 5).join('_'); // heurística: primeras 5 piezas
  return `scp_files/audio/${dsname}.scp`;
}

// 5) Bajar y parsear un .scp → Map(Audio_ID → audio_files/..wav)
const SCP_CACHE = new Map(); // key=scppath, val=Map(id->path)
async function loadScpMap(scpRelPath) {
  if (SCP_CACHE.has(scpRelPath)) return SCP_CACHE.get(scpRelPath);
  const url = `${HF_REPO_BASE}/${scpRelPath}`;
  const r = await fetch(url, { headers: authHeaders() });
  if (!r.ok) throw new Error('scp ' + r.status + ' ' + scpRelPath);
  const txt = await r.text();
  const map = new Map();
  txt.split('\n').forEach(line => {
    const i = line.indexOf(' ');
    if (i > 0) {
      const id = line.slice(0, i).trim();
      const p  = line.slice(i + 1).trim();
      if (id && p) map.set(id, p);
    }
  });
  SCP_CACHE.set(scpRelPath, map);
  return map;
}

// 6) Audio_ID → URL reproducible (resolve/main/...)
async function audioUrlFromAudioId(audioId) {
  const scpRel = scpPathForAudioId(audioId);
  const scpMap = await loadScpMap(scpRel);
  const relPath = scpMap.get(audioId);
  if (!relPath) throw new Error('ID sin ruta en scp: ' + audioId);
  return `${HF_REPO_BASE}/${relPath}`;
}

// === Ejemplo de armado de índice (títulos + URL) ===
async function buildIndexFLAN() {
  const { config, split } = await pickValidSplit();
  const rows = await hfRows(HF_DATASET, config, split, 0, 100);
  const out = [];
  for (const row of rows) {
    // título: instruction + input (limpio)
    const title = ((row.instruction || '') + ' ' + (row.input || '')).trim().slice(0, 160);
    const audioId = extractAudioId(row.input || '') || extractAudioId(row.output || '');
    if (!audioId) continue;
    try {
      const url = await audioUrlFromAudioId(audioId);
      out.push({ prompt: title, url });
    } catch(e) {
      // puede haber items sin audio redistribuible → los salteamos
    }
  }
  if (!out.length) throw new Error('no hay audios reproducibles en este split');
  return out;
}
```
