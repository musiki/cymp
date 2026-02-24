---
title: "Introducción a los gráficos cartesianos y analógicos de señales acústicas"
chapter: "Fundamentos de Acústica Musical"
order: 1
assignment: false
summary: A lo largo de la cursada se van a plantear tanto gráficos de coordenadas cartesianas como analógicos para representar situaciones de estudio, donde ciertos parámetros del sonido van a variar en función de otros.
---



## descripción

A lo largo de la cursada se van a plantear tanto gráficos de coordenadas cartesianas como analógicos para representar situaciones de estudio, donde ciertos parámetros del sonido van a variar en función de otros.


# Introducción a los gráficos cartesianos y analógicos de señales acústicas

A lo largo de la cursada se van a plantear tanto gráficos de coordenadas cartesianas como analógicos para representar situaciones de estudio, donde ciertos parámetros del sonido van a variar en función de otros.

## Ejemplo A.1. 

El siguiente es un caso de representación de variaciones de parámetros en un formato muy conocido y con un sistema de notación convencionalizado:

```lily
\version "2.24.0"
\paper { tagline = ##f paper-height=#(* 8 cm) paper-width=#(* 20 cm)
system-count=#1

 }
\score {
  \new Staff {\clef treble \time 4/4 
\override Score.MetronomeMark.extra-offset = #'(0 . 4)
\override Score.MetronomeMark.font-size = #5
  \tempo 4 = 60
  \magnifyStaff #2
  \relative {
    \set Staff.instrumentName = #"Violín"
    b''2.\p d, 4-.\mf
    
cis1
\< \override Score.BarLine.transparent = ##t s1\f\>s8\p\! 
\revert Score.BarLine.transparent
\bar "||"

}}}
```


En estos dos compases de escritura musical se puede encontrar muchísima información:

- **Altura**. La ubicación en el eje vertical, regulada por las líneas del pentagrama, nos indica variaciones de altura: más arriba, más agudo; más abajo, más grave. La clave de sol nos da una referencia para la altura, dentro de todo el rango utilizado para la música, indicándonos el marco de registro en el que suceden esas variaciones de altura.

- **Tiempo**, que es un parámetro que puede leerse desde diversos lugares, siendo algunos de ellos:

	- Ritmo: la ubicación en el eje horizontal nos da noción de las relaciones temporales y de la duración relativa de cada altura con respecto a las otras. Ésto también está sostenido por la escritura rítmica, mensural, en la que las figuras rítmicas tienen valores proporcionales.
	- Velocidad: la indicación de negra = 60 es una indicación metronómica que nos dice que en un minuto entran 60 negras. Esto determina la velocidad con la que sucederá el ritmo que está escrito. 
	- Duración: esa indicación metronómica también nos dice que una negra durará 1 segundo, por lo tanto esos dos compases, que tienen 4 negras cada uno, durarán 8 segundos.

- **Intensidad**. Ciertas indicaciones de texto y símbolos por debajo del pentagrama nos indican variaciones de intensidad, en una escala relativa utilizada en música en la cual p (piano) es un sonido suave, mf (mezzo forte) es un sonido más fuerte y f (forte) es un sonido más fuerte aún. Siendo estrictos, el cambio de p a mf en el primer compás se da de forma abrupta, se salta de una intensidad a la otra. Por otra parte, los reguladores de crescendo y diminuendo del segundo compás, nos indican variaciones graduales de la intensidad en el tiempo (¡aquí tenemos aún más información relativa al tiempo!), en el segundo compás se aumenta gradualmente de mf a f y se decrece gradualmente de f a p.

- **Metro**. Por si las indicaciones de intensidad no fueran suficientes, el compás de 4/4 nos indica en la música tradicional una estructura métrica, con acentuaciones características dentro del compás (siendo muy escolásticos: en el 4/4 tendríamos un 1º tiempo fuerte, un 2º tiempo débil, un 3º tiempo semi-fuerte y un 4º tiempo débil).

- **Articulación**. En este fragmento, el puntito de staccato sobre la segunda nota nos indica la manera de articular la misma, es decir la forma en que esa nota empieza, termina y por ende la forma en que se conecta con las demás notas.

