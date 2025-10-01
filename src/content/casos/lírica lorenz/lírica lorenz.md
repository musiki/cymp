

Aplicación de la lógica de las ecuaciones de Lorenz que Ligeti va a comparar con sus comportamientos orquestales en [[Atmosphères]]
# aplicación a la lírica

Sustrato: Canto de Diana, Alejandra Pizarnik 


```dataviewjs
// Pizarnik • “glissando textual” (fluctuación local + corriente global)
// Versión corregida (evita features modernos que pueden romper DataviewJS)
// - Sin catch vacío (usa catch(e){})
// - Sin \p{L} en regex (usa rango explícito latino)
// Pegar como ```dataviewjs``` en Obsidian.

const root = dv.container;
if (root.__pz_cleanup) { try { root.__pz_cleanup(); } catch(e){} }
root.innerHTML = "";

// ---------- UI ----------
root.insertAdjacentHTML("beforeend", `
<style>
.pz-wrap{font:14px/1.45 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--text-normal)}
.pz-grid{display:grid;grid-template-columns:1fr;gap:10px}
.pz-ctrls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pz-ctrls label{display:flex;flex-direction:column;gap:4px}
.pz-ctrls input[type=range]{width:100%}
.pz-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pz-row .btn{padding:6px 10px;border:1px solid var(--background-modifier-border);border-radius:8px;background:transparent;cursor:pointer}
.pz-row .btn:hover{background:var(--background-modifier-hover)}
.pz-out{white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;border:1px solid var(--background-modifier-border);border-radius:8px;padding:12px;min-height:240px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;opacity:.8}
.pz-faint{opacity:.7}
.pz-ghost{opacity:.45}
</style>

<div class="pz-wrap">
  <div class="pz-grid">
    <div class="pz-ctrls">
      <label>corriente_global [líneas/seg]
        <input id="pz_drift" type="range" min="-4" max="4" step="0.01" value="0.35">
        <span class="mono" id="pz_drift_out">0.35</span>
      </label>
      <label>fluctuación_local p
        <input id="pz_sigma" type="range" min="0" max="1" step="0.001" value="0.18">
        <span class="mono" id="pz_sigma_out">0.18</span>
      </label>
      <label>ventana [líneas]
        <input id="pz_win" type="range" min="3" max="18" step="1" value="9">
        <span class="mono" id="pz_win_out">9</span>
      </label>
      <label>recursividad (mezcla)
        <input id="pz_recur" type="range" min="0" max="1" step="0.01" value="0.35">
        <span class="mono" id="pz_recur_out">0.35</span>
      </label>
      <label>densidad mutación
        <input id="pz_density" type="range" min="0" max="1" step="0.01" value="0.5">
        <span class="mono" id="pz_density_out">0.50</span>
      </label>
      <label>semilla aleatoria
        <input id="pz_seed" type="range" min="1" max="9999" step="1" value="777">
        <span class="mono" id="pz_seed_out">777</span>
      </label>
    </div>

    <div class="pz-row">
      <button id="pz_start" class="btn">Start</button>
      <button id="pz_stop" class="btn">Stop</button>
      <button id="pz_reseed" class="btn">Re-seed</button>
      <span class="mono" id="pz_status">idle</span>
      <span class="mono pz-faint" id="pz_info"></span>
    </div>

    <div id="pz_out" class="pz-out"></div>
  </div>
