

Un Marco para el Desarrollo de un Simulador Nuclear Especulativo


Introducción: El Juego como Instrumento Crítico

El presente informe detalla un marco conceptual y técnico para el desarrollo de un simulador web interactivo centrado en la reacción nuclear de la central Atucha I. Este proyecto trasciende la mera creación de un videojuego para posicionarse como un acto de Investigación-Creación (I-C), una metodología que concibe el proceso creativo como una forma de generación de conocimiento.1 En este paradigma, el artefacto final —en este caso, un juego que se ejecuta en la consola del navegador— no es simplemente un producto de entretenimiento, sino la "obra de arte" que materializa y encarna una investigación profunda sobre un fenómeno complejo.3 La física nuclear, y en particular la gestión de un reactor, representa una "experiencia vivida" que resulta difícil de aprehender únicamente a través de modelos científicos tradicionales.3 El enfoque de I-C permite fusionar las consideraciones teóricas de la física de reactores con la producción de un objeto mediático que integra dimensiones pedagógicas, lúdicas y de mediación tecnológica, facilitando una apropiación más profunda del conocimiento.2

El simulador se diseña como un instrumento de diseño especulativo.4 Su finalidad no es predecir o replicar con absoluta fidelidad el funcionamiento de Atucha I, sino emplear el diseño como un catalizador para una visión alternativa.7 Utiliza el marco interrogativo "¿Qué pasaría si...?" para provocar el debate y la reflexión sobre los sistemas sociotécnicos de la energía nuclear.4 Al situar al jugador en el rol de un científico, el juego se convierte en una herramienta para explorar las incertidumbres inherentes y las responsabilidades asociadas a la gestión de una tecnología tan potente y ambivalente.7 No busca ofrecer respuestas definitivas, sino generar preguntas críticas y abrir un espacio para el pensamiento compartido sobre las implicaciones de estas tecnologías.4
La elección del medio —la consola del navegador, JavaScript y la WebAudio API— sitúa esta obra en el linaje del Net.art y el Arte Generativo.8 Se trata de una pieza que no puede existir fuera de su entorno digital y de red, un arte de la web, no meramente en la web.11 Este entorno digital se concibe como un
"Tercer Espacio" 12, un territorio neutral donde las disciplinas del arte (diseño de juegos, sonificación) y la ciencia (física nuclear) pueden interactuar en condiciones de equilibrio. Este espacio fomenta la superación de las dinámicas institucionales de cada disciplina y permite la construcción de una identidad compartida para el participante, no ya como mero jugador, sino como un "practicante de arte-ciencia".12
De este modo, el simulador se transforma en una sonda fenomenológica. La investigación en creación artística a menudo se apoya en aproximaciones fenomenológicas y heurísticas para estudiar la experiencia vivida.3 La petición del usuario de que el jugador
sea un científico, y no solo observe una simulación, es clave. Al combinar estos elementos, el juego deja de ser una simulación de un reactor para convertirse en una simulación de la experiencia de controlar un reactor. Su validez como investigación artística no se medirá por su precisión cuantitativa, sino por su capacidad para generar una experiencia fenomenológica convincente y reveladora.3 El juego se convierte así en una investigación sobre el estado cognitivo y emocional de un individuo encargado de gestionar un proceso invisible, poderoso y potencialmente peligroso, elevando el proyecto de una herramienta didáctica a una obra de arte experiencial.

# Parte I: El Paradigma Atucha - Una Fundación en Física y Arte


# 1.1 La Física de la Controlabilidad: La Cinética de un Reactor PHWR

La viabilidad de un reactor nuclear como fuente de energía controlada, y por extensión, la mecánica central de este simulador, depende de un delicado equilibrio temporal en la liberación de neutrones. La física que gobierna este equilibrio, especialmente en un reactor de agua pesada presurizada (PHWR) como Atucha I, proporciona el conjunto de reglas fundamentales para nuestro sistema de juego.

## El Rol Central de los Neutrones Retardados

La clave de la controlabilidad de un reactor reside en la existencia de dos poblaciones de neutrones generados por la fisión: los neutrones prontos y los neutrones retardados. Más del 99% de los neutrones son prontos, emitidos casi instantáneamente (en el orden de 10−17 segundos) tras la escisión de un núcleo de uranio.13 Si estos fueran los únicos neutrones, cualquier desviación hacia un estado supercrítico resultaría en un aumento exponencial de la potencia a una velocidad incontrolable para cualquier sistema mecánico.14
Sin embargo, una pequeña fracción de los neutrones, denotada por **β (beta)**, son retardados. Para el **Uranio-235**, esta fracción es de aproximadamente β≈0.0065 o 0.65%, y para el Plutonio-239, un subproducto del quemado del combustible, es aún menor, β≈0.0021.13 Estos neutrones no provienen directamente de la fisión, sino de la desintegración beta de ciertos productos de fisión altamente inestables, conocidos como
precursores.14 Un ejemplo canónico es el Bromo-87, que se desintegra con una vida media de 55.6 segundos en un estado excitado de Kriptón-87; este último núcleo, al tener un exceso de energía superior a la energía de enlace de un neutrón, lo emite de forma casi instantánea.13 El "retraso" en la aparición del neutrón está, por tanto, gobernado por la vida media del precursor, un proceso que es órdenes de magnitud más lento que la fisión misma.
Esta demora, que puede variar desde milisegundos hasta varios minutos, introduce una inercia en el sistema. Permite que la reacción en cadena se mantenga en un estado donde es subcrítica con respecto a los neutrones prontos, pero crítica gracias a la contribución de los retardados. Este estado, conocido como "pronto subcrítico, retardado crítico", es el régimen operativo de todos los reactores de potencia.15 La presencia de neutrones retardados ralentiza la respuesta temporal del reactor a una escala de tiempo que los sistemas de control mecánicos (como las barras de control) pueden gestionar eficazmente.14

## Reactividad y el Modelo de Cinética Puntual

Para modelar el comportamiento dinámico del reactor, se empleará un modelo de cinética puntual (point reactor kinetics). Este modelo simplifica la física al ignorar la distribución espacial del flujo de neutrones dentro del núcleo y centrarse exclusivamente en su comportamiento dependiente del tiempo.13 La variable central en este modelo es la
reactividad (ρ), una medida adimensional que describe la desviación del reactor de la criticidad. Se define como ρ=(keff​−1)/keff​, donde keff​ es el factor de multiplicación efectivo.15
Si ρ=0, el reactor es crítico (keff​=1) y la población de neutrones (y la potencia) es estable.
Si ρ>0, el reactor es supercrítico (keff​>1) y la potencia aumenta.
Si ρ<0, el reactor es subcrítico (keff​<1) y la potencia disminuye.
El motor físico del juego resolverá un sistema de ecuaciones diferenciales de cinética puntual: una para la población total de neutrones y, típicamente, seis ecuaciones adicionales, una para cada uno de los seis grupos principales de precursores de neutrones retardados, cada uno con su propia constante de decaimiento (λi​) y su fracción (βi​).13 Las acciones del jugador, como mover las barras de control o inducir fisiones en el nivel atómico, se traducirán directamente en cambios en el valor de
ρ.

## La Anomalía CANDU: Coeficientes de Reactividad

Atucha I es un reactor tipo CANDU, un diseño que utiliza uranio natural como combustible y agua pesada (D2​O) como moderador y refrigerante. Esta configuración da lugar a características de reactividad únicas que son fundamentales para la simulación y la jugabilidad.
Coeficiente de Temperatura del Combustible (FTC): Este coeficiente es negativo.19 A medida que la potencia del reactor aumenta, la temperatura del combustible de dióxido de uranio se eleva. Este aumento de temperatura provoca un ensanchamiento de las resonancias de absorción de neutrones del Uranio-238, un fenómeno conocido como
ensanchamiento Doppler (Doppler broadening).20 El U-238 captura así más neutrones que de otro modo podrían causar fisión en el U-235, lo que resulta en una inserción de reactividad negativa. Este es un mecanismo de autorregulación intrínseco y una característica de seguridad fundamental: un aumento de potencia tiende a contrarrestarse a sí mismo.20
Coeficiente de Vacío (Void Coefficient): A diferencia de los reactores de agua ligera, el coeficiente de vacío en un reactor CANDU es positivo.20 El agua pesada del refrigerante actúa tanto como moderador (ralentizando los neutrones) como absorbente de neutrones. Si el refrigerante hierve debido a un aumento de temperatura o una pérdida de presión, se forman burbujas de vapor (vacíos). La pérdida de agua pesada en los canales de refrigerante reduce la absorción de neutrones más de lo que reduce la moderación. El efecto neto es un aumento de la reactividad, es decir, una inserción de reactividad positiva.22 Esto crea un potencial bucle de retroalimentación positiva: un aumento de potencia puede causar ebullición, lo que a su vez aumenta la reactividad y, por tanto, la potencia, en un ciclo que puede volverse peligrosamente rápido.20 Aunque los sistemas de seguridad están diseñados para manejar esto, representa un desafío operativo crítico y una fuente perfecta de tensión para el juego.
La combinación de estos principios físicos define el núcleo de la experiencia de juego. Los neutrones retardados no son un mero detalle técnico, sino el recurso fundamental que el jugador debe gestionar. El "pool" de precursores de neutrones retardados puede conceptualizarse como un depósito de control. Si se agota (operando el reactor a muy baja potencia durante demasiado tiempo), el sistema se vuelve lento y corre el riesgo de apagarse (un estado de pérdida). Si se opera a una potencia demasiado alta de forma sostenida, no se da tiempo a que se acumule una población robusta de precursores, lo que hace que el reactor sea "nervioso", con una respuesta muy rápida y más propenso a alcanzar la criticidad pronta (otro estado de pérdida).
Por otro lado, el coeficiente de vacío positivo actúa como un multiplicador de riesgo volátil. El jugador puede verse tentado a operar el reactor a mayor temperatura para generar más potencia (un posible mecanismo de puntuación), pero esto aumenta el riesgo de ebullición del refrigerante. Una vez que se forman vacíos, la retroalimentación positiva entra en juego, haciendo que el sistema sea exponencialmente más difícil de controlar. Esto crea una tensión dinámica entre la eficiencia y la seguridad, reflejando directamente los desafíos operativos del mundo real de un reactor como Atucha I.

