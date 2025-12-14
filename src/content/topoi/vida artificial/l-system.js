// l-system.js — smoother branches, clean leaves, Farnell flock, wind layer + round toggles
// three r128 legacy examples + birds.js (ES module)
/* global THREE */
import { Flock } from './birds.js';

let container;
let camera, scene, renderer, composer, controls;
let plant, sun, flockPoints;
let audioCtx = null, listener = null;
let wind = null;                 // { src, gain, bpf, lpf, pa }
let windLFO = null;              // oscillators to modulate wind amplitude
let flock = null;                // Flock instance
const birdActors = [];           // [{ mesh, pa, bird, phase }]

const STATE = {
  audioEnabled: false,
  birdsOn: true,
  windOn: true
};

/* ------------------------------ Visual options ----------------------------- */
const options = {
  seed: 1337,
  branch: {
    levels: 4,
    children: [6, 5, 3, 0],
    angle:    [25, 28, 30, 32],          // degrees - angle child branches grow from parent
    length:   [76, 48, 32, 20],
    radius:   [8.5, 5.4, 3.1, 1.6],
    sections: [11, 10, 9, 7],
    segments: [14, 12, 10, 8],           // higher radial segments = smoother
    taper:    [0.06, 0.085, 0.12, 1],
    start:    [0.14, 0.22, 0.3, 0.5],   // position along parent where child branches start growing
    twist:    [0.018, 0.028, 0.035, 0.045], // gradual twist along branch length
    gnarliness:[0.004,0.007,0.011,0.017],   // random twist for natural look
    force: { direction: new THREE.Vector3(0,1,0), strength: 0.06 } // growth toward sunlight
  },
  leaves: {
    enabled: true,
    size: 4.2,
    thickness: 0.06,             // stronger offset to avoid bark contact
    count: 12,
    angle: 26,
    color: 0x94ffd6,
    opacity: 0.95
  }
};

/* ------------------------------- RNG ------------------------------ */
class RNG {
  constructor(seed=1){ this.m=0x80000000; this.a=1103515245; this.c=12345; this.state=(seed>>>0)||1; }
  next(){ this.state=(this.a*this.state+this.c)%this.m; return this.state/(this.m-1); }
  range(a,b){ return a+(b-a)*this.next(); }
  signed(m){ return this.range(-m,m); }
}

/* ------------------------------- L-System ------------------------------ */
class LSystem {
  constructor({ axiom, rules, iterations }) {
    this.axiom = axiom;
    this.rules = rules;
    this.iterations = iterations;
  }

  generate() {
    let current = this.axiom;
    for (let i = 0; i < this.iterations; i++) {
      let next = '';
      for (const char of current) {
        next += this.rules[char] || char;
      }
      current = next;
    }
    return current;
  }
}


/* ------------------------------- Branch Data Structure ------------------------------ */
class Branch {
  constructor(origin, orientation, length, radius, level, sectionCount, segmentCount) {
    this.origin = origin.clone();                  // THREE.Vector3 - starting point
    this.orientation = orientation.clone();        // THREE.Euler - rotation
    this.length = length;                         // number - total length
    this.radius = radius;                         // number - starting radius
    this.level = level;                           // number - recursion depth (0 = trunk)
    this.sectionCount = sectionCount;             // number - subdivisions along length
    this.segmentCount = segmentCount;             // number - radial subdivisions
  }
}

/* ------------------------------- Tree builder ------------------------------ */
class TreeGenerator {
  constructor(opt) {
    this.opt = opt;
    this.rng = new RNG(opt.seed);
    this.branches = { verts: [], indices: [], normals: [], uvs: [] };
    this.leaves = [];
    this.branchQueue = [];
  }

