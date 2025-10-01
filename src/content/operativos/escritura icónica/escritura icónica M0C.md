 # introducción

sobre la necesidad de una escritura icónica para las artes. 
Puede partirse desde el concepto de tipo de dato, que implica una habilidad de memoria, la memoria implica una restricción. En computación los tipos primitivos son: enteros , coma flotante , cadenas alfanuméricas, estados llamables (funciones, métodos y clases), módulos, mapeos (diccionarios).
Los tipos compuestos se derivan de los primitivos, comibinan a estos a partir de "estructuras de datos" (ej. un array de enteros): vectores (arrays estáticos y dinámicos), registros / tuplas, y conjuntos. 
 
 
 
 ## escrituras lógico-formales con Spencer-Brown
Introducción a la escritura de distinciones de Spencer-Brown, comparación  con otros sistemas diagramáticos y aplicación en modelado agentes, materiales y procesos de  CyM.
La Clase 1 trabaja la distinción y la reducción operativa. La Clase 2 aborda la auto-referencia, la composición de procesos y un mini-proyecto aplicado con el modelo $I=\langle A,M,G,E,\Phi\rangle$.


## Clase 1 Distinguir marcar reducir de Laws of Form a grafos existenciales
- Objetivos
- Comprender la noción de trazar una distinción y la marca como operador
- Operar con las reglas de reducción *calling* y *crossing*
- Relacionar la escritura de Spencer-Brown con lógicas clásicas y los grafos existenciales de Peirce
- Conceptos clave
- Distinción marca espacio no marcado
- Reglas de *reducción* calling crossing
- Equivalencias con lógica proposicional $p\land q$ $p\lor q$ $\lnot p$ $p\Rightarrow q$ $\lnot(p\lor q)$ $p\leftrightarrow q$ $p\oplus q$
- Existential Graphs de Peirce como antecedente diagramático

### Secuencia didáctica 120 min
1. 10-30 Marca y espacio ejercicios de lectura y borrado por calling
2. 30-55 Crossing y normalización reducción hasta forma canónica
3. 55-70 Puente con lógica proposicional traducir $p\Rightarrow q$ y $\lnot(p\lor q)$ a marcas y volver a símbolos
4. 70-90 Boundary Logic básica convenciones tipográficas y ejercicios de reescritura
5. 90-115 Peirce en 25 minutos regiones cortes negación por encerramiento comparación rápida con la marca
6. 115-120 Cierre y dudas

- Ejercicios en clase
- Reducir 6 formas dadas hasta su forma mínima justificando cada paso
- Traducir entre notación de marcas y fórmulas $p\leftrightarrow q$ y leyes de De Morgan
- Dibujar el mismo enunciado en grafos existenciales y con marca y comentar diferencias de lectura
- Tarea breve
- Hoja de 10 reducciones cronometradas
- mini mapa cómo expresar $p\oplus q$ con marcas y validarlo con tabla de verdad

## Clase 2 Auto referencia ensamblajes y procesos de Varela a cálculos de procesos
- Objetivos
- Introducir re entrada y cálculo para auto referencia a partir de Spencer-Brown y Varela
- Entender agencia distribuida como ensamblaje lógico material
- Conectar escrituras diagramáticas de procesos con $I=\langle A,M,G,E,\Phi\rangle$ y con exo fórmulas
- Conceptos clave
- Re entrada clausura operacional esquemas de Varela criterios de estabilidad
- Ensamblajes y agencia distribuida aplicados a instrumentos colectivos
- Reescritura de procesos composición alambres como tipos cajas como transformaciones
- Exo fórmulas como restricciones energéticas y de acoplamiento para componer atractores

###  Secuencia didáctica 120 min
1. 0-15 Repaso activo de la Clase 1 con dos reducciones en vivo
2. 15-40 Re entrada dibujar y leer bucles auto referenciales identificar condiciones de estabilidad
3. 40-65 Agencia distribuida con marcas modelar $A$ agentes acoplados condición de coordinación
4. 65-90 Cálculo diagramático de procesos composición equivalencia por reescritura
5. 90-110 Aplicación a exorganología modelar $I=\langle A,M,G,E,\Phi\rangle$ de un instrumento colectivo propio y extraer una exo fórmula mínima
6. 110-120 Presentaciones relámpago y retroalimentación

### Ejercicios en clase
- Dibujar una re entrada estable e inestable y explicar qué parámetros la vuelven estable
- Especificar con marcas la condición función colapsa si falta cualquier agente para un instrumento colectivo
- Bocetar un diagrama de proceso para voz→máscara→haptics→voz e identificar puntos de control
- Entregable final
- Lámina A4 con 1 diagrama con marcas del instrumento 2 traducción a procesos 3 exo fórmula de 3-5 cláusulas tipo fuentes sumideros umbrales acoplamientos 4 nota breve sobre estabilidad y controlabilidad.

