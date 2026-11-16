// CONFIGURACIÓN CENTRALIZADA DE RUTAS DE LA APLICACIÓN

import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { RepuestosPage } from './pages/RepuestoPage';
// 👇 1. Importamos el nuevo componente inteligente (y borramos HistorialPage)
import { AuditoriaAreaPage } from './pages/AuditoriaAREAPage';
import { type TemaPaleta } from './types/index';
import { RecepcionPage } from './pages/RecepcionPage';
import { SimuladorPage } from './pages/SimuladorPage';
import { NuevaIncidenciaPage } from './pages/NuevaIncidenciaPage';
import { AuditoriaIncidenciasPage } from './pages/AuditoriaIncidenciasPage';

interface RouterConfigProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  usuario: string | null;
  rol: string | null;
  onCerrarSesion: () => void;
}

export const createAppRouter = ({
  tema,
  esModoOscuro,
  onToggleTema,
  usuario,
  rol,
  onCerrarSesion
}: RouterConfigProps) =>
  createBrowserRouter([
    {
      path: '/',
      element: (
        <AppLayout
          tema={tema}
          esModoOscuro={esModoOscuro}
          onToggleTema={onToggleTema}
          usuario={usuario}
          rol={rol}
          onCerrarSesion={onCerrarSesion}
        />
      ),
      children: [
        {
          index: true,
          element: <HomePage />
        },
        {
          path: 'repuestos',
          element: <RepuestosPage />
        },
        {
          path: 'recepcion',
          element: <RecepcionPage/>
        },
        // 👇 2. NUEVAS RUTAS DE AUDITORÍA AISLADAS POR DOMINIO 👇
        {
          path: 'auditoria/deposito',
          element: <AuditoriaAreaPage areaObjetivo="deposito" titulo="📦 Auditoría de Depósito" />
        },
        {
          path: 'auditoria/mantenimiento',
          element: <AuditoriaAreaPage areaObjetivo="mantenimiento" titulo="🔧 Auditoría de Mantenimiento" />
        },
        {
          path: 'auditoria/produccion',
          element: <AuditoriaAreaPage areaObjetivo="produccion" titulo="⚙️ Auditoría de Producción" />
        },
        // 👆 FIN NUEVAS RUTAS 👆
        {
          path: 'simulador',
          element: <SimuladorPage/>
        },
        {
          path: 'nueva-incidencia',
          element: <NuevaIncidenciaPage/>
        },
        {
          path: 'auditoria-incidencias',
          element: <AuditoriaIncidenciasPage/>
        }

      ]
    }
  ]);