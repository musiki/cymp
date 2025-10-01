---
type: person
img: https://i.imgur.com/Lf0Cvvi.png
tags:
  - pioneer
  - generative
born in city:
year: 1938
dead year:
city: Pforzheim
country:
connect:
url: https://www.emohr.com/
died in city: Chesapeake Bay
---

https://www.youtube.com/watch?v=lfdMnFvXBwc

Con Manfred Mohr (1938, Pforzheim) ha aceptado la invitación un artista que a finales de los años sesenta abandonó la pintura tradicional para investigar la esencia del proceso creativo mediante el ordenador y llegar así a nuevas y complejas formas.

Manfred Mohr es uno de los pioneros más conocidos del arte digital, que hizo historia con la exposición individual «Computer Graphics. Une ésthétique programmée» en el Musée d'Art Moderne de la Ville de Paris en la primavera de 1971.

Cuando Mohr decidió en 1969 cambiar el pincel y el lienzo por el ordenador y el plotter, los artistas y críticos de arte reaccionaron con asombro. Aunque desde la década de 1950 se había informado mucho en la prensa sobre la nueva tecnología, el ordenador estaba lejos de ser un medio  familiar para el público. ¿Por qué un pintor que se había establecido con éxito en el mundo artístico parisino iba a dejarlo todo para explorar las posibilidades de esta tecnología para las artes?

La conversación se centra en el recorrido del artista desde sus inicios tachistas en su época de estudiante, pasando por la pintura hard-edge, hasta llegar al arte generativo. ¿Cómo le influyó el pintor K. R. H. Sonderborg? ¿Cuál fue el papel del filósofo Max Bense, que promovió un arte racional de «existencia técnica», o del compositor Pierre Barbaud, uno de los pioneros de la composición generada por ordenador en Francia? La obra de Manfred Mohr invita a una conversación sobre el jazz, la música serial, la estética de la información, las imágenes técnicas, la meteorología, la n-dimensionalidad y la fascinación del pensamiento generativo.


```dataviewjs
async () => {
  const W= Math.min(window.innerWidth*0.9, 680), H = W*0.66;
  const wrap=this.container.createEl('div'); wrap.style.margin='8px 0';
  const ui=this.container.createEl('div'); ui.style.marginBottom='6px'; ui.style.display='flex'; ui.style.gap='8px'; ui.style.alignItems='center';

  function mkSlider(min,max,val,step=1,label=''){
    const s=wrap.createEl('input');
    s.type='range'; s.min=min; s.max=max; s.step=step; s.value=val; s.style.width='160px';
    const l=wrap.createEl('span',{text:`${label}${val}`});
    l.style.fontFamily='ui-monospace'; l.style.marginLeft='6px';
    return {s,l};
  }

  const {s:ang,l:lAng}=mkSlider(0,360,25,1,'áng°=');
  const {s:mask,l:lMask}=mkSlider(0,255,85,1,'máscara=');
  const {s:scale,l:lScale}=mkSlider(40,160,120,1,'escala=');
  ui.append(ang,lAng,mask,lMask,scale,lScale);

  const c=this.container.createEl('canvas'); c.width=W; c.height=H;
  c.style.background='#fff'; c.style.boxShadow='0 0 0 1px #0002 inset';
  this.container.append(ui,c);

  function rot(v,a){
    const ca=Math.cos(a), sa=Math.sin(a);
    let [x,y,z]=v; let x1= x*ca - y*sa, y1= x*sa + y*ca, z1=z;
    const cb=Math.cos(a*0.7), sb=Math.sin(a*0.7);
    let x2= x1*cb - z1*sb, z2= x1*sb + z1*cb;
    return [x2,y1,z2];
  }
  function proj([x,y,z], s){ const p=1/(1+0.8*z); return [W/2 + s*x*p, H/2 + s*y*p]; }

  const verts=[]; for(let i=0;i<8;i++){ verts.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1 ]); }
  const edges=[]; for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
    const d=((i^j).toString(2).match(/1/g)||[]).length;
    if(d===1) edges.push([i,j]);
  }

  const ctx=c.getContext('2d');
  function draw(){
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#111'; ctx.lineWidth=1;
    const a=ang.value*Math.PI/180, s=+scale.value, m=+mask.value;
    const V=verts.map(v=>rot(v,a));
    const Z=V.map(v=>v[2]); const order=[...Array(8).keys()].sort((i,j)=>Z[i]-Z[j]);
    for(const [i,j] of edges){
      const bit=((i^j)&m);
      if((bit.toString(2).match(/1/g)||[]).length%2===1){
        const p1=proj(V[i],s), p2=proj(V[j],s);
        ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
      }
    }
    lAng.textContent='áng°='+ang.value;
    lMask.textContent='máscara='+mask.value;
    lScale.textContent='escala='+scale.value;
  }
  [ang,mask,scale].forEach(s=>s.oninput=draw); draw();
}
```



