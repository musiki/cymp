---
type: llm
name:
img: https://i.imgur.com/5KDFty7.png
person:
institution:
sponsor:
year: 1950
params_million: <0.001
embedding_dim: n/a
max_tokens: 10-200
architecture: symbolic/rule-based
training_data: expert rules <1MB
training_size:
pretraining_method:
fine_tuning:
license:
code_url:
paper_url:
use_cases:
input_format:
output_format:
tech_innovation: transparent reasoning
props_:
tags:
city:
country:
---



## Sinopsis

Los sistemas GOFAI (Good Old-Fashioned Artificial Intelligence) representan el paradigma dominante en inteligencia artificial desde los años 50 hasta los 80, basado en la manipulación explícita de símbolos formales. Operan bajo la hipótesis de que la cognición, tanto humana como artificial, es esencialmente un proceso de computación simbólica donde el pensamiento equivale a la manipulación de representaciones internas según reglas lógicas. Estos sistemas separan completamente el conocimiento (base de conocimientos) del razonamiento (motor de inferencia), tratando la inteligencia como un proceso independiente de su implementación física. Su arquitectura fundamental implica la creación de modelos simbólicos del mundo que pueden ser manipulados mediante algoritmos deductivos para resolver problemas específicos dentro de dominios cerrados.

## Núcleo

- <mark class='hltr-green'>La hipótesis del sistema de símbolos físicos</mark> postula que "un sistema de símbolos físicos tiene los medios necesarios y suficientes para una acción inteligente general" (@Newell1980 : 170), estableciendo que la inteligencia emerge de la manipulación estructurada de entidades discretas según reglas formales, conectando directamente con [[sistemas basados en conocimiento]] y encontrando resistencia en enfoques [[conexionismo]].

- <mark class='hltr-blue'>Arquitectura separada</mark> entre motor de inferencia y base de conocimientos permite el razonamiento lógico mediante técnicas como <mark class='hltr-orange'>resolución unificación</mark> y <mark class='hltr-orange'>encadenamiento hacia adelante/atrás</mark>, donde las representaciones siguen lógicas formales como $P \rightarrow Q$ que pueden manipularse deductivamente (@Russell2010 : 272).

- <mark class='hltr-yellow'>Logic Theorist (1956)</mark> y <mark class='hltr-yellow'>General Problem Solver (1959)</mark> establecieron el paradigma mediante la demostración automática de teoremas y descomposición means-ends, mientras que sistemas posteriores como <mark class='hltr-yellow'>MYCIN (1976)</mark> demostraron aplicabilidad práctica en dominios especializados (@Buchanan1984 : 116).

- <mark class='hltr-red'>El problema del marco</mark> expone la incapacidad fundamental de especificar completamente qué cambia y qué permanece igual ante una acción, revelando limitaciones ontológicas en la representación simbólica (@McCarthy1969 : 59), mientras que <mark class='hltr-red'>el problema del contexto</mark> desafía la noción misma de conocimiento descontextualizado (@Dreyfus1992 : 156).

- <mark class='hltr-purple'>Máquinas semióticas</Mark> imaginan sistemas GOFAI extendidos como entidades capaces no solo de manipular símbolos sino también de interpretar significados a través del tiempo, creando historias computacionales donde cada inferencia construye narrativas epistémicas que podrían conectarse con [[ontologías procesuales]].

## Preguntas de investigación

- **¿Pueden los sistemas GOFAI trascender sus limitaciones representacionales mediante formalismos matemáticos avanzados?** La investigación contemporánea explora extensiones lógicas no monotónicas y modelos híbridos que integren aproximaciones estadísticas sin abandonar completamente la transparencia simbólica (@McCarthy2007 : 45).

- **¿Cómo se relaciona el resurgimiento del interés en AI simbólica con los debates sobre explicabilidad en sistemas conexionistas?** El "problema de la caja negra" en aprendizaje profundo ha renovado el valor epistemológico de los sistemas basados en reglas explícitas (@Marcus2018 : 234), sugiriendo posibles sinergias con [[arquitecturas cognitivas integradas]].

- **¿Qué aplicaciones especulativas emergen al combinar GOFAI con tecnologías fabricacionales contemporáneas?** Sistemas expertos acoplados a impresoras 3D podrían implementar "razonamiento material" donde las inferencias lógicas se manifiestan directamente como estructuras físicas autoorganizadas (@Gershenfeld2015 : 89).

## Referencias

```bibtex
@book{Newell1980,
  title={Physical symbol systems},
  author={Newell, Allen and Simon, Herbert A.},
  year={1980},
  publisher={MIT Press}
}

@book{Russell2010,
  title={Artificial Intelligence: A Modern Approach},
  author={Russell, Stuart and Norvig, Peter},
  year={2010},
  publisher={Prentice Hall}
}

@article{Buchanan1984,
  title={Rule-Based Expert Systems: The MYCIN Experiments},
  author={Buchanan, Bruce G. and Shortliffe, Edward H.},
  year={1984},
  journal={Addison-Wesley}
}

@article{McCarthy1969,
  title={Some Philosophical Problems from the Standpoint of Artificial Intelligence},
  author={McCarthy, John and Hayes, Patrick J.},
  year={1969},
  journal={Machine Intelligence}
}

@book{Dreyfus1992,
  title={What Computers Still Can't Do},
  author={Dreyfus, Hubert L.},
  year={1992},
  publisher={MIT Press}
}

@article{McCarthy2007,
  title={From Here to Human-Level AI},
  author={McCarthy, John},
  year={2007},
  journal=