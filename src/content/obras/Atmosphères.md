---
type: obra
img: https://i.imgur.com/9DqOJ7C.png
year: 1961
tags: músicaescrita
person: "[[György Ligeti]]"
premiereDate: 1961-10-22
url:
connect: "[[Arte de datos]]"
premierePlace: Donaueschingen Musiktagen
---

Ligeti en Atmosphères construye una textura donde la microestructura (fluctuación) y la macroforma (corriente) se superponen de manera casi física, muy cercana a la idea de turbulencia o flujo continuo. Podemos pensarlo en términos análogos a la hidrodinámica y al caos determinista (Lorenz, Prigogine):

## Fluctuación
- Son los cambios microscópicos de altura, timbre o densidad en cada instrumento o grupo.
- Equivalen a las variaciones locales en un fluido, como remolinos que aparecen y desaparecen.
- En Atmosphères estas fluctuaciones se dan en el nivel de los clústeres cromáticos, que nunca están estáticos, sino que vibran internamente.
## Corriente
- Es la dirección global del proceso sonoro, el vector de movimiento de toda la masa orquestal.
- Equivale al flujo principal de un río o corriente atmosférica: aunque haya turbulencias locales, la dirección general se mantiene.
- En Atmosphères se perciben como transformaciones lentas de densidad y timbre, una suerte de morfología a gran escala.

## Estrategia compositiva
- Ligeti no organiza mediante melodía-armonía-forma tradicional, sino mediante estados dinámicos.
- Cada sección es un “régimen” de flujo: densidad estática, expansión, disolución, compresión, etc.
- La lógica se parece a un modelo físico: reglas locales (entradas diferidas de instrumentos, glissandi superpuestos) producen un comportamiento global (corriente de la textura).

Podríamos incluso modelarlo como un sistema de ecuaciones diferenciales:
- Nivel micro (fluctuación): $dx/dt = f(x,y)$ describe la interacción local de voces.
- Nivel macro (corriente): $dy/dt = g(y)$ describe la evolución de la densidad global.

Esto conecta con lo que Einstein expresa sobre la geometría práctica  en [[Geometría y Experiencia]]: cuando la estructura formal (axiomas) se acopla a un objeto real (cuerpos rígidos), aparece un comportamiento físico. En Ligeti, cuando la escritura formal se acopla al medio instrumental, surge un campo sonoro que se comporta como materia en flujo.


## Modelización

### 1. movimiento inercial de una partícula

una partícula que se mueve en un espacio 2D (como un canvas) basada solo en su velocidad inicial. No hay fluctuaciones ni corrientes; solo inercia.

La posición de la partícula en el tiempo $t$ se actualiza así:

$$\mathbf{p}_{t} = \mathbf{p}_{t-1} + \mathbf{v} \cdot \Delta t$$


Donde:

$\mathbf{p}_{t}$: Posición actual de la partícula en 2D (vector: $(x_t, y_t)$). Representa la ubicación visual y sonora (e.g., $y_t$ mapea a frecuencia).
$\mathbf{p}_{t-1}$: Posición en el paso anterior.
$\mathbf{v}$: Velocidad constante (vector: $(v_x, v_y)$). Es la "inercia" o dirección inicial.
$\Delta t$: Paso de tiempo (e.g., 16 ms para ~60 FPS). Controla la suavidad del movimiento.

Sin fuerzas externas, la partícula se mueve en línea recta indefinidamente. Esto es como un glissando lineal simple en música, sin variaciones.

### 2. añadimos amortiguación evitando la explosión del movimiento *o saturación del sistema*

Para prevenir que el movimiento se acelere sin control (como en simulaciones reales), agregamos una amortiguación simple. Esto hace que la velocidad disminuya gradualmente.

#### Ecuaciones Actualizadas:
Primero, actualizamos la velocidad con amortiguación:

$$
\mathbf{v}_{t} = \mathbf{v}_{t-1} \cdot d
$$

Luego, la posición:

$$
\mathbf{p}_{t} = \mathbf{p}_{t-1} + \mathbf{v}_{t} \cdot \Delta t
$$

Nuevo término:
- $d$: Factor de amortiguación (e.g., 0.99). Un valor menor a 1 reduce la velocidad en cada paso, simulando fricción o disipación de energía. Explicación: Evita que las partículas "exploten" fuera de los límites; en términos sonoros, hace que los glissandi se calmen con el tiempo.

**Explicación Incremental**: Ahora el movimiento no es eterno; se desacelera, como una nota musical que se desvanece.

### 3. Introduciendo Fluctuación: Caos Aleatorio

La fluctuación representa las perturbaciones impredecibles de Lorenz (e.g., efecto mariposa). La modelamos como ruido aleatorio añadido a la velocidad.

#### Ecuaciones Actualizadas:
Actualizamos la velocidad con fluctuación:

$$
\mathbf{v}_{t} = \mathbf{v}_{t-1} \cdot d + \mathbf{n} \cdot f
$$

Luego, la posición como antes.

Nuevos términos:
- $\mathbf{n}$: Vector de ruido aleatorio (e.g., $(r_x - 0.5, r_y - 0.5)$, donde $r$ es un número random entre 0 y 1). Representa variaciones caóticas.
- $f$: Fuerza de fluctuación (e.g., 0.01, ajustable via slider). Controla cuán fuerte es el caos; mayor valor = más impredecible.

**Explicación**: La fluctuación añade "ruido" al sistema, haciendo el movimiento errático. Visualmente, las partículas zigzaguean; auditivamente, crea glissandi irregulares, simulando texturas micropolicromáticas en *Atmosphères*. En Lorenz, esto es como pequeñas perturbaciones que amplifican el caos.

### 4. Introduciendo Corriente: Flujo Dirigido hacia un Atractor

La corriente representa el "flujo" o atracción subyacente en el modelo de Lorenz, donde el sistema tiende hacia puntos estables a pesar del caos.

#### Ecuaciones Actualizadas:
Actualizamos la velocidad con corriente:

$$
\mathbf{v}_{t} = \mathbf{v}_{t-1} \cdot d + \mathbf{n} \cdot f + (\mathbf{c} - \mathbf{p}_{t-1}) \cdot s
$$

Luego, la posición como antes.

Nuevos términos:
- $\mathbf{c}$: Posición del centro de atracción (e.g., $(width/2, height/2)$). Es el "atractor" simple.
- $s$: Fuerza de corriente (e.g., 0.005, ajustable via slider). Controla cuán fuerte es la pull hacia el centro; mayor valor = más convergencia.

