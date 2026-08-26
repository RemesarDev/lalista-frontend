'use client';

import { MapPinIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';
import { useRouter } from 'next/navigation';
import SliderHorizontal from '../Slider/SliderHorizontal';
import { useBuscarSucursales } from '../_hooks/useBuscarSucursales';


export default function HeaderLocation() {
  const { ubicacion, setUbicacion, cambiarRadioBusqueda, setSucursalesCercanas } = useListaStore();
  const { buscarConDebounce } = useBuscarSucursales();
  const router = useRouter();

  const irAUbicacion = () => router.push('/ubicacion');

  const limpiarUbicacion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUbicacion({
      latitud: null, 
      longitud: null, 
      precision: null,
      radioBusqueda: ubicacion.radioBusqueda, 
      nombreLugar: null, 
      cargandoUbicacion: false,
    });
    setSucursalesCercanas([]);
  };

  const handleRadioChange = (nuevoRadio: number) => {
    // 1. Actualización visual/local inmediata en Zustand
    cambiarRadioBusqueda(nuevoRadio);

    // 2. Disparar búsqueda pospuesta a través del hook
    buscarConDebounce(600);
  };

  return (
    <div className="flex items-center gap-2 w-full justify-between px-2 min-w-0"> 
      
      {/* Selector de Dirección */}
      <div 
        role="button"
        onClick={irAUbicacion}
        className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white border border-white/10 cursor-pointer flex-1 mr-2 min-w-0"
      >
        <MapPinIcon className="text-[10px] shrink-0" />
        <span className="truncate font-medium block">
          {ubicacion.nombreLugar || "Ubicación..."}
        </span>
        
        {ubicacion.nombreLugar && (
          <button onClick={limpiarUbicacion} className="p-0.5 rounded-full hover:bg-white/20">
            <XIcon className="text-[10px]" />
          </button>
        )}
      </div>

      {/* Slider de radio */}
      <div className="w-24 shrink-0 scale-90">
        <SliderHorizontal 
          value={ubicacion.radioBusqueda}
          min={1} 
          max={10} 
          step={1}
          onChange={handleRadioChange}
        />
      </div>
    </div>
  );
}