</div>
`);

// ---------- helpers ----------
const $ = id => root.querySelector(id);
function setText(el, v){ el.textContent = v; }
function clamp(x,a,b){ return Math.min(b, Math.max(a,x)); }

// PRNG determinístico (Mulberry32)
function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rnd){
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(rnd()*(i+1));
    const tmp = a[i]; a[i]=a[j]; a[j]=tmp;
  }
  return a;
}

// UI refs
const driftEl = $("#pz_drift"), driftOut = $("#pz_drift_out");
const sigmaEl = $("#pz_sigma"), sigmaOut = $("#pz_sigma_out");
const winEl   = $("#pz_win"),   winOut   = $("#pz_win_out");
const recurEl = $("#pz_recur"), recurOut = $("#pz_recur_out");
const densEl  = $("#pz_density"), densOut = $("#pz_density_out");
const seedEl  = $("#pz_seed"), seedOut = $("#pz_seed_out");
const startBtn=$("#pz_start"), stopBtn=$("#pz_stop"), reseedBtn=$("#pz_reseed");
const statusEl=$("#pz_status"), infoEl=$("#pz_info");
const outEl = $("#pz_out");
function syncUI(){
  setText(driftOut, Number(driftEl.value).toFixed(2));
  setText(sigmaOut, Number(sigmaEl.value).toFixed(2));
  setText(winOut,   winEl.value);
  setText(recurOut, Number(recurEl.value).toFixed(2));
  setText(densOut,  Number(densEl.value).toFixed(2));
  setText(seedOut,  seedEl.value);
}
["input","change"].forEach(evt=>{
  [driftEl,sigmaEl,winEl,recurEl,densEl,seedEl].forEach(x=>x.addEventListener(evt, syncUI));
});
syncUI();

// ---------- corpus ----------
const raw = String.raw`He dado el salto de mí al alba.
He dejado mi cuerpo junto a la luz
y he cantado la tristeza de lo que nace

2

Éstas son las versiones que nos propone:
un agujero, una pared que tiembla…

3

sólo la sed
el silencio
ningún encuentro
cuídate de mí amor mío
cuídate de la silenciosa en el desierto
de la viajera con el vaso vacío
y de la sombra de su sombra

4

AHORA BIEN:
Quién dejará de hundir su mano en busca del tributo para la pequeña
olvidada. El frío pagará. Pagará el viento. La lluvia pagará. Pagará el
trueno.
A Aurora y Julio Cortázar

5

por un minuto de vida breve
única de ojos abiertos
por un minuto de ver
en el cerebro flores pequeñas
danzando como palabras en la boca de un mudo

6

ella se desnuda en el paraíso
de su memoria
ella desconoce el feroz destino
de sus visiones
ella tiene miedo de no saber nombrar
lo que no existe

7

Salta con la camisa en llamas
de estrella a estrella.
de sombra en sombra.
Muere de muerte lejana
la que ama al viento.

8

Memoria iluminada, galería donde vaga la sombra de lo que espero.
No es verdad que vendrá. No es verdad que no vendrá.

9

Estos huesos brillando en la noche,
estas palabras como piedras preciosas
en la garganta viva de un pájaro petrificado,
este verde muy amado,
este lila caliente,
este corazón sólo misterioso.

10

un viento débil
lleno de rostros doblados
que recorto en forma de objetos que amar

11

ahora
en esta hora inocente
yo y la que fui nos sentamos
en el umbral de mi mirada

12

no más las dulces metamorfosis de una niña de seda
sonámbula ahora en la cornisa de niebla
su despertar de mano respirando
de flor que se abre al viento

13

explicar con palabras de este mundo
que partió de mí un barco llevándome

14

El poema que no digo,
el que no merezco.
Miedo de ser dos
camino del espejo:
alguien en mí dormido
me come y me bebe.

15

Extraño desacostumbrarme
de la hora en que nací.
Extraño no ejercer más
oficio de recién llegada.

16

has construido tu casa
has emplumado tus pájaros
has golpeado al viento
con tus propios huesos
has terminado sola
lo que nadie comenzó

17

Días en que una palabra lejana se apodera de mí. Voy por esos días sonámbula y transparente. La hermosa autómata se canta, se encanta, se cuenta casos y cosas: nido de hilos rígidos donde me danzo y me lloro en mis numerosos funerales. (Ella es su espejo incendiado, su espera en hogueras frías, su elemento místico, su fornicación de nombres creciendo solos en la noche pálida.)

18

como un poema enterado
del silencio de las cosas
hablas para no verme

19

cuando vea los ojos
que tengo en los míos tatuados

20

dice que no sabe del miedo de la muerte del amor
dice que tiene miedo de la muerte del amor
dice que el amor es muerte es miedo
dice que la muerte es miedo es amor
dice que no sabe
A Laure Bataillon

