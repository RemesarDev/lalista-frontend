import { useRef, useCallback } from 'react';
import { useListaStore } from '@/app/_store/store';
import { fetchSucursalesCercanas } from '@/app/_lib/services/sucursalesService';

export function useBuscarSucursales() {
  const { setCargandoSucursales, setSucursalesCercanas } = useListaStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Consulta directa a la API usando las coordenadas y radio guardados en Zustand
  const buscarSucursales = useCallback(async () => {
    const { latitud, longitud, radioBusqueda } = useListaStore.getState().ubicacion;

    if (!latitud || !longitud) return;

    try {
      setCargandoSucursales(true);

      const sucursales = await fetchSucursalesCercanas(latitud, longitud, radioBusqueda);
      if (!sucursales) throw new Error('Error al actualizar sucursales');
      setSucursalesCercanas(sucursales);
    } catch (err) {
      console.error('Error actualizando sucursales:', err);
    } finally {
      setCargandoSucursales(false);
    }
  }, [setCargandoSucursales, setSucursalesCercanas]);

  // Ejecuta la búsqueda pospuesta un tiempo determinado (Debounce)
  const buscarConDebounce = useCallback((ms: number = 600) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      buscarSucursales();
    }, ms);
  }, [buscarSucursales]);

  return {
    buscarSucursales,
    buscarConDebounce,
  };
}