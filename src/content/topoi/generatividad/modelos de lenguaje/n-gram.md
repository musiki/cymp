---
type: llm
img: https://i.imgur.com/rCWWE8a.png
name: n-gram models
year: 1990
tags:
  - statistical
  - shallow
  - probabilistic
tech_innovation: word-level Markov modeling of language sequences
param_million: n^3
authors:
  - "[[Claude Shannon]]"
  - "[[Peter Brown]]"
  - "[[Stephen Della Pietra]]"
---



Un modelo de n-gramas guarda probabilidades para cada secuencia de palabras de longitud n.
En lugar de “parámetros aprendidos” como en redes neuronales, tiene un conteo de frecuencias que se normaliza a probabilidades.

Ejemplo sencillo:
- Si tu corpus tiene 100.000 palabras en el vocabulario (V),
- un modelo trigrama (n=3) tendría un espacio potencial de combinaciones de:

$V^3 = 100,000^3 = 10^{15}$


Pero en la práctica, solo una pequeña fracción aparece en el texto, así que se almacenan muchos menos.

👉 Si estimamos que en un corpus grande de la época (por ejemplo, el British National Corpus o Google N-grams) podrías tener cientos de millones de trigramas distintos, entonces un modelo n-grama a gran escala podía ocupar del orden de 100M–1B parámetros equivalentes (dependiendo del vocabulario y corpus).
Esto es comparable al tamaño de GPT-2 Small (124M) o incluso al GPT-2 Medium (355M) en espacio de memoria, ¡pero mucho menos eficiente en generalización!


⸻

## Investigadores y orígenes de los n-gramas

- Claude Shannon (1948) fue el primero en describir el uso de cadenas de Markov (n-gramas) para modelar lenguaje en A Mathematical Theory of Communication.
- En lingüística computacional, los n-gramas se popularizaron en los años 80–90 como la base de los sistemas de reconocimiento de voz y traducción automática.
- Peter Brown, Stephen Della Pietra, Vincent Della Pietra y Robert Mercer (IBM, 1990s) usaron modelos n-grama en el famoso proyecto de traducción automática estadística.
- Más tarde, Joshua Goodman y Stanley Chen (Harvard/Microsoft Research) refinaron la estimación y el smoothing (Good-Turing, Kneser-Ney).
- Google publicó su Google N-gram Corpus (2006), que contenía billones de palabras y trillones de n-gramas, empujando su uso masivo en aplicaciones de la época.