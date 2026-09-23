'use client';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
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

// Componente auxiliar para capturar eventos del mapa (clics y cambios de zoom)
function MapEvents({ onMapClick, setZoom }: { onMapClick: (lat: number, lng: number) => void; setZoom: (zoom: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    zoomend(e) {
      setZoom(e.target.getZoom());
    },
  });
  return null;
}

// Componente para recentrar el mapa dinámicamente si cambia la sucursal o el centro
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom, { animate: true });
  return null;
}

// Iconos personalizados con Leaflet DivIcon para replicar tus etiquetas de HTML
const crearIconoHtml = (htmlContent: string, className: string = '') => {
  return L.divIcon({
    className: `bg-transparent ${className}`,
    html: htmlContent,
    iconSize: [0, 0], // Permite posicionar el HTML de forma fluida mediante clases CSS
    iconAnchor: [0, 0],
  });
};

export default function MapaInteractivo({
  coordenadas,
  zoom,
  setZoom,
  radio,
  onMapClick,
  marcadorSucursal,
}: MapaInteractivoProps) {

  // Conversión de coordenadas al formato que usa Leaflet: [lat, lng]
  const posUsuario: [number, number] = [coordenadas.lat, coordenadas.lng];
  const centroMapa: [number, number] = marcadorSucursal 
    ? [marcadorSucursal.coordenadas.lat, marcadorSucursal.coordenadas.lng] 
    : posUsuario;

  const circleOptions = useMemo(() => ({
    radius: radio * 1000, // Leaflet usa metros directamente
    fillColor: '#64748b', 
    fillOpacity: 0.2,
    color: '#1e293b', 
    weight: 2,
  }), [radio]);

  // Icono del usuario con la etiqueta de radio flotando arriba
  const iconoUsuario = useMemo(() => {
    return crearIconoHtml(`
      <div class="relative -translate-x-1/2 -translate-y-full">
        <div class="w-6 h-6 bg-red-500 border-2 border-red-900 rounded-full shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none">
          ${radio.toFixed(1)} Km a la redonda
        </div>
      </div>
    `);
  }, [radio]);

  // Icono de la sucursal seleccionada
  const iconoSucursal = useMemo(() => {
    if (!marcadorSucursal) return null;
    return crearIconoHtml(`
      <div class="relative -translate-x-1/2 -translate-y-full">
        <div class="w-6 h-6 bg-blue-600 border-2 border-blue-900 rounded-full shadow-lg flex items-center justify-center text-white text-xs">
          🏬
        </div>
        ${marcadorSucursal.nombre ? `
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none z-10">
            🏬 ${marcadorSucursal.nombre}
          </div>
        ` : ''}
      </div>
    `);
  }, [marcadorSucursal]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 select-none">
      <MapContainer
        center={centroMapa}
        zoom={zoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <MapController center={centroMapa} zoom={zoom} />
        <MapEvents onMapClick={onMapClick} setZoom={setZoom} />

        {/* Capa visual gratuita de OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* CÍRCULO ÁREA DE BÚSQUEDA */}
        <Circle center={posUsuario} {...circleOptions} />

        {/* MARCADOR UBICACIÓN DE BÚSQUEDA DEL USUARIO */}
        <Marker position={posUsuario} icon={iconoUsuario} />

        {/* MARCADOR SUCURSAL SELECCIONADA */}
        {marcadorSucursal && iconoSucursal && (
          <Marker position={[marcadorSucursal.coordenadas.lat, marcadorSucursal.coordenadas.lng]} icon={iconoSucursal} />
        )}
      </MapContainer>
    </div>
  );
}