'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { useBusqueda } from './_hooks/useBusqueda';
import { ProductCard } from './_components/ProductCard';
import { useListaStore } from '@/app/_store/store';
import StickySearch from '@/app/_components/global/StickySearch';
import BaseContainer from '@/app/_components/global/BaseContainer';

export const dynamic = 'force-dynamic';

function ResultadosBusqueda() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";
  
  // Parametros para agregar alternativas
  const modo = searchParams.get('modo');
  const grupoId = searchParams.get('grupoId');
  const esModoAlternativa = modo === 'alternativa' && Boolean(grupoId);

  const { productos, cargando, cargandoMas, hayMas, cargarMas } = useBusqueda(query);
  
  const lista = useListaStore((state) => state.lista);
  const agregarProducto = useListaStore((state) => state.agregarProducto);
  const actualizarCantidadGrupo = useListaStore((state) => state.actualizarCantidadGrupo);
  const eliminarOpcion = useListaStore((state) => state.eliminarOpcion);

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hayMas || cargandoMas || cargando) return;

    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          cargarMas();
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hayMas, cargandoMas, cargando, cargarMas]);

    const handleAgregar = (producto: (typeof productos)[number], cantidad: number) => {
    // En modo alternativa, buscamos si ya existe dentro del grupo de destino específico
    if (esModoAlternativa && grupoId) {
      const grupoDestino = lista.find((g) => g.grupoId === grupoId);
      const yaExisteEnGrupo = grupoDestino?.opciones.some((op) => op.id === producto.id);

      if (cantidad <= 0) {
        if (yaExisteEnGrupo) eliminarOpcion(grupoId as string, producto.id);
        return;
      }

      if (!yaExisteEnGrupo) {
        agregarProducto(
          {
            id: producto.id,
            nombre: producto.nombre,
            url_imagen: producto.url_imagen,
            sucursales: producto.sucursales || [],
          },
          grupoId as string
        );
        router.push('/mi-lista');
      }
      return;
    }

    // Flujo normal fuera del modo alternativa
    const grupoAsociado = lista.find((grupo) =>
      grupo.opciones.some((opcion) => opcion.id === producto.id)
    );

    if (cantidad <= 0) {
      if (grupoAsociado) eliminarOpcion(grupoAsociado.grupoId, producto.id);
      return;
    }

    if (!grupoAsociado) {
      agregarProducto({
        id: producto.id,
        nombre: producto.nombre,
        url_imagen: producto.url_imagen,
        sucursales: producto.sucursales || [],
      });
    } else {
      actualizarCantidadGrupo(grupoAsociado.grupoId, cantidad);
    }
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
      <p className="text-sm font-medium">No se encontraron resultados en tu zona.</p>
      <p className="bold text-xs">Cambia la <strong className="text-orange-500"> ubicación</strong> del GPS,<br/><strong className="text-orange-500"> el radio</strong> de busqueda,<br/> o el <strong className="text-orange-500"> término</strong> ingresado.</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de Modo Alternativa */}
      {esModoAlternativa && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
          <span>
            💡 Seleccioná un producto para agregarlo como <strong>alternativa</strong> a la lista.
          </span>
          <button
            onClick={() => router.push('/mi-lista')}
            className="underline font-semibold hover:opacity-80 transition-opacity"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Grilla de productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {productos.map((prod, index) => (
          <ProductCard
            key={prod.id}
            producto={prod}
            onAgregar={handleAgregar}
            isPriority={index < 2}
          />
        ))}
      </div>

      {/* Centinela e indicador de carga de páginas adicionales */}
      {hayMas && (
        <div 
          ref={observerRef} 
          className="col-span-full py-6 flex flex-col items-center justify-center gap-2 text-slate-400"
        >
          {cargandoMas ? (
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Cargando más productos...
            </div>
          ) : (
            <button
              onClick={cargarMas}
              className="px-4 py-1.5 text-xs text-orange-500 border border-orange-500/30 rounded-full hover:bg-orange-500/10 transition-colors"
            >
              Cargar más resultados
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuscarVista() {
  return (
    <Suspense fallback={<p className="text-center text-slate-400 py-10">Cargando...</p>}>
      <StickySearch />
      <BaseContainer>
        <ResultadosBusqueda />
      </BaseContainer>
    </Suspense>
  );
}