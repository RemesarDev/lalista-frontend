'use client';
import { useState } from 'react';
import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  cadenas: SucursalCarritoComparada[];
}

const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const TablaDetalleProductos = ({ cadenas }: Props) => {
  const [expandida, setExpandida] = useState(false);

  if (!cadenas || cadenas.length === 0) return null;

  // Obtener lista única de productos ordenados
  const productosUnicos = Array.from(
    new Map(
      cadenas[0].productos.map((p) => [
        p.id,
        { id: p.id, nombre: p.nombre },
      ])
    ).values()
  );

  return (
    <div className="divide-y divide-slate-200">
      {/* Header Desplegable */}
      <button
        onClick={() => setExpandida(!expandida)}
        className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">Detalles por producto</span>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded">
            {productosUnicos.length}
          </span>
        </div>
        <CaretDownIcon
          weight="bold"
          size={20}
          className={`text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Tabla Expandida */}
      {expandida && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 md:px-6 py-3 font-bold text-slate-700">Producto</th>
                {cadenas.map((cadena, idx) => (
                  <th
                    key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="text-center px-3 md:px-4 py-3 font-bold text-slate-700 text-xs md:text-sm"
                  >
                    <div>{cadena.cadena}</div>
                    <div className="text-xs font-normal text-slate-500">{idx === 0 ? '1º' : idx === 1 ? '2º' : '3º'}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productosUnicos.map((producto) => (
                <tr key={producto.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-medium text-slate-900 text-xs md:text-sm">
                    {producto.nombre}
                  </td>
                  {cadenas.map((cadena) => {
                    const productoEnSucursal = cadena.productos.find((p) => p.id === producto.id);
                    return (
                      <td
                        key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                        className="text-center px-3 md:px-4 py-4 font-semibold text-slate-900"
                      >
                        {productoEnSucursal?.disponible ? (
                          <span className="text-sm md:text-base">${formatearPrecio(productoEnSucursal.precio)}</span>
                        ) : (
                          <span className="text-xs md:text-sm text-red-500 font-medium">No disponible</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Fila de Totales */}
              <tr className="bg-slate-100">
                <td className="px-4 md:px-6 py-4 font-bold text-slate-900">TOTAL</td>
                {cadenas.map((cadena) => (
                  <td
                    key={`total-${cadena.id_comercio}-${cadena.id_bandera}`}
                    className="text-center px-3 md:px-4 py-4 font-black text-slate-900"
                  >
                    <span className="text-base md:text-lg">${formatearPrecio(cadena.total)}</span>
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
