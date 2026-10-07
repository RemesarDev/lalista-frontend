// app/_hooks/useDirecciones.ts
'use client';

import { useListaStore } from '@/app/_store/store';
import type { DireccionGuardada } from '@/app/_types/direcciones';
import { useRouter } from 'next/navigation';
import { fetchSucursalesCercanas } from '@/app/_lib/services/sucursalesService';
import { activarDireccion, eliminarDireccion as eliminarDireccionApi } from '@/app/_lib/services/direccionesService';
import { avisar } from '@/app/_lib/avisos';
import { USER_LIMITS } from '../_lib/constants/limites';

// Definí el límite o importalo de tus constantes compartidas (ej: USER_LIMITS.direcciones.max)
const LIMITE_DIRECCIONES = USER_LIMITS.MAX_DIRECCIONES; // 7 direcciones guardadas
export function useDirecciones(onClose: () => void) {
  const { user, direccionesGuardadas, setUbicacion, cargarDirecciones, abrirModalLimite } = useListaStore();
  const router = useRouter();

  const irAgregarDireccion = () => {
    // 🛑 VALIDACIÓN TEMPRANA: Si ya alcanzó o superó el límite, frenamos acá y abrimos el modal
    if (user && direccionesGuardadas.length >= LIMITE_DIRECCIONES) {
      onClose();
      abrirModalLimite(`Has alcanzado el límite máximo de ${LIMITE_DIRECCIONES} direcciones guardadas. Eliminá una existente para poder agregar una nueva.`);
      return;
    }

    onClose();
    router.push('/ubicacion');
  };

  const seleccionarDireccion = async (dir: DireccionGuardada) => {
    // Actualización optimista: mueve el check visualmente de inmediato
    useListaStore.setState((state) => ({
      direccionesGuardadas: state.direccionesGuardadas.map((d) => ({
        ...d,
        esActiva: d.id === dir.id,
      })),
    }));

    setUbicacion({
      latitud: dir.latitud,
      longitud: dir.longitud,
      precision: null,
      radioBusqueda: dir.radioBusqueda,
      nombreLugar: dir.nombreLugar,
      cargandoUbicacion: false,
    });

    onClose();

    // Refresca sucursales para la nueva dirección activa (en paralelo con el PATCH)
    fetchSucursalesCercanas(dir.latitud, dir.longitud, dir.radioBusqueda)
      .then((sucursales) => {
        if (sucursales) useListaStore.getState().setSucursalesCercanas(sucursales);
      })
      .catch(console.error);

    // Persiste en DB en segundo plano
    const ok = await activarDireccion(dir.id);
    if (!ok) {
      // Si falla, resincroniza desde DB
      await cargarDirecciones();
    }
  };

  const eliminarDireccion = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await eliminarDireccionApi(id);
    if (ok) {
      await cargarDirecciones();
      // Si no quedan direcciones, limpiar la ubicación del store
      const restantes = useListaStore.getState().direccionesGuardadas;
      if (restantes.length === 0) {
        useListaStore.setState((state) => ({
          ubicacion: {
            ...state.ubicacion,
            latitud: null,
            longitud: null,
            nombreLugar: null,
            precision: null,
          },
        }));
        useListaStore.getState().limpiarSucursales();
      }
    } else {
      avisar.error('No pudimos borrar la dirección. Probá de nuevo.');
    }
  };

  const limpiarUbicacion = () => {
    useListaStore.setState((state) => ({
      ubicacion: {
        ...state.ubicacion,
        latitud: null,
        longitud: null,
        nombreLugar: null,
        precision: null,
      },
    }));
    useListaStore.getState().limpiarSucursales();
    onClose();
  };

  const mostrarGuardadas = !!user && direccionesGuardadas.length > 0;

  return {
    user,
    direccionesGuardadas,
    mostrarGuardadas,
    irAgregarDireccion,
    seleccionarDireccion,
    eliminarDireccion,
    limpiarUbicacion,
  };
}