**Explicación**: La corriente añade una dirección general, tirando las partículas hacia el centro. En interacción con la fluctuación: el ruido las hace desviarse, pero la corriente las corrige, creando un balance caótico pero cohesionado. En Lorenz, esto es como órbitas alrededor de atractores; musicalmente, mantiene la "atmósfera" unificada pese a variaciones.

### 5. Interacción entre Fluctuación y Corriente

La interacción surge de su combinación en la velocidad:
- **Sin interacción**: Solo inercia → movimiento predecible.
- **Solo fluctuación**: Caos puro → partículas erráticas, como ruido blanco sonoro.
- **Solo corriente**: Convergencia estable → partículas se agrupan en el centro, como un acorde estático.
- **Ambos**: Dinámica caótica sensible → pequeñas fluctuaciones se amplifican, pero la corriente las contiene. Ajustando $f$ y $s$, puedes ver bifurcaciones (e.g., alto $f$ y bajo $s$ = dispersión; viceversa = clustering). Esto emula la sensibilidad inicial de Lorenz.

En términos de Lorenz (simplificado): Nuestro modelo es como una versión discreta y 2D de las ecuaciones de Lorenz, donde fluctuación ≈ términos no lineales caóticos, y corriente ≈ términos atractores.

## Pseudocódigo: Implementación del Modelo

Aquí un pseudocódigo simple que resume el bucle de actualización para una partícula (extensible a muchas):

para cada paso de tiempo:

```js
    # Fluctuación: añadir ruido
    vx += (random() - 0.5) * f
    vy += (random() - 0.5) * f
    
    # Corriente: pull hacia centro
    vx += (centro_x - x) * s
    vy += (centro_y - y) * s
    
    # Amortiguación
    vx *= d
    vy *= d
    
    # Actualizar posición
    x += vx * dt
    y += vy * dt
    
    # Mapeo sonoro (ejemplo)
    frecuencia = min_freq + (1 - y / height) * (max_freq - min_freq)
    actualizar_oscilador(frecuencia)
    
```



**Explicación**: Este loop integra todos los términos. Ejecutado por partícula, simula el enjambre orquestal. Ajusta $f$ y $s$ para explorar interacciones.


## Simulación 1: Traducción Didáctica del Fenómeno de Lorenz al Mapeo Audio-Visual

Edward Lorenz, un matemático y meteorólogo, desarrolló teorías sobre el caos y los atractores extraños en sistemas dinámicos, como el clima. En su modelo del 'atractor de Lorenz', pequeñas fluctuaciones (como el aleteo de una mariposa) pueden llevar a grandes cambios impredecibles, pero el sistema orbita alrededor de puntos de atracción estables, creando un flujo o 'corriente' dirigida.

En esta simulación inspirada en György Ligeti y su pieza 'Atmosphères' (1961), traducimos estos conceptos así:;

1. **Fluctuación (caos aleatorio)**: Representada por ruido random en el movimiento de las partículas. Cada partícula (simulando una voz orquestal) recibe variaciones impredecibles en su velocidad, como las perturbaciones caóticas en el modelo de Lorenz. Visualmente, las partículas se mueven erráticamente; auditivamente, esto causa glissandi irregulares en las frecuencias, creando texturas micropolicromáticas.
2. **Corriente (flujo dirigido)**:  Simulada por una atracción suave hacia el centro del canvas, como un atractor simple. Esto representa el 'flujo' o tendencia subyacente en el sistema de Lorenz, donde a pesar del caos, hay una dirección general. Visualmente, las partículas tienden a converger; auditivamente, las frecuencias se estabilizan alrededor de valores medios, pero con variaciones."
3. **Mapeo audio-visual**: La posición vertical (y) de cada partícula mapea a la frecuencia sonora (alta arriba, baja abajo), simulando glissandi orquestales. El movimiento horizontal añade dinámica visual. El conjunto crea una 'atmósfera' sonora caótica pero cohesionada, ecoando la coincidencia que Ligeti sintió con las ideas de Lorenz post-composición.",
4. Usa los sliders para variar la fuerza de fluctuación (más caos) y corriente (más atracción), observando cómo afecta el comportamiento visual y sonoro.


```dataviewjs
// Simple particle simulation for glissandi inspired by Ligeti and Lorenz
// Visualization on canvas, sonification with WebAudio API
// Particles simulate fluctuation (random noise) and current (directed flow)
// Now with sliders to control fluctuationStrength and currentStrength

// Configuration
const numParticles = 50; // Number of particles (adjust as needed)
const canvasWidth = 800;
const canvasHeight = 400;
const minFreq = 200; // Min frequency (Hz) for low pitches
const maxFreq = 800; // Max frequency for high pitches
const volume = 0.01; // Low volume per oscillator to avoid distortion
let fluctuationStrength = 0.01; // Random fluctuation amount (adjustable)
let currentStrength = 0.005; // Directed flow towards center (adjustable)

// Create container div
const container = dv.el("div", "", { cls: "ligeti-simulation" });
container.style.width = `${canvasWidth}px`;
container.style.height = `${canvasHeight + 100}px`; // Extra space for sliders

// Create sliders
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

// Create canvas for visualization
const canvas = document.createElement("canvas");
canvas.width = canvasWidth;
canvas.height = canvasHeight;
canvas.style.border = "1px solid #ccc";
container.appendChild(canvas);
const ctx = canvas.getContext("2d");

// Create start/stop button
const button = dv.el("button", "Iniciar Simulación");
container.appendChild(button);

// WebAudio setup
let audioCtx;
let oscillators = [];
let gainNodes = [];

// Particles array: each {x, y, vx, vy}
let particles = [];

// Initialize particles and audio
function init() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  particles = [];
  oscillators = [];
  gainNodes = [];

  for (let i = 0; i < numParticles; i++) {
    // Random initial position
    const x = Math.random() * canvasWidth;
    const y = Math.random() * canvasHeight;
    const vx = (Math.random() - 0.5) * 0.02;
    const vy = (Math.random() - 0.5) * 0.02;
    particles.push({ x, y, vx, vy });

    // Create oscillator for each particle
    const osc = audioCtx.createOscillator();
    osc.type = "sine"; // Sine for smooth glissando-like sound
    osc.frequency.value = mapToFreq(y);

    const gain = audioCtx.createGain();
    gain.gain.value = 0; // Start muted

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();

    oscillators.push(osc);
    gainNodes.push(gain);
  }
}

// Map y-position to frequency (inverted: top=high pitch, bottom=low)
function mapToFreq(y) {
  const norm = 1 - (y / canvasHeight); // 0 at bottom, 1 at top
  return minFreq + norm * (maxFreq - minFreq);
}

// Update simulation
let running = false;
let lastTime = 0;

function update(time) {
  if (!running) return;

  const dt = time - lastTime || 16; // Approx 60fps
  lastTime = time;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  particles.forEach((p, i) => {
    // Fluctuation: add random noise to velocity
    p.vx += (Math.random() - 0.5) * fluctuationStrength;
    p.vy += (Math.random() - 0.5) * fluctuationStrength;

    // Current: gentle pull towards center (simulating a simple attractor/current)
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    p.vx += (centerX - p.x) * currentStrength;
    p.vy += (centerY - p.y) * currentStrength;

    // Dampen velocity to prevent explosion
    p.vx *= 0.99;
    p.vy *= 0.99;

    // Update position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Wrap around edges for continuous flow
    if (p.x < 0) p.x = canvasWidth;
    if (p.x > canvasWidth) p.x = 0;
    if (p.y < 0) p.y = canvasHeight;
    if (p.y > canvasHeight) p.y = 0;

    // Update frequency (glissando effect)
    oscillators[i].frequency.setValueAtTime(mapToFreq(p.y), audioCtx.currentTime);

    // Draw particle as a small circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();
  });

  requestAnimationFrame(update);
}

// Toggle simulation
button.addEventListener("click", () => {
  if (!running) {
    if (!audioCtx) init();
    gainNodes.forEach(g => g.gain.value = volume); // Unmute
    running = true;
    button.textContent = "Detener Simulación";
    update(performance.now());
  } else {
    gainNodes.forEach(g => g.gain.value = 0); // Mute
    running = false;
    button.textContent = "Iniciar Simulación";
  }
});
```





