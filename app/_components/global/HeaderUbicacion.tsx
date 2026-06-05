'use client';

import { useListaStore } from '@/app/_store/store';
import Header from './Header';

export default function HeaderUbicacion() {
  const { ubicacion, setUbicacion } = useListaStore();
  
  const limpiarUbicacion = () => {
    setUbicacion({
      latitud: null,
      longitud: null,
      precision: null,
      radioBusqueda: ubicacion.radioBusqueda,
      nombreLugar: null,
      cargandoUbicacion: false,
    });
  };

  return (
    <Header 
      locationName={ubicacion.nombreLugar ?? undefined}
      onLimpiarUbicacion={ubicacion.nombreLugar ? limpiarUbicacion : undefined}
    />
  );
}