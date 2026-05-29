'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

export function useUbicacion() {
  const [radio, setRadio] = useState(2);
  const [zoom, setZoom] = useState(14);
  const [direccion, setDireccion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [cargandoGps, setCargandoGps] = useState(false);
  const [coordenadas, setCoordenadas] = useState({ lat: -34.6621, lng: -58.6654 });
  const [sugerencias, setSugerencias] = useState<any[]>([]);

  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [geocoderService, setGeocoderService] = useState<google.maps.Geocoder | null>(null);
  
  const sugerenciasRef = useRef<any[]>([]);
  useEffect(() => { sugerenciasRef.current = sugerencias; }, [sugerencias]);

  useEffect(() => {
    if (!geocodingLibrary) return;
    setGeocoderService(new geocodingLibrary.Geocoder());
  }, [geocodingLibrary]);

  useEffect(() => {
    if (!placesLibrary || !direccion || direccion.trim().length < 3) {
      setSugerencias([]);
      return;
    }
    const service = new (placesLibrary as any).AutocompleteService();
    service.getPlacePredictions(
      { input: direccion, componentRestrictions: { country: 'ar' }, types: ['address'] },
      (predictions: any, status: string) => {
        if (status === 'OK' && predictions) setSugerencias(predictions);
        else setSugerencias([]);
      }
    );
  }, [direccion, placesLibrary]);

  // ESTE ES EL PUENTE HACIA HONO (Pronto cambiará el console.log por un fetch)
  const guardarUbicacionFiltro = (nuevoRadio: number, nuevoZoom: number, nuevasCoords: { lat: number; lng: number }, textoDir = direccion) => {
    const payload = {
      rangoKm: nuevoRadio,
      zoomNivel: nuevoZoom,
      latitud: nuevasCoords.lat,
      longitud: nuevasCoords.lng,
      direccionTexto: textoDir || "Punto seleccionado en el mapa"
    };
    console.log("🚀 [Hono Endpoint Ready] Payload preparado:", payload);
  };

  const obtenerGeolocalizacionReal = () => {
    if (!navigator.geolocation) return;
    setCargandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const nuevasCoords = { lat: posicion.coords.latitude, lng: posicion.coords.longitude };
        const tag = "Mi ubicación actual (GPS)";
        setCoordenadas(nuevasCoords);
        setDireccion(tag);
        setZoom(16);
        setCargandoGps(false);
        if (map) { map.panTo(nuevasCoords); map.setZoom(16); }
        guardarUbicacionFiltro(radio, 16, nuevasCoords, tag);
      },
      () => setCargandoGps(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
        if (map) { map.panTo(nuevasCoords); map.setZoom(15); }
        guardarUbicacionFiltro(radio, 15, nuevasCoords, textoDireccion);
      }
    });
  };

  const manejarKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && sugerenciasRef.current?.length > 0) {
      manejarSeleccionDireccion(sugerenciasRef.current[0]);
      (e.target as HTMLInputElement).blur();
    }
  };

  return {
    radio, setRadio,
    zoom, setZoom,
    direccion, setDireccion,
    isFocused, setIsFocused,
    cargandoGps,
    coordenadas,
    sugerencias, setSugerencias,
    obtenerGeolocalizacionReal,
    manejarKeyDownInput,
    manejarSeleccionDireccion,
    guardarUbicacionFiltro
  };
}