21

he nacido tanto
y doblemente sufrido
en la memoria de aquí y de allá

22

en la noche
un espejo para la pequeña muerta
un espejo de cenizas

23

una mirada desde la alcantarilla
puede ser una visión del mundo
la rebelión consiste en mirar una rosa
hasta pulverizarse los ojos

24

(un dibujo de Wols)
estos hilos aprisionan a las sombras
y las obligan a rendir cuentas del silencio
estos hilos unen la mirada al sollozo

25

(exposición Goya)
un agujero en la noche
súbitamente invadido por un ángel

26

(un dibujo de Klee)
cuando el palacio de la noche
encienda su hermosura
pulsaremos los espejos
hasta que nuestros rostros canten como ídolos

27

un golpe del alba en las flores
me abandona ebria de nada y de luz lila
ebria de inmovilidad y de certeza

28

te alejas de los nombres
que hilan el silencio de las cosas

29

Aquí vivimos con una mano en la garganta. Que nada es posible ya lo sabían los que inventaban lluvias y tejían palabras con el tormento de la ausencia. Por eso en sus plegarias había un sonido de manos enamoradas de la niebla.
A André Pieyre de Mandiargues

30

en el invierno fabuloso
la endecha de las alas en la lluvia
en la memoria del agua dedos de niebla

31

Es un cerrar los ojos y jurar no abrirlos. En tanto afuera se alimenten de relojes y de flores nacidas de la astucia. Pero con los ojos cerrados y un sufrimiento en verdad demasiado grande pulsamos los espejos hasta que las palabras olvidadas suenan mágicamente.

32

Zona de plagas donde la dormida come
lentamente
su corazón de medianoche.

33

alguna vez
alguna vez tal vez
me iré sin quedarme
me iré como quien se va
A Ester Singer

34

la pequeña viajera
moría explicando su muerte
sabios animales nostálgicos
visitaban su cuerpo caliente

35

Vida, mi vida, déjate caer, déjate doler, mi vida, déjate enlazar de fuego, de silencio ingenuo, de piedras verdes en la casa de la noche, déjate caer y doler, mi vida.

36

en la jaula del tiempo
la dormida mira sus ojos solos
el viento le trae
la tenue respuesta de las hojas
A Alain Glass

37

más allá de cualquier zona prohibida
hay un espejo para nuestra triste transparencia

38