## 1.2 De la Ciencia al Sistema: Estrategias de Transposición Artística

Para transformar el complejo conjunto de principios de la física de reactores en un sistema jugable y estéticamente coherente, es necesario emplear una serie de estrategias de transposición. Estas estrategias no buscan una simplificación trivial, sino una traducción significativa que preserve la esencia del fenómeno original mientras lo adapta a un nuevo medio expresivo.

## Transposición Didáctica: Del "Saber Sabio" al "Saber Enseñado"

El proyecto adoptará el concepto de transposición didáctica de Yves Chevallard, que describe el proceso por el cual el conocimiento científico ("savoir savant") se transforma en un objeto de enseñanza ("objet d'enseignement").23 Este proceso implica varias operaciones clave que se aplicarán directamente al diseño del juego:
Desincretización y Despersonalización: El conocimiento científico, a menudo holístico y personal para el investigador, se descompone en elementos discretos y se presenta como un conjunto de reglas objetivas.23 En el juego, la compleja física de la difusión de neutrones se descompone en las reglas del modelo de cinética puntual y las interacciones del nivel atómico.
Programabilidad: El conocimiento se organiza en una secuencia que permite un aprendizaje progresivo.23 La estructura de dos niveles del juego es una manifestación directa de esto. El jugador primero interactúa con los controles macroscópicos (Nivel I) y luego puede "profundizar" en la mecánica fundamental de la fisión (Nivel II), construyendo una comprensión desde lo general a lo específico. El juego estructura la adquisición de este "saber" a través de la experiencia práctica, un enfoque de "aprender haciendo".23

## Ostranenie: Hacer el Mundo Atómico Tangible y Extraño

La técnica artística central para el nivel atómico del juego será la ostranenie, o desfamiliarización, un concepto acuñado por el formalista ruso Viktor Shklovsky.24 El objetivo de esta técnica no es simplemente mostrar algo, sino "crear la sensación de ver, y no meramente reconocer".25 Dado que el reino atómico es fundamentalmente imperceptible para los sentidos humanos, no estamos representando algo familiar de una manera extraña, sino que estamos haciendo perceptible algo radicalmente desconocido.
El propósito es prolongar y dificultar deliberadamente el proceso de percepción, ya que este proceso es un fin estético en sí mismo.24 Las decisiones artísticas sobre el sonido y los gráficos del nivel atómico buscarán "hacer la piedra pétrea": dar al jugador una sensación visceral e intuitiva de las fuerzas en juego, más allá de la comprensión abstracta de las ecuaciones. Se le obligará a ver con ojos nuevos, a través de una representación que es deliberadamente artística y no fotorrealista, forzando una nueva perspectiva sobre los conceptos abstractos de fisión, moderación y reacción en cadena.27

## La Metáfora como Puente entre el Arte y la Ciencia

El simulador en su totalidad funcionará como una compleja metáfora visual y sistémica.28 Las metáforas no son meros adornos; cumplen funciones epistémicas (relacionadas con el conocimiento) y estéticas tanto en el arte como en la ciencia.29 En este proyecto:
La representación de un neutrón como una partícula controlable por el jugador es una metáfora de la agencia humana en el proceso nuclear.
El sistema de puntuación, basado en la estabilidad, es una metáfora del objetivo operativo real de un reactor.
El paisaje sonoro generativo es una metáfora del estado interno e invisible del núcleo del reactor.
Estas metáforas permiten al jugador construir una conexión personal y emocional con los datos abstractos y los sistemas complejos.28 Al igual que las obras de artistas como Damien Hirst o Felix Gonzalez-Torres utilizan objetos físicos para metaforizar conceptos abstractos como la muerte o la pérdida 30, el juego utiliza un sistema interactivo para metaforizar la controlabilidad, el riesgo y la volatilidad de la energía nuclear.

## Arte Generativo y el Artista como Creador de Reglas

El juego es, en su esencia, una obra de arte generativo.31 El papel del desarrollador no es guionizar cada resultado posible, sino definir las reglas del sistema autónomo (el motor de física) y permitir que surja un comportamiento emergente e impredecible a partir de la interacción del jugador y los elementos de aleatoriedad.8 Este enfoque refleja la naturaleza intrínsecamente estocástica de los procesos nucleares. La "impersonalidad" del algoritmo que genera los eventos 8 se contrapone a la agencia directa y personal del jugador, creando un diálogo fascinante entre el ser humano y el sistema, entre la intención y la emergencia. El desarrollador actúa como un director de orquesta que define los parámetros, pero el resultado final es único e impredecible en cada sesión de juego.8
La siguiente tabla sirve como documento de diseño central, asegurando que cada mecánica de juego esté rigurosamente fundamentada en un principio científico verificable. Este ejercicio hace explícita la transposición didáctica y justifica cada elección de diseño, evitando la inclusión de mecánicas arbitrarias que no sirvan al propósito conceptual del proyecto.
Tabla 1: Matriz de Transposición de Concepto Científico a Mecánica de Juego

