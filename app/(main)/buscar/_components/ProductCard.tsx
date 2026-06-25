import { PlusIcon, MinusIcon, ShoppingBagIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { Producto } from '../_types';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  producto: Producto;
  onAgregar: (producto:Producto, cantidad: number) => void;
}

const formatearNombreProducto = (texto: string): string => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const ProductCard = ({ producto, onAgregar }: Props) => {
  const [cantidad, setCantidad] = useState(0);

  const [errorImagen, setErrorImagen] = useState(false);

  const handleUpdate = (nuevaCantidad: number) => {
    if (nuevaCantidad < 0) return;
    setCantidad(nuevaCantidad);
    onAgregar(producto, nuevaCantidad);
  };

  const sucursalesUnicasPorTipo = producto.sucursales.filter((sucursal, index, self) =>
    index === self.findIndex((s) => 
      s.id_comercio === sucursal.id_comercio && s.id_bandera === sucursal.id_bandera
    )
  );
  
  const mostrarImagenReal = producto.url_imagen && !errorImagen;

  return (
    <div className="bg-white border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between shadow-xs h-full">
      <div>
        {/* Contenedor de Imagen Consistente y Adaptativo */}
        <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-semibold mb-2 relative overflow-hidden">
          {mostrarImagenReal ? (
            <Image
              src={producto.url_imagen!} // URL real de VTEX provista por tu base de datos
              alt={producto.nombre}
              fill // Ocupa dinámicamente todo el contenedor h-24
              sizes="(max-width: 768px) 100px, 150px"
              className="object-contain p-1.5 transition-opacity duration-300" // object-contain evita que el producto se deforme
              onError={() => setErrorImagen(true)} // Si el link se rompe, conmuta al placeholder limpio
              unoptimized={false} // Next.js la convierte automáticamente a WebP/AVIF súper ligero
            />
          ) : (
            // 🧱 Placeholder elegante si no hay imagen en DB o si el enlace falló
            <div className="flex flex-col items-center gap-1 text-slate-400 select-none">
              <ShoppingBagIcon size={20} weight="thin" />
              <span className="text-[9px] opacity-70">
                {formatearNombreProducto(producto.nombre).slice(0, 12)}...
              </span>
            </div>
          )}
        </div>
        
        <h3 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
          {formatearNombreProducto(producto.nombre)}
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
                  ${formatearPrecio(item.precio)}
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