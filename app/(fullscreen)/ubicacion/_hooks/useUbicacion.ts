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

  const map = useMap();

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

    const buscar = async () => {
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
    };

    buscar().catch(() => {
      if (!cancelled) {
        setSugerencias([]);
        setErrorSugerencias("No pudimos cargar sugerencias. Si usás Brave o uBlock, habilitá Google Maps para este sitio.");
      }
    });

    return () => { cancelled = true; };
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

  const obtenerGeolocalizacionReal = () => {
    if (!navigator.geolocation) return;
    setCargandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const nuevasCoords = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
        const tag = "Mi ubicación actual (GPS)";
        setDireccion(tag);
        setZoom(16);
        setCargandoGps(false);
        if (map) { map.panTo(nuevasCoords); map.setZoom(16); }
        guardarUbicacionFiltro(ubicacion.radioBusqueda, nuevasCoords, tag);
      },
      () => setCargandoGps(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Geocoding via Hono
  const manejarSeleccionDireccion = async (sug: SugerenciaLugar) => {
    const textoDireccion = sug.text.text;
    setDireccion(textoDireccion);
    setSugerencias([]);

    const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(textoDireccion)}`);
    if (!res.ok) return;

    const data = await res.json();
    if (!data.lat || !data.lng) return;

    const nuevasCoords = { lat: data.lat, lng: data.lng };
    guardarUbicacionFiltro(ubicacion.radioBusqueda, nuevasCoords, textoDireccion);

    if (map) {
      map.panTo(nuevasCoords);
      map.setZoom(15);
    }
  };

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
    guardarUbicacionFiltro
  };
}