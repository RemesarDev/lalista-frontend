import { PlusIcon, MinusIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { Producto } from '../_types';
import Link from 'next/link';

interface Props {
  producto: Producto;
  onAgregar: (id: string, nombre: string, cantidad: number) => void;
}

export const ProductCard = ({ producto, onAgregar }: Props) => {
  const [cantidad, setCantidad] = useState(0);

  const handleUpdate = (nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    setCantidad(nuevaCantidad);
    onAgregar(producto.id, producto.nombre, nuevaCantidad);
  };

  // 🎯 FILTRADO "ON-THE-FLY": Deduplicamos cadena + tipo de sucursal manteniendo el orden original.
  // Como el backend de Hono/Supabase ya suele devolver los datos ordenados por precio mínimo, 
  // este filtro se quedará automáticamente con la sucursal más barata de cada formato.
  const sucursalesUnicasPorTipo = producto.sucursales.filter((sucursal, index, self) =>
    index === self.findIndex((s) => 
      s.id_comercio === sucursal.id_comercio && s.id_bandera === sucursal.id_bandera
    )
  );

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
          {/* 🚀 Cambiamos producto.sucursales por nuestro nuevo array filtrado */}
          {sucursalesUnicasPorTipo.length > 0 ? (
            sucursalesUnicasPorTipo.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-[10px]">
                <div className="flex flex-col truncate mr-2">
                  <span className={`font-bold ${index === 0 ? 'text-slate-700' : 'text-slate-700'}`}>
                    {item.cadena}
                  </span>
                  {/* <span className="text-slate-400 truncate max-w-[100px]">{item.direccion}</span> */}
                </div>
                <strong className={`text-xs ${index === 0 ? 'text-primary-800' : 'text-slate-800'}`}>
                  ${item.precio}
                </strong>
              </div>
            ))
          ) : (
            <Link 
              href="/ubicacion"
              className="text-[10px] text-center text-primary-500 font-semibold py-1 hover:underline"
            >
              📍 Configurá tu ubicación para ver precios
            </Link>
          )}
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