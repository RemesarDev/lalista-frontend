'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

function ResultadosBusqueda() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  const { productos, cargando } = useBusqueda(query);
  const lista = useListaStore((state) => state.lista);
  const agregarProducto = useListaStore((state) => state.agregarProducto);
  const actualizarCantidad = useListaStore((state) => state.actualizarCantidad);
  const eliminarProducto = useListaStore((state) => state.eliminarProducto);

  const handleAgregar = (producto: (typeof productos)[number], cantidad: number) => {
    const existente = lista.find((item) => item.id === producto.id);

    if (cantidad <= 0) {
      if (existente) {
        eliminarProducto(producto.id);
      }
      return;
    }

    if (!existente) {
      agregarProducto({
        id: producto.id,
        nombre: producto.nombre,
        marca: producto.marca ?? 'Sin marca',
        url_imagen: producto.url_imagen,
      });
    }

    actualizarCantidad(producto.id, cantidad);
  };

  if (cargando) return <p className="col-span-2 text-center text-slate-400 text-sm">Buscando precios...</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {productos.map((prod) => (
        <ProductCard 
          key={prod.id} 
          producto={prod} 
          onAgregar={handleAgregar}
        />
      ))}
    </div>
  );
}

export default function BuscarVista() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="max-w-screen-xl mx-auto px-2 mt-4">
        <div className="mb-3 flex items-start justify-between gap-3 px-1">
          <h2 className="text-sm font-bold font-display text-slate-400 uppercase tracking-wider">
            Resultados en tu zona
          </h2>

          <DesktopActionButton
            href="/mi-lista"
            label="Ir a mi lista"
            icon={<ShoppingCartIcon weight="bold" />}
            variant="outline"
          />
        </div>
        
        <Suspense fallback={<p className="text-center text-slate-400">Cargando buscador...</p>}>
          <ResultadosBusqueda />
        </Suspense>
      </main>
    </div>
  );
}