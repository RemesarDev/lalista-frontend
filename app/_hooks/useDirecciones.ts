'use client';

import { useListaStore } from '@/app/_store/store';
import type { DireccionGuardada } from '@/app/_types/direcciones';
import { useRouter } from 'next/navigation';
import { fetchSucursalesCercanas } from '@/app/_lib/services/sucursalesService';

export function useDirecciones(onClose: () => void) {
  const { user, direccionesGuardadas, setUbicacion, cargarDirecciones } = useListaStore();
  const router = useRouter();

  const irAgregarDireccion = () => {
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
    const res = await fetch(`/api/direcciones/${dir.id}/activar`, { method: 'PATCH' });
    if (!res.ok) {
      // Si falla, resincroniza desde DB
      await cargarDirecciones();
    }
  };

  const eliminarDireccion = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const res = await fetch(`/api/direcciones/${id}`, { method: 'DELETE' });
    if (res.ok) {
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
      }
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