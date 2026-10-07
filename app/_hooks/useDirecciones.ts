'use client';

import { useListaStore } from '@/app/_store/store';
import type { DireccionGuardada } from '@/app/_types/direcciones';
import { useRouter } from 'next/navigation';
import { fetchSucursalesCercanas } from '@/app/_lib/services/sucursalesService';
import { activarDireccion, eliminarDireccion as eliminarDireccionApi } from '@/app/_lib/services/direccionesService';
import { avisar } from '@/app/_lib/avisos';

export function useDirecciones(onClose: () => void) {
  const { user, ubicacion, direccionesGuardadas, setUbicacion, cargarDirecciones } = useListaStore();
  const router = useRouter();

  const irACambiarDireccion = () => {
    onClose();
    router.push('/ubicacion');
  };

  // Los anónimos tienen una sola dirección: para sumar otra hay que tener
  // cuenta. En vez de mandarlos al login de prepo, el aviso lo cuenta y deja el
  // sheet abierto; si no tocan "Entrar", no se van a ningún lado.
  const irAgregarDireccion = () => {
    if (!user && ubicacion.nombreLugar) {
      avisar.invitarAEntrar('Con una cuenta guardás todas tus direcciones.', () => {
        onClose();
        router.push('/login');
      });
      return;
    }
    irACambiarDireccion();
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
    irACambiarDireccion,
    seleccionarDireccion,
    eliminarDireccion,
    limpiarUbicacion,
  };
}