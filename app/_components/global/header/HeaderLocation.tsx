'use client';

import { MapPinIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';
import { useRouter } from 'next/navigation';
import SliderHorizontal from '../Slider/SliderHorizontal';

export default function HeaderLocation() {
  const { ubicacion, setUbicacion, cambiarRadioBusqueda } = useListaStore();
  const router = useRouter();

  const irAUbicacion = () => router.push('/ubicacion');

  const limpiarUbicacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUbicacion({
      latitud: null, longitud: null, precision: null,
      radioBusqueda: ubicacion.radioBusqueda, nombreLugar: null, cargandoUbicacion: false,
    });
  };

  return (
// Dentro de HeaderLocation.tsx
// Ajustamos las clases de los elementos internos
    <div className="flex items-center gap-2 w-full justify-between px-2"> 
      
      {/* Selector de Dirección (Compacto en móvil) */}
      <div className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white border border-white/10 cursor-pointer flex-1 mr-2">
        <MapPinIcon className="text-[10px] shrink-0" />
        <span className="truncate font-medium">
          {ubicacion.nombreLugar || "Ubicación..."}
        </span>
      </div>

      {/* Slider (Ajustado a un tamaño más pequeño) */}
      <div className="w-24 shrink-0 scale-90">
        <SliderHorizontal 
          value={ubicacion.radioBusqueda}
          min={1} max={10} step={1}
          onChange={cambiarRadioBusqueda}
        />
      </div>
    </div>
  );
}