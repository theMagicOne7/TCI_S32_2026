# Investigación — Duran, Lucía (Legajo: TU_LEGAJO)

## Parte A — JS asincrónico + fetch + SPA

### Preguntas guía
1. **¿Qué significa que fetch sea asincrónico?**
   Significa que no frena la ejecución de la página mientras espera la respuesta del servidor.
2. **¿Por qué respuesta.json() también devuelve una promesa?**
   Porque convertir el cuerpo de la respuesta a un objeto JSON toma tiempo y se procesa de forma asincrónica.
3. **¿Qué relación hay entre una SPA y fetch?**
   Una SPA necesita `fetch` para pedir y enviar datos al servidor en segundo plano sin recargar la pestaña.

### Búsquedas realizadas
- **Búsqueda 1:** SPA vs MPA — *Fuente:* https://developer.mozilla.org/es/docs/Glossary/SPA
  - *Lo que entendí:* La SPA carga una sola página y actualiza partes de la vista dinámicamente.
- **Búsqueda 2:** Promesas y async/await — *Fuente:* https://es.javascript.info/async
  - *Lo que entendí:* `async/await` simplifica el manejo de promesas sin encadenar tantos `.then()`.

### Evidencia
![Evidencia Fetch](parte_a_fetch.png)

---

## Parte B — React + TypeScript + Vite

### Preguntas guía
1. **Diferencia entre estado y datos de vista:** El estado (`useState`) en React fuerza la re-renderización automática de la vista cuando sus datos cambian.
2. **Uso de `interface`:** Define los tipos de las `props` en desarrollo y evita errores antes de ejecutar el código en el navegador.
3. **Rol de Vite:** Sirve como empaquetador ultrarrápido y servidor de desarrollo con recarga en caliente.

### Búsquedas realizadas
- **Búsqueda 1:** Componentes y JSX — *Fuente:* https://es.react.dev/learn
  - *Lo que entendí:* Un componente es una pieza reutilizable de UI y JSX permite escribir sintaxis similar a HTML dentro de JS.
- **Búsqueda 2:** Props vs State — *Fuente:* https://es.react.dev/learn/state-a-components-memory
  - *Lo que entendí:* Las props se pasan desde fuera; el estado es la memoria interna del componente.

### Evidencia
![Evidencia React](parte_b_react.png)

---

## Parte C — Contrato OpenAPI + Prism

### Preguntas guía
1. **¿Por qué definir el contrato antes?** Evita incoherencias entre frontend y backend y permite trabajar en paralelo.
2. **Servidor Mock:** Sirve para generar respuestas falsas a partir del contrato OpenAPI antes de programar la base de datos real.
3. **Relación con reglas de negocio:** El contrato formaliza en especificación HTTP las restricciones definidas en la M1.

### Búsquedas realizadas
- **Búsqueda 1:** OpenAPI Spec — *Fuente:* https://learn.openapis.org/specification
  - *Lo que entendí:* Es un estándar para describir APIs REST en archivos YAML/JSON.
- **Búsqueda 2:** Prism Mock Server — *Fuente:* https://docs.stoplight.io/docs/prism
  - *Lo que entendí:* Prism simula endpoints reales usando la especificación del contrato.

---

## Reflexión
Lo que más me costó fue entender la estructura de componentes e interfaces en TypeScript al principio, pero me destrabé probando los comandos en la consola y viendo el comportamiento en el navegador.