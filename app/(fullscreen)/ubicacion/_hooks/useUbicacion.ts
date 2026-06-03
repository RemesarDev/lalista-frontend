'use client';

import { useState, useEffect, useRef,useMemo, useCallback } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useListaStore } from '@/app/_store/store';

export function useUbicacion() {
  const { ubicacion, setUbicacion, cambiarRadioBusqueda } = useListaStore();
  
  // Estados locales para la UI
  const [direccion, setDireccion] = useState<string>(ubicacion.nombreLugar || '');
  const [sugerencias, setSugerencias] = useState<google.maps.places.PlacePrediction[]>([]);
  const [cargandoGps, setCargandoGps] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(14);

  const [errorSugerencias, setErrorSugerencias] = useState<string | null>(null);

  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const geocodingLibrary = useMapsLibrary('geocoding');

  const geocoderService = useMemo(() => geocodingLibrary ? new geocodingLibrary.Geocoder() : null, [geocodingLibrary]);
  
  const coordenadas = useMemo(() => ({ 
  lat: ubicacion.latitud || -34.6621, 
  lng: ubicacion.longitud || -58.6654 
}), [ubicacion.latitud, ubicacion.longitud]);

  const sugerenciasRef = useRef<google.maps.places.PlacePrediction[]>([]);
  useEffect(() => { sugerenciasRef.current = sugerencias; }, [sugerencias]);

  const handleDireccionChange = (nuevaDireccion: string) => {
    setDireccion(nuevaDireccion);
    if (nuevaDireccion.trim().length < 3) {
      setSugerencias([]); // Limpiamos aquí, fuera de un useEffect
    }
  };

useEffect(() => {
  if (!placesLibrary || direccion.trim().length < 3) return;

  let cancelled = false;

  const buscar = async () => {
    const { AutocompleteSuggestion } = placesLibrary;
    
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: direccion,
      includedRegionCodes: ['ar'],
      includedPrimaryTypes: ['geocode'],
    });

    if (!cancelled) {
      setSugerencias(
        suggestions
          .map(s => s.placePrediction)
          .filter((p): p is google.maps.places.PlacePrediction => p !== null)
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
}, [direccion, placesLibrary]);
  
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

  const manejarSeleccionDireccion = (sug: google.maps.places.PlacePrediction) => {
  if (!geocoderService) return;
  const textoDireccion = sug.text.toString();
  setDireccion(textoDireccion);
    
    geocoderService.geocode({ address: textoDireccion }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const loc = results[0].geometry.location;
        const nuevasCoords = { lat: loc.lat(), lng: loc.lng() };
        
        guardarUbicacionFiltro(ubicacion.radioBusqueda, nuevasCoords, textoDireccion);
        
        if (map) {
          map.panTo(nuevasCoords);
          map.setZoom(15);
        }
      }
    });
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
  obtenerGeolocalizacionReal,
  manejarKeyDownInput,
  manejarSeleccionDireccion,
  guardarUbicacionFiltro,
  errorSugerencias,
};
}