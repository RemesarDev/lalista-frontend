import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { CrownIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  sucursal: SucursalCarritoComparada;
  totalAlternativa?: number;
}

const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const CardComercioGanador = ({ sucursal, totalAlternativa }: Props) => {
  const ahorro = totalAlternativa 
    ? totalAlternativa - sucursal.total
    : 0;
  
  const porcentajeAhorro = totalAlternativa && sucursal.total > 0
    ? Math.round(((totalAlternativa - sucursal.total) / totalAlternativa) * 100)
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
            Ahorras ${formatearPrecio(ahorro)}
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
          ${formatearPrecio(sucursal.total)}
        </p>
      </div>

      {/* Detalles de Productos */}
      <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4">
        <p className="text-xs font-semibold opacity-75 uppercase mb-3 text-black">
          {sucursal.productos.length} producto{sucursal.productos.length !== 1 ? 's' : ''} en tu lista
        </p>
        <div className="space-y-2">
          {sucursal.productos.slice(0, 3).map((prod, index) => (
            // Combinamos el ID con el índice o el estado de disponibilidad
            <div key={`${prod.id}-${index}`} className="flex justify-between items-center text-xs">
                <span className="opacity-90 line-clamp-1 text-black">{prod.nombre}</span>
                <span className="font-semibold text-black">${formatearPrecio(prod.precio)}</span>
            </div>
          ))}

          {sucursal.productos.length > 3 && (
            <p className="text-xs opacity-75 pt-2 border-t border-white border-opacity-20 text-black">
              +{sucursal.productos.length - 3} producto{sucursal.productos.length - 3 !== 1 ? 's' : ''} más
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
