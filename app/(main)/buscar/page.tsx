'use client';
import { useSearchParams } from 'next/navigation';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';

export default function BuscarVista() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  const { productos, cargando } = useBusqueda(query);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="max-w-screen-xl mx-auto px-2 mt-4">
        
        <h2 className="text-sm font-bold font-display text-slate-400 uppercase tracking-wider mb-3 px-1">
          {query ? `Resultados para "${query}"` : "Resultados en tu zona"}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          
          {cargando && <p className="col-span-2 text-center text-slate-400 text-sm">Buscando precios...</p>}

          {!cargando && productos.map((prod) => (
            <ProductCard 
              key={prod.id} 
              producto={prod} 
              onAgregar={(id, nombre) => {
                console.log(`Producto agregado a LALIsta: ${nombre} (ID: ${id})`);
              }} 
            />
          ))}
        </div>
      </main>
    </div>
  );
}