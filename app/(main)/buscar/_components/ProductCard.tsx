import { PlusIcon } from '@phosphor-icons/react/dist/ssr';
import { Producto } from '../_types';

interface Props {
  producto: Producto;
  onAgregar: (id: string, nombre: string) => void;
}

export const ProductCard = ({ producto, onAgregar }: Props) => (
  <div className="bg-white border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between shadow-xs h-full">
    <div>
      {/* Contenedor Imagen (Manteniendo el h-24 que tenías originalmente) */}
      <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-semibold mb-2">
        Imagen
      </div>
      
      {/* Título: El line-clamp-2 y el min-h-[2rem] garantizan la altura uniforme */}
      <h3 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
        {producto.nombre}
      </h3>
      
      {/* Lista de precios comparativa: Integrada sin romper el diseño */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-0.5">
        {producto.precios.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className={`text-[10px] truncate max-w-[80px] ${index === 0 ? 'text-primary-500 font-bold' : 'text-slate-400'}`}>
              {index === 0 ? '🏆 ' : ''}{item.nombre}
            </span>
            <strong className={`text-xs ${index === 0 ? 'text-primary-500 font-bold' : 'text-slate-800'}`}>
              ${item.precio}
            </strong>
          </div>
        ))}
      </div>
    </div>

    {/* Botón: Se mantiene igual */}
    <button 
      onClick={() => onAgregar(producto.id, producto.nombre)}
      className="mt-3 w-full bg-primary-400 hover:bg-primary-500 active:scale-[0.97] text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
    >
      <PlusIcon weight="bold" /> Agregar
    </button>
  </div>
);