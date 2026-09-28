import { Incidencia } from './components/Incidencia'
import './App.css'

function App() {
  return (
    <main className="pagina">
      <header className="encabezado">
        <p className="eyebrow">Mesa de ayuda</p>
        <h1>Incidencias</h1>
        <p>Ejemplo de componente creado con React y TypeScript.</p>
      </header>

      <Incidencia
        titulo="No se puede registrar una incidencia"
        descripcion="Al enviar el formulario, la aplicación no confirma la operación y el usuario no recibe un número de seguimiento."
        prioridad="Alta"
        estado="En progreso"
      />
    </main>
  )
}

export default App
