

### Sinopsis

Un proceso de Wiener, también conocido como movimiento browniano, es un proceso estocástico en tiempo continuo que modela la evolución aleatoria de una variable. Se caracteriza por tener incrementos independientes y normalmente distribuidos con media cero y varianza proporcional al intervalo de tiempo. Formalmente, un proceso $W_t$ es un proceso de Wiener si $W_0 = 0$, sus trayectorias son casi seguramente continuas, y para $0 \le s < t$, el incremento $W_t - W_s$ sigue una distribución normal $\mathcal{N}(0, t-s)$. Este objeto matemático sirve como base fundamental para el cálculo estocástico y modela fenómenos que van desde el desplazamiento de partículas en un fluido hasta la fluctuación de precios en los mercados financieros.

---

### Núcleo

- <mark class='hltr-green'>El proceso de Wiener es la piedra angular del cálculo estocástico</mark>, proporcionando un modelo matemático riguroso para el "ruido blanco" integrado y permitiendo definir integrales con respecto a trayectorias irregulares `(@Øksendal 2003 : 22)`.
- Sus incrementos son <mark class='hltr-blue'>independientes y estacionarios</mark>, lo que significa que el comportamiento futuro depende sólo del estado presente, no del pasado, una propiedad que conecta directamente con las cadenas de Markov en tiempo continuo `(@Kloeden y Platen 1992 : 28)`.
- Las trayectorias del proceso son <mark class='hltr-blue'>continuas pero no diferenciables en ningún punto</mark>. Esta propiedad de variación infinita sobre cualquier intervalo finito desafía el cálculo clásico y exige un nuevo marco, el cálculo de Itô `(@Mörters y Peres 2010 : 1)`.
- La construcción del proceso puede verse como un límite de caminatas aleatorias escaladas, un principio que vincula la microfísica con la macrodescripción y sugiere conexiones con [[Teoría del Caos]] y sistemas complejos.
- <mark class='hltr-orange'>La simulación numérica</mark> del movimiento browniano, a menudo mediante la generación de incrementos gaussianos independientes, es una metodología central para explorar modelos complejos en física financiera o biología `(@Higham 2001 : 526)`.
- <mark class='hltr-red'>La generalización del proceso a dimensiones superiores o campos brownianos fraccionarios (fBm)</mark> introduce dependencia a largo plazo en los incrementos, desafiando la ortodoxia del modelo estándar y generando debates sobre su aplicabilidad `(@Mandelbrot y Van Ness 1968 : 424)`.
- El concepto fue históricamente polémico; su estudio por parte de <mark class='hltr-yellow'>Einstein (1905) y Smoluchowski (1906)</mark> proporcionó evidencia crucial para la existencia atómica, resolviendo un debate científico fundamental `(@Einstein 1905 : 549)`.
- Como herramienta compositiva, puede ser utilizado como un <mark class='hltr-purple'>generador estocástico de formas musicales o arquitectónicas</mark>, donde la deriva controlada por azar define una morfogénesis no determinista. Esto se relaciona con prácticas artísticas en [[Arte Algorítmico]].
- Su implementación en sistemas digitales conecta las matemáticas puras con la [[Materialidad Computacional]], donde el ruido pseudoaleatorio se convierte en un material sonoro o visual con propiedades físicas específicas.

---

### Preguntas de investigación

*   **¿Cómo puede el formalismo del proceso de Wiener ser reconfigurado para modelar procesos creativos no lineales donde el "ruido" no es una perturbación sino un agente generativo primario?** Esto desafiaría su uso tradicional como mero elemento estocástico e implicaría una ontología diferente para los sistemas artificiales `(@Wiener 1948 : 10)`.
*   **En el contexto de la organología digital, ¿puede un instrumento musical cuyo núcleo sea un proceso de Wiener superar su condición de "caja negra" estocástica para convertirse en una interfaz expresiva y corporeizada?** Esto conecta con debates contemporáneneos sobre agencia humano-máquina e [[Interfaz Espectral]] `(@Magnusson 2019 : 45)`.
*   **¿Qué nuevas formas materiales y escultóricas podrían emerger si los procesos de fabricación digital fueran guiados directamente por trayectorias brownianas multidimensionales, creando objetos cuya forma sea literalmente la cristalización de un paseo aleatorio?** Esta aplicación especulativa exploraría los límites entre el orden matemático y el caos material `(@DeLanda 2015 : 112)`.

