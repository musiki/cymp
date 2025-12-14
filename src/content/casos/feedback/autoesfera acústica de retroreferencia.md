
```dataviewjs
(() => {
  const KEY="__EAES1";
  window[KEY] = { alive:true };

  // --------- Helpers ---------
  const loadScript = (src)=>new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=()=>rej(new Error("load fail: "+src)); document.head.appendChild(s); });
  const ensureThree = async () => {
    if (!window.THREE) await loadScript("https://unpkg.com/three@0.147.0/build/three.min.js");
  };
  const ensurePost = async () => {
    if (!THREE.CopyShader) await loadScript("https://unpkg.com/three@0.147.0/examples/js/shaders/CopyShader.js");
    if (!THREE.LuminosityHighPassShader) await loadScript("https://unpkg.com/three@0.147.0/examples/js/shaders/LuminosityHighPassShader.js");
    if (!THREE.ShaderPass) await loadScript("https://unpkg.com/three@0.147.0/examples/js/postprocessing/ShaderPass.js");
    if (!THREE.EffectComposer) await loadScript("https://unpkg.com/three@0.147.0/examples/js/postprocessing/EffectComposer.js");
    if (!THREE.RenderPass)     await loadScript("https://unpkg.com/three@0.147.0/examples/js/postprocessing/RenderPass.js");
    if (!THREE.UnrealBloomPass)await loadScript("https://unpkg.com/three@0.147.0/examples/js/postprocessing/UnrealBloomPass.js");
  };
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const lerp=(a,b,t)=>a+(b-a)*t;

  // --------- UI ---------
  const root = this.container;
  root.innerHTML = ""; // clear previous content
  root.style.height="660px";
  root.style.display="grid";
  root.style.gridTemplateRows="1fr auto";
  root.style.gap="8px";

  const view=document.createElement("div");
  Object.assign(view.style,{position:"relative",minHeight:"500px",borderRadius:"12px",overflow:"hidden"});
  root.appendChild(view);

  const ui=document.createElement("div");
  Object.assign(ui.style,{display:"grid",gridTemplateColumns:"minmax(160px,1fr) 180px 180px 180px auto auto auto",gap:"10px",alignItems:"center"});
  root.appendChild(ui);

  const labelWrap=(txt,input,extra=null)=>{ const w=document.createElement("div");
    Object.assign(w.style,{display:"grid",gridTemplateRows:"auto auto auto",gap:"6px"});
    const lab=document.createElement("span"); lab.textContent=txt; lab.style.fontSize="12px"; lab.style.opacity="0.8";
    w.appendChild(lab); w.appendChild(input); if(extra) w.appendChild(extra); return w; };

  const knob=document.createElement("input"); Object.assign(knob,{type:"range",min:"0",max:"1",step:"0.001",value:"0.5"}); knob.style.width="100%"; // distancia
  const oscVol=document.createElement("input"); Object.assign(oscVol,{type:"range",min:"0",max:"1",step:"0.01",value:"0.25"}); oscVol.style.width="100%";
  const micVol=document.createElement("input"); Object.assign(micVol,{type:"range",min:"0",max:"1",step:"0.01",value:"0.10"}); micVol.style.width="100%";
  const micMeter=document.createElement("div"); Object.assign(micMeter.style,{height:"1px",background:"rgba(255,255,255,0.25)",position:"relative",overflow:"hidden"});
  const micBar=document.createElement("div"); Object.assign(micBar.style,{height:"100%",width:"0%",background:"#4caf50"}); micMeter.appendChild(micBar);
  const outVol=document.createElement("input"); Object.assign(outVol,{type:"range",min:"0",max:"1",step:"0.01",value:"0.18"}); outVol.style.width="100%";

  const startBtn=document.createElement("button"); startBtn.textContent="Start";
  const stopBtn=document.createElement("button"); stopBtn.textContent="Stop";
  const reseedBtn=document.createElement("button"); reseedBtn.textContent="Reseed";

  ui.appendChild(labelWrap("Distance", knob));
  ui.appendChild(labelWrap("Osc Vol",oscVol));
  ui.appendChild(labelWrap("Mic In",micVol,micMeter));
  ui.appendChild(labelWrap("Master Out",outVol));
  ui.appendChild(startBtn); ui.appendChild(stopBtn); ui.appendChild(reseedBtn);

  const status=document.createElement("div");
  status.textContent="loading…";
  Object.assign(status.style,{position:"absolute",right:"8px",top:"8px",padding:"4px 8px",background:"rgba(0,0,0,0.45)",color:"#fff",fontSize:"12px",borderRadius:"8px"});
  view.appendChild(status);

  // --------- Audio ---------
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx=null, meterRAF=0, pitchRAF=0;
  let simOsc=null, simNoise=null, simGain=null, noiseGain=null, shaper=null;
  let micSrc=null, micGain=null, hp=null, analyser=null, pitchAnalyser=null;
  let preBus=null, convolver=null, dryGain=null, wetGain=null;
  let panner=null, comp=null, master=null;

  function detectFundamental(buf, sr) {
    const SIZE=buf.length; let mean=0, rms=0;
    for (let i=0;i<SIZE;i++) mean+=buf[i]; mean/=SIZE;
    const x=new Float32Array(SIZE); for(let i=0;i<SIZE;i++){ const v=buf[i]-mean; x[i]=v; rms+=v*v; }
    rms=Math.sqrt(rms/SIZE); if (rms<0.008) return null;
    const MAX=Math.floor(SIZE/2); const c=new Float32Array(MAX);
    let best=-1, bestCorr=0;
    for (let off=8; off<MAX; off++){ let corr=0; for (let i=0;i<MAX;i++) corr+=x[i]*x[i+off]; c[off]=corr; if (corr>bestCorr){ bestCorr=corr; best=off; } }
    if (best<0) return null;
    const shift=(c[best+1]-c[best-1])/(2*(2*c[best]-c[best-1]-c[best+1])||1);
    const period=best+shift; const f=sr/period; return (f<40||f>2000)?null:f;
  }

  const makeImpulse=(secs=1.6,decay=2.7)=>{ const len=Math.max(1,Math.floor((ctx?.sampleRate||48000)*secs)); const buf=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); } return buf; };

  async function setupAudio(){
    if (ctx) return;
    ctx = new AudioCtx();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      micSrc = ctx.createMediaStreamSource(stream); status.textContent="mic ok";
    } catch(e){ status.textContent="mic blocked"; console.warn(e); }

    preBus=ctx.createGain(); preBus.gain.value=1.0;
    dryGain=ctx.createGain(); dryGain.gain.value=1.0;
    wetGain=ctx.createGain(); wetGain.gain.value=0.25;
    convolver=ctx.createConvolver(); convolver.buffer=makeImpulse(1.5,2.6);
    panner=ctx.createStereoPanner(); panner.pan.value=0;
    comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.knee.value=12; comp.ratio.value=10; comp.attack.value=0.003; comp.release.value=0.25;
    master=ctx.createGain(); master.gain.value=parseFloat(outVol.value);

    simGain=ctx.createGain(); simGain.gain.value=parseFloat(oscVol.value)*0.4;
    shaper=ctx.createWaveShaper();
    const mkCurve=(k=0)=>{ const n=44100, curve=new Float32Array(n), amt=lerp(1,150,k),deg=Math.PI/180;
      for(let i=0;i<n;i++){ let x=(i/(n-1))*2-1; curve[i]=(3+amt)*x*20*deg/(Math.PI+amt*Math.abs(x)); } return curve; };
    shaper.curve=mkCurve(0);

    simOsc=ctx.createOscillator(); simOsc.type="sawtooth"; simOsc.frequency.value=440;
    simNoise=ctx.createBufferSource(); const nbuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
    const nd=nbuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1; simNoise.buffer=nbuf; simNoise.loop=true;
    noiseGain=ctx.createGain(); noiseGain.gain.value=0.0;

    micGain=ctx.createGain(); micGain.gain.value=parseFloat(micVol.value);
    hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=120; hp.Q.value=0.7;
    analyser=ctx.createAnalyser(); analyser.fftSize=1024;
    pitchAnalyser=ctx.createAnalyser(); pitchAnalyser.fftSize=2048;
    const meterData=new Float32Array(analyser.fftSize);
    const pitchData=new Float32Array(pitchAnalyser.fftSize);

    if (micSrc){ micSrc.connect(micGain); micGain.connect(hp); hp.connect(analyser); hp.connect(pitchAnalyser); hp.connect(preBus); }

    simOsc.connect(shaper);
    simNoise.connect(noiseGain); noiseGain.connect(shaper);
    shaper.connect(simGain);
    simGain.connect(preBus);

    preBus.connect(dryGain); preBus.connect(convolver); convolver.connect(wetGain);
    dryGain.connect(panner); wetGain.connect(panner); panner.connect(comp); comp.connect(master); master.connect(ctx.destination);

    simOsc.start(); simNoise.start();

    // meter
    const updMeter=()=>{ meterRAF=requestAnimationFrame(updMeter); if(!analyser) return;
      analyser.getFloatTimeDomainData(meterData); let sum=0; for(let i=0;i<meterData.length;i++){ const v=meterData[i]; sum+=v*v; }
      const rms=Math.sqrt(sum/meterData.length); micBar.style.width=(clamp(rms*3.2,0,1)*100).toFixed(1)+"%"; }; updMeter();

    // pitch follower → linear ramp 1s
    const updPitch=()=>{ pitchRAF=requestAnimationFrame(updPitch); if(!pitchAnalyser||!ctx||!simOsc) return;
      pitchAnalyser.getFloatTimeDomainData(pitchData); const f=detectFundamental(pitchData, ctx.sampleRate);
      if (f){ const target=clamp(f,40,2000); const now=ctx.currentTime; simOsc.frequency.cancelScheduledValues(now); simOsc.frequency.linearRampToValueAtTime(target, now+1.0); }
    }; updPitch();
  }

  function teardownAudio(){
    try{ simOsc?.stop(); }catch(_){}
    try{ simNoise?.stop(); }catch(_){}
    [simOsc,simNoise,simGain,noiseGain,shaper,micSrc,micGain,hp,analyser,pitchAnalyser,preBus,convolver,dryGain,wetGain,panner,comp,master]
      .filter(n=>n).forEach(n=>{ try{ n.disconnect(); }catch(_){ } });
    simOsc=simNoise=simGain=noiseGain=shaper=micSrc=micGain=hp=analyser=pitchAnalyser=preBus=convolver=dryGain=wetGain=panner=comp=master=null;
    if (meterRAF) cancelAnimationFrame(meterRAF), meterRAF=0;
    if (pitchRAF) cancelAnimationFrame(pitchRAF), pitchRAF=0;
  }

  // --------- Three + post ---------
  let renderer=null, scene=null, camera=null, raf=0, ro=null;
  let composer=null, renderPass=null, bloomPass=null;
  let micCube=null, speakerCone=null, line=null, hull=null, shell=null, targetVec=null;

  // base Z del parlante para vibración
  let speakerBaseZ = 0.15 + 0.5*1.55;

  const disposeThree=()=>{ if(raf) cancelAnimationFrame(raf), raf=0; if(ro){ try{ro.disconnect();}catch(_){ } ro=null; }
    if (renderer){ try{renderer.domElement?.parentNode?.removeChild(renderer.domElement);}catch(_){}
      try{renderer.dispose(); renderer.forceContextLoss?.();}catch(_){ } }
    renderer=scene=camera=composer=renderPass=bloomPass=micCube=speakerCone=line=hull=shell=targetVec=null;
  };

  const sizeRendererToView=()=>{ if(!renderer||!camera) return; const w=Math.max(1,view.clientWidth), h=Math.max(1,view.clientHeight);
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); composer?.setSize(w,h); };

  const orbit={radius:4.5,theta:0.3,phi:0.6,minRadius:2.2,maxRadius:12.0,vtheta:0,vphi:0,rotateSpeed:0.008,damping:0.9,panX:0,panY:0,panSpeed:0.005};
  const applyOrbit=()=>{ if(!camera||!targetVec) return; const p=clamp(orbit.phi,0.01,Math.PI-0.01);
    const x=orbit.panX+orbit.radius*Math.sin(p)*Math.sin(orbit.theta);
    const y=orbit.panY+orbit.radius*Math.cos(p);
    const z=orbit.radius*Math.sin(p)*Math.cos(orbit.theta);
    camera.position.set(x,y,z); camera.lookAt(targetVec); };

  const enableOrbitControls=(canvas)=>{ let dragging=false,lastX=0,lastY=0;
    const end=(e)=>{ dragging=false; try{canvas.releasePointerCapture(e.pointerId);}catch(_){ } };
    canvas.addEventListener("pointerdown",(e)=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointerup",end); canvas.addEventListener("pointerleave",end);
    canvas.addEventListener("pointermove",(e)=>{ if(!dragging) return; const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY;
      if (e.shiftKey){ orbit.panX -= dx*orbit.panSpeed*(orbit.radius*0.1); orbit.panY += dy*orbit.panSpeed*(orbit.radius*0.1); }
      else { orbit.vtheta += dx*orbit.rotateSpeed; orbit.vphi += dy*orbit.rotateSpeed; }});
    canvas.addEventListener("wheel",(e)=>{ e.preventDefault(); const s=Math.exp(-e.deltaY*0.001);
      orbit.radius=clamp(orbit.radius*s,orbit.minRadius,orbit.maxRadius); }, {passive:false});
  };

  async function setupThree(){
    await ensureThree(); await ensurePost();
    if (renderer) return;

    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    Object.assign(renderer.domElement.style,{width:"100%",height:"100%"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    view.appendChild(renderer.domElement);

    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(45,1,0.1,1000);
    targetVec=new THREE.Vector3(0,0,0);

    // Esfera (wireframe + shell semi-transparente para reflejos/sombras)
    const hullGeo=new THREE.SphereGeometry(1.5, 48, 48);
    const hullMat=new THREE.MeshBasicMaterial({color:0x88aaff, wireframe:true, transparent:true, opacity:0.15});
    hull=new THREE.Mesh(hullGeo,hullMat); hull.name="wire"; scene.add(hull);

    const shellGeo=new THREE.SphereGeometry(1.48, 48, 48);
    const shellMat=new THREE.MeshStandardMaterial({color:0x99bbff, roughness:0.35, metalness:0.25, transparent:true, opacity:0.28});
    shell=new THREE.Mesh(shellGeo,shellMat); shell.receiveShadow=true; scene.add(shell);

    // Mic (cubo)
    const micGeo=new THREE.BoxGeometry(0.12,0.12,0.12);
    const micStd=new THREE.MeshStandardMaterial({color:0xff5555, roughness:0.6, metalness:0.2});
    micCube=new THREE.Mesh(micGeo,micStd); micCube.castShadow=true; micCube.receiveShadow=true; scene.add(micCube);

    // Speaker (cono) mirando al mic
    const spkGeo=new THREE.ConeGeometry(0.16,0.28,48);
    const spkStd=new THREE.MeshStandardMaterial({color:0x55ffaa, roughness:0.4, metalness:0.35});
    speakerCone=new THREE.Mesh(spkGeo,spkStd);
    speakerCone.rotation.x=Math.PI/2; speakerCone.rotation.z=Math.PI;
    speakerCone.castShadow=true; speakerCone.receiveShadow=true;
    speakerCone.position.set(0,0,speakerBaseZ); scene.add(speakerCone);

    // Línea interfaz
    const lineMat=new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0.85});
    const lineGeo=new THREE.BufferGeometry().setFromPoints([micCube.position.clone(), speakerCone.position.clone()]);
    line=new THREE.Line(lineGeo,lineMat); scene.add(line);

    // Luces con sombras
    const hemi=new THREE.HemisphereLight(0x7aa7ff, 0x101018, 0.55); scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2.5,3.5,4.0); key.castShadow=true;
    key.shadow.mapSize.set(1024,1024); key.shadow.camera.near=0.5; key.shadow.camera.far=20;
    scene.add(key);
    const fill=new THREE.PointLight(0x88aaff, 0.3); fill.position.set(-2.2,-1.5,2.8); scene.add(fill);

    // Post: Bloom
    composer=new THREE.EffectComposer(renderer);
    renderPass=new THREE.RenderPass(scene, camera); composer.addPass(renderPass);
    bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(view.clientWidth||1, view.clientHeight||1), 0.8, 0.6, 0.85);
    composer.addPass(bloomPass);

    const trySize=()=>{ sizeRendererToView(); if((view.clientWidth|0)===0||(view.clientHeight|0)===0) requestAnimationFrame(trySize); }; trySize();
    ro=new ResizeObserver(sizeRendererToView); ro.observe(view);

    enableOrbitControls(renderer.domElement); applyOrbit();

    // Animación
    const loop=()=>{ raf=requestAnimationFrame(loop); if(!renderer||!scene||!camera) return;

      // Suavizado de órbita
      orbit.theta+=orbit.vtheta; orbit.vtheta*=orbit.damping;
      orbit.phi  +=orbit.vphi;   orbit.vphi  *=orbit.damping;
      orbit.phi=clamp(orbit.phi,0.001,Math.PI-0.001);
      applyOrbit();

      // Rotación de la esfera → paneo L/R (360° ↦ [-1,1] vía seno)
      hull.rotation.y += 0.004;                 // animación base
      shell.rotation.y = hull.rotation.y;       // sigue a hull
      // mapea a pan (suave y periódico)
      if (panner) panner.pan.value = Math.sin(hull.rotation.y);

      // Vibración del cono según frecuencia (fase de audio)
      let energy = 0.5; // default si aún no hay audio
      if (speakerCone){
        const distNorm = clamp((speakerBaseZ-0.15)/1.55, 0, 1);
        energy = 1 - distNorm; // 0..1
        const f = (simOsc?.frequency?.value)||440;
        const t = (window.__audioTimeHook?.() ?? 0); // hook o fallback
        const amp = 0.008 + 0.022*energy;           // amplitud por energía
        const vib = Math.sin(2*Math.PI*f*t) * amp;  // señal
        speakerCone.position.z = speakerBaseZ - vib; // hacia el mic (−Z)
        // visual feedback: escala del cono + opacidad de línea
        const s = lerp(1.0, 1.35, energy); speakerCone.scale.set(s,s,s);
        line.material.opacity = lerp(0.35, 1.0, energy);
        line.geometry.setFromPoints([micCube.position, speakerCone.position]);
      }

      composer.render();
    };
    loop();

    status.textContent="ready";
  }

  // ---------- Interaction mapping ----------
  function applyDistance(dist){
    speakerBaseZ = 0.15 + dist * 1.55; // base (la vibración se suma en el loop)

    const energy = clamp(1 - dist, 0, 1);
    if (ctx && simGain && noiseGain && dryGain && wetGain && convolver && simOsc && shaper){
      const base = 0.06 + energy * 0.44;   // densidad/vol
      const n    = 0.01 + energy * 0.35;   // ruido
      const wet  = 0.18 + (1-energy) * 0.35;
      const dry  = 1.0 - wet * 0.6;

      const user = parseFloat(oscVol.value);
      simGain.gain.value = user * base;
      noiseGain.gain.value = n;
      wetGain.gain.value = wet; dryGain.gain.value = dry;

      // distorsión (waveshaper) por energía
      const drive = energy;
      const npts=44100, curve=new Float32Array(npts), amt=lerp(1,150,drive),deg=Math.PI/180;
      for(let i=0;i<npts;i++){ let x=(i/(npts-1))*2-1; curve[i]=(3+amt)*x*20*deg/(Math.PI+amt*Math.abs(x)); }
      shaper.curve = curve;

      status.textContent = `energy=${energy.toFixed(2)} osc=${simGain.gain.value.toFixed(2)} n=${n.toFixed(2)} wet=${wet.toFixed(2)}`;
    } else {
      status.textContent = `energy=${energy.toFixed(2)} (audio off)`;
    }
  }

  // --------- Sliders ---------
  oscVol.addEventListener("input", ()=> applyDistance(parseFloat(knob.value)));
  micVol.addEventListener("input", (e)=>{ if(micGain) micGain.gain.value=parseFloat(e.target.value); });
  outVol.addEventListener("input", (e)=>{ if(master) master.gain.value=parseFloat(e.target.value); });
  knob.addEventListener("input", (e)=> applyDistance(parseFloat(e.target.value)));

  // --------- Wire-up ---------
  let seeded=false;
  const start=async()=>{ await setupThree(); await setupAudio(); if (ctx?.state==="suspended"){ try{ await ctx.resume(); }catch(_){ } }
    // hook para vibración con tiempo real de audio
    window.__audioTimeHook = ()=> ctx?.currentTime ?? performance.now()/1000;
    if(!seeded){ knob.value="0.5"; seeded=true; }
    applyDistance(parseFloat(knob.value));
    status.textContent="running";
  };
  const stop=()=>{ teardownAudio(); disposeThree(); status.textContent="stopped"; };
  const reseed=()=>{ knob.value=(Math.random()).toFixed(3); applyDistance(parseFloat(knob.value)); status.textContent="reseed"; };

  startBtn.addEventListener("click", start);
  stopBtn .addEventListener("click", stop);
  reseedBtn.addEventListener("click", reseed);

  (async()=>{ await setupThree(); applyDistance(parseFloat(knob.value)); })();

  const obs=new MutationObserver(()=>{ if(!document.body.contains(view)){ stop(); obs.disconnect(); window[KEY].alive=false; } });
  obs.observe(document.body,{childList:true,subtree:true});
})();
```