Concepto Científico (Savoir Savant)
Fuentes de Referencia
Metáfora Artística
Mecánica de Juego (Objet d'Enseignement)
Objetivo de la Experiencia del Jugador
Fracción de Neutrones Retardados (β) y Precursores
13
"Reserva de Control"
Un medidor de "Estabilidad" que se agota si la reacción es demasiado lenta y se recarga con una reacción estable. Una reserva baja hace que el reactor responda de forma errática.
Sentir la necesidad de equilibrar la velocidad de reacción con la estabilidad a largo plazo; experimentar la "inercia" del sistema.
Vida Media del Neutrón Pronto (lp​)
13
"Inercia del Sistema"
La velocidad a la que la potencia del reactor responde a los cambios de reactividad. Un tiempo de vida corto (como en un núcleo con mucho Plutonio) resulta en respuestas más rápidas y "nerviosas".
Percibir una diferencia tangible en la dificultad de control a medida que el combustible "envejece" y acumula Pu-239.
Criticidad Pronta (Reactivity ρ≥β)
14
"Punto de no Retorno" / "Dólar"
La reactividad se muestra en unidades de "dólares" ($), donde 1$=β. Alcanzar o superar 1$ desencadena una alarma crítica y un rápido aumento de potencia que conduce a un SCRAM.
Sentir un umbral de peligro claro y tangible; comprender el concepto de criticidad pronta como un límite operativo absoluto.
Coeficiente de Temperatura del Combustible (Negativo)
19
"Freno Térmico"
A medida que aumenta la temperatura del combustible, se introduce automáticamente una pequeña cantidad de reactividad negativa, haciendo que el aumento de potencia se ralentice por sí solo.
Experimentar una sensación de autorregulación inherente al sistema, una fuerza que se opone a los cambios bruscos.
Coeficiente de Vacío (Positivo en CANDU)
20
"Riesgo de Volatilidad"
Si la temperatura del refrigerante supera un umbral crítico (ebullición), se introduce una reactividad positiva, creando un bucle de retroalimentación que acelera drásticamente el aumento de potencia.
Sentir el peligro inherente de llevar el reactor a sus límites operativos; experimentar una pérdida de control exponencial.
Envenenamiento por Xenón y Samario
13
"Inercia de Apagado"
Tras un apagado (SCRAM), la acumulación de productos de fisión que absorben neutrones (venenos) añade reactividad negativa, haciendo muy difícil reiniciar el reactor durante un período de tiempo.
Comprender que las decisiones tienen consecuencias a largo plazo; el reactor no es un simple interruptor de encendido/apagado.


# Parte II: Diseño y Mecánicas - Los Dos Mundos del Reactor

El diseño del simulador se articula en torno a un bucle de juego central que conecta dos niveles de interacción distintos pero interdependientes: una vista macroscópica de la sala de control y una vista microscópica del núcleo atómico. Esta dualidad estructural permite al jugador alternar entre la gestión de las consecuencias sistémicas y la manipulación de las causas fundamentales.

## 2.1 El Bucle Central: El Ritmo de la Estabilidad

A diferencia de muchos juegos que se centran en la maximización de una métrica, el objetivo principal aquí no es generar la máxima potencia posible, sino mantener una producción de energía estable que se ajuste a una demanda externa fluctuante, simulando las necesidades de una red eléctrica real. La puntuación del jugador será una función compuesta, premiando la estabilidad (el tiempo que la producción de energía se mantiene dentro de un rango objetivo) y la eficiencia (la energía total generada a lo largo del tiempo). Este enfoque desplaza el foco del crecimiento desenfrenado a la gestión y el control precisos.

### Mecánica Central: Control de la Reactividad

La interacción fundamental del jugador con el sistema es la gestión de la reactividad (ρ). Esta se logra a través de dos acciones principales que corresponden a los dos niveles del juego:
Barras de Control (Nivel Macroscópico): El jugador puede insertar o retirar las barras de control del núcleo. La inserción de las barras, hechas de un material absorbente de neutrones como el cadmio, introduce reactividad negativa, ralentizando la reacción en cadena. Su retirada introduce reactividad positiva, acelerándola. Este será el principal instrumento del jugador para realizar ajustes gruesos y responder a grandes cambios en la demanda de potencia.
Fisión a Nivel Atómico (Nivel Microscópico): Al cambiar a la vista interior, el jugador puede inducir fisiones directamente. Cada fisión exitosa en este nivel proporciona una pequeña y precisa inyección de reactividad positiva. Este mecanismo permite realizar ajustes finos y mantener la estabilidad cuando las barras de control son demasiado imprecisas.

### Estados de Fallo

El juego presenta tres estados de fallo principales, cada uno derivado de una condición física real del reactor:
SCRAM (Apagado de Emergencia): Si la reactividad aumenta demasiado rápido (tasa de cambio de potencia positiva) o si la temperatura del combustible o del refrigerante excede un umbral crítico, el sistema activa automáticamente un SCRAM. Todas las barras de control se insertan de golpe en el núcleo, deteniendo la reacción en cadena. En el juego, esto se representa como una "pausa" forzada durante la cual el jugador es penalizado (por ejemplo, perdiendo una parte de la "integridad del reactor" o puntos significativos). Es un fallo grave pero recuperable.
Fusión del Núcleo (Meltdown): Si un SCRAM no logra contener el aumento de potencia —por ejemplo, debido a un bucle de retroalimentación positiva por el coeficiente de vacío que es demasiado rápido— o si múltiples sistemas de seguridad fallan, se produce una fusión del núcleo. Esta es la condición de "Game Over" definitiva, que representa un fallo catastrófico e irrecuperable.
Parada (Stall): Si la tasa de reacción cae a un nivel demasiado bajo durante un período prolongado, la reacción en cadena no puede sostenerse y se extingue. Esto también es una condición de "Game Over", que representa un fracaso en el mantenimiento del proceso nuclear.
En lugar de un sistema de "vidas" tradicional, el jugador gestionará un medidor de "Integridad del Reactor". Cada evento adverso, como un SCRAM o un sobrecalentamiento prolongado, reducirá este medidor. Si la integridad del reactor llega a cero, el siguiente fallo operativo importante resultará inevitablemente en una fusión del núcleo. Esto crea una sensación de desgaste y riesgo acumulativo, en lugar de fallos binarios y discretos.

## 2.2 Diseño de Nivel I - La Sala de Control Macroscópica

Este nivel representa la interfaz del operador con el sistema global del reactor. Su estética será la de un terminal informático retrofuturista, renderizado completamente en la consola del desarrollador del navegador.

### Interfaz e Información

La interfaz utilizará una combinación de texto, caracteres de bloque Unicode (como █, ▓, ▒, ░ para barras de progreso) y posiblemente estilos CSS o códigos de escape ANSI para el color, con el fin de presentar la información crítica de manera clara y estilizada.
Potencia de Salida (MW): Se mostrará como un valor numérico y una barra de progreso gráfica.
Demanda Objetivo (MW): Un indicador móvil o un valor numérico cambiante que el jugador debe igualar.
Reactividad (ρ): Se mostrará en dólares ($), una unidad estándar en la física de reactores donde 1$ representa el punto de criticidad pronta (ρ=β). Esta elección terminológica añade una capa de autenticidad.
Flujo de Neutrones: Un valor numérico simple o un indicador parpadeante cuya frecuencia visual refleje la intensidad.
Temperatura (Combustible y Refrigerante): Dos barras de progreso y valores numéricos. Un umbral crítico, que si se cruza activa el riesgo del coeficiente de vacío positivo, estará claramente marcado en rojo.
Posición de las Barras de Control: Un indicador visual que muestra el porcentaje de inserción de las barras en el núcleo.
Integridad del Reactor: La "barra de salud" del sistema.

### Desafíos y Conectividad

La demanda de energía externa fluctuará de forma impredecible, obligando al jugador a realizar ajustes constantes. Además, pueden ocurrir eventos aleatorios, como un fallo temporal en una bomba de refrigeración o una perturbación en la red, que requieran respuestas rápidas y precisas para evitar un SCRAM.
Este nivel macroscópico es una abstracción de las consecuencias. La estabilidad y los parámetros que el jugador observa aquí son el resultado directo de la suma de miles de millones de eventos que ocurren en el nivel atómico. Una reacción en cadena bien gestionada en el Nivel II se traduce en una producción de energía estable y controlable en el Nivel I.

## 2.3 Diseño de Nivel II - El Ballet Atómico

Este nivel es una "vista de zoom" al corazón del reactor, activada por el jugador cuando necesita un control más fino. La consola muestra una rejilla 2D que representa una sección transversal del núcleo del reactor.

### Interfaz y Entidades

U: Un núcleo fisionable de Uranio-235.
M: Una molécula de moderador (Agua Pesada).
C: Material de una barra de control.
n: El neutrón controlado por el jugador.
*: Un neutrón libre (no controlado, producto de una fisión).

### Jugabilidad

El jugador utiliza las teclas de flecha para mover su neutrón (n) a través de la rejilla. El objetivo es provocar y sostener una reacción en cadena.
Fisión Exitosa: Cuando el neutrón del jugador (n) colisiona con un núcleo de U, este desaparece. En su lugar, se renderiza un destello de energía (por ejemplo, un carácter * de color brillante) y se generan 2 o 3 nuevos neutrones libres (*) que se mueven en direcciones aleatorias. El neutrón del jugador (n) reaparece en el borde de la pantalla, listo para ser controlado de nuevo. Este evento añade una pequeña cantidad inmediata de reactividad positiva al modelo físico global.
Interacción con el Moderador: Moverse a través de las casillas M ralentiza la velocidad del neutrón del jugador. Este es un mecanismo crucial, ya que los neutrones deben ser ralentizados a energías térmicas para tener una alta probabilidad de fisionar el U-235.33 Si el jugador se mueve demasiado rápido, su neutrón podría atravesar un núcleo de
U sin causar una fisión, representando un neutrón de alta energía que es más propenso a ser capturado o escapar.
Interacción con las Barras de Control: Si el neutrón del jugador (n) o un neutrón libre (*) colisiona con una casilla C, es absorbido y desaparece del juego. Esta es la representación microscópica de la inserción de reactividad negativa.

### Visualización de la Reacción en Cadena

El objetivo del jugador en este nivel es crear una cascada. Una fisión exitosa libera neutrones libres, que pueden a su vez colisionar con otros núcleos de U, creando una reacción en cadena visible a través de la rejilla.33 El jugador debe actuar rápidamente para iniciar la siguiente fisión y mantener la tasa de reacción global, manipulando directamente el principio de
keff​>1. La retroalimentación visual se inspira en simulaciones interactivas como las de PhET 35 y otros explicadores visuales de la física nuclear 36, pero traducida a la estética minimalista y abstracta de la consola.

# Parte III: La Ecología Sónica - Sonido Generativo con la WebAudio API

El diseño de sonido para este simulador rechaza el uso de efectos de sonido pregrabados y estáticos. En su lugar, se propone un sistema de sonido generativo y en tiempo real que funcione como una extensión de la interfaz de usuario, sonificando el estado invisible del reactor. Este enfoque se inspira en las filosofías compositivas de pioneros de la música electrónica y contemporánea como Iannis Xenakis y Gérard Grisey.

## 3.1 Sonificando lo Invisible: Del Efecto de Sonido al Sistema Viviente


### El Enfoque Espectral/Estocástico

El paisaje sonoro del juego será un sistema dinámico que traduce los datos del modelo físico en sonido.
Xenakis y la Estocástica: Se utilizará la aleatoriedad controlada (procesos estocásticos) para generar eventos sonoros, reflejando la naturaleza probabilística de la desintegración radiactiva y la fisión nuclear.38 La densidad, el timbre y la distribución espacial de "granos" sonoros individuales representarán directamente el flujo de neutrones y otros parámetros del reactor. No se compone una pieza musical, sino un sistema que genera música a partir de la física.
Grisey y el Objeto Sonoro: Se tratará el sonido global del reactor como un único "organismo vivo" que evoluciona en el tiempo.42 El "timbre" del reactor no es una cualidad estática, sino un proceso dinámico. Se reemplazará la idea de
timbre-matière (el timbre inherente a un instrumento) por la de timbre-son (el timbre como una función de los componentes acústicos del propio sonido).42 El sonido del juego será una representación acústica directa del modelo físico, donde los armónicos, las frecuencias y las texturas cambian en respuesta a las fluctuaciones de la simulación. La música es el resultado de la física, no una capa superpuesta.

### El Ruido como Semiosis

El diseño sonoro abrazará el "ruido" no como un artefacto indeseado, sino como un portador de significado: ruido como semiosis.43 El zumbido, el crepitar y el siseo del reactor no son un ambiente de fondo; son la interfaz principal a través de la cual el jugador percibe el estado del sistema de forma intuitiva. El sistema artístico transforma el "ruido" de los datos brutos de la simulación en la "información" de un paisaje sonoro perceptible y cargado de significado.43

### Objetivos Estéticos

El paisaje sonoro se compondrá de varias capas interconectadas:
Zumbido/Drone Profundo: Un tono fundamental representará el estado operativo base del reactor. Su tono, volumen y complejidad armónica (la riqueza de sus sobretonos) serán modulados por la potencia de salida y la temperatura del núcleo.
Crepitaciones de Fisión: Clics o chasquidos agudos y percusivos representarán fisiones individuales. La densidad y el volumen de estos sonidos se mapearán directamente al flujo de neutrones, creando una textura que va desde un chisporroteo suave hasta un rugido crepitante.
Brillo de Reactividad: Una capa de ruido de alta frecuencia, procesada a través de un filtro, cuyo brillo y frecuencia de corte se mapearán a la reactividad (ρ). A medida que la reactividad se acerca a $1$ (criticidad pronta), el sonido se volverá más brillante, agudo e "inestable".
Lavado de Temperatura: Un ruido de banda ancha filtrado (low-pass) o un denso clúster de osciladores cuyo carácter cambia con la temperatura del combustible y el refrigerante. A medida que la temperatura aumenta, el sonido se volverá más distorsionado, saturado o disonante, transmitiendo una sensación de tensión y sobrecalentamiento.
Actuadores de las Barras de Control: Sonidos mecánicos y discretos generados cuando el jugador ajusta las barras, proporcionando una retroalimentación auditiva clara y satisfactoria para las acciones del usuario.

## 3.2 Un Plan para la API de WebAudio

Para implementar este paisaje sonoro generativo, se utilizará la API de WebAudio de JavaScript, aprovechando su arquitectura de enrutamiento modular y sus capacidades de síntesis en tiempo real.

### Arquitectura del Gráfico de Audio

Se construirá un gráfico de enrutamiento de audio modular.47 El núcleo constará de varios nodos de fuente (osciladores, búferes de ruido) que se alimentarán a través de nodos de ganancia individuales para cada "voz" (zumbido, crepitaciones, etc.). Estos se mezclarán y se dirigirán a un nodo de ganancia maestro antes de llegar al destino final (
audioCtx.destination), permitiendo un control granular sobre cada elemento de la mezcla.

### Plan de Implementación de Nodos

Zumbido/Drone (OscillatorNode): Un OscillatorNode de baja frecuencia (tipo 'sawtooth' o 'sine') proporcionará el tono fundamental. Sus parámetros frequency y detune serán modulados por la potencia y la temperatura. Se puede añadir un segundo oscilador ligeramente desafinado para crear un efecto de batido y enriquecer la textura.49
Crepitaciones de Fisión (AudioBufferSourceNode): Se creará un AudioBuffer corto que contenga un único impulso o un fragmento de ruido blanco. Para generar una crepitación, se creará un nuevo AudioBufferSourceNode, se le asignará este búfer y se programará para que se reproduzca inmediatamente con .start(0). La frecuencia con la que se crean y reproducen estos nodos estará directamente ligada al valor del flujo de neutrones del motor físico.
Brillo de Reactividad (BiquadFilterNode): Un AudioBufferSourceNode reproduciendo ruido blanco en bucle 50 se conectará a un
BiquadFilterNode de tipo 'lowpass'. El AudioParam frequency del filtro se mapeará directamente al valor de la reactividad. A medida que ρ aumenta, la frecuencia de corte del filtro subirá, permitiendo que pasen más altas frecuencias y creando un barrido dinámico de un sonido sordo a uno brillante y siseante.47
Lavado de Temperatura (WaveShaperNode o múltiples OscillatorNode): Para representar el aumento de la temperatura, se pueden explorar dos enfoques. El primero consiste en pasar el zumbido principal a través de un WaveShaperNode para añadir distorsión armónica no lineal.52 El segundo, inspirado en la música espectral 53, consiste en generar una "nube" de
OscillatorNode de alta frecuencia con afinaciones ligeramente diferentes, cuya ganancia colectiva esté controlada por la temperatura, creando una textura brillante y disonante que se intensifica con el calor.
Envolventes y Automatización (.linearRampToValueAtTime()): Todos los cambios dinámicos en los parámetros de audio (ganancia, frecuencia, etc.) se gestionarán utilizando los métodos de programación de AudioParam, como .linearRampToValueAtTime() y .exponentialRampToValueAtTime().50 Esto garantiza transiciones suaves y precisas a nivel de muestra, evitando clics y saltos abruptos, lo cual es crucial para mantener una experiencia auditiva inmersiva y profesional.
La siguiente tabla proporciona un plan técnico claro y procesable para el diseñador de sonido y el desarrollador, vinculando directamente los eventos del juego con técnicas de síntesis de audio específicas e implementables.
Tabla 2: Plan de Implementación de la API de WebAudio
Evento de Juego / Variable de Estado
Metáfora Sónica
Nodo(s) de Audio Primario(s)
Parámetro a Modular
Lógica de Modulación (Pseudo-código)
Efecto Estético Deseado
Aumento del Flujo de Neutrones
"Aumento de la Tasa de Fisión"
AudioBufferSourceNode
Tasa de llamadas a .start()
tasa = flujo_neutrones * k; setInterval(crearChasquido, 1000 / tasa);
Una textura densa y crepitante, que pasa de chispas aisladas a un rugido.
Reactividad acercándose a 1$
"Acercándose a la Criticidad Pronta"
BiquadFilterNode
filter.frequency
frecFiltro = 400 + (reactividad / beta) * 8000;
Un silbido tenso y ascendente que aumenta en brillo e intensidad.
Aumento de la Temperatura del Refrigerante
"Sistema Sobrecalentándose"
WaveShaperNode
shaper.curve
curva = calcularCurvaDistorsion(temperatura);
Un zumbido profundo que se vuelve distorsionado, "enfadado" y saturado.
Potencia de Salida del Reactor
"Nivel de Operación Base"
OscillatorNode
osc.frequency, gain.gain
frec = 100 + (potencia / maxPotencia) * 50;
Un drone fundamental cuyo tono y volumen reflejan la potencia general del reactor.
Activación de las Barras de Control
"Intervención Mecánica"
OscillatorNode + GainNode (con envolvente)
gain.gain
gain.setValueAtTime(0, t0); gain.linearRampToValueAtTime(1, t0 + 0.01); gain.linearRampToValueAtTime(0, t0 + 0.2);
Un sonido de actuador mecánico, corto y definido, para la retroalimentación de la acción.
Evento de SCRAM
"Apagado de Emergencia"
Múltiples nodos
masterGain.gain
masterGain.gain.exponentialRampToValueAtTime(0.001, t_actual + 1.5);
Un rápido silenciamiento de todos los sonidos del reactor, acompañado de un sonido de alarma claro y distinto.


Parte IV: Arquitectura Técnica e Implementación

Esta sección detalla la estructura del software, las técnicas de visualización en la consola y proporciona fragmentos de código ejemplares para guiar la implementación práctica del simulador en JavaScript.

4.1 Estructurando la Simulación en JavaScript

Para garantizar la mantenibilidad, la claridad y la separación de responsabilidades, la aplicación se estructurará en un diseño modular. Cada componente tendrá una función específica y se comunicará con los demás a través de una capa de gestión central.
PhysicsEngine (Motor de Física): Este será un módulo de JavaScript puro, sin dependencias externas. Contendrá las funciones matemáticas que implementan el modelo de cinética puntual del reactor.13 Su única responsabilidad será recibir el estado actual del sistema (población de neutrones, concentraciones de precursores, temperaturas) y las entradas del jugador (cambios de reactividad), y calcular el estado del sistema para el siguiente paso de tiempo (
dt). No tendrá conocimiento de la renderización ni del audio.
GameStateManager (Gestor de Estado del Juego): Actuará como el eje central de la aplicación. Mantendrá el objeto de estado completo del reactor (potencia, temperatura, reactividad, etc.). Orquestará el flujo de datos: en cada ciclo, llamará al PhysicsEngine para actualizar el estado y luego notificará a los otros módulos (renderizador y motor de audio) con la nueva información.
ConsoleRenderer (Renderizador de Consola): Este módulo será responsable de toda la salida visual. Recibirá el objeto de estado del GameStateManager y lo traducirá en el texto y los gráficos que se mostrarán en la consola del desarrollador.
AudioEngine (Motor de Audio): De manera similar, este módulo recibirá el estado actualizado y ajustará los parámetros del gráfico de la WebAudio API en consecuencia, modulando el paisaje sonoro en tiempo real.

Bucle de Juego (Game Loop)

La simulación será impulsada por un bucle central, implementado preferiblemente con requestAnimationFrame para una animación suave, o con setInterval para un control de tiempo más estricto si es necesario. En cada "tick" del bucle, se ejecutarán las siguientes operaciones en orden:
Leer Entradas: Comprobar si el jugador ha presionado alguna tecla (para mover las barras de control o interactuar en el nivel atómico).
Actualizar Estado: Pasar las entradas al GameStateManager, que a su vez invocará al PhysicsEngine para calcular el nuevo estado del reactor.
Renderizar Vista: Llamar al ConsoleRenderer para que borre la consola y dibuje la nueva representación visual del estado actualizado.
Actualizar Audio: Llamar al AudioEngine para que module los parámetros de sonido basándose en el nuevo estado.

4.2 Visualización en la Consola

La elección de la consola del desarrollador como lienzo es una restricción creativa que define la estética del proyecto. Se evitarán las bibliotecas gráficas tradicionales en favor de técnicas que aprovechen el entorno basado en texto.
Gráficos Basados en Caracteres: Se utilizarán caracteres de dibujo de cajas (por ejemplo, │, ─, ┌, ┐) para crear los marcos y divisiones de la interfaz de usuario. Los elementos de bloque (█, ▓, ▒, ░) servirán para construir barras de progreso y medidores gráficos, proporcionando una representación visual intuitiva de valores como la potencia y la temperatura.
Color y Animación: Se empleará la función console.log con la directiva de formato %c para aplicar estilos CSS al texto, permitiendo el uso de color para resaltar información crítica. Por ejemplo, los valores de temperatura podrían pasar de verde a amarillo y finalmente a rojo a medida que se acercan a un umbral peligroso. La animación simple se logrará borrando la consola con console.clear() y volviendo a renderizar toda la escena en cada fotograma del bucle de juego, creando la ilusión de movimiento y actualización en tiempo real.

4.3 Patrones de Código y Ejemplos

A continuación se presentan fragmentos de código simplificados para ilustrar los conceptos clave de la implementación.

Fragmento de Cinética Puntual (Simplificado con 1 grupo de precursores)

Este código muestra la lógica central del PhysicsEngine para un modelo simplificado. Una implementación completa utilizaría un bucle para manejar los 6 grupos de precursores.

JavaScript


// Función simplificada de actualización de la física del reactor
function updateKinetics(state, reactivity, dt) {
    // Parámetros para un reactor de U-235 (aproximados)
    const promptLifetime = 0.0001; // l_p, vida media del neutrón pronto en segundos
    const beta = 0.0065;           // β, fracción total de neutrones retardados
    const lambda = 0.08;           // λ, constante de decaimiento media del precursor en s^-1

    // Ecuación para la densidad de neutrones (n)
    const d_neutrons_dt = ((reactivity - beta) / promptLifetime) * state.neutronPopulation + lambda * state.precursorConcentration;

    // Ecuación para la concentración de precursores (C)
    const d_precursors_dt = (beta / promptLifetime) * state.neutronPopulation - lambda * state.precursorConcentration;

    // Integración de Euler para actualizar el estado
    state.neutronPopulation += d_neutrons_dt * dt;
    state.precursorConcentration += d_precursors_dt * dt;

    // La potencia es proporcional a la población de neutrones
    state.power = state.neutronPopulation * state.conversionFactor;
}



Fragmento de Audio Generativo (Brillo de Reactividad)

Este ejemplo ilustra cómo configurar y modular el "brillo de reactividad" utilizando la WebAudio API.

JavaScript


// --- Configuración inicial en AudioEngine ---
const audioCtx = new (window.AudioContext |

| window.webkitAudioContext)();

// Crear fuente de ruido blanco
const bufferSize = audioCtx.sampleRate * 2; // 2 segundos de ruido
const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
const output = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // Ruido blanco
}