- **Timbre**. El fragmento indica que esa partitura es para violín, por lo cual podemos prever, siempre y cuando tengamos en nuestra memoria el sonido característico de un violín, cómo va a ser el timbre de ese fragmento. Ahora bien, no todos los violines suenan iguales! Es decir que esa indicación tiene un grado de exactitud mucho menor al de la altura o la duración, por ejemplo, que son más precisas. Podríamos tener incluso más información sobre el timbre, indicando con mayor precisión variaciones de color del sonido, como podría suceder en una partitura del impresionismo o de ciertas músicas del siglo XX.

Podríamos tener aún más información en una partitura, incluso alguna que tenga que ver con cuestiones no relacionadas a los parámetros del sonido, por ejemplo la digitación. Así y todo, hay información que el músico podrá interpretar, por ende esos mismos dos compases pueden sonar de muchas formas distintas, ¡aún respetando precisamente todo lo que se indica!

Vemos que hay, entonces, muchísima información condensada en una partitura: ¿habían pensado alguna vez en que al leer una partitura están decodificando todo eso?

Ahora bien, en Acústica vamos a trabajar con gráficos bastante más simples, porque nos interesará enfocarnos cada vez en ciertas variables puntuales del sonido, según lo que precisemos analizar de una señal. En general utilizaremos gráficos que indican dos o tres variables como mucho, relacionadas una en función de otra.


Veamos la partitura anterior graficada en base a dos de sus variables, altura y tiempo:
 ![](https://i.imgur.com/9BgwFGw.png)

a. Variación de la altura en función del tiempo: eje y (vertical) = altura; eje x (horizontal) = tiempo 




Y ahora cambiamos una de las variables y graficamos en base a la intensidad y el tiempo:  
![](https://i.imgur.com/CswYLcm.png)

b. Variación de la intensidad en función del tiempo: y = intensidad; x = tiempo


## Ejemplo A.2.

Aquí otro fragmento de partitura. La indicación de gliss. (glissando) indica una variación gradual y continua (en el caso del violín que es un instrumento de afinación libre) de la altura, es decir que se pasa de una nota a la otra pasando por todas las alturas intermedias.

En este caso la indicación metronómica es de negra = 120, por lo cual en un minuto entran 120 negras y cada negra dura medio segundo, dando una duración de 4 segundos al fragmento escrito (si bien hay un segundo de silencio al comienzo y otro segundo de silencio al final). 

```lily
\version "2.24.0"
\paper { tagline = ##f paper-height=#(* 5 cm) paper-width=#(* 20 cm)
system-count=#1

 }
\score {
  \new Staff {\clef treble \time 4/4 
\override Score.MetronomeMark.extra-offset = #'(0 . 4)
\override Score.MetronomeMark.font-size = #5
\override Staff.TimeSignature.style = #'numbered
  \tempo 4 = 120
  \magnifyStaff #2
  \relative {
    \set Staff.instrumentName = #"Violín"
    r2 aes''2 \glissando \f \> d,,2 \p \! r2
\bar "||"

}}}
```

Veamos esa partitura graficada en base a dos de sus variables, altura y tiempo:

![](https://i.imgur.com/TmUCTcn.png)

a. Variación de la altura en función del tiempo: y = altura; x = tiempo


En el gráfico siguiente vemos a la altura en función de la intensidad. Podrán notar que aquí el parámetro temporal no está graficado, por lo cual no podemos saber, a partir de este gráfico, como se da la variación de la intensidad y la altura a lo largo del tiempo. Solo podemos observar aquí qué intensidad le corresponde a cada altura:               
![](https://i.imgur.com/X7WGv3B.png)

b. Variación de la altura en función de la intensidad: y=  altura;  x = intensidad


 

## Ejemplo A.3.

Sonido de una campana de placa. Hay muchas componentes espectrales que no están ordenadas como en los instrumentos que tienen una altura definida, por ende, puede escucharse un sonido complejo, con más de una altura.

![](https://i.imgur.com/lY8UOBq.png)
![[Campana de Placa_mono.mp3]]

Duraciones relativas de las componentes de frecuencia (simplificado: hay muchas más componentes presentes en el espectro real de la campana).


