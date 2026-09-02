'use client';

import { formatearDistancia, formatearNombre, formatearPrecio } from '@/app/_lib/utils/formatters';
import { type SucursalCarritoComparada } from '../_lib/Funciones-comparacion';
import { MapPinIcon } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { verUbicacionSucursal } from '@/app/_lib/utils/navegacionMapa';

interface Props {
  sucursal: SucursalCarritoComparada;
  posicion: 2 | 3;
}

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
  const router = useRouter();
  const distanciaTexto = formatearDistancia(sucursal.distancia);

  const handleIrAlMapa = () => {
    verUbicacionSucursal({
      router,
      latitud: sucursal.latitud,
      longitud: sucursal.longitud,
      nombre: sucursal.cadena, 
    });
  };

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

      <div 
        onClick={handleIrAlMapa}
        className="mb-2 flex items-start gap-2 cursor-pointer group rounded-lg p-1 -ml-1 transition-colors hover:bg-slate-100"
        title="Ver sucursal en el mapa"
      >
        <MapPinIcon weight="fill" size={15} className="mt-0.5 shrink-0 text-slate-500 group-hover:text-primary-600 transition-colors" />
        <p className="text-[11px] md:text-xs leading-snug text-slate-600 line-clamp-2 group-hover:text-slate-900 group-hover:underline">
          {formatearNombre(sucursal.direccion)}
          {distanciaTexto && (
            <span className="ml-1 text-slate-500 font-medium">
              (a {distanciaTexto})
            </span>
          )}
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