## cubo rotado con regla binaria de aristas

```dataviewjs
(async () => {
  const W= Math.min(window.innerWidth*0.9, 680), H = W*0.66;
  const wrap=this.container.createEl('div'); wrap.style.margin='8px 0';
  const ui=this.container.createEl('div'); ui.style.marginBottom='6px'; ui.style.display='flex'; ui.style.gap='8px'; ui.style.alignItems='center';

  function mkSlider(min,max,val,step=1,label=''){
    const s=wrap.createEl('input');
    s.type='range'; s.min=min; s.max=max; s.step=step; s.value=val; s.style.width='160px';
    const l=wrap.createEl('span',{text:`${label}${val}`});
    l.style.fontFamily='ui-monospace'; l.style.marginLeft='6px';
    return {s,l};
  }

  const {s:ang,l:lAng}=mkSlider(0,360,25,1,'áng°=');
  const {s:mask,l:lMask}=mkSlider(0,255,85,1,'máscara=');
  const {s:scale,l:lScale}=mkSlider(40,160,120,1,'escala=');
  ui.append(ang,lAng,mask,lMask,scale,lScale);

  const c=this.container.createEl('canvas'); c.width=W; c.height=H;
  c.style.background='#fff'; c.style.boxShadow='0 0 0 1px #0002 inset';
  this.container.append(ui,c);

  function rot(v,a){
    const ca=Math.cos(a), sa=Math.sin(a);
    let [x,y,z]=v; let x1= x*ca - y*sa, y1= x*sa + y*ca, z1=z;
    const cb=Math.cos(a*0.7), sb=Math.sin(a*0.7);
    let x2= x1*cb - z1*sb, z2= x1*sb + z1*cb;
    return [x2,y1,z2];
  }
  function proj([x,y,z], s){ const p=1/(1+0.8*z); return [W/2 + s*x*p, H/2 + s*y*p]; }

  const verts=[]; for(let i=0;i<8;i++){ verts.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1 ]); }
  const edges=[]; for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
    const d=((i^j).toString(2).match(/1/g)||[]).length;
    if(d===1) edges.push([i,j]);
  }

  const ctx=c.getContext('2d');
  function draw(){
    ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#111'; ctx.lineWidth=1;
    const a=ang.value*Math.PI/180, s=+scale.value, m=+mask.value;
    const V=verts.map(v=>rot(v,a));
    for(const [i,j] of edges){
      const bit=((i^j)&m);
      if((bit.toString(2).match(/1/g)||[]).length%2===1){
        const p1=proj(V[i],s), p2=proj(V[j],s);
        ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
      }
    }
    lAng.textContent='áng°='+ang.value;
    lMask.textContent='máscara='+mask.value;
    lScale.textContent='escala='+scale.value;
  }
  [ang,mask,scale].forEach(s=>s.oninput=draw);
  draw();
})();
```


.	Los vértices del cubo se definen como
	
$$V = {-1,1}^3 \quad \Rightarrow \quad |V|=8.$$
	2.	Dos vértices se conectan si su distancia de Hamming es
$$d_H(i,j)=1.$$
	3.	Rotación en el plano XY:
