
```dataviewjs
try {
  const r = this.container;
  // Cleanup if previous instance in this block
  if (r.__ligetiCleanup) { try { r.__ligetiCleanup(); } catch(e) {} }
  r.innerHTML = "";
  // -------- Helpers --------
  const uid = () => 'id-' + Math.random().toString(36).slice(2);
  const fmt = (x, n=3) => Number(x).toFixed(n);
  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  function randn() { // Box-Muller
    let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  // -------- UI --------
  const panel = document.createElement('div');
  panel.style.display = 'grid';
  panel.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  panel.style.gap = '8px';
  panel.style.alignItems = 'center';
  r.appendChild(panel);
  // Function for label + range + output
  const labelVal = (labelText, min, max, step, val, fmtFunc = (v) => v.toFixed(3), unit = '') => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.flexDirection = 'column';
    label.style.gap = '4px';
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = val;
    input.style.width = '100%';
    const id = uid();
    input.id = id;
    label.htmlFor = id;
    label.appendChild(input);
    const small = document.createElement('small');
    small.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    small.style.opacity = '0.8';
    const span = document.createElement('span');
    span.textContent = fmtFunc(val) + (unit ? ` ${unit}` : '');
    small.appendChild(span);
    label.appendChild(small);
    const listener = () => span.textContent = fmtFunc(input.value) + (unit ? ` ${unit}` : '');
    input.addEventListener('input', listener);
    return { wrapper: label, input, output: span, listener };
  };
  const nVoices = labelVal('n_partículas (≈instrumentos)', 4, 120, 1, 60, (v) => v);
  const drift = labelVal('corriente_global [semitonos/seg]', -2, 2, 0.001, 0.05, (v) => v.toFixed(2), 'st/s');
  const sigma = labelVal('fluctuación_local σ (0–1)', 0, 1, 0.001, 0.30, (v) => v.toFixed(2));
  const spread = labelVal('ancho_cluster [semitonos]', 0, 60, 0.1, 24, (v) => v.toFixed(1), 'st');
  const center = labelVal('centro_cluster [MIDI]', 36, 84, 0.1, 60, (v) => v.toFixed(1));
  const gain = labelVal('ganancia_master', 0, 1, 0.001, 0.15, (v) => v.toFixed(2));
  const attack = labelVal('ataque [s]', 0.005, 5, 0.001, 2.0, (v) => v.toFixed(3), 's');
  const release = labelVal('release [s]', 0.01, 8, 0.001, 3.0, (v) => v.toFixed(3), 's');
  panel.append(
    nVoices.wrapper, drift.wrapper, sigma.wrapper, spread.wrapper,
    center.wrapper, gain.wrapper, attack.wrapper, release.wrapper
  );
  // Button row
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  row.style.flexWrap = 'wrap';
  r.appendChild(row);
  const mkBtn = (text) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.padding = '6px 10px';
    btn.style.border = '1px solid #444'; // Fixed fallback, or use var(--background-modifier-border) if defined
    btn.style.borderRadius = '8px';
    btn.style.background = 'transparent';
    btn.style.cursor = 'pointer';
    btn.style.color = '#ddd'; // Fixed for dark mode
    btn.addEventListener('mouseover', () => { btn.style.background = '#333'; }); // Fixed hover
    btn.addEventListener('mouseout', () => { btn.style.background = 'transparent'; });
    return btn;
  };
  const startBtn = mkBtn('Start');
  const stopBtn = mkBtn('Stop');
  const reseedBtn = mkBtn('Re-seed');
  const status = document.createElement('span');
  status.textContent = 'idle';
  status.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  status.style.opacity = '0.8';
  status.style.color = '#ddd'; // Fixed
  row.append(startBtn, stopBtn, reseedBtn, status);
  // Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 320;
  canvas.style.width = '100%';
  canvas.style.height = '320px';
  canvas.style.display = 'block';
  canvas.style.background = 'transparent';
  canvas.style.border = '1px solid #444'; // Fixed
  canvas.style.borderRadius = '8px';
  r.appendChild(canvas);
  // Note
  const note = document.createElement('small');
  note.textContent = 'y: tiempo → (scroll), x: frecuencia (MIDI), puntos/traços = partículas (glissandi)';
  note.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  note.style.opacity = '0.8';
  note.style.color = '#ddd'; // Fixed
  note.style.display = 'block';
  note.style.marginTop = '8px';
  r.appendChild(note);
  // Canvas context
  const ctx2d = canvas.getContext('2d', { alpha: true });
  const W = () => canvas.width, H = () => canvas.height;
  function clearViz() {
    ctx2d.clearRect(0, 0, W(), H());
  }
  clearViz();
  // Elements map (no need for syncOutputs; listeners handle it)
  const el = {
    nVoices: nVoices.input, nVoicesOut: nVoices.output,
    drift: drift.input, driftOut: drift.output,
    sigma: sigma.input, sigmaOut: sigma.output,
    spread: spread.input, spreadOut: spread.output,
    center: center.input, centerOut: center.output,
    gain: gain.input, gainOut: gain.output,
    attack: attack.input, attackOut: attack.output,
    release: release.input, releaseOut: release.output,
    start: startBtn, stop: stopBtn, reseed: reseedBtn,
    status: status,
    canvas
  };
  // Audio state
  let AC = null, master = null, comp = null, playing = false, rafId = 0;
  let particles = [];
  let centerMidi = parseFloat(el.center.value);
  let lastT = 0;
  // Color util
  function themeColor() {
    const c = getComputedStyle(r).getPropertyValue('--text-accent').trim() || '#66aaff';
    return c;
  }
  function randomColor() {
    const h = Math.floor(Math.random() * 360);
    return `hsla(${h}, 70%, 55%, 0.85)`;
  }
  // Build particles
  function reseedParticles() {
    const N = parseInt(el.nVoices.value, 10);
    const spreadVal = parseFloat(el.spread.value);
    centerMidi = parseFloat(el.center.value);
    const offsets = Array.from({ length: N }, () => (Math.random() - 0.5) * spreadVal);
    particles = offsets.map(off => ({
      baseOffset: off,
      dev: 0,
      vel: 0,
      osc: null,
      g: null,
      pan: null,
      color: randomColor(),
      lastMidi: centerMidi + off
    }));
  }
  reseedParticles();
  // Impulse response
  function makeImpulseResponse(context, duration = 3.0, decay = 2.0) {
    const rate = context.sampleRate;
    const length = rate * duration;
    const impulse = context.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const ch = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }
  // Build audio graph
  async function makeAudio() {
    if (AC && AC.state !== 'closed') return;
    AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') await AC.resume();
    comp = AC.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, AC.currentTime);
    comp.knee.setValueAtTime(18, AC.currentTime);
    comp.ratio.setValueAtTime(8, AC.currentTime);
    comp.attack.setValueAtTime(0.003, AC.currentTime);
    comp.release.setValueAtTime(0.100, AC.currentTime);
    master = AC.createGain();
    master.gain.value = 0.0001;
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
    particles.forEach(p => {
      const osc = new OscillatorNode(AC, { type: 'sine', frequency: midiToFreq(centerMidi + p.baseOffset) });
      const g = new GainNode(AC, { gain: per * (0.8 + 0.4 * Math.random()) });
      let pan = null;
      try {
        pan = new StereoPannerNode(AC, { pan: (Math.random() * 2 - 1) * 0.8 });
      } catch {
        pan = { connect: (dest) => g.connect(dest) };
      }
      osc.connect(g);
      if (pan.connect) g.connect(pan).connect(master);
      else g.connect(master);
      osc.start();
      p.osc = osc; p.g = g; p.pan = pan;
    });
    const atk = parseFloat(el.attack.value);
    master.gain.cancelScheduledValues(AC.currentTime);
    master.gain.setValueAtTime(master.gain.value, AC.currentTime);
    master.gain.linearRampToValueAtTime(parseFloat(el.gain.value), AC.currentTime + atk);
  }
  // Stop audio and cleanup
  async function killAudio() {
    if (!AC) return;
    const rel = parseFloat(el.release.value);
    try {
      master.gain.linearRampToValueAtTime(0.0001, AC.currentTime + rel);
    } catch {}
    await new Promise(r => setTimeout(r, Math.max(50, rel * 1000)));
    try {
      particles.forEach(p => {
        try { p.osc.stop(); } catch {}
        try { p.g.disconnect(); } catch {}
      });
      comp.disconnect();
      master.disconnect();
    } catch {}
    try { await AC.close(); } catch {}
    AC = null; master = null; comp = null;
  }
  // Mapping x position
  function xFromMidi(m) {
    const minM = parseFloat(el.center.value) - parseFloat(el.spread.value) * 0.8 - 24;
    const maxM = parseFloat(el.center.value) + parseFloat(el.spread.value) * 0.8 + 24;
    const x = (m - minM) / (maxM - minM);
    return clamp(x, 0, 1) * W();
  }
  // Draw particle trail
  function drawStep(dt) {
    const h = H(), w = W();
    const img = ctx2d.getImageData(0, 0, w, h);
    ctx2d.putImageData(img, 0, -1);
    ctx2d.clearRect(0, h - 2, w, 2);
    particles.forEach(p => {
      const x = xFromMidi(p.lastMidi);
      ctx2d.fillStyle = p.color;
      ctx2d.fillRect(Math.floor(x), h - 2, 2, 2);
    });
  }
  // Advance dynamics
  function step() {
    if (!playing) return;
    if (!r.isConnected) { playing = false; killAudio(); return; } // Auto-cleanup
    rafId = requestAnimationFrame(step);
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, lastT ? now - lastT : 0.016);
    lastT = now;
    const driftVal = parseFloat(el.drift.value);
    const sigmaVal = parseFloat(el.sigma.value);
    const spreadVal = parseFloat(el.spread.value);
    centerMidi += driftVal * dt;
    const beta = 1.2;
    const sdev = sigmaVal * 0.8;
    particles.forEach(p => {
      const target = centerMidi + p.baseOffset;
      p.vel += (-beta * p.dev) * dt + sdev * Math.sqrt(dt) * randn();
      p.dev += p.vel * dt;
      const maxDev = Math.max(0.5, 0.35 * spreadVal);
      p.dev = clamp(p.dev, -maxDev, maxDev);
      const midi = target + p.dev;
      p.lastMidi = midi;
      if (AC && p.osc) {
        const f = midiToFreq(midi);
        p.osc.frequency.setTargetAtTime(f, AC.currentTime, 0.03);
      }
    });
    if (AC && master) {
      const targetMaster = parseFloat(el.gain.value);
      master.gain.setTargetAtTime(targetMaster, AC.currentTime, 0.10);
    }
    drawStep(dt);
  }
  // Buttons
  el.start.addEventListener('click', async () => {
    if (playing) return;
    await makeAudio();
    playing = true;
    el.status.textContent = 'playing';
    lastT = performance.now() / 1000;
    step();
  });
  el.stop.addEventListener('click', async () => {
    if (!playing && !AC) return;
    playing = false;
    cancelAnimationFrame(rafId);
    el.status.textContent = 'stopping…';
    await killAudio();
    el.status.textContent = 'stopped';
  });
  el.reseed.addEventListener('click', async () => {
    const was = playing;
    if (was) { playing = false; cancelAnimationFrame(rafId); await killAudio(); }
    reseedParticles();
    clearViz();
    if (was) { await makeAudio(); playing = true; el.status.textContent = 'playing'; lastT = performance.now() / 1000; step(); }
  });
  // Cleanup
  r.__ligetiCleanup = async () => {
    try { playing = false; cancelAnimationFrame(rafId); } catch {}
    await killAudio();
  };
} catch (e) {
  const pre = document.createElement('pre');
  pre.textContent = 'ERROR:\n' + (e && (e.stack || e.message || String(e)));
  this.container.appendChild(pre);
}
```



