---
type: llm
name: BERT
img: https://i.imgur.com/Eck59pm.png
authors:
  - Jacob Devlin
  - Ming-Wei Chang
  - Kenton Lee
  - Kristina Toutanova
institution: Google AI Language
sponsor: Google Research
year: 2018
params_million: 110
embedding_dim: 768 (base), 1024 (large)
max_tokens: 512
architecture: Transformer (encoder-only)
training_data: English Wikipedia + BookCorpus
training_size: ~3.3B words
pretraining_method: masked language modeling + next sentence prediction
fine_tuning: task-specific (QA, classification, NER, etc.)
license: Apache 2.0
code_url: https://github.com/google-research/bert
paper_url: https://arxiv.org/abs/1810.04805
use_cases:
  - classification
  - question answering
  - sentence similarity
  - token tagging (NER)
input_format: tokenized sentence pairs
output_format: contextual embeddings or classification logits
tech_innovation: bidirectional pretraining with MLM objective; general-purpose transformer encoder
props_:
  - "[[Transformer]]"
  - "[[BookCorpus]]"
  - "[[Wikipedia Dataset]]"
tags: [masked-language-model, encoder-only, bidirectional, pretraining]
city: Mountain View
country: USA
---


