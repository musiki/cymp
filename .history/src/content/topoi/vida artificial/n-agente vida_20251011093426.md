
```dataviewjs
/***** Organismo músico + RAG opcional (FSM + Homeostasis) *****/
const UI=dv.container; UI.style.fontFamily='ui-monospace,monospace';
/* --------- CONFIG RAG --------- */
const RAG={
  use:true,                           // poné false si no tenés LLM local
  llm:"ollama",                       // "ollama" | "lmstudio"
  ollama_url:"http://localhost:11434/api/generate",
  ollama_model:"llama3.1:8b",
  top_k:3, max_ctx:4000
};
/* ---- STATE (homeostasis) ---- */
const S={
  t:0, dt:1.0,
  needs:{ hambre:0.2, sueño:0.2, higiene:0.1, juego:0.3, creatividad:0.4 },
  mood:"neutral",
  energy:0.8,
  scale:["C4","D4","E4","G4","A4","C5"], tempo:90,
  instrument:null
};
/* ---- UI ---- */
const hud=document.createElement('div'); UI.appendChild(hud);
const log=(m)=>hud.textContent=m;
/* ---- Helpers ---- */
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function choose(arr){return arr[Math.floor(Math.random()*arr.length)];}
function n2freq(n){ // nota "C4"→freq
  const names={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
  const m=n.match(/^([A-G]#?|Db|Eb|Gb|Ab|Bb)(\d)$/); if(!m) return 440;
  const semi=names[m[1]] + (parseInt(m[2]) - 4)*12; return 440*Math.pow(2,(semi-9)/12);
}
function syllabify(text){ return text.trim().split(/\s+/).flatMap(w=>w.split(/(?<=[aeiouáéíóú])/i)).filter(Boolean); }
/* ---- WebAudio ---- */
let AC, MASTER;
function audioInit(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  MASTER=AC.createGain(); MASTER.gain.value=0.5;
  const conv=AC.createConvolver(), ir=AC.createBuffer(2,AC.sampleRate*1.1,AC.sampleRate);
  for(let ch=0; ch<2; ch++){const d=ir.getChannelData(ch); let a=1.0; for(let i=0;i<d.length;i++){d[i]=(Math.random()*2-1)*a; a*=0.9992;}}
  conv.buffer=ir; const dry=AC.createGain(); dry.gain.value=0.35; const wet=AC.createGain(); wet.gain.value=0.65;
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-20; comp.ratio.value=6; comp.attack.value=0.003; comp.release.value=0.2;
  MASTER.connect(dry); MASTER.connect(conv); conv.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(AC.destination);
}
function makeInstrument(kind="sustractiva"){
  audioInit();
  return { kind,
    note:(freq, dur=0.25, vel=0.6)=>{
      const o=AC.createOscillator(); o.type = (kind==="fm"?"sine": kind==="karplus"?"triangle":"sawtooth");
      const g=AC.createGain(); g.gain.value=0; const f=AC.createBiquadFilter(); f.type="lowpass"; f.frequency.value=800;
      o.connect(f).connect(g).connect(MASTER); o.frequency.value=freq; o.start();
      const now=AC.currentTime;
      g.gain.linearRampToValueAtTime(vel, now+0.02);
      f.frequency.exponentialRampToValueAtTime(2500, now+dur*0.5);
      g.gain.exponentialRampToValueAtTime(0.0008, now+dur);
      o.stop(now+dur+0.02);
    }
  }
}
function sing(lyrics="la la la", scale=S.scale, bpm=S.tempo){
  audioInit(); if(!S.instrument) S.instrument=makeInstrument("sustractiva");
  const syl=syllabify(lyrics); const spb=60/bpm; let t0=AC.currentTime+0.05;
  syl.forEach((sy,i)=>{
    const note=scale[i%scale.length], f=n2freq(note);
    const dur = (sy.length<=2? 0.18: 0.28); // sílaba corta/larga
    S.instrument.note(f, dur, 0.5);
    // micro-gliss de “canto”
    const o=AC.createOscillator(); const g=AC.createGain(); o.type='sine'; g.gain.value=0.08;
    o.connect(g).connect(MASTER); o.frequency.setValueAtTime(f*0.98, t0); o.frequency.linearRampToValueAtTime(f*1.03, t0+dur*0.5); o.frequency.linearRampToValueAtTime(f, t0+dur);
    o.start(t0); o.stop(t0+dur);
    t0 += spb*0.5; // negra=2 sílabas aprox
  });
}
/* ---- RAG (opcional) ---- */
async function retrieveTopK(q, k=RAG.top_k){
  // minimal TF-IDF rápido sobre notas abiertas
  const files = app.vault.getMarkdownFiles();
  const bag=[]; const df={}; let N=0;
  for(const f of files){ const txt=(await app.vault.read(f)).toLowerCase(); N++;
    const toks=txt.replace(/[^a-záéíóúüñ0-9\s]/gi,' ').split(/\s+/).filter(t=>t.length>2);
    const tf={}; toks.forEach(t=>tf[t]=(tf[t]||0)+1);
    Object.keys(tf).forEach(t=>df[t]=(df[t]||0)+1);
    bag.push({path:f.path, title:f.basename, txt, tf});
  }
  const qtok=q.toLowerCase().split(/\s+/).filter(t=>t.length>2); const qtf={}; qtok.forEach(t=>qtf[t]=(qtf[t]||0)+1);
  const scores=bag.map(d=>{
    let dot=0, dn=0, qn=0;
    for(const t of Object.keys(d.tf)){ const idf=Math.log((N+1)/((df[t]||0)+1)); const w=d.tf[t]*idf; dn+=w*w; if(qtf[t]){ const wq=qtf[t]*idf; dot+=w*wq; }}
    for(const t of Object.keys(qtf)){ const idf=Math.log((N+1)/((df[t]||0)+1)); const wq=qtf[t]*idf; qn+=wq*wq; }
    const sim = (dot)/(Math.sqrt(dn)*Math.sqrt(qn) || 1);
    return {sim, doc:d};
  }).sort((a,b)=>b.sim-a.sim).slice(0,k);
  return scores.map(s=>`# ${s.doc.title} — ${s.doc.path}\n${s.doc.txt.slice(0,800)}\n`);
}
async function ragDecision(state, choices){
  if(!RAG.use) return null;
  const q=`estado: ${JSON.stringify(state)}; acciones posibles: ${choices.join(", ")}`;
  const ctx=(await retrieveTopK("homeostasis acciones musica lutheria lyrics prosodia", RAG.top_k)).join("\n---\n").slice(0,RAG.max_ctx);
  const prompt=`Eres un organismo músico. Decide UNA acción de [${choices.join(",")}], con {accion, params}.\nContexto:\n${ctx}\nEstado:\n${q}\nResponde JSON válido.`;
  try{
    if(RAG.llm==="ollama"){
      const res=await fetch(RAG.ollama_url,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:RAG.ollama_model,prompt,stream:false,options:{temperature:0.3}})});
      const j=await res.json(); const text=j.response||"";
      const m=text.match(/\{[\s\S]*\}/); return m? JSON.parse(m[0]) : null;
    }else{
      const res=await fetch("http://localhost:1234/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"local",messages:[{role:"system",content:"Devuelve solo JSON."},{role:"user",content:prompt}],temperature:0.3})});
      const j=await res.json(); const text=j.choices?.[0]?.message?.content||""; const m=text.match(/\{[\s\S]*\}/); return m? JSON.parse(m[0]) : null;
    }
  }catch(e){ return null; }
}
/* ---- acciones ---- */
const ACT={
  comer(){ S.needs.hambre=clamp(S.needs.hambre-0.5,0,1); S.energy=clamp(S.energy+0.1,0,1); log("🍎 comer"); },
  dormir(){ S.needs.sueño=clamp(S.needs.sueño-0.6,0,1); S.energy=clamp(S.energy+0.4,0,1); log("😴 dormir"); },
  bañar(){ S.needs.higiene=clamp(S.needs.higiene-0.7,0,1); log("🚿 bañar"); },
  jugar(){ S.needs.juego=clamp(S.needs.juego-0.5,0,1); log("🕹️ jugar"); },
  crear_instrumento(params={tipo:"sustractiva"}){ S.instrument=makeInstrument(params.tipo); log(`🛠️ instrumento: ${params.tipo}`); },
  cantar(params={ letra:"la la la", escala:S.scale, bpm:S.tempo }){ sing(params.letra, params.escala||S.scale, params.bpm||S.tempo); log("🎶 cantar"); },
  componer(params={modo:"mayor"}){ S.scale = (params.modo==="dórico"? ["D4","E4","F4","A4","B4","D5"] : ["C4","D4","E4","G4","A4","C5"]); log(`🎼 escala: ${params.modo||"mayor"}`); }
};
/* ---- decisión (FSM simple + RAG) ---- */
async function decideAndAct(){
  // aumenta necesidades ligeramente
  S.needs.hambre=clamp(S.needs.hambre+0.05,0,1);
  S.needs.sueño=clamp(S.needs.sueño+0.03,0,1);
  S.needs.higiene=clamp(S.needs.higiene+0.02,0,1);
  S.needs.juego =clamp(S.needs.juego +0.04,0,1);
  S.needs.creatividad=clamp(S.needs.creatividad+0.03,0,1);

  // prioridad determinista
  let action=null, params={};
  if(S.needs.hambre>0.7) action="comer";
  else if(S.needs.sueño>0.7) action="dormir";
  else if(S.needs.higiene>0.7) action="bañar";
  else if(S.needs.juego>0.6) action="jugar";
  else if(!S.instrument) action="crear_instrumento";
  else if(S.needs.creatividad>0.6) action="cantar";
  else action="componer";

  // consultar RAG para parámetros o desempate
  const choices=Object.keys(ACT);
  const rag=await ragDecision({needs:S.needs, energy:S.energy, scale:S.scale, tempo:S.tempo}, choices);
  if(rag && ACT[rag.accion]){ action=rag.accion; params=rag.params||{}; }

  ACT[action](params);
}
/* ---- LOOP ---- */
const panel=document.createElement('pre'); UI.appendChild(panel);
function render(){
  const n=S.needs;
  panel.textContent=
`t=${S.t}s  mood=${S.mood} energy=${S.energy.toFixed(2)}
hambre:${(n.hambre*100|0)}  sueño:${(n.sueño*100|0)}  higiene:${(n.higiene*100|0)}  juego:${(n.juego*100|0)}  creatividad:${(n.creatividad*100|0)}
scale: ${S.scale.join(" ")}  tempo: ${S.tempo}`;
}
render();
let timer=null; const btn=document.createElement('button'); btn.textContent='▶ start/stop'; btn.style.marginTop='8px'; UI.appendChild(btn);
btn.onclick=()=>{
  if(timer){ clearInterval(timer); timer=null; btn.textContent='▶ start/stop'; return; }
  audioInit();
  timer=setInterval(async()=>{ S.t+=S.dt; await decideAndAct(); render(); }, 1000);
  btn.textContent='⏸ stop';
};
```



•	Lenguaje: agrega acción hablar() y usa el LLM para redactar frases que expliquen lo que siente/va a hacer.
•	Instrumento propio: en crear_instrumento, deja que el RAG sugiera cadena de nodos (p. ej., “oscilador→waveshaper→bandpass→delay”) y parsealo en WebAudio.
•	Lyrics: crea generar_letra(tema) que consulta lyrics/ y devuelve texto; cantar() ya mapea sílabas→notas.
•	Aprendizaje: logueá pares (estado, acción, resultado) a un .md y deja que el RAG los reutilice como recetas exitosas.

Si te va, te preparo una versión BT (árbol de comportamientos) con los mismos nodos y un pequeño inspector en pantalla.


```dataviewjs
/***** Musical Agent — single prompt, hidden structured response with song, default walk + run *****/
const UI = dv.container; UI.style.fontFamily='ui-monospace,monospace'; UI.style.maxWidth='960px';