const noiseSource = audioCtx.createBufferSource();
noiseSource.buffer = noiseBuffer;
noiseSource.loop = true;

// Crear el filtro paso bajo
const filter = audioCtx.createBiquadFilter();
filter.type = 'lowpass';
filter.frequency.value = 200; // Frecuencia inicial baja

// Conectar el gráfico: Ruido -> Filtro -> Salida
noiseSource.connect(filter).connect(audioCtx.destination);
noiseSource.start();

// --- Función de actualización llamada en el bucle de juego ---
function updateAudio(state) {
    const baseFreq = 200;
    const maxFreq = 8000;
    
    // Mapear la reactividad (de 0 a 1 dólar) a la frecuencia del filtro
    // state.beta es la fracción de neutrones retardados, que define 1$ de reactividad
    const reactivityInDollars = state.reactivity / state.beta;
    const filterFreq = baseFreq + Math.max(0, reactivityInDollars) * (maxFreq - baseFreq);

    // Programar el cambio de frecuencia suavemente para evitar clics
    filter.frequency.linearRampToValueAtTime(filterFreq, audioCtx.currentTime + 0.1);
}



# Conclusión: El Simulador como "Tercer Espacio" para la Indagación Encarnada

Este proyecto, en su culminación, trasciende la definición convencional de un juego para convertirse en un artefacto crítico. Su enfoque se alinea con la práctica de artistas contemporáneos como Rafael Lozano-Hemmer, quien utiliza la tecnología no como un fin en sí mismo, sino como un medio para hacer visibles e interactivos los sistemas invisibles de poder y control que nos rodean, ya sea la vigilancia masiva, la memoria pública 
o la biometría.55 De manera análoga, este simulador desvela el mundo invisible de la cinética nuclear, traduciendo sus principios abstractos en una experiencia sensorial y participativa.
El acto de jugar se transforma en una forma de indagación ética encarnada. Al igual que el arte transgénico de Eduardo Kac, como su obra GFP Bunny, utiliza la creación de un ser vivo para forzar un diálogo público sobre la genética, la ética y la relación entre especies 59, este simulador utiliza la creación de un
sistema interactivo para provocar la reflexión. La interacción del jugador no es un mero pasatiempo; es un ejercicio práctico de gestión del riesgo, el control y las consecuencias de manipular fuerzas poderosas e imperceptibles. El jugador se enfrenta a dilemas que son, en esencia, éticos: ¿hasta dónde se puede empujar el sistema en busca de eficiencia antes de que la volatilidad inherente lo vuelva incontrolable?
En última instancia, el simulador funciona como un "Tercer Espacio" 12, un entorno "antidisciplinar" donde las rígidas fronteras entre el artista, el científico y el público se disuelven.63 Facilita un enfoque colaborativo del conocimiento, donde la comprensión no se transmite de forma pasiva, sino que se co-diseña a través de la interacción.64 El jugador no solo aprende
sobre Atucha I; participa en una reflexión estructurada, estetizada y crítica sobre su propia naturaleza. El artefacto final se erige como un testimonio del poder de la Investigación-Creación para generar formas de conocimiento únicas y potentes, demostrando que la práctica artística, cuando se fusiona con el rigor conceptual y técnico, puede convertirse en una herramienta indispensable para la exploración y la crítica de nuestro complejo mundo tecnológico.65


