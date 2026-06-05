'use client';
//ESTE CODIGO REQUIERE UN ID MAP
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

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
        key={`${coordenadas.lat}-${coordenadas.lng}`}
        zoom={zoom}
        disableDefaultUI={true}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
        gestureHandling={'greedy'}
        className="w-full h-full"
      >
        <AdvancedMarker key={`${coordenadas.lat}-${coordenadas.lng}`} position={coordenadas}>
          {/* Usamos el Pin nativo de Google */}
          <Pin 
            background={'#ef4444'} // Red-500
            glyphColor={'#ffffff'} 
            borderColor={'#991b1b'} 
          />
          
          {/* El texto del radio lo mantenemos externo, 
              pero al no ser parte del marcador, el mapa no se confunde */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
            {radio} Km a la redonda
          </div>
        </AdvancedMarker>
      </Map>
    </div>
  );
}
