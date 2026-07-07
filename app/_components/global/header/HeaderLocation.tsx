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
    <div className="flex items-center gap-3 w-full justify-center md:justify-end">
      {/* Selector de Dirección */}
      <div
        role="button"
        onClick={irAUbicacion}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-white border border-white/10 text-sm hover:bg-white/20 transition cursor-pointer min-w-0 flex-1 max-w-[250px]"
      >
        <MapPinIcon className="text-base shrink-0 opacity-80" />
        <span className="truncate font-semibold text-xs">
          {ubicacion.nombreLugar || "Buscar..."}
        </span>
        {ubicacion.nombreLugar && (
          <button onClick={limpiarUbicacion} className="p-0.5 rounded-full hover:bg-white/20">
            <XIcon className="text-xs" />
          </button>
        )}
      </div>

      {/* Slider integrado */}
      <div className="w-32 shrink-0">
        <SliderHorizontal 
          value={ubicacion.radioBusqueda}
          min={1} max={10} step={1}
          onChange={cambiarRadioBusqueda}
        />
      </div>
    </div>
  );
}