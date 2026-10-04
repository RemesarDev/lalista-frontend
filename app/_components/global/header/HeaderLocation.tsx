'use client';

import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';
import { useRef, useState } from 'react';
import SliderHorizontal from '../Slider/SliderHorizontal';
import { useBuscarSucursales } from '../_hooks/useBuscarSucursales';
import { actualizarRadioDireccion } from '@/app/_lib/services/direccionesService';
import DireccionSheet from './DireccionSheet';

export default function HeaderLocation() {
  const { ubicacion, cambiarRadioBusqueda } = useListaStore();
  const { buscarConDebounce } = useBuscarSucursales();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const timerPersistir = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A diferencia del slider del mapa, acá no hay botón de guardado: persistimos solos
  const persistirRadioConDebounce = (nuevoRadio: number) => {
    const activa = useListaStore.getState().direccionesGuardadas.find((d) => d.esActiva);
    if (!activa) return;

    useListaStore.setState((state) => ({
      direccionesGuardadas: state.direccionesGuardadas.map((d) =>
        d.esActiva ? { ...d, radioBusqueda: nuevoRadio } : d
      ),
    }));

    clearTimeout(timerPersistir.current);
    timerPersistir.current = setTimeout(() => {
      actualizarRadioDireccion(activa.id, nuevoRadio).catch(console.error);
    }, 800);
  };

  const handleRadioChange = (nuevoRadio: number) => {
    cambiarRadioBusqueda(nuevoRadio);
    buscarConDebounce(600);
    persistirRadioConDebounce(nuevoRadio);
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full justify-between px-2 min-w-0">

        {/* Selector de Dirección */}
        <div
          role="button"
          onClick={() => setSheetAbierto(true)}
          className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white border border-white/10 cursor-pointer flex-1 mr-2 min-w-0"
        >
          <MapPinIcon className="text-[10px] shrink-0" />
          <span className="truncate font-medium block">
            {ubicacion.nombreLugar || 'Elegí tu dirección'}
          </span>
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