// REQ-IP-02: Señal de vida para verificar carga correcta en DevTools
console.log("app.js cargado ✅");

// REQ-IP-03 y P5: Selección de elementos y listeners para separar estructura de comportamiento
const form = document.querySelector("#form-incidencia");
const codigoInput = document.querySelector("#codigo-maquina");
const descripcionInput = document.querySelector("#descripcion");
const turnoInput = document.querySelector("#turno");

// REQ-IP-06: Función con responsabilidad única de lectura (P3: objeto para UNA incidencia)
function leerFormulario() {
    return {
        codigoMaquina: codigoInput.value.trim(),
        descripcion: descripcionInput.value.trim(),
        turno: turnoInput.value
    };
}

// REQ-IP-04 y REQ-IP-05: Handler de submit desacoplado de la estructura HTML (P5)
form.addEventListener("submit", (event) => {
    event.preventDefault(); // REQ-IP-05: Evita la recarga nativa de la página

    const incidencia = leerFormulario();
    console.table(incidencia);
});