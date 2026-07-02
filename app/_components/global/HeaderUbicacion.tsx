'use client';

import { useListaStore } from '@/app/_store/store';
import Header from './Header';
import SliderHorizontal from './Slider/SliderHorizontal';

export default function HeaderUbicacion() {
  // Asegúrate de incluir cambiarRadioBusqueda aquí
  const { ubicacion, setUbicacion, cambiarRadioBusqueda } = useListaStore();
  
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
    >
      {/* Esto aparecerá automáticamente dentro del header pero debajo de la fila superior */}
      <SliderHorizontal 
        value={ubicacion.radioBusqueda}
        min={1}
        max={10}
        step={1}
        onChange={cambiarRadioBusqueda}
      />
    </Header>
  );
}