## Simulación 2 Fluctuación micro + Corriente macro

```dataviewjs
// Ligeti • Fluctuación (micro) + Corriente (macro) • Glissandi con WebAudio + Canvas
// Pegar en un bloque ```dataviewjs``` en Obsidian. Requiere clic en Start para habilitar audio.

// Limpieza si ya había una instancia previa en este bloque
const root = dv.container;
if (root.__ligetiCleanup) { try { root.__ligetiCleanup(); } catch(e) {} }
root.innerHTML = "";

// UI
const html = `
<style>
.ligeti-wrap{font:13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: var(--text-normal);}
.ligeti-grid{display:grid;grid-template-columns:1fr;gap:10px}
.ligeti-ctrls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:center}
.ligeti-ctrls label{display:flex;flex-direction:column;gap:4px}
.ligeti-ctrls input[type=range]{width:100%}
.ligeti-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ligeti-row .btn{padding:6px 10px;border:1px solid var(--background-modifier-border);border-radius:8px;background:transparent;cursor:pointer}
.ligeti-row .btn:hover{background:var(--background-modifier-hover)}
#ligetiCanvas{width:100%;height:320px;display:block;background:transparent;border:1px solid var(--background-modifier-border);border-radius:8px}
small.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;opacity:.8}
</style>

<div class="ligeti-wrap">
  <div class="ligeti-grid">
    <div class="ligeti-ctrls">
      <label>n_partículas (≈instrumentos)
        <input id="nVoices" type="range" min="4" max="120" step="1" value="60">
        <small class="mono"><span id="nVoicesOut">60</span></small>
      </label>
      <label>corriente_global [semitonos/seg]
        <input id="drift" type="range" min="-2" max="2" step="0.001" value="0.05">
        <small class="mono"><span id="driftOut">0.05</span> st/s</small>
      </label>
      <label>fluctuación_local σ (0–1)
        <input id="sigma" type="range" min="0" max="1" step="0.001" value="0.30">
        <small class="mono"><span id="sigmaOut">0.30</span></small>
      </label>
      <label>ancho_cluster [semitonos]
        <input id="spread" type="range" min="0" max="60" step="0.1" value="24">
        <small class="mono"><span id="spreadOut">24.0</span> st</small>
      </label>
      <label>centro_cluster [MIDI]
        <input id="center" type="range" min="36" max="84" step="0.1" value="60">
        <small class="mono">MIDI <span id="centerOut">60.0</span></small>
      </label>
      <label>ganancia_master
        <input id="gain" type="range" min="0" max="1" step="0.001" value="0.15">
        <small class="mono"><span id="gainOut">0.15</span></small>
      </label>
      <label>ataque [s]
        <input id="attack" type="range" min="0.005" max="5" step="0.001" value="2.0">
        <small class="mono"><span id="attackOut">2.000</span> s</small>
      </label>
      <label>release [s]
        <input id="release" type="range" min="0.01" max="8" step="0.001" value="3.0">
        <small class="mono"><span id="releaseOut">3.000</span> s</small>
      </label>
    </div>

    <div class="ligeti-row">
      <button id="startBtn" class="btn">Start</button>
      <button id="stopBtn" class="btn">Stop</button>
      <button id="reseedBtn" class="btn">Re-seed</button>
      <span class="mono" id="status">idle</span>
    </div>

    <canvas id="ligetiCanvas" width="1280" height="320"></canvas>
    <small class="mono">y: tiempo → (scroll), x: frecuencia (MIDI), puntos/traços = partículas (glissandi)</small>
  </div>
