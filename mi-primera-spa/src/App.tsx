import { useState } from 'react';
import Incidencia from './Incidencia';

function App() {
  const [contador, setContador] = useState(0);

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Reportes de Incidencia — Lucía Durán</h1>
      
      {/* Estado con useState */}
      <button onClick={() => setContador(contador + 1)}>
        Contador de clicks: {contador}
      </button>

      {/* Punto 7: Renderizar 2 o 3 incidencias con datos simulados */}
      <Incidencia maquina="CAL-001" descripcion="Ruido excesivo en la banda transportadora" />
      <Incidencia maquina="PNS-004" descripcion="Fuga de aceite hidráulico en el pistón principal" />
      <Incidencia maquina="EMB-002" descripcion="Fallo en sensor de temperatura" />
    </main>
  );
}

export default App;