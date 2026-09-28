type Prioridad = 'Alta' | 'Media' | 'Baja'

interface IncidenciaProps {
  titulo: string
  descripcion: string
  prioridad: Prioridad
  estado: 'Abierta' | 'En progreso' | 'Resuelta'
}

export function Incidencia({
  titulo,
  descripcion,
  prioridad,
  estado,
}: IncidenciaProps) {
  return (
    <article className="incidencia">
      <div className="incidencia__cabecera">
        <span className={`etiqueta etiqueta--${prioridad.toLowerCase()}`}>
          Prioridad {prioridad}
        </span>
        <span className="estado">{estado}</span>
      </div>

      <h2>{titulo}</h2>
      <p>{descripcion}</p>
      <footer>Asignada a: Equipo de soporte</footer>
    </article>
  )
}
