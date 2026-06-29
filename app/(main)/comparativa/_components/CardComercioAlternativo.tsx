import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  sucursal: SucursalCarritoComparada;
  posicion: 2 | 3;
}

const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

const BadgePosicion = ({ posicion }: { posicion: 2 | 3 }) => {
  const colores = {
    2: 'bg-slate-400 text-white',
    3: 'bg-amber-600 text-white',
  };
  
  const textos = {
    2: '2º Lugar',
    3: '3º Lugar',
  };

  return (
    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${colores[posicion]}`}>
      {posicion}
    </div>
  );
};

export const CardComercioAlternativo = ({ sucursal, posicion }: Props) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-xs hover:shadow-sm transition-shadow">
      {/* Badge de Posición */}
      <div className="flex items-center gap-3 mb-4">
        <BadgePosicion posicion={posicion} />
        <h3 className="text-lg md:text-xl font-bold text-slate-900">
          {sucursal.cadena}
        </h3>
      </div>

      {/* Ubicación */}
      <div className="flex items-start gap-2 mb-4">
        <MapPinIcon weight="fill" size={16} className="flex-shrink-0 mt-0.5 text-slate-500" />
        <p className="text-xs md:text-sm text-slate-600">
          {sucursal.direccion}
        </p>
      </div>

      {/* Total - Destacado */}
      <div className="bg-slate-50 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-slate-500 mb-1">Total</p>
        <p className="text-2xl md:text-3xl font-black text-slate-900">
          ${formatearPrecio(sucursal.total)}
        </p>
      </div>

      {/* Resumen de Productos (sin detalles) */}
      <p className="text-xs text-slate-500">
        {sucursal.productos.length} producto{sucursal.productos.length !== 1 ? 's' : ''} en lista
      </p>
    </div>
  );
};
