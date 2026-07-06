'use client';
import { Map, AdvancedMarker, Pin, Circle } from '@vis.gl/react-google-maps';

interface Coordenadas {
  lat: number;
  lng: number;
}

interface MapaInteractivoProps {
  coordenadas: Coordenadas;
  zoom: number;
  setZoom: (value: number) => void;
  radio: number;
  onMapClick: (lat: number, lng: number) => void;
}

export default function MapaInteractivo({
  coordenadas,
  zoom,
  setZoom,
  radio,
  onMapClick,
}: MapaInteractivoProps) {

  const circleOptions = {
    center: coordenadas,
    radius: radio * 1000, // Convertimos Km a metros
    fillColor: '#64748b', 
    fillOpacity: 0.2,
    strokeColor: '#1e293b', 
    strokeWeight: 2,
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0 select-none">
      <Map
        defaultCenter={coordenadas}
        zoom={zoom}
        disableDefaultUI={true}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
        onClick={(ev) => {
          if (ev.detail.latLng) {
            onMapClick(ev.detail.latLng.lat, ev.detail.latLng.lng);
          }
        }}
        gestureHandling={'greedy'}
        className="w-full h-full"
      >

        <AdvancedMarker position={coordenadas}>
          {/* Usamos el Pin nativo de Google */}
          <Pin 
            background={'#ef4444'} // Red-500
            glyphColor={'#ffffff'} 
            borderColor={'#991b1b'} 
          /> 
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
            {radio.toFixed(1)} Km a la redonda
          </div>
        </AdvancedMarker>
        
        {/* Círculo de área de búsqueda */}
        <Circle {...circleOptions} />     
      
      </Map>
    </div>
  );
}