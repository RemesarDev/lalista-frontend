'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'; // Importamos Suspense
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';

export const dynamic = 'force-dynamic';

// Creamos un componente interno que contenga la lógica de búsqueda
function ResultadosBusqueda() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  const { productos, cargando } = useBusqueda(query);

  if (cargando) return <p className="col-span-2 text-center text-slate-400 text-sm">Buscando precios...</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {productos.map((prod) => (
        <ProductCard 
          key={prod.id} 
          producto={prod} 
          onAgregar={(id, nombre) => {
            console.log(`Producto agregado a LALIsta: ${nombre} (ID: ${id})`);
          }} 
        />
      ))}
    </div>
  );
}

export default function BuscarVista() {
  // El padre solo contiene la estructura y el Suspense
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="max-w-screen-xl mx-auto px-2 mt-4">
        <h2 className="text-sm font-bold font-display text-slate-400 uppercase tracking-wider mb-3 px-1">
          Resultados en tu zona
        </h2>
        
        {/* Aquí es donde "envolvemos" el uso de searchParams */}
        <Suspense fallback={<p className="text-center text-slate-400">Cargando buscador...</p>}>
          <ResultadosBusqueda />
        </Suspense>
      </main>
    </div>
  );
}