$$
R_{xy}(\alpha)=
\begin{bmatrix}
\cos\alpha & -\sin\alpha & 0 \
\sin\alpha & \cos\alpha & 0 \
0 & 0 & 1
\end{bmatrix}.
$$
	4.	Rotación en el plano XZ con ángulo proporcional:
$$
\beta = 0.7\alpha.
$$
	5.	Proyección en perspectiva:
$$
p = \frac{1}{1+kz}, \quad
x’ = x S p + \tfrac{W}{2}, \quad
y’ = y S p + \tfrac{H}{2}.
$$
	6.	Introducción de una máscara binaria:
$$m \in [0,255].$$
	7.	Para cada arista [i,j], calcular:
$$
b = (i \oplus j) \land m.
$$
	8.	Criterio: dibujar si la paridad de $b$ es impar:
$$
\text{popcount}(b) \equiv 1 \mod{2}.
$$
	9.	Controles:
$$\alpha \quad (rotación), \quad m \quad (máscara), \quad S \quad (escala).$$
	10.	Ordenar aristas según la coordenada z para simular oclusión.
	11.	Trazar con línea uniforme de 1 px: estética tipo plotter.
	12.	Mantener coordenadas en [-1,1] evita inestabilidades.
	13.	Blanco/negro + rarefacción combinatoria = estilo Mohr.
	14.	Complejidad computacional:
$$O(|E|), \quad |E|=12.$$
	15.	Variante: cambiar la regla a
$$
b = (i+j) \land m \quad \text{o} \quad \text{paridad}(i\cdot j).
$$




## tesseracto 4d proyectado 2d con eliminación combinatoria


```dataviewjs
(async () => {
  const container = this.container;
  const W = Math.min(window.innerWidth * 0.9, 700), H = W * 0.66;

  // UI
  const bar = container.createEl('div');
  Object.assign(bar.style, {
    display: 'flex', gap: '10px', margin: '6px 0',
    alignItems: 'center', flexWrap: 'wrap'
  });

  const mk = (label, min, max, val, step = 1) => {
    const wrap = bar.createEl('div');
    Object.assign(wrap.style, { display:'flex', alignItems:'center', gap:'6px' });
    const s = wrap.createEl('input');
    s.type = 'range'; s.min = min; s.max = max; s.step = step; s.value = val; s.style.width = '160px';
    const l = wrap.createEl('span', { text: `${label}${val}` });
    l.style.fontFamily = 'ui-monospace';
    return { s, l, set: (v) => l.setText(`${label}${v}`) };
  };

  const rotXY = mk('rot_xy°=', 0, 360, 20, 1);
  const rotZW = mk('rot_zw°=', 0, 360, 35, 1);
  const mask  = mk('máscara=', 0, 65535, 4369, 1); // patrón combinatorio

  // Canvas
  const c = container.createEl('canvas');
  c.width = W; c.height = H;
  c.style.background = '#fff';
  c.style.boxShadow = '0 0 0 1px #0002 inset';
  const g = c.getContext('2d');

  // Vértices {±1}^4 y aristas con Hamming=1
  const V0 = [];
  for (let i = 0; i < 16; i++) V0.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1, (i&8)?1:-1 ]);
  const E = [];
  for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) {
    const pop = ((i ^ j).toString(2).match(/1/g) || []).length;
    if (pop === 1) E.push([i, j]);
  }

  // Rotación 4D en planos XY y ZW
  const rot4 = ([x,y,z,w], aXY, aZW) => {
    const c1 = Math.cos(aXY), s1 = Math.sin(aXY);
    let X = x*c1 - y*s1, Y = x*s1 + y*c1, Z = z, W = w;
    const c2 = Math.cos(aZW), s2 = Math.sin(aZW);
    let Z2 = Z*c2 - W*s2, W2 = Z*s2 + W*c2;
    return [X, Y, Z2, W2];
  };

  // Proyección 4D→2D (perspectiva por w y z)
  const proj = ([x,y,z,w], S) => {
    const p = 1 / (1 + 0.6*w + 0.2*z);
    return [ W/2 + S*x*p, H/2 + S*y*p ];
  };

  const draw = () => {
    g.clearRect(0,0,W,H);
    g.fillStyle = '#fff'; g.fillRect(0,0,W,H);
    g.strokeStyle = '#111'; g.lineWidth = 1;

    const aXY = +rotXY.s.value * Math.PI/180;
    const aZW = +rotZW.s.value * Math.PI/180;
    const M   = +mask.s.value;
    const S   = 120;

    const V = V0.map(v => rot4(v, aXY, aZW));

    for (const [i,j] of E) {
      // Regla combinatoria: dibuja si popcount((i*j) & M) es impar
      const bit = ( (i * j) & M );
      const ones = (bit.toString(2).match(/1/g) || []).length;
      if (ones % 2 === 1) {
        const p1 = proj(V[i], S), p2 = proj(V[j], S);
        g.beginPath(); g.moveTo(...p1); g.lineTo(...p2); g.stroke();
      }
    }

    rotXY.set(rotXY.s.value); rotZW.set(rotZW.s.value); mask.set(mask.s.value);
  };

  [rotXY.s, rotZW.s, mask.s].forEach(s => s.oninput = draw);
  draw();
})();
```




