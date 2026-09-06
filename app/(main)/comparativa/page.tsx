'use client';

import { useMemo } from 'react';
import { useListaStore } from '@/app/_store/store';
import { useComparativa } from './_hooks/useComparativa';
import { obtenerTopTresCadenasMasBaratas, type SucursalCarritoComparada } from './_lib/Funciones-comparacion';
import { CardComercioGanador } from './_components/CardComercioGanador';
import { CardComercioAlternativo } from './_components/CardComercioAlternativo';
import { TablaDetalleProductos } from './_components/TablaDetalleProductos';

export default function ComparativaPage() {
  const lista = useListaStore((state) => state.lista);

  // 1. Filtrar los grupos disyuntivos pendientes (checkbox "comprado" en false)
  const listaPendiente = useMemo(
    () => (lista ? lista.filter((grupo) => !grupo.comprado) : []),
    [lista]
  );

  // 2. Extraer los IDs de TODOS los productos (principales + alternativas) de los grupos pendientes
  const ids = useMemo(
    () => listaPendiente.flatMap((grupo) => grupo.opciones.map((opcion) => opcion.id)),
    [listaPendiente]
  );

  const { productos: precios, cargando } = useComparativa(ids);

  // 3. Cruzar los precios actualizados devueltos por la API con cada opción dentro de cada grupo
  const listaConPreciosActualizados = useMemo(() => {
    if (!precios || precios.length === 0) return listaPendiente;

    // Mapa indexado por el id individual del producto (ProductoOpcion.id)
    const mapaPrecios = new Map(precios.map((p) => [p.id, p]));

    return listaPendiente.map((grupo) => ({
      ...grupo,
      opciones: grupo.opciones.map((opcion) => {
        const actualizado = mapaPrecios.get(opcion.id);
        return {
          ...opcion,
          sucursales: actualizado?.sucursales ?? opcion.sucursales ?? [],
        };
      }),
    }));
  }, [listaPendiente, precios]);

  // 4. Cálculo del Top 3 de cadenas considerando la lógica de opciones disyuntivas
  const topTresCadenas: SucursalCarritoComparada[] = useMemo(() => {
    if (listaConPreciosActualizados.length === 0) return [];
    return obtenerTopTresCadenasMasBaratas(listaConPreciosActualizados);
  }, [listaConPreciosActualizados]);

  // --- ESTADOS DE SALIDA TEMPRANA (Early Returns) ---

  // Estado vacío: Sin lista o sin items pendientes
  if (!lista || lista.length === 0 || listaPendiente.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-5xl" role="img" aria-label="Carrito de compras">🛒</div>
            <p className="font-medium text-slate-700">
              {lista?.length > 0 ? '¡Ya compraste todos los productos de tu lista!' : 'No hay productos en tu lista'}
            </p>
            <p className="text-sm text-slate-500">
              {lista?.length > 0
                ? 'Desmarcá algún producto como comprado si querés volver a incluirlo en la comparativa.'
                : 'Agregá productos a tu lista para comparar dónde comprar al mejor precio.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Estado de carga de precios de la zona
  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="font-medium text-slate-600">Actualizando precios de tu zona...</p>
          </div>
        </div>
      </main>
    );
  }

  // Estado sin disponibilidad/coincidencia de comercios en la zona
  if (topTresCadenas.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-5xl" role="img" aria-label="Gráficos">📊</div>
            <p className="font-medium text-slate-700">No hay comparativa disponible</p>
            <p className="text-sm text-slate-500">
              Los productos de tu lista no tienen disponibilidad en tu zona. Intentá cambiar la ubicación o el radio de búsqueda.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const ganador = topTresCadenas[0];
  const alternativa1 = topTresCadenas[1];
  const alternativa2 = topTresCadenas[2];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:items-start">
          <section className="flex flex-col gap-4" aria-label="Comercio ganador y alternativas">
            <CardComercioGanador sucursal={ganador} />
            {alternativa1 && <CardComercioAlternativo sucursal={alternativa1} posicion={2} />}
            {alternativa2 && <CardComercioAlternativo sucursal={alternativa2} posicion={3} />}
          </section>

          <aside className="self-start lg:sticky lg:top-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <TablaDetalleProductos cadenas={topTresCadenas} />
            </div>
          </aside>
        </div>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver al inicio de la página"
          className="fixed bottom-20 right-4 z-50 rounded-full bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-600 active:scale-95 md:bottom-6"
        >
          Subir
        </button>
      </div>
    </main>
  );
}