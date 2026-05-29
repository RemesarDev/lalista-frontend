'use client';

import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Coordenadas {
  lat: number;
  lng: number;
}

interface MapaInteractivoProps {
  coordenadas: Coordenadas;
  zoom: number;
  setZoom: (value: number) => void;
  radio: number;
}

export default function MapaInteractivo({
  coordenadas,
  zoom,
  setZoom,
  radio,
}: MapaInteractivoProps) {
  return (
    <div className="absolute inset-0 w-full h-full z-0 select-none">
      <Map
        defaultCenter={coordenadas}
        center={coordenadas} // Asegura que el mapa se mueva cuando cambian las coordenadas externamente
        zoom={zoom}
        disableDefaultUI={true} 
        mapId="DEMO_MAP_ID" 
        onCameraChanged={(ev) => {
          setZoom(ev.detail.zoom);
        }}
        gestureHandling={'greedy'} 
        className="w-full h-full"
      />

      {/* PIN AVANZADO */}
      <AdvancedMarker position={coordenadas}>
        <div className="flex flex-col items-center pointer-events-none -translate-y-8">
          <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
            {radio} Km a la redonda
          </div>
          <MapPinIcon weight="fill" className="text-red-500 text-4xl drop-shadow-md" />
        </div>
      </AdvancedMarker>
    </div>
  );
}