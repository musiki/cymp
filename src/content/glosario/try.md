

En JavaScript (y muchos lenguajes), el bloque `try { ... }` `catch(e) { ... }` sirve para atrapar errores en tiempo de ejecución.
- Lo que pongas dentro de` try { ... }` se ejecuta normalmente.
- Si ocurre un error (por ejemplo, osc.stop() sobre un objeto nulo), en vez de que el script se rompa, el flujo salta al` catch(e) { ... }`.
- Dentro de catch podés decidir ignorar, mostrar un mensaje o manejar el error.

Ejemplo:

```js
try {
  osc.stop(); // puede fallar si osc ya está destruido
} catch(e) {
  console.log("No se pudo detener:", e);
}
```

Esto lo usamos en los ejemplos para evitar que el audio quede colgado si el nodo ya no existe al llamar stop() o disconnect().



