'use client';

import { useState } from 'react';
import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { useListaStore } from '@/app/_store/store';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { formatearPrecio } from '@/app/_lib/utils/formatters';
import Link from 'next/link';

interface Props {
  cadenas: SucursalCarritoComparada[];
}

export const TablaDetalleProductos = ({ cadenas }: Props) => {
  const [expandida, setExpandida] = useState(true);
  const lista = useListaStore((state) => state.lista);

  if (!cadenas || cadenas.length === 0) return null;

  const gruposUnicos = Array.from(
    new Map(
      cadenas
        .flatMap((c) => c.productos || [])
        .map((p) => [p.grupoId, p.grupoId])
    ).keys()
  );

  const totalGruposEnLista = lista.filter((g) => !g.comprado).length;

  return (
    <div className="divide-y divide-slate-200">
      <button
        onClick={() => setExpandida(!expandida)}
        aria-expanded={expandida}
        className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-slate-50 md:px-6"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Tabla comparativa</span>
        </div>
        <CaretDownIcon
          weight="bold"
          size={20}
          className={`text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`}
        />
      </button>

      {expandida && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-bold text-slate-700 md:px-6">
                  Producto / Opción
                </th>
                <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 md:px-4 md:text-sm">
                  Cantidad
                </th>
                {cadenas.map((cadena, idx) => (
                  <th
                    key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="px-3 py-3 text-center text-xs font-bold text-slate-700 md:px-4 md:text-sm"
                  >
                    <div>{cadena.cadena}</div>
                    <div className="text-xs font-normal text-slate-500">
                      {idx === 0 ? '1º' : idx === 1 ? '2º' : '3º'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {gruposUnicos.map((grupoId) => {
                const grupoEnStore = lista.find((g) => g.grupoId === grupoId);
                const cantidadGrupo = grupoEnStore?.cantidad ?? 1;

                const nombreMostrar =
                  grupoEnStore?.opciones[0]?.nombre ?? 'Producto';

                return (
                  <tr key={grupoId} className="transition-colors hover:bg-slate-50">
                    <td className="max-w-xs px-4 py-4 text-xs font-medium text-slate-900 md:px-6 md:text-sm">
                      <div>{nombreMostrar}</div>
                      {grupoEnStore && grupoEnStore.opciones.length > 1 && (
                        <div className="text-[10px] text-slate-500">
                          ({grupoEnStore.opciones.length} alternativas evaluadas)
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-4 text-center font-semibold text-slate-900 md:px-4">
                      {cantidadGrupo}
                    </td>

                    {cadenas.map((cadena) => {
                      const prodEnSucursal = cadena.productos.find(
                        (p) => p.grupoId === grupoId
                      );

                      const primeraPalabra = nombreMostrar.trim().split(' ')[0] || '';

                      // Extraer la primera palabra del producto específico de esta sucursal
                      const primeraPalabraSucursal = prodEnSucursal?.nombre
                        ? prodEnSucursal.nombre.trim().split(' ')[0]
                        : '';

                      return (
                        <td
                          key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                          className="px-3 py-4 text-center font-semibold text-slate-900 md:px-4"
                        >
                          {prodEnSucursal?.disponible && prodEnSucursal.precio !== null ? (
                            <div className="group relative flex flex-col items-center cursor-pointer">
                              <span className="text-sm md:text-base">
                                ${formatearPrecio(prodEnSucursal.precio)}
                              </span>

                              {/* Muestra la primera palabra con puntos suspensivos */}
                              <span 
                                className="max-w-[80px] truncate text-[10px] text-slate-500 underline decoration-dotted underline-offset-2"
                                title={prodEnSucursal.nombre}
                              >
                                {primeraPalabraSucursal}...
                              </span>

                              {/* Tooltip flotante al hacer Hover (Mouse) o Tap (Mobile) */}
                              <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:flex group-focus:flex flex-col items-center z-20">
                                <span className="relative z-10 whitespace-normal rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-md max-w-[150px] text-center leading-tight">
                                  {prodEnSucursal.nombre}
                                </span>
                                <div className="-mt-1 h-2 w-2 rotate-45 bg-slate-900"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="inline-block max-w-[120px] text-[10px] font-medium leading-tight text-red-500 md:text-xs">
                                No disponible
                              </span>
                              <Link
                                href={`/buscar?q=${encodeURIComponent(primeraPalabra)}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                              >
                                Buscar otro
                              </Link>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              <tr className="bg-slate-100">
                <td className="px-4 py-4 font-bold text-slate-900 md:px-6">
                  TOTAL
                </td>
                <td className="px-3 py-4 text-center font-bold text-slate-900 md:px-4">
                  {totalGruposEnLista}
                </td>
                {cadenas.map((cadena) => (
                  <td
                    key={`total-${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="px-3 py-4 text-center font-black text-slate-900 md:px-4"
                  >
                    <span className="text-base md:text-lg">
                      ${formatearPrecio(cadena.total)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] md:text-[11px] font-medium leading-snug text-slate-600 p-4 md:px-6">
            * Lalista no proporciona información sobre la disponibilidad de productos en tiempo real. Los precios y la disponibilidad pueden variar según la sucursal y el momento de la compra.
          </p>
        </div>
      )}
    </div>
  );
};