'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';
import { useListaStore } from '@/app/_store/store';
import StickySearch from '@/app/_components/global/StickySearch';

export const dynamic = 'force-dynamic';

function ResultadosBusqueda() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  const { productos, cargando } = useBusqueda(query);
  
  // 🚀 Traemos la acción real para sumar productos al carrito
  const agregarProducto = useListaStore((state) => state.agregarProducto);

  if (cargando) return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      <span className="text-5xl animate-bounce">🛒</span>
      <p className="text-sm">Buscando precios en tu zona...</p>
    </div>
  );

  if (!cargando && productos.length === 0) return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-2 text-center text-slate-400 px-4">
      <span className="text-4xl">🔍</span>
      <p className="text-sm font-medium">No se encontraron resultados en tu zona.</p>
      <p className="text-xs">Probá cambiando la ubicación del GPS, el rango de búsqueda o el término ingresado.</p>
    </div>
  );
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {productos.map((prod) => (
        <ProductCard 
          key={prod.id} 
          producto={prod} 
          // 🛠️ Ajustamos la firma: recibe el objeto 'producto' completo del map
          onAgregar={(producto) => {
            agregarProducto({
              id: producto.id,
              nombre: producto.nombre,
              url_imagen: producto.url_imagen // 👈 Viaja la imagen directo al LocalStorage del carrito
            });
          }} 
        />
      ))}
    </div>
  );
}

export default function BuscarVista() {
  return (
    <>
      <StickySearch />
      <div className="min-h-screen bg-slate-50 font-sans pb-16">
        <main className="max-w-screen-xl mx-auto px-2 mt-4">
          <h2 className="text-sm font-bold font-display text-slate-400 uppercase tracking-wider mb-3 px-1">
            Resultados en tu zona
          </h2>
          
          <Suspense fallback={<p className="text-center text-slate-400">Cargando buscador...</p>}>
            <ResultadosBusqueda />
          </Suspense>
        </main>
      </div>
    </>
  );
}
