
```dataviewjs
// Implementación básica de un patrón de Turing usando el modelo de reacción-difusión Gray-Scott
// en un canvas dentro de DataviewJS.

// Explicación de las fórmulas:
// El modelo Gray-Scott simula dos sustancias químicas: U (activador) y V (inhibidor).
// Las ecuaciones diferenciales son:
// du/dt = dA * ∇²U - U*V² + feed*(1 - U)
// dv/dt = dB * ∇²V + U*V² - (feed + kill)*V
// Donde:
// - ∇² es el operador Laplaciano, que modela la difusión. Se aproxima discretamente con un kernel:
//   Centro: -1
//   Adyacentes (arriba, abajo, izquierda, derecha): 0.2 cada uno
//   Diagonales: 0.05 cada una
// - dA y dB son tasas de difusión (dA > dB para patrones de Turing).
// - feed: tasa a la que U se "alimenta" o se repone.
// - kill: tasa a la que V se elimina.
// - La reacción -U*V² + U*V² representa cómo V inhibe U, y U activa V.
// - Se clampan los valores entre 0 y 1 para estabilidad.
// Esto genera patrones como manchas, rayas o laberintos emergentes de condiciones iniciales.

const container = this.container;
container.innerHTML = `
<canvas id="turingCanvas" width="200" height="200" style="border:1px solid #ccc;"></canvas>
`;

const canvas = container.querySelector("#turingCanvas");
const ctx = canvas.getContext("2d");

const w = 100; // Ancho de la cuadrícula (celdas)
const h = 100; // Alto de la cuadrícula (celdas)
const dA = 1.0; // Tasa de difusión para U
const dB = 0.5; // Tasa de difusión para V (menor que dA para inestabilidad)
const feed = 0.055; // Tasa de alimentación
const kill = 0.062; // Tasa de eliminación

// Inicializar grids: U empieza en 1.0 (todo lleno), V en 0.0
let currentU = new Array(w * h).fill(1.0);
let currentV = new Array(w * h).fill(0.0);
let nextU = new Array(w * h);
let nextV = new Array(w * h);

// Perturbación inicial en el centro para iniciar el patrón
for (let x = 40; x < 60; x++) {
  for (let y = 40; y < 60; y++) {
    currentU[y * w + x] = 0.5;
    currentV[y * w + x] = 0.25;
  }
}

// Función para calcular el Laplaciano discreto en una posición i
function laplace(grid, i) {
  const x = i % w;
  const y = Math.floor(i / w);
  const left = (x - 1 + w) % w;
  const right = (x + 1) % w;
  const up = (y - 1 + h) % h;
  const down = (y + 1) % h;
  let lap = -1 * grid[i]; // Centro
  lap += 0.2 * grid[y * w + left]; // Izquierda
  lap += 0.2 * grid[y * w + right]; // Derecha
  lap += 0.2 * grid[up * w + x]; // Arriba
  lap += 0.2 * grid[down * w + x]; // Abajo
  lap += 0.05 * grid[up * w + left]; // Diagonal arriba-izquierda
  lap += 0.05 * grid[up * w + right]; // Diagonal arriba-derecha
  lap += 0.05 * grid[down * w + left]; // Diagonal abajo-izquierda
  lap += 0.05 * grid[down * w + right]; // Diagonal abajo-derecha
  return lap;
}

// Función de actualización: aplica las ecuaciones de Gray-Scott
function update() {
  for (let i = 0; i < w * h; i++) {
    const u = currentU[i];
    const v = currentV[i];
    const lapU = laplace(currentU, i);
    const lapV = laplace(currentV, i);
    // Fórmula para nextU: difusión + reacción + alimentación
    nextU[i] = u + (dA * lapU - u * v * v + feed * (1 - u));
    // Fórmula para nextV: difusión + reacción - eliminación
    nextV[i] = v + (dB * lapV + u * v * v - (feed + kill) * v);
    // Clamp para mantener valores entre 0 y 1
    nextU[i] = Math.max(0, Math.min(1, nextU[i]));
    nextV[i] = Math.max(0, Math.min(1, nextV[i]));
  }
  // Intercambiar grids para la siguiente iteración
  [currentU, nextU] = [nextU, currentU];
  [currentV, nextV] = [nextV, currentV];
}

// Función de renderizado: dibuja la grid como pixeles escalados (2x2 por celda)
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < w * h; i++) {
    // Color basado en U - V, escalado a 0-255 para gris
    const val = Math.floor((currentU[i] - currentV[i]) * 255);
    const color = Math.max(0, Math.min(255, val));
    const x = (i % w) * 2; // Escala x2 para canvas 200x200
    const y = Math.floor(i / w) * 2;
    ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

// Bucle de animación: múltiples updates por frame para velocidad, luego render
function loop() {
  for (let iter = 0; iter < 10; iter++) { // 10 updates por frame para simular más rápido
    update();
  }
  render();
  requestAnimationFrame(loop);
}

loop();
```


