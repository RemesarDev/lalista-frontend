'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusIcon,
  TrashIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  MinusIcon,
  CaretDownIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { GrupoLista } from '@/app/_store/slices/listaSlice';
import { formatearNombre } from '@/app/_lib/utils/formatters';
import { obtenerNombreComunGrupo } from '@/app/_lib/utils/obtenerNombreComunGrupo';
import { useListaStore } from '@/app/_store/store';
import { USER_LIMITS } from '@/app/_lib/constants/limites';
import { Button } from '@/app/_components/global/Button';

interface GrupoListItemProps {
  grupo: GrupoLista;
  simplificado: boolean;
  abierto: boolean;
  onToggleAbierto: (grupoId: string) => void;
  onIncrementar: (grupoId: string) => void;
  onDecrementar: (grupoId: string) => void;
  onIncrementarOpcion: (grupoId: string, productoId: string) => void;
  onDecrementarOpcion: (grupoId: string, productoId: string) => void;
  onEliminarOpcion: (grupoId: string, productoId: string) => void;
  onEliminarGrupo: (grupoId: string) => void;
  onToggleComprado: (grupoId: string) => void;
  onActualizarNombre: (grupoId: string, nuevoNombre: string) => void;
}

export function GrupoListItem({
  grupo,
  simplificado,
  abierto,
  onToggleAbierto,
  onIncrementar,
  onDecrementar,
  onIncrementarOpcion,
  onDecrementarOpcion,
  onEliminarOpcion,
  onToggleComprado,
  onActualizarNombre,
}: GrupoListItemProps) {
  const principal = grupo.opciones[0];
  
  // Si el usuario ya estableció un nombre personalizado, lo usamos; sino, aplicamos el automático
  const nombreAutomatico = principal ? obtenerNombreComunGrupo(grupo.opciones) : '';
  const nombreMostrado = grupo.nombrePersonalizado || nombreAutomatico;

  const abrirModalLimite = useListaStore((state) => state.abrirModalLimite);
  const LIMITE_ALTERNATIVA_POR_GRUPO = USER_LIMITS.MAX_ALTERNATIVAS_POR_ITEM;

  const router = useRouter();
  const searchParams = useSearchParams();

  const terminoSugerido = principal ? encodeURIComponent(principal.nombre.split(' ').slice(0, 2).join(' ')) : '';

  const handleAgregarAlternativa = (e: React.MouseEvent) => {
    e.preventDefault();
    // Validamos si el grupo ya alcanzó el tope de alternativas
    if (grupo.opciones.length >= LIMITE_ALTERNATIVA_POR_GRUPO) {
      abrirModalLimite(`Has alcanzado el límite máximo de ${LIMITE_ALTERNATIVA_POR_GRUPO} alternativas para este ítem.`);
      return;
    }

    // Si pasa el filtro, navegamos normalmente a la pantalla de búsqueda de alternativas
    router.push(`/buscar?modo=alternativa&grupoId=${grupo.grupoId}&q=${terminoSugerido}`);
  };

  // Estados locales para el modo edición del título
  const [isEditing, setIsEditing] = useState(false);
  const [tempNombre, setTempNombre] = useState(nombreMostrado);

  // Estados para permitir arrastrar con el mouse en pantallas de escritorio
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Los hooks van antes de este return para respetar las reglas de React
  if (!principal) return null;

  // En modo simplificado solo se ve el detalle del ítem abierto
  const mostrarDetalle = !simplificado || abierto;

  const abrirFicha = (idProducto: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('producto', idProducto);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const empezarEdicion = () => {
    setTempNombre(nombreMostrado);
    setIsEditing(true);
  };

  const handleGuardarNombre = () => {
    onActualizarNombre(grupo.grupoId, tempNombre);
    setIsEditing(false);
  };

  const handleCancelarEdicion = () => {
    setTempNombre(nombreMostrado);
    setIsEditing(false);
  };

  // En modo simplificado, tocar el nombre abre/cierra; en modo desplegado, renombra
  const handleClickNombre = () => {
    if (simplificado) {
      onToggleAbierto(grupo.grupoId);
    } else {
      empezarEdicion();
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-2 sm:p-3 transition-all bg-white ${
        grupo.comprado ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-sm'
      } ${simplificado && abierto ? 'border-orange-200 ring-1 ring-orange-100' : ''}`}
    >
      {/* Cabecera del grupo Ultra-Compacta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={grupo.comprado ?? false}
            onChange={() => onToggleComprado(grupo.grupoId)}
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer shrink-0"
          />

          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                value={tempNombre}
                onChange={(e) => setTempNombre(e.target.value)}
                className="w-full text-xs font-bold px-2 py-0.5 border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                autoFocus
                maxLength={40}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGuardarNombre();
                  if (e.key === 'Escape') handleCancelarEdicion();
                }}
              />
              <button
                onClick={handleGuardarNombre}
                className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-medium hover:bg-orange-600 transition shrink-0"
              >
                OK
              </button>
              <button
                onClick={handleCancelarEdicion}
                className="text-xs text-slate-400 hover:text-slate-600 px-1 shrink-0"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 group/edit">
              <span
                className={`text-[10px] sm:text-xs font-bold tracking-wider transition-all truncate cursor-pointer ${
                  grupo.comprado ? 'line-through text-slate-300' : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={handleClickNombre}
                title={simplificado ? 'Tocá para ver las alternativas' : 'Hacé clic para renombrar este ítem'}
              >
                {nombreMostrado} {grupo.opciones.length > 1 ? `(${grupo.opciones.length} alternativas)` : ''}
              </span>

              {/* Lápiz: siempre visible en mobile, en hover en desktop */}
              <button
                onClick={empezarEdicion}
                className="sm:opacity-0 sm:group-hover/edit:opacity-100 text-slate-400 hover:text-orange-500 transition-opacity p-0.5 shrink-0"
                title="Renombrar ítem"
              >
                ✎
              </button>

              {/* Flecha para abrir/cerrar (solo en modo simplificado) */}
              {simplificado && (
                <button
                  onClick={() => onToggleAbierto(grupo.grupoId)}
                  className="ml-auto flex-1 flex justify-end text-slate-400 hover:text-orange-500 transition-colors p-0.5"
                  title={abierto ? 'Ocultar alternativas' : 'Ver alternativas'}
                  aria-expanded={abierto}
                >
                  <CaretDownIcon
                    size={14}
                    weight="bold"
                    className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
          )}
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
      {mostrarDetalle && (
        <div 
          className={`flex flex-row items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory scroll-smooth touch-pan-x select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={(e) => {
            setIsDragging(true);
            setStartX(e.pageX - e.currentTarget.offsetLeft);
            setScrollLeft(e.currentTarget.scrollLeft);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onMouseUp={() => setIsDragging(false)}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - e.currentTarget.offsetLeft;
            const walk = (x - startX) * 1.5;
            e.currentTarget.scrollLeft = scrollLeft - walk;
          }}
        >
          {grupo.opciones.map((producto, idx) => {
            const esPrincipal = idx === 0;
            const cantidadOpcion = producto.cantidadOpcion ?? 1;

            return (
              <div
                key={producto.id}
                className={`relative flex items-center gap-2 p-1.5 rounded-lg border shrink-0 w-[185px] sm:w-[210px] snap-start transition-all ${
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
                <div className="flex flex-col min-w-0 flex-1 justify-between gap-1 h-full">
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
                    className={`text-[11px] font-semibold leading-tight truncate cursor-pointer hover:text-orange-500 transition-colors ${
                      grupo.comprado ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                    title={producto.nombre}
                  >
                    {formatearNombre(producto.nombre)}
                  </p>

                  {/* Control de Cantidad por Opción */}
                  <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/60">
                    <span className="text-[9px] text-slate-400 font-medium">Unidades:</span>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1 py-0.5 shadow-2xs">
                      <button
                        onClick={() => onDecrementarOpcion(grupo.grupoId, producto.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Restar unidad"
                      >
                        <MinusIcon size={10} weight="bold" />
                      </button>
                      <span className="text-[10px] font-extrabold text-slate-700 w-3 text-center">
                        {cantidadOpcion}
                      </span>
                      <button
                        onClick={() => onIncrementarOpcion(grupo.grupoId, producto.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title="Sumar unidad"
                      >
                        <PlusIcon size={10} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tarjeta de Agregar Alternativa Protegida con el componente Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleAgregarAlternativa}
            className="flex items-center justify-center gap-2 p-1.5 rounded-lg border border-dashed border-orange-300 bg-orange-50/40 hover:bg-orange-100/50 text-orange-600 transition-all shrink-0 w-[185px] sm:w-[210px] h-[68px] snap-start text-left font-bold text-[11px]"
            title="Agregar alternativa a este grupo"
          >
            <PlusIcon size={16} weight="bold" className="shrink-0" />
            <span>Agregar alternativa</span>
          </Button>
        </div>
      )}
    </div>
  );
}