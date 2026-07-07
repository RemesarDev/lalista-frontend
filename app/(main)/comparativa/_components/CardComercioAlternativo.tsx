import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  sucursal: SucursalCarritoComparada;
  posicion: 2 | 3;
}

const formatearPrecio = (precio: number | null): string => {
  if (precio === null) return '';
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(precio);
};

const BadgePosicion = ({ posicion }: { posicion: 2 | 3 }) => {
  const colores = {
    2: 'bg-slate-400 text-white',
    3: 'bg-amber-600 text-white',
  };

  return (
    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${colores[posicion]}`}>
      {posicion}
    </div>
  );
};

export const CardComercioAlternativo = ({ sucursal, posicion }: Props) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start gap-2">
        <BadgePosicion posicion={posicion} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base md:text-[1.05rem] font-bold text-slate-900">
            {sucursal.cadena}
          </h3>
        </div>
      </div>

      <div className="mb-2 flex items-start gap-2">
        <MapPinIcon weight="fill" size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] md:text-xs leading-snug text-slate-600 line-clamp-2">
          {sucursal.direccion}
        </p>
      </div>

      <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Total de tu compra
        </p>
        <p className="text-xl md:text-[1.6rem] font-black leading-none text-primary-600">
          ${formatearPrecio(sucursal.total)}
        </p>
      </div>

      <p className="text-[10px] md:text-[11px] font-medium leading-snug text-slate-600">
        Esta sucursal tiene disponibles{' '}
        <span className="font-black text-slate-900">{sucursal.productosDisponibles}</span>{' '}
        de{' '}
        <span className="font-black text-slate-900">{sucursal.productos.length}</span>{' '}
        productos de tu lista
      </p>
    </div>
  );
};