Este canto arrepentido, vigía detrás de mis poemas:
Este canto me desmiente, me amordaza.`;

// ---------- limpieza / filtrado ----------
function cleanText(rawText){
  const lines = rawText.split(/\r?\n/);
  const out = [];
  for (let ln of lines){
    let s = ln.trim();
    if (s.length===0) continue;
    if (/^\d+$/.test(s)) continue; // números de sección
    if (/^A\s+[A-ZÁÉÍÓÚÑÜ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\.\-'\s]+$/.test(s)) continue; // dedicatorias
    if (/^\(.+\)$/.test(s)) continue; // líneas entre paréntesis
    s = s.replace(/\s+/g, " ").trim();
    if (s.length===0) continue;
    out.push(s);
  }
  return out;
}
const corpus = cleanText(raw);
setText(infoEl, "líneas:"+corpus.length);

// ---------- tokenización (sin \p{L}) ----------
const WORD_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
function tokenize(line){
  return line.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+|[0-9]+|[^\sA-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/g) || [];
}
function detokenize(tokens){
  let out = "";
  for (let i=0;i<tokens.length;i++){
    const t = tokens[i];
    if (/^[\.\,\;\:\!\?\)\]\}…]$/.test(t)) { out += t; }
    else if (/^[\(\[\{¿¡]$/.test(t)) { out += (out.endsWith(" ")||out===""? "":" ") + t; }
    else { out += (out===""? "" : (out.endsWith(" ")? "":" ")) + t; }
  }
  return out;
}

function neighborhoodPool(center, radius){
  const pool = [];
  const n = corpus.length;
  for (let k=-radius;k<=radius;k++){
    const idx = ((center + k) % n + n) % n;
    const toks = tokenize(corpus[idx]);
    for (const t of toks){
      if (WORD_RE.test(t)) pool.push(t);
    }
  }
  return pool;
}

function mutateLine(line, pool, rnd, sigma, density){
  const toks = tokenize(line);
  if (!pool.length || sigma<=0) return line;
  const idxs = [];
  for (let i=0;i<toks.length;i++){ if (WORD_RE.test(toks[i])) idxs.push(i); }
  const k = Math.max(1, Math.floor(density * idxs.length));
  const chosen = seededShuffle(idxs, rnd).slice(0, k);
  for (const i of chosen){
    if (rnd() < sigma){
      const src = toks[i];
      const L = src.length;
      let candidate = pool[Math.floor(rnd()*pool.length)];
      for (let t=0;t<3;t++){
        const c = pool[Math.floor(rnd()*pool.length)];
        if (Math.abs(c.length - L) < Math.abs(candidate.length - L)) candidate = c;
      }
      if (/^[A-ZÁÉÍÓÚÜÑ]/.test(src)) candidate = candidate.slice(0,1).toUpperCase() + candidate.slice(1);
      toks[i] = candidate;
    }
  }
  return detokenize(toks);
}

function recursiveBlend(prev, curr, alpha){
  if (!prev || alpha<=0) return curr.slice();
  const out = [];
  const L = Math.max(prev.length, curr.length);
  for (let i=0;i<L;i++){
    const a = prev[i%prev.length] || "";
    const b = curr[i%curr.length] || "";
    out.push(Math.random() < alpha ? a : b);
  }
  return out;
}

// ---------- animación ----------
let playing=false, raf=0, last=0;
let seed = parseInt(seedEl.value,10);
let rnd  = mulberry32(seed);
let center = 0;
let prevFrame = null;

function frame(){
  if (!playing) return;
  raf = requestAnimationFrame(frame);
  const now = performance.now()/1000;
  const dt = last ? Math.min(0.05, now - last) : 0.016;
  last = now;

  const drift = parseFloat(driftEl.value);
  const sigma = parseFloat(sigmaEl.value);
  const win   = parseInt(winEl.value,10);
  const recur = parseFloat(recurEl.value);
  const dens  = parseFloat(densEl.value);

  center = (center + drift * dt + corpus.length) % corpus.length;

  const cIdx = Math.floor(center);
  const half = Math.floor(win/2);
  const inds = [];
  for (let i=-half;i<win-half;i++){
    const idx = ((cIdx + i) % corpus.length + corpus.length) % corpus.length;
    inds.push(idx);
  }

  const pool = neighborhoodPool(cIdx, Math.max(2, Math.ceil(win/2)));
  const current = inds.map(idx => mutateLine(corpus[idx], pool, rnd, sigma, dens));
  const blended = recursiveBlend(prevFrame, current, recur);
  prevFrame = blended.slice();

  const mid = Math.floor(blended.length/2);
  const lines = blended.map((ln,i)=>{
    const dist = Math.abs(i - mid);
    const fade = clamp(1 - dist / (mid+0.5), 0.35, 1);
    const cls = fade < 0.55 ? "pz-ghost" : (fade < 0.8 ? "pz-faint" : "");
    return cls ? `<span class="${cls}">${ln}</span>` : ln;
  }).join("\n");
  outEl.innerHTML = lines;
}

function start(){
  if (playing) return;
  playing = true;
  setText(statusEl,"playing");
  last = performance.now()/1000;
  frame();
}
function stop(){
  if (!playing) return;
  playing = false;
  try { cancelAnimationFrame(raf); } catch(e){}
  setText(statusEl,"stopped");
}
function reseed(){
  seed = parseInt(seedEl.value,10);
  rnd  = mulberry32(seed);
  prevFrame = null;
  setText(statusEl, "reseeded");
}

startBtn.addEventListener("click", start);
stopBtn .addEventListener("click", stop);
reseedBtn.addEventListener("click", reseed);

root.__pz_cleanup = function(){
  try { cancelAnimationFrame(raf); } catch(e){}
  playing=false;
};
```


