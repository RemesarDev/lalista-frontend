'use client';
import { Map, AdvancedMarker, Pin, Circle } from '@vis.gl/react-google-maps';
import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

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
  
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setCenter(coordenadas);
      map.setZoom(13); 
    }
  }, [coordenadas.lat, coordenadas.lng, map]);


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