## Pattern de Turing

```dataviewjs
// Gray–Scott Reaction–Diffusion (Pattern "Zebra") — runs in dataviewjs without external libs

const W = 192, H = 192;                     // grid size (increase if your machine is fast)
const Du = 0.16, Dv = 0.08;                 // diffusion
// Zebra-ish stripes (maze) preset:
let F = 0.029, k = 0.057;                   // feed & kill — tweak slightly to vary stripe density
const dt = 1.0;                             // timestep

const container = this.container;
container.innerHTML = `
<div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:640px">
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
    <button id="gs-run" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer">Run</button>
    <button id="gs-pause" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer">Pause</button>
    <button id="gs-reset" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer">Reset</button>
    <span style="margin-left:auto;color:#666" id="gs-status">F=${F.toFixed(3)} k=${k.toFixed(3)}</span>
  </div>
  <canvas id="gs-cv" width="${W}" height="${H}" style="width:100%;image-rendering:pixelated;border:1px solid #ddd;border-radius:8px;background:#000"></canvas>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px;">
    <label style="display:flex;flex-direction:column;gap:4px;">
      <span>F (feed)</span>
      <input id="gs-F" type="range" min="0.015" max="0.040" step="0.001" value="${F}">
    </label>
    <label style="display:flex;flex-direction:column;gap:4px;">
      <span>k (kill)</span>
      <input id="gs-k" type="range" min="0.045" max="0.070" step="0.001" value="${k}">
    </label>
  </div>