una esfera de vidrio sellada que funciona como un “laboratorio mínimo” de sonido. Dentro hay dos objetos: un micrófono fijo y un parlante que puede acercarse o alejarse del micrófono en línea recta sobre el eje Z. El interactor sólo controla la distancia entre parlante y micrófono.  Cuando la distancia disminuye, la señal del micrófono vuelve a entrar al parlante y el sistema se autoalimenta: aumenta la energía del feedback, aparece distorsión y la textura se vuelve densa; cuando la distancia crece, el sistema “respira”, pierde energía y retorna a un estado más estable y transparente.

La esfera actúa como entorno resonante. Su rotación alrededor del eje Y se mapea directamente a la panorámica (L/R), de modo que la orientación espacial se oye como desplazamiento de la imagen sonora. Además, un oscilador interno sigue con una rampa lineal de 1000 ms el tono fundamental detectado en el micrófono. Este oscilador no compite: refuerza las frecuencias que emergen del propio espacio, haciendo audible la forma acústica de la cavidad.

El material ($\mat_p$) es el vidrio; los objetos ($\obj_i$) son micrófono y parlante; el agente ($\agn_h$) es quien mueve la distancia; la interfaz ($\itf$) es el acoplamiento electroacústico y espacial; y el entorno ($\odot$) es la esfera como mundo local. Con estos elementos definimos reglas simples: 