# referencias 
¿Qué es I+C? - Minciencias, fecha de acceso: julio 9, 2025, https://minciencias.gov.co/investigacion-creacion/que-es-ic
creación. Un acercamiento a la investigación en las artes - ResearchGate, fecha de acceso: julio 9, 2025, https://www.researchgate.net/publication/333011073_Investigacion_-_creacion_Un_acercamiento_a_la_investigacion_en_las_artes
Investigación en creación artística. Principios ... - Papel Cosido, fecha de acceso: julio 9, 2025, https://papelcosido.fba.unlp.edu.ar/ojs/index.php/aei/article/download/1745/1694/3970
Diseño especulativo - Design Toolkit - UOC, fecha de acceso: julio 9, 2025, https://design-toolkit.recursos.uoc.edu/es/diseno-especulativo/
Diseño especulativo: entre ciencia y arte a través de las ficciones y la patafísica, fecha de acceso: julio 9, 2025, https://dspace.palermo.edu/ojs/index.php/cdc/article/view/8883
Futuros, especulaciones y diseños para otros horizontes posibles - Redalyc, fecha de acceso: julio 9, 2025, https://www.redalyc.org/journal/628/62875634008/html/
Diseño especulativo: arte para acercarnos a futuros alternativos - YouTube, fecha de acceso: julio 9, 2025, https://www.youtube.com/watch?v=qwBwn3Xn8ik
¿Qué es el arte generativo? | ESDESIGN - Escuela Superior de Diseño de Barcelona, fecha de acceso: julio 9, 2025, https://www.esdesignbarcelona.com/actualidad/diseno/arte-generativo
Arte generativo: pasado, presente y futuro - HackerNoon, fecha de acceso: julio 9, 2025, https://hackernoon.com/lang/es/arte-generativo-el-pasado-presente-y-futuro
Net art: ¿qué es el arte en red? | Blog CC - Creative Campus, fecha de acceso: julio 9, 2025, https://creativecampus.universidadeuropea.com/blog/net-art/
Del net art al arte algorítmico: cómo la inteligencia artificial ha reactivado un movimiento que nunca murió del todo - Marta Sanmamed, fecha de acceso: julio 9, 2025, https://sanmamed.net/net-art-inteligencia-artificial/
Examining science and art collaborations through a social ..., fecha de acceso: julio 9, 2025, https://civicsciencemedia.org/examining-science-and-art-collaborations-through-a-social-psychology-lens-reveals-the-need-for-third-spaces/
POINT REACTOR KINETICS - Mragheb, fecha de acceso: julio 9, 2025, https://mragheb.com/NPRE%20402%20ME%20405%20Nuclear%20Power%20Engineering/Point%20Reactor%20Kinetics.pdf
Delayed neutron - Wikipedia, fecha de acceso: julio 9, 2025, https://en.wikipedia.org/wiki/Delayed_neutron
Reactor Kinetics | Definition & Equations | nuclear-power.com, fecha de acceso: julio 9, 2025, https://www.nuclear-power.com/nuclear-power/reactor-physics/reactor-dynamics/reactor-kinetics/
CHAPTER 5 REACTOR DYNAMICS The neutron population in a nuclear reactor may change with time for a number of reasons - canteach candu, fecha de acceso: julio 9, 2025, https://canteach.candu.org/Content%20Library/19750105.pdf
Modeling of Reactor Kinetics and Dynamics - INL Digital Library - Idaho National Laboratory, fecha de acceso: julio 9, 2025, https://inldigitallibrary.inl.gov/sites/sti/sti/4633638.pdf
An Overview of Reactor Kinetics | UNENE, fecha de acceso: julio 9, 2025, https://unene.ca/wp-content/uploads/file/courses/un802/00-kinetics-overview.pdf
Analysis of Fuel Temperature Reactivity Coefficients According to Burn-up and Pu-239 Production in CANDU Reactor, fecha de acceso: julio 9, 2025, https://www.kns.org/files/pre_paper/1/13F-02C-13A-%EC%A0%95%ED%95%B4%EC%84%A0.pdf
21 Reactivity Effects of Temperature Changes - canteach candu, fecha de acceso: julio 9, 2025, https://canteach.candu.org/Content%20Library/20040721.pdf
Reactivity Coefficients | UNENE, fecha de acceso: julio 9, 2025, https://unene.ca/wp-content/uploads/file/courses/un802/14-reactivity-coefficients.pdf
Void coefficient - Wikipedia, fecha de acceso: julio 9, 2025, https://en.wikipedia.org/wiki/Void_coefficient
La transposición didáctica de los saberes artísticos - Revista Voces, fecha de acceso: julio 9, 2025, https://revistavoces.net/la-transposicion-didactica-de-los-saberes-artisticos/
Defamiliarization - Wikipedia, fecha de acceso: julio 9, 2025, https://en.wikipedia.org/wiki/Defamiliarization
Ostran(n)enie. - languagehat.com, fecha de acceso: julio 9, 2025, https://languagehat.com/ostrannenie/
Ostranenie - (Intro to Film Theory) - Vocab, Definition, Explanations | Fiveable, fecha de acceso: julio 9, 2025, https://library.fiveable.me/key-terms/introduction-to-film-theory/ostranenie
Aesthetics of defamiliarization in Hedeigger, Duchamp, and Ponge | Stanford Digital Repository, fecha de acceso: julio 9, 2025, https://purl.stanford.edu/cj591yd1063
How Art and Metaphor Help Students Unpack Complex Ideas - Smithsonian Magazine, fecha de acceso: julio 9, 2025, https://www.smithsonianmag.com/blogs/smithsonian-education/2020/12/15/mixed-metaphors/
Metaphors in arts and science | Walter Veit, fecha de acceso: julio 9, 2025, https://walterveit.com/wp-content/uploads/2021/05/veit-ney2021_article_metaphorsinartsandscience.pdf
Visual Metaphors in Contemporary Masterpieces, fecha de acceso: julio 9, 2025, https://www.raullara.net/visual-metaphors-in-contemporary-masterpieces/
Arte generativo - Wikipedia, la enciclopedia libre, fecha de acceso: julio 9, 2025, https://es.wikipedia.org/wiki/Arte_generativo
Arte generativo - Wikiwand, fecha de acceso: julio 9, 2025, https://www.wikiwand.com/es/articles/Arte_generativo
Nuclear Fission with Ping Pong Balls - ANSTO, fecha de acceso: julio 9, 2025, https://www.ansto.gov.au/media/2830/download
1,914 Nuclear Fission Stock Video Footage - 4K and HD Video Clips | Shutterstock, fecha de acceso: julio 9, 2025, https://www.shutterstock.com/video/search/nuclear-fission
Nuclear Fission - Fission | Chain Reaction | Atomic Nuclei - PhET Interactive Simulations, fecha de acceso: julio 9, 2025, https://phet.colorado.edu/en/simulation/nuclear-fission
Vision of Fission - YouTube, fecha de acceso: julio 9, 2025, https://m.youtube.com/playlist?list=PLUVoXk5JcKb5pG8apc3-j-NvM0t8iWfAj
Nuclear Fission Visually Explained - YouTube, fecha de acceso: julio 9, 2025, https://www.youtube.com/watch?v=ojkeBfOckIk
Meta-Xenakis - 38. The Algorithmic Music of Iannis Xenakis—What's ..., fecha de acceso: julio 9, 2025, https://books.openbookpublishers.com/10.11647/obp.0390/ch38.xhtml
Realtime Stochastic Decision Making for Music Composition and Improvisation, fecha de acceso: julio 9, 2025, https://music.arts.uci.edu/dobrian/AP2013/XenakisMattersDobrianChapter.pdf
Antes de haber llegado: Iannis Xenakis. - el cine signo - WordPress.com, fecha de acceso: julio 9, 2025, https://elcinesigno.wordpress.com/2011/06/09/antes-de-haber-llegado-iannis-xenakis/
Stochastic Synthesis: Origins and Extensions - Sergio Luque, fecha de acceso: julio 9, 2025, https://sergioluque.com/texts/Luque-Stochastic_Synthesis-Origins_and_Extensions.pdf
(PDF) The spectralism of Gérard Grisey: from the nature of the sound to the nature of listening - ResearchGate, fecha de acceso: julio 9, 2025, https://www.researchgate.net/publication/270282905_The_spectralism_of_Gerard_Grisey_from_the_nature_of_the_sound_to_the_nature_of_listening
(PDF) Ruido y semiosis - ResearchGate, fecha de acceso: julio 9, 2025, https://www.researchgate.net/publication/383231764_Ruido_y_semiosis
El sonido en la era electrónica (II) | Arte Resonante - Ars Sonorus, fecha de acceso: julio 9, 2025, https://educacionartes.com/Blog/el-sonido-en-la-era-electronica-ii/
El paisaje sonoro en la literatura electrónica: Nuevas representaciones intermediales y multimodales de la textura sonora | European Public & Social Innovation Review, fecha de acceso: julio 9, 2025, https://epsir.net/index.php/epsir/article/view/1298
Diseño sonoro y producción de sentido: la significación de los sonidos en los lenguajes audiovisuales - Dialnet, fecha de acceso: julio 9, 2025, https://dialnet.unirioja.es/descarga/articulo/5232251.pdf
Web Audio API - W3C, fecha de acceso: julio 9, 2025, https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html
Fundamentals - Web Audio API, fecha de acceso: julio 9, 2025, https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch01.html
How to Generate and Control Sound in the Browser Using the Web Audio API, fecha de acceso: julio 9, 2025, https://dev.to/hexshift/how-to-generate-and-control-sound-in-the-browser-using-the-web-audio-api-3gec
Synthesising Sounds with Web Audio API -, fecha de acceso: julio 9, 2025, https://sonoport.github.io/synthesising-sounds-webaudio.html
Advanced techniques: Creating and sequencing audio - Web APIs | MDN, fecha de acceso: julio 9, 2025, https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
Web Audio API - MDN Web Docs - Mozilla, fecha de acceso: julio 9, 2025, https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
Spectral music - Wikipedia, fecha de acceso: julio 9, 2025, https://en.wikipedia.org/wiki/Spectral_music
Tristan Murail - Wikipedia, la enciclopedia libre, fecha de acceso: julio 9, 2025, https://es.wikipedia.org/wiki/Tristan_Murail
Rafael Lozano-Hemmer | ArtNexus, fecha de acceso: julio 9, 2025, https://www.artnexus.com/es/magazines/article-magazine-artnexus/5d63427290cc21cf7c0a1de4/71/rafael-lozano-hemmer
La propuesta artística de Rafael Lozano-Hemmer | Entrevista - farolito, fecha de acceso: julio 9, 2025, https://farolito.me/entrevistas/artes-visuales/la-propuesta-artistica-de-rafael-lozano-hemmer/
Bosque atento, una exposición de Rafael Lozano-Hemmer - Crystal Bridges Museum of American Art, fecha de acceso: julio 9, 2025, https://crystalbridges.org/exhibitions/bosque-atento/
LOZANO-HEMMER: BAJO LA MIRADA TE(CN)OLÓGICA DEL GRAN OTRO, fecha de acceso: julio 9, 2025, http://blogeartemadrid.blogspot.com/2014/06/lozano-hemmer-bajo-la-mirada.html
The GFP Bunny - Eduardo Kac, fecha de acceso: julio 9, 2025, https://www.ekac.org/flashartsg.html
GFP Bunny Timeline - Eduardo Kac, fecha de acceso: julio 9, 2025, https://www.ekac.org/gfpbunny_essay.html
Eduardo Kac: Transgenic Artist - YouTube, fecha de acceso: julio 9, 2025, https://www.youtube.com/watch?v=3LSJVD0m1Mg&pp=0gcJCfwAo7VqN5tD
GFP Bunny - Eduardo Kac, fecha de acceso: julio 9, 2025, https://www.ekac.org/gfpbunny.html
A Framework for the Integration of Art & Science - NOEMA, fecha de acceso: julio 9, 2025, https://noemalab.eu/ideas/a-framework-for-the-integration-of-art-science/
The Art (and Science) of Collaboration - Stanford Woods Institute for the Environment, fecha de acceso: julio 9, 2025, https://woods.stanford.edu/news/art-and-science-collaboration
Artistic Research Methodology - Peter Lang Verlag, fecha de acceso: julio 9, 2025, https://www.peterlang.com/document/1051550
Tools for artistic research – Taiteellinen tutkimus, fecha de acceso: julio 9, 2025, https://disco.teak.fi/taiteellinen-tutkimus/en/tools-for-artistic-research/



