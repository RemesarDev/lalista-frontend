'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap,
  useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  MapPinIcon, 
  CrosshairIcon, 
  MagnifyingGlassIcon, 
  XIcon, 
  PlusIcon, 
  MinusIcon,
  ArrowLeftIcon 
} from '@phosphor-icons/react/dist/ssr';

// =========================================================================
// 1. CASCARÓN PRINCIPAL
// =========================================================================
export default function UbicacionVista() {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <ContenidoMapa />
    </APIProvider>
  );
}

// =========================================================================
// 2. COMPONENTE INTERNO (Basado en la versión estable que SÍ funcionaba)
// =========================================================================
function ContenidoMapa() {
  const [radio, setRadio] = useState(2);
  const [zoom, setZoom] = useState(14);
  const [direccion, setDireccion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [cargandoGps, setCargandoGps] = useState(false);
  
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const geocodingLibrary = useMapsLibrary('geocoding');

  const [geocoderService, setGeocoderService] = useState<google.maps.Geocoder | null>(null);
  
  // Volvemos al array clásico de predicciones
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  
  // Referencia para capturar las sugerencias activas al presionar Enter
  const sugerenciasRef = useRef<any[]>([]);
  useEffect(() => {
    sugerenciasRef.current = sugerencias;
  }, [sugerencias]);

  const [coordenadas, setCoordenadas] = useState({
    lat: -34.6621,
    lng: -58.6654
  });

  useEffect(() => {
    if (!geocodingLibrary) return;
    setGeocoderService(new geocodingLibrary.Geocoder());
  }, [geocodingLibrary]);

  // 🚀 EL EFECTO ORIGINAL QUE SÍ FUNCIONABA (Con bypass de tipos para Next.js)
  useEffect(() => {
    if (!placesLibrary || !direccion || direccion.trim().length < 3) {
      setSugerencias([]);
      return;
    }

    // Instancia clásica garantizada por Google
    const service = new (placesLibrary as any).AutocompleteService();
    
    service.getPlacePredictions(
      {
        input: direccion,
        componentRestrictions: { country: 'ar' },
        types: ['address']
      },
      (predictions: any, status: string) => {
        if (status === 'OK' && predictions) {
          setSugerencias(predictions);
        } else {
          setSugerencias([]);
        }
      }
    );
  }, [direccion, placesLibrary]);

  const guardarUbicacionFiltro = (nuevoRadio: number, nuevoZoom: number, nuevasCoords: { lat: number; lng: number }, textoDir = direccion) => {
    const payload = {
      rangoKm: nuevoRadio,
      zoomNivel: nuevoZoom,
      latitud: nuevasCoords.lat,
      longitud: nuevasCoords.lng,
      direccionTexto: textoDir || "Punto seleccionado en el mapa"
    };
    console.log("🚀 [Supabase Query] Ejecutando consulta controlada con parámetros:", payload);
  };

  const obtenerGeolocalizacionReal = () => {
    if (!navigator.geolocation) return;
    setCargandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const nuevasCoords = {
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude
        };
        const tag = "Mi ubicación actual (GPS)";
        
        setCoordenadas(nuevasCoords);
        setDireccion(tag);
        setZoom(16); 
        setCargandoGps(false);
        
        if (map) {
          map.panTo(nuevasCoords);
          map.setZoom(16);
        }
        
        guardarUbicacionFiltro(radio, 16, nuevasCoords, tag);
      },
      (error) => {
        setCargandoGps(false);
        console.error("Error obteniendo GPS:", error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // MANEJADOR DE SELECCIÓN TRADICIONAL
  const manejarSeleccionDireccion = (sug: any) => {
    if (!geocoderService) return;

    const textoDireccion = sug.description;
    setDireccion(textoDireccion);
    setSugerencias([]);

    geocoderService.geocode({ address: textoDireccion }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        const nuevasCoords = { lat: loc.lat(), lng: loc.lng() };

        setCoordenadas(nuevasCoords);
        setZoom(15);

        if (map) {
          map.panTo(nuevasCoords);
          map.setZoom(15);
        }

        guardarUbicacionFiltro(radio, 15, nuevasCoords, textoDireccion);
      } else {
        console.error("No se pudieron obtener coordenadas para esta dirección:", status);
      }
    });
  };

  // 🚀 MANEJADOR PARA CONTROLAR EL ENTER
  const manejarKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (sugerenciasRef.current && sugerenciasRef.current.length > 0) {
        manejarSeleccionDireccion(sugerenciasRef.current[0]);
        (e.target as HTMLInputElement).blur(); // Cierra el teclado/foco
      }
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans bg-slate-100">
      
      {/* MAPA INTERACTIVO */}
      <div className="absolute inset-0 w-full h-full z-0 select-none">
        <Map
          defaultCenter={coordenadas}
          zoom={zoom}
          disableDefaultUI={true} 
          mapId="DEMO_MAP_ID" 
          onCameraChanged={(ev) => {
            setZoom(ev.detail.zoom);
          }}
          gestureHandling={'greedy'} 
          className="w-full h-full"
        />
      </div>

      {/* CONTROLES ZOOM MANUAL */}
      <ControlesZoomManual zoom={zoom} setZoom={setZoom} />

      {/* BOTÓN VOLVER */}
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-30 bg-white border border-slate-200/80 shadow-xl p-3.5 rounded-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
      >
        <ArrowLeftIcon weight="bold" className="text-xs" />
      </Link>

      {/* PIN AVANZADO */}
      <AdvancedMarker position={coordenadas}>
        <div className="flex flex-col items-center pointer-events-none -translate-y-8">
          <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md mb-1 whitespace-nowrap">
            {radio} Km a la redonda
          </div>
          <MapPinIcon weight="fill" className="text-red-500 text-4xl drop-shadow-md" />
        </div>
      </AdvancedMarker>

      {/* SLIDER VERTICAL DE RANGO */}
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
              guardarUbicacionFiltro(valor, zoom, coordenadas);
            }}
            className="absolute h-1 w-32 -rotate-90 cursor-pointer appearance-none rounded-lg bg-slate-400/60 accent-slate-900 focus:outline-none touch-none"
            style={{ WebkitAppearance: 'none' }}
          />
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="absolute top-4 inset-x-4 pl-14 z-20 max-w-md mx-auto">
        <div className="relative w-full shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200/80">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input 
            type="text" 
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 300)}
            onKeyDown={manejarKeyDownInput} 
            placeholder="Ingresá tu dirección o barrio..." 
            className="w-full pl-10 pr-10 py-3.5 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {direccion && (
            <button onClick={() => { setDireccion(''); setSugerencias([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
              <XIcon weight="bold" className="text-xs" />
            </button>
          )}
        </div>

        {/* SUGERENCIAS EN TIEMPO REAL CLÁSICAS */}
        {isFocused && sugerencias.length > 0 && (
          <div className="mt-2 bg-white border border-slate-200/80 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 animate-fade-in">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50">
              Sugerencias de Google Maps
            </p>
            {sugerencias.map((sug) => (
              <button
                key={sug.place_id || sug.description}
                type="button"
                onMouseDown={() => manejarSeleccionDireccion(sug)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <MapPinIcon className="text-slate-400 text-sm flex-shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-slate-800 truncate">
                    {sug.structured_formatting?.main_text || sug.description}
                  </span>
                  {sug.structured_formatting?.secondary_text && (
                    <span className="text-[10px] text-slate-400 truncate">
                      {sug.structured_formatting.secondary_text}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BOTÓN GPS */}
      <button 
        onClick={obtenerGeolocalizacionReal}
        disabled={cargandoGps}
        className={`absolute bottom-6 right-4 z-30 bg-slate-900 hover:bg-slate-800 active:scale-[0.92] text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border border-slate-800 cursor-pointer 
          ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'} 
          ${cargandoGps ? 'animate-pulse opacity-50 cursor-wait' : ''}`}
      >
        <CrosshairIcon weight="fill" className={`text-xl text-red-400 ${cargandoGps ? 'animate-spin' : ''}`} />
      </button>

    </div>
  );
}

// Sub-componente para el Zoom Manual
function ControlesZoomManual({ zoom, setZoom }: any) {
  const map = useMap();

  const cambiarZoom = (factor: number) => {
    const nuevoZoom = zoom + factor;
    if (nuevoZoom >= 10 && nuevoZoom <= 19) {
      setZoom(nuevoZoom);
      if (map) map.setZoom(nuevoZoom);
    }
  };

  return (
    <div className="absolute top-20 right-4 z-30 flex flex-col bg-white border border-slate-200/80 shadow-xl rounded-xl overflow-hidden">
      <button type="button" onClick={() => cambiarZoom(1)} className="p-2.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 flex items-center justify-center font-bold">
        <PlusIcon weight="bold" className="text-xs" />
      </button>
      <button type="button" onClick={() => cambiarZoom(-1)} className="p-2.5 text-slate-700 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center font-bold">
        <MinusIcon weight="bold" className="text-xs" />
      </button>
    </div>
  );
}