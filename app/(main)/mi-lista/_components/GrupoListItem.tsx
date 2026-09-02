'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, TrashIcon, PlusCircleIcon, MinusCircleIcon } from '@phosphor-icons/react/dist/ssr';
import type { GrupoLista } from '@/app/_store/slices/listaSlice';
import { formatearNombre } from '@/app/_lib/utils/formatters';

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
  onEliminarGrupo,
  onToggleComprado,
}: GrupoListItemProps) {
  const principal = grupo.opciones[0];
  const alternativas = grupo.opciones.slice(1);

  if (!principal) return null;

  // Extraer término clave para sugerir en la búsqueda (ej: "Leche Entera")
  const terminoSugerido = encodeURIComponent(principal.nombre.split(' ').slice(0, 2).join(' '));

  const router = useRouter();
  const searchParams = useSearchParams();

  // Abre la ficha del producto agregando ?producto=EAN a la URL.
  const abrirFicha = (idProducto: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('producto', idProducto);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={`flex flex-col rounded-xl border p-4 transition-all bg-white ${
      grupo.comprado ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-sm'
    }`}>
      {/* Cabecera del grupo: Checkbox, Cantidad y Controles */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={grupo.comprado ?? false}
            onChange={() => onToggleComprado(grupo.grupoId)}
            className="h-5 w-5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {grupo.opciones.length > 1 ? `Grupo (${grupo.opciones.length} opciones)` : 'Producto'}
          </span>
        </div>

        {/* Control de Cantidad del Grupo */}
        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
          <button
            onClick={() => onDecrementar(grupo.grupoId)}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <MinusCircleIcon size={18} weight="bold" />
          </button>
          <span className="text-xs font-bold text-slate-800 w-4 text-center">
            {grupo.cantidad}
          </span>
          <button
            onClick={() => onIncrementar(grupo.grupoId)}
            className="text-slate-500 hover:text-slate-800 transition-colors"
          >
            <PlusCircleIcon size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Producto Principal */}
      <div className="flex items-center justify-between py-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
            {principal.url_imagen ? (
              <Image
                src={principal.url_imagen}
                alt={principal.nombre}
                fill
                sizes="48px"
                className="object-contain p-1"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300 text-xs">
                Sin foto
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 rounded w-max mb-1">
              Opción principal
            </span>
            <p
              onClick={() => abrirFicha(principal.id)}
              className={`text-sm font-semibold truncate cursor-pointer hover:text-primary-500 transition-colors ${grupo.comprado ? 'line-through text-slate-400' : 'text-slate-800'}`}
            >
              {principal.nombre}
            </p>
          </div>
        </div>

        <button
          onClick={() => onEliminarOpcion(grupo.grupoId, principal.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Eliminar opción principal"
        >
          <TrashIcon size={16} />
        </button>
      </div>

      {/* Lista de Alternativas */}
{alternativas.length > 0 && (
  <div className="flex flex-col gap-2 pl-4 border-l-2 border-orange-200 my-1">
    {alternativas.map((alt) => (
      <div key={alt.id} className="flex items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-8 w-8 shrink-0 rounded-md overflow-hidden border border-slate-100 bg-slate-50">
            {alt.url_imagen ? (
              <Image
                src={alt.url_imagen}
                alt={alt.nombre}
                fill
                sizes="32px"
                className="object-contain p-0.5"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300 text-[8px]">
                S/F
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-slate-600 truncate">
            {formatearNombre(alt.nombre)}
          </span>
        </div>
        <button
          onClick={() => onEliminarOpcion(grupo.grupoId, alt.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1 shrink-0"
        >
          <TrashIcon size={14} />
        </button>
      </div>
    ))}
  </div>
)}

      {/* Botón para Buscar y Agregar Alternativa */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
        <Link
          href={`/buscar?modo=alternativa&grupoId=${grupo.grupoId}&q=${terminoSugerido}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <PlusIcon size={14} weight="bold" />
          Agregar alternativa
        </Link>
      </div>
    </div>
  );
}