Tesseracto 4D (proyección 2D)
	1.	Vértices:
$$V = {-1,1}^4, \quad |V|=16.$$
	2.	Aristas: conecta i,j si
$$d_H(i,j)=1 \quad \Rightarrow \quad |E|=32.$$
	3.	Rotación en plano XY:
$$
\begin{cases}
x’ = x\cos\alpha - y\sin\alpha \
y’ = x\sin\alpha + y\cos\alpha
\end{cases}
$$
	4.	Rotación en plano ZW:
$$
\begin{cases}
z’ = z\cos\beta - w\sin\beta \
w’ = z\sin\beta + w\cos\beta
\end{cases}
$$
	5.	Transformación completa:
$$
(x,y,z,w) \mapsto R_{zw}(\beta),R_{xy}(\alpha),(x,y,z,w).
$$
	6.	Proyección 4D a 2D con factor:
$$
p = \frac{1}{1+\lambda w + \mu z}.
$$
	7.	Coordenadas proyectadas:
$$
x’ = x S p + \tfrac{W}{2}, \quad
y’ = y S p + \tfrac{H}{2}.
$$
	8.	Máscara combinatoria:
$$M \in [0,65535].$$
	9.	Para cada arista [i,j], calcular:
$$
b = (i \cdot j) \land M.
$$
	10.	Criterio: dibujar si
$$
\text{popcount}(b) \equiv 1 \pmod{2}.
$$
	11.	Sliders:
$$\alpha, \quad \beta, \quad M.$$
	12.	Escala fija S \approx 120.
	13.	Profundidad: ordenar por z+w para sugerir lejanía.
	14.	Variantes: agregar otras rotaciones, por ejemplo R_{xw}, R_{yz}.