</div>
`;

const cv = container.querySelector("#gs-cv");
const ctx = cv.getContext("2d", { willReadFrequently:true });
let running = true;

// State buffers
let U = new Float32Array(W*H);
let V = new Float32Array(W*H);

// Initialize with uniform U=1, V=0 and a central square + noise
function seed() {
  U.fill(1.0); V.fill(0.0);
  const r = 16;
  for (let y = H/2 - r; y < H/2 + r; y++) {
    for (let x = W/2 - r; x < W/2 + r; x++) {
      const i = (y|0)*W + (x|0);
      U[i] = 0.50; V[i] = 0.25;
    }
  }
  for (let i=0;i<U.length;i++) {
    U[i] = clamp01(U[i] + (Math.random()-0.5)*0.02);
    V[i] = clamp01(V[i] + (Math.random()-0.5)*0.02);
  }
}
seed();

function clamp01(x){ return x<0?0:(x>1?1:x); }

// 9-point Laplacian (periodic boundary)
function lap(A, x, y){
  const xm=(x-1+W)%W, xp=(x+1)%W, ym=(y-1+H)%H, yp=(y+1)%H;
  const c  = A[y*W+x];
  const n  = A[ym*W+x], s  = A[yp*W+x], w = A[y*W+xm], e = A[y*W+xp];
  const nw = A[ym*W+xm], ne = A[ym*W+xp], sw = A[yp*W+xm], se = A[yp*W+xp];
  return -1.0*c + 0.2*(n+s+w+e) + 0.05*(nw+ne+sw+se);
}

const img = ctx.createImageData(W,H);
const pix = img.data;

// One simulation step
function step() {
  const U2 = new Float32Array(W*H);
  const V2 = new Float32Array(W*H);
  for (let y=0;y<H;y++){
    for (let x=0;x<W;x++){
      const i = y*W+x;
      const u = U[i], v = V[i];
      const Lu = lap(U,x,y), Lv = lap(V,x,y);
      const uvv = u*v*v;
      const uN = u + (Du*Lu - uvv + F*(1.0-u)) * dt;
      const vN = v + (Dv*Lv + uvv - (F+k)*v) * dt;
      U2[i] = clamp01(uN);
      V2[i] = clamp01(vN);
    }
  }
  U = U2; V = V2;
}

// Draw V as grayscale (stripes show strongly in V)
function draw() {
  for (let i=0;i<V.length;i++){
    const c = (V[i])*255|0;
    const j = i<<2;
    pix[j] = pix[j+1] = pix[j+2] = c;
    pix[j+3] = 255;
  }
  ctx.putImageData(img,0,0);
}

// Run multiple iterations per frame for faster emergence
function loop(){
  if (running){
    for (let n=0;n<2;n++) step();   // increase to 3–4 for quicker growth
    draw();
  }
  requestAnimationFrame(loop);
}
loop();

// UI controls
const statusEl = container.querySelector("#gs-status");
const btnRun   = container.querySelector("#gs-run");
const btnPause = container.querySelector("#gs-pause");
const btnReset = container.querySelector("#gs-reset");
const sliderF  = container.querySelector("#gs-F");
const sliderK  = container.querySelector("#gs-k");

btnRun.onclick   = () => running = true;
btnPause.onclick = () => running = false;
btnReset.onclick = () => { running=false; seed(); draw(); };

sliderF.oninput = () => { F = parseFloat(sliderF.value); statusEl.textContent = `F=${F.toFixed(3)} k=${k.toFixed(3)}`; };
sliderK.oninput = () => { k = parseFloat(sliderK.value); statusEl.textContent = `F=${F.toFixed(3)} k=${k.toFixed(3)}`; };

// Tip: para cebra más "compacta", probá F≈0.028–0.031 y k≈0.055–0.060
```



## Zebra-lit con webaudio


```dataviewjs
// Turing Pattern (Gray–Scott "zebra-lite") + WebAudio — mismo flujo: un botón Play/Stop
// - Canvas muestra el patrón evolucionando
// - Audio: tono cuya frecuencia se mapea a la textura (mean/std de V)
// - Ajustado para DVJS: sin librerías externas, loop con rAF y pocos pasos por frame

const el = this.container;
el.innerHTML = `
  <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <button id="btn" style="padding:6px 10px;border:1px solid #ccc;border-radius:8px;background:#f7f7f7;cursor:pointer">Play</button>
      <span id="status" style="color:#666">Gray–Scott zebra</span>
      <span id="fps" style="margin-left:auto;color:#777;font-variant-numeric:tabular-nums">fps: --</span>
    </div>
    <canvas id="cv" width="192" height="192" style="width:100%;image-rendering:pixelated;background:#0b0b0b;border:1px solid #222;border-radius:8px"></canvas>
  </div>
