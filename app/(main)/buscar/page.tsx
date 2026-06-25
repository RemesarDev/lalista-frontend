'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';
import { useListaStore } from '@/app/_store/store';

export const dynamic = 'force-dynamic';

function ResultadosBusqueda() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  const { productos, cargando } = useBusqueda(query);
  
  // 🚀 Traemos la acción real para sumar productos al carrito
  const agregarProducto = useListaStore((state) => state.agregarProducto);

  if (cargando) return <p className="col-span-2 text-center text-slate-400 text-sm">Buscando precios...</p>;

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
  );
}