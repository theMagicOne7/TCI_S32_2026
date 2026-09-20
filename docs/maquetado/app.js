console.log("app.js cargado ");

const form = document.querySelector("#form-incidencia");
const codigoInput = document.querySelector("#codigo-maquina");
const descripcionInput = document.querySelector("#descripcion");
const turnoInput = document.querySelector("#turno");
const previewContainer = document.querySelector("#preview-incidencia");
const contadorSpan = document.querySelector("#contador");

descripcionInput.addEventListener("input", () => {
    const longitud = descripcionInput.value.length;
    contadorSpan.textContent = `${longitud}/300`;
});

function renderizarPreview(incidencia) {
    const NOMBRES_TURNO = { mañana: "Mañana", tarde: "Tarde", noche: "Noche" };
    const turnoLegible = NOMBRES_TURNO[incidencia.turno] ?? incidencia.turno;

    previewContainer.textContent = `✅ Incidencia registrada: ${incidencia.codigoMaquina} · Turno ${turnoLegible} — Descripción: ${incidencia.descripcion}`;
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const incidencia = {
        codigoMaquina: codigoInput.value,
        descripcion: descripcionInput.value,
        turno: turnoInput.value
    };

    console.table(incidencia);

    renderizarPreview(incidencia);
    previewContainer.hidden = false;

    form.reset();
    contadorSpan.textContent = "0/300";
});