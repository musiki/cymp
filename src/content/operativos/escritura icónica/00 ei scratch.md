
## ecuaciones en MathJax

MathJax es una biblioteca de JavaScript que permite renderizar notación matemática en navegadores utilizando LaTeX. Surgió en 2009 para facilitar la visualización de ecuaciones en línea, siendo ampliamente adoptada en educación y ciencia por su versatilidad y precisión.

---

para renderear mathjax en obsidian puedo utilizar:

1.  para formulas en párrafo. 
	1. Usando dos signos pesos  `$$` como frame:

	$$ \sqrt{-1} $$ 

3. para formulas en la linea de texto. 
	1. Usando un signo de pesos o  como frame:
$\sqrt{\frac{1}{-1}}$

$\sqrt{1} + 1 = 2$





---

### Categorías de símbolos matemáticos

MathJax organiza los símbolos en categorías principales, basadas en la sintaxis de LaTeX, que incluyen:

---

**Símbolos básicos y operadores**
1. Incluyen números, variables (como \(x, y\))
2. operadores aritméticos (\(+, -, \times, \div\)).


---

**Símbolos relacionales**: Comparaciones como \(=\), \(\neq\), \(<\), \(>\), \(\leq\), \(\geq\).

---

**Símbolos de agrupación**: Paréntesis \((\ )\), corchetes \([ \ ]\), llaves \(\{ \ \}\), y barras para valores absolutos \(|\ |\) o normas \(\| \ \|\).

$\left(\frac{3}{4}\right)$


---

**Símbolos avanzados**: Incluyen integrales \(\int\), sumatorias \(\sum\), productos \(\prod\), y raíces \(\sqrt{}\).

---

**Símbolos griegos y especiales**: Letras griegas (\(\alpha, \beta, \pi\)) y símbolos como \(\infty\), \(\partial\), \(\nabla\).

---

**Estructuras matemáticas**: Fracciones \(\frac{a}{b}\), subíndices \(x_i\), superíndices \(x^i\), y matrices.

---


### Uso de `\newcommand` en MathJax

El comando `\newcommand` permite definir macros personalizadas para simplificar la escritura de expresiones complejas. La sintaxis es:

```latex
\newcommand{\nombre}[n]{definición}
```


- **nombre**: Nombre de la macro (sin barra invertida).
- **n**: Número de parámetros (opcional, entre 0 y 9).
- **definición**: Expresión matemática que reemplaza la macro.


---

### Ejemplos de ecuaciones con MathJax

1. **Ecuación simple**:
   ```latex
   $$ y = mx + b $$
   ```
   Renderiza: $y = mx + b$

---

1. **Fracción y raíz cuadrada**:
   ```latex
   $$ \sqrt{\frac{a}{b}} $$
   ```
   Renderiza: $\sqrt{\frac{a}{b}}$

---

1. **Sumatoria**:
   ```latex
   $$ \sum_{i=1}^{n} i^2 $$
   ```
   Renderiza: $\sum_{i=1}^{n} i^2$

---

1. **Matriz**:
   ```latex
   $$ \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} $$
   ```
   Renderiza: $\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$

---

1. **Definición con `\newcommand`**:
   ```latex
   \newcommand{\R}{\mathbb{R}}
   $$ f: \R \to \R $$
   ```
   Renderiza: $f: \mathbb{R} \to \mathbb{R}$

---

1. **Macro con parámetros**:
   ```latex
   \newcommand{\pol}[2]{#1x^2 + #2x}
   $$ \pol{a}{b} $$
   ```
   Renderiza: $ax^2 + bx$

---

1. **Ecuación compleja**:
   ```latex
   \newcommand{\grad}{\nabla}
   $$ \grad f(x, y) = \begin{pmatrix} \frac{\partial f}{\partial x} & \frac{\partial f}{\partial y} \end{pmatrix} $$
   ```
   Renderiza: $\nabla f(x, y) = \begin{pmatrix} \frac{\partial f}{\partial x} & \frac{\partial f}{\partial y} \end{pmatrix}$

---

- **Recursos** documentación oficial de MathJax](https://www.mathjax.org/) o tutoriales de LaTeX para más símbolos y comandos.

---

## MOAIE

materiales $mat**

objetos $obj**

agentes $agn**

interfaces $itf**

entornos $ent**


---

1. Fórmula de escritura icónica

$$
\newcommand{\mat}{\blacksquare}
\newcommand{\obj}{\blacklozenge}
\newcommand{\agn}{\bullet}
\newcommand{\itf}{\leftrightarrow}
\newcommand{\ent}[1]{\boxed{#1}}
\newcommand{\branch}{\twoheadrightarrow}
$$


materiales $\mat$

objetos $\obj$

agentes $\agn$

interfaces $\itf$

entornos $\ent{  }_f \space  \text{ : para entorno físico}$

---


un humano interacciona con un mic piezoelectríco 

$$\ent{\mat_h^{piezo}\rightarrow\obj^{mic}\itf\agn^h}_f$$

un humano acciona (unidireciconalmente) con un piano (percute cuerda)

$$\ent{\mat_o^{\ent{cuerda}_\obj^m}\itf_{teclado}^{88} \obj_{piano}\leftarrow\agn_h}_f$$


objeto piano discriminado.

$\obj_{piano} \branch (\itf^{88}_{teclado} \space \cup \space \mat_{cuerda} \space \cup \space \triangle_{martillo})$


fórmula compleja

$$\ent{\obj_{piano} \branch (\itf^{88}_{teclado} \space \cup \space \mat_{cuerda} \space \cup \space \triangle_{martillo}) \leftarrow\agn_h}_f$$
