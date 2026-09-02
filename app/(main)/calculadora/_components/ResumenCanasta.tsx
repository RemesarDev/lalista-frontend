import { ShoppingBagIcon } from '@phosphor-icons/react/dist/ssr';
import { formatearPrecio } from '@/app/_lib/utils/formatters';
import type { Changuito } from '../_types/changuito';

interface ResumenCanastaProps {
  changuito: Changuito;
}

/** Muestra los productos congelados de este changuito, y el último precio
 * conocido en cada uno de los supermercados que se están siguiendo. */
export function ResumenCanasta({ changuito }: ResumenCanastaProps) {
  return (
    <div>
      <div className="flex flex-col">
        {changuito.productos.map((producto) => (
          <div
            key={producto.id}
            className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
              {producto.urlImagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={producto.urlImagen}
                  alt={producto.nombre}
                  className="h-full w-full rounded-lg object-contain p-1"
                />
              ) : (
                <ShoppingBagIcon size={16} weight="thin" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">{producto.nombre}</p>
              <p className="text-[11px] text-slate-400">x{producto.cantidad}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-200 pt-3">
        {changuito.supermercados.map((s) => {
          const historial = changuito.historialPorSupermercado.find((h) => h.clave === s.clave);
          const ultimo = historial?.puntos.at(-1);
          return (
            <div key={s.clave} className="flex items-center justify-between text-xs sm:text-sm">
              <p className="font-bold text-slate-500">{s.cadena}</p>
              <p className="font-black text-slate-900">${formatearPrecio(ultimo?.precioTotal ?? 0)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}