</div>
`;
root.insertAdjacentHTML("beforeend", html);

// Helpers
const $ = (id)=>root.querySelector(id);
const fmt = (x,n=3)=>Number(x).toFixed(n);
const midiToFreq = (m)=>440*Math.pow(2,(m-69)/12);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function randn(){ // Box-Muller
  let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

// Elements
const el = {
  nVoices: $("#nVoices"), nVoicesOut: $("#nVoicesOut"),
  drift: $("#drift"), driftOut: $("#driftOut"),
  sigma: $("#sigma"), sigmaOut: $("#sigmaOut"),
  spread: $("#spread"), spreadOut: $("#spreadOut"),
  center: $("#center"), centerOut: $("#centerOut"),
  gain: $("#gain"), gainOut: $("#gainOut"),
  attack: $("#attack"), attackOut: $("#attackOut"),
  release: $("#release"), releaseOut: $("#releaseOut"),
  start: $("#startBtn"), stop: $("#stopBtn"), reseed: $("#reseedBtn"),
  status: $("#status"),
  canvas: $("#ligetiCanvas")
};
function syncOutputs(){
  el.nVoicesOut.textContent = el.nVoices.value;
  el.driftOut.textContent   = fmt(el.drift.value,3);
  el.sigmaOut.textContent   = fmt(el.sigma.value,3);
  el.spreadOut.textContent  = fmt(el.spread.value,1);
  el.centerOut.textContent  = fmt(el.center.value,1);
  el.gainOut.textContent    = fmt(el.gain.value,3);
  el.attackOut.textContent  = fmt(el.attack.value,3);
  el.releaseOut.textContent = fmt(el.release.value,3);
}
["input","change"].forEach(evt=>{
  [el.nVoices,el.drift,el.sigma,el.spread,el.center,el.gain,el.attack,el.release].forEach(x=>x.addEventListener(evt,syncOutputs));
});
syncOutputs();

// Canvas
const ctx2d = el.canvas.getContext("2d", { alpha:true });
const W = ()=>el.canvas.width, H = ()=>el.canvas.height;
function clearViz(){
  ctx2d.clearRect(0,0,W(),H());
  // leve transparencia para rastros
  ctx2d.fillStyle = "rgba(0,0,0,0)"; // transparente
}
clearViz();

// Audio state
let AC = null, master=null, comp=null, playing=false, rafId=0;
let particles = []; // {baseOffset, dev, vel, osc, g, pan, color}
let centerMidi = parseFloat(el.center.value);
let lastT = 0;

// Color util según tema
function themeColor(){
  const c = getComputedStyle(root).getPropertyValue("--text-accent").trim() || "#66aaff";
  return c || "#66aaff";
}
function randomColor(base){
  // ligera variación del color base
  const h = Math.floor(Math.random()*360);
  return `hsla(${h},70%,55%,0.85)`;
}

// Build particles (only data offsets; audio nodes created on start)
function reseedParticles(){
  const N = parseInt(el.nVoices.value,10);
  const spread = parseFloat(el.spread.value);
  centerMidi = parseFloat(el.center.value);
  const offsets = Array.from({length:N}, ()=> (Math.random()-0.5)*spread);
  particles = offsets.map(off=>({
    baseOffset: off,
    dev: 0,
    vel: 0,
    osc: null,
    g: null,
    pan: null,
    color: randomColor(themeColor()),
    lastMidi: centerMidi + off
  }));
}
reseedParticles();

// Build audio graph
function makeImpulseResponse(context, duration=3.0, decay=2.0){
  const rate = context.sampleRate;
  const length = rate * duration;
  const impulse = context.createBuffer(2, length, rate);
  for (let c=0;c<2;c++){
    const ch = impulse.getChannelData(c);
    for (let i=0;i<length;i++){
      ch[i] = (Math.random()*2-1) * Math.pow(1 - i/length, decay);
    }
  }
  return impulse;
}

function makeAudio(){
  if (AC && AC.state !== "closed") return;
  AC = new (window.AudioContext || window.webkitAudioContext)();

  comp = AC.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-18, AC.currentTime);
  comp.knee.setValueAtTime(18, AC.currentTime);
  comp.ratio.setValueAtTime(8, AC.currentTime);
  comp.attack.setValueAtTime(0.003, AC.currentTime);
  comp.release.setValueAtTime(0.100, AC.currentTime);

  master = AC.createGain();
  master.gain.value = 0.0001; 

  // --- Reverb 50% wet/dry ---
  const convolver = AC.createConvolver();
  convolver.buffer = makeImpulseResponse(AC, 4.0, 3.0);
  const wetGain = AC.createGain(); wetGain.gain.value = 0.5;
  const dryGain = AC.createGain(); dryGain.gain.value = 0.5;

  master.connect(dryGain).connect(comp);
  master.connect(convolver).connect(wetGain).connect(comp);
  comp.connect(AC.destination);

  const N = particles.length;
  const targetMaster = parseFloat(el.gain.value);
  const per = targetMaster / N;

  particles.forEach(p=>{
    const osc = new OscillatorNode(AC, { type:"sine", frequency:midiToFreq(centerMidi+p.baseOffset)});
    const g = new GainNode(AC, { gain: per*(0.8+0.4*Math.random()) });
    let pan=null;
    try { pan=new StereoPannerNode(AC,{pan:(Math.random()*2-1)*0.8}); }
    catch { pan={connect:(dest)=>g.connect(dest)}; }

    osc.connect(g);
    if (pan.connect) g.connect(pan).connect(master);
    else g.connect(master);

    osc.start();
    p.osc=osc; p.g=g; p.pan=pan;
  });

  const atk=parseFloat(el.attack.value);
  master.gain.cancelScheduledValues(AC.currentTime);
  master.gain.setValueAtTime(master.gain.value,AC.currentTime);
  master.gain.linearRampToValueAtTime(parseFloat(el.gain.value),AC.currentTime+atk);
}
// Stop audio and cleanup
async function killAudio(){
  if (!AC) return;
  const rel = parseFloat(el.release.value);
  try{
    master && master.gain.linearRampToValueAtTime(0.0001, AC.currentTime + rel);
  }catch{}
  await new Promise(r=>setTimeout(r, Math.max(50, rel*1000)));
  try{
    particles.forEach(p=>{ try{ p.osc && p.osc.stop(); }catch{} try{ p.g && p.g.disconnect(); }catch{} });
    comp && comp.disconnect();
    master && master.disconnect();
  }catch{}
  try{ await AC.close(); }catch{}
  AC = null; master = null; comp = null;
}

// Mapping x position from MIDI
function xFromMidi(m){
  const minM = parseFloat(el.center.value) - parseFloat(el.spread.value)*0.8 - 24;
  const maxM = parseFloat(el.center.value) + parseFloat(el.spread.value)*0.8 + 24;
  const x = (m - minM) / (maxM - minM);
  return clamp(x,0,1)*W();
}

// Draw particle trail
function drawStep(dt){
  // Scroll up by 1 px to dejar rastro vertical de tiempo
  const h = H(), w=W();
  const img = ctx2d.getImageData(0,0,w,h);
  ctx2d.putImageData(img, 0, -1);
  // línea base transparente
  ctx2d.clearRect(0, h-2, w, 2);

  // Dibujar nueva fila (abajo)
  particles.forEach(p=>{
    const x = xFromMidi(p.lastMidi);
    ctx2d.fillStyle = p.color;
    ctx2d.fillRect(Math.floor(x), h-2, 2, 2);
  });
}

// Advance dynamics
function step(){
  if (!playing) return;
  rafId = requestAnimationFrame(step);

  const now = performance.now()/1000;
  const dt = Math.min(0.05, lastT ? now - lastT : 0.016);
  lastT = now;

  const drift = parseFloat(el.drift.value);         // st/s
  const sigma = parseFloat(el.sigma.value);         // 0..1 (micro)
  const spread = parseFloat(el.spread.value);
  const atk = parseFloat(el.attack.value);
  const rel = parseFloat(el.release.value);

  // Centro que se desplaza por corriente_global
  centerMidi += drift * dt;

  // Ornstein–Uhlenbeck para microfluctuación alrededor de 0
  const beta = 1.2; // tasa de reversión (más alto = más pegado al centro local)
  const sdev = sigma * 0.8; // escala de ruido

  particles.forEach(p=>{
    // target de partícula = centro que deriva + offset estático del cluster
    const target = centerMidi + p.baseOffset;

    // OU para desvío micro local
    p.vel += (-beta * p.dev) * dt + sdev * Math.sqrt(dt) * randn();
    p.dev += p.vel * dt;

    // Limitar dev suave para no romper el cluster
    const maxDev = Math.max(0.5, 0.35*spread);
    p.dev = clamp(p.dev, -maxDev, maxDev);

    const midi = target + p.dev;
    p.lastMidi = midi;

    if (AC && p.osc){
      const f = midiToFreq(midi);
      // Suavizado musical
      p.osc.frequency.setTargetAtTime(f, AC.currentTime, 0.03);
    }
  });

  // Pequeña respiración de ganancia (opcional)
  if (AC && master){
    const targetMaster = parseFloat(el.gain.value);
    master.gain.setTargetAtTime(targetMaster, AC.currentTime, 0.10);
  }

  drawStep(dt);
}

// Buttons
el.start.addEventListener("click", async ()=>{
  if (playing) return;
  await makeAudio();
  playing = true;
  el.status.textContent = "playing";
  lastT = performance.now()/1000;
  step();
});

el.stop.addEventListener("click", async ()=>{
  if (!playing && !AC) return;
  playing = false;
  cancelAnimationFrame(rafId);
  el.status.textContent = "stopping…";
  await killAudio();
  el.status.textContent = "stopped";
});

el.reseed.addEventListener("click", async ()=>{
  const was = playing;
  if (was){ playing = false; cancelAnimationFrame(rafId); await killAudio(); }
  reseedParticles();
  clearViz();
  if (was){ await makeAudio(); playing = true; el.status.textContent = "playing"; lastT=performance.now()/1000; step(); }
});

// Cleanup si se recarga el bloque
root.__ligetiCleanup = async ()=>{
  try{ playing=false; cancelAnimationFrame(rafId); }catch{}
  await killAudio();
};
```





