'use client';

import { MapPinIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';
import { useState } from 'react';
import SliderHorizontal from '../Slider/SliderHorizontal';
import { useBuscarSucursales } from '../_hooks/useBuscarSucursales';
import DireccionSheet from './DireccionSheet';

export default function HeaderLocation() {
  const { ubicacion, setUbicacion, cambiarRadioBusqueda, setSucursalesCercanas } = useListaStore();
  const { buscarConDebounce } = useBuscarSucursales();
  const [sheetAbierto, setSheetAbierto] = useState(false);

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
    cambiarRadioBusqueda(nuevoRadio);
    buscarConDebounce(600);
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full justify-between px-2 min-w-0">

        {/* Selector de Dirección — ahora abre el sheet */}
        <div
          role="button"
          onClick={() => setSheetAbierto(true)}
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

      <DireccionSheet
        isOpen={sheetAbierto}
        onClose={() => setSheetAbierto(false)}
      />
    </>
  );
}