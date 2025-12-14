# Eval Block Parser - MCQ Implementation

## Overview
Sistema de evaluación para contenido de cursos usando bloques `eval` en Markdown.

## Sintaxis Básica

### Bloque MCQ (Multiple Choice Question)

````markdown
```eval
id: cym1-u1-q1
type: mcq
mode: self
points: 1
prompt: >
  ¿Cuál de las siguientes opciones describe mejor el concepto de Umwelt en Uexküll?
options:
  - [ ] El mundo objetivo descrito por la física clásica.
  - [x] El mundo circundante tal como es vivido por un organismo particular.
  - [ ] El conjunto de estímulos auditivos de una especie.
explanation: >
  El Umwelt es el mundo tal como se da a un organismo específico, filtrado
  por su aparato sensorial y sus significados biológicos.
```
````

## Campos

### Requeridos
- **id**: Identificador único (formato: `curso-unidad-ejercicio`)
- **type**: Tipo de evaluación (`mcq`, `short_ai`, `essay_ai`, `code`, etc.)
- **prompt**: La pregunta o instrucción
- **options**: Array de opciones (solo para MCQ)
  - `- [ ]` = incorrecta
  - `- [x]` = correcta

### Opcionales
- **mode**: `self` (autoevaluación) o `graded` (calificada por teacher)
- **points**: Puntos que vale el ejercicio (default: 1)
- **explanation**: Texto que se muestra después de responder
- **hint**: Pista que se puede mostrar

## Parser Implementation

### 1. Regex para detectar bloques eval

```javascript
const evalBlockRegex = /```eval\n([\s\S]*?)\n```/g;
```

### 2. Parser YAML del contenido

```javascript
import yaml from 'js-yaml';

function parseEvalBlock(content) {
  const match = evalBlockRegex.exec(content);
  if (!match) return null;
  
  const yamlContent = match[1];
  const parsed = yaml.load(yamlContent);
  
  return {
    id: parsed.id,
    type: parsed.type,
    mode: parsed.mode || 'self',
    points: parsed.points || 1,
    prompt: parsed.prompt,
    options: parseOptions(parsed.options),
    explanation: parsed.explanation,
    hint: parsed.hint
  };
}
```

### 3. Parser de opciones MCQ

```javascript
function parseOptions(optionsArray) {
  return optionsArray.map(option => {
    const isCorrect = option.startsWith('- [x]');
    const text = option.replace(/^- \[(x| )\] /, '');
    return { text, isCorrect };
  });
}
```

## Remark Plugin

```javascript
// src/plugins/remark-eval-blocks.mjs
import { visit } from 'unist-util-visit';
import yaml from 'js-yaml';

export default function remarkEvalBlocks() {
  return (tree, file) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'eval') return;
      
      try {
        const evalData = yaml.load(node.value);
        
        // Transform to custom HTML/component
        const replacement = {
          type: 'html',
          value: `<EvalBlock data='${JSON.stringify(evalData)}' />`
        };
        
        parent.children[index] = replacement;
      } catch (error) {
        console.error('Error parsing eval block:', error);
      }
    });
  };
}
```

## Componente Astro

```astro
---
// src/components/EvalBlock.astro
interface Props {
  data: string;
}

const { data } = Astro.props;
const evalData = JSON.parse(data);
---

<div class="eval-block" data-eval-id={evalData.id}>
  {evalData.type === 'mcq' && (
    <div class="mcq-container">
      <h4 class="eval-prompt">{evalData.prompt}</h4>
      <form class="mcq-form">
        {evalData.options.map((opt, i) => (
          <label class="mcq-option">
            <input 
              type="radio" 
              name={evalData.id} 
              value={i}
              data-correct={opt.isCorrect}
            />
            <span>{opt.text}</span>
          </label>
        ))}
        <button type="submit" class="eval-submit">Enviar Respuesta</button>
      </form>
      <div class="eval-feedback" style="display: none;">
        <p class="feedback-message"></p>
        {evalData.explanation && (
          <p class="feedback-explanation">{evalData.explanation}</p>
        )}
      </div>
    </div>
  )}
</div>

<script>
  document.querySelectorAll('.mcq-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const evalBlock = form.closest('.eval-block');
      const evalId = evalBlock.dataset.evalId;
      const selected = form.querySelector('input:checked');
      
      if (!selected) {
        alert('Por favor selecciona una opción');
        return;
      }
      
      const isCorrect = selected.dataset.correct === 'true';
      const feedback = evalBlock.querySelector('.eval-feedback');
      const message = feedback.querySelector('.feedback-message');
      
      // Show feedback
      message.textContent = isCorrect 
        ? '✅ ¡Correcto!' 
        : '❌ Incorrecto, intenta de nuevo';
      message.className = `feedback-message ${isCorrect ? 'correct' : 'incorrect'}`;
      feedback.style.display = 'block';
      
      // Save to database
      await fetch(`/api/eval/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evalId,
          answer: selected.value,
          isCorrect
        })
      });
      
      // Disable form after correct answer
      if (isCorrect) {
        form.querySelectorAll('input').forEach(input => input.disabled = true);
        form.querySelector('button').disabled = true;
      }
    });
  });
