'use client';
import { useState } from 'react';
import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  cadenas: SucursalCarritoComparada[];
}

// 🛡️ Modificado para aceptar null de forma segura
const formatearPrecio = (precio: number | null): string => {
  if (precio === null) return '';
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const TablaDetalleProductos = ({ cadenas }: Props) => {
  const [expandida, setExpandida] = useState(false);

  if (!cadenas || cadenas.length === 0) return null;

  // 🛡️ CORRECCIÓN 1: Unificamos los productos de todas las cadenas para no perder 
  // de vista los ítems que falten en el primer comercio de la lista.
  const productosUnicos = Array.from(
    new Map(
      cadenas
        .flatMap((c) => c.productos || [])
        .map((p) => [p.id, { id: p.id, nombre: p.nombre }])
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
                    <div className="text-xs font-normal text-slate-500">
                      {idx === 0 ? '1º' : idx === 1 ? '2º' : '3º'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productosUnicos.map((producto) => (
                <tr key={producto.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-medium text-slate-900 text-xs md:text-sm max-w-(xs)">
                    {producto.nombre}
                  </td>
                  {cadenas.map((cadena) => {
                    const productoEnSucursal = cadena.productos.find((p) => p.id === producto.id);
                    
                    // 🛡️ Extraemos la primera palabra para usarla de sugerencia en el buscador
                    const primeraPalabra = producto.nombre.trim().split(' ')[0] || '';

                    return (
                      <td
                        key={`${cadena.id_comercio}-${cadena.id_bandera}`}
                        className="text-center px-3 md:px-4 py-4 font-semibold text-slate-900 vertical-middle"
                      >
                        {productoEnSucursal?.disponible && productoEnSucursal.precio !== null ? (
                          <span className="text-sm md:text-base">
                            ${formatearPrecio(productoEnSucursal.precio)}
                          </span>
                        ) : (
                          // 🛡️ CORRECCIÓN 2: Interfaz adaptada con el mensaje y enlace dinámico
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-[10px] md:text-xs text-red-500 font-medium max-w-(120px) inline-block leading-tight balance">
                              Este producto no está disponible en la sucursal
                            </span>
                            <a
                              href={`/buscar?query=${encodeURIComponent(primeraPalabra)}`}
                              className="text-xs text-primary-500 font-bold underline hover:text-primary-600 transition-colors"
                            >
                              Busque otro
                            </a>
                          </div>
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
                    {cadena.total !== null ? (
                      <span className="text-base md:text-lg">
                        ${formatearPrecio(cadena.total)}
                      </span>
                    ) : (
                      // 🛡️ Renderizado seguro si el total es null por un producto faltante
                      <span className="text-xs text-slate-500 font-normal italic">
                        Canasta incompleta
                      </span>
                    )}
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