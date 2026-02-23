# Contexto Global: Self-Assessment para el LMS

Estado: documento vivo  
Fecha: 2026-02-22

## 1. Propósito

Este LMS no busca solo “corregir”, sino construir una pedagogía activa:
- autoevaluación,
- feedback diagnóstico,
- reintento,
- coevaluación,
- trazabilidad de progreso individual y colectivo.

La meta es un sistema plástico (Astro + Obsidian + Supabase + IA) donde la evaluación sea parte del aprendizaje y no solo una nota final.

## 2. Principios de diseño

1. IA como mentor, no policía.
2. Criterios transparentes (rúbricas visibles).
3. Feedback inmediato + reflexión guiada + reintento.
4. Alineación explícita entre objetivo de aprendizaje y tipo de actividad.
5. Registro de progreso en el tiempo (spaced repetition + metacognición).
6. Integración de autoevaluación, coevaluación y revisión docente.

## 3. Modos de evaluación (núcleo funcional)

### 3.1 MCQ / preguntas objetivas
Uso recomendado:
- definiciones,
- relaciones conceptuales,
- inferencias breves.

Fortalezas:
- corrección exacta,
- costo técnico bajo,
- ideal para práctica espaciada.

Riesgo:
- aprendizaje superficial si no se acompaña con explicación.

### 3.2 Short answer / essay con IA
Arquitectura recomendada de dos capas:

1. Capa diagnóstico IA:
- correcto / parcial / incorrecto / fuera de tema,
- conceptos ausentes,
- sugerencias de mejora.

2. Capa nota oficial:
- docente acepta o ajusta la predicción,
- deja trazabilidad de decisión.

### 3.3 Spaced repetition + retrieval practice
No es solo tipo de pregunta: es un scheduler pedagógico.

Objetivo:
- reactivar contenidos en intervalos crecientes,
- mezclar contenido nuevo y viejo,
- incorporar “confianza declarada” del estudiante para ajuste adaptativo.

### 3.4 Evaluación de código/patches (Max/Pd/M4L)
Pipeline técnico:
1. Parse de `.maxpat` / `.pd`.
2. Extracción de grafo (nodos/aristas).
3. Checks estructurales.
4. Tests de comportamiento (cuando aplique).

Salida al estudiante:
- qué falta,
- qué funciona,
- qué no cumple la consigna.

### 3.5 Auto/coevaluación con rúbricas
Workflow:
- autoevaluación,
- peer review (n revisores),
- agregación (mediana/promedio robusto),
- resumen comparativo: “cómo me veo” vs “cómo me ven”.

## 4. UX patterns clave

### 4.1 MCC (Marcar Como Completado)
- Cada bloque informativo (300-900 palabras) cierra con objetivos.
- Botón “Marcar como completado”.
- Sidebar muestra estado visual (círculo con tilde verde).
- Al completar, se habilita siguiente problema/actividad.

### 4.2 DDS (Drag & Drop Sorting)
Interfaz de categorización con 3 columnas (ej. fortaleza / dificultad / no predice).

Comportamiento:
- botón Check: muestra aciertos/errores,
- verde para correcto, rojo para incorrecto,
- botón Retry: resetea y randomiza tarjetas.

Formato de contenido esperado en markdown:

```markdown
{ id: 1, text: "Predicts protein structures with high accuracy", category: "strength" },
{ id: 2, text: "Does not model protein dynamics", category: "limitation" },
{ id: 3, text: "Accelerates structural biology research", category: "strength" }
```

## 5. Gramática unificada de evaluación (`eval` block)

Se adopta bloque fenced `eval` en contenido Obsidian/Markdown para parseo en Astro.

Tipos iniciales:
- `mcq`
- `short_ai`
- `essay_ai`
- `code`
- `patch`
- `spaced`
- `peer_rubric`
- `dds`
- `mcc`

Ejemplo base:

```eval
id: cym1-u1-q1
type: mcq
mode: self
points: 1
prompt: >
  ¿Cuál opción describe mejor Umwelt?
options:
  - [ ] Mundo físico objetivo de la física clásica.
  - [x] Mundo circundante vivido por organismo específico.
  - [ ] Conjunto de estímulos auditivos de una especie.
explanation: >
  El Umwelt depende del organismo y su esquema perceptivo.
```

## 6. Modelo instruccional de contenido

Estructura sugerida:
- materia
- unidades
- concepto (frecuentemente en forma de pregunta)
- párrafo síntesis
- pregunta de desglose
- actividad de evaluación

Patrón de cierre por sección:
- 1 párrafo asertivo,
- 3 objetivos de salida (“al final de esta sección serás capaz de…”),
- interacción (MCC/MCQ/short_ai/etc.).

## 7. Backlog funcional priorizado

## P0 (fundacional)
- parser estable para bloques `eval`,
- MCQ autocorregido,
- MCC (marcar completado + estado en sidebar),
- endpoint IA de diagnóstico (`/api/ai/correct`) con trazabilidad,
- RBAC base (admin/teacher/ta/student).

## P1 (escalamiento pedagógico)
- short_ai con rúbrica,
- dds interactivo,
- retries y feedback enriquecido,
- panel de progreso por unidad.

## P2 (inteligencia adaptativa)
- spaced repetition scheduler,
- confianza declarada por estudiante,
- reactivación automática de ítems.

## P3 (colaboración y cultura)
- peer_rubric completo,
- agregación de evaluaciones,
- panel estigmérgico (patrones, dificultades, ejemplos anonimizados).

## 8. Datos y analítica mínima

