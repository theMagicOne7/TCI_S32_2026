// CONFIGURACIÓN CENTRALIZADA DE RUTAS DE LA APLICACIÓN

import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { RepuestosPage } from './pages/RepuestoPage';
import { HistorialPage } from './pages/HistorialPage';
import { type TemaPaleta } from './types/index';

interface RouterConfigProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
}

export const createAppRouter = ({ tema, esModoOscuro, onToggleTema }: RouterConfigProps) =>
  createBrowserRouter([
    {
      path: '/',
      element: (
        <AppLayout
          tema={tema}
          esModoOscuro={esModoOscuro}
          onToggleTema={onToggleTema}
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
          path: 'historial',
          element: <HistorialPage />
        }
      ]
    }
  ]);