  generate() {
    // Initialize geometry data
    this.branches = { verts: [], indices: [], normals: [], uvs: [] };
    this.leaves = [];

    // Start with the trunk (level 0)
    this.branchQueue.push(
      new Branch(
        new THREE.Vector3(),              // Origin
        new THREE.Euler(),                // Orientation
        this.opt.branch.length[0],        // Length
        this.opt.branch.radius[0],        // Radius
        0,                                // Recursion level
        this.opt.branch.sections[0],      // # of sections
        this.opt.branch.segments[0],      // # of segments
      ),
    );

    // Process branches in the queue
    while (this.branchQueue.length > 0) {
      const branch = this.branchQueue.shift();
      this.generateBranch(branch);
    }

    // Create the 3D geometry
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.branches.verts, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.branches.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.branches.uvs, 2));
    geo.setIndex(this.branches.indices);
    geo.computeBoundingSphere();

    // Smooth, round look (no faceted "planes")
    const mat = new THREE.MeshStandardMaterial({
      color: 0xe8e1d9,
      roughness: 0.8,
      metalness: 0.0,
      flatShading: false
    });
    const trunk = new THREE.Mesh(geo, mat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    const group = new THREE.Group();
    group.add(trunk);

    if (this.opt.leaves.enabled && this.leaves.length) {
      const lm = new THREE.MeshBasicMaterial({
        color: this.opt.leaves.color,
        transparent: true,
        opacity: this.opt.leaves.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        alphaTest: 0.12
      });
      const w = this.opt.leaves.size, h = w * 1.45;
      const g = new THREE.PlaneBufferGeometry(w, h);

      const leafGroup = new THREE.Group();
      for (const L of this.leaves) {
        const q = L.quat;
        const base = L.pos;

        const m1 = new THREE.Mesh(g, lm);
        const n1 = new THREE.Vector3(0, 0, this.opt.leaves.thickness * h).applyQuaternion(q);
        m1.position.copy(base.clone().add(n1));
        m1.quaternion.copy(q);
        m1.castShadow = true;

        const q2 = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2));
        const m2 = new THREE.Mesh(g, lm);
        const n2 = new THREE.Vector3(0, 0, this.opt.leaves.thickness * h).applyQuaternion(q2);
        m2.position.copy(base.clone().add(n2));
        m2.quaternion.copy(q2);
        m2.castShadow = true;

        leafGroup.add(m1, m2);
      }
      group.add(leafGroup);
    }
    return group;
  }

  generateBranch(b) {
    const B = this.opt.branch;
    let o = b.origin.clone(), e = b.orientation.clone();
    const segLen = b.length / b.sectionCount;
    let prevSectionVertices = -1;

    const sections = [];

    for (let i = 0; i <= b.sectionCount; i++) {
      // Calculate section radius (taper toward tip)
      let r = b.radius;
      if (i === b.sectionCount) {
        r = 0.001;  // Branches end in a point
      } else {
        r *= 1 - B.taper[b.level] * (i / b.sectionCount);
      }

      // Create vertices for this section
      const sectionVertices = this._createSectionVertices(o, e, r, b.segmentCount);

      // Store section data for child branch placement
      sections.push({
        origin: o.clone(),
        orientation: e.clone(),
        radius: r,
      });

      // Create triangles between this section and the previous one
      if (prevSectionVertices >= 0) {
        this._createSectionTriangles(prevSectionVertices, sectionVertices, b.segmentCount);
      }
      prevSectionVertices = sectionVertices;

      if (i === b.sectionCount) break;

      // Apply orientation changes (gnarliness, twist, growth force)
      const qSection = new THREE.Quaternion().setFromEuler(e);

      // Twist around Y axis
      const qTwist = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        B.twist[b.level],
      );

      // Growth force toward sunlight (or gravity)
      const qForce = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        B.force.direction.clone().normalize(),
      );

      qSection.multiply(qTwist);
      qSection.rotateTowards(
        qForce,
        B.force.strength / Math.max(0.1, r),  // smaller branches affected more
      );

      // Add gnarliness (natural randomness)
      const gnarliness =
        Math.max(1, 1 / Math.sqrt(Math.max(0.001, r))) * B.gnarliness[b.level];

      qSection.multiply(new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          this._rnd(gnarliness),
          0,
          this._rnd(gnarliness)
        )
      ));

      e.setFromQuaternion(qSection);

      // Advance along the (twisted) branch
      o.add(new THREE.Vector3(0, segLen, 0).applyEuler(e));
    }

    // Create child branches or leaves
    if (b.level >= B.levels) {
      this._generateLeaves(sections);  // End level -> leaves
    } else if (b.level < B.levels) {
      this._generateChildBranches(B.children[b.level], b.level + 1, sections);
    }
  }

  _createSectionVertices(origin, orientation, radius, segmentCount) {
    const startVert = this.branches.verts.length / 3;  // Index of first vertex in this section

    for (let j = 0; j < segmentCount; j++) {
      const angle = (2.0 * Math.PI * j) / segmentCount;
      const local = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(radius);
      const vertex = local.clone().applyEuler(orientation).add(origin);
      const normal = local.clone().normalize();

      this.branches.verts.push(vertex.x, vertex.y, vertex.z);
      this.branches.normals.push(normal.x, normal.y, normal.z);
      this.branches.uvs.push(j / segmentCount, 0);  // UV will be updated later
    }

    return startVert;
  }

  _createSectionTriangles(prevStart, currentStart, segmentCount) {
    for (let j = 0; j < segmentCount; j++) {
      const a = prevStart + j;
      const b = prevStart + ((j + 1) % segmentCount);
      const c = currentStart + j;
      const d = currentStart + ((j + 1) % segmentCount);

      // Two triangles per segment
      this.branches.indices.push(a, b, c, b, d, c);
    }
  }

  _generateChildBranches(count, nextLevel, sections) {
    if (count <= 0) return;

    const B = this.opt.branch;
    const radialOffset = this.rng.range(0, 1);

    for (let i = 0; i < count; i++) {
      // Determine how far along parent branch child originates
      const childStart = this.rng.range(B.start[nextLevel] ?? 0.2, 0.98);

      // Find which sections are on either side of child branch origin point
      const sectionIndex = Math.floor(childStart * (sections.length - 1));
      let sectionA = sections[sectionIndex];
      let sectionB = sectionIndex === sections.length - 1 ?
        sectionA : sections[sectionIndex + 1];

      // Find normalized distance from section A to section B (0 to 1)
      const alpha = (childStart - sectionIndex / (sections.length - 1)) /
        (1 / (sections.length - 1));

      // Linearly interpolate origin from section A to section B
      const childOrigin = new THREE.Vector3().lerpVectors(
        sectionA.origin,
        sectionB.origin,
        alpha,
      );

      // Interpolate radius
      const childRadius = B.radius[nextLevel] * ((1 - alpha) * sectionA.radius + alpha * sectionB.radius);

      // Interpolate orientation
      const qA = new THREE.Quaternion().setFromEuler(sectionA.orientation);
      const qB = new THREE.Quaternion().setFromEuler(sectionB.orientation);
      const parentOrientation = new THREE.Euler().setFromQuaternion(
        qB.slerp(qA, alpha),
      );

      // Calculate angle offset from parent branch and radial angle
      const tiltAngle = (B.angle[nextLevel] ?? 30) * Math.PI / 180;
      const radialAngle = 2 * Math.PI * (radialOffset + i / count);

      const qTilt = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        tiltAngle,
      );
      const qAround = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        radialAngle,
      );
      const qParent = new THREE.Quaternion().setFromEuler(parentOrientation);

      const childOrientation = new THREE.Euler().setFromQuaternion(
        qParent.multiply(qAround.multiply(qTilt)),
      );

      // Add to queue for processing
      this.branchQueue.push(
        new Branch(
          childOrigin,
          childOrientation,
          B.length[nextLevel] ?? 20,
          childRadius,
          nextLevel,
          B.sections[nextLevel] ?? 8,
          B.segments[nextLevel] ?? 6,
        ),
      );
    }
  }

  _generateLeaves(sections) {
    if (!this.opt.leaves.enabled) return;

    const cnt = this.opt.leaves.count;
    const tilt = this.opt.leaves.angle * Math.PI / 180;
    const start = Math.max(0, sections.length - 4);  // Leaves near tips

    for (let i = start; i < sections.length; i++) {
      const s = sections[i];
      const qParent = new THREE.Quaternion().setFromEuler(s.orientation);

      for (let k = 0; k < cnt; k++) {
        const radial = 2 * Math.PI * (k / cnt) + this.rng.range(0, Math.PI * 2 / cnt);

        const qAround = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          radial,
        );
        const qTilt = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          tilt,
        );

        const q = qParent.clone().multiply(qAround.multiply(qTilt));
        const offset = new THREE.Vector3(0, this.opt.leaves.size * 0.28, 0).applyQuaternion(q);
        const pos = s.origin.clone().add(offset);

        this.leaves.push({ pos, quat: q });
      }
    }
  }

  _rnd(m) { return this.rng.signed(m); }
}

