---
img: https://i.imgur.com/CtEl1fy.png
type: llm
name: Neural Probabilistic Language Model (NNLM / NPLM)
authors: Yoshua Bengio, Réjean Ducharme, Pascal Vincent, Christian Janvin
institution: Université de Montréal
sponsor: NSERC (Natural Sciences and Engineering Research Council of Canada)
year: 2003
params_million: ~3-5 (estimado, dependía del corpus y vocabulario usado)
embedding_dim: 30–100 (típico en sus experimentos)
max_tokens: limitado por vocabulario fijo (~17k palabras en experimento original)
architecture: Feedforward Neural Network con capa de embeddings compartidos
training_data: Canadian Hansards (traducciones parlamentarias francés-inglés)
training_size: ~14M palabras
pretraining_method: No había pretraining generalizado (entrenamiento directo con corpus específico)
fine_tuning: No aplicaba (entrenamiento desde cero en corpus objetivo)
license: Paper académico (no liberado como software open source en ese momento)
code_url: null (implementaciones modernas disponibles en PyTorch/TensorFlow por la comunidad)
paper_url: https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf
use_cases: Modelado de lenguaje, mejora de predicción de palabras, precursor de embeddings
input_format: Tokens (palabras enteras en vocabulario)
output_format: Distribución de probabilidad sobre vocabulario (próxima palabra)
tech_innovation:
  - Primer modelo neuronal de lenguaje exitoso
  - Introducción de embeddings aprendidos automáticamente
  - Mostró cómo las redes podían superar n-gramas con smoothing
  - distributed representations
props_:
  - word2vec
  - GloVe
  - transformers
tags:
  - nnlm
  - nplm
  - bengio
  - 2003
  - embeddings
  - precursor-llm
  - retro-ai
city: Montreal
country: Canada
---