</script>

<style>
  .eval-block {
    margin: 2rem 0;
    padding: 1.5rem;
    border: 2px solid var(--c-border);
    border-radius: 8px;
    background: var(--c-bg-mute);
  }
  .eval-prompt {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }
  .mcq-option {
    display: block;
    padding: 0.75rem;
    margin: 0.5rem 0;
    border: 1px solid var(--c-border);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .mcq-option:hover {
    background: var(--c-bg);
    border-color: var(--c-link);
  }
  .mcq-option input {
    margin-right: 0.5rem;
  }
  .eval-submit {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: var(--c-link);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .eval-submit:hover:not(:disabled) {
    opacity: 0.9;
  }
  .eval-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .eval-feedback {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 6px;
  }
  .feedback-message.correct {
    color: #4caf50;
    font-weight: 600;
  }
  .feedback-message.incorrect {
    color: #f44336;
    font-weight: 600;
  }
  .feedback-explanation {
    margin-top: 0.5rem;
    font-style: italic;
    color: var(--c-fg-dim);
  }
</style>
```

## API Endpoint

```typescript
// src/pages/api/eval/submit.ts
import type { APIRoute } from 'astro';
import { db, Submission, User, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  const session = (locals as any).session;
  const currentUser = session?.user;

  if (!currentUser?.email) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    });
  }

  const { evalId, answer, isCorrect } = await request.json();
  
  // Get user from DB
  const [dbUser] = await db.select().from(User).where(eq(User.email, currentUser.email));

  // Save submission
  await db.insert(Submission).values({
    id: crypto.randomUUID(),
    userId: dbUser.id,
    assignmentId: evalId,
    payload: { answer, isCorrect },
    score: isCorrect ? 1 : 0,
    attempts: 1,
    submittedAt: new Date(),
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
};
```

## Database Schema

Ya existe en `db/config.ts`:

```typescript
const Submission = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text({ references: () => User.columns.id }),
    assignmentId: column.text({ references: () => Assignment.columns.id }),
    payload: column.json(), // { answer: "0", isCorrect: true }
    score: column.number({ optional: true }),
    attempts: column.number({ default: 1 }),
    submittedAt: column.date({ default: NOW }),
    gradedAt: column.date({ optional: true }),
    feedback: column.text({ optional: true }),
  }
});
```

## Ejemplo de Uso en Curso

```markdown
---
title: "Conceptos Básicos"
visibility: enrolled-only
---

# Umwelt y Percepción

El concepto de **Umwelt** de Jakob von Uexküll...

## Autoevaluación

```eval
id: intro-umwelt-q1
type: mcq
mode: self
points: 1
prompt: >
  ¿Qué significa el concepto de Umwelt según Uexküll?
options:
  - [ ] El ambiente físico medido objetivamente
  - [x] El mundo perceptual único de cada organismo
  - [ ] El ecosistema global del planeta
  - [ ] La suma de todos los estímulos posibles
explanation: >
  Uexküll propuso que cada organismo vive en su propio mundo perceptual (Umwelt),
  construido por los estímulos que puede detectar y los significados que les asigna.
```
````

## Próximos Pasos

### Fase 2: Otros tipos de evaluación
- `short_ai`: Respuestas cortas con evaluación de IA
- `essay_ai`: Ensayos con evaluación asistida
- `code`: Evaluación de código
- `patch`: Evaluación de patches Max/MSP

### Fase 3: Features avanzadas
- Spaced repetition scheduling
- Peer review
- Adaptive difficulty
- Progress tracking
