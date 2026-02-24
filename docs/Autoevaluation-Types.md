# Autoevaluation Types

Guía interna de referencia rápida para bloques `eval` en contenidos de curso.

## Tipos actuales

### 1) `mcq` (Multiple Choice Question)

- Uso: pregunta de opción múltiple autocorregida.
- Modo por defecto: **una sola respuesta**.
- Persistencia: guarda `answer` (string con índice elegido) + `isCorrect`.

Ejemplo (respuesta única):

```eval
id: armonia-dominante-01
type: mcq
title: Dominante principal
prompt: ¿Cuál es la función de V en una tonalidad mayor?
options:
  - "[x] Tensión que resuelve en tónica"
  - "[ ] Función subdominante estable"
  - "[ ] Centro tonal definitivo"
explanation: La dominante crea inestabilidad y pide resolución.
points: 1
mode: self
allowEdit: true
```

### 2) `mcq` con respuestas múltiples (selección múltiple)

Se activa automáticamente cuando hay más de una opción marcada `[x]`.

- UI: renderiza **checkboxes**.
- Corrección: solo da correcto si coincide exactamente el conjunto de respuestas.
- Persistencia: guarda `answer` como array de índices (`["0","2"]`) + `isCorrect`.

Ejemplo:

```eval
id: armonia-cadencia-02
type: mcq
title: Rasgos de cadencia auténtica
prompt: Selecciona todos los rasgos correctos.
options:
  - "[x] Puede cerrar una frase"
  - "[ ] Evita toda sensación conclusiva"
  - "[x] Involucra relación dominante-tónica"
  - "[ ] Es siempre modal y no tonal"
explanation: Se espera cierre y relación V-I.
points: 2
mode: self
```

### 3) `msq` (alias explícito de selección múltiple)

- `type: msq` fuerza selección múltiple.
- Internamente se normaliza y renderiza igual que `mcq` múltiple.

Ejemplo:

```eval
id: lectura-ritmo-03
type: msq
prompt: ¿Qué parámetros afectan el groove?
options:
  - "[x] Microtiming"
  - "[x] Acentuación"
  - "[ ] Solo altura melódica"
points: 2
mode: self
```

### 4) `mcc` (Mark Content Completed)

- Uso: marcar unidad/segmento de lectura como completado.
- UI: botón “Marcar como completado”.
- Persistencia: guarda `answer` con `{ type: "mcc", completed: true, completedAt }`.
- Sidebar: ahora muestra barra de porcentaje **Lectura (MCC)** calculada con `mcc` completados de la página.

Ejemplo:

```eval
id: lectura-forma-sonata-01
type: mcc
title: Lectura de sección
prompt: Marca la sección como completada cuando termines.
summary: Esta sección introduce exposición, desarrollo y recapitulación.
objectives:
  - Reconocer las 3 macro-secciones
  - Diferenciar función temática y modulante
buttonLabel: Marcar como completado
successLabel: Sección completada
points: 1
mode: self
```

## Reglas prácticas

- Siempre definir `id` estable y único por evaluación.
- `points` debe ser numérico positivo.
- En `mcq/msq`, usar mínimo 2 opciones.
- Para selección múltiple, evitar ambigüedad: la clave correcta debe ser cerrada y verificable.
- Para permitir que el alumno cambie una respuesta ya enviada/correcta, usar `allowEdit: true` (también acepta `allowedit: true`).
- También se admite sintaxis `allowedit = true` dentro del bloque `eval`.

## Qué hacer si quiero “múltiples respuestas correctas”

- Opción recomendada: `type: msq`.
- Opción compatible: `type: mcq` + varias opciones `[x]`.

## Migración IA (Ollama/DeepSeek)

- Tutorial inicial: [eval-ollama-migration.md](./eval-ollama-migration.md)
- Objetivo: mover demos de autocorrección a bloques `eval` versionables en contenido de curso.
