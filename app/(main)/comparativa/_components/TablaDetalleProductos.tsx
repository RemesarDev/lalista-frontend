'use client';
import { useState } from 'react';
import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { useListaStore } from '@/app/_store/store';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  cadenas: SucursalCarritoComparada[];
}

const formatearPrecio = (precio: number | null): string => {
  if (precio === null) return '';
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(precio);
};

export const TablaDetalleProductos = ({ cadenas }: Props) => {
  const [expandida, setExpandida] = useState(true);
  const lista = useListaStore((state) => state.lista);
  const totalEnLista = useListaStore((state) => state.lista.length);

  if (!cadenas || cadenas.length === 0) return null;

  const productosUnicos = Array.from(
    new Map(
      cadenas
        .flatMap((c) => c.productos || [])
        .map((p) => [p.id, { id: p.id, nombre: p.nombre }])
    ).values()
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-bold text-slate-700 md:px-6">
                  Producto
                </th>
                <th className="px-3 py-3 text-center font-bold text-slate-700 text-xs md:px-4 md:text-sm">
                  Cantidad
                </th>
                {cadenas.map((cadena, idx) => (
                  <th
                    key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="px-3 py-3 text-center font-bold text-slate-700 text-xs md:px-4 md:text-sm"
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
              {productosUnicos.map((producto) => {
                const cantidadSeleccionada =
                  lista.find((item) => item.id === producto.id)?.cantidad ?? 0;

                return (
                  <tr key={producto.id} className="transition-colors hover:bg-slate-50">
                    <td className="max-w-(xs) px-4 py-4 font-medium text-slate-900 text-xs md:px-6 md:text-sm">
                      {producto.nombre}
                    </td>

                    <td className="px-3 py-4 text-center font-semibold text-slate-900 md:px-4">
                      {cantidadSeleccionada}
                    </td>

                    {cadenas.map((cadena) => {
                      const productoEnSucursal = cadena.productos.find((p) => p.id === producto.id);
                      const primeraPalabra = producto.nombre.trim().split(' ')[0] || '';

                      return (
                        <td
                          key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                          className="px-3 py-4 text-center font-semibold text-slate-900 md:px-4"
                        >
                          {productoEnSucursal?.disponible && productoEnSucursal.precio !== null ? (
                            <span className="text-sm md:text-base">
                              ${formatearPrecio(productoEnSucursal.precio)}
                            </span>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="max-w-[120px] inline-block text-[10px] font-medium leading-tight text-red-500 md:text-xs">
                                Este producto no está disponible en la sucursal
                              </span>
                              <a
                                href={`/buscar?q=${encodeURIComponent(primeraPalabra)}`}
                                className="text-xs font-bold text-primary-500 underline transition-colors hover:text-primary-600"
                              >
                                Busque otro
                              </a>
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
                  {totalEnLista === 0 
                    ? '0' 
                    : `${totalEnLista}`
                  }
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
        </div>
      )}
    </div>
  );
};