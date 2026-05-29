'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { PlusIcon, MinusIcon } from '@phosphor-icons/react/dist/ssr';

interface ControlesZoomProps {
  zoom: number;
  setZoom: (value: number) => void;
}

export default function ControlesZoom({ zoom, setZoom }: ControlesZoomProps) {
  const map = useMap();

  const cambiarZoom = (factor: number) => {
    const nuevoZoom = zoom + factor;
    // Mantenemos los límites de seguridad que ya tenías configurados
    if (nuevoZoom >= 10 && nuevoZoom <= 19) {
      setZoom(nuevoZoom);
      if (map) map.setZoom(nuevoZoom);
    }
  };

  return (
    <div className="absolute top-20 right-4 z-30 flex flex-col bg-white border border-slate-200/80 shadow-xl rounded-xl overflow-hidden">
      <button 
        type="button" 
        onClick={() => cambiarZoom(1)} 
        className="p-2.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 flex items-center justify-center font-bold"
      >
        <PlusIcon weight="bold" className="text-xs" />
      </button>
      <button 
        type="button" 
        onClick={() => cambiarZoom(-1)} 
        className="p-2.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center font-bold"
      >
        <MinusIcon weight="bold" className="text-xs" />
      </button>
    </div>
  );
}