'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { useListaStore } from '@/app/_store/store';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';
import { 
  formatearNombre, 
  formatearPrecio, 
} from '@/app/_lib/utils/formatters';
import Link from 'next/link';
import { obtenerNombreComunGrupo } from '@/app/_lib/utils/obtenerNombreComunGrupo';

interface Props {
  cadenas: SucursalCarritoComparada[];
}

export const TablaDetalleProductos = ({ cadenas }: Props) => {
  const [expandida, setExpandida] = useState(true);
  const lista = useListaStore((state) => state.lista);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const abrirFicha = (idProducto: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('producto', idProducto);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!cadenas || cadenas.length === 0) return null;

  const gruposUnicos = Array.from(
    new Map(
      cadenas
        .flatMap((c) => c.productos || [])
        .map((p) => [p.grupoId, p.grupoId])
    ).keys()
  );

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
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[25%] px-1 py-3 text-left font-bold text-slate-700 md:w-[40%] md:px-6">
                  Producto / Opción
                </th>
                {cadenas.map((cadena, idx) => (
                  <th
                    key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="w-[25%] px-1 py-3 text-center text-[11px] font-bold text-slate-700 md:w-[20%] md:px-4 md:text-sm"
                  >
                    <div className="truncate">{cadena.cadena}</div>
                    <div className="text-[10px] font-normal text-slate-500 md:text-xs">
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

                const nombreMostrar = grupoEnStore?.opciones
                  ? obtenerNombreComunGrupo(grupoEnStore.opciones)
                  : 'Producto';

                return (
                  <tr key={grupoId} className="transition-colors hover:bg-slate-50">
                    <td className="px-1 py-3 text-[11px] font-medium leading-tight text-slate-900 md:px-6 md:text-sm">
                      <div className="line-clamp-2 break-words">
                        {cantidadGrupo > 1 && (
                          <span className="mr-1 font-bold text-slate-700">
                            ({cantidadGrupo}x)
                          </span>
                        )}
                        {nombreMostrar}
                      </div>
                      {grupoEnStore && grupoEnStore.opciones.length > 1 && (
                        <div className="mt-0.5 text-[9px] text-slate-500 md:text-[10px]">
                          ({grupoEnStore.opciones.length} alt.)
                        </div>
                      )}
                    </td>

                    {cadenas.map((cadena) => {
                      const prodEnSucursal = cadena.productos.find(
                        (p) => p.grupoId === grupoId
                      );

                      const primeraPalabra = nombreMostrar.trim().split(' ')[0] || '';

                      const nombreSucursalFormateado = prodEnSucursal?.nombre
                        ? formatearNombre(prodEnSucursal.nombre)
                        : '';

                      const primeraPalabraSucursal = nombreSucursalFormateado
                        .trim()
                        .split(' ')[0];

                      return (
                        <td
                          key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                          className="px-1 py-3 text-center font-semibold text-slate-900 md:px-4"
                        >
                          {prodEnSucursal?.disponible && prodEnSucursal.precio !== null ? (
                            <div 
                              onClick={() => prodEnSucursal?.id && abrirFicha(prodEnSucursal.id)}
                              className="group relative flex flex-col items-center cursor-pointer hover:text-orange-500 transition-colors"
                            >
                              <span className="text-xs md:text-base font-bold">
                                ${formatearPrecio(prodEnSucursal.precio)}
                              </span>

                              <span 
                                className="max-w-[65px] md:max-w-[80px] truncate text-[9px] md:text-[10px] text-slate-500 group-hover:text-orange-500 underline decoration-dotted underline-offset-2"
                                title={nombreSucursalFormateado}
                              >
                                {primeraPalabraSucursal}...
                              </span>

                              <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:flex group-focus:flex flex-col items-center z-20">
                                <span className="relative z-10 whitespace-normal rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-md max-w-[150px] text-center leading-tight">
                                  {nombreSucursalFormateado}
                                </span>
                                <div className="-mt-1 h-2 w-2 rotate-45 bg-slate-900"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="inline-block text-[9px] font-medium leading-tight text-red-500 md:text-xs">
                                No disponible
                              </span>
                              <Link
                                href={`/buscar?q=${encodeURIComponent(primeraPalabra)}`}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 md:text-xs"
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
                <td className="px-1 py-3 font-bold text-slate-900 md:px-6">
                  TOTAL
                </td>
                {cadenas.map((cadena) => (
                  <td
                    key={`total-${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="px-1 py-3 text-center font-black text-slate-900 md:px-4"
                  >
                    <span className="text-xs md:text-lg">
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