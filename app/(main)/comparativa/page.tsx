'use client';
import { useEffect, useState } from 'react';
import { useListaStore } from '@/app/_store/store';
import { obtenerTopTresCadenasMasBaratas, type SucursalCarritoComparada } from './_lib/Funciones-comparacion';
import { CardComercioGanador } from './_components/CardComercioGanador';
import { CardComercioAlternativo } from './_components/CardComercioAlternativo';
import { TablaDetalleProductos } from './_components/TablaDetalleProductos';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { ShoppingBagIcon, MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';

export default function ComparativaPage() {
  const lista = useListaStore((state) => state.lista);
  const [topTresCadenas, setTopTresCadenas] = useState<SucursalCarritoComparada[]>([]);

  useEffect(() => {
    if (lista && lista.length > 0) {
      const resultado = obtenerTopTresCadenasMasBaratas(lista);
      setTopTresCadenas(resultado);
    }
  }, [lista]);

  // 1. Estado vacío: sin lista
  if (!lista || lista.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Comparativa de precios</h1>
            <DesktopActionButton
              href="/buscar"
              label="Buscar"
              icon={<MagnifyingGlassIcon weight="bold" />}
              variant="solid"
            />
          </div>
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

  // 2. Sin resultados en comparativa (ej: filtros muy restrictivos)
  if (topTresCadenas.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Comparativa de precios</h1>
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

  // 3. Comparativa con resultados
  const ganador = topTresCadenas[0];
  const alternativa1 = topTresCadenas[1];
  const alternativa2 = topTresCadenas[2];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Comparativa de precios</h1>
            <p className="text-xs text-slate-500 mt-1">
              {lista.length} producto{lista.length !== 1 ? 's' : ''} en tu lista
            </p>
          </div>
          <DesktopActionButton
            href="/buscar"
            label="Modificar lista"
            icon={<MagnifyingGlassIcon weight="bold" />}
            variant="outline"
          />
        </div>

        {/* Card Ganadora */}
        <div className="mb-8">
          <CardComercioGanador
            sucursal={ganador}
            totalAlternativa={alternativa1?.total}
          />
        </div>

        {/* Cards Alternativas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {alternativa1 && (
            <CardComercioAlternativo sucursal={alternativa1} posicion={2} />
          )}
          {alternativa2 && (
            <CardComercioAlternativo sucursal={alternativa2} posicion={3} />
          )}
        </div>

        {/* Tabla Detalles */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <TablaDetalleProductos cadenas={topTresCadenas} />
        </div>
      </div>
    </main>
  );
}