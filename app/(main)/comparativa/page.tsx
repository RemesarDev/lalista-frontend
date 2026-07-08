'use client';
import { useMemo } from 'react';
import { useListaStore } from '@/app/_store/store';
import { useComparativa } from './_hooks/useComparativa';
import { obtenerTopTresCadenasMasBaratas, type SucursalCarritoComparada } from './_lib/Funciones-comparacion';
import { CardComercioGanador } from './_components/CardComercioGanador';
import { CardComercioAlternativo } from './_components/CardComercioAlternativo';
import { TablaDetalleProductos } from './_components/TablaDetalleProductos';
import BaseContainer from '@/app/_components/global/BaseContainer';

export default function ComparativaPage() {
  const lista = useListaStore((state) => state.lista);
  const ids = useMemo(() => lista.map((p) => p.id), [lista]);
  const { productos: precios, cargando } = useComparativa(ids);

  // Mergeamos cantidad (del store) con sucursales frescas (del fetch)
  const listaConPreciosActualizados = useMemo(() => {
    const mapaPrecios = new Map(precios.map((p) => [p.id, p]));
    return lista.map((item) => {
      const actualizado = mapaPrecios.get(item.id);
      return {
        ...item,
        sucursales: actualizado?.sucursales ?? [],
      };
    });
  }, [lista, precios]);

  const topTresCadenas: SucursalCarritoComparada[] = useMemo(() => {
    if (listaConPreciosActualizados.length === 0) return [];
    return obtenerTopTresCadenasMasBaratas(listaConPreciosActualizados);
  }, [listaConPreciosActualizados]);

  // 1. Estado vacío: sin lista
  if (!lista || lista.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl">🛒</div>
            <p className="text-slate-600 font-medium">No hay productos en tu lista</p>
            <p className="text-sm text-slate-500">
              Agregá productos a tu lista para comparar dónde comprar al mejor precio.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 2. Cargando precios actualizados
  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
            <p className="text-slate-600 font-medium">Actualizando precios...</p>
          </div>
        </div>
      </main>
    );
  }

  // 3. Sin resultados en comparativa (sin ubicación, o sin disponibilidad en la zona)
  if (topTresCadenas.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl">📊</div>
            <p className="text-slate-600 font-medium">No hay comparativa disponible</p>
            <p className="text-sm text-slate-500">
              Los productos de tu lista no tienen disponibilidad en tu zona. Intenta cambiar la ubicación o el radio de búsqueda.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // 4. Comparativa con resultados
  const ganador = topTresCadenas[0];
  const alternativa1 = topTresCadenas[1];
  const alternativa2 = topTresCadenas[2];

  return (
    <div className="my-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <CardComercioGanador sucursal={ganador} />
          {alternativa1 && <CardComercioAlternativo sucursal={alternativa1} posicion={2} />}
          {alternativa2 && <CardComercioAlternativo sucursal={alternativa2} posicion={3} />}
        </div>
        <div className="lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <TablaDetalleProductos cadenas={topTresCadenas} />
          </div>
        </div>
      </div>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-20 right-4 z-50 rounded-full bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-600 md:bottom-6"
      >
        Subir
      </button>
    </div>
  );
}