/* --------------------------------- Setup ----------------------------------- */
init();
animate();

function init(){
  container=document.createElement('div'); document.body.appendChild(container);

  scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x000000,0.001);
  camera=new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 4000);
  camera.position.set(0,120,420); scene.add(camera);

  renderer=new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled=true; container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x404040,2));
  sun=new THREE.DirectionalLight(0xffffff,1.5);
  sun.position.set(100,240,160);
  sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.near=0.5; sun.shadow.camera.far=1200;
  sun.shadow.camera.left=-500; sun.shadow.camera.right=500;
  sun.shadow.camera.top=500; sun.shadow.camera.bottom=-500;
  scene.add(sun);

  const ground=new THREE.Mesh(new THREE.PlaneBufferGeometry(2000,2000), new THREE.ShadowMaterial({opacity:0.35}));
  ground.rotation.x=-Math.PI/2; ground.position.y=-150; ground.receiveShadow=true; scene.add(ground);

  const horizon=new THREE.Mesh(
    new THREE.CylinderBufferGeometry(1000,1000,0.5,64),
    new THREE.MeshBasicMaterial({color:0x00ffdd, transparent:true, opacity:0.08})
  );
  horizon.position.y=-150; scene.add(horizon);

  controls=new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=0.05;
  controls.screenSpacePanning=false; controls.minDistance=20; controls.maxDistance=1800;
  controls.maxPolarAngle=Math.PI/2; controls.autoRotate=true; controls.autoRotateSpeed=0.8;

  if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass){
    const rp=new THREE.RenderPass(scene,camera);
    const bp=new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth,window.innerHeight), 1.2, 0.35, 0.8);
    composer=new THREE.EffectComposer(renderer); composer.addPass(rp); composer.addPass(bp);
  } else composer=null;

  generateTree();
  setupControls();
  injectRoundLayerToggles();   // adds round buttons (birds/wind)

  window.addEventListener('resize', onWindowResize, false);
}

