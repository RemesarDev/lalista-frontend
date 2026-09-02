'use client';

import Link from 'next/link';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CrosshairIcon, ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Componentes y Hooks modulares
import BuscadorUbicacion from './_components/BuscadorUbicacion';
import ControlesZoom from './_components/ControlesZoom'; 
import MapaInteractivo from './_components/MapaInteractivo';
import SliderVertical from './_components/SliderVertical';
import { useUbicacion } from './_hooks/useUbicacion';
import { useListaStore } from '@/app/_store/store';

export default function UbicacionVista() {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <ContenidoMapa />
    </APIProvider>
  );
}

function ContenidoMapa() {
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Captura de parámetros para el pin de la sucursal (si viene desde CardComercioAlternativo)
  const sucursalLat = searchParams.get('sucursalLat');
  const sucursalLng = searchParams.get('sucursalLng');
  const sucursalNombre = searchParams.get('sucursalNombre');

  const marcadorSucursal = (sucursalLat && sucursalLng) ? {
    coordenadas: {
      lat: parseFloat(sucursalLat),
      lng: parseFloat(sucursalLng),
    },
    nombre: sucursalNombre || undefined,
  } : null;

  const {
    radio, setRadio,
    zoom, setZoom,
    direccion, setDireccion,
    cargandoGps,
    coordenadas,
    sugerencias, setSugerencias,
    obtenerGeolocalizacionReal,
    manejarKeyDownInput,
    manejarSeleccionDireccion,
    errorSugerencias,
    coordenadasPendientes,
    manejarClickMapa,
    confirmarYBuscarSucursales,
    cargandoSucursales,
  } = useUbicacion();
  
  return (
    <div className="relative w-full overflow-hidden font-sans bg-slate-100" style={{ height: '100dvh' }}>
      
      {/* MAPA INTERACTIVO (CON MARCADOR OPCIONAL DE SUCURSAL) */}
      <MapaInteractivo 
        coordenadas={coordenadasPendientes || coordenadas} 
        zoom={zoom} 
        setZoom={setZoom} 
        radio={radio} 
        onMapClick={manejarClickMapa}
        marcadorSucursal={marcadorSucursal}
      />

      {/* CONTROLES ZOOM MANUAL */}
      <ControlesZoom zoom={zoom} setZoom={setZoom} />

      {/* BOTÓN VOLVER */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-30 bg-white border border-slate-200/80 shadow-xl p-3.5 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
      >
        <ArrowLeftIcon weight="bold" className="text-xs" />
      </Link>

      {/* SLIDER VERTICAL DE RANGO */}
      <SliderVertical
        value={radio}
        min={1}
        max={10}
        step={0.1}
        onChange={setRadio}
        isFocused={isFocused}
      />

      {/* BUSCADOR MODULARIZADO */}
      <BuscadorUbicacion 
        direccion={direccion}
        setDireccion={setDireccion}
        isFocused={isFocused}
        setIsFocused={setIsFocused}
        sugerencias={sugerencias}
        setSugerencias={setSugerencias}
        onKeyDownInput={manejarKeyDownInput}
        onSeleccionDireccion={manejarSeleccionDireccion}
        errorSugerencias={errorSugerencias}
      />

      {/* BOTÓN GPS */}
      <button 
        onClick={obtenerGeolocalizacionReal}
        disabled={cargandoGps || cargandoSucursales}
        style={{ bottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
        className={`absolute right-4 z-30 bg-slate-900 hover:bg-slate-800 active:scale-[0.92] text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border border-slate-800 cursor-pointer 
          ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'} 
          ${cargandoGps ? 'animate-pulse opacity-50 cursor-wait' : ''}`}
      >
        <CrosshairIcon weight="fill" className={`text-xl text-red-400 ${cargandoGps ? 'animate-spin' : ''}`} />
      </button>

      {/* BOTÓN GUARDAR UBICACIÓN FILTRO */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-6 transition-all duration-300 ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={async () => {
            if (!coordenadasPendientes) return;

            // 1. Ejecuta la confirmación + la búsqueda de sucursales en Supabase
            await confirmarYBuscarSucursales();

            // 2. Redirección manteniendo la búsqueda previa si es reciente
            const { terminoBusqueda, timeTerminoBusqueda } = useListaStore.getState();
            const esReciente = (Date.now() - timeTerminoBusqueda) < (60 * 60 * 1000);

            if (terminoBusqueda && esReciente) {
              router.push(`/buscar?q=${encodeURIComponent(terminoBusqueda)}`);
            } else {
              router.push('/buscar');
            }
          }}
          disabled={!coordenadasPendientes || cargandoSucursales}
          className={`px-6 py-3.5 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2
            ${coordenadasPendientes && !cargandoSucursales
              ? 'bg-slate-900 text-white border border-slate-800 hover:bg-slate-800 cursor-pointer' 
              : 'bg-white text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
        >
          {cargandoSucursales ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Buscando sucursales...
            </>
          ) : coordenadasPendientes ? (
            '📍 Guardar ubicación para filtrar'
          ) : (
            'Elegí una ubicación'
          )}
        </button>
      </div>
    </div>
  );
}