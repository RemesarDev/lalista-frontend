'use client';

import { MapPinIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr';

export default function BuscarVista() {
  // Simulamos una lista más larga de productos para habilitar el scroll vertical nativo
  const productosSimulados = [
    { id: 1, nombre: "Yerba Mate Playadito 1kg", precioMin: 3400, superMasBarato: "Carrefour" },
    { id: 2, nombre: "Leche Entera La Serenísima 1L", precioMin: 1200, superMasBarato: "Día%" },
    { id: 3, nombre: "Pan Lactal Fargo Grande", precioMin: 2800, superMasBarato: "ChangoMás" },
    { id: 4, nombre: "Fideos Marolio Tallarín 500g", precioMin: 950, superMasBarato: "Super Chino" },
    { id: 5, nombre: "Aceite de Girasol Natura 1.5L", precioMin: 4100, superMasBarato: "Carrefour" },
    { id: 6, nombre: "Arroz Integral Dos Hermanos 1kg", precioMin: 1800, superMasBarato: "Día%" },
    { id: 7, nombre: "Puré de Tomate Arcor 520g", precioMin: 720, superMasBarato: "ChangoMás" },
    { id: 8, nombre: "Azúcar Ledesma Clásica 1kg", precioMin: 1100, superMasBarato: "Super Chino" },
  ];

  const handleAgregarAlCarrito = (id: number, nombre: string) => {
    // Acá va a ir la lógica para guardar el ID en el LocalStorage
    console.log(`Producto agregado a LALIsta: ${nombre} (ID: ${id})`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="max-w-screen-xl mx-auto px-2 mt-4">
        
        <h2 className="text-sm font-bold font-display text-slate-400 uppercase tracking-wider mb-3 px-1">
          Resultados en tu zona
        </h2>

        {/* 
          GRILLA VERTICAL FLUIDA:
          - grid-cols-2 clava las 2 tarjetas exactas de ancho en celulares.
          - El contenedor fluye de arriba hacia abajo de manera infinita sin trabas visuales.
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          
          {productosSimulados.map((prod) => (
            <div 
              key={prod.id}
              // Tarjeta sólida de altura fija y compacta para forzar el ratio de 1 y 3/4 filas visibles por pantalla
              className="bg-white border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Contenedor de Imagen */}
                <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-semibold mb-2">
                  Imagen
                </div>
                
                {/* Título clavado a dos líneas máximo para mantener simetría visual */}
                <h3 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 min-h-[2rem] leading-tight">
                  {prod.nombre}
                </h3>

                {/* El Mejor Precio Destacado */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">El más barato:</span>
                    <strong className="text-xs text-slate-800 font-bold truncate max-w-[70px]">
                      {prod.superMasBarato}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <MapPinIcon weight="fill" className="text-primary-400 text-xs" /> En tu zona
                    </span>
                    <strong className="text-sm md:text-base text-primary-400 font-black">
                      ${prod.precioMin}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ÚNICA INTERACCIÓN: Agregar a LALIsta */}
              <button 
                onClick={() => handleAgregarAlCarrito(prod.id, prod.nombre)}
                className="mt-3 w-full bg-primary-400 hover:bg-primary-500 active:scale-[0.97] text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
              >
                <PlusIcon weight="bold" /> Agregar
              </button>
            </div>
          ))}

        </div>
      </main>
    </div>
  );
}