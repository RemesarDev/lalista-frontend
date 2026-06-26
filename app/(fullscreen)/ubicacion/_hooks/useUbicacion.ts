'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { useListaStore } from '@/app/_store/store';

// Tipo local para las sugerencias que devuelve nuestro endpoint
type SugerenciaLugar = {
  placeId: string;
  text: { text: string };
  structuredFormat: {
    mainText: { text: string };
    secondaryText?: { text: string };
  };
};

export function useUbicacion() {
  const { ubicacion, setUbicacion, cambiarRadioBusqueda } = useListaStore();
  
  const [direccion, setDireccion] = useState<string>(ubicacion.nombreLugar || '');
  const [sugerencias, setSugerencias] = useState<SugerenciaLugar[]>([]);
  const [cargandoGps, setCargandoGps] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(14);
  const [errorSugerencias, setErrorSugerencias] = useState<string | null>(null);

  const [coordenadasPendientes, setCoordenadasPendientes] = useState<{
  lat: number;
  lng: number;
  texto: string;
} | null>(null);

  const map = useMap();

  // Crea esta pequeña función auxiliar para limpiar la dirección
  const limpiarDireccion = (direccion: string) => {
    const partes = direccion.split(',');
    return partes.slice(0).join(',').trim(); //modificar en caso de recibir una dirección con formato diferente, por ejemplo sin comas. Por ahora asumo que siempre viene con formato "Calle 123, Ciudad, País"
  };

  const coordenadas = useMemo(() => ({ 
    lat: ubicacion.latitud || -34.6621, 
    lng: ubicacion.longitud || -58.6654 
  }), [ubicacion.latitud, ubicacion.longitud]);

  const sugerenciasRef = useRef<SugerenciaLugar[]>([]);
  useEffect(() => { sugerenciasRef.current = sugerencias; }, [sugerencias]);

  const handleDireccionChange = (nuevaDireccion: string) => {
    setDireccion(nuevaDireccion);
    if (nuevaDireccion.trim().length < 3) {
      setSugerencias([]);
    }
  };

  // Autocomplete via Hono
  useEffect(() => {
    if (direccion.trim().length < 3) return;

    let cancelled = false;

    // Esperamos 1000ms antes de buscar
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(direccion)}`);
        if (!res.ok) throw new Error('Error en autocomplete');
        
        const data = await res.json();

        if (!cancelled) {
          setSugerencias(
            (data.suggestions ?? [])
              .map((s: { placePrediction: SugerenciaLugar }) => s.placePrediction)
              .filter(Boolean)
          );
          setErrorSugerencias(null);
        }
      } catch {
        if (!cancelled) {
          setSugerencias([]);
          setErrorSugerencias("No pudimos cargar sugerencias. Si usás Brave o uBlock, habilitá Google Maps para este sitio.");
        }
      }
    }, 1000);

    // Si el usuario sigue escribiendo, cancelamos el timer anterior
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [direccion]);

  const guardarUbicacionFiltro = useCallback((nuevoRadio: number, nuevasCoords: { lat: number; lng: number }, textoDir: string) => {
    setUbicacion({
      latitud: nuevasCoords.lat,
      longitud: nuevasCoords.lng,
      precision: null,
      radioBusqueda: nuevoRadio,
      nombreLugar: textoDir,
      cargandoUbicacion: false
    });
  }, [setUbicacion]);

  //Geolocalización real usando la API de Geolocalización del navegador.
    const obtenerGeolocalizacionReal = async () => {
    if (!navigator.geolocation) return;
    setCargandoGps(true);
    
    navigator.geolocation.getCurrentPosition(
      async (posicion) => {
        const lat = posicion.coords.latitude;
        const lng = posicion.coords.longitude;

        try {
          const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          
          // Asignamos la dirección encontrada O las coordenadas como fallback
          const textoFinal = limpiarDireccion(data.direccion);
          
          // ACTUALIZACIÓN UNIFICADA
          setDireccion(textoFinal);
          setCoordenadasPendientes({ lat, lng, texto: textoFinal });
          
          if (map) { 
            map.panTo({ lat, lng }); 
            map.setZoom(16); 
          }
        } catch (err) {
          console.error("Error:", err);
        } finally {
          setCargandoGps(false);
        }
      },
      () => setCargandoGps(false),
      { enableHighAccuracy: true }
    );
  };

  // Geocoding via Hono
  const manejarSeleccionDireccion = async (sug: SugerenciaLugar) => {
    const textoDireccion = sug.text.text;
    setDireccion(textoDireccion);
    setSugerencias([]);

    const res = await fetch(`/api/maps/details?placeId=${encodeURIComponent(sug.placeId)}`);
    if (!res.ok) return;

    const data = await res.json();
    if (!data.lat || !data.lng) return;

    const nuevasCoords = { lat: data.lat, lng: data.lng };
    setCoordenadasPendientes({ ...nuevasCoords, texto: textoDireccion });

    if (map) {
      map.panTo(nuevasCoords);
      map.setZoom(16);
    }
  };

  const confirmarUbicacion = useCallback(() => {
    if (!coordenadasPendientes) return;
    // Leemos el radio fresco directamente del store, no del closure
    const radioActual = useListaStore.getState().ubicacion.radioBusqueda;
    guardarUbicacionFiltro(
      radioActual,
      { lat: coordenadasPendientes.lat, lng: coordenadasPendientes.lng },
      coordenadasPendientes.texto
    );
    setCoordenadasPendientes(null);
  }, [coordenadasPendientes, guardarUbicacionFiltro]);

  const manejarKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && sugerenciasRef.current.length > 0) {
      manejarSeleccionDireccion(sugerenciasRef.current[0]);
      (e.target as HTMLInputElement).blur();
    }
  };

  return {
    radio: ubicacion.radioBusqueda,
    setRadio: cambiarRadioBusqueda,
    zoom, setZoom,
    direccion, 
    setDireccion: handleDireccionChange, 
    cargandoGps,
    coordenadas,
    sugerencias, setSugerencias,
    errorSugerencias,
    obtenerGeolocalizacionReal,
    manejarKeyDownInput,
    manejarSeleccionDireccion,
    guardarUbicacionFiltro,
    coordenadasPendientes,  
    confirmarUbicacion,  
  };
}