/* ---------------------------- Generate & frame ----------------------------- */
function generateTree() {
  if (plant) {
    scene.remove(plant);
    plant.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose?.();
    });
  }

  // Use the 3D procedural tree generation from article
  // L-system rule inputs now control other aspects or can be repurposed
  const gen = new TreeGenerator(options);
  plant = gen.generate();
  scene.add(plant);
  frameObject(plant, { margin: 1.35, lerp: 0.0 });

  if (wind?.pa && !wind.pa.parent) plant.add(wind.pa);
}

function frameObject(obj,{margin=1.25,lerp=0.15}={}){
  const box=new THREE.Box3().setFromObject(obj); if (box.isEmpty()) return;
  const sphere=box.getBoundingSphere(new THREE.Sphere());
  const c=sphere.center, r=Math.max(10,sphere.radius);
  controls.target.lerp(c, lerp||1); controls.update();
  const fov=THREE.MathUtils.degToRad(camera.fov);
  const dist=(r*margin)/Math.sin(fov/2);
  const dir=camera.position.clone().sub(controls.target).normalize();
  const newPos=c.clone().add(dir.multiplyScalar(dist));
  camera.position.lerp(newPos, lerp||1);
  camera.near=Math.max(0.1, dist - r*3); camera.far=dist + r*6; camera.updateProjectionMatrix();
}

