export interface Sucursal {
  cadena: string;
  direccion: string;
  precio: number;
  id_comercio: number;
  id_bandera: number;
  distancia?: number | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface Producto {
  id: string;
  nombre: string;
  precioMinimo: number | null;
  sucursales: Sucursal[];
  url_imagen: string | null;
}

export interface BusquedaResponse {
  productos: Producto[];
}

/** Una categoria del arbol (hoja o rubro). */
export interface CategoriaNodo {
  slug: string;
  nombre: string;
  orden: number;
  es_canasta: boolean;
}

/** Un rubro con sus categorias hijas. Mascotas, por ejemplo, no tiene. */
export interface CategoriaArbol extends CategoriaNodo {
  categorias: CategoriaNodo[];
}

/**
 * Etiqueta dietaria con la cantidad de productos que la declaran en su
 * descripcion. No incluye las inferidas por IA.
 */
export interface EtiquetaDisponible {
  codigo: string;
  nombre: string;
  productos: number;
}

/**
 * Ficha completa de un producto para el modal de detalle.
 * Todo sale de la base: los datos del SEPA mas la clasificacion propia.
 */
export interface DetalleProducto {
  id_producto: string;
  nombre: string;
  marca: string | null;
  cantidad: number | null;
  unidad: string | null;
  /** Contenido listo para mostrar: "500 g", "1,5 L". Null si no se conoce. */
  presentacion: string | null;
  url_imagen: string | null;
  categoria: string | null;
  categoria_slug: string | null;
  rubro: string | null;
  rubro_slug: string | null;
  /** Solo las declaradas en la descripcion, no las inferidas por IA. */
  etiquetas: { codigo: string; nombre: string }[];
}
