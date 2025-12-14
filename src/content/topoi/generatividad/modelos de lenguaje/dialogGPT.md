---
type: llm
name: DialoGPT
img: https://i.imgur.com/mP7LA8s.png
authors:
  - Y. Zhang
  - S. Sun
  - M. Galley
  - Y-C. Chen
  - C. Brockett
  - X. Gao
  - J. Gao
  - J. Liu
  - B. Dolan
institution: Microsoft Research
sponsor: Dynamics 365 AI Research
year: 2019
params_million: 345
embedding_dim: 768
max_tokens: 1024
architecture: Transformer
training_data: Reddit conversations (2005–2017)
training_size: ~147M message pairs
pretraining_method: autoregressive (causal language modeling)
fine_tuning: supervised fine-tuning on conversational Reddit data
license: MIT
code_url: https://github.com/microsoft/DialoGPT
paper_url: https://arxiv.org/abs/1911.00536
use_cases:
  - chatbots
  - dialogue agents
  - conversational AI
input_format: plain text (prompt-response)
output_format: generated conversational reply
tech_innovation: extension of GPT-2 to dialogue with fine-tuning on large-scale Reddit data
props_:
  - "[[Reddit Dataset]]"
  - "[[Transformer]]"
tags:
  - conversational
  - autoregressive
  - GPT-based
  - decoder-only
  - dialogue
  - fine-tuned
city:
country:
use: https://colab.research.google.com/drive/1Webbw0it95EHiCE4xkj47EEJqTnVwAtj
---

«DialoGPT: Preentrenamiento generativo a gran escala para la generación de respuestas conversacionales»  ￼

- Publicado por Microsoft Research en noviembre de 2019.  ￼
- Entrenado con 147 millones de intercambios similares a conversaciones extraídos de cadenas de comentarios de Reddit (2005-2017).  ￼
- 
---

## Researchers & Teams
- Authors: Yizhe Zhang, Siqi Sun, Michel Galley, Yen-Chun Chen, Chris Brockett, Xiang Gao, Jianfeng Gao, Jingjing Liu, Bill Dolan.  ￼
- Project under Microsoft Research / Dynamics 365 AI Research.  ￼

---

## Conceptos / Avances técnicos
- Construido a partir de / amplía la arquitectura de estilo GPT-2 (basada en Transformer).  ￼
- Ajustado específicamente para la generación de respuestas conversacionales, con el objetivo de lograr un diálogo de un solo turno con coherencia y relevancia.  ￼
- Evaluado mediante métricas automáticas y evaluación humana. Se demostró que ofrece «respuestas más relevantes, con más contenido y más coherentes con el contexto que los sistemas de referencia» en esos entornos de un solo turno.  ￼

---

## Lo que no hace (o tiene limitaciones)
- No está optimizado para diálogos largos y coherentes con memoria. La ventana de contexto es limitada.
- Puede ser repetitivo o producir respuestas genéricas.
- No garantiza la exactitud de los datos ni un amplio conocimiento del ámbito más allá de su entrenamiento.
- 
---


## Datos desconocidos o poco claros
- Coste de la formación: Microsoft no ha revelado públicamente el coste financiero (horas de computación, infraestructura, etc.).
- Detalles de la financiación: es interna de Microsoft; presumiblemente financiada con el presupuesto de investigación de Microsoft. No se han publicado cifras de subvenciones ni del presupuesto (al menos no en el dominio público, según la última comprobación).
---