## Bob Dylan

"Blowin' in the Wind" de Bob Dylan (1962, aparecida el mismo año que las ecuaciones de Lorenz)

- las partículas representan caracteres del texto.
- El movimiento en el eje X afecta el orden del texto (scrambling gradual como "glissando" textual), simulando recursividad mediante iteraciones que transforman el texto de manera gradual y auto-similar (cada paso "recurre" al estado anterior con variaciones). 
- La **fluctuación** introduce desorden aleatorio en posiciones (como mutaciones recursivas en subcadenas), y la corriente tira hacia posiciones originales (convergencia al texto base). Ruido random en posiciones X/Y de caracteres, causando scrambling gradual del texto (orden por X) y variaciones sonoras. Evoca perturbaciones caóticas de Lorenz aplicadas a lírica.
- Visualmente, ves los caracteres moviéndose; textualmente, el texto evolucionado se muestra abajo. La sonificación mantiene glissandi sonoros basados en Y para un efecto atmosférico.
- la "recursividad gradual" simula un glissando textual: transformaciones iterativas (recursivas en el tiempo) que desordenan y reordenan el texto, como un scrambling auto-similar a diferentes escalas. La 'recursividad' es el proceso iterativo donde cada paso transforma el texto basado en el anterior, simulando glissandi textuales.
- **Corriente**: Atracción a posiciones originales, reconformando el texto. Representa atractores que contienen el caos, como en Lorenz.
- Mapeo: X determina orden textual (recursividad como transformación gradual); Y mapea a frecuencia sonora. El texto evolucionado se muestra abajo, simulando lírica 'deslizante' poética.
- Ajusta sliders para ver interacciones: alta fluctuación = texto caótico; alta corriente = reconvergencia rápida.



```dataviewjs
// Simulación de partículas para transformación recursiva de texto lírico
// Inspirado en Ligeti, Lorenz y "Blowin' in the Wind" de Bob Dylan
// Partículas representan caracteres; movimiento en X scrambling texto (recursividad gradual)
// Visualización en canvas, sonificación con WebAudio

// Configuración
const originalText = `How many roads must a man walk down\nBefore you call him a man?\nHow many seas must a white dove sail\nBefore she sleeps in the sand?\nYes, and how many times must the cannonballs fly\nBefore they're forever banned?\nThe answer, my friend, is blowin' in the wind\nThe answer is blowin' in the wind\n\nYes, and how many years can a mountain exist\nBefore it's washed to the sea?\nYes, and how many years can some people exist\nBefore they're allowed to be free?\nYes, and how many times can a man turn his head\nAnd pretend that he just doesn't see?\nThe answer, my friend, is blowin' in the wind\nThe answer is blowin' in the wind\n\nYes, and how many times must a man look up\nBefore he can see the sky?\nYes, and how many ears must one man have\nBefore he can hear people cry?\nYes, and how many deaths will it take 'til he knows\nThat too many people have died?\nThe answer, my friend, is blowin' in the wind\nThe answer is blowin' in the wind`;
const chars = originalText.split('');
const numParticles = chars.length;
const canvasWidth = 800;
const canvasHeight = 400;
const spacing = canvasWidth / (numParticles + 1); // Espaciado inicial
const minFreq = 200;
const maxFreq = 800;
const volume = 0.005; // Bajo para muchos osciladores
let fluctuationStrength = 0.01;
let currentStrength = 0.005;

// Contenedor
const container = dv.el("div", "", { cls: "ligeti-text-simulation" });
container.style.width = `${canvasWidth}px`;
container.style.height = `${canvasHeight + 200}px`;

// Sliders
const fluctuationSlider = document.createElement("input");
fluctuationSlider.type = "range";
fluctuationSlider.min = 0;
fluctuationSlider.max = 0.05;
fluctuationSlider.step = 0.001;
fluctuationSlider.value = fluctuationStrength;
const fluctuationLabel = dv.el("label", `Fluctuación: ${fluctuationStrength}`);
fluctuationSlider.addEventListener("input", (e) => {
  fluctuationStrength = parseFloat(e.target.value);
  fluctuationLabel.textContent = `Fluctuación: ${fluctuationStrength}`;
});
container.appendChild(fluctuationLabel);
container.appendChild(fluctuationSlider);

