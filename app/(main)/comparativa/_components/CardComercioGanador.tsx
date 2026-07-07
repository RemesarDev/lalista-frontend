import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { CrownIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  sucursal: SucursalCarritoComparada;
}

const formatearPrecio = (precio: number | null): string => {
  if (precio === null) return '';
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(precio);
};

export const CardComercioGanador = ({ sucursal }: Props) => {
  return (
    <div className="rounded-2xl border border-primary-200 bg-white p-3 shadow-sm ring-1 ring-primary-50">
      <div className="mb-2 flex items-start gap-2">
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm">
          <CrownIcon weight="fill" size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base md:text-[2rem] font-black leading-tight text-slate-900">
            {sucursal.cadena}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary-500">
            Mejor precio total
          </p>
        </div>
      </div>

      <div className="mb-2 flex items-start gap-2">
        <MapPinIcon weight="fill" size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] md:text-xs font-medium leading-snug text-slate-600 line-clamp-2">
          {sucursal.direccion}
        </p>
      </div>

      <div className="mb-2 rounded-xl bg-primary-50 px-3 py-2">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Total de tu compra
        </p>
        <p className="text-2xl md:text-3xl font-black leading-none text-emerald-600">
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