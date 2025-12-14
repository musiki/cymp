---
type: llm
name: RNN Language Model (RNNLM)
img: https://i.imgur.com/1kl1qBN.png
authors: Tomas Mikolov
institution: Brno University of Technology (Czech Republic), luego Google Research
sponsor: Czech Ministry of Education, Google Research
year: 2007-2010
params_million: ~5-10 (dependía del vocabulario y tamaño de hidden layer)
embedding_dim: 100–400
max_tokens: limitado por vocabulario fijo (~30k en experimentos originales)
architecture: Recurrent Neural Network (Elman-type) con capa de embeddings
training_data: Penn Treebank, WSJ, y otros corpora estándar de NLP
training_size: ~1M–10M palabras (en pruebas originales)
pretraining_method: Entrenamiento desde cero con backpropagation through time (BPTT)
fine_tuning: No aplicaba en ese entonces (entrenamiento directo sobre corpus objetivo)
license: Academic / GPL (código original en C disponible como open source)
code_url: https://www.fit.vutbr.cz/~imikolov/rnnlm/
paper_url: https://www.fit.vutbr.cz/~imikolov/rnnlm/thesis.pdf
use_cases: Modelado de lenguaje, predicción de palabras, reconocimiento de voz, precursor de word2vec
input_format: Tokens (palabras en vocabulario, luego embeddings)
output_format: Distribución de probabilidad sobre vocabulario (próxima palabra)
tech_innovation:
  - Primer uso práctico de RNNs para modelado de lenguaje
  - Superó n-gramas estadísticos en varios benchmarks
  - Base conceptual de word2vec (2013)
props_:
  - Histórico: puente entre NNLM (Bengio) y embeddings modernos
  - Influyó en Google word2vec y fastText
tags:
  - rnnlm
  - mikolov
  - 2007
  - embeddings
  - recurrent
  - retro-ai
  - precursor-llm
city: Brno
country: Czech Republic
---