---

  * **Nivel 1 (Macro):** Inspirado en *Zak McKracken*, te mueves por la sala de control del reactor. Tu objetivo es interactuar con las consolas para ajustar las barras de control y vigilar los sistemas.
  * **Nivel 2 (Micro):** Al interactuar con el monitor del núcleo, te sumerges en una vista subatómica inspirada en *Spacewar\!*. Aquí, pilotas un neutrón, esquivando partículas y provocando fisiones para estabilizar el reactor desde dentro.

Las acciones en un nivel afectan directamente al otro. Es un bucle constante entre la gestión macro y la intervención micro.


\<immersive id="atomic-reactor-arcade-game" type="code"title="La Consola Atómica: El Juego Arcade"\>

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La Consola Atómica - El Juego</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background-color: #000;
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
        }
        #game-container {
            border: 4px solid #333;
            box-shadow: 0 0 20px #00ff41, inset 0 0 15px #333;
            background-color: #111;
            padding: 10px;
        }
        canvas {
            background-color: #000;
            display: block;
            border: 2px solid #555;
        }
        #ui-container {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background-color: #222;
            border: 2px solid #555;
            margin-top: 10px;
        }
        .ui-panel {
            width: 30%;
        }
        .ui-label {
            color: #00ff41;
            font-size: 12px;
        }
        .ui-value {
            color: #fff;
            font-size: 14px;
        }
        .progress-bar {
            width: 100%;
            height: 15px;
            background-color: #444;
            border: 1px solid #888;
            margin-top: 5px;
        }
        .progress-bar-inner {
            height: 100%;
            background-color: #00ff41;
            transition: width 0.1s linear;
        }
        #message-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0,0,0,0.8);
            padding: 40px;
            border: 4px solid #fff;
            text-align: center;
            display: none; /* Initially hidden */
        }
    </style>
