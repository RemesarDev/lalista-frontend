import { PlusIcon, MinusIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { Producto } from '../_types';

interface Props {
  producto: Producto;
  // Actualizamos la firma de la función para incluir la cantidad
  onAgregar: (id: string, nombre: string, cantidad: number) => void;
}

export const ProductCard = ({ producto, onAgregar }: Props) => {
  const [cantidad, setCantidad] = useState(0);

  const handleUpdate = (nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    setCantidad(nuevaCantidad);
    onAgregar(producto.id, producto.nombre, nuevaCantidad);
  };

  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between shadow-xs h-full">
      <div>
        <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-semibold mb-2">
          Imagen
        </div>
        
        <h3 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
          {producto.nombre}
        </h3>
        
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
          {producto.sucursales.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between items-center text-[10px]">
              <div className="flex flex-col truncate mr-2">
                <span className={`font-bold ${index === 0 ? 'text-primary-500' : 'text-slate-700'}`}>
                  {index === 0 ? '🏆 ' : ''}{item.cadena}
                </span>
                <span className="text-slate-400 truncate max-w-[100px]">{item.direccion}</span>
              </div>
              <strong className={`text-xs ${index === 0 ? 'text-primary-500' : 'text-slate-800'}`}>
                ${item.precio}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Control de cantidad integrado */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button 
          onClick={() => handleUpdate(cantidad - 1)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <MinusIcon weight="bold" size={16} />
        </button>
        
        <span className="font-black text-sm text-slate-800 w-8 text-center">{cantidad}</span>
        
        <button 
          onClick={() => handleUpdate(cantidad + 1)}
          className="p-1.5 rounded-lg bg-primary-400 hover:bg-primary-500 text-white transition-colors"
        >
          <PlusIcon weight="bold" size={16} />
        </button>
      </div>
    </div>
  );
};