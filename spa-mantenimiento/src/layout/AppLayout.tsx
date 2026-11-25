// CONTENEDOR GENERAL RESPONSIVE PARA PLANTA INDUSTRIAL

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  type TemaPaleta, 
  type MovimientoStock, 
  type UsuarioPlanta, 
  type OrdenCompra, 
  type LayoutContextType, 
  type Repuesto,
  type Incidencia 
} from '../types/index';
import { 
  fetchRepuestos,
  actualizarRepuestoAPI, 
  crearRepuestoAPI, 
  fetchMovimientos, 
  crearMovimientoAPI,
  fetchIncidencias,
  crearIncidenciaAPI,
  actualizarIncidenciaAPI
 } from '../data';
import { NavBar } from '../components/NavBar';

interface AppLayoutProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  usuarioActual: UsuarioPlanta;
  onCerrarSesion: () => void;
}

const STORAGE_OC_KEY = 'planta_ordenes_compra_v1';

export function AppLayout({ tema, esModoOscuro, onToggleTema, usuarioActual, onCerrarSesion }: AppLayoutProps) {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);

  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_OC_KEY);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OC_KEY, JSON.stringify(ordenesCompra));
    } catch (e) {
      console.warn('[AppLayout] No se pudo guardar OCs en localStorage:', e);
    }
  }, [ordenesCompra]);

  useEffect(() => {
    let activo = true;
    fetchRepuestos()
      .then((lista) => {
        if (activo) setRepuestos(lista);
      })
      .catch((err) => {
        console.warn('[AppLayout] No se pudo cargar el inventario desde la API:', err);
      });
      fetchMovimientos()
      .then((lista) => {
        if (activo) setMovimientos(lista);
      })
      .catch((err) => {
        console.warn('[AppLayout] No se pudo cargar el historial de auditorías:', err);
      });

    fetchIncidencias()
      .then((lista) => {
        if (activo) setIncidencias(lista);
      })
      .catch((err) => {
        console.warn('[AppLayout] No se pudo cargar las incidencias desde la API:', err);
      });

    return () => {
      activo = false;
    };
  }, []);

  const actualizarRepuesto = (repuestoModificado: Repuesto) => {
    const existe = repuestos.some(
      (r) => r.codigo.trim().toUpperCase() === repuestoModificado.codigo.trim().toUpperCase()
    );
    setRepuestos((prev) => 
      existe
        ? prev.map((r) =>
            r.codigo.trim().toUpperCase() === repuestoModificado.codigo.trim().toUpperCase()
              ? repuestoModificado
              : r
          )
        : [...prev, repuestoModificado]
    );

    const operacion = existe
      ? actualizarRepuestoAPI(repuestoModificado)
      : crearRepuestoAPI(repuestoModificado);

    operacion
      .then((guardado) => {
        setRepuestos((prev) =>
          prev.map((r) =>
            r.codigo.trim().toUpperCase() === guardado.codigo.trim().toUpperCase() ? guardado : r
          )
        );
      })
      .catch((err) => {
        console.error('[AppLayout] Error al persistir repuesto en PostgreSQL:', err);
      });
  };

  const agregarMovimiento = (nuevo: MovimientoStock) => {
    const motivo = (nuevo.motivoUso || '').toLowerCase();
    const areaDetectada =
      (nuevo as MovimientoStock & { area?: string }).area ||
      (motivo.includes('depósito') || motivo.includes('oc-')
        ? 'deposito'
        : usuarioActual.area === 'direccion'
        ? 'mantenimiento'
        : usuarioActual.area);

    const movimientoConArea = {
      ...nuevo,
      motivoUso: nuevo.motivoUso || '',
      maquinaVinculada: nuevo.maquinaVinculada || 'N/A',
      area: areaDetectada,
    };
    setMovimientos((prev) => [movimientoConArea, ...prev]);

    const { id: _idDescartable, ...payloadSinId } = movimientoConArea;

    crearMovimientoAPI(payloadSinId)
      .then((guardado) => {
        setMovimientos((prev) =>
          prev.map((m) => (m.id === nuevo.id ? guardado : m))
        );
      })
      .catch((err) => {
        console.error('[AppLayout] Error al persistir auditoría en PostgreSQL:', err);
      });
  };

  const agregarOrdenCompra = (nueva: OrdenCompra) => {
    setOrdenesCompra((prev) => [...prev, nueva]);
  };

  const actualizarOrdenCompra = (ocModificada: OrdenCompra) => {
    setOrdenesCompra((prev) => prev.map((oc) => (oc.id === ocModificada.id ? ocModificada : oc)));
  };

  const agregarIncidencia = (nueva: Incidencia) => {
    setIncidencias((prev) => [nueva, ...prev]);

    crearIncidenciaAPI(nueva)
      .then((guardada) => {
        setIncidencias((prev) =>
          prev.map((inc) => (inc.id === nueva.id ? guardada : inc))
        );
      })
      .catch((err) => {
        console.error('[AppLayout] Error al persistir incidencia en PostgreSQL:', err);
      });
  };

  const actualizarIncidencia = (incModificada: Incidencia) => {
    setIncidencias((prev) => prev.map((inc) => (inc.id === incModificada.id ? incModificada : inc)));

    actualizarIncidenciaAPI(incModificada)
      .catch((err) => {
        console.error('[AppLayout] Error al actualizar incidencia en PostgreSQL:', err);
      });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        padding: '20px 16px',
        display: 'flex',
        justifyContent: 'center',
        background: tema.fondoPagina,
        transition: 'background-color 0.3s ease'
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '960px',
          background: tema.fondoTarjeta,
          borderRadius: '16px',
          border: `1px solid ${tema.borde}`,
          padding: '24px',
          boxShadow: esModoOscuro
            ? '0 10px 30px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(13, 148, 136, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transition: 'all 0.3s ease'
        }}
      >
        <NavBar
          tema={tema}
          esModoOscuro={esModoOscuro}
          onToggleTema={onToggleTema}
          usuarioActual={usuarioActual}
          onCerrarSesion={onCerrarSesion}
          incidencias={incidencias}
        />

        <div style={{ width: '100%' }}>
          <Outlet
            context={{
              tema,
              esModoOscuro,
              movimientos,
              agregarMovimiento,
              usuarioActual,
              ordenesCompra,
              agregarOrdenCompra,
              actualizarOrdenCompra,
              repuestos,
              actualizarRepuesto,
              incidencias,
              agregarIncidencia,
              actualizarIncidencia
            } satisfies LayoutContextType}
          />
        </div>
      </main>
    </div>
  );
}