---


1. Proceso de Wiener
- Es la formalización matemática del movimiento browniano en teoría de la probabilidad.
- Se denota $W(t)$ y cumple:
	1.	$W(0)=0$
	2.	Incrementos independientes y estacionarios
	3.	$W(t)-W(s)\sim \mathcal{N}(0,t-s)$ para $t>s$
	4.	Trayectorias continuas casi seguramente
- Es un proceso gaussiano (cada variable aleatoria $W(t)$ es normal y todo vector $(W(t_1),…,W(t_n))$ es multivariado normal).

En física y finanzas se lo suele llamar indistintamente movimiento browniano.

---

2. Movimiento browniano
- Históricamente, describe la trayectoria física de partículas en un fluido, observada por Robert Brown (1827).
- En modelos modernos, se lo identifica con el proceso de Wiener ($B(t)$).
- Es decir: en matemáticas, movimiento browniano = proceso de Wiener.
- En física, puede tener drift $\mu$ y varianza $\sigma^2$, es decir
$$X(t)=X(0)+\mu t + \sigma W(t)$$
pero sigue siendo esencialmente un Wiener transformado.

---

3. Ruido gaussiano (Gaussian noise)
- Se refiere a una familia de variables aleatorias independientes distribuidas según una normal.
- En el caso discreto: una secuencia ${\xi_n}$ con $\xi_n \sim \mathcal{N}(0,1)$.
- Si lo tomamos como límite continuo (derivada formal del Wiener), hablamos de ruido blanco gaussiano.

---

4. Diferencia clave
- Wiener / Browniano: proceso integrado y continuo; las trayectorias tienen memoria de todo el pasado.
- Ruido gaussiano (blanco): proceso no correlacionado; cada punto en el tiempo es independiente.
- Matemáticamente, el ruido blanco gaussiano $\eta(t)$ se define como la derivada formal del Wiener:
$$\eta(t) = \frac{dW(t)}{dt}$$
(esto no existe como función clásica, sino como distribución generalizada).

---

5. Resumen visual
- Ruido gaussiano: puntos independientes $\sim \mathcal{N}(0,\sigma^2)$ (parece nieve estática de TV).
- Proceso de Wiener: integral de ese ruido → trayectorias continuas, con varianza creciente $\propto t$.
- Movimiento browniano: nombre físico para el mismo proceso de Wiener, aplicado a partículas.

### Referencias

```bibtex
@book{oksendal2003,
  title     = {Stochastic Differential Equations: An Introduction with Applications},
  author    = {Øksendal, Bernt},
  year      = {2003},
  edition   = {6th},
  publisher = {Springer},
  address   = {Berlin}
}

@book{kloeden1992,
  title     = {Numerical Solution of Stochastic Differential Equations},
  author    = {Kloeden, Peter E. and Platen, Eckhard},
  year      = {1992},
  publisher = {Springer-Verlag},
  address   = {Berlin}
}

@book{morters2010,
  title     = {Brownian Motion},
  author    = {Mörters, Peter and Peres, Yuval},
  year      = {2010},
  publisher = {Cambridge University Press},
}

@article{higham2001,
title   = {An Algorithmic Introduction to Numerical Simulation of Stochastic Differential Equations},
author  = {Higham, Desmond J.},
journal = {SIAM Review},
volume  = {43},
number  = {3},
pages   = {525--546},
year    = {2001}
}

@article{mandelbrot1968,
title   = {Fractional Brownian Motions, Fractional Noises and Applications},
author  = {Mandelbrot, Benoit B. and Van Ness, John W.},
journal = {SIAM Review},
volume  = {10},
number=4,
pages={422--437}, 
year={1968}
}

@article{einstein1905,
title  = {{Über die von der molekularkinetischen Theorie der Wärme geforderte Bewegung von in ruhenden Flüssigkeiten suspendierten Teilchen}},
author={Einstein,A.}, 
journal={Annalen der Physik}, 
volume={322}, 
number={8}, 
pages={549--560}, 
year={1905}
}
```


