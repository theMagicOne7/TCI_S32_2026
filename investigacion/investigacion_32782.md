
## BALLARRE CECILIA MARIEL, LEGAJO: 32782

# 3.2 Búsquedas

1.	¿Qué es una SPA (Single Page Application) y en qué se diferencia de una página tradicional (MPA)?

Una SPA descarga una unica pagina inicial y a partir de ahí solo pide datos al servidor para actualizar la vista dinamica sin recargar la pagina. 

Una MPA recarga una pagina completa desde el servidor cada vez que se hace click en algun enlace.

Fuente: [SPA vs MPA y las Arquitecturas Web - Arquitectura Java](https://www.arquitecturajava.com/spa-vs-mpa-y-las-arquitecturas-web/)

2.	¿Qué es una promesa (Promise) en JavaScript y para qué sirve? ¿Qué problema resuelve?

Una promesa es un objeto que representa el resultado ya sea de éxito o de fracaso, de una operación asincronica, sirve para coordinar tareas que toman tiempo

Fuente: [Promise - JavaScript | MDN](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Promise)

3.	¿Por qué fetch devuelve una promesa y no el dato directamente?

Fetch() se comunica con un servidor a traves de la red, un proceso que depende de la conexión, si devolviera el dato directamente bloquearia el hilo principal de Java y congelaria la interfaz de usuario, por eso devuelve una promesa que representa el valor pendiente y se resuelve con un response solamente cuando llegan los encabezados.

Fuente: [Uso de Fetch - API web | MDN](https://developer.mozilla.org/es/docs/Web/API/Fetch_API/Using_Fetch)

4.	¿Qué diferencia hay entre XMLHttpRequest (lo viejo) y fetch (lo actual)?

Fetch() es un estandar moderno basado enteramente en promesas, ofrece una sintaxis mucho mas limpia, lineal, ademas facilita el manejo de flujos de datos y cabeceras. En cambio, XMLHttpRequest se basa en eventos, objetos mutables y callbacks que exige mucho codigo repetitivo.

Fuente: [XMLHttpRequest vs Fetch: ¿Cuál Reina en el Desarrollo Web Moderno?](https://apidog.com/es/blog/xmlhttprequest-vs-fetch-3/)

---

PARTE B

4.2 Búsquedas

1.	¿Qué es un componente en React? ¿Por qué conviene dividir la UI en componentes?

Un componente es una pieza de interfaz independiente y reutilizable.
Conviene dividir la interfaz en componentes mas pequeños para modularizar y tener mejor orden en el desarrollo frontend, esto nos permite reutilizar, aislar, etc.

Fuente: [Componentes y propiedades – React](https://es.legacy.reactjs.org/docs/components-and-props.html)

2.	¿Qué es JSX? ¿Por qué se parece a HTML pero no es HTML?

JSX permite escribir codigo similar a HTML pero dentro de JavaScript. Se parece a HTML para que sea facil de armar la vista, pero no lo es porque el navegador no lo entiende de forma directa, debe pasar por una herramienta que convierte las etiquetase en llamadas a funciones, en JSX se pueden inscrustar expresiones de JavaScript directamente, en cambio en HTML se invocan mediante etiquetas externas.

Fuente: https://dev.to/easewithtuts/jsx-vs-html-40gl

3.	¿Qué es el estado (useState)? ¿En qué se diferencia de una variable común?

El estado es como una memoria con un componente que permite guardar datos que pueden cambiar con el uso, la diferencia con una variable comun es que si se cambia la variable comun el valor cambia internamente pero la pantalla no se entera, en cambio al cambiar un estado con su funcion, el react renderiza de nuevo el componente para mostrar el valor nuevo en pantalla.

Fuente: [useState – React](https://es.react.dev/reference/react/useState)

4.	¿Qué son las props? ¿En qué se diferencian del estado?

Las props son datos que un componente recibe desde afuera que le indica que tiene que mostrar, son datos de solo lectura, es decir, el componente solo puede usarlos, no tiene forma de modificarlo. 
Su diferencia principal con los estados, es el origen y el control de la informacion, los props vienen del exterior y son fijas para ese componente, en cambio, los estados son la memoria propia del componente para guardar datos que pueden cambiar con el uso.

Fuente: [¿Qué diferencia hay entre props y state? | React.js Wiki](https://www.reactjs.wiki/que-diferencia-hay-entre-props-y-state)

5.	¿Por qué usar TypeScript en el frontend? ¿Qué problema te resuelve antes de que el código corra?

Usar TypeScript en el frontend, permite agregar una capa de seguridad sobre JavaScript para definir que tipo de dato debe recibir o devolver cada parte de la aplicación. El problema principal que resuelve es que detecta las equivocaciones en el editor y al compilar antes de que el codigo llegue a ejecutarse o a los usuarios finales.

Fuente: [Qué es TypeScript y por qué aprenderlo | Henry Blog](https://www.soyhenry.com/blog/que-es-typescript-y-por-que-todo-full-stack-developer-deberia-aprenderlo-hoy)


4.5 Preguntas guía

1.	¿Qué relación ves entre el patrón "separar datos de la vista" que usaste en el taller de incidencia (clase del 14/09) y el estado de React?

En ambos casos se busca no mezclar la informacion con el diseño.

2.	¿Por qué el interface IncidenciaProps evita errores? ¿Dónde "vive" esa verificación: en el navegador o en el editor?

Evita errores porque define con exactitud qie datos necesita el componente y de que tipo deben ser.

3.	¿Qué hace Vite que antes hacías a mano (o con un script de <head>)?

Transforma automaticamente el codigo en JavaScript estandar que cualquier navegador puede entender. Une y gestiona distintos archivos y librerias sin tener que agregar manualmente las etiquetas <script> en el <head>, ademas actualiza la pagina en tiempo real, una vez que cambiamos el codigo, la pantalla se refresca sin tener que recargar la pagina.

