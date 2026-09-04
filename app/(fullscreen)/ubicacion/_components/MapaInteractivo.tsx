'use client';
import { Map, AdvancedMarker, Pin, Circle } from '@vis.gl/react-google-maps';
import { useMemo } from 'react';

interface Coordenadas {
  lat: number;
  lng: number;
}

interface MarcadorSucursal {
  coordenadas: Coordenadas;
  nombre?: string;
}

interface MapaInteractivoProps {
  coordenadas: Coordenadas;
  zoom: number;
  setZoom: (value: number) => void;
  radio: number;
  onMapClick: (lat: number, lng: number) => void;
  marcadorSucursal?: MarcadorSucursal | null;
}

export default function MapaInteractivo({
  coordenadas,
  zoom,
  setZoom,
  radio,
  onMapClick,
  marcadorSucursal,
}: MapaInteractivoProps) {

  const circleOptions = useMemo(() => ({
    center: coordenadas,
    radius: radio * 1000,
    fillColor: '#64748b', 
    fillOpacity: 0.2,
    strokeColor: '#1e293b', 
    strokeWeight: 2,
  }), [coordenadas, radio]);

  // Si hay una sucursal seleccionada, centramos el mapa en la sucursal, si no, en las coordenadas del usuario
  const centroMapa = marcadorSucursal?.coordenadas || coordenadas;

  return (
    <div className="absolute inset-0 w-full h-full z-0 select-none">
      <Map
        defaultCenter={centroMapa}
        defaultZoom={zoom}
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
        {/* MARCADOR UBICACIÓN DE BÚSQUEDA DEL USUARIO */}
        <AdvancedMarker position={coordenadas}>
          <Pin 
            background={'#ef4444'} // Red-500
            glyphColor={'#ffffff'} 
            borderColor={'#991b1b'} 
          /> 
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
            {radio.toFixed(1)} Km a la redonda
          </div>
        </AdvancedMarker>

        {/* MARCADOR SUCURSAL SELECCIONADA (SI EXISTE EN URL) */}
        {marcadorSucursal && (
          <AdvancedMarker position={marcadorSucursal.coordenadas}>
            <Pin 
              background={'#2563eb'} // Blue-600
              glyphColor={'#ffffff'} 
              borderColor={'#1e40af'} 
            /> 
            {marcadorSucursal.nombre && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none z-10">
                🏬 {marcadorSucursal.nombre}
              </div>
            )}
          </AdvancedMarker>
        )}
        
        {/* CÍRCULO ÁREA DE BÚSQUEDA */}
        <Circle {...circleOptions} />     
      
      </Map>
    </div>
  );
}