/* ---------------------------------- Audio ---------------------------------- */
async function enableAudio() {
  if (STATE.audioEnabled) return;
  if (!listener){
    listener=new THREE.AudioListener();
    camera.add(listener);
    audioCtx=listener.context;
  }
  if (audioCtx.state!=='running') await audioCtx.resume();

  // Wind bus (recreate if missing)
  if (!wind) createWind();

  // Flock
  if (!flock) createFarnellFlock(getBirdsCountFromHUD());

  // Apply current layer states
  setBirdsEnabled(STATE.birdsOn);
  setWindEnabled(STATE.windOn);

  STATE.audioEnabled = true;
}
function suspendAudio(){
  if (!audioCtx) return;
  audioCtx.suspend();
  STATE.audioEnabled=false;
}

/* ------------------------------ Wind builder ------------------------------- */
function createWind(){
  // Pink-ish noise buffer
  const ac = audioCtx;
  const dur = 2.0, rate=ac.sampleRate, len=Math.floor(dur*rate);
  const buffer = ac.createBuffer(1, len, rate);
  const data = buffer.getChannelData(0);
  // Voss-McCartney-ish pink-ish
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i=0;i<len;i++){
    const white = Math.random()*2-1;
    b0 = 0.99886*b0 + white*0.0555179;
    b1 = 0.99332*b1 + white*0.0750759;
    b2 = 0.96900*b2 + white*0.1538520;
    b3 = 0.86650*b3 + white*0.3104856;
    b4 = 0.55000*b4 + white*0.5329522;
    b5 = -0.7616*b5 - white*0.0168980;
    const pink = b0+b1+b2+b3+b4+b5+b6 + white*0.5362;
    b6 = white*0.115926;
    data[i] = pink*0.11;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer; src.loop = true;

  const bpf = ac.createBiquadFilter(); bpf.type='bandpass'; bpf.frequency.value=800; bpf.Q.value=0.6;
  const lpf = ac.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=1400; lpf.Q.value=0.2;

  const gain = ac.createGain(); gain.gain.value = 0.10;

  src.connect(bpf); bpf.connect(lpf); lpf.connect(gain);

  // LFOs for wind swell
  const l1=new OscillatorNode(ac,{frequency:0.07}); const l1g=new GainNode(ac,{gain:0.06});
  const l2=new OscillatorNode(ac,{frequency:0.19}); const l2g=new GainNode(ac,{gain:0.04});
  const l3=new OscillatorNode(ac,{frequency:0.41}); const l3g=new GainNode(ac,{gain:0.02});
  l1.connect(l1g).connect(gain.gain);
  l2.connect(l2g).connect(gain.gain);
  l3.connect(l3g).connect(gain.gain);

  const pa = new THREE.PositionalAudio(listener);
  pa.setRefDistance(28); pa.setRolloffFactor(2.2);
  pa.setNodeSource(gain); // no .play()

  src.start();
  l1.start(); l2.start(); l3.start();

  wind = { src, gain, bpf, lpf, pa };
  if (plant && !pa.parent) plant.add(pa);
}

/* --------------------------- Birds (Farnell flock) ------------------------- */
let flockPointsGeo=null, flockPointsMat=null;

