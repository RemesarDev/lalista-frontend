import type { ProductoBusqueda, SucursalBusqueda, ProductoLista } from '@/app/_store/store';

export interface ProductoEnSucursal {
  id: string;
  nombre: string;
  precio: number | null;
  disponible: boolean;
}

export interface SucursalCarritoComparada extends SucursalBusqueda {
  total: number | null;
  productos: ProductoEnSucursal[];
  productosDisponibles: number;
  productosFaltantes: number;
}

export const obtenerSucursalesMasBaratasPorCadena = (
  producto: ProductoBusqueda,
): SucursalBusqueda[] => {
  const sucursalesPorCadena = new Map<number, SucursalBusqueda>();

  if (!producto || !Array.isArray(producto.sucursales)) return [];

  for (const sucursal of producto.sucursales) {
    const sucursalActual = sucursalesPorCadena.get(sucursal.id_bandera);

    if (!sucursalActual || sucursal.precio < sucursalActual.precio) {
      sucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    }
  }

  return Array.from(sucursalesPorCadena.values()).sort((a, b) => a.precio - b.precio);
};

export const calcularTotalesPorSucursal = (
  productosLista: ProductoLista[],
): SucursalCarritoComparada[] => {
  const mapaSucursales = new Map<string, SucursalCarritoComparada>();

  for (const producto of productosLista) {
    if (!producto || !Array.isArray(producto.sucursales)) continue;

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
      const yaProcesado = sucursalData.productos.some(p => p.id === producto.id);
      
      if (!yaProcesado) {
        // 🛡️ CORRECCIÓN 1: Solo sumamos si el total no fue anulado previamente por un faltante
        if (sucursalData.total !== null) {
          sucursalData.total += sucursal.precio * (producto.cantidad || 1);
        }
        
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

  for (const sucursal of mapaSucursales.values()) {
    const productosEnSucursal = new Set(sucursal.productos.map((p) => p.id));
    
    for (const producto of productosLista) {
      if (!productosEnSucursal.has(producto.id)) {
        sucursal.productos.push({
          id: producto.id,
          nombre: producto.nombre,
          precio: null,
          disponible: false,
        });
        sucursal.productosFaltantes += 1;
        sucursal.total = null; // Anula el total permanentemente para esta sucursal
      }
    }
  }

  return Array.from(mapaSucursales.values())
    .filter((sucursal) => sucursal.productosDisponibles > 0)
    .sort((a, b) => {
      const diferenciaCantidad = b.productosDisponibles - a.productosDisponibles;
      if (diferenciaCantidad !== 0) return diferenciaCantidad; 

      // 🛡️ CORRECCIÓN 2: Control seguro de ordenamiento cuando 'total' puede ser null
      const precioA = a.total ?? Infinity;
      const precioB = b.total ?? Infinity;
      return precioA - precioB;
    });
};

export const obtenerTopTresCadenasMasBaratas = (
  productosLista: ProductoLista[],
): SucursalCarritoComparada[] => {
  const mejoresSucursalesPorCadena = new Map<number, SucursalCarritoComparada>();

  for (const sucursal of calcularTotalesPorSucursal(productosLista)) {
    const sucursalActual = mejoresSucursalesPorCadena.get(sucursal.id_bandera);

    if (!sucursalActual || sucursal.productosDisponibles > sucursalActual.productosDisponibles) {
      mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    } 
    else if (sucursal.productosDisponibles === sucursalActual.productosDisponibles) {
      // 🛡️ CORRECCIÓN 3: Comparación segura usando Infinity si el total es null
      const totalNuevo = sucursal.total ?? Infinity;
      const totalExistente = sucursalActual.total ?? Infinity;
      
      if (totalNuevo < totalExistente) {
        mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
      }
    }
  }

  return Array.from(mejoresSucursalesPorCadena.values())
    .sort((a, b) => {
      const dispA = a.productosDisponibles || 0;
      const dispB = b.productosDisponibles || 0;

      if (dispB !== dispA) return dispB - dispA;
      
      // 🛡️ CORRECCIÓN 4: Fallback seguro para el ordenamiento del top 3 final
      const totalA = a.total ?? Infinity;
      const totalB = b.total ?? Infinity;
      return totalA - totalB;
    }).slice(0, 3);
};