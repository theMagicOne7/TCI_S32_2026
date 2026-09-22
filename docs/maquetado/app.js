// REQ-IP-02: Señal de vida para verificar carga en consola
console.log("app.js cargado ✅");

// REQ-IP-03 y P5: Selección de elementos del DOM
const form = document.querySelector("#form-incidencia");
const codigoInput = document.querySelector("#codigo-maquina");
const descripcionInput = document.querySelector("#descripcion");
const turnoInput = document.querySelector("#turno");
const previewContainer = document.querySelector("#preview-incidencia");
const contadorSpan = document.querySelector("#contador");

// REQ-IP-16A: Feedback en vivo mientras el operario escribe
descripcionInput.addEventListener("input", () => {
    const longitud = descripcionInput.value.length;
    contadorSpan.textContent = `${longitud}/300`;
});

// REQ-IP-06: Función con responsabilidad única de lectura (P3: objeto para UNA incidencia)
function leerFormulario() {
    return {
        codigoMaquina: codigoInput.value.trim(),
        descripcion: descripcionInput.value.trim(),
        turno: turnoInput.value
    };
}

// REQ-IP-08: Renderizado seguro con textContent y traducción de turnos (P3: objeto traductor)
function renderizarPreview(incidencia) {
    const NOMBRES_TURNO = { mañana: "Mañana", tarde: "Tarde", noche: "Noche" };
    const turnoLegible = NOMBRES_TURNO[incidencia.turno] ?? incidencia.turno;

    previewContainer.textContent = `✅ Incidencia registrada: ${incidencia.codigoMaquina} · Turno ${turnoLegible} — Descripción: ${incidencia.descripcion}`;
}

// REQ-IP-04 y REQ-IP-05: Handler de submit desacoplado de la estructura HTML (P5)
form.addEventListener("submit", (event) => {
    event.preventDefault(); // REQ-IP-05: Evita la recarga y pérdida de datos

    const incidencia = leerFormulario();
    console.table(incidencia);

    renderizarPreview(incidencia);
    previewContainer.hidden = false; // REQ-IP-09: Visibiliza el estado del sistema

    form.reset(); // REQ-IP-15: Limpia campos para la siguiente carga
    contadorSpan.textContent = "0/300";
});