## versiones

### Berliner Philharmoniker. cond. Jonathan Nott
<iframe title="Atmosphères - György Ligeti" src="https://www.youtube.com/embed/qPr4vRRQKvQ?feature=oembed" height="113" width="200" allowfullscreen="" allow="fullscreen" style="aspect-ratio: 1.76991 / 1; width: 100%; height: 100%;"></iframe>


[[lírica lorenz]]



# atractor de lorenz

El sistema de Lorenz es un modelo mínimo de tres EDOs no lineales para convección térmica atmosférica; reduce un flujo continuo a tres variables acopladas y exhibe sensibilidad a condiciones iniciales (atractor de Lorenz).

$$\begin{cases}
\dot x=\sigma(y-x)\\
\dot y=\rho x-y-xz\\
\dot z=xy-\beta z
\end{cases}$$

- Variables de estado
  - $x$: intensidad de la circulación convectiva
  - $y$: gradiente horizontal de temperatura
  - $z$: desviación vertical de temperatura respecto del equilibrio

- Parámetros positivos
  - $\sigma$: número de Prandtl (relación difusión de momento/calor)
  - $\rho$: razón de Rayleigh reducida (fuerza de calentamiento)
  - $\beta$: factor geométrico/disipativo del modo vertical

- Ecuación 1: $\dot x=\sigma(y-x)$
  1. $y-x$: si $y>x$ el término es positivo y $x$ aumenta; si $y<x$ es negativo y $x$ decae
  2. $\sigma$: escala la rapidez con que $x$ persigue a $y$; mayor $\sigma$→respuesta más veloz
  3. Interpretación: relajación lineal de $x$ hacia $y$ (acoplamiento difusivo entre velocidad y gradiente térmico)

- Ecuación 2: $\dot y=\rho x-y-xz$
  1. $\rho x$: forzamiento proporcional a $x$; transporte de calor que alimenta $y$
  2. $-y$: disipación lineal que tiende a llevar $y$ a cero
  3. $-xz$: acoplamiento no lineal que extrae $y$ cuando coexisten circulación $x$ y estratificación $z$ (término advectivo)

- Ecuación 3: $\dot z=xy-\beta z$
  1. $xy$: producción cuadrática; la interacción entre circulación y gradiente horizontal genera estratificación vertical
  2. $-\beta z$: disipación lineal que relaja $z$ hacia el equilibrio
  3. Interpretación: balance entre generación no lineal y amortiguamiento del modo vertical

- Puntos fijos (estructura mínima)
  - $O=(0,0,0)$
  - $C_\pm=(\pm\sqrt{\beta(\rho-1)},\pm\sqrt{\beta(\rho-1)},\rho-1)$ para $\rho>1$

- Régimen caótico clásico
  - Con $\sigma=10$, $\rho=28$, $\beta=8/3$ el sistema es no periódico y converge al atractor extraño de Lorenz, donde las trayectorias orbitan dos lóbulos alternando de forma impredecible pero confinada

- Lectura modelizadora
  - Cada ecuación combina un término lineal disipativo y uno de acoplamiento que transfiere “energía” entre variables
  - La no linealidad $xy$ y $xz$ es la fuente del comportamiento complejo; sin ellas el sistema sería lineal y no caótico


