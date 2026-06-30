'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import StickySearch from '@/app/_components/global/StickySearch';

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
      if (existente) eliminarProducto(producto.id);
      return;
    }
    if (!existente) {
      agregarProducto({
        id: producto.id,
        nombre: producto.nombre,
        url_imagen: producto.url_imagen,
        // Aseguramos que sea siempre un array, si es nulo o undefined, asignamos un array vacío
        sucursales: producto.sucursales || [], 
      });
    }
    actualizarCantidad(producto.id, cantidad);
  };

  if (cargando) return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      <span className="text-5xl animate-bounce">🛒</span>
      <p className="text-sm">Buscando precios en tu zona...</p>
    </div>
  );

  if (!cargando && productos.length === 0) return (
    <div className="col-span-2 flex flex-col items-center justify-center py-16 gap-2 text-center text-slate-400 px-4">
      <span className="text-4xl">🔍</span>
      <p className="text-sm font-medium">No se encontraron resultados en tu zona. </p>
      <p className="bold text-xs">Cambia la <strong className="text-orange-500"> ubicación</strong> del GPS,<br/><strong className="text-orange-500"> el radio</strong> de busqueda,<br/> o el <strong className="text-orange-500"> término</strong> ingresado.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {productos.map((prod, index) => (
        <ProductCard
          key={prod.id}
          producto={prod}
          onAgregar={handleAgregar}
          isPriority={index < 2}
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
    </>
  );
}
