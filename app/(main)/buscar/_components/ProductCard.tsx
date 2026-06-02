import { MapPinIcon, PlusIcon } from '@phosphor-icons/react/dist/ssr';
import { Producto } from '../_types';

interface Props {
  producto: Producto;
  onAgregar: (id: number, nombre: string) => void;
}

export const ProductCard = ({ producto, onAgregar }: Props) => (
  <div className="bg-white border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between shadow-xs">
    <div>
      <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-semibold mb-2">
        Imagen
      </div>
      <h3 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 min-h-[2rem] leading-tight">
        {producto.nombre}
      </h3>
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">El más barato:</span>
          <strong className="text-xs text-slate-800 font-bold truncate max-w-[70px]">{producto.superMasBarato}</strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            <MapPinIcon weight="fill" className="text-primary-400 text-xs" /> En tu zona
          </span>
          <strong className="text-sm md:text-base text-primary-400 font-black">${producto.precioMin}</strong>
        </div>
      </div>
    </div>
    <button 
      onClick={() => onAgregar(producto.id, producto.nombre)}
      className="mt-3 w-full bg-primary-400 hover:bg-primary-500 active:scale-[0.97] text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
    >
      <PlusIcon weight="bold" /> Agregar
    </button>
  </div>
);