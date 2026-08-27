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
  const ubicacion = useListaStore((state) => state.ubicacion);
  const setUbicacion = useListaStore((state) => state.setUbicacion);
  const cambiarRadioBusqueda = useListaStore((state) => state.cambiarRadioBusqueda);
  const cargandoSucursales = useListaStore((state) => state.cargandoSucursales);
  const setCargandoSucursales = useListaStore((state) => state.setCargandoSucursales);
  const setSucursalesCercanas = useListaStore((state) => state.setSucursalesCercanas);
  
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

  // Limpia la cadena de dirección recibida
  const limpiarDireccion = useCallback((direccion: string) => {
    const partes = direccion.split(',');
    return partes.slice(0).join(',').trim();
  }, []);

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

  // Geolocalización real del navegador
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
          
          const textoFinal = limpiarDireccion(data.direccion);
          
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

  const yaSolicitoGpsInicial = useRef(false);

  useEffect(() => {
    if (yaSolicitoGpsInicial.current) return;
    if (ubicacion.latitud && ubicacion.longitud) return;
    
    yaSolicitoGpsInicial.current = true;
    queueMicrotask(() => obtenerGeolocalizacionReal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Click directo sobre el mapa
  const manejarClickMapa = useCallback(async (lat: number, lng: number) => {
    setCoordenadasPendientes({ lat, lng, texto: 'Ubicación seleccionada en el mapa' });
    setDireccion('Buscando dirección...');

    try {
      const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error('Error en reverse geocode');
      const data = await res.json();

      const textoFinal = limpiarDireccion(data.direccion);
      setDireccion(textoFinal);
      setCoordenadasPendientes({ lat, lng, texto: textoFinal });
    } catch (err) {
      console.error('Error en reverse geocode:', err);
      setDireccion('Ubicación seleccionada en el mapa');
    }
  }, [limpiarDireccion]);

  const confirmarUbicacion = useCallback(() => {
    if (!coordenadasPendientes) return;
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

  // Guarda la ubicación en Zustand y consulta el backend en Hono
const confirmarYBuscarSucursales = useCallback(async () => {
  if (!coordenadasPendientes) return;

  const { lat, lng, texto } = coordenadasPendientes;
  const radioActual = useListaStore.getState().ubicacion.radioBusqueda;

  try {
    setCargandoSucursales(true);

    // 1. Hacer el fetch ANTES de limpiar el estado de pendientes
    const res = await fetch(`/api/maps/sucursales-cercanas?lat=${lat}&lng=${lng}&radio=${radioActual}`);
    
    if (!res.ok) {
      const errorDetail = await res.json().catch(() => null);
      console.error('[Error de Endpoint sucursales-cercanas]:', res.status, errorDetail);
      throw new Error(errorDetail?.error || `Error ${res.status} en el servidor`);
    }

    const data = await res.json();

    if (data.sucursales) {
      setSucursalesCercanas(data.sucursales);
    }

    // 2. Si la consulta fue exitosa, guardamos en Zustand y limpiamos pendientes
    guardarUbicacionFiltro(
      radioActual,
      { lat, lng },
      texto
    );
    setCoordenadasPendientes(null);

  } catch (err) {
    console.error('Excepción al consultar sucursales:', err);
    throw err; // Re-lanzar para manejar en UI si es necesario
  } finally {
    setCargandoSucursales(false);
  }
}, [coordenadasPendientes, guardarUbicacionFiltro, setCargandoSucursales, setSucursalesCercanas]);

  return {
    radio: ubicacion.radioBusqueda,
    setRadio: cambiarRadioBusqueda,
    zoom, 
    setZoom,
    direccion, 
    setDireccion: handleDireccionChange, 
    cargandoGps,
    coordenadas,
    sugerencias, 
    setSugerencias,
    errorSugerencias,
    obtenerGeolocalizacionReal,
    manejarKeyDownInput,
    manejarSeleccionDireccion,
    manejarClickMapa,
    guardarUbicacionFiltro,
    coordenadasPendientes,  
    confirmarUbicacion,
    // Métodos e indicadores expuestos para la vista:
    confirmarYBuscarSucursales,
    cargandoSucursales,
  };
}