```dataviewjs
//
// Lorenz + Three.js + Orbit minimal inline (sin CDN extra) + WebAudio
//
const root = dv.container;
if (root.__lorenzCleanup) { try{ await root.__lorenzCleanup(); }catch{} }
root.innerHTML = "";

// ---------- UI ----------
root.insertAdjacentHTML("beforeend", `
<style>
.lz3-wrap{font:13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:var(--text-normal)}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
label{display:flex;flex-direction:column;gap:4px}
input[type=range]{width:200px}
.btn{padding:6px 10px;border:1px solid var(--background-modifier-border);border-radius:8px;background:transparent;cursor:pointer}
.btn:hover{background:var(--background-modifier-hover)}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
#view{width:100%;height:420px;border:1px solid var(--background-modifier-border);border-radius:8px;background:transparent;touch-action:none}
</style>
<div class="lz3-wrap">
  <div class="row">
    <label>σ (sigma)
      <input id="sigma" type="range" min="1" max="20" step="0.1" value="10">
      <small class="mono" id="sigmaOut">10.0</small>
    </label>
    <label>ρ (rho)
      <input id="rho" type="range" min="0" max="50" step="0.5" value="28">
      <small class="mono" id="rhoOut">28.0</small>
    </label>
    <label>β (beta)
      <input id="beta" type="range" min="0.5" max="5" step="0.01" value="2.6667">
      <small class="mono" id="betaOut">2.667</small>
    </label>
    <label>dt
      <input id="dt" type="range" min="0.001" max="0.02" step="0.001" value="0.01">
      <small class="mono" id="dtOut">0.010</small>
    </label>
    <label>partículas
      <input id="num" type="range" min="1" max="40" step="1" value="20">
      <small class="mono" id="numOut">20</small>
    </label>
    <label>trail puntos
      <input id="maxPts" type="range" min="50" max="1200" step="10" value="400">
      <small class="mono" id="maxPtsOut">400</small>
    </label>
    <label>gain
      <input id="gain" type="range" min="0" max="1" step="0.001" value="0.12">
      <small class="mono" id="gainOut">0.120</small>
    </label>
  </div>
  <div class="row">
    <button id="start" class="btn">Start</button>
    <button id="stop" class="btn">Stop</button>
    <button id="reseed" class="btn">Re-seed</button>
    <span class="mono" id="status">idle</span>
  </div>
  <div id="view" aria-label="Lorenz Attractor 3D"></div>
  <div class="mono" style="opacity:.75;margin-top:6px">
    x·=σ(y−x), y·=ρx−y−xz, z·=xy−βz • Ejes XYZ (R,G,B) • Rotación X=0.1 rad/s • Orbit: drag, wheel, Shift+drag = pan
  </div>