```dataviewjs
(async () => {
  const container = this.container;
  const W = Math.min(window.innerWidth * 0.9, 700), H = Math.round(W * 0.66);

  // UI
  const bar = container.createEl('div');
  Object.assign(bar.style, { display:'flex', gap:'10px', margin:'6px 0', flexWrap:'wrap', alignItems:'center' });

  const mk = (label, min, max, val, step=1) => {
    const wrap = bar.createEl('div');
    Object.assign(wrap.style, { display:'flex', alignItems:'center', gap:'6px' });
    const s = wrap.createEl('input'); s.type='range'; Object.assign(s, { min, max, step, value:val }); s.style.width='160px';
    const l = wrap.createEl('span', { text:`${label}${val}` }); l.style.fontFamily='ui-monospace';
    return { s, l, set:(v)=>l.setText(`${label}${v}`) };
  };

  const N   = mk('N=', 12, 180, 64, 1);       // cantidad de puntos
  const K   = mk('k=', 1, 179, 29, 1);        // factor de permutación (i -> k*i mod N)
  const RAD = mk('radio=', 60, 240, 180, 1);  // radio del círculo
  const WGT = mk('grosor=', 1, 4, 1, 1);      // grosor de línea

  // Canvas
  const c = container.createEl('canvas'); c.width=W; c.height=H;
  c.style.background = '#fff'; c.style.boxShadow = '0 0 0 1px #0002 inset';
  const ctx = c.getContext('2d');

  function draw(){
    const n   = +N.s.value | 0;
    const k   = +K.s.value | 0;
    const r   = +RAD.s.value;
    const wgt = +WGT.s.value;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#111'; ctx.lineWidth = wgt;

    const cx = W/2, cy = H/2;
    // posiciones en círculo
    const P = Array.from({length:n}, (_,i)=>[
      cx + r * Math.cos(2*Math.PI*i/n),
      cy + r * Math.sin(2*Math.PI*i/n)
    ]);

    // puntos
    ctx.fillStyle = '#000';
    for (const [x,y] of P){ ctx.beginPath(); ctx.arc(x,y,1.5,0,6.283); ctx.fill(); }

    // líneas i -> (k*i) mod n
    ctx.beginPath();
    for (let i=0;i<n;i++){
      const j = (k*i) % n;
      const [x1,y1] = P[i], [x2,y2] = P[j];
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    }
    ctx.stroke();

    // etiquetas UI
    N.set(n); K.set(k); RAD.set(r); WGT.set(wgt);
  }

  [N.s, K.s, RAD.s, WGT.s].forEach(s => s.oninput = draw);
  draw();
})();
```


---