1. menor distancia ⇒ mayor energía de retroalimentación; 
2. rotación Y ⇒ paneo L/R; 
3. fundamental detectada ⇒ frecuencia objetivo del oscilador con rampa. 

## Descripción axiomática

Una sola esfera de vidrio sellada contiene una interfaz acústica de realimentación:%\obj_i%micrófono fijo y%\obj_i%parlante móvil sobre el eje%Z$. El agente interactor controla la distancia%d\in[d_{\min},d_{\max}]%como único parámetro. La regla local: menor%d%⇒ mayor energía de feedback (ganancia, distorsión, densidad). La esfera rota en%Y%y esa rotación mapea el paneo L/R. Un oscilador%\obj_s%sigue (con rampa de 1000 ms) el fundamental detectado de la entrada de mic, reforzando la cavidad. MOAIE:%\mat_p%(vidrio),%\obj_i%(micro/parlante),%\agn_h%(interactor),%\itf%(acoplos audio-espaciales),%\odot%(entorno-esfera).

## Fórmula de escritura icónica

$$
\newcommand{\mat}{\blacksquare}
\newcommand{\obj}{\blacklozenge}
\newcommand{\agn}{\bullet}
\newcommand{\itf}{\leftrightarrow}
\newcommand{\ent}[1]{\boxed{#1}}
$$

Fórmula simple (con límites del parámetro de interacción):
$$
\big(\obj_i^{\text{spk}} \mid d\in[d_{\min},d_{\max}]\big)\ \times\ \obj_i^{\text{mic}}
\ \rightarrow\
\Psi_{\text{fb}}(d),\quad
d_{\min}=0.05\ \text{m},\ d_{\max}=0.50\ \text{m}
$$

Fórmula compuesta (con paneo y refuerzo tonal):
$$
\Big[
(\obj_i^{\text{spk}} \times \obj_i^{\text{mic}})\ \cap\
\big(\square\square_{\text{esfera}}\ \itf\ \tau_{\text{rotY}}\big)
\Big]
\ \oplus\
\Big(
\Psi_{\text{fundamental}}^{\text{mic}}\ \rightsquigarrow\ \obj_s^{\text{osc}}{\text{rampa }1000\text{ms}}
\Big)
\ \mapsto\
\Psi{\text{fb}}(d,\tau_{\text{rotY}})
$$



## Serie

1.	Distancia normalizada:
$\delta = \frac{d - d_{\min}}{d_{\max} - d_{\min}} \in [0,1]$
Escala la distancia a 0 (cerca)–1 (lejos).
2.	Energía de feedback:
$E = 1 - \delta$
Más cerca → mayor energía.
3.	Ganancia efectiva del lazo:
$G = G_0 , E$
La ganancia base$G_0$se modula por la energía.
4.	Densidad o ruido agregado:
$\eta = \eta_0 + \eta_1 E$
El ruido crece con la proximidad.
5.	Reverberancia percibida:
$W = W_0 + W_1 (1 - E)$
Más lejos → más reverberación (menos acoplo directo).
6.	Distorsión (drive del waveshaper):
$D = D_0 + D_1 E$
La no linealidad aumenta al acercar.
7.	Paneo por rotación-Y:
$\text{pan} = \sin(\theta_Y) \in [-1,1]$
La orientación espacial se traduce en paneo L/R.
8.	Seguimiento del fundamental (detección):
$f_{\text{mic}} = \text{ACF}(x)$
Autocorrelación estima la frecuencia dominante del mic.
9.	Rampa del oscilador (1000 ms):
$f_{\text{osc}}(t) = \text{linramp}(f_{\text{osc}}(t_0), f_{\text{mic}}, 1,\text{s})$
Transición lineal en 1000 ms.
10.	Nivel del oscilador:
$A_{\text{osc}} = U (\alpha_0 + \alpha_1 E)$
Control del usuario$U$escalado por energía.
11.	Respuesta del entorno (cavidad):
$H(z) = \prod_k \frac{1}{1 - a_k z^{-1}}$
Modelo IIR simplificado de modos internos.
12.	Salida del parlante:
$Y(z) = H(z)\big(G X(z) + A_{\text{osc}} O(z) + \eta N(z)\big)$
Suma de mic, oscilador y ruido a través de la cavidad.
13.	Entrada del micrófono (retardo):
$X(z) = z^{-m} Y(z)$
Retardo$m$por tiempo de vuelo en la esfera.
14.	Cierre del lazo:
$X(z) = \frac{z^{-m} H(z)}{1 - G z^{-m} H(z)} \big(A_{\text{osc}} O(z) + \eta N(z)\big)$
Condición de realimentación cerrada.
15.	Estabilidad (criterio de aullido):
$|G H(e^{j\omega})| < 1$
Si se supera, aparecen picos auto-sostenidos.
16.	Amplitud esperada en el pico$\omega_0$:
$|Y(e^{j\omega_0})| \approx \frac{|A_{\text{osc}} O + \eta N|}{|1 - G H|}$
Pequeñas entradas se magnifican cerca del umbral.
17.	Mapeo de parámetros de síntesis:
${G, \eta, D, W} = \phi(E), \quad \phi \text{ monótona en } E$
Curva fija que relaciona energía con control sonoro.
18.	Vibración del cono (posición Z):
$z_{\text{spk}}(t) = z_0 - \text{amp}(E) \sin(2\pi f_{\text{osc}} t)$
El cono “late” al tono seguido; amplitud crece con$E$.
19.	Estimador RMS del mic (VU):
$\text{RMS} = \sqrt{\frac{1}{T} \int_{t}^{t+T} x^2(\tau), d\tau}$
Energía instantánea para mostrar nivel.
20.	Retro-referencia (meta):
$\Psi_{\text{fb}} = \text{Fix}\big(\mathcal{F}[d, \theta_Y, f_{\text{mic}}]\big)$
El sonido es un punto fijo del sistema: lo que entra vuelve transformado y retorna, cerrando la identidad audible.



```bibtex
@inproceedings{DiScipio2003AudibleEcosystemics,
  author = {Di Scipio, Agostino},
  title = {‘Audible Ecosystemics’: Feedback, Filters, Microphones, Speakers},
  booktitle = {Proc. ICMC},
  year = {2003}
}
@article{Basanta2013TheSoundOfFeedback,
  author = {Basanta, Adam},
  title = {The Sound of Feedback: Self-generating Systems in Sound Art},
  journal = {Organised Sound},
  year = {2013}
}
@article{Varela1974SelfReference,
  author = {Varela, Francisco J.},
  title = {A Calculus for Self-Reference},
  journal = {International Journal of General Systems},
  year = {1974}
}
```
