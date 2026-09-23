'use client';

import { type CriterioComparacion } from '../_lib/Funciones-comparacion';
import { TagIcon, StarIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface Props {
  criterio: CriterioComparacion;
  onChange: (nuevoCriterio: CriterioComparacion) => void;
}

export const SelectorCriterio = ({ criterio, onChange }: Props) => {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs md:text-sm font-medium">
      <button
        type="button"
        onClick={() => onChange('mas_barata')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
          criterio === 'mas_barata'
            ? 'bg-white text-slate-900 shadow-sm font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <TagIcon weight={criterio === 'mas_barata' ? 'fill' : 'regular'} className="text-emerald-600" size={16} />
        <span>Más barata</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('producto_preferido')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
          criterio === 'producto_preferido'
            ? 'bg-white text-slate-900 shadow-sm font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <StarIcon weight={criterio === 'producto_preferido' ? 'fill' : 'regular'} className="text-amber-500" size={16} />
        <span>Producto preferido</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('mas_cercana')}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
          criterio === 'mas_cercana'
            ? 'bg-white text-slate-900 shadow-sm font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <MapPinIcon weight={criterio === 'mas_cercana' ? 'fill' : 'regular'} className="text-blue-600" size={16} />
        <span>Más cercana</span>
      </button>
    </div>
  );
};