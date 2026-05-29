'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPinIcon, 
  CrosshairIcon, 
  MagnifyingGlassIcon, 
  XIcon, 
  PlusIcon, 
  MinusIcon,
  ArrowLeftIcon 
} from '@phosphor-icons/react/dist/ssr';

export default function UbicacionVista() {
  const [radio, setRadio] = useState(2); // Radio por defecto: 2 Km
  const [zoom, setZoom] = useState(14);  // Nivel de zoom inicial para el cálculo del mapa
  const [direccion, setDireccion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [cargandoGps, setCargandoGps] = useState(false); // Feedback para la API de geolocalización

  // ESTADO DE COORDENADAS (Centro del mapa - Inicializado en Ituzaingó por defecto)
  const [coordenadas, setCoordenadas] = useState({
    lat: -34.66,
    lng: -58.66
  });

  // Calles sugeridas de la zona para pruebas de UI
  const sugerenciasSimuladas = [
    "Brandsen 2500, Ituzaingó",
    "Santa Rosa 1200, Castelar",
    "Av. Ratti y Belgrano, Ituzaingó",
    "Barrio Aeronáutico, Ituzaingó"
  ];

  // FUNCIÓN CENTRALIZADA PARA GUARDAR LOS FILTROS DE UBICACIÓN
  const guardarUbicacionFiltro = (nuevoRadio: number, nuevoZoom = zoom, nuevasCoords = coordenadas, textoDir = direccion) => {
    const payload = {
      rangoKm: nuevoRadio,
      zoomNivel: nuevoZoom,
      latitud: nuevasCoords.lat,
      longitud: nuevasCoords.lng,
      direccionTexto: textoDir || "Ubicación en el mapa"
    };
    console.log("Guardando datos en el estado global:", payload);
  };

  // Manejadores manuales de zoom con topes de seguridad
  const handleZoomIn = () => {
    if (zoom < 18) {
      const nuevoZoom = zoom + 1;
      setZoom(nuevoZoom);
      guardarUbicacionFiltro(radio, nuevoZoom);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 10) {
      const nuevoZoom = zoom - 1;
      setZoom(nuevoZoom);
      guardarUbicacionFiltro(radio, nuevoZoom);
    }
  };

  // FUNCIÓN LOGICA DEL GPS REAL DEL DISPOSITIVO
  const obtenerGeolocalizacionReal = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización o estás en un entorno no seguro (HTTP).");
      return;
    }

    setCargandoGps(true);

    const opcionesGps = {
      enableHighAccuracy: true, // Forzar uso de GPS de hardware en móviles si está disponible
      timeout: 10000,           // Esperar máximo 10 segundos
      maximumAge: 0             // No traer respuestas cacheadas viejas
    };

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const nuevasCoords = {
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude
        };
        const tagDireccion = "Mi ubicación actual (GPS)";
        
        setCoordenadas(nuevasCoords);
        setDireccion(tagDireccion);
        setCargandoGps(false);
        
        // Persistimos los datos reales obtenidos
        guardarUbicacionFiltro(radio, zoom, nuevasCoords, tagDireccion);
      },
      (error) => {
        setCargandoGps(false);
        console.error("Error de GPS:", error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Permiso denegado. Habilitá la ubicación desde la configuración de tu navegador.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("La información de ubicación no está disponible actualmente.");
            break;
          case error.TIMEOUT:
            alert("Se agotó el tiempo de espera para obtener tu ubicación.");
            break;
          default:
            alert("Ocurrió un error inesperado al obtener la ubicación.");
            break;
        }
      },
      opcionesGps
    );
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans bg-slate-100">
      
      {/* 1. MAPA DE FONDO (OpenStreetMap dinámico) */}
      <div className="absolute inset-0 w-full h-full z-0 select-none grayscale-[20%] opacity-80">
        <iframe 
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordenadas.lng - (0.2 / zoom)}%2C${coordenadas.lat - (0.15 / zoom)}%2C${coordenadas.lng + (0.2 / zoom)}%2C${coordenadas.lat + (0.15 / zoom)}&amp;layer=mapnik`} 
          className="w-full h-full border-none pointer-events-auto"
        />
      </div>

      {/* BOTÓN "VOLVER" (Ubicado fijo arriba a la izquierda sin competir con el input) */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-30 bg-white border border-slate-200/80 shadow-xl p-3.5 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
        title="Volver"
      >
        <ArrowLeftIcon weight="bold" className="text-xs" />
      </Link>

      {/* PIN FLOTANTE FIJO EN EL CENTRO EXACTO DEL MAPA */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center transition-opacity duration-300 ${isFocused ? 'opacity-30' : 'opacity-100'}`}>
        <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md mb-1 animate-bounce">
          {radio} Km a la redonda
        </div>
        <MapPinIcon weight="fill" className="text-primary-400 text-4xl drop-shadow-md" />
      </div>

      {/* 2. CONTROL LATERAL DERECHO: SLIDER VERTICAL MINIMALISTA DE RANGO */}
      <div className={`absolute right-2 top-[32%] z-20 flex h-40 w-10 items-center justify-center transition-all duration-300 ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}>
        <div className="relative flex h-full w-full items-center justify-center">
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="1"
            value={radio} 
            onChange={(e) => {
              const valor = Number(e.target.value);
              setRadio(valor);
              guardarUbicacionFiltro(valor, zoom);
            }}
            className="absolute h-1 w-32 -rotate-90 cursor-pointer appearance-none rounded-lg bg-slate-400/60 accent-primary-400 focus:outline-none touch-none"
            style={{ WebkitAppearance: 'none' }}
          />
        </div>
      </div>

      {/* 3. BOTONES DE ZOOM PROPIOS (Margen derecho superior) */}
      <div className={`absolute top-20 right-4 z-30 flex flex-col bg-white border border-slate-200/80 shadow-xl rounded-xl overflow-hidden transition-all duration-300 ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}>
        <button 
          onClick={handleZoomIn}
          className="p-2.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer border-b border-slate-100 flex items-center justify-center font-bold"
          title="Acercar"
        >
          <PlusIcon weight="bold" className="text-xs" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center font-bold"
          title="Alejar"
        >
          <MinusIcon weight="bold" className="text-xs" />
        </button>
      </div>

      {/* 4. BLOQUE BUSCADOR INTELIGENTE (Agregamos pl-14 para coexistir perfectamente con el botón de Volver) */}
      <div className="absolute top-4 inset-x-4 pl-14 z-20 max-w-md mx-auto">
        <div className="relative w-full shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200/80">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input 
            type="text" 
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Ingresá tu dirección o barrio..." 
            className="w-full pl-10 pr-10 py-3.5 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          
          {/* Botón X para vaciar texto */}
          {direccion && (
            <button 
              onClick={() => setDireccion('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <XIcon weight="bold" className="text-xs" />
            </button>
          )}
        </div>

        {/* COMPONENTE DESPLEGABLE DE SUGERENCIAS */}
        {isFocused && (
          <div className="mt-2 bg-white border border-slate-200/80 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 animate-fade-in">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50">
              Sugerencias en la zona
            </p>
            {sugerenciasSimuladas.map((sug, index) => (
              <button
                key={index}
                onClick={() => {
                  setDireccion(sug);
                  const coordsDummy = { lat: -34.65 - (index * 0.01), lng: -58.65 - (index * 0.01) };
                  setCoordenadas(coordsDummy);
                  guardarUbicacionFiltro(radio, zoom, coordsDummy, sug);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <MapPinIcon className="text-slate-400 text-sm flex-shrink-0" />
                <span className="truncate">{sug}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. BOTÓN FLOTANTE DE GEOLOCALIZACIÓN (Ubicación ergonómica inferior derecha - Hardware Real) */}
      <button 
        onClick={obtenerGeolocalizacionReal}
        disabled={cargandoGps}
        className={`absolute bottom-6 right-4 z-30 bg-slate-900 hover:bg-slate-800 active:scale-[0.92] text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border border-slate-800 cursor-pointer 
          ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'} 
          ${cargandoGps ? 'animate-pulse opacity-50 cursor-wait' : ''}`}
        title={cargandoGps ? "Localizando..." : "Geolocalizarme"}
      >
        <CrosshairIcon weight="fill" className={`text-xl text-primary-400 ${cargandoGps ? 'animate-spin' : ''}`} />
      </button>

    </div>
  );
}