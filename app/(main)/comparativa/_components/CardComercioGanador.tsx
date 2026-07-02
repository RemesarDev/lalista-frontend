import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { CrownIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  sucursal: SucursalCarritoComparada;
  totalAlternativa?: number | null; // 🛡️ Ahora la alternativa también podría ser null
}

// 🛡️ Ajustamos el formateador para aceptar null de forma segura
const formatearPrecio = (precio: number | null): string => {
  if (precio === null) return '';
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const CardComercioGanador = ({ sucursal, totalAlternativa }: Props) => {
  // 🛡️ Solo calculamos el ahorro si ambos totales son válidos (no null)
  const tieneTotalValido = sucursal.total !== null;
  const tieneAlternativaValida = totalAlternativa !== undefined && totalAlternativa !== null;

  const ahorro = tieneTotalValido && tieneAlternativaValida
    ? (totalAlternativa as number) - (sucursal.total as number)
    : 0;
  
  const porcentajeAhorro = tieneTotalValido && tieneAlternativaValida && (sucursal.total as number) > 0
    ? Math.round((((totalAlternativa as number) - (sucursal.total as number)) / (totalAlternativa as number)) * 100)
    : 0;

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
      {/* Corona y Badge Ganador */}
      <div className="flex items-center gap-2 mb-6">
        <CrownIcon weight="fill" size={24} className="text-amber-300" />
        <span className="text-sm font-bold uppercase tracking-widest bg-amber-300 bg-opacity-30 px-3 py-1 rounded-full">
          Más Barato
        </span>
        {ahorro > 0 && (
          <span className="ml-auto text-sm font-bold bg-amber-300 bg-opacity-40 text-amber-50 px-3 py-1 rounded-full">
            Ahorrás ${formatearPrecio(ahorro)} ({porcentajeAhorro}%)
          </span>
        )}
      </div>

      {/* Nombre del Comercio y Ubicación */}
      <h2 className="text-3xl font-black mb-3">
        {sucursal.cadena}
      </h2>
      
      <div className="flex items-start gap-2 mb-6">
        <MapPinIcon weight="fill" size={20} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium opacity-95">
          {sucursal.direccion}
        </p>
      </div>

      {/* Total del Carrito - Lo más importante */}
      <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold opacity-90 mb-1 text-black">Total de tu compra</p>
        <p className="text-5xl md:text-6xl font-black text-primary-500">
          {tieneTotalValido ? (
            `$${formatearPrecio(sucursal.total)}`
          ) : (
            // 🛡️ Fallback visual si a este comercio le faltan productos de la lista
            <span className="text-2xl md:text-3xl font-bold tracking-normal italic opacity-90">
              Canasta incompleta
            </span>
          )}
        </p>
      </div>

      {/* Detalles de Productos */}
      <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
        <p className="text-xs font-semibold opacity-75 uppercase mb-3 text-black">
          {(sucursal.productos || []).length} producto{(sucursal.productos || []).length !== 1 ? 's' : ''} en tu lista
        </p>
        <div className="space-y-2">
          {(sucursal.productos || []).slice(0, 3).map((prod, index) => (
            <div key={`${prod.id}-${index}`} className="flex justify-between items-center text-xs">
                <span className="opacity-90 line-clamp-1 text-black max-w-(200px)">{prod.nombre}</span>
                {/* 🛡️ Si el producto individual es null, mostramos un guión corto */}
                <span className="font-semibold text-black">
                  {prod.precio !== null ? `$${formatearPrecio(prod.precio)}` : '—'}
                </span>
            </div>
          ))}

          {(sucursal.productos || []).length > 3 && (
            <p className="text-xs opacity-75 pt-2 border-t border-white border-opacity-20 text-black">
              +{(sucursal.productos || []).length - 3} producto{(sucursal.productos || []).length - 3 !== 1 ? 's' : ''} más
            </p>
          )}
        </div>
      </div>
    </div>
  );
};