
1. Los símbolos matemáticos se diferencian de otros símbolos por su función formal axiomática cerrada. 
2. No remiten a objetos del mundo sensible, sino a entidades ideales: números, funciones, conjuntos y operaciones. 
3. Son **operacionales** , cada símbolo implica reglas de manipulación con propiedades definidas. (En nuestros términos actuales podríamos decir que cada símbolo es una función o un objeto de código).
4. Solo pertenecen a un sistema formal que les da sentido por medio de axiomas (reglas(enunciados) sin necesidad de demostración que sirven como base para deducir otros enunciados) e inferencias (regla que genera otra proposición ).
5. Son unívocos y universales sintácticamente, es decir no enlazan con los lenguajes naturales. 
6. Son generativos y autopoiéticos = permiten derivar infinitas proposiciones válidas dentro de un conjunto de axiomas.


> [!NOTE] diferencia entre **enunciado** y **proposición**
> un enunciado es una **expresión** concreta ("*la nieve es blanca*") mientras que una **proposoción** es el contenido lógico o semántico de un enunciado ("la blancura de la nieve"), es formalizable. Y finalmente la **propiedad** es la asignación de un valor lógico a un objeto o variable. Es general ("el color, o x es blanco") y se convierte en proposición cuando se aplica a un objeto ("el color de la nieve es blanco").
> - **Enunciado**: 	Lingüístico	Frase expresada en lenguaje natural. Puede ser poética, ambigua o contextual.	“La nieve brilla con su blancura intacta.”
 > - **Proposición**:	Lógico-semántico	Contenido con valor de verdad, independiente del lenguaje.	“La nieve es blanca.”
> - **Propiedad**: 	Metafísico-lógico	Predicado abstracto que puede aplicarse a objetos.	“x es blanco” → $B(x)$
> - **Qualia**: Fenomenológico	Cualidad de la experiencia perceptiva interna, irreductible a lo objetivo	“La blancura que veo al mirar nieve bajo el sol”

7. Los símbolos formales tienen tipos definidos:
	1. constantes
	2. funciones
	3. relaciones
	4. variables
	5. cuantificadores
8. Los símbolos naturales, culturales o artísticos pueden ser:
	1. ambigüos
	2. polisémicos
	3. contextuales. 

## ontología de los símbolos matemáticos 

1.	Platonismo: los símbolos representan entidades abstractas que existen independientemente del lenguaje o la mente (Gödel, Penrose).
2.	Formalismo: los símbolos no significan nada por sí mismos; su valor reside en la manipulación de cadenas conforme a reglas (Hilbert, Bourbaki).
3.	Constructivismo/Intuicionismo: los símbolos representan construcciones mentales; su existencia depende de su constructibilidad (Brouwer).
4. Semiótica estructural (Peirce): los símbolos matemáticos como signos con reglas internas de funcionamiento.
5. Fenomenología (Husserl, Formale und transzendentale Logik): los símbolos son mediaciones entre lo intuible y lo ideal.
6. Teoría de categorías: se desplaza el foco desde los objetos a las relaciones estructurales entre ellos (Lawvere, Baez).



```dataviewjs
const rdfData = {
  "graph": [
    { id: "Nieve", type: "Objeto", label: "Nieve" },
    { id: "Blanco", type: "Propiedad", label: "Blanco" },
    { id: "P1", type: "Proposicion", sujeto: "Nieve", predicado: "Blanco" },
    { id: "E1", type: "Enunciado", expresa: "P1", lenguaje: "Lenguaje natural" },
    { id: "ZFC", type: "FormalSystem", label: "Zermelo-Fraenkel + AC" },
    { id: "Lambda", type: "FormalSystem", label: "λ-cálculo" },
    { id: "ZFC_BlancoSet", type: "Propiedad", expresadoEn: "ZFC", label: "{x ∈ Objetos | blanco(x)}" },
    { id: "lambdaBlanco", type: "Propiedad", expresadoEn: "Lambda", label: "λx.blanco(x)" },
    { id: "Sujeto1", type: "Sujeto", label: "Sujeto experiencial" },
    { id: "Q1", type: "Qualia", objeto: "Nieve", propiedad: "Blanco", percibidoPor: "Sujeto1", comment: "La experiencia subjetiva de la blancura" }
  ]
};

const get = id => rdfData.graph.find(el => el.id === id);

const enunciado = get("E1");
const proposicion = get(enunciado.expresa);
const sujeto = get(proposicion.sujeto);
const predicado = get(proposicion.predicado);
const qualia = rdfData.graph.find(e => e.type === "Qualia" && e.objeto === sujeto.id && e.propiedad === predicado.id);

let html = `<div style="font-family:monospace">`;

html += `<details open><summary>📘 Enunciado</summary>
  <ul>
    <li><b>Texto:</b> "${sujeto.label} es ${predicado.label}"</li>
    <li><b>Lenguaje:</b> ${enunciado.lenguaje}</li>
    <li><details><summary>📐 Proposición</summary>
      <ul>
        <li><b>Sujeto:</b> ${sujeto.label}</li>
        <li><b>Predicado:</b> ${predicado.label}</li>
        <li><details><summary>🎨 Propiedad Formal</summary>
          <ul>
            <li><b>ZFC:</b> ${get("ZFC_BlancoSet").label}</li>
            <li><b>λ-cálculo:</b> ${get("lambdaBlanco").label}</li>
          </ul>
        </details></li>
        <li><details><summary>🌈 Qualia</summary>
          <ul>
            <li><b>Experiencia:</b> ${qualia.comment}</li>
            <li><b>Perceptor:</b> ${get(qualia.percibidoPor).label}</li>
          </ul>
        </details></li>
      </ul>
    </details></li>
  </ul>
