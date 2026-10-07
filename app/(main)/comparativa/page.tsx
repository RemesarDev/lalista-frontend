'use client';

import { useState, useMemo } from 'react';
import { useListaStore } from '@/app/_store/store';
import { useComparativa } from './_hooks/useComparativa';
import { 
  obtenerTopTresCadenasMasBaratas, 
  type SucursalCarritoComparada,
  type CriterioComparacion 
} from './_lib/Funciones-comparacion';
import { CardComercioGanador } from './_components/CardComercioGanador';
import { CardComercioAlternativo } from './_components/CardComercioAlternativo';
import { TablaDetalleProductos } from './_components/TablaDetalleProductos';
import { SelectorCriterio } from './_components/SelectorCriterio';
import { FiltroPromociones, DetallePromo } from './_components/Promociones';
import {
  diaDeHoy,
  obtenerTopTresConPromos,
  usePromocionesBancarias,
  type SucursalConPromo,
} from './_lib/promociones';
import { useMisMediosPago } from '@/app/_hooks/useMisMediosPago';
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';

export default function ComparativaPage() {
  const lista = useListaStore((state) => state.lista);
  const ubicacion = useListaStore((state) => state.ubicacion);
  const [criterio, setCriterio] = useState<CriterioComparacion>('mas_barata');

  // Promociones bancarias (opcional)
  const [aplicarPromos, setAplicarPromos] = useState(false);
  const [diaCompra, setDiaCompra] = useState(diaDeHoy);
  const [soloMisMedios, setSoloMisMedios] = useState(true);
  const { misMedios, cambiarMisMedios } = useMisMediosPago();
  const { promos, cargando: cargandoPromos } = usePromocionesBancarias(aplicarPromos);

  // Bancos y billeteras que tienen alguna promo (para el buscador)
  const entidadesConPromo = useMemo(
    () => [...new Set(promos.map((p) => p.entidad))].filter((e) => e !== 'Todos los medios de pago').sort((a, b) => a.localeCompare(b, 'es')),
    [promos],
  );

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

  // 4. Cálculo del Top 3 de cadenas aplicando la estrategia/criterio seleccionado
  //    Si el usuario activó las promociones, los totales ya vienen con el descuento aplicado
  const topTresCadenas: (SucursalCarritoComparada | SucursalConPromo)[] = useMemo(() => {
    if (listaConPreciosActualizados.length === 0) return [];
    if (aplicarPromos) {
      return obtenerTopTresConPromos(listaConPreciosActualizados, criterio, promos, {
        dia: diaCompra,
        misMedios: soloMisMedios && misMedios.length > 0 ? misMedios : null,
      });
    }
    return obtenerTopTresCadenasMasBaratas(listaConPreciosActualizados, criterio);
  }, [listaConPreciosActualizados, criterio, aplicarPromos, promos, diaCompra, soloMisMedios, misMedios]);

  const detallePromo = (sucursal: SucursalCarritoComparada | SucursalConPromo) =>
    aplicarPromos && !cargandoPromos && 'promoAplicada' in sucursal ? (
      <DetallePromo sucursal={sucursal} />
    ) : null;

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

  // Sin ubicación no hay sucursales, y sin sucursales no hay precios. Es otro
  // problema que "no hay cobertura": decirle que su lista no tiene
  // disponibilidad cuando lo que falta es la dirección lo manda a cambiar el
  // radio al vacío.
  if (ubicacion.latitud === null || ubicacion.longitud === null) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-5xl" role="img" aria-label="Mapa">🗺️</div>
            <p className="font-medium text-slate-700">Elegí tu dirección para comparar</p>
            <p className="text-sm text-slate-500">
              Necesitamos saber dónde comprás para buscar los precios de los comercios de tu zona.
            </p>
            <DesktopActionButton
              href="/ubicacion"
              label="Elegir mi dirección"
              icon={<MapPinIcon weight="bold" />}
              color="lila"
            />
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
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Cabecera con selector de criterio */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-slate-900">Comparativa de Supermercados</h1>
          <SelectorCriterio criterio={criterio} onChange={setCriterio} />
        </div>

        <FiltroPromociones
          activo={aplicarPromos}
          onActivo={setAplicarPromos}
          dia={diaCompra}
          onDia={setDiaCompra}
          soloMios={soloMisMedios}
          onSoloMios={setSoloMisMedios}
          entidadesDisponibles={entidadesConPromo}
          misMedios={misMedios}
          onMisMedios={(lista) => {
            cambiarMisMedios(lista);
            setSoloMisMedios(true);
          }}
          cargando={cargandoPromos}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:items-start">
          <section className="flex flex-col gap-4" aria-label="Comercio ganador y alternativas">
            <CardComercioGanador sucursal={ganador} />
            {detallePromo(ganador)}
            {alternativa1 && <CardComercioAlternativo sucursal={alternativa1} posicion={2} />}
            {alternativa1 && detallePromo(alternativa1)}
            {alternativa2 && <CardComercioAlternativo sucursal={alternativa2} posicion={3} />}
            {alternativa2 && detallePromo(alternativa2)}
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