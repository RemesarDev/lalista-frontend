// src/app/_lib/mappers/productos.ts
import { Producto } from '@/app/_types/productos'; // Tu archivo de tipos
import { formatearNombreProducto } from '@/app/_lib/utils/formatters';

export interface DbProductoRow {
  id_producto: string;
  productos_descripcion: string;
  url_imagen?: string | null;
  productos_precio_lista?: number;
  comercio_bandera_nombre?: string;
  sucursales_calle?: string;
  sucursales_numero?: string;
  id_comercio: number;
  id_bandera: number;
}

export const mapToProductoResponse = (data: DbProductoRow): Producto => ({
  id: data.id_producto,
  nombre: formatearNombreProducto(data.productos_descripcion),
  url_imagen: data.url_imagen ?? null,
  precioMinimo: data.productos_precio_lista ?? 0,
  sucursales: [] // Se llena en el proceso de agrupación del router
});