</head>
<body>

    <div id="game-container">
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <div id="ui-container">
            <div class="ui-panel">
                <div class="ui-label">POTENCIA</div>
                <div class="ui-value" id="power-value">0 MW</div>
                <div class="progress-bar"><div id="power-bar" class="progress-bar-inner"></div></div>
            </div>
            <div class="ui-panel">
                <div class="ui-label">TEMP. NÚCLEO</div>
                <div class="ui-value" id="temp-value">25 °C</div>
                <div class="progress-bar"><div id="temp-bar" class="progress-bar-inner"></div></div>
            </div>
            <div class="ui-panel">
                <div class="ui-label">ESTABILIDAD</div>
                <div class="ui-value" id="stability-value">ESTABLE</div>
                <div class="progress-bar"><div id="integrity-bar" class="progress-bar-inner" style="background-color: #42a5f5;"></div></div>
            </div>
        </div>
    </div>
    
    <div id="message-overlay">
        <h2 id="message-title">TÍTULO</h2>
        <p id="message-text">Texto del mensaje.</p>
        <p id="message-prompt" style="margin-top: 20px; color: #ffff00;">Presiona Enter para continuar</p>
    </div>

    <script>
    //================================================================================
    // LA CONSOLA ATÓMICA - EL JUEGO ARCADE
    //================================================================================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // --- MÓDULO 1: GESTOR DE ESTADO DEL JUEGO ---
    const GameState = {
        gameStatus: 'idle', // 'idle', 'running', 'scram', 'meltdown', 'stall', 'paused'
        currentLevel: 'MACRO', // 'MACRO', 'MICRO'
        lastUpdate: 0,
        
        // Parámetros Físicos del Reactor
        PROMPT_LIFETIME: 0.00002,
        BETA_TOTAL: 0.0065,
        BETA_GROUPS: [0.00021, 0.00142, 0.00127, 0.00257, 0.00075, 0.00027],
        LAMBDA_GROUPS: [0.0124, 0.0305, 0.111, 0.301, 1.14, 3.01],
        FUEL_TEMP_COEFF: -0.00002,
        COOLANT_TEMP_COEFF: 0.00005,
        
        // Variables de estado del reactor
        power: 0,
        normalizedPower: 0,
        neutronPopulation: 1,
        precursorConcentrations: [0, 0, 0, 0, 0, 0],
        reactivity: -0.05,
        fuelTemp: 25,
        coolantTemp: 25,
        controlRodPosition: 100,
        
        // Parámetros de juego
        reactorIntegrity: 100,
        demand: 0.1,
        score: 0,

        // Estado del Nivel Macro
        player: { x: 100, y: 520, width: 24, height: 48, vx: 0, frame: 0 },
        
        // Estado del Nivel Micro
        microPlayer: { x: 400, y: 550, angle: -Math.PI/2, vx: 0, vy: 0, thrusting: false },
        microParticles: [],
        microFissions: 0,
    };

    for (let i = 0; i < 6; i++) {
        GameState.precursorConcentrations[i] = (GameState.BETA_GROUPS[i] / GameState.LAMBDA_GROUPS[i]) * GameState.neutronPopulation / GameState.PROMPT_LIFETIME;
    }

    // --- MÓDULO 2: MOTOR DE FÍSICA ---
    // (Reutilizado de la versión anterior, sin cambios en la lógica)
    const PhysicsEngine = {
        update(dt) {
            if (GameState.gameStatus !== 'running') return;
            const rodReactivity = (GameState.controlRodPosition / 100 - 1) * 0.05;
            const fuelTempReactivity = (GameState.fuelTemp - 25) * GameState.FUEL_TEMP_COEFF;
            let coolantTempReactivity = (GameState.coolantTemp > 300) ? (GameState.coolantTemp - 300) * GameState.COOLANT_TEMP_COEFF : 0;
            GameState.reactivity = rodReactivity + fuelTempReactivity + coolantTempReactivity;
            let dNeutrons_dt = ((GameState.reactivity - GameState.BETA_TOTAL) / GameState.PROMPT_LIFETIME) * GameState.neutronPopulation;
            const dPrecursors_dt = [0, 0, 0, 0, 0, 0];
            for (let i = 0; i < 6; i++) {
                dNeutrons_dt += GameState.LAMBDA_GROUPS[i] * GameState.precursorConcentrations[i];
                dPrecursors_dt[i] = (GameState.BETA_GROUPS[i] / GameState.PROMPT_LIFETIME) * GameState.neutronPopulation - GameState.LAMBDA_GROUPS[i] * GameState.precursorConcentrations[i];
            }
            GameState.neutronPopulation += dNeutrons_dt * dt;
            for (let i = 0; i < 6; i++) {
                GameState.precursorConcentrations[i] += dPrecursors_dt[i] * dt;
            }
            GameState.normalizedPower = GameState.neutronPopulation / 1e7;
            GameState.power = GameState.normalizedPower * 950;
            GameState.fuelTemp += (GameState.normalizedPower * 200 - (GameState.fuelTemp - GameState.coolantTemp) * 0.5) * dt;
            GameState.coolantTemp += ((GameState.fuelTemp - GameState.coolantTemp) * 0.4 - GameState.coolantTemp * 0.1) * dt;
            GameState.fuelTemp = Math.max(25, GameState.fuelTemp);
            GameState.coolantTemp = Math.max(25, GameState.coolantTemp);
            GameState.demand += (Math.random() - 0.5) * 0.05 * dt;
            GameState.demand = Math.max(0.1, Math.min(1, GameState.demand));
            const error = Math.abs(GameState.normalizedPower - GameState.demand);
            if (error < 0.05) GameState.score += (1 - error / 0.05) * dt * 10;
            this.checkFailures();
        },
        checkFailures() {
            if (GameState.fuelTemp > 2800 || GameState.reactorIntegrity <= 0) {
                GameManager.endGame('meltdown');
            }
            const reactivityInDollars = GameState.reactivity / GameState.BETA_TOTAL;
            if (reactivityInDollars >= 1.0 || GameState.coolantTemp > 350) {
                this.triggerScram();
            }
            if (GameState.power < 1 && GameState.neutronPopulation < 10) {
                 GameManager.endGame('stall');
            }
        },
        triggerScram() {
            if (GameState.gameStatus === 'running') {
                GameState.gameStatus = 'scram';
                GameState.controlRodPosition = 0;
                GameState.reactorIntegrity = Math.max(0, GameState.reactorIntegrity - 25);
                AudioEngine.triggerScram();
                GameManager.showMessage('¡¡¡SCRAM!!!', 'APAGADO DE EMERGENCIA', 5000, () => {
                    if (GameState.gameStatus === 'scram') GameState.gameStatus = 'running';
                });
            }
        }
    };

    // --- MÓDULO 3: MOTOR DE RENDERIZADO ---
    const Renderer = {
        drawMacroLevel() {
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Fondo
            ctx.fillStyle = '#34495e';
            ctx.fillRect(0, 568, canvas.width, 32); // Suelo
            ctx.fillRect(0, 0, canvas.width, 450); // Pared
            
            // Consolas
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(50, 450, 150, 118);
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(55, 455, 140, 110);
            ctx.fillStyle = '#000';
            ctx.fillRect(65, 465, 120, 80);
            
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(600, 450, 150, 118);
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(605, 455, 140, 110);
            ctx.fillStyle = '#000';
            ctx.fillRect(615, 465, 120, 80);

            // Dibujar jugador
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(GameState.player.x, GameState.player.y, GameState.player.width, GameState.player.height);
            ctx.fillStyle = '#3498db'; // Cabeza
            ctx.fillRect(GameState.player.x, GameState.player.y, GameState.player.width, 16);

            // Texto de interacción
            ctx.fillStyle = '#ffff00';
            ctx.font = '12px "Press Start 2P"';
            if (GameState.player.x > 20 && GameState.player.x < 200) {
                ctx.fillText("[E] Barras Control", 60, 440);
            }
            if (GameState.player.x > 550 && GameState.player.x < 750) {
                ctx.fillText("[E] Ver Núcleo", 620, 440);
            }
        },
        drawMicroLevel() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Núcleo central (pozo gravitacional)
            const nucleusX = canvas.width / 2;
            const nucleusY = canvas.height / 2;
            const gradient = ctx.createRadialGradient(nucleusX, nucleusY, 10, nucleusX, nucleusY, 100);
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(1, 'rgba(50,50,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(nucleusX-5, nucleusY-5, 10, 10);

            // Dibujar partículas
            GameState.microParticles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            });

            // Dibujar jugador (nave/neutrón)
            ctx.save();
            ctx.translate(GameState.microPlayer.x, GameState.microPlayer.y);
            ctx.rotate(GameState.microPlayer.angle);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, -7);
            ctx.lineTo(-5, 7);
            ctx.closePath();
            ctx.fill();

            if (GameState.microPlayer.thrusting) {
                ctx.fillStyle = '#ff5722';
                ctx.beginPath();
                ctx.moveTo(-5, -5);
                ctx.lineTo(-15, 0);
                ctx.lineTo(-5, 5);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        },
        updateUI() {
            document.getElementById('power-value').textContent = `${GameState.power.toFixed(0)} MW`;
            document.getElementById('power-bar').style.width = `${Math.min(100, GameState.normalizedPower * 100)}%`;
            
            document.getElementById('temp-value').textContent = `${GameState.fuelTemp.toFixed(0)} °C`;
            const tempPercent = Math.min(100, (GameState.fuelTemp / 2800) * 100);
            const tempBar = document.getElementById('temp-bar');
            tempBar.style.width = `${tempPercent}%`;
            tempBar.style.backgroundColor = tempPercent > 80 ? '#f44336' : tempPercent > 60 ? '#ffeb3b' : '#00ff41';
            
            const error = Math.abs(GameState.normalizedPower - GameState.demand);
            const stabilityLabel = document.getElementById('stability-value');
            if (error < 0.05) stabilityLabel.textContent = 'ESTABLE';
            else if (error < 0.15) stabilityLabel.textContent = 'FLUCTUANDO';
            else stabilityLabel.textContent = 'INESTABLE';
            
            document.getElementById('integrity-bar').style.width = `${GameState.reactorIntegrity}%`;
        }
    };

    // --- MÓDULO 4: MOTOR DE AUDIO ---
    const AudioEngine = {
        audioCtx: null, masterGain: null, sources: {},
        init() {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.connect(this.audioCtx.destination);
            const drone = this.audioCtx.createOscillator();
            drone.type = 'sawtooth'; drone.frequency.value = 50;
            const droneGain = this.audioCtx.createGain(); droneGain.gain.value = 0;
            drone.connect(droneGain).connect(this.masterGain); drone.start();
            this.sources.drone = drone; this.sources.droneGain = droneGain;
            const noise = this.createNoiseSource();
            const filter = this.audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 200;
            noise.connect(filter).connect(this.masterGain); noise.start();
            this.sources.reactivityFilter = filter;
        },
        update() {
            if (!this.audioCtx || GameState.gameStatus !== 'running') return;
            const t = this.audioCtx.currentTime;
            this.sources.drone.frequency.linearRampToValueAtTime(40 + GameState.normalizedPower * 60, t + 0.1);
            this.sources.droneGain.gain.linearRampToValueAtTime(Math.min(0.2, GameState.normalizedPower * 0.3), t + 0.1);
            const reactivityInDollars = GameState.reactivity / GameState.BETA_TOTAL;
            this.sources.reactivityFilter.frequency.linearRampToValueAtTime(200 + Math.max(0, reactivityInDollars) * 8000, t + 0.1);
        },
        createNoiseSource() {
            const bufferSize = this.audioCtx.sampleRate * 2;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer; source.loop = true;
            return source;
        },
        playSfx(type) {
            if (!this.audioCtx) return;
            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain).connect(this.masterGain);
            if (type === 'fission') {
                const noise = this.createNoiseSource();
                noise.loop = false;
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                noise.connect(gain);
                noise.start(t);
                noise.stop(t + 0.3);
            } else if (type === 'thrust') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(50, t);
                osc.frequency.linearRampToValueAtTime(100, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t); osc.stop(t + 0.1);
            }
        },
        triggerScram() { this.playAlarm(800, 0.5); },
        playAlarm(freq, duration) { /* ... */ }
    };

    // --- MÓDULO 5: GESTOR DE ENTRADAS ---
    const InputHandler = {
        keys: {},
        init() {
            window.addEventListener('keydown', e => this.keys[e.code] = true);
            window.addEventListener('keyup', e => {
                if(e.code === 'KeyE') GameManager.handleInteraction();
                if(e.code === 'Enter') GameManager.handleEnter();
                delete this.keys[e.code];
            });
        }
    };

    // --- MÓDULO 6: GESTOR DEL JUEGO ---
    const GameManager = {
        init() {
            InputHandler.init();
            this.showMessage('LA CONSOLA ATÓMICA', 'Un juego de simulación nuclear', Infinity);
        },
        start() {
            GameState.gameStatus = 'running';
            GameState.lastUpdate = performance.now();
            if (AudioEngine.audioCtx.state === 'suspended') AudioEngine.audioCtx.resume();
            document.getElementById('message-overlay').style.display = 'none';
            gameLoop();
        },
        handleInteraction() {
            if (GameState.currentLevel === 'MACRO') {
                if (GameState.player.x > 20 && GameState.player.x < 200) { // Barras
                    GameState.controlRodPosition = GameState.controlRodPosition === 100 ? 50 : 100;
                }
                if (GameState.player.x > 550 && GameState.player.x < 750) { // Ver núcleo
                    this.switchLevel('MICRO');
                }
            }
        },
        handleEnter() {
            if (GameState.gameStatus === 'idle' || GameState.gameStatus === 'paused' || GameState.gameStatus === 'scram' || GameState.gameStatus === 'meltdown' || GameState.gameStatus === 'stall') {
                if(document.getElementById('message-overlay').style.display !== 'none') {
                    if (GameState.gameStatus === 'idle') this.start();
                    else location.reload();
                }
            }
        },
        switchLevel(level) {
            GameState.currentLevel = level;
            if (level === 'MICRO') {
                this.setupMicroLevel();
            }
        },
        setupMicroLevel() {
            GameState.microParticles = [];
            GameState.microFissions = 0;
            for (let i=0; i<20; i++) { // Uranio
                GameState.microParticles.push({
                    type: 'U', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 10, color: '#00ff41'
                });
            }
            for (let i=0; i<50; i++) { // Moderador
                GameState.microParticles.push({
                    type: 'M', x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 6, color: '#3498db'
                });
            }
        },
        updateMicroLevel(dt) {
            // Player movement (Spacewar! style)
            const player = GameState.microPlayer;
            if (InputHandler.keys['ArrowLeft']) player.angle -= 5 * dt;
            if (InputHandler.keys['ArrowRight']) player.angle += 5 * dt;
            if (InputHandler.keys['ArrowUp']) {
                player.vx += Math.cos(player.angle) * 150 * dt;
                player.vy += Math.sin(player.angle) * 150 * dt;
                player.thrusting = true;
                AudioEngine.playSfx('thrust');
            } else {
                player.thrusting = false;
            }
            
            // Gravity
            const dx = canvas.width/2 - player.x;
            const dy = canvas.height/2 - player.y;
            const distSq = dx*dx + dy*dy;
            if (distSq > 1) {
                player.vx += (dx / distSq) * 500 * dt;
                player.vy += (dy / distSq) * 500 * dt;
            }

            player.x += player.vx * dt;
            player.y += player.vy * dt;

            // Screen wrap
            if(player.x < 0) player.x = canvas.width;
            if(player.x > canvas.width) player.x = 0;
            if(player.y < 0) player.y = canvas.height;
            if(player.y > canvas.height) player.y = 0;

            // Collisions
            GameState.microParticles.forEach((p, i) => {
                const pdx = p.x - player.x;
                const pdy = p.y - player.y;
                const pDist = Math.sqrt(pdx*pdx + pdy*pdy);
                if (pDist < p.size/2 + 5) {
                    if (p.type === 'U') {
                        GameState.microParticles.splice(i, 1);
                        GameState.reactivity += 0.001;
                        GameState.microFissions++;
                        AudioEngine.playSfx('fission');
                        if (GameState.microFissions >= 5) {
                            this.showMessage('ÉXITO', 'Reacción en cadena estabilizada.', 3000, () => this.switchLevel('MACRO'));
                        }
                    } else if (p.type === 'M') {
                        player.vx *= 0.8;
                        player.vy *= 0.8;
                    }
                }
            });
        },
        showMessage(title, text, duration = Infinity, callback = null) {
            const overlay = document.getElementById('message-overlay');
            document.getElementById('message-title').textContent = title;
            document.getElementById('message-text').textContent = text;
            overlay.style.display = 'block';
            if (duration !== Infinity) {
                setTimeout(() => {
                    overlay.style.display = 'none';
                    if (callback) callback();
                }, duration);
            }
        },
        endGame(reason) {
            GameState.gameStatus = reason;
            let title = 'FIN DEL JUEGO';
            let text = `Puntuación Final: ${Math.round(GameState.score)}`;
            if (reason === 'meltdown') title = '¡¡¡FUSIÓN DEL NÚCLEO!!!';
            if (reason === 'stall') title = 'REACCIÓN DETENIDA';
            this.showMessage(title, text);
        }
    };

    // --- BUCLE PRINCIPAL ---
    function gameLoop(timestamp) {
        if (GameState.gameStatus === 'idle' || GameState.gameStatus === 'paused') {
            requestAnimationFrame(gameLoop);
            return;
        }
        if (!GameState.lastUpdate) GameState.lastUpdate = timestamp;
        const dt = (timestamp - GameState.lastUpdate) / 1000;
        GameState.lastUpdate = timestamp;

        // Update
        PhysicsEngine.update(dt);
        if (GameState.currentLevel === 'MACRO') {
            GameState.player.x += GameState.player.vx * dt;
            GameState.player.x = Math.max(0, Math.min(canvas.width - GameState.player.width, GameState.player.x));
            GameState.player.vx = 0;
            if(InputHandler.keys['ArrowLeft']) GameState.player.vx = -150;
            if(InputHandler.keys['ArrowRight']) GameState.player.vx = 150;
        } else {
            GameManager.updateMicroLevel(dt);
        }
        
        // Render
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (GameState.currentLevel === 'MACRO') {
            Renderer.drawMacroLevel();
        } else {
            Renderer.drawMicroLevel();
        }
        Renderer.updateUI();
        AudioEngine.update();

        if (GameState.gameStatus === 'running' || GameState.gameStatus === 'scram') {
            requestAnimationFrame(gameLoop);
        }
    }

    // --- INICIALIZACIÓN ---
    AudioEngine.init();
    GameManager.init();

    </script>
</body>
</html>
```

\</immersive\>



