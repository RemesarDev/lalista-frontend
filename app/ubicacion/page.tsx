'use client';

import { useState } from 'react';
import { MapPinIcon, NavigationArrowIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react/dist/ssr';

export default function UbicacionVista() {
  const [radio, setRadio] = useState(2); // Radio por defecto: 2 Km
  const [direccion, setDireccion] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Simulamos sugerencias de calles/barrios de la zona para ver cómo rinde la UI armada
  const sugerenciasSimuladas = [
    "Brandsen 2500, Ituzaingó",
    "Santa Rosa 1200, Castelar",
    "Av. Ratti y Belgrano, Ituzaingó",
    "Barrio Aeronáutico, Ituzaingó"
  ];

  return (
    // Altura calculada restando el Header estándar (normalmente 3.5rem o 56px)
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden font-sans bg-slate-100">
      
      {/* 1. MAPA DE FONDO (OpenStreetMap libre embebido) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none grayscale-[20%] opacity-80">
        <iframe 
          src="https://www.openstreetmap.org/export/embed.html?bbox=-58.69%2C-34.68%2C-58.64%2C-34.64&amp;layer=mapnik" 
          className="w-full h-full border-none"
        />
      </div>

      {/* PIN DE MAPA FLOTANTE EN EL CENTRO */}
      {/* Ocultamos el pin central sutilmente si el usuario está escribiendo con el teclado para liberar espacio */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center transition-opacity duration-300 ${isFocused ? 'opacity-30' : 'opacity-100'}`}>
        <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md mb-1 animate-bounce">
          Tu zona
        </div>
        <MapPinIcon weight="fill" className="text-primary-400 text-4xl drop-shadow-md" />
      </div>

      {/* 2. CONTROLES SUPERIORES: SLIDER DE COBERTURA */}
      {/* Si está escribiendo, bajamos la opacidad del slider para que no compita visualmente con el buscador */}
      <div className={`absolute top-4 inset-x-4 z-20 max-w-md mx-auto transition-all duration-300 ${isFocused ? 'opacity-20 pointer-events-none transform -translate-y-2' : 'opacity-100'}`}>
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              📍 Radio de búsqueda:
            </span>
            <span className="bg-primary-50 text-primary-400 text-xs font-black px-2 py-0.5 rounded-full">
              {radio} Km a la redonda
            </span>
          </div>
          
          <div className="relative flex items-center mt-3">
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              value={radio} 
              onChange={(e) => setRadio(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-1 px-0.5">
            <span>1 km (Caminando)</span>
            <span>10 km (En auto)</span>
          </div>
        </div>
      </div>

      {/* 3. BLOQUE BUSCADOR INTELIGENTE (Se desplaza de abajo hacia arriba al hacer focus) */}
      <div className={`absolute transition-all duration-300 ease-out inset-x-4 z-30 max-w-md mx-auto
        ${isFocused ? 'top-4 bottom-auto' : 'bottom-6'}`}
      >
        <div className="flex gap-2 items-center w-full">
          {/* Input de dirección */}
          <div className="relative flex-1 shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200/80">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input 
              type="text" 
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              // Usamos un pequeño delay en el Blur para permitir que el click en las sugerencias se registre antes de cerrar el foco
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Ingresá tu dirección o barrio..." 
              className="w-full pl-10 pr-10 py-3.5 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            
            {/* Botón X para limpiar el texto o cerrar el teclado manualmente */}
            {direccion && (
              <button 
                onClick={() => setDireccion('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <XIcon weight="bold" className="text-xs" />
              </button>
            )}
          </div>

          {/* Botón de Auto Rastreo (GPS) */}
          <button 
            onClick={() => alert('Ubicando por GPS nativo... Connected!')}
            className="bg-slate-900 hover:bg-slate-800 active:scale-[0.95] text-white p-3.5 rounded-xl shadow-lg flex items-center justify-center transition-all cursor-pointer border border-slate-800"
            title="Geolocalizarme"
          >
            <NavigationArrowIcon weight="fill" className="text-lg text-primary-400" />
          </button>
        </div>

        {/* DESPLEGABLE DE SUGERENCIAS (Solo visible cuando está en focus y el usuario interactúa) */}
        {isFocused && (
          <div className="mt-2 bg-white border border-slate-200/80 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 animate-fade-in">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50">
              Sugerencias en la zona
            </p>
            {sugerenciasSimuladas.map((sug, index) => (
              <button
                key={index}
                onClick={() => setDireccion(sug)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <MapPinIcon className="text-slate-400 text-sm flex-shrink-0" />
                <span className="truncate">{sug}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}