</details>`;

html += `</div>`;

dv.el("div", html, { cls: "rdf-viz" });
```


## preguntas guia

Entonces, la pregunta es si podemos generar un sistema simbólico con la generatividad de los símbolos matemáticos pero cuya teleología es la operación de fórmulas filosóficas o estéticas. 
Para esto comparemos los tipos definidos de distintos niveles de símbolos formales, naturales y lógicos: 


# Tipología comparada de símbolos formales, culturales e icónicos

| Tipo                    | Formalismo lógico clásico               | Iconicidad (Spencer-Brown, Peirce, etc.)                         | Semiótica natural/cultural               |
| ----------------------- | --------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| **1. Constantes**       | Símbolos fijos e invariantes (`0`, `a`) | Representaciones fijas dentro de distinciones (marcas, círculos) | Convenciones estilizadas o emblemas      |
| **2. Variables**        | Marcadores de lugar (`x`, `y`)          | Espacios sin marcar, contornos abiertos                          | Sujetos móviles, roles, arquetipos       |
| **3. Funciones**        | Aplicaciones (`f(x)`)                   | Transformaciones gráficas (cruzar fronteras)                     | Prácticas codificadas (rituales, gestos) |
| **4. Relaciones**       | Predicados (`R(x,y)`)                   | Conexiones topológicas o adyacencias (nodos/lazos)               | Relaciones simbólicas abiertas           |
| **5. Cuantificadores**  | Universal/Existencial (`∀`, `∃`)        | Iteración de marcas, recursividad, replicación                   | Generalizaciones narrativas o míticas    |
| **6. Ambigüedad**       | Prohibida (se busca univocidad)         | Admitida y regulada por la forma (distinción/cancelación)        | Central (polisemia, metáfora)            |
| **7. Operatividad**     | Reglas explícitas de inferencia         | Recursividad formalizada por *cálculo de distinción*             | Instrucciones implícitas                 |
| **8. Iconicidad**       | Nula, salvo diagramas complementarios   | Central: la forma **es** el contenido                            | Alta: el símbolo remite sensorialmente   |
| **9. Contextualidad**   | Rechazada (busca abstracción total)     | Intermedia: depende del *acto de distinción*                     | Fundamental                              |
| **10. Auto-referencia** | Paradojal (Russell, Gödel)              | Esencial: la marca se refiere a su propia operación              | Frecuente (metáforas sobre metáforas)    |


Pero avancemos con un sistema ad-hoc de representación de operaciones filosóficas, tomando 20 conceptos nucleares que se prestan a una formalización simbólica. A la vez cada símbolo podra tener transformadores (interesecciones, tensores, gradientes, bifurcaciones):



# aplicaciones

(● ∩ ⇄) → ○  
"El ser en devenir implica posibilidad"



# ref
```
@book{frege1892sinn,
  author = {Frege, Gottlob},
  title = {Über Sinn und Bedeutung},
  year = {1892},
  journal = {Zeitschrift für Philosophie und philosophische Kritik},
  volume = {100},
  pages = {25–50}
}

@book{tarski1944,
  author = {Tarski, Alfred},
  title = {The Semantic Conception of Truth and the Foundations of Semantics},
  journal = {Philosophy and Phenomenological Research},
  year = {1944},
  volume = {4},
  pages = {341–376}
}

@book{chalmers1996,
  author = {Chalmers, David},
  title = {The Conscious Mind: In Search of a Fundamental Theory},
  year = {1996},
  publisher = {Oxford University Press}
}

@book{church1932lambda,
  author = {Church, Alonzo},
  title = {A set of postulates for the foundation of logic},
  journal = {Annals of Mathematics},
  year = {1932},
  volume = {33},
  pages = {346–366}
}
```