```dataviewjs
(async () => {
  const container = this.container;
  const W = Math.min(window.innerWidth * 0.95, 760), H = Math.round(W * 0.62);

  // ---------- UI ----------
  const bar = container.createEl('div');
  Object.assign(bar.style, { display:'flex', gap:'10px', margin:'8px 0', flexWrap:'wrap', alignItems:'center' });

  const mkSlider = (label, min, max, val, step=1) => {
    const wrap = bar.createEl('div'); Object.assign(wrap.style,{display:'flex',alignItems:'center',gap:'6px'});
    const s = wrap.createEl('input'); s.type='range'; Object.assign(s,{min,max,step,value:val}); s.style.width='160px';
    const l = wrap.createEl('span',{text:`${label}${val}`}); l.style.fontFamily='ui-monospace';
    return { s, l, set:(v)=>l.setText(`${label}${v}`) };
  };
  const mkCheck = (label, checked=true) => {
    const wrap = bar.createEl('label'); Object.assign(wrap.style,{display:'flex',alignItems:'center',gap:'6px',color:'#444'});
    const c = wrap.createEl('input'); c.type='checkbox'; c.checked = checked;
    wrap.appendText(label);
    return { c, set:(v)=>c.checked=v };
  };
  const mkSelect = (label, opts, val) => {
    const wrap = bar.createEl('div'); Object.assign(wrap.style,{display:'flex',alignItems:'center',gap:'6px'});
    const l = wrap.createEl('span',{text:label}); l.style.fontFamily='ui-monospace';
    const sel = wrap.createEl('select');
    for (const o of opts){ const op = sel.createEl('option',{text:o}); if(o===val) op.selected = true; }
    return { sel, get:()=>sel.value };
  };

  const MODE   = mkSelect('modo:', ['cubo','tesseracto'], 'cubo');
  const SHOWP  = mkCheck('permutación', true);
  const N      = mkSlider('N=', 12, 240, 72, 1);
  const K      = mkSlider('k=', 1, 239, 31, 1);
  const ROT1   = mkSlider('rot1°=', 0, 360, 22, 1);
  const ROT2   = mkSlider('rot2°=', 0, 360, 33, 1);
  const MASK   = mkSlider('mask=', 0, 65535, 4369, 1);
  const RAD    = mkSlider('radio=', 60, 260, 190, 1);
  const THICK  = mkSlider('grosor=', 1, 4, 1, 1);

  const XORF   = mkCheck('XOR fills', true);
  const FNUM   = mkSlider('fills=', 0, 40, 12, 1);
  const ALPHA  = mkSlider('α=', 5, 80, 30, 1); // alpha en %
  const SEEDSL = mkSlider('seed=', 0, 9999, 1234, 1);

  const BTN    = container.createEl('button', { text:'randomize' });
  Object.assign(BTN.style,{padding:'6px 10px',borderRadius:'6px',border:'1px solid #ccc',background:'#fafafa'});

  // Inyectar a la barra
  [MODE, SHOWP, N, K, RAD, THICK, ROT1, ROT2, MASK, XORF, FNUM, ALPHA, SEEDSL].forEach(x => {
    if (x.sel) bar.appendChild(x.sel?.parentElement || x.sel); else bar.appendChild((x.s||x.c).parentElement || (x.s||x.c));
  });
  bar.appendChild(BTN);

  // ---------- Canvas ----------
  const c = container.createEl('canvas'); c.width=W; c.height=H;
  c.style.background = '#fff'; c.style.boxShadow = '0 0 0 1px #0002 inset';
  const ctx = c.getContext('2d');

  // ---------- RNG (semilla) ----------
  const mulberry32 = (a) => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // ---------- Geometrías base ----------
  // Permutación circular
  const drawPermutation = (cx, cy, r, n, k, thick) => {
    const P = Array.from({length:n}, (_,i)=>[
      cx + r * Math.cos(2*Math.PI*i/n),
      cy + r * Math.sin(2*Math.PI*i/n)
    ]);
    ctx.strokeStyle = '#111'; ctx.lineWidth = thick;
    ctx.beginPath();
    for (let i=0;i<n;i++){
      const j = (k*i) % n;
      const [x1,y1] = P[i], [x2,y2] = P[j];
      ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    }
    ctx.stroke();
    // puntos
    ctx.fillStyle='#000';
    for (const [x,y] of P){ ctx.beginPath(); ctx.arc(x,y,1.3,0,6.283); ctx.fill(); }
  };

  // Cubo 3D
  const verts3 = []; for(let i=0;i<8;i++) verts3.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1 ]);
  const edges3 = []; for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
    const pop = ((i^j).toString(2).match(/1/g)||[]).length; if(pop===1) edges3.push([i,j]);
  };

  const rot3 = ([x,y,z], a) => {
    const ca=Math.cos(a), sa=Math.sin(a);
    let x1= x*ca - y*sa, y1= x*sa + y*ca, z1=z;
    const cb=Math.cos(a*0.7), sb=Math.sin(a*0.7);
    let x2= x1*cb - z1*sb, z2= x1*sb + z1*cb;
    return [x2,y1,z2];
  };
  const proj3 = ([x,y,z], S) => {
    const p = 1/(1+0.8*z);
    return [ W/2 + S*x*p, H/2 + S*y*p ];
  };

  const drawCube = (ang, mask, S=120, thick=1) => {
    const V = verts3.map(v => rot3(v, ang));
    ctx.strokeStyle='#111'; ctx.lineWidth = thick;
    for(const [i,j] of edges3){
      const bit = ((i^j) & mask);
      const ones = (bit.toString(2).match(/1/g)||[]).length;
      if (ones % 2 === 1){
        const p1 = proj3(V[i],S), p2 = proj3(V[j],S);
        ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
      }
    }
  };

  // Tesseracto 4D
  const verts4 = []; for(let i=0;i<16;i++) verts4.push([ (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1, (i&8)?1:-1 ]);
  const edges4 = []; for(let i=0;i<16;i++)for(let j=i+1;j<16;j++){
    const pop = ((i^j).toString(2).match(/1/g)||[]).length; if(pop===1) edges4.push([i,j]);
  };
  const rot4 = ([x,y,z,w], aXY, aZW) => {
    const c1=Math.cos(aXY), s1=Math.sin(aXY);
    let X = x*c1 - y*s1, Y = x*s1 + y*c1, Z = z, Ww = w;
    const c2=Math.cos(aZW), s2=Math.sin(aZW);
    let Z2 = Z*c2 - Ww*s2, W2 = Z*s2 + Ww*c2;
    return [X,Y,Z2,W2];
  };
  const proj4 = ([x,y,z,w], S) => {
    const p = 1/(1 + 0.6*w + 0.2*z);
    return [ W/2 + S*x*p, H/2 + S*y*p ];
  };
  const drawTesseract = (a1, a2, mask, S=120, thick=1) => {
    const V = verts4.map(v => rot4(v,a1,a2));
    ctx.strokeStyle='#111'; ctx.lineWidth = thick;
    for(const [i,j] of edges4){
      const bit = ((i*j) & mask);
      const ones = (bit.toString(2).match(/1/g)||[]).length;
      if (ones % 2 === 1){
        const p1 = proj4(V[i],S), p2 = proj4(V[j],S);
        ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.stroke();
      }
    }
  };

  // ---------- XOR fills aleatorios ----------
  const randPoly = (rng, cx, cy, baseR) => {
    const sides = 3 + Math.floor(rng()*6); // 3..8
    const jitter = (0.25 + 0.75*rng()) * baseR; // radio variable
    const pts = [];
    let a0 = rng()*Math.PI*2;
    for(let i=0;i<sides;i++){
      const ang = a0 + i*(2*Math.PI/sides) + (rng()-0.5)*0.25;
      const rr  = jitter * (0.7 + 0.6*rng());
      pts.push([ cx + rr*Math.cos(ang), cy + rr*Math.sin(ang) ]);
    }
    return pts;
  };

  const xorFills = (rng, count, alphaPct=30) => {
    ctx.save();
    ctx.globalCompositeOperation = 'xor';
    for (let i=0;i<count;i++){
      const pts = randPoly(rng, W/2, H/2, Math.min(W,H)*0.45);
      const r = Math.floor(64 + 160*rng());
      const g = Math.floor(64 + 160*rng());
      const b = Math.floor(64 + 160*rng());
      const a = Math.max(0.02, Math.min(0.95, alphaPct/100));
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k=1;k<pts.length;k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  // ---------- Render ----------
  let rng = mulberry32(+SEEDSL.s.value|0);

  const draw = () => {
    // fondo
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);

    const n   = +N.s.value|0, k = +K.s.value|0, r = +RAD.s.value|0, thick = +THICK.s.value|0;
    const a1  = (+ROT1.s.value)*Math.PI/180, a2 = (+ROT2.s.value)*Math.PI/180;
    const mask= +MASK.s.value|0;
    const doPerm = SHOWP.c.checked;
    const doXor  = XORF.c.checked;
    const fnum   = +FNUM.s.value|0;
    const alpha  = +ALPHA.s.value|0;

    // 1) Permutación (opcional)
    if (doPerm) drawPermutation(W/2, H/2, r, n, k, thick);

    // 2) XOR fills aleatorios
    if (doXor) xorFills(rng, fnum, alpha);

    // 3) Estructura superior (cubo / tesseracto)
    if (MODE.get()==='cubo') drawCube(a1, mask, 120, thick);
    else drawTesseract(a1, a2, mask, 120, thick);

    // actualizar labels
    [N,K,RAD,THICK,ROT1,ROT2,MASK,FNUM,ALPHA,SEEDSL].forEach(s=>s.set?.(s.s?.value ?? ''));
  };

  // Eventos
  [N.s,K.s,RAD.s,THICK.s,ROT1.s,ROT2.s,MASK.s,FNUM.s,ALPHA.s,SEEDSL.s].forEach(s=>s.oninput=()=>{ rng = mulberry32(+SEEDSL.s.value|0); draw(); });
  [SHOWP.c, XORF.c].forEach(c=>c.onchange=draw);
  MODE.sel.onchange = draw;
  BTN.onclick = () => { SEEDSL.s.value = (Math.floor(Math.random()*10000)).toString(); rng = mulberry32(+SEEDSL.s.value|0); draw(); };

  draw();
})();
```

