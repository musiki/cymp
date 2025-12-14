---
type: llm
name: GPT-2
img: https://i.imgur.com/4AYmqm9.png
authors:
  - Alec Radford
  - Jeffrey Wu
  - Rewon Child
  - David Luan
  - Dario Amodei
  - Ilya Sutskever
institution: OpenAI
sponsor: OpenAI
year: 2019
params_million_small: 124
params_million_medium: 355
params_million: 774
params_million_xl: 1558
embedding_dim: 768
max_tokens: 1024
architecture: Transformer (decoder-only)
training_data: WebText dataset (filtered crawl of outbound Reddit links)
training_size: ~8 million documents (~40 GB)
pretraining_method: autoregressive language modeling (causal LM)
fine_tuning: no fine-tuning in original release
license: OpenAI (open weights, some usage restrictions)
code_url: https://github.com/openai/gpt-2
paper_url: https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf
use_cases:
  - open-ended text generation
  - prompt completion
  - story generation
  - zero-shot tasks
input_format: plain text
output_format: plain text
tech_innovation: large-scale autoregressive pretraining on diverse web corpus
props_:
  - "[[Transformer]]"
  - "[[WebText Dataset]]"
tags:
  - autoregressive
  - decoder-only
  - open-domain
  - foundationmodel
city: San Francisco
country: USA
---



