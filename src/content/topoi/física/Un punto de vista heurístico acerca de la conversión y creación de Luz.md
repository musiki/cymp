---
type: paper
tags: física 
person: Albert Einstein
year: 1905
---

La [[teoría de Maxwell]] sobre los procesos electromagnéticos en el llamado espacio vacío difiere de manera profunda y esencial de los modelos teóricos actuales sobre los gases y otras materias. Por un lado, consideramos que el estado de un cuerpo material está determinado completamente por las posiciones y velocidades de un número finito de átomos y electrones, aunque sea un número muy grande. Por el contrario, el estado electromagnético de una región del espacio se describe mediante funciones continuas y, por lo tanto, no puede determinarse exactamente mediante un número finito de variables. Así, según la teoría de Maxwell, la energía de los fenómenos puramente electromagnéticos (como la luz) debería representarse mediante una función continua del espacio. Por el contrario, la energía de un cuerpo material debe representarse mediante una suma discreta de los átomos y electrones; por lo tanto, la energía de un cuerpo material no puede dividirse en componentes arbitrariamente muchos y arbitrariamente pequeños. Sin embargo, según la teoría de Maxwell (o, de hecho, cualquier teoría ondulatoria), la energía de una onda luminosa emitida desde una fuente puntual se distribuye de forma continua sobre un volumen cada vez mayor.

La teoría ondulatoria de la luz, con sus funciones espaciales continuas, ha demostrado ser un excelente modelo de los fenómenos puramente ópticos y es probable que nunca sea sustituida por otra teoría. Sin embargo, debemos tener en cuenta que los experimentos ópticos solo observan valores promediados en el tiempo, en lugar de valores instantáneos. Por lo tanto, a pesar de la perfecta concordancia de la teoría de Maxwell con los experimentos, el uso de funciones espaciales continuas para describir la luz puede dar lugar a contradicciones con los experimentos, especialmente cuando se aplica a la generación y transformación de la luz.

En particular, la radiación del cuerpo negro, la fotoluminiscencia, la generación de rayos catódicos a partir de la luz ultravioleta y otros fenómenos asociados con la generación y transformación de la luz parecen modelarse mejor suponiendo que la energía de la luz se distribuye de forma discontinua en el espacio. Según esta imagen, la energía de una onda luminosa emitida desde una fuente puntual no se extiende de forma continua por volúmenes cada vez mayores, sino que consiste en un número finito de cuantos de energía que se localizan espacialmente en puntos del espacio, se mueven sin dividirse y se absorben o generan solo en su conjunto.

A continuación, deseo explicar el razonamiento y las pruebas que me llevaron a esta imagen de la luz, con la esperanza de que algunos investigadores la encuentren útil para sus experimentos.

# Un problema concreto relacionado con la teoría de la «radiación del cuerpo negro».

Comenzamos aplicando la teoría de Maxwell sobre la luz y los electrones a la siguiente situación. Supongamos que hay una cavidad con paredes perfectamente reflectantes, llena de electrones y moléculas de gas que se mueven libremente e interactúan mediante fuerzas conservativas cada vez que se acercan, es decir, que colisionan entre sí igual que las moléculas de gas en la teoría cinética de los gases. [^1]

Además, supongamos que hay una serie de electrones unidos a puntos espacialmente bien separados por fuerzas de restauración que aumentan linealmente con la separación. Estos electrones también interactúan con las moléculas libres y los electrones mediante potenciales conservativos cuando se acercan mucho entre sí. Denominamos a estos electrones, que están unidos a puntos del espacio, «resonadores», ya que absorben y emiten ondas electromagnéticas de un periodo concreto.

Según la teoría actual de la generación de luz, la radiación en la cavidad debe ser idéntica a la radiación del cuerpo negro (que puede encontrarse suponiendo la teoría de Maxwell y el equilibrio dinámico), al menos si se supone que existen resonadores para cada frecuencia considerada.

Inicialmente, ignoremos la radiación absorbida y emitida por los resonadores y centrémonos en el requisito del equilibrio térmico y sus implicaciones para la interacción (colisiones) entre moléculas y electrones. Según la teoría cinética de los gases, el equilibrio dinámico requiere que la energía cinética media de un resonador sea igual a la energía cinética media de una molécula de gas en movimiento libre. Si descomponemos el movimiento de un electrón resonador en tres oscilaciones mutuamente perpendiculares, encontramos que la energía media $\bar {E}$ de dicha oscilación lineal es

$$\bar{E}={\frac {R}{N}}T,$$

