---
tags:
  - generatividad
place:
person: Peter Chilvers
connections:
url: https://usoproject.blogspot.com/2009/09/generative-music-interview-with-peter_19.html
img: https://i.imgur.com/JXLBJJv.png
topoi:
year: 2009
---

por Matteo Milani, U.S.O Project

La música generativa es un término popularizado por Brian Eno para describir la música que es siempre diferente y cambiante, y que es creada por un sistema (Wikipedia). Recientemente tuve la oportunidad de entrevistar al músico y diseñador de software Peter Chilvers, creador de la nueva aplicación para iPhone/iPod touch llamada Air (© Opal Ltd).
Basada en conceptos desarrollados por Brian Eno, con quien Chilvers creó Bloom, Air combina muestras vocales (de Sandra O'Neill) y de piano en una composición hermosa, tranquila y en constante cambio, que siempre resulta familiar, pero nunca es igual.

Air cuenta con cuatro modos «Conduct», que permiten al usuario controlar la composición tocando diferentes áreas de la pantalla, y tres modos «Listen», que ofrecen una selección de arreglos. Para aquellos que tienen la suerte de disponer de varios iPhones y altavoces, se ha incluido una opción para distribuir la composición entre varios reproductores.
«Air es como Music for Airports sin fin, que es como siempre quise que fuera». - Brian Eno


> [!quote] Brian Eno
> *«Hace unos 20 años o más, me interesé por los procesos que podían producir música que no se hubiera diseñado específicamente. El primer ejemplo de ello son las campanas de viento. Si se fabrica un conjunto de campanas de viento, se define el envolvente dentro del cual puede producirse la música, pero no se define con precisión la forma en que la música se desarrolla a lo largo del tiempo. Es una forma de hacer música que no es completamente determinista».*

Matteo Milani: Gracias por tu tiempo. Peter Chilvers, primero como músico: unas palabras sobre el proyecto «A Marble Calm».

Peter Chilvers: Hace unos años, durante unas vacaciones, me topé con la frase «A Marble Calm» y pensé que sonaba como un nombre interesante para un grupo musical, así que empecé a pensar en el tipo de grupo que podría ser. Cuanto más lo pensaba, más me parecía que encajaba con una serie de ideas que me interesaban: piezas ambientales de textura fluida, improvisación y canciones. Al convertirlo en un colectivo flexible, me ha permitido incorporar a otros vocalistas y músicos con los que me ha gustado trabajar en otros proyectos: los vocalistas Sandra O'Neill (que también trabajó conmigo en «Air» para el iPhone) y Tim Bowness, el marimbista Jon Hart y el flautista Theo Travis.


MM: ¿Cuándo empezaste a trabajar con música generativa?

PC: En los años 90 trabajé como desarrollador de software en la serie de juegos «Creatures». Cuando empezamos con Creatures 2, se me dio la oportunidad de encargarme de toda la banda sonora. El juego no era ni mucho menos lineal: pasabas una cantidad arbitraria de tiempo en diferentes lugares de un mundo artificial, así que quería crear una banda sonora que actuara más como un paisaje. Acabé desarrollando un conjunto de «improvisadores virtuales» que generaban constantemente un paisaje sonoro ambiental en segundo plano. En realidad, era bastante complejo, con su propio lenguaje de programación sencillo, aunque el usuario apenas lo percibía.

[...] Peter decidió utilizar su experiencia en música improvisada para crear una serie de «músicos virtuales» que tocaran al ritmo de la acción en pantalla. Cada composición de Creatures contiene un conjunto de «músicos», cada uno con su propio conjunto de instrucciones para responder al estado de ánimo de los norns en pantalla.

Peter fue capaz de generar efectos mucho más interesantes utilizando instrumentos grabados en lugar de los sonidos MIDI generales generados por una tarjeta de sonido, que a menudo pueden ser bastante restrictivos. Esto le permitió aprovechar las muchas formas diferentes en que se puede tocar una nota en un instrumento «en vivo»: por ejemplo, en una guitarra, el sonido cambia mucho dependiendo de la parte del dedo que se utilice para tocar una cuerda, y en un piano, cuando se toca una nota, todas las demás cuerdas también vibran. Además, al alterar los efectos estéreo, podía engrosar el sonido en determinados momentos.

También hizo uso de bucles de retroalimentación dentro de la banda sonora. Los bucles de retroalimentación se experimentaron por primera vez en la década de 1970. Si alguno de ustedes recuerda a Brian Eno, quizá le interese saber que compuso la mayor parte de su música utilizando este método. La idea es que se reproduce una pista y se graba en la RAM (en una cinta en la década de 1970). Al cabo de poco tiempo (unos 8 segundos en Creatures 2), el bucle comienza y se reproducen los sonidos originales, de modo que el compositor sigue creando sonidos en respuesta a lo que ha sucedido anteriormente.

Entre bastidores, los scripts controlan el motor musical y ajustan el volumen, la panoramización y el intervalo entre las notas a medida que cambian el estado de ánimo y la amenaza.

MM: ¿Por qué elegiste la plataforma Apple para desarrollar las aplicaciones?

PC: Soy un gran admirador de los productos Apple desde hace mucho tiempo, y el momento en que lanzaron el iPhone no pudo ser más oportuno. Bloom ya existía de alguna forma antes de que se anunciara el SDK del iPhone, posiblemente incluso antes de que se anunciara el propio iPhone. Desde el momento en que probamos el prototipo, quedó claro que se adaptaba perfectamente a una pantalla táctil. ¡Y Apple nos proporcionó una!

La dificultad a la que se han enfrentado los desarrolladores con la música generativa hasta la fecha ha sido la plataforma. La música generativa suele requerir un ordenador, y no es muy agradable sentarse frente a un ordenador y escuchar música. El iPhone cambió eso: era portátil, potente y estaba diseñado para reproducir música.


MM: ¿Quién diseñó las visualizaciones de Bloom? ¿El propio Eno?

PC: Fue un proceso bidireccional. Se me ocurrió el efecto de círculos que se expanden y desaparecen como parte de un experimento tecnológico. Brian lo vio y me impidió hacerlo más complejo. Gran parte del desarrollo del iPhone ha funcionado así: uno de nosotros sugería algo y el otro lo filtraba, y este proceso se repetía hasta que acabábamos con algo que ninguno de los dos había imaginado. Trope, nuestra nueva aplicación para iPhone, pasó por un gran número de iteraciones, tanto sonoras como visuales, antes de que quedáramos satisfechos con ella.


MM: ¿Qué tipo de algoritmos definen la estructura musical de Bloom? ¿Se basan específicamente en las peticiones de Brian o son solo una abstracción basada en sus trabajos anteriores?

PC: Una vez más, esto es algo que discutimos entre nosotros varias veces. Como puedes ver, todo lo que tocas se repite después de un retraso. Pero la duración de ese retraso varía de forma sutil, pero compleja, y mantiene la música interesante y excéntrica. En realidad, es deliberadamente «incorrecto»: no se puede tocar exactamente al mismo tiempo que algo que ya se ha tocado, y algunas personas lo han confundido con un error. De hecho, en un momento dado fue un error, pero a Brian le gustó el efecto y acabamos resaltándolo. «Honrar el error como una intención oculta» es un tema recurrente en la obra de Brian.
Una próxima actualización de Bloom añade dos nuevos «modos de funcionamiento», uno de los cuales se diseñó específicamente para funcionar con la forma en que Brian prefiere tocar Bloom.

MM: ¿El motor gráfico y de audio incluye bibliotecas estándar de audio y vídeo o has escrito tus propias clases?

PC: He creado mi propio motor de sonido, que estoy perfeccionando constantemente y que utilizo en todas las aplicaciones. Pasó por varias reescrituras bastante sustanciales antes de encontrar algo fiable y reutilizable.


MM: ¿Todo el código está en «Objective C» o has utilizado alguna aplicación externa?

PC: Todo está en Objective-C. No había utilizado este lenguaje antes, aunque en el pasado había trabajado mucho con C++. Es un lenguaje extraño al que cuesta acostumbrarse, pero ahora me gusta mucho.


MM: ¿Bloom se basa en muestras? ¿Qué controla realmente el motor musical (por ejemplo, el disparo, el volumen, la panoramización, los efectos)? ¿Qué hay del lado algorítmico del motor musical?

PC: Bloom se basa completamente en muestras. Brian tiene una enorme biblioteca de sonidos que él mismo ha creado, que yo estaba seleccionando mientras trabajábamos en la banda sonora de Spore y otros proyectos. Es curioso, pero los que elegí fueron los primeros que encontré y que pensé que encajarían con Bloom. Más tarde revisamos un gran número de alternativas, pero esos siguieron siendo los mejores.

La versión de Bloom que está actualmente en funcionamiento utiliza muestras estéreo fijas, pero una actualización que lanzaremos pronto aplica algo de panoramización a los sonidos en función de la posición de cada «bloom» en la pantalla. Es un efecto sutil, pero funciona bastante bien.

MM: ¿Te gustaría describir tus proyectos actuales y futuros?

PC: He participado en dos nuevas aplicaciones para el iPhone: Trope y Air. Ambas aplicaciones estaban pensadas para salir al mercado simultáneamente. Trope es mi segunda colaboración con Brian Eno y toma algunas de las ideas de Bloom en una dirección ligeramente diferente y algo más oscura. En lugar de tocar la pantalla, trazas formas y produces paisajes sonoros abstractos en constante evolución.

Air es una colaboración con la vocalista irlandesa Sandra O'Neill y es bastante diferente a Bloom. Es una obra generativa centrada en las texturas vocales de Sandra y una imagen que cambia lentamente. Se basa en gran medida en las técnicas que Brian ha desarrollado a lo largo de sus muchos años de trabajo en música ambiental e instalaciones, así como en una serie de ideas generativas que hemos desarrollado más recientemente.

Acabo de recibir una noticia interesante: Trope ha sido aprobado y ya está disponible en la App Store.

Puedes encontrar más información en www.generativemusic.com.

«Trope es una experiencia emocional diferente, más introspectiva, más atmosférica. Demuestra que la música generativa, como una de las formas más novedosas de sonema, puede recurrir a una amplia paleta de estados de ánimo». Brian Eno.

<iframe title="Trope in action ! Generative Audio Video iPhone app from Brian Eno and Peter Chilvers" src="https://www.youtube.com/embed/dlgV0X_GMPw?feature=oembed" height="150" width="200" allowfullscreen="" allow="fullscreen" style="aspect-ratio: 1.33333 / 1; width: 100%; height: 100%;"></iframe>

[burningshed.com]
[Brian Eno hablando sobre la música generativa en la Imagination Conference, 1996]

> [! quote]  Brian Eno
> «[...] Hace tres o cuatro años me di cuenta de que no iba a poder hacer música generativa correctamente —en el sentido de ofrecer a la gente sistemas de música generativa que pudieran usar ellos mismos— sin utilizar ordenadores. Y eso me bloqueó: odio las cosas relacionadas con los ordenadores y odio la idea de que la gente tenga que sentarse delante de un ratón para que una pieza musical funcione. Así que cuando salió el iPhone pensé: «Genial, es un ordenador que la gente lleva en el bolsillo y se maneja con los dedos, así que de repente volvió a ser interesante».
>[vía timeoutsydney.com.au]