function getBirdsCountFromHUD(){
  const el=document.getElementById('birdsCount'); return el?parseInt(el.value,10):5;
}
function createFarnellFlock(size){
  // visuals cleanup
  if (flockPoints){ scene.remove(flockPoints); flockPointsGeo?.dispose(); flockPointsMat?.dispose(); flockPoints=null; }
  for (const a of birdActors) if (a.pa) a.pa.disconnect();
  birdActors.length = 0;

  // audio
  if (STATE.audioEnabled){
    flock = new Flock(audioCtx, { count:size, preset:'lesser-spotted-grinchwarbler' });
  } else flock = null;

  // visuals
  const verts=[];
  for (let i=0;i<size;i++){
    const x=Math.random()*400-200, y=Math.random()*50+150, z=Math.random()*400-200;
    verts.push(x,y,z);
    const mesh=new THREE.Object3D(); mesh.position.set(x,y,z);

    let pa=null, bird=null;
    if (STATE.audioEnabled){
      pa=new THREE.PositionalAudio(listener); pa.setRefDistance(20); pa.setRolloffFactor(2);
      pa.setNodeSource(flock.birds[i].getOutputNode());
      bird=flock.birds[i];
      // respect birds master state
      bird.getOutputNode().gain.value = STATE.birdsOn ? 1 : 0;
      mesh.add(pa);
    }
    scene.add(mesh);
    birdActors.push({ mesh, pa, bird, phase:Math.random()*Math.PI*2 });
  }
  flockPointsGeo = new THREE.BufferGeometry();
  flockPointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts,3));
  flockPointsMat = new THREE.PointsMaterial({ color:0xffffff, size:2, transparent:true, opacity:0.85 });
  flockPoints = new THREE.Points(flockPointsGeo, flockPointsMat);
  scene.add(flockPoints);
}

function setBirdsEnabled(on){
  STATE.birdsOn = on;
  // update UI dot
  const dot=document.getElementById('toggleBirds'); if (dot) dot.classList.toggle('on', on);
  if (!flock) return;
  for (const a of birdActors) {
    if (a.bird) a.bird.getOutputNode().gain.value = on ? 1 : 0;
  }
}

function setWindEnabled(on){
  STATE.windOn = on;
  const dot=document.getElementById('toggleWind'); if (dot) dot.classList.toggle('on', on);
  if (!wind) return;
  wind.gain.gain.setValueAtTime(on ? 0.10 : 0.0, audioCtx.currentTime);
}

/* --------------------------------- Controls -------------------------------- */
function setupControls(){
  const speed=document.getElementById('speed');
  if (speed){ controls.autoRotateSpeed=parseFloat(speed.value); speed.addEventListener('input',e=>controls.autoRotateSpeed=parseFloat(e.target.value)); }

  const branches=document.getElementById('branches');
  if (branches){ branches.addEventListener('input', e=>{ generateTree(); }); }

  const volume=document.getElementById('volume');
  if (volume){ volume.addEventListener('input', e=>{ const v=parseFloat(e.target.value); if (listener?.gain) listener.gain.gain.setValueAtTime(v, listener.context.currentTime); }); }

  const birdsSlider=document.getElementById('birdsCount');
  if (birdsSlider){ birdsSlider.addEventListener('input', e=>createFarnellFlock(parseInt(e.target.value,10))); }

  // Audio Toggle button: start/resume/suspend entire graph
  const audioBtn=document.getElementById('audioToggle');
  if (audioBtn){
    audioBtn.addEventListener('click', async ()=>{
      try{
        if (!audioCtx || audioCtx.state==='suspended' || !STATE.audioEnabled){
          await enableAudio();
        } else {
          suspendAudio();
        }
      }catch(e){ console.warn('Audio toggle failed:',e); }
    });
  }

  // Rule input - actually use L-system rules
  const ruleInput=document.getElementById('ruleInput');
  const rulePresets=document.getElementById('rulePresets');
  
  if (ruleInput) ruleInput.addEventListener('change', generateTree);
  
  if (rulePresets) {
    rulePresets.addEventListener('change', function(e) {
      ruleInput.value = e.target.value;
      generateTree();
    });
  }

  // Help modal
  const helpModal=document.getElementById('helpModal');
  const helpButton=document.getElementById('helpButton');
  const closeButton=document.querySelector('.close-button');
  const toggleModal=()=>{ if (helpModal) helpModal.classList.toggle('modal-hidden'); };
  if (helpButton) helpButton.addEventListener('click', toggleModal);
  if (closeButton) closeButton.addEventListener('click', toggleModal);

  window.addEventListener('keydown', e=>{
    if (e.key==='?') toggleModal();
    if (e.code==='Space'){ e.preventDefault(); audioBtn?.click(); }
  });
}