</div>
`);

const $ = id => root.querySelector(id.startsWith("#")?id:("#"+id));
const fmt=(x,n=3)=>Number(x).toFixed(n);
const els = {
  sigma:$("#sigma"), rho:$("#rho"), beta:$("#beta"), dt:$("#dt"), num:$("#num"), maxPts:$("#maxPts"), gain:$("#gain"),
  sigmaOut:$("#sigmaOut"), rhoOut:$("#rhoOut"), betaOut:$("#betaOut"), dtOut:$("#dtOut"), numOut:$("#numOut"), maxPtsOut:$("#maxPtsOut"), gainOut:$("#gainOut"),
  start:$("#start"), stop:$("#stop"), reseed:$("#reseed"), status:$("#status"), view:$("#view")
};
function sync(){
  els.sigmaOut.textContent=fmt(+els.sigma.value,1);
  els.rhoOut.textContent=fmt(+els.rho.value,1);
  els.betaOut.textContent=fmt(+els.beta.value,3);
  els.dtOut.textContent=fmt(+els.dt.value,3);
  els.numOut.textContent=els.num.value;
  els.maxPtsOut.textContent=els.maxPts.value;
  els.gainOut.textContent=fmt(+els.gain.value,3);
}
["input","change"].forEach(ev=>[els.sigma,els.rho,els.beta,els.dt,els.num,els.maxPts,els.gain].forEach(e=>e.addEventListener(ev,sync)));
sync();

// ---------- three.js loader ----------
// Reemplaza tu ensureThree por este:
async function ensureThree(){
  // si ya está cargado, no recargar
  if (window.THREE && window.__THREE_SINGLETON__) return true;

  // si ya hay un <script id="three-r149"> no volver a insertarlo
  let tag = document.querySelector('#three-r149');
  if (!tag) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.id = 'three-r149';
      s.src = 'https://unpkg.com/three@0.149.0/build/three.min.js';
      s.onload = res;
      s.onerror = () => rej(new Error('three load error'));
      document.head.appendChild(s);
    });
  }

  // marca singleton para evitar warnings de múltiples instancias
  window.__THREE_SINGLETON__ = true;
  return !!window.THREE;
}

// ---------- Simple Orbit (inline, sin dependencia externa) ----------
class SimpleOrbit {
  constructor(camera, dom){
    this.camera=camera; this.dom=dom;
    this.target=new THREE.Vector3(0,0,0);
    this.spherical=new THREE.Spherical(120, Math.PI/2, 0); // r,phi,theta
    this.minDistance=10; this.maxDistance=1000;
    this.rotateSpeed=0.006; this.zoomSpeed=1.0; this.panSpeed=0.002;
    this.damping=0.1; this._vel=new THREE.Vector2(0,0);
    this._state=null; this._last=new THREE.Vector2();
    dom.addEventListener("pointerdown",e=>this._onDown(e));
    dom.addEventListener("pointermove",e=>this._onMove(e));
    dom.addEventListener("pointerup",()=>this._state=null);
    dom.addEventListener("wheel",e=>this._onWheel(e), {passive:false});
    this.update(true);
  }
  _onDown(e){ this._state = e.shiftKey ? "pan" : "rot"; this._last.set(e.clientX,e.clientY); this.dom.setPointerCapture(e.pointerId); }
  _onMove(e){
    if(!this._state) return;
    const dx=e.clientX-this._last.x, dy=e.clientY-this._last.y;
    this._last.set(e.clientX,e.clientY);
    if(this._state==="rot"){ this._vel.x += -dx*this.rotateSpeed; this._vel.y += -dy*this.rotateSpeed; }
    else{ // pan
      const panX = -dx*this.panSpeed*this.spherical.radius;
      const panY = dy*this.panSpeed*this.spherical.radius;
      const pan = new THREE.Vector3();
      const m = new THREE.Matrix4().lookAt(this.camera.position, this.target, new THREE.Vector3(0,1,0)).invert();
      pan.set(panX, panY, 0).applyMatrix4(m);
      this.target.add(pan);
    }
  }
  _onWheel(e){
    e.preventDefault();
    const s = Math.exp(e.deltaY*0.001*this.zoomSpeed);
    this.spherical.radius = THREE.MathUtils.clamp(this.spherical.radius*s, this.minDistance, this.maxDistance);
  }
  update(force=false){
    // aplicar damping a rotación
    if(!force){
      this.spherical.theta += this._vel.x;
      this.spherical.phi   += this._vel.y;
      this._vel.multiplyScalar(1-this.damping);
    }
    // límites numéricos
    this.spherical.phi = THREE.MathUtils.clamp(this.spherical.phi, 0.0001, Math.PI-0.0001);
    this.spherical.radius = THREE.MathUtils.clamp(this.spherical.radius, this.minDistance, this.maxDistance);
    const pos=new THREE.Vector3().setFromSpherical(this.spherical).add(this.target);
    this.camera.position.copy(pos);
    this.camera.lookAt(this.target);
  }
}

// ---------- Audio ----------
let AC=null, master=null;
function makeNoiseBuffer(ctx,seconds=2){
  const len=(ctx.sampleRate*seconds)|0;
  const buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const ch=buf.getChannelData(0);
  for(let i=0;i<len;i++){ ch[i]=Math.random()*2-1; }
  return buf;
}
function map(v,a,b,c,d){ return c + ((v-a)/(b-a))*(d-c); }
function clamp(x,a,b){ return Math.min(b,Math.max(a,x)); }
function setupAudio(voices){
  if (AC && AC.state!=="closed") return;
  AC = new (window.AudioContext||window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = +els.gain.value; master.connect(AC.destination);
  const noiseBuf = makeNoiseBuffer(AC,2.5);
  voices.forEach(v=>{
    const src = AC.createBufferSource(); src.buffer=noiseBuf; src.loop=true;
    const biq = AC.createBiquadFilter(); biq.type="bandpass"; biq.frequency.value=600; biq.Q.value=4;
    const lfo = AC.createOscillator(); lfo.type="sine"; lfo.frequency.value=0.4;
    const lfoGain = AC.createGain(); lfoGain.gain.value = 100;
    const g = AC.createGain(); g.gain.value = (1/voices.length)*0.9;
    lfo.connect(lfoGain).connect(biq.frequency);
    src.connect(biq).connect(g).connect(master);
    src.start(); lfo.start();
    v.audio = {src,biq,lfo,lfoGain,g};
  });
}
async function killAudio(){
  if(!AC) return;
  try{
    attractors.forEach(a=>{
      if(a.audio){ try{a.audio.src.stop();}catch{} try{a.audio.src.disconnect();}catch{} try{a.audio.g.disconnect();}catch{} try{a.audio.lfo.disconnect();}catch{} }
    });
    master && master.disconnect();
  }catch{}
  try{ await AC.close(); }catch{}
  AC=null; master=null;
}

// ---------- THREE setup ----------
let renderer=null, scene=null, camera=null, group=null, animId=0, lastTs=0, started=false, controls=null;
async function setup3D(){
  const ok = await ensureThree();
  if(!ok) throw new Error("three.js no disponible");
  const W = els.view.clientWidth||640, H = els.view.clientHeight||420;
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(W,H,false);
  els.view.innerHTML=""; els.view.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 2000);
  camera.position.set(0,0,120);
  group = new THREE.Group(); scene.add(group);
  const axes = new THREE.AxesHelper(30); group.add(axes);
  const amb = new THREE.AmbientLight(0xffffff,0.7); scene.add(amb);
  controls = new SimpleOrbit(camera, renderer.domElement);
}

// ---------- Attractor ----------
class Attractor {
  constructor(x,y,z,color,maxPoints){
    this.x=x; this.y=y; this.z=z;
    this.color=color; this.maxPoints=maxPoints;
    this.geometry = new THREE.BufferGeometry();
    const arr = new Float32Array(this.maxPoints*3);
    this.geometry.setAttribute("position", new THREE.BufferAttribute(arr,3));
    this.material = new THREE.LineBasicMaterial({color:this.color, transparent:true, opacity:0.9});
    this.line = new THREE.Line(this.geometry, this.material);
    group.add(this.line);
  }
  updateDynamics(dt,sigma,rho,beta){
    const dx = (sigma*(this.y - this.x)) * dt;
    const dy = (this.x*(rho - this.z) - this.y) * dt;
    const dz = (this.x*this.y - beta*this.z) * dt;
    this.x += dx; this.y += dy; this.z += dz;
  }
  pushPoint(){
    const pos = this.geometry.attributes.position.array;
    const L = this.maxPoints;
    pos.copyWithin(0,3,L*3);
    pos[(L-1)*3+0]=this.x; pos[(L-1)*3+1]=this.y; pos[(L-1)*3+2]=this.z;
    this.geometry.attributes.position.needsUpdate = true;
  }
  audioMap(){
    if(!this.audio || !AC) return;
    const r = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
    const f = clamp(map(r,0,80,180,4000),80,6000);
    this.audio.biq.frequency.setTargetAtTime(f, AC.currentTime, 0.02);
    const q = clamp(map(Math.abs(this.z),0,40,1.2,25),0.8,35);
    this.audio.biq.Q.setTargetAtTime(q, AC.currentTime, 0.03);
    const lfoHz = clamp(map(q,1,25,0.15,9.0),0.05,12.0);
    this.audio.lfo.frequency.setTargetAtTime(lfoHz, AC.currentTime, 0.05);
  }
  dispose(){ group.remove(this.line); this.geometry.dispose(); this.material.dispose(); }
}

// ---------- State ----------
let attractors=[];
function reseed(){
  attractors.forEach(a=>a.dispose());
  attractors=[];
  const N=+els.num.value, maxPts=+els.maxPts.value;
  for(let i=0;i<N;i++){
    const init=(i+1)*0.05;
    const hue=Math.floor(((i+1)/N)*360);
    const col=new THREE.Color(`hsl(${hue},70%,60%)`);
    const a=new Attractor(init,init,init,col,maxPts);
    const arr=a.geometry.attributes.position.array;
    for(let k=0;k<maxPts;k++){ arr[k*3]=a.x; arr[k*3+1]=a.y; arr[k*3+2]=a.z; }
    a.geometry.attributes.position.needsUpdate=true;
    attractors.push(a);
  }
}

function loop(ts){
  if(!started) return;
  animId=requestAnimationFrame(loop);
  const dtUI=+els.dt.value;
  const dt=Math.min(0.03, lastTs ? (ts-lastTs)/1000 : 0.016); lastTs=ts;
  const sub=Math.max(1, Math.floor(dt/dtUI));
  for(let s=0;s<sub;s++){
    attractors.forEach(a=>{
      a.updateDynamics(dtUI, +els.sigma.value, +els.rho.value, +els.beta.value);
      a.pushPoint();
      a.audioMap();
    });
  }
  group.rotation.x += 0.1*dt;       // rotación constante
  controls && controls.update();    // orbit
  renderer.render(scene,camera);
}

// ---------- Buttons ----------
els.start.addEventListener("click", async ()=>{
  if (started) return;
  els.status.textContent="starting…";
  await setup3D();
  reseed();
  setupAudio(attractors);
  started=true; lastTs=0; els.status.textContent="playing";
  loop(0);
});
els.stop.addEventListener("click", async ()=>{
  if(!started && !AC) return;
  started=false; cancelAnimationFrame(animId);
  els.status.textContent="stopping…";
  await killAudio();
  els.status.textContent="stopped";
});
els.reseed.addEventListener("click", async ()=>{
  const was=started;
  if(was){ started=false; cancelAnimationFrame(animId); await killAudio(); }
  reseed();
  if(was){ setupAudio(attractors); started=true; lastTs=0; els.status.textContent="playing"; loop(0); }
});

// ---------- Resize ----------
const ro = new ResizeObserver(()=>{
  if(!renderer || !camera) return;
  const W = els.view.clientWidth||640, H = els.view.clientHeight||420;
  renderer.setSize(W,H,false);
  camera.aspect=W/H; camera.updateProjectionMatrix();
});
ro.observe(els.view);

// ---------- Cleanup ----------
root.__lorenzCleanup = async ()=>{
  try{ started=false; cancelAnimationFrame(animId);}catch{}
  await killAudio();
  try{ attractors.forEach(a=>a.dispose()); }catch{}
  try{ renderer && renderer.dispose && renderer.dispose(); }catch{}
  els.view.innerHTML="";
};
```










