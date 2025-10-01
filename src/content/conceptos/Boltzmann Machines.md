---
type: model
tags:
year: 1985
person: 
- "[[Geoffrey Hinton]]"
---


Una Máquina de Boltzmann es un tipo de [[Red Neuronal Estocástica]] recurrente que opera como un sistema de [[Partículas en Equilibrio Térmico]]. A diferencia de las redes feedforward, sus conexiones son simétricas (${w_{ij} = w_{ji}}$) y forman un grafo no dirigido, a menudo con unidades ocultas y visibles. Su dinámica no busca una respuesta determinista, sino muestrear estados del sistema según una distribución de probabilidad subyacente. El estado global de la red $\mathbf{s}$ tiene una energía asociada definida por la función de energía de Hopfield: $E(\mathbf{s}) = -\sum_{i<j} w_{ij} s_i s_j - \sum_i b_i s_i$, donde $w_{ij}$ es el peso entre las unidades $i$ y $j$, $b_i$ es el sesgo de la unidad $i$, y $s_i$ es su estado ({0,1} o {-1,1}). La probabilidad de que el sistema adopte un estado $\mathbf{s}$ viene dada por la [[Distribución de Boltzmann]]: $P(\mathbf{s}) = \frac{e^{-E(\mathbf{s})/T}}{Z}$, donde $Z$ es la función de partición que actúa como constante de normalización y $T$ es un parámetro análogo a la <mark class="hltr-blue">temperatura</mark> que controla el ruido estocástico. El proceso de entrenamiento, fundamentalmente un algoritmo de [[Aprendizaje por Máxima Verosimilitud]], implica ajustar los pesos para que la distribución modelada por la máquina se asemeje a la distribución de los datos de entrenamiento. Esto se logra mediante el <mark class="hltr-orange">algoritmo de contraste divergente</mark> (@Hinton2002), que aproxima el gradiente mediante el muestreo de las distribuciones en equilibrios positivo y negativo.

El núcleo conceptual reside en interpretar el aprendizaje como una forma termodinámica computacional. La máquina, partiendo de un estado aleatorio, realiza un paseo aleatorio a través del espacio de estados energéticos, buscando configuraciones de baja energía que corresponden a patrones probables o "memorias". Al ajustar sus pesos, la arquitectura esencialmente escultura un paisaje energético donde los valles representan los datos en los que ha sido entrenada. Este proceso puede verse como una forma de <mark class="hltr-purple">[[Ontología Orientada a Objetos]] computacional</mark>, donde las relaciones entre unidades no son instruccionales sino relacionales y emergentes, construyendo significado a través de la interacción estocástica. Su capacidad para aprender distribuciones de probabilidad sobre datos binarios las convierte en herramientas fundamentales para tareas como [[Aprendizaje No Supervisado]], extracción de características y modelado generativo, sirviendo como los componentes fundamentales básicos sobre los que se construyen modelos más profundos como las [[Máquinas de Boltzmann Restringidas]].

Una pregunta fundamental explora los límites entre el aprendizaje mecánico y la termodinámica física: ¿Puede la dinámica física no lineal de sistemas materiales análogos (por ejemplo, redes ópticas o espintrónicas) implementar directamente y acelerar exponencialmente el muestreo de Gibbs lento inherente al entrenamiento de Máquinas de Boltzmann, efectuando una fusión material entre el cómputo y la física estadística (@Cichy2021)?

```bibtex
@article{Hinton2002,
  author  = {Hinton, Geoffrey E.},
  title   = {Training products of experts by minimizing contrastive divergence},
  journal = {Neural Computation},
  year    = {2002},
  volume  = {14},
  number  = {8},
  pages   = {1771--1800}
}
@article{Cichy2021,
  author  = {Cichy, F. and Duane, R.},
  title   = {Physical Systems for Bayesian Inference},
  journal = {Nature Reviews Physics},
  year    = {2021},
  volume  = {3},
  pages   = {562--578}
}
```
