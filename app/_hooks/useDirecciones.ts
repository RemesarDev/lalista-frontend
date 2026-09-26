'use client';

import { useListaStore } from '@/app/_store/store';
import type { DireccionGuardada } from '@/app/_types/direcciones';
import { useRouter } from 'next/navigation';

export function useDirecciones(onClose: () => void) {
  const { user, direccionesGuardadas, setUbicacion, cargarDirecciones } = useListaStore();
  const router = useRouter();

  const irAgregarDireccion = () => {
    onClose();
    router.push('/ubicacion');
  };

  const seleccionarDireccion = async (dir: DireccionGuardada) => {
  // Actualización optimista: el UI responde inmediato
  setUbicacion({
    latitud: dir.latitud,
    longitud: dir.longitud,
    precision: null,
    radioBusqueda: dir.radioBusqueda,
    nombreLugar: dir.nombreLugar,
    cargandoUbicacion: false,
  });
  onClose();

  // Persiste en DB en segundo plano
  await cambiarDireccionActiva(dir.id);
};

  const eliminarDireccion = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const res = await fetch(`/api/direcciones/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await cargarDirecciones(); // refresca la lista desde DB
    }
  };

  const cambiarDireccionActiva = async (id: string) => {
    const res = await fetch(`/api/direcciones/${id}/activar`, { method: 'PATCH' });
    if (res.ok) {
      await cargarDirecciones();
    }
  };

  const mostrarGuardadas = !!user && direccionesGuardadas.length > 0;

  return {
    user,
    direccionesGuardadas,
    mostrarGuardadas,
    irAgregarDireccion,
    seleccionarDireccion,
    eliminarDireccion,
  };
}