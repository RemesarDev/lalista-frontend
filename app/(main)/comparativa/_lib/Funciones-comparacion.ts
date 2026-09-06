import type { GrupoLista, SucursalBusqueda, ProductoOpcion } from '@/app/_store/store';

export interface ProductoEnSucursal {
  id: string; // ID del producto individual seleccionado como el más conveniente en la sucursal
  nombre: string;
  precio: number | null;
  disponible: boolean;
  grupoId: string; // ID del grupo disyuntivo al que pertenece
  cantidad: number; // Cantidad solicitada para el grupo
}

export interface SucursalCarritoComparada extends SucursalBusqueda {
  total: number;
  productos: ProductoEnSucursal[];
  productosDisponibles: number; // Grupos cubiertos con al menos una opción
  productosFaltantes: number;   // Grupos sin ninguna opción disponible
}

export const obtenerSucursalesMasBaratasPorCadena = (
  producto: ProductoOpcion,
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
  gruposLista: GrupoLista[],
): SucursalCarritoComparada[] => {
  const mapaSucursales = new Map<string, SucursalCarritoComparada>();

  // 1. Identificar todas las sucursales únicas presentes en cualquier opción de cualquier grupo
  for (const grupo of gruposLista) {
    if (!grupo || !Array.isArray(grupo.opciones)) continue;

    for (const opcion of grupo.opciones) {
      if (!Array.isArray(opcion.sucursales)) continue;

      for (const sucursal of opcion.sucursales) {
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
      }
    }
  }

  // 2. Para cada sucursal registrada, evaluamos cada GrupoLista
  for (const [claveSucursal, sucursalData] of mapaSucursales.entries()) {
    let totalSucursal = 0;

    for (const grupo of gruposLista) {
      let mejorOpcionEnSucursal: { opcion: ProductoOpcion; precio: number } | null = null;

      // Buscar la opción más barata del grupo disponible en esta sucursal específica
      for (const opcion of grupo.opciones) {
        if (!Array.isArray(opcion.sucursales)) continue;

        const sucursalItem = opcion.sucursales.find(
          (s) => `${s.id_comercio}-${s.id_bandera}` === claveSucursal
        );

        if (sucursalItem && sucursalItem.precio != null) {
          if (!mejorOpcionEnSucursal || sucursalItem.precio < mejorOpcionEnSucursal.precio) {
            mejorOpcionEnSucursal = {
              opcion,
              precio: sucursalItem.precio,
            };
          }
        }
      }

      if (mejorOpcionEnSucursal) {
        const costoGrupo = mejorOpcionEnSucursal.precio * (grupo.cantidad || 1);
        totalSucursal += costoGrupo;

        sucursalData.productos.push({
          id: mejorOpcionEnSucursal.opcion.id,
          nombre: mejorOpcionEnSucursal.opcion.nombre,
          precio: mejorOpcionEnSucursal.precio,
          disponible: true,
          grupoId: grupo.grupoId,
          cantidad: grupo.cantidad,
        });
        sucursalData.productosDisponibles += 1;
      } else {
        // Ninguna de las opciones disyuntivas del grupo está disponible en esta sucursal
        const opcionPrincipal = grupo.opciones[0];
        sucursalData.productos.push({
          id: opcionPrincipal?.id ?? grupo.grupoId,
          nombre: opcionPrincipal?.nombre ?? 'Producto no disponible',
          precio: null,
          disponible: false,
          grupoId: grupo.grupoId,
          cantidad: grupo.cantidad,
        });
        sucursalData.productosFaltantes += 1;
      }
    }

    sucursalData.total = totalSucursal;
  }

  return Array.from(mapaSucursales.values())
    .filter((sucursal) => sucursal.productosDisponibles > 0)
    .sort((a, b) => {
      const diferenciaCantidad = b.productosDisponibles - a.productosDisponibles;
      if (diferenciaCantidad !== 0) return diferenciaCantidad;

      return a.total - b.total;
    });
};

export const obtenerTopTresCadenasMasBaratas = (
  gruposLista: GrupoLista[],
): SucursalCarritoComparada[] => {
  const mejoresSucursalesPorCadena = new Map<number, SucursalCarritoComparada>();

  for (const sucursal of calcularTotalesPorSucursal(gruposLista)) {
    const sucursalActual = mejoresSucursalesPorCadena.get(sucursal.id_bandera);

    if (!sucursalActual || sucursal.productosDisponibles > sucursalActual.productosDisponibles) {
      mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    } else if (sucursal.productosDisponibles === sucursalActual.productosDisponibles) {
      if (sucursal.total < sucursalActual.total) {
        mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
      }
    }
  }

  return Array.from(mejoresSucursalesPorCadena.values())
    .sort((a, b) => {
      const dispA = a.productosDisponibles || 0;
      const dispB = b.productosDisponibles || 0;

      if (dispB !== dispA) return dispB - dispA;

      return a.total - b.total;
    })
    .slice(0, 3);
};