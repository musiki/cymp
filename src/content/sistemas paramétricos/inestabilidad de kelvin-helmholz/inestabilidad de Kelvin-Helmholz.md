<iframe title="Inestabilidad de Kelvin-Helmholtz . Time lapse" src="https://www.youtube.com/embed/Pd8-9SFKMXo?feature=oembed" height="113" width="200" allowfullscreen="" allow="fullscreen" style="aspect-ratio: 1.76991 / 1; width: 100%; height: 100%;"></iframe>


<iframe title="Kelvin Helmholtz instability (fresh water above dyed brine)" src="https://www.youtube.com/embed/kSsIQjr1Tt0?feature=oembed" height="113" width="200" allowfullscreen="" allow="fullscreen" style="aspect-ratio: 1.76991 / 1; width: 100%; height: 100%;"></iframe>


El cielo rasga su piel cuando dos vientos en disputa recitan melodías distintas sobre una misma partitura de aire.



**((<br>**
   **<{~[ρ₁ U₁]}><br>**
   **||<br>**
   **<{~[ρ₂ U₂]}><br>**
**)) ⇒ ~((≡))<br>**
        **|<br>**
     **((∿∿∿)) ↝ ↑<br>**



## léxico

- **(()):** Reentrada, formación del límite entre dos dominios.
- **<{~[ρ₁ U₁]}>**: flujo 1, envuelto en temporalización (< >), espacialización ({ }), negado (~) y modalizado ([ ]) como sistema distinto.
- **||**: discontinuidad o frontera crítica entre los dos sistemas.
- **⇒ ~((≡))**: el sistema ya no conserva equivalencia interna; la identidad reentrante se niega: aparece inestabilidad.
- **((∿∿∿))**: patrón oscilatorio de crecimiento de la onda, encapsulado en una nueva reentrada.
- **↝ ↑**: deriva vertical, ascensión del pliegue, transformación de frontera en fenómeno visible.


## principio de funcionamiento

La inestabilidad de Kelvin–Helmholtz ocurre cuando dos capas de fluido de distinta velocidad se deslizan una sobre otra. Si hay una diferencia de velocidad significativa (cizalla), pequeñas perturbaciones en la interfaz se amplifican con el tiempo, generando remolinos característicos. Este fenómeno aparece en nubes, océanos y plasmas. Se representa visualmente (ondas y remolinos) mapeando sonicamente (osciladores controlados por el movimiento de las partículas).

## fórmulas

1. Perfil de velocidad base (flujo tipo tangente hiperbólica):

$$
U(y) = U_0 \cdot \tanh\left(\frac{y}{\delta}\right)
$$

donde:
- $U_0$ = velocidad máxima de las capas
- $\delta$ = grosor de la zona de transición (cizalla)
- $y$ = posición vertical

2. Derivada del perfil de velocidad (gradiente de cizalla):

$$
\frac{dU}{dy} = \frac{U_0}{\delta} \cdot \operatorname{sech}^2\left(\frac{y}{\delta}\right)
$$


La función sech² es esencial para determinar el nivel de inestabilidad local: donde es mayor, hay más “fuerza” para generar ondas.

3. Perturbación oscilatoria (fase y amplitud):

$$
\text{phase}(x, t) = kx - \omega t
$$

$$
\text{perturbación}(y) = A \cdot \sin(\text{phase}) \cdot e^{-|\frac{y}{\alpha}|}
$$

donde:
	- $k$ = número de onda
	- $\omega$ = frecuencia angular (aproximada aquí como constante)
	- $A$ = amplitud modulada por la distancia a la interfaz

4. Sonificación:
	- Frecuencia: mapeada linealmente de $y$ a rango $[20, 5000]$ Hz
	- Ganancia: función del gradiente de velocidad $|dU/dy|$ y de la magnitud de la velocidad vertical $|v_y|$

5. Movimiento de partículas (discreto):
	- Se aplica una “fuerza” basada en el perfil de cizalla para relajar cada partícula hacia el perfil ideal
	- También se induce una oscilación transversal según la fase local
	- El movimiento es estabilizado con disipación artificial:

$$
v_x \leftarrow v_x \cdot \lambda,\quad v_y \leftarrow v_y \cdot \lambda,\quad \lambda < 1
$$