/* ----------------------- Inject round layer toggles ------------------------ */
function injectRoundLayerToggles(){
  const ctrls=document.getElementById('controls');
  if (!ctrls) {
    console.warn('Controls element not found for round toggles');
    return;
  }
  const style = document.createElement('style');
  style.textContent = `
  .layer-toggle{ width:24px; height:24px; border-radius:50%; border:2px solid #00ffdd;
    display:inline-flex; align-items:center; justify-content:center; cursor:pointer;
    box-shadow:0 0 8px #00ffdd55; transition:transform .12s ease, background-color .12s ease, box-shadow .12s ease; }
  .layer-toggle.on{ background:#00ffdd; box-shadow:0 0 14px #00ffddaa; }
  .layer-toggle:hover{ transform:scale(1.08); }
  .layer-wrap{ display:flex; align-items:center; gap:8px; }
  .layer-label{ color:#00ffdd; font-family: 'Courier New', monospace; font-size:12px; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className='control-group';
  wrap.innerHTML = `
    <div class="layer-wrap">
      <span class="layer-label">Wind</span>
      <div id="toggleWind" class="layer-toggle ${STATE.windOn?'on':''}" title="Toggle wind"></div>
    </div>
    <div class="layer-wrap">
      <span class="layer-label">Birds</span>
      <div id="toggleBirds" class="layer-toggle ${STATE.birdsOn?'on':''}" title="Toggle birds"></div>
    </div>
  `;
  ctrls.appendChild(wrap);

  // wire events (requires audio running to affect sound; visuals unaffected)
  const windBtn = wrap.querySelector('#toggleWind');
  const birdBtn = wrap.querySelector('#toggleBirds');

  if (windBtn && birdBtn) {
    windBtn.addEventListener('click', async ()=>{
      if (!STATE.audioEnabled) await enableAudio();
      setWindEnabled(!STATE.windOn);
    });
    birdBtn.addEventListener('click', async ()=>{
      if (!STATE.audioEnabled) await enableAudio();
      setBirdsEnabled(!STATE.birdsOn);
    });
  } else {
    console.warn('Round toggle buttons not found');
  }
}

/* -------------------------------- Animation -------------------------------- */
function onWindowResize(){
  camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer?.setSize) composer.setSize(window.innerWidth, window.innerHeight);
  if (plant) frameObject(plant, { margin:1.35, lerp:0.35 });
}

function animate(){ requestAnimationFrame(animate); render(); }

function render(){
  const t=Date.now()*0.00015;
  sun.position.x=Math.sin(t)*260; sun.position.z=Math.cos(t)*260;

  animateFlock();

  controls?.update?.();
  if (composer) composer.render(); else renderer.render(scene,camera);
}

function animateFlock(){
  if (!flockPoints) return;
  const pos=flockPoints.geometry.attributes.position.array;
  const time=Date.now()*0.0005;

  for (let i=0;i<birdActors.length;i++){
    const a=birdActors[i]; const i3=i*3; const R=180+i*12;
    pos[i3]  = Math.cos(time + a.phase) * R;
    pos[i3+1]= 150 + Math.sin(time*0.7 + a.phase) * 22;
    pos[i3+2]= Math.sin(time + a.phase) * R;
    a.mesh.position.set(pos[i3], pos[i3+1], pos[i3+2]);

    // randomized chorus
    if (STATE.audioEnabled && audioCtx.state==='running' && Math.random()>0.995 && flock){
      flock.chirp();
    }
  }
  flockPoints.geometry.attributes.position.needsUpdate = true;
}
