### 1. Descripción axiomática

La instalación se constituye en un sistema cerrado donde tres entidades fundamentales interactúan: un micrófono (\$\obj\_i\$), un parlante (\$\obj\_i\$) y una esfera transparente (\$\obj\_h\$) que los contiene. El micrófono capta vibraciones sonoras y las envía al parlante, el cual devuelve energía acústica que se retroalimenta en un bucle de recursión (\$\circlearrowright\$). La esfera funciona como entorno límite (\$\Omega\$) que encapsula y modifica la propagación del sonido, intensificando el fenómeno de feedback. Los operadores centrales son: interfaz (\$\itf\$) entre micrófono y parlante, recursión (\$\circlearrowright\$) como principio de retroalimentación, e inclusión (\$\subset\$) de ambos objetos en el hiperobjeto-esfera.

---

### 2. Fórmula de escritura icónica

Header:

```latex
\newcommand{\mat}{\blacksquare}
\newcommand{\obj}{\blacklozenge}
\newcommand{\agn}{\bullet}
\newcommand{\itf}{\leftrightarrow}
\newcommand{\ent}[1]{\boxed{1}}
```

Fórmula base:

```latex
$$(\obj_i \itf \obj_i) \circlearrowright \subset \obj_h \subset \ent{f}$$
```

Fórmula complejizada:

```latex
$$\big( (\obj_i^{mic} \itf \obj_i^{spk}) \circlearrowright \Omega \big) \subset (\obj_h \cap \ent{f}) \rightarrow (\mat_p \cup \Psi)$$
```

---


### 3. Desglose de términos

* \$\obj\_i^{mic}\$ = objeto instrumental: micrófono, capta vibración acústica.
* \$\obj\_i^{spk}\$ = objeto instrumental: parlante, emite vibración acústica.
* \$\obj\_h\$ = hiperobjeto: esfera transparente, envoltura material y conceptual.
* \$\ent{f}\$ = entorno físico: aire, resonancia acústica, espacialidad contenida.
* \$\Omega\$ = límite, frontera espacial de contención sonora.
* \$\Psi\$ = lenguaje, manifestación del sonido como signo vibratorio.
* \$\mat\_p\$ = material físico: vibración, aire en movimiento.
* \$\itf\$ = operador de interfaz, establece conexión directa entre micrófono y parlante.
* \$\circlearrowright\$ = recursión, bucle de feedback acústico.
* \$\subset\$ = inclusión, objetos contenidos en la esfera.
* \$\cap\$ = intersección, solapamiento de esfera y entorno.
* \$\rightarrow\$ = implicación, deriva causal del fenómeno hacia materialización sonora.
* \$\cup\$ = unión, coexistencia de material físico y dimensión simbólica.

---

### 4. Preguntas conjeturales

1. ¿De qué manera la recursividad sonora dentro de la esfera puede ser considerada un modelo físico de autopoiesis acústica?
2. ¿Qué transformaciones perceptivas emergen al considerar la esfera no solo como contenedor físico, sino como interfaz simbólica entre oyente y máquina?
3. (Negativa estoica) ¿No sería el feedback un simple accidente físico trivial, en lugar de una necesidad estética o conceptual que justifique la instalación?

---

### 5. Bibliografía referencial

```bibtex
@book{lucier1995music,
  title={Music 109: Notes on Experimental Music},
  author={Lucier, Alvin},
  year={1995},
  publisher={Wesleyan University Press}
}

@book{young2009sound,
  title={Sound Art: Beyond Music, Between Categories},
  author={LaBelle, Brandon},
  year={2009},
  publisher={Continuum}
}

@article{peters2009acoustic,
  title={Acoustic Ecology and the Experimental Sound Installation},
  author={Peters, John Durham},
  journal={Organised Sound},
  volume={14},
  number={1},
  pages={55--63},
  year={2009},
  publisher={Cambridge University Press}
}
```