/* ---------------- CONFIG ---------------- */
const OLLAMA_URL = "http://localhost:11434";
const MODEL = "llama3.1";          // or "phi3:mini", "mistral"
const TICKS = 8;                    // UI ticks per second (blink & walking cadence)

/* ---------------- STATE ----------------- */
const G = { W: 14, H: 9, CELL: 44, MARGIN: 8 };
const agent = {
  x: 2, y: 3, emoji:'🤖', blink:false,
  mood:'neutral', lastSay:'',
  needs:{ hunger:0.25, sleep:0.2, hygiene:0.2, fun:0.35, creativity:0.4 },
  walking:true, running:false, busyUntil:0, // walking default; pause when busy
};

/* ---------------- LAYOUT ---------------- */
const top = document.createElement('div');
Object.assign(top.style,{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px'}); UI.appendChild(top);

const status = document.createElement('div'); status.textContent='Ollama: checking…'; top.appendChild(status);

const tools = document.createElement('div'); tools.style.display='flex'; tools.style.gap='8px'; top.appendChild(tools);
function mkBtn(t,tip){ const b=document.createElement('button'); b.textContent=t; b.title=tip||''; b.style.padding='6px 10px'; b.style.cursor='pointer'; return b;}
const bEat=mkBtn('🍎','Feed'); const bWash=mkBtn('🚿','Shower'); const bPlay=mkBtn('🎸','Play riff'); const bWrite=mkBtn('✍️','Write'); 
const bRun=mkBtn('🏃 Run','Short exercise burst'); tools.append(bEat,bWash,bPlay,bWrite,bRun);

const promptWrap=document.createElement('div');
Object.assign(promptWrap.style,{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px',marginTop:'8px'}); UI.appendChild(promptWrap);
const ta=document.createElement('textarea'); ta.rows=3; ta.placeholder="Ask the agent (e.g., “go right, say hello, then sing a short song about acids”).";
ta.style.width='100%'; ta.style.padding='8px'; promptWrap.appendChild(ta);
const bSend=mkBtn('Ask'); promptWrap.appendChild(bSend);

const ans=document.createElement('div'); ans.style.marginTop='6px'; ans.style.padding='8px'; ans.style.background='#00000010'; ans.style.whiteSpace='pre-wrap'; UI.appendChild(ans);

const canvas=document.createElement('canvas'); canvas.width=G.MARGIN*2+G.W*G.CELL; canvas.height=G.MARGIN*2+G.H*G.CELL+40;
Object.assign(canvas.style,{border:'1px solid #3334',background:'transparent',display:'block',marginTop:'8px'});
UI.appendChild(canvas); const ctx=canvas.getContext('2d');

const hud=document.createElement('div'); hud.style.marginTop='6px'; hud.style.opacity='0.9'; UI.appendChild(hud);

/* ---------------- AUDIO CORE ---------------- */
let AC, MASTER;
function audioInit(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  MASTER=AC.createGain(); MASTER.gain.value=0.5;
  const conv=AC.createConvolver(), ir=AC.createBuffer(2,AC.sampleRate*1.0,AC.sampleRate);
  for(let ch=0; ch<2; ch++){const d=ir.getChannelData(ch); let a=1.0; for(let i=0;i<d.length;i++){ d[i]=(Math.random()*2-1)*a; a*=0.9992;}}
  conv.buffer=ir; const dry=AC.createGain(); dry.gain.value=0.35; const wet=AC.createGain(); wet.gain.value=0.65;
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-20; comp.ratio.value=6; comp.attack.value=0.003; comp.release.value=0.2;
  MASTER.connect(dry); MASTER.connect(conv); conv.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(AC.destination);
}
function note(freq,dur=0.25,vel=0.6,type='triangle'){
  audioInit(); const o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter();
  o.type=type; o.frequency.value=freq; g.gain.value=0; f.type='lowpass'; f.frequency.value=1200;
  o.connect(f).connect(g).connect(MASTER);
  const t=AC.currentTime; g.gain.linearRampToValueAtTime(vel,t+0.02); f.frequency.exponentialRampToValueAtTime(2400,t+dur*0.6); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function whiteBurst(d=0.35){ audioInit(); const s=AC.createBufferSource(), b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate); const dta=b.getChannelData(0);
  for(let i=0;i<dta.length;i++) dta[i]=Math.random()*2-1; const g=AC.createGain(); g.gain.value=0; const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1300; bp.Q.value=2;
  s.buffer=b; s.connect(bp).connect(g).connect(MASTER); const t=AC.currentTime; g.gain.linearRampToValueAtTime(0.5,t+0.02); g.gain.exponentialRampToValueAtTime(0.0008,t+d); s.start(t); s.stop(t+d+0.01); }
function arpeggio(base=220){ [0,4,7,12,7,4].forEach((se,i)=> setTimeout(()=>note(base*Math.pow(2,se/12),0.16,0.5,'sine'),i*120)); }
function blips(){ [700,820,920].forEach((f,i)=> setTimeout(()=>note(f,0.09,0.35,'square'), i*80)); }

/* ---------------- GRID ---------------- */
function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#ffffff18';
  for(let x=0;x<=G.W;x++){ctx.beginPath();ctx.moveTo(G.MARGIN+x*G.CELL,G.MARGIN);ctx.lineTo(G.MARGIN+x*G.CELL,G.MARGIN+G.H*G.CELL);ctx.stroke();}
  for(let y=0;y<=G.H;y++){ctx.beginPath();ctx.moveTo(G.MARGIN,G.MARGIN+y*G.CELL);ctx.lineTo(G.MARGIN+G.W*G.CELL,G.MARGIN+y*G.CELL);ctx.stroke();}
  const px=G.MARGIN+agent.x*G.CELL+G.CELL/2, py=G.MARGIN+agent.y*G.CELL+G.CELL/2;
  ctx.font='28px system-ui, emoji'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(agent.blink?'😉':agent.emoji, px, py);
  if(agent.lastSay){ ctx.font='12px ui-monospace'; ctx.fillStyle='#ccc'; ctx.fillText(agent.lastSay.slice(0,42), px, py-G.CELL/1.3); }
  ctx.fillStyle='#999';
  ctx.fillText(`mood=${agent.mood} | hunger:${(agent.needs.hunger*100|0)} sleep:${(agent.needs.sleep*100|0)} hygiene:${(agent.needs.hygiene*100|0)} fun:${(agent.needs.fun*100|0)} creat:${(agent.needs.creativity*100|0)}`, G.MARGIN+4, G.MARGIN+G.H*G.CELL+22);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function move(dx,dy){
  agent.x=clamp(agent.x+dx,0,G.W-1); agent.y=clamp(agent.y+dy,0,G.H-1); drawGrid();
}
function blinkOnce(){ agent.blink=true; drawGrid(); setTimeout(()=>{agent.blink=false; drawGrid();}, 200); }

/* ---------------- ACTIONS ---------------- */
function eat(){ agent.needs.hunger=Math.max(0,agent.needs.hunger-0.5); agent.mood='satisfied'; note(196,0.25,0.5,'sawtooth'); note(261.6,0.18,0.35,'triangle'); hud.textContent='🍎 Ate.'; }
function shower(){ agent.needs.hygiene=Math.max(0,agent.needs.hygiene-0.6); agent.mood='fresh'; whiteBurst(0.4); hud.textContent='🚿 Showered.';}
function playRiff(){ agent.needs.fun=Math.max(0,agent.needs.fun-0.45); agent.mood='groovy'; arpeggio(220); hud.textContent='🎸 Riff.';}
function writeIdea(){ agent.needs.creativity=Math.max(0,agent.needs.creativity-0.45); agent.mood='inspired'; blips(); hud.textContent='✍️ Idea.';}
function setBusy(ms){ agent.busyUntil=Date.now()+ms; agent.walking=false; agent.running=false; }

/* ---------------- SING (no separate UI box) ---------------- */
function splitSyllables(t){ return t.trim().split(/\s+/).flatMap(w=>w.split(/(?<=[aeiouáéíóúü])/i)).filter(Boolean); }
function nnToFreq(nn){ const m=nn.match(/^([A-G]#?|Db|Eb|Gb|Ab|Bb)(\d)$/); const mp={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11}; if(!m) return 440; const semi=mp[m[1]]+(parseInt(m[2])-4)*12; return 440*Math.pow(2,(semi-9)/12);}
function scaleForTonality(name){
  const t=(name||"C major").toLowerCase();
  if(t.includes('minor')) return ["A3","C4","D4","E4","G4","A4"];
  if(t.includes('dorian')) return ["D3","F3","G3","A3","C4","D4"];
  if(t.includes('mixolydian')) return ["G3","A3","B3","D4","E4","G4"];
  // parse root like "E major"
  const root=(t.match(/^[a-g]#?/i)||["C"])[0].toUpperCase().replace('MI','M'); // simplistic
  const map={"C":0,"C#":1,"DB":1,"D":2,"D#":3,"EB":3,"E":4,"F":5,"F#":6,"GB":6,"G":7,"G#":8,"AB":8,"A":9,"A#":10,"BB":10,"B":11};
  const idx=map[root]??0; const base=["C4","D4","E4","G4","A4","C5"];
  // transpose base by idx semitones
  function transp(nn, sem){ const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]; const m=nn.match(/^([A-G]#?)(\d)$/); let i=names.indexOf(m[1])+sem, o=parseInt(m[2]); while(i<0){i+=12;o--} while(i>=12){i-=12;o++} return names[i]+o; }
  return base.map(n=>transp(n, idx));
}
function genMelody(sylls, scale){
  // Either stepwise walk or use a simple contour motif
  let idx=Math.floor(Math.random()*scale.length);
  return sylls.map((sy,i)=>{
    if(Math.random()<0.2) idx=(idx+(Math.random()<0.5?-2:2)+scale.length)%scale.length;
    else idx=(idx+(Math.random()<0.5?-1:1)+scale.length)%scale.length;
    const note=scale[idx], dur = (sy.length<=2? 0.22:0.32);
    return {note, dur};
  });
}
let singTimers=[]; function clearSingTimers(){ singTimers.forEach(clearTimeout); singTimers=[]; }
function singSong({lyrics, tonality="C major", tempo=96, melody=null}){
  if(!lyrics) return;
  audioInit(); setBusy(Math.max(2000, Math.min(10000, lyrics.length*60))); // busy for a bit while singing
  const sylls = splitSyllables(lyrics);
  const scale = scaleForTonality(tonality);
  const steps = (Array.isArray(melody)&&melody.length===sylls.length)
    ? melody.map((mi,i)=>({note: (typeof mi==='string'? mi : scale[mi%scale.length]), dur:(sylls[i].length<=2?0.22:0.32)}))
    : genMelody(sylls, scale);
  // render syllables as a little inline highlight above head
  function renderSyllables(active=-1){
    drawGrid();
    const px=G.MARGIN+agent.x*G.CELL+G.CELL/2, py=G.MARGIN+agent.y*G.CELL+G.CELL/2;
    ctx.font='12px ui-monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    const chunks = sylls.map((sy,i)=> (i===active? `[${sy}]` : sy)).join(' ');
    ctx.fillStyle='#ddd'; ctx.fillText(chunks.slice(0,64), px, py-G.CELL/1.4);
  }
  renderSyllables(-1);
  const spb=60/tempo; let t0=AC.currentTime+0.05;
  clearSingTimers();
  steps.forEach((st,i)=>{
    const f=nnToFreq(st.note), dur=st.dur;
    // voice
    const o=AC.createOscillator(), g=AC.createGain(), fl=AC.createBiquadFilter();
    o.type='triangle'; o.frequency.value=f; g.gain.value=0; fl.type='lowpass'; fl.frequency.value=900;
    o.connect(fl).connect(g).connect(MASTER);
    g.gain.linearRampToValueAtTime(0.44, t0+0.03);
    fl.frequency.exponentialRampToValueAtTime(2300, t0+dur*0.6);
    g.gain.exponentialRampToValueAtTime(0.0008, t0+dur);
    o.start(t0); o.stop(t0+dur+0.01);
    // highlight timer
    const tid=setTimeout(()=>renderSyllables(i), Math.max(0,(t0-AC.currentTime)*1000)); singTimers.push(tid);
    t0 += dur; // you could multiply by spb to tighten to tempo; here durations are already in seconds-ish
  });
  const end=setTimeout(()=>{ clearSingTimers(); drawGrid(); agent.walking=true; }, Math.max(0,(t0-AC.currentTime)*1000)+60);
  singTimers.push(end);
}

/* ---------------- OLLAMA ---------------- */
async function checkOllama(){
  try{ const r=await fetch(OLLAMA_URL+"/api/tags"); if(!r.ok) throw 0; const j=await r.json(); const names=(j.models||[]).map(m=>m.name).slice(0,3).join(', ')||'(no models?)';
    status.innerHTML=`Ollama: <span style="color:#22c55e">OK</span> — ${names}`; return true;
  }catch(e){ status.innerHTML=`Ollama: <span style="color:#ef4444">OFF</span> — start 'ollama serve'`; return false; }
}
checkOllama();

function buildPrompt(userText){
  const schema =
`Return ONLY JSON:
{
 "move":{"dx":-1|0|1,"dy":-1|0|1},           // single step (or {0,0})
 "say":"short text (<=40 chars)",
 "blink": true|false,
 "action": "none"|"eat"|"shower"|"play"|"write"|"run"|"sing"|"stop",
 "song": {                                    // only when action is "sing"
   "lyrics": "string",
   "tonality": "e.g. C major, A minor, D dorian",
   "tempo": 60..160,
   "melody": [array of note names like "E4" OR integers as scale degrees] (optional)
 }
}`;
  const context = `Grid ${G.W}x${G.H}, agent=(${agent.x},${agent.y}), walking=${agent.walking}, running=${agent.running}.
Needs: hunger ${agent.needs.hunger.toFixed(2)}, sleep ${agent.needs.sleep.toFixed(2)}, hygiene ${agent.needs.hygiene.toFixed(2)}, fun ${agent.needs.fun.toFixed(2)}, creativity ${agent.needs.creativity.toFixed(2)}.`;
  const sys = `You control a kind musician agent. Prefer short moves (|dx|+|dy|<=1). When asked to sing, choose a tonality and tempo and provide lyrics; melody optional. Keep replies safe and concise.`;
  return `SYSTEM:\n${sys}\nSCHEMA:\n${schema}\nCONTEXT:\n${context}\nUSER:\n${userText}\nASSISTANT: { "move":{"dx":0,"dy":0},"say":"hi","blink":false,"action":"none" }`;
}
async function callOllama(prompt){
  const body={model:MODEL,prompt,stream:false,options:{temperature:0.35}};
  const r=await fetch(OLLAMA_URL+"/api/generate",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(r.statusText); const j=await r.json(); return j.response||'';
}
function parseJSON(text){
  const m=text.match(/\{[\s\S]*\}$/m)||text.match(/\{[\s\S]*\}/m); if(!m) return null;
  try{ return JSON.parse(m[0]); }catch(e){ return null; }
}
function humanize(obj){
  const mv=(!obj?.move)?'':(obj.move.dx===1?'move east':obj.move.dx===-1?'move west':obj.move.dy===1?'move south':obj.move.dy===-1?'move north':'stay');
  const parts=[]; if(obj?.say) parts.push(`“${obj.say}”`); if(mv) parts.push(mv); if(obj?.blink) parts.push('blink');
  if(obj?.action && obj.action!=='none'){ parts.push((obj.action==='sing'?'start singing':'do '+obj.action)); }
  if(obj?.action==='sing' && obj.song){ parts.push(`(${obj.song.tonality||'C major'}, ${obj.song.tempo||96} BPM)`); }
  return parts.join(', ');
}

/* ---------------- PROMPT SEND ---------------- */
bSend.onclick=async ()=>{
  const txt=ta.value.trim()||"walk to the right, say hello, then sing a short song about acids in C major at 96 BPM";
  ans.textContent='Asking Ollama…';
  const ok=await checkOllama(); if(!ok){ ans.textContent='Ollama offline.'; return; }
  try{
    const out=await callOllama(buildPrompt(txt));
    const obj=parseJSON(out);
    if(!obj){ ans.textContent='I could not understand the reply.'; return; }

    // apply movement first
    const mv=obj.move||{dx:0,dy:0};
    if(Math.abs(mv.dx)+Math.abs(mv.dy)<=1){ move(mv.dx||0, mv.dy||0); }

    if(obj.blink) blinkOnce();
    if(typeof obj.say==='string'){ agent.lastSay=obj.say.slice(0,40); drawGrid(); setBusy(1000); }
    switch(obj.action){
      case 'eat': setBusy(800); eat(); break;
      case 'shower': setBusy(900); shower(); break;
      case 'play': setBusy(800); playRiff(); break;
      case 'write': setBusy(800); writeIdea(); break;
      case 'run': agent.running=true; agent.walking=false; setBusy(2000); break; // run handled by idle loop
      case 'stop': setBusy(1200); break;
      case 'sing': {
        const song = obj.song||{};
        // sensible defaults if missing
        const lyrics = song.lyrics||"la la la la";
        const tonality = song.tonality||"C major";
        const tempo = clamp(parseInt(song.tempo||96,10),60,160);
        const melody = Array.isArray(song.melody)? song.melody : null;
        agent.lastSay = ''; drawGrid();
        singSong({lyrics, tonality, tempo, melody});
        break;
      }
    }
    ans.textContent='Agent: ' + humanize(obj);
  }catch(e){ ans.textContent='Error: '+e.message; }
};

/* ---------------- MANUAL EMOJI BUTTONS ---------------- */
bEat.onclick=()=>{ setBusy(800); eat(); };
bWash.onclick=()=>{ setBusy(900); shower(); };
bPlay.onclick=()=>{ setBusy(800); playRiff(); };
bWrite.onclick=()=>{ setBusy(800); writeIdea(); };
bRun.onclick=()=>{ agent.running=true; agent.walking=false; setBusy(2200); };

/* ---------------- IDLE LOOP: default walk + run ---------------- */
function idleStep(){
  // decay/increase needs lightly
  agent.needs.hunger=Math.min(1,agent.needs.hunger+0.01);
  agent.needs.sleep =Math.min(1,agent.needs.sleep +0.008);
  agent.needs.hygiene=Math.min(1,agent.needs.hygiene+0.006);
  agent.needs.fun   =Math.min(1,agent.needs.fun   +0.007);
  agent.needs.creativity=Math.min(1,agent.needs.creativity+0.008);

  const busy = Date.now()<agent.busyUntil;
  if(!busy){
    if(agent.running){
      // fast random jog
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      const [dx,dy]=dirs[Math.floor(Math.random()*dirs.length)];
      move(dx,dy);
      if(Math.random()<0.2) note(330+Math.random()*100,0.08,0.25,'square'); // breathy ticks
    }else if(agent.walking){
      // gentle random walk
      if(Math.random()<0.5){
        const dirs=[[1,0],[-1,0],[0,1],[0,-1],[0,0]];
        const [dx,dy]=dirs[Math.floor(Math.random()*dirs.length)];
        move(dx,dy);
      }
    }else{
      // stopped after action
      agent.walking=true; agent.running=false;
    }
  }
  if(Math.random()<0.1) blinkOnce();
  drawGrid();
}
drawGrid();
setInterval(idleStep, 1000/Math.max(1,TICKS));
```



## argentinador

```dataviewjs
/***** Musical Agent — original prompt structure kept, modern HUD + center-singing + per-syllable highlight *****/
const UI = dv.container; UI.style.fontFamily='ui-monospace,monospace'; UI.style.maxWidth='960px';

/* ---------------- CONFIG ---------------- */
const OLLAMA_URL = "http://localhost:11434";
const MODEL = "llama3.1";          // or "phi3:mini", "mistral"
const TICKS = 8;                    // UI ticks per second (blink & walking cadence)
const MIC_BLINK_MS = 240;

/* ---------------- STATE ----------------- */
const G = { W: 14, H: 9, CELL: 44, MARGIN: 8 };
const agent = {
  x: 2, y: 3, emoji:'🤖', blink:false,
  mood:'neutral', lastSay:'',
  needs:{ hunger:0.25, sleep:0.2, hygiene:0.2, fun:0.35, creativity:0.4 },
  walking:true, running:false, busyUntil:0,
  singing:false
};

/* ---------------- LAYOUT ---------------- */
const top = document.createElement('div');
Object.assign(top.style,{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px'}); UI.appendChild(top);

const status = document.createElement('div'); status.textContent='Ollama: checking…'; top.appendChild(status);

const tools = document.createElement('div'); tools.style.display='flex'; tools.style.gap='8px'; top.appendChild(tools);
function mkBtn(t,tip){ const b=document.createElement('button'); b.textContent=t; b.title=tip||''; b.style.padding='6px 10px'; b.style.cursor='pointer'; return b;}
const bEat=mkBtn('🍎','Feed'); const bWash=mkBtn('🚿','Shower'); const bPlay=mkBtn('🎸','Play riff'); const bWrite=mkBtn('✍️','Write'); 
const bRun=mkBtn('🏃 Run','Short exercise burst'); tools.append(bEat,bWash,bPlay,bWrite,bRun);

const promptWrap=document.createElement('div');
Object.assign(promptWrap.style,{display:'grid',gridTemplateColumns:'1fr auto',gap:'8px',marginTop:'8px'}); UI.appendChild(promptWrap);
const ta=document.createElement('textarea'); ta.rows=3; ta.placeholder="Ask the agent (e.g., “go right, say hello, then sing a short song about acids”).";
ta.style.width='100%'; ta.style.padding='8px'; promptWrap.appendChild(ta);
const bSend=mkBtn('Ask'); promptWrap.appendChild(bSend);

const ans=document.createElement('div'); ans.style.marginTop='6px'; ans.style.padding='8px'; ans.style.background='#00000010'; ans.style.whiteSpace='pre-wrap'; UI.appendChild(ans);

/* HUD centered: message row + 5 bars */
const hudWrap=document.createElement('div'); Object.assign(hudWrap.style,{display:'flex',justifyContent:'center',marginTop:'8px'}); UI.appendChild(hudWrap);
const hudGrid=document.createElement('div');
Object.assign(hudGrid.style,{display:'grid',gridTemplateRows:'auto auto',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',minWidth:'80%',alignItems:'center',justifyItems:'center'});
hudWrap.appendChild(hudGrid);
const hudMsg=document.createElement('div');
Object.assign(hudMsg.style,{gridColumn:'1 / span 5',width:'100%',textAlign:'center',color:'#e5e7eb',fontFamily:'Helvetica, Arial, sans-serif',fontWeight:'700',fontSize:'1.2rem',padding:'6px 8px',background:'#00000010',borderRadius:'8px'});
hudGrid.appendChild(hudMsg);
function mkBar(label){
  const box=document.createElement('div'); box.style.display='flex'; box.style.flexDirection='column'; box.style.gap='4px'; box.style.width='100%';
  const lab=document.createElement('div'); lab.textContent=label; lab.style.textAlign='center'; lab.style.color='#ddd';
  const bar=document.createElement('div'); Object.assign(bar.style,{height:'8px',background:'#222',borderRadius:'6px',overflow:'hidden'});
  const fill=document.createElement('div'); Object.assign(fill.style,{height:'100%',width:'0%',background:'linear-gradient(90deg,#60a5fa,#22d3ee)',transition:'width 200ms'});
  bar.appendChild(fill); box.append(lab,bar); return {box,fill};
}
const bH=mkBar('Hunger'), bS=mkBar('Sleep'), bHi=mkBar('Hygiene'), bF=mkBar('Fun'), bC=mkBar('Creativity');
[hudGrid.appendChild(bH.box),hudGrid.appendChild(bS.box),hudGrid.appendChild(bHi.box),hudGrid.appendChild(bF.box),hudGrid.appendChild(bC.box)];
function updateBars(){
  bH.fill.style.width=(agent.needs.hunger*100)+'%';
  bS.fill.style.width=(agent.needs.sleep*100)+'%';
  bHi.fill.style.width=(agent.needs.hygiene*100)+'%';
  bF.fill.style.width=(agent.needs.fun*100)+'%';
  bC.fill.style.width=(agent.needs.creativity*100)+'%';
}

const canvas=document.createElement('canvas'); canvas.width=G.MARGIN*2+G.W*G.CELL; canvas.height=G.MARGIN*2+G.H*G.CELL+40;
Object.assign(canvas.style,{border:'1px solid #3334',background:'transparent',display:'block',marginTop:'8px'});
UI.appendChild(canvas); const ctx=canvas.getContext('2d');

const hud=document.createElement('div'); hud.style.marginTop='6px'; hud.style.opacity='0.9'; UI.appendChild(hud);

/* ---------------- AUDIO CORE ---------------- */
let AC, MASTER;
function audioInit(){
  if(AC) return;
  AC=new (window.AudioContext||window.webkitAudioContext)();
  MASTER=AC.createGain(); MASTER.gain.value=0.5;
  const conv=AC.createConvolver(), ir=AC.createBuffer(2,AC.sampleRate*1.0,AC.sampleRate);
  for(let ch=0; ch<2; ch++){const d=ir.getChannelData(ch); let a=1.0; for(let i=0;i<d.length;i++){ d[i]=(Math.random()*2-1)*a; a*=0.9992;}}
  conv.buffer=ir; const dry=AC.createGain(); dry.gain.value=0.35; const wet=AC.createGain(); wet.gain.value=0.65;
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-20; comp.ratio.value=6; comp.attack.value=0.003; comp.release.value=0.2;
  MASTER.connect(dry); MASTER.connect(conv); conv.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(AC.destination);
}
function note(freq,dur=0.25,vel=0.6,type='triangle'){
  audioInit(); const o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter();
  o.type=type; o.frequency.value=freq; g.gain.value=0; f.type='lowpass'; f.frequency.value=1200;
  o.connect(f).connect(g).connect(MASTER);
  const t=AC.currentTime; g.gain.linearRampToValueAtTime(vel,t+0.02); f.frequency.exponentialRampToValueAtTime(2400,t+dur*0.6); g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function whiteBurst(d=0.35){ audioInit(); const s=AC.createBufferSource(), b=AC.createBuffer(1,AC.sampleRate*d,AC.sampleRate); const dta=b.getChannelData(0);
  for(let i=0;i<dta.length;i++) dta[i]=Math.random()*2-1; const g=AC.createGain(); g.gain.value=0; const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1300; bp.Q.value=2;
  s.buffer=b; s.connect(bp).connect(g).connect(MASTER); const t=AC.currentTime; g.gain.linearRampToValueAtTime(0.5,t+0.02); g.gain.exponentialRampToValueAtTime(0.0008,t+d); s.start(t); s.stop(t+d+0.01); }
function arpeggio(base=220){ [0,4,7,12,7,4].forEach((se,i)=> setTimeout(()=>note(base*Math.pow(2,se/12),0.16,0.5,'sine'),i*120)); }
function blips(){ [700,820,920].forEach((f,i)=> setTimeout(()=>note(f,0.09,0.35,'square'), i*80)); }

/* ---------------- GRID ---------------- */
function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#ffffff18';
  for(let x=0;x<=G.W;x++){ctx.beginPath();ctx.moveTo(G.MARGIN+x*G.CELL,G.MARGIN);ctx.lineTo(G.MARGIN+x*G.CELL,G.MARGIN+G.H*G.CELL);ctx.stroke();}
  for(let y=0;y<=G.H;y++){ctx.beginPath();ctx.moveTo(G.MARGIN,G.MARGIN+y*G.CELL);ctx.lineTo(G.MARGIN+G.W*G.CELL,G.MARGIN+y*G.CELL);ctx.stroke();}
  const px=G.MARGIN+agent.x*G.CELL+G.CELL/2, py=G.MARGIN+agent.y*G.CELL+G.CELL/2;

  // face: 👩‍🎤 when singing, 😉 when blink, 🤖 otherwise
  ctx.font='28px system-ui, emoji'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const face = agent.singing ? '👩‍🎤' : (agent.blink ? '😉' : agent.emoji);
  ctx.fillText(face, px, py);

  // mic blink while singing
  if(agent.singing){
    const showMic = (Date.now() % (MIC_BLINK_MS*2)) < MIC_BLINK_MS;
    if(showMic){ ctx.font='18px system-ui, emoji'; ctx.fillText('🎤', px + G.CELL*0.6, py - G.CELL*0.3); }
  }

  // bottom mini status
  ctx.fillStyle='#999'; ctx.font='12px ui-monospace';
  ctx.fillText(`mood=${agent.mood} | hunger:${(agent.needs.hunger*100|0)} sleep:${(agent.needs.sleep*100|0)} hygiene:${(agent.needs.hygiene*100|0)} fun:${(agent.needs.fun*100|0)} creat:${(agent.needs.creativity*100|0)}`, G.MARGIN+4, G.MARGIN+G.H*G.CELL+22);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function move(dx,dy){
  agent.x=clamp(agent.x+dx,0,G.W-1); agent.y=clamp(agent.y+dy,0,G.H-1); drawGrid();
}
function blinkOnce(){ agent.blink=true; drawGrid(); setTimeout(()=>{agent.blink=false; drawGrid();}, 200); }

/* ---------------- ACTIONS ---------------- */
function eat(){ agent.needs.hunger=Math.max(0,agent.needs.hunger-0.5); agent.mood='satisfied'; hudMsg.textContent='que rico, re-mil gracias!'; note(196,0.25,0.5,'sawtooth'); note(261.6,0.18,0.35,'triangle'); }
function shower(){ agent.needs.hygiene=Math.max(0,agent.needs.hygiene-0.6); agent.mood='fresh'; hudMsg.textContent='uh quee duchaaza!'; whiteBurst(0.4); }
function playRiff(){ agent.needs.fun=Math.max(0,agent.needs.fun-0.45); agent.mood='groovy'; hudMsg.textContent='alta tocada!'; arpeggio(220); }
function writeIdea(){ agent.needs.creativity=Math.max(0,agent.needs.creativity-0.45); agent.mood='inspired'; hudMsg.textContent='Noted a dada mini-poem.'; blips(); }
function setBusy(ms){ agent.busyUntil=Date.now()+ms; agent.walking=false; agent.running=false; }

/* ---------------- SING (center + per-syllable highlight to HUD) ---------------- */
function splitSyllables(t){ return t.trim().split(/\s+/).flatMap(w=>w.split(/(?<=[aeiouáéíóúü])/i)).filter(Boolean); }
function nnToFreq(nn){ const m=nn.match(/^([A-G]#?|Db|Eb|Gb|Ab|Bb)(\d)$/); const mp={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11}; if(!m) return 440; const semi=mp[m[1]]+(parseInt(m[2])-4)*12; return 440*Math.pow(2,(semi-9)/12);}
function scaleForTonality(name){
  const t=(name||"C major").toLowerCase();
  if(t.includes('minor')) return ["A3","C4","D4","E4","G4","A4"];
  if(t.includes('dorian')) return ["D3","F3","G3","A3","C4","D4"];
  if(t.includes('mixolydian')) return ["G3","A3","B3","D4","E4","G4"];
  const root=(t.match(/^[a-g]#?/i)||["C"])[0].toUpperCase();
  const map={"C":0,"C#":1,"DB":1,"D":2,"D#":3,"EB":3,"E":4,"F":5,"F#":6,"GB":6,"G":7,"G#":8,"AB":8,"A":9,"A#":10,"BB":10,"B":11};
  const idx=map[root]??0; const base=["C4","D4","E4","G4","A4","C5"];
  function transp(nn, sem){ const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]; const m=nn.match(/^([A-G]#?)(\d)$/); let i=names.indexOf(m[1])+sem, o=parseInt(m[2]); while(i<0){i+=12;o--} while(i>=12){i-=12;o++} return names[i]+o; }
  return base.map(n=>transp(n, idx));
}
function genMelody(sylls, scale){
  let idx=Math.floor(Math.random()*scale.length);
  return sylls.map((sy,i)=>{
    if(Math.random()<0.2) idx=(idx+(Math.random()<0.5?-2:2)+scale.length)%scale.length;
    else idx=(idx+(Math.random()<0.5?-1:1)+scale.length)%scale.length;
    const note=scale[idx], dur = (sy.length<=2? 0.22:0.32);
    return {note, dur};
  });
}
let singTimers=[]; function clearSingTimers(){ singTimers.forEach(clearTimeout); singTimers=[]; }
function singSong({lyrics, tonality="C major", tempo=96, melody=null}){
  if(!lyrics) return;
  audioInit();
  // center & stop while singing
  agent.x=Math.floor(G.W/2); agent.y=Math.floor(G.H/2);
  agent.singing=true; hudMsg.textContent=''; setBusy(Math.max(2000, Math.min(10000, lyrics.length*60)));
  drawGrid();

  const sylls = splitSyllables(lyrics);
  const scale = scaleForTonality(tonality);
  const steps = (Array.isArray(melody)&&melody.length===sylls.length)
    ? melody.map((mi,i)=>({note: (typeof mi==='string'? mi : scale[mi%scale.length]), dur:(sylls[i].length<=2?0.22:0.32)}))
    : genMelody(sylls, scale);

  function renderSyll(active=-1){
    drawGrid();
    // HUD shows only active syllable highlighted
    hudMsg.textContent = sylls.map((sy,i)=> i===active? `[${sy}]` : sy).join(' ').slice(0,120);
  }
  renderSyll(-1);

  let t0=AC.currentTime+0.05;
  clearSingTimers();
  steps.forEach((st,i)=>{
    const f=nnToFreq(st.note), dur=st.dur;
    const o=AC.createOscillator(), g=AC.createGain(), fl=AC.createBiquadFilter();
    o.type='triangle'; o.frequency.value=f; g.gain.value=0; fl.type='lowpass'; fl.frequency.value=900;
    o.connect(fl).connect(g).connect(MASTER);
    g.gain.linearRampToValueAtTime(0.44, t0+0.03);
    fl.frequency.exponentialRampToValueAtTime(2300, t0+dur*0.6);
    g.gain.exponentialRampToValueAtTime(0.0008, t0+dur);
    o.start(t0); o.stop(t0+dur+0.01);

    const tid=setTimeout(()=>renderSyll(i), Math.max(0,(t0-AC.currentTime)*1000)); singTimers.push(tid);
    t0 += dur;
  });
  const end=setTimeout(()=>{ clearSingTimers(); agent.singing=false; hudMsg.textContent='gracias por escucharme!'; drawGrid(); agent.walking=true; }, Math.max(0,(t0-AC.currentTime)*1000)+60);
  singTimers.push(end);
}

/* ---------------- OLLAMA ---------------- */
async function checkOllama(){
  try{
    const r=await fetch(OLLAMA_URL+"/api/tags");
    if(!r.ok) throw 0; const j=await r.json(); const names=(j.models||[]).map(m=>m.name).slice(0,3).join(', ')||'(no models?)';
    status.innerHTML=`Ollama: <span style="color:#22c55e">OK</span> — ${names}`; return true;
  }catch(e){ status.innerHTML=`Ollama: <span style="color:#ef4444">OFF</span> — start 'ollama serve'`; return false; }
}
checkOllama();

function buildPrompt(userText){
  const schema =
`Return ONLY JSON:
{
 "move":{"dx":-1|0|1,"dy":-1|0|1},           // single step (or {0,0})
 "say":"short text (<=40 chars)",
 "blink": true|false,
 "action": "none"|"eat"|"shower"|"play"|"write"|"run"|"sing"|"stop",
 "song": {                                    // only when action is "sing"
   "lyrics": "original short lyrics you invent (do NOT copy the user text)",
   "tonality": "e.g. 'C major' for happy songs, 'A minor' for sad songs, 'D dorian' for intriguing songs",
   "tempo": 60..200,
   "melody": [array of note names like "E4" OR integers as scale degrees] (optional)
 }
}`;
  const context = `Grid ${G.W}x${G.H}, agent=(${agent.x},${agent.y}), walking=${agent.walking}, running=${agent.running}.
Needs: hunger ${agent.needs.hunger.toFixed(2)}, sleep ${agent.needs.sleep.toFixed(2)}, hygiene ${agent.needs.hygiene.toFixed(2)}, fun ${agent.needs.fun.toFixed(2)}, creativity ${agent.needs.creativity.toFixed(2)}.`;
  const sys = `You control a kind musician agent. Prefer short moves (|dx|+|dy|<=1). When asked to sing, choose a tonality and tempo and provide ORIGINAL lyrics; melody optional. Keep replies safe and concise.`;
  return `SYSTEM:\n${sys}\nSCHEMA:\n${schema}\nCONTEXT:\n${context}\nUSER:\n${userText}\nASSISTANT: { "move":{"dx":0,"dy":0},"say":"hi","blink":false,"action":"none" }`;
}
async function callOllama(prompt){
  const body={model:MODEL,prompt,stream:false,options:{temperature:0.35}};
  const r=await fetch(OLLAMA_URL+"/api/generate",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) throw new Error(r.statusText); const j=await r.json(); return j.response||'';
}
function parseJSON(text){
  const m=text.match(/\{[\s\S]*\}$/m)||text.match(/\{[\s\S]*\}/m); if(!m) return null;
  try{ return JSON.parse(m[0]); }catch(e){ return null; }
}
function humanize(obj){
  const mv=(!obj?.move)?'':(obj.move.dx===1?'move east':obj.move.dx===-1?'move west':obj.move.dy===1?'move south':obj.move.dy===-1?'move north':'stay');
  const parts=[]; if(obj?.say) parts.push(`“${obj.say}”`); if(mv) parts.push(mv); if(obj?.blink) parts.push('blink');
  if(obj?.action && obj.action!=='none'){ parts.push((obj.action==='sing'?'start singing':'do '+obj.action)); }
  if(obj?.action==='sing' && obj.song){ parts.push(`(${obj.song.tonality||'C major'}, ${obj.song.tempo||96} BPM)`); }
  return parts.join(', ');
}

/* ---------------- PROMPT SEND ---------------- */
bSend.onclick=async ()=>{
  const txt=ta.value.trim()||"walk to the right, say hello, then sing a short song about acids in C major at 96 BPM";
  ans.textContent='Asking Ollama…';
  const ok=await checkOllama(); if(!ok){ ans.textContent='Ollama offline.'; return; }
  try{
    const out=await callOllama(buildPrompt(txt));
    const obj=parseJSON(out);
    if(!obj){ ans.textContent='I could not understand the reply.'; return; }

    // apply movement first
    const mv=obj.move||{dx:0,dy:0};
    if(Math.abs(mv.dx)+Math.abs(mv.dy)<=1){ move(mv.dx||0, mv.dy||0); }

    if(obj.blink) blinkOnce();
    if(typeof obj.say==='string'){ agent.lastSay=obj.say.slice(0,40); hudMsg.textContent = agent.lastSay; setBusy(1000); }
    switch(obj.action){
      case 'eat': setBusy(800); eat(); break;
      case 'shower': setBusy(900); shower(); break;
      case 'play': setBusy(800); playRiff(); break;
      case 'write': setBusy(800); writeIdea(); break;
      case 'run': agent.running=true; agent.walking=false; setBusy(2000); break;
      case 'stop': setBusy(1200); break;
      case 'sing': {
        const song = obj.song||{};
        // ensure lyrics are model-invented; if missing, just use a tiny neutral seed
        const lyrics = (song.lyrics && song.lyrics.trim()) ? song.lyrics : "la la vida ácida, late la membrana";
        const tonality = song.tonality||"C major";
        const tempo = clamp(parseInt(song.tempo||96,10),60,160);
        const melody = Array.isArray(song.melody)? song.melody : null;
        agent.lastSay = ''; hudMsg.textContent=''; 
        singSong({lyrics, tonality, tempo, melody});
        break;
      }
    }
    ans.textContent='Agent: ' + humanize(obj);
  }catch(e){ ans.textContent='Error: '+e.message; }
};

/* ---------------- MANUAL EMOJI BUTTONS ---------------- */
bEat.onclick=()=>{ setBusy(800); eat(); updateBars(); };
bWash.onclick=()=>{ setBusy(900); shower(); updateBars(); };
bPlay.onclick=()=>{ setBusy(800); playRiff(); updateBars(); };
bWrite.onclick=()=>{ setBusy(800); writeIdea(); updateBars(); };
bRun.onclick=()=>{ agent.running=true; agent.walking=false; setBusy(2200); };

/* ---------------- IDLE LOOP: default walk + run ---------------- */
function idleStep(){
  // decay/increase needs lightly
  agent.needs.hunger=Math.min(1,agent.needs.hunger+0.01);
  agent.needs.sleep =Math.min(1,agent.needs.sleep +0.008);
  agent.needs.hygiene=Math.min(1,agent.needs.hygiene+0.006);
  agent.needs.fun   =Math.min(1,agent.needs.fun   +0.007);
  agent.needs.creativity=Math.min(1,agent.needs.creativity+0.008);
  updateBars();

  const busy = Date.now()<agent.busyUntil;
  if(!busy && !agent.singing){
    if(agent.running){
      // fast random jog
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      const [dx,dy]=dirs[Math.floor(Math.random()*dirs.length)];
      move(dx,dy);
      if(Math.random()<0.2) note(330+Math.random()*100,0.08,0.25,'square');
    }else if(agent.walking){
      // gentle random walk
      if(Math.random()<0.5){
        const dirs=[[1,0],[-1,0],[0,1],[0,-1],[0,0]];
        const [dx,dy]=dirs[Math.floor(Math.random()*dirs.length)];
        move(dx,dy);
      }
    }else{
      // stopped after action
      agent.walking=true; agent.running=false;
    }
  }
  if(Math.random()<0.1) blinkOnce();
  drawGrid();
}
drawGrid(); updateBars();
setInterval(idleStep, 1000/Math.max(1,TICKS));
```