const currentSlider = document.createElement("input");
currentSlider.type = "range";
currentSlider.min = 0;
currentSlider.max = 0.02;
currentSlider.step = 0.001;
currentSlider.value = currentStrength;
const currentLabel = dv.el("label", `Corriente: ${currentStrength}`);
currentSlider.addEventListener("input", (e) => {
  currentStrength = parseFloat(e.target.value);
  currentLabel.textContent = `Corriente: ${currentStrength}`;
});
container.appendChild(currentLabel);
container.appendChild(currentSlider);

// Canvas
const canvas = document.createElement("canvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
canvas.style.border = "1px solid #ccc";
container.appendChild(canvas);
const ctx = canvas.getContext("2d");

// Div para texto evolucionado
const textDiv = dv.el("pre", originalText, { cls: "evolved-text" });
container.appendChild(textDiv);

// Botón
const button = dv.el("button", "Iniciar Simulación");
container.appendChild(button);

// Audio
let audioCtx;
let oscillators = [];
let gainNodes = [];

// Partículas: {x, y, vx, vy, char, origX, origY}
let particles = [];

// Inicializar
function init() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  particles = [];
  oscillators = [];
  gainNodes = [];

  for (let i = 0; i < numParticles; i++) {
    const origX = (i + 1) * spacing;
    const origY = canvasHeight / 2;
    const x = origX;
    const y = origY;
    const vx = 0;
    const vy = 0;
    particles.push({ x, y, vx, vy, char: chars[i], origX, origY });

    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = mapToFreq(y);

    const gain = audioCtx.createGain();
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    oscillators.push(osc);
    gainNodes.push(gain);
  }
}

// Map Y a freq
function mapToFreq(y) {
  const norm = 1 - (y / canvasHeight);
  return minFreq + norm * (maxFreq - minFreq);
}

// Actualizar
let running = false;
let lastTime = 0;

function update(time) {
  if (!running) return;

  const dt = time - lastTime || 16;
  lastTime = time;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  particles.forEach((p, i) => {
    // Fluctuación
    p.vx += (Math.random() - 0.5) * fluctuationStrength;
    p.vy += (Math.random() - 0.5) * fluctuationStrength;

    // Corriente a original
    p.vx += (p.origX - p.x) * currentStrength;
    p.vy += (p.origY - p.y) * currentStrength;

    // Amortiguación
    p.vx *= 0.99;
    p.vy *= 0.99;

    // Actualizar posición
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Bordes (bounce para no perder)
    if (p.x < 0) { p.x = 0; p.vx *= -1; }
    if (p.x > canvasWidth) { p.x = canvasWidth; p.vx *= -1; }
    if (p.y < 0) { p.y = 0; p.vy *= -1; }
    if (p.y > canvasHeight) { p.y = canvasHeight; p.vy *= -1; }

    // Actualizar freq
    oscillators[i].frequency.setValueAtTime(mapToFreq(p.y), audioCtx.currentTime);

    // Dibujar char
    ctx.font = "12px monospace";
    ctx.fillStyle = "blue";
    ctx.fillText(p.char, p.x, p.y);
  });

  // Computar texto evolucionado
  const sorted = [...particles].sort((a, b) => a.x - b.x);
  const evolvedText = sorted.map(p => p.char).join('');
  textDiv.textContent = evolvedText;

  requestAnimationFrame(update);
}

// Toggle
button.addEventListener("click", () => {
  if (!running) {
    if (!audioCtx) init();
    gainNodes.forEach(g => g.gain.value = volume);
    running = true;
    button.textContent = "Detener Simulación";
    update(performance.now());
  } else {
    gainNodes.forEach(g => g.gain.value = 0);
    running = false;
    button.textContent = "Iniciar Simulación";
  }
});
```