## Materiales base sugeridos
- William Bricken Boundary Logic from the Beginning
- Louis H Kauffman Laws of Form exploraciones introductorias
- Francisco Varela A Calculus for Self Reference
- CS Peirce Existential Graphs tutoriales introductorios
- Sun Joo Shin The Logical Status of Diagrams fundamentos de validez diagramática
- Barwise y Etchemendy materiales de Hyperproof y visualización lógica para traducción simbólico diagramática
## Criterios de evaluación formativa
- Corrección de reducciones y traducciones entre escrituras
- Claridad del modelo del instrumento colectivo identificación de $A$ $M$ $G$ $E$ $\Phi$
- Exo fórmula con cláusulas operables y verificables
- Argumento breve sobre estabilidad sensibilidad y control del sistema propuesto
## Qué preparar antes de empezar
- Plantilla con 12 casillas para reducciones y una hoja de equivalencias básicas
- Lista de 6 enunciados lógicos relevantes a la práctica coordinación fallos redundancia
- Ejemplo propio de instrumento o boceto performativo para la parte aplicada de la Clase 2



# formas de escritura
## ASCII puro
- Marca: usa corchetes. Escribe [A] para “A marcado”.
- Concatenación: escribe X Y pegado como XY (dos expresiones adyacentes).
- Estado no marcado: como no existe un símbolo ASCII “vacío”, usaremos 0 para mostrar el resultado “en blanco”.
- Axiomas
- Calling: [][] → []
- Crossing: [[A]] → A
- Casos base
- [[]] → 0
- [][][A] → [][A] → [A]
- Ejemplos de reducción
- [[ [A] ]] → [A] → (no se reduce más sin contexto)
- [A][A] → [A]  (calling)
- [[ [ ] ]] se escribe como [[[]]] y reduce en dos pasos: [[[]]] → [0] → [0]  (si 0 se trata como un átomo)
- Re-entrada
- X = [X]  (ecuación de re-entrada; su “valor” no se estabiliza en 0 o en una marca única)


---

## LaTeX mínimo

### Convención
For the "mark," we'll use a **square box** (`\square`), a common symbol in logic and mathematics. For the "empty mark," we'll use a **hollow circle** (`\bigcirc`) to distinguish it from the "blank" symbol (`\varnothing`).

### Macros
Place the following macro definitions at the top of your document to ensure they are available for all subsequent equations.

$$
\newcommand{\lof}[1]{\boxed{#1}}
\newcommand{\m}{\bigcirc}
\newcommand{\blank}{\varnothing}
$$




## Axiomas
These are the foundational rules of the system.

* **Crossing:**
    $\lof{\lof{A}}=A$
* **Calling (Contraction):** Two empty marks contract into one.
    $$\m\ \m=\m$$
* **Base Case of Crossing:** Crossing an empty mark results in a blank.
    $\lof{\m}=\blank$
* 

---

## Ejemplos de Reducción
These examples demonstrate how the axioms are applied to simplify expressions.

* **Llamadas repetidas a un mismo término:**
    $$\lof{A}\,\lof{A}\Rightarrow\lof{A}$$
* **Doble anidamiento:**
    $$\lof{\lof{A}}\Rightarrow A$$
* **Re-entrada:**
    $$X=\lof{X}$$



## Notas prácticas
- ASCII
- Usa [] para anidar y escribe 0 cuando el resultado es “no marcado” para no perderlo visualmente en texto plano.
- Evita paréntesis u otros signos para no confundirlos con la marca; quédate solo con [] y concatenación.
- LaTeX
- \boxed{} es suficiente para docencia y apuntes rápidos. Para un trazo más “geométrico”, puedes sustituir \lof por \fbox o por un entorno TikZ, pero \boxed mantiene el flujo matemático.




## Equivalencias proposicionales (referenciales)

$p\land q$ Conjunción lógica  
$p\lor q$ Disyunción lógica  
$\lnot p$ Negación lógica  👌
$p\Rightarrow q$ Implicación lógica  
$\lnot(p\lor q)$ Negación de disyunción (ley de De Morgan)  
$p\leftrightarrow q$ Bicondicional (equivalencia)  
$p\oplus q$ Disyunción exclusiva (xor)  


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
•	Intersección (∩) → Coexistencia de propiedades (ej. Ser ∩ Tiempo = existencia temporal).
•	Unión (∪) → Coincidencia sin contradicción (ej. Devenir ∪ Diferencia).
•	Negación (¬) → Subversión del campo (ej. ¬Ser = Nada).
•	Inclusión (⊂) → Jerarquía ontológica (ej. Actualidad ⊂ Posibilidad).
•	Doble negación (¬¬) → Reafirmación paradojal (ej. ¬¬Devenir).
•	Implicación (→) → Transición lógica u ontológica (ej. Potencia → Actualidad).
•	Conmutación o torsión (↻) → Transformación sin pérdida (ej. Identidad ↻ Diferencia).



## Tipología comparada de símbolos formales, culturales e icónicos

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


