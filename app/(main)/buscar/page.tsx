'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';
import { useListaStore } from '@/app/_store/store';
import StickySearch from '@/app/_components/global/StickySearch';
import BaseContainer from '@/app/_components/global/BaseContainer';

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
    /* 
      Cambiamos la grilla para que sea:
      - 2 columnas por defecto (mobile)
      - 3 columnas en pantallas medianas (md: tablets)[cite: 13]
      - 4 columnas en pantallas grandes (lg: desktop en adelante)
    */
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
      {productos.map((prod, index) => (
        <ProductCard
          key={prod.id}
          producto={prod}
          onAgregar={handleAgregar}
          isPriority={index < 2} // Mantené el lazy loading optimizado para las primeras imágenes[cite: 13]
        />
      ))}
    </div>
  );
}

export default function BuscarVista() {
  return (
    <>
      <StickySearch />
      <BaseContainer>
          {/* Título renovado estilo Aplicación de Compra */}
          <div className="mb-6 flex flex-row items-center justify-between gap-4 px-1 w-full border-b border-slate-50 pb-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Resultados en tu zona
            </h1>
          </div>

          <Suspense fallback={<p className="text-center text-slate-400">Cargando buscador...</p>}>
            <ResultadosBusqueda />
          </Suspense>
      </BaseContainer>
    </>
  );
}
