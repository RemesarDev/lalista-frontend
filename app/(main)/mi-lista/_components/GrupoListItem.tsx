'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, TrashIcon, PlusCircleIcon, MinusCircleIcon } from '@phosphor-icons/react/dist/ssr';
import type { GrupoLista } from '@/app/_store/slices/listaSlice';
import { formatearNombre } from '@/app/_lib/utils/formatters';
import { obtenerNombreComunGrupo } from '@/app/_lib/utils/obtenerNombreComunGrupo';

interface GrupoListItemProps {
  grupo: GrupoLista;
  onIncrementar: (grupoId: string) => void;
  onDecrementar: (grupoId: string) => void;
  onEliminarOpcion: (grupoId: string, productoId: string) => void;
  onEliminarGrupo: (grupoId: string) => void;
  onToggleComprado: (grupoId: string) => void;
}

export function GrupoListItem({
  grupo,
  onIncrementar,
  onDecrementar,
  onEliminarOpcion,
  onToggleComprado,
}: GrupoListItemProps) {
  const principal = grupo.opciones[0];

  if (!principal) return null;

  const nombreGrupo = obtenerNombreComunGrupo(grupo.opciones);

  const terminoSugerido = encodeURIComponent(principal.nombre.split(' ').slice(0, 2).join(' '));

  const router = useRouter();
  const searchParams = useSearchParams();

  const abrirFicha = (idProducto: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('producto', idProducto);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-2 sm:p-3 transition-all bg-white ${
        grupo.comprado ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-sm'
      }`}
    >
      {/* Cabecera del grupo Ultra-Compacta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={grupo.comprado ?? false}
            onChange={() => onToggleComprado(grupo.grupoId)}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer shrink-0"
          />
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all truncate ${
              grupo.comprado ? 'line-through text-slate-300' : 'text-slate-400'
            }`}
            title={nombreGrupo}
          >
            {nombreGrupo} {grupo.opciones.length > 1 ? `(${grupo.opciones.length} alternativas)` : ''}
          </span>
        </div>

        {/* Control de Cantidad del Grupo */}
        <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
          <button
            onClick={() => onDecrementar(grupo.grupoId)}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <MinusCircleIcon size={15} weight="bold" />
          </button>
          <span className="text-[11px] font-bold text-slate-800 w-3 text-center">
            {grupo.cantidad}
          </span>
          <button
            onClick={() => onIncrementar(grupo.grupoId)}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <PlusCircleIcon size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Tira Horizontal de Productos + Botón Agregar al final */}
      <div className="flex flex-row items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
        {grupo.opciones.map((producto, idx) => {
          const esPrincipal = idx === 0;

          return (
            <div
              key={producto.id}
              className={`relative flex items-center gap-2 p-1.5 rounded-lg border shrink-0 w-[170px] sm:w-[200px] snap-start transition-all ${
                esPrincipal
                  ? 'border-orange-200 bg-orange-50/30'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              {/* Imagen del Producto */}
              <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden border border-slate-100 bg-white">
                {producto.url_imagen ? (
                  <Image
                    src={producto.url_imagen}
                    alt={producto.nombre}
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300 text-[8px]">
                    S/F
                  </div>
                )}
              </div>

              {/* Información y Acción */}
              <div className="flex flex-col min-w-0 flex-1 justify-between h-full">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`inline-block px-1 py-0.2 text-[8px] font-extrabold rounded ${
                      esPrincipal
                        ? 'bg-orange-500/10 text-orange-600'
                        : 'bg-slate-200/80 text-slate-500'
                    }`}
                  >
                    {esPrincipal ? 'Principal' : `Alt ${idx}`}
                  </span>

                  <button
                    onClick={() => onEliminarOpcion(grupo.grupoId, producto.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
                    title="Eliminar esta opción"
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>

                <p
                  onClick={() => abrirFicha(producto.id)}
                  className={`text-[11px] font-semibold leading-tight truncate cursor-pointer hover:text-orange-500 transition-colors mt-0.5 ${
                    grupo.comprado ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                  title={producto.nombre}
                >
                  {formatearNombre(producto.nombre)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Tarjeta de Agregar Opción */}
        <Link
          href={`/buscar?modo=alternativa&grupoId=${grupo.grupoId}&q=${terminoSugerido}`}
          className="flex items-center justify-center gap-2 p-1.5 rounded-lg border border-dashed border-orange-300 bg-orange-50/40 hover:bg-orange-100/50 text-orange-600 transition-all shrink-0 w-[170px] sm:w-[200px] h-[54px] snap-start"
          title="Agregar alternativa a este grupo"
        >
          <PlusIcon size={16} weight="bold" />
          <span className="text-[11px] font-bold">Agregar alternativa</span>
        </Link>
      </div>
    </div>
  );
}