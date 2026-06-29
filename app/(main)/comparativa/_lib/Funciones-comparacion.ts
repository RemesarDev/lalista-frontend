import type { ProductoBusqueda, SucursalBusqueda, ProductoLista } from '@/app/_store/store';

export interface ProductoEnSucursal {
  id: string;
  nombre: string;
  precio: number;
  disponible: boolean;
}

export interface SucursalCarritoComparada extends SucursalBusqueda {
  total: number;
  productos: ProductoEnSucursal[];
  productosDisponibles: number;
  productosFaltantes: number;
}

export const obtenerSucursalesMasBaratasPorCadena = (
  producto: ProductoBusqueda,
): SucursalBusqueda[] => {
  const sucursalesPorCadena = new Map<number, SucursalBusqueda>();

  for (const sucursal of producto.sucursales) {
    const sucursalActual = sucursalesPorCadena.get(sucursal.id_bandera);

    if (!sucursalActual || sucursal.precio < sucursalActual.precio) {
      sucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    }
  }

  return Array.from(sucursalesPorCadena.values()).sort((a, b) => a.precio - b.precio);
};

/**
 * Calcula el total de la lista en cada sucursal
 * Solo suma precios de productos disponibles
 * Marca cuáles productos están faltantes
 */
export const calcularTotalesPorSucursal = (
  productosLista: ProductoLista[],
): SucursalCarritoComparada[] => {
  // Asegúrate de crear el mapa DENTRO de la función
  const mapaSucursales = new Map<string, SucursalCarritoComparada>();

  for (const producto of productosLista) {
    // IMPORTANTE: Verifica si este producto YA fue procesado para esta sucursal 
    // en esta iteración para evitar duplicados
    for (const sucursal of producto.sucursales) {
      const claveSucursal = `${sucursal.id_comercio}-${sucursal.id_bandera}`;
      
      if (!mapaSucursales.has(claveSucursal)) {
        mapaSucursales.set(claveSucursal, {
          ...sucursal,
          total: 0,
          productos: [],
          productosDisponibles: 0,
          productosFaltantes: 0,
        });
      }

      const sucursalData = mapaSucursales.get(claveSucursal)!;

      // EVITAR SUMA DOBLE: Verifica si el producto ya está en el array de productos de esta sucursal
      const yaProcesado = sucursalData.productos.some(p => p.id === producto.id);
      
      if (!yaProcesado) {
        sucursalData.total += sucursal.precio * (producto.cantidad || 1);
        sucursalData.productos.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: sucursal.precio,
          disponible: true,
        });
        sucursalData.productosDisponibles += 1;
      }
    }
  }

  // Ahora marca productos faltantes en cada sucursal
  for (const sucursal of mapaSucursales.values()) {
    const productosEnSucursal = new Set(sucursal.productos.map((p) => p.id));
    
    for (const producto of productosLista) {
      if (!productosEnSucursal.has(producto.id)) {
        sucursal.productos.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: 0,
          disponible: false,
        });
        sucursal.productosFaltantes += 1;
      }
    }
  }

  // Filtra: solo sucursales con AL MENOS UN producto disponible
  return Array.from(mapaSucursales.values())
    .filter((sucursal) => sucursal.productosDisponibles > 0)
    .sort((a, b) => {
    // A: Cantidad de productos encontrados (b.productosDisponibles vs a.productosDisponibles)
    // Usamos B - A para ordenar de MAYOR a MENOR cantidad de productos
    const diferenciaCantidad = b.productosDisponibles - a.productosDisponibles;

    if (diferenciaCantidad !== 0) {
      return diferenciaCantidad; 
    }

    // B: Si la cantidad de productos es la misma, ahí sí ordenamos por PRECIO (menor a mayor)
    return a.total - b.total;
  });
};

/**
 * Obtiene el top 3 de cadenas más baratas
 * Para cada cadena, elige la sucursal con total más bajo
 */
export const obtenerTopTresCadenasMasBaratas = (
  productosLista: ProductoLista[],
): SucursalCarritoComparada[] => {
  const mejoresSucursalesPorCadena = new Map<number, SucursalCarritoComparada>();

  for (const sucursal of calcularTotalesPorSucursal(productosLista)) {
    const sucursalActual = mejoresSucursalesPorCadena.get(sucursal.id_bandera);

    // Si no hay sucursal guardada O la nueva sucursal tiene MÁS productos disponibles:
    if (!sucursalActual || sucursal.productosDisponibles > sucursalActual.productosDisponibles) {
      mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    } 
    // Si tienen la misma cantidad de productos, entonces sí elegimos la más barata:
    else if (sucursal.productosDisponibles === sucursalActual.productosDisponibles && sucursal.total < sucursalActual.total) {
      mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    }
  }

  return Array.from(mejoresSucursalesPorCadena.values())
    .sort((a, b) => {
      const dispA = a.productosDisponibles || 0;
      const dispB = b.productosDisponibles || 0;

      // 1. Prioridad: Disponibilidad
      if (dispB !== dispA) {
        return dispB - dispA;
      }
      
      // 2. Prioridad: Precio
      return a.total - b.total;
    }) .slice(0, 3); // Nos quedamos con el top 3
};