donde R es la constante absoluta de los gases, N es el número de «moléculas reales» en un equivalente de gramo y T es la temperatura absoluta. Debido a los promedios temporales de la energía cinética y potencial, la energía $\bar {E}$ es ⅔ tan grande como la energía cinética de una sola molécula de gas libre. Incluso si algo (como los procesos radiativos) hace que la energía promediada en el tiempo de un resonador se desvíe del valor $\bar {E}$, las colisiones con los electrones libres y las moléculas de gas devolverán su energía media a $\bar {E}$ al absorber o liberar energía. Por lo tanto, en esta situación, el equilibrio dinámico solo puede existir cuando cada resonador tiene una energía media $\bar {E}$.
Ahora aplicamos una consideración similar a la interacción entre los resonadores y la radiación ambiental dentro de la cavidad. Para este caso, Planck ha derivado la condición necesaria para el equilibrio dinámico [^2]; tratando la radiación como un proceso completamente aleatorio. [^3]

Él encuentra:
$$\bar {E}_{\nu }={\frac {L^{3}}{8\pi \nu ^{2}}}\rho _{\nu }.$$


Aquí, $\bar {E}_{\nu }$ es la energía media de un resonador de frecuencia propia ν (por componente oscilatorio), L es la velocidad de la luz, ν es la frecuencia y ρνdν es la densidad de energía de la radiación de la cavidad con una frecuencia entre ν y ν + dν.

Para que la energía radiativa neta de la frecuencia ν no aumente ni disminuya continuamente, debe cumplirse la siguiente igualdad

$$ \frac {R}{N}T={\bar {E}}={\bar {E}}_{\nu }={\frac {L^{3}}{8\pi \nu ^{2}}}\rho _{\nu },$$

o, equivalentemente,

$$ \rho _{\nu }={\frac {R}{N}}{\frac {8\pi \nu ^{2}}{L^{3}}}T.$$


Esta condición para el equilibrio dinámico no solo no concuerda con los experimentos, sino que también elimina cualquier posibilidad de equilibrio entre la materia y el éter. Cuanto mayor sea el rango de frecuencias de los resonadores, mayor será la energía de radiación en el espacio, y en el límite obtenemos:

$$ \int _{0}^{\infty }\rho _{\nu }\,d\nu ={\frac {R}{N}}{\frac {8\pi }{L^{3}}}T\int _{0}^{\infty }\nu ^{2}\,d\nu =\infty \ .$$





[^1]: Esta suposición equivale a la condición de que las energías cinéticas medias de las moléculas de gas y los electrones sean iguales entre sí cuando existe equilibrio térmico. Como es sabido, utilizando esta condición, el Sr. Drude ha derivado teóricamente la relación entre la conductividad térmica y la conductividad eléctrica de los metales.

[^2]: M. Planck, Ann. d. Phys. 1 p.99. 1900.

[^3]: Esta condición se puede formular de la siguiente manera. Expandimos el componente Z de la fuerza eléctrica (Z) en un punto dado del espacio entre las coordenadas temporales t=0 y t=T (donde T es una cantidad de tiempo grande en comparación con todos los períodos de vibración considerados) en una serie de Fourier $$ Z=\sum \limits _{\nu =1}^{\nu =\infty }A_{\nu }sin\left(2\pi \nu {\frac {t}{T}}+\alpha _{\nu }\right)\ ,$$donde $A_{\nu }\geqq 0$ y $0\leqq a_{\nu }\leqq 2\pi$. Al realizar esta expansión tantas veces como se desee con tiempos iniciales elegidos arbitrariamente, se obtiene una serie de combinaciones diferentes para las cantidades Aν y αν. Entonces, para las frecuencias de las diferentes combinaciones de las cantidades Aν y αν, existen las probabilidades (estadísticas) dW de la forma:$$dW=f(A_{1}\ A_{2},\dots \alpha _{1}\ \alpha _{2}\dots )dA_{1}dA_{2},\dots d\alpha _{1}\ d\alpha _{2}\dots$$La radiación es entonces tan desordenada como se pueda imaginar, si $$f(A_{1},A_{2}\ \dots \alpha _{1},\alpha _{2}\dots )=F_{1}(A_{1})F_{2}(A_{2})\dots f_{1}(\alpha _{1}).f_{2}(\alpha _{2})\dots$$Es decir, si la probabilidad de un valor concreto de A y α, respectivamente, es independiente del valor de otros valores de A y x, respectivamente. Cuanto más se cumpla la exigencia de que los pares separados de valores Aν y αν dependan del proceso de emisión y absorción de resonadores *separados*, más se acercará el caso examinado a ser tan desordenado como sea imaginable.