## la escritura icónica es platform-agnostic

### blender

```python
# Lorenz Attractor → Blender (solo generación, Blender 3.x y 4.x)
# - Crea N trayectorias como CURVE 3D con material de emisión.
# - Sin UI, sin audio, sin animación.

import bpy
from mathutils import Color

# ----------------------------
# Parámetros
# ----------------------------
SIGMA = 10.0       # σ
RHO   = 28.0       # ρ
BETA  = 8.0/3.0    # β
DT    = 0.01       # paso de integración
NUM_PARTICLES = 20 # cantidad de “semillas”
STEPS = 400        # puntos por trayectoria
SEED_SPACING = 0.05# separación entre semillas
SCALE = 0.2        # factor de escala a unidades Blender
BEVEL_DEPTH = 0.01 # grosor de la curva
EMISSION_STRENGTH = 3.0
COLLECTION_NAME = "Lorenz_Attractor"
CLEAN_PREVIOUS = True

# ----------------------------
# Utilidades
# ----------------------------
def ensure_collection(name: str) -> bpy.types.Collection:
    col = bpy.data.collections.get(name)
    if col:
        return col
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col

def unlink_collection_from_all_scenes(col: bpy.types.Collection):
    # Blender 4.x: no users_scene; desenlazamos manualmente de cada escena
    for scn in bpy.data.scenes:
        def unlink_recursive(parent):
            # Unlink si está como hijo directo
            if col.name in parent.children.keys():
                parent.children.unlink(col)
                return True
            # Buscar en profundidad
            for child in parent.children:
                if unlink_recursive(child):
                    return True
            return False
        unlink_recursive(scn.collection)

def delete_collection(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        return
    # Unlink de todas las escenas y borrar objetos
    unlink_collection_from_all_scenes(col)
    for obj in list(col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    # Borrar sub-colecciones si hubiera
    for sub in list(col.children):
        col.children.unlink(sub)
    # Borrar colección
    bpy.data.collections.remove(col)

def hsv_to_rgba(h: float, s: float, v: float, a: float = 1.0):
    c = Color()
    c.hsv = (h, s, v)
    return (c.r, c.g, c.b, a)

def make_emission_material(name: str, color_rgba, strength: float):
    """Compatibilidad Blender 3.x y 4.x:
       - Si Principled tiene 'Emission', lo usamos (3.x).
       - Si no, usamos un nodo Emission directo al Output (4.x)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    # Limpieza mínima: dejamos Output y Principled si existe
    out = nodes.get("Material Output")
    bsdf = nodes.get("Principled BSDF")

    if not out:
        out = nodes.new("ShaderNodeOutputMaterial")

    # Caso 1: Principled con socket Emission (3.x)
    if bsdf and "Emission" in bsdf.inputs and "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission"].default_value = color_rgba
        bsdf.inputs["Emission Strength"].default_value = strength
        # Asegurar conexión BSDF->Output
        if not any(l.to_node == out and l.from_node == bsdf for l in links):
            links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        return mat

    # Caso 2: Blender 4.x (sin Emission en Principled): Emission node directo
    # Eliminamos conexiones previas al Surface
    for l in list(links):
        if l.to_node == out and l.to_socket == out.inputs.get("Surface"):
            links.remove(l)

    # Crear Emission y conectar a Surface
    emis = nodes.new("ShaderNodeEmission")
    emis.inputs["Color"].default_value = color_rgba
    emis.inputs["Strength"].default_value = strength
    links.new(emis.outputs["Emission"], out.inputs["Surface"])

    # (Opcional) si hay Principled, lo dejamos sin conectar
    return mat

def lorenz_points(x, y, z, steps, sigma, rho, beta, dt, scale):
    pts = []
    for _ in range(steps):
        dx = (sigma * (y - x)) * dt
        dy = (x * (rho - z) - y) * dt
        dz = (x * y - beta * z) * dt
        x += dx; y += dy; z += dz
        pts.append((x * scale, y * scale, z * scale))
    return pts

def make_curve_from_points(name, points, bevel_depth=0.01):
    crv = bpy.data.curves.new(name=name, type='CURVE')
    crv.dimensions = '3D'
    crv.resolution_u = 2
    crv.fill_mode = 'FULL'
    crv.bevel_depth = bevel_depth

    spl = crv.splines.new('POLY')
    spl.points.add(len(points) - 1)
    for i, (x, y, z) in enumerate(points):
        spl.points[i].co = (x, y, z, 1.0)

    obj = bpy.data.objects.new(name, crv)
    return obj

# ----------------------------
# Generación
# ----------------------------
if CLEAN_PREVIOUS and COLLECTION_NAME in bpy.data.collections:
    delete_collection(COLLECTION_NAME)

col = ensure_collection(COLLECTION_NAME)

for i in range(NUM_PARTICLES):
    init = (i + 1) * SEED_SPACING
    pts = lorenz_points(init, init, init, STEPS, SIGMA, RHO, BETA, DT, SCALE)

    obj = make_curve_from_points(f"Lorenz_{i+1}", pts, BEVEL_DEPTH)

    # Color por partícula (hue 0..1)
    h = (i + 1) / max(1, NUM_PARTICLES)
    color = hsv_to_rgba(h, 0.7, 1.0, 1.0)

    mat = make_emission_material(f"LorenzMat_{i+1}", color, EMISSION_STRENGTH)
    obj.data.materials.append(mat)

    col.objects.link(obj)

print(f"[OK] Generadas {NUM_PARTICLES} curvas de Lorenz en colección '{COLLECTION_NAME}'.")
```



![|600](https://i.imgur.com/vwaPwyw.png)