Entidades sugeridas:
- `AssessmentItem` (definición del ejercicio),
- `Submission` (respuesta),
- `Attempt` (reintentos),
- `Feedback` (IA/docente/pares),
- `Completion` (MCC),
- `Review` (peer),
- `SpacedSchedule` (próxima aparición),
- `ConfidenceSignal` (metacognición 0-100).

KPIs pedagógicos iniciales:
- tasa de finalización por unidad,
- precisión de primer intento vs reintentos,
- ganancia entre intento 1 y último,
- discrepancia auto vs peer vs docente,
- latencia de feedback.

## 9. Marco ético-operativo para IA

- Explicitar que la IA sugiere, no sanciona de forma final.
- Permitir revisión humana en toda evaluación abierta.
- Registrar decisiones (audit trail).
- Diseñar feedback accionable y no punitivo.

## 10. Referencias (base inicial)

```bibtex
@article{cao2025tmsa,
  author  = {Cao, Y. and Yan, Z. and Yang, L. and Panadero, E. and Chen, C.},
  title   = {Technology-mediated self-assessment in higher education: A critical review},
  journal = {Contemporary Educational Technology},
  year    = {2025},
  volume  = {17},
  number  = {3},
  pages   = {n/a},
  note    = {State-of-the-art review on tech-mediated self-assessment}
}
@article{conole2005caa,
  author  = {Conole, Grainne and Warburton, Bill},
  title   = {A review of computer-assisted assessment},
  journal = {Research in Learning Technology},
  year    = {2005},
  volume  = {13},
  number  = {1},
  pages   = {17--31}
}
@article{kang2016spaced,
  author  = {Kang, Sean H. K.},
  title   = {Spaced Repetition Promotes Efficient and Effective Learning},
  journal = {Policy Insights from the Behavioral and Brain Sciences},
  year    = {2016},
  volume  = {3},
  number  = {1},
  pages   = {12--19}
}
@article{carpenter2022spacingretrieval,
  author  = {Carpenter, Shana K. and others},
  title   = {The science of effective learning with spacing and retrieval practice},
  journal = {npj Science of Learning},
  year    = {2022},
  volume  = {7},
  number  = {1},
  pages   = {1--10}
}
@article{huang2025aiSpacing,
  author  = {Huang, Mengqi},
  title   = {Spaced Repetition and Retrieval Practice: Efficient Learning Mechanisms and Their Empowerment by AI},
  journal = {n/a},
  year    = {2025},
  pages   = {n/a}
}
@article{ross2018adaptivequizzes,
  author  = {Ross, Brenda and others},
  title   = {Adaptive quizzes to increase motivation, engagement and learning in higher education},
  journal = {International Journal of Educational Technology in Higher Education},
  year    = {2018},
  volume  = {15},
  number  = {28},
  pages   = {1--20}
}
@article{li2025aiGrading,
  author  = {Li, Y. and others},
  title   = {Can AI support human grading? Examining machine-generated scores for short-answer questions},
  year    = {2025},
  volume  = {210},
  pages   = {n/a}
}
@article{condor2020bertShortAnswer,
  author  = {Condor, A. and others},
  title   = {Exploring Automatic Short Answer Grading as a Tool to Support Human Graders},
  journal = {BMC Medical Education},
  year    = {2020},
  volume  = {20},
  number  = {1},
  pages   = {1--10}
}
@article{ludwig2021aesTransformer,
  author  = {Ludwig, S. and others},
  title   = {Automated Essay Scoring Using Transformer Models},
  journal = {arXiv preprint arXiv:2110.06874},
  year    = {2021},
  pages   = {1--14}
}
@article{osaka2025shortAnswer,
  author  = {Osaka, J. and others},
  title   = {Reliable and efficient automated short-answer scoring for a large cohort},
  journal = {Interactive Learning Environments},
  year    = {2025},
  pages   = {n/a}
}
@article{pecuchova2025openEndedAI,
  author  = {Pecuchova, J. and others},
  title   = {Automated Grading of Open-Ended Questions in Higher Education with Generative AI and Embedding Models},
  journal = {International Journal of Artificial Intelligence in Education},
  year    = {2025},
  pages   = {n/a}
}
@article{maslim2024shortAnswer,
  author  = {Maslim, M. and others},
  title   = {A Trustworthy Automated Short-Answer Scoring System},
  journal = {International Journal of Interactive Multimedia and Artificial Intelligence},
  year    = {2024},
  volume  = {8},
  number  = {7},
  pages   = {n/a}
}
@article{mesny2026innovativeAssessment,
  author  = {Mesny, A. and others},
  title   = {Innovative assessment and grading practices in higher education},
  journal = {Teaching and Teacher Education},
  year    = {2026},
  pages   = {n/a}
}
@article{zacharis2010innovative,
  author  = {Zacharis, Nickos Z.},
  title   = {Innovative assessment for learning enhancement: Issues and practices},
  journal = {International Journal of Instructional Technology and Distance Learning},
  year    = {2010},
  volume  = {7},
  number  = {8},
  pages   = {19--34}
}
@inproceedings{caspar2025selfPeer,
  author  = {Yan, Z. and others},
  title   = {Computer assisted self and peer assessment: Applications, challenges and opportunities},
  booktitle = {Conference on Educational Technology},
  year    = {2025},
  pages   = {n/a}
}
@article{cao2025tmsaShort,
  author  = {Cao, Y. and others},
  title   = {Technology-mediated self-assessment in higher education: A critical review},
  journal = {Contemporary Educational Technology},
  year    = {2025},
  volume  = {17},
  number  = {3},
  pages   = {n/a}
}
```