`;

const cv = el.querySelector("#cv");
const ctx = cv.getContext("2d", { willReadFrequently:true });
const statusEl = el.querySelector("#status");
const fpsEl = el.querySelector("#fps");

let playing = false;
let rafId = null;

// ---- Gray–Scott setup (zebra-ish) ----
const W = cv.width, H = cv.height;
const Du = 0.16, Dv = 0.08;
let F  = 0.029, k = 0.057;   // stripes
const dt = 1.0;

let U = new Float32Array(W*H);
let V = new Float32Array(W*H);

function clamp01(x){ return x<0?0:(x>1?1:x); }

function seed(){
  U.fill(1.0); V.fill(0.0);
  const r = 16;
  for (let y = H/2-r; y < H/2+r; y++){
    for (let x = W/2-r; x < W/2+r; x++){
      const i = (y|0)*W + (x|0);
      U[i] = 0.50; V[i] = 0.25;
    }
  }
  for (let i=0;i<U.length;i++){
    U[i] = clamp01(U[i] + (Math.random()-0.5)*0.02);
    V[i] = clamp01(V[i] + (Math.random()-0.5)*0.02);
  }
}
seed();

function lap(A,x,y){
  const xm=(x-1+W)%W, xp=(x+1)%W, ym=(y-1+H)%H, yp=(y+1)%H;
  const c=A[y*W+x], n=A[ym*W+x], s=A[yp*W+x], w=A[y*W+xm], e=A[y*W+xp];
  const nw=A[ym*W+xm], ne=A[ym*W+xp], sw=A[yp*W+xm], se=A[yp*W+xp];
  return -1.0*c + 0.2*(n+s+w+e) + 0.05*(nw+ne+sw+se);
}

function step(){
  const U2 = new Float32Array(W*H);
  const V2 = new Float32Array(W*H);
  for (let y=0;y<H;y++){
    for (let x=0;x<W;x++){
      const i = y*W+x;
      const u = U[i], v = V[i];
      const Lu = lap(U,x,y), Lv = lap(V,x,y);
      const uvv = u*v*v;
      U2[i] = clamp01(u + (Du*Lu - uvv + F*(1.0-u))*dt);
      V2[i] = clamp01(v + (Dv*Lv + uvv - (F+k)*v)*dt);
    }
  }
  U = U2; V = V2;
}

const img = ctx.createImageData(W,H);
const pix = img.data;
function draw(){
  for (let i=0;i<V.length;i++){
    const c = (V[i]*255)|0, j = i<<2;
    pix[j]=pix[j+1]=pix[j+2]=c; pix[j+3]=255;
  }
  ctx.putImageData(img,0,0);
}

// ---- WebAudio (sine mapped to pattern stats) ----
let actx=null, osc=null, gain=null;

async function ensureAudio(){
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") await actx.resume();
  if (!gain){
    gain = actx.createGain(); gain.gain.value = 0.12; gain.connect(actx.destination);
  }
  if (!osc){
    osc = actx.createOscillator(); osc.type = "sine"; osc.connect(gain); osc.start();
  }
}

function sonify(){
  if (!actx || !osc) return;
  // muestreo reducido para no cargar CPU
  let sum=0, sum2=0, maxi=0;
  const skip = 64; // ajustar para suavizado de audio
  let count = 0;
  for (let i=0;i<V.length;i+=skip){
    const v = V[i];
    sum += v; sum2 += v*v;
    if (v>maxi) maxi=v;
    count++;
  }
  const mean = sum / count;
  const varr = Math.max(0, sum2/count - mean*mean);
  const std  = Math.sqrt(varr);

  const t = actx.currentTime;
  const freq = 110 + mean*700 + std*500;  // ~110–1310 Hz
  const g    = 0.08 + std*0.12;           // 0.08–0.20 aprox

  osc.frequency.setTargetAtTime(freq, t, 0.05);
  gain.gain.setTargetAtTime(g, t, 0.08);
}

// ---- Loop (varios pasos por frame para emerger rápido; target ~30 fps) ----
let lastT = performance.now(), acc = 0, frames=0, fpsTimer=performance.now();
const stepsPerFrame = 2;

function loop(){
  if (playing){
    for (let n=0;n<stepsPerFrame;n++) step();
    draw();
    sonify();
  }
  // FPS simple
  const now = performance.now();
  frames++;
  if (now - fpsTimer >= 1000){
    fpsEl.textContent = `fps: ${frames}`;
    frames = 0; fpsTimer = now;
  }
  rafId = requestAnimationFrame(loop);
}

// ---- Controls ----
async function start(){
  await ensureAudio();
  if (!rafId) rafId = requestAnimationFrame(loop);
  playing = true;
  statusEl.textContent = "running (zebra)";
  el.querySelector("#btn").textContent = "Stop";
}
function stop(){
  playing = false;
  statusEl.textContent = "paused";
  el.querySelector("#btn").textContent = "Play";
  // mantener canvas y audio para reanudar sin clicks extra
}

el.querySelector("#btn").onclick = async ()=>{
  if (!playing) await start(); else stop();
};

// arranque en pausa
draw();
```
