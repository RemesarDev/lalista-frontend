import type { GrupoLista, SucursalBusqueda, ProductoOpcion } from '@/app/_store/store';

export type CriterioComparacion = 'mas_barata' | 'producto_preferido' | 'mas_cercana';

export interface ProductoEnSucursal {
  id: string;
  nombre: string;
  precio: number | null;
  disponible: boolean;
  grupoId: string;
  cantidad: number;
}

export interface SucursalCarritoComparada extends SucursalBusqueda {
  total: number;
  productos: ProductoEnSucursal[];
  productosDisponibles: number;
  productosFaltantes: number;
}

export interface EvaluacionOpcion {
  opcion: ProductoOpcion;
  precioUnitario: number;
  costoTotalGrupo: number;
  cantidadTotal: number;
}

export const calcularTotalesPorSucursal = (
  gruposLista: GrupoLista[],
  criterio: CriterioComparacion = 'mas_barata'
): SucursalCarritoComparada[] => {
  const mapaSucursales = new Map<string, SucursalCarritoComparada>();

  // 1. Identificar todas las sucursales únicas
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

  // 2. Evaluar cada sucursal registrada
  for (const [claveSucursal, sucursalData] of mapaSucursales.entries()) {
    let totalSucursal = 0;

    for (const grupo of gruposLista) {
      let mejorOpcionEnSucursal: EvaluacionOpcion | null = null;

      const opcionesAEvaluar =
        criterio === 'producto_preferido'
          ? [grupo.opciones[0]].filter(Boolean)
          : grupo.opciones;

      const evaluarOpciones = (listaOpciones: ProductoOpcion[]) => {
        for (const opcion of listaOpciones) {
          if (!Array.isArray(opcion.sucursales)) continue;

          const sucursalItem = opcion.sucursales.find(
            (s) => `${s.id_comercio}-${s.id_bandera}` === claveSucursal
          );

          if (sucursalItem && sucursalItem.precio != null) {
            const cantidadOpcion = opcion.cantidadOpcion || 1;
            const cantidadTotal = (grupo.cantidad || 1) * cantidadOpcion;
            const costoTotalGrupo = sucursalItem.precio * cantidadTotal;

            if (
              !mejorOpcionEnSucursal ||
              costoTotalGrupo < mejorOpcionEnSucursal.costoTotalGrupo
            ) {
              mejorOpcionEnSucursal = {
                opcion,
                precioUnitario: sucursalItem.precio,
                costoTotalGrupo,
                cantidadTotal,
              };
            }
          }
        }
      };

      evaluarOpciones(opcionesAEvaluar);

      if (!mejorOpcionEnSucursal && criterio === 'producto_preferido' && grupo.opciones.length > 1) {
        evaluarOpciones(grupo.opciones.slice(1));
      }

      if (mejorOpcionEnSucursal) {
        const evaluado: EvaluacionOpcion = mejorOpcionEnSucursal;
        totalSucursal += evaluado.costoTotalGrupo;

        sucursalData.productos.push({
          id: evaluado.opcion.id,
          nombre: evaluado.opcion.nombre,
          precio: evaluado.precioUnitario,
          disponible: true,
          grupoId: grupo.grupoId,
          cantidad: evaluado.cantidadTotal,
        });
        sucursalData.productosDisponibles += 1;
      } else {
        const opcionPrincipal = grupo.opciones[0];
        const cantidadOpcionPrincipal = opcionPrincipal?.cantidadOpcion ?? 1;
        const cantidadTotal = (grupo.cantidad || 1) * cantidadOpcionPrincipal;

        sucursalData.productos.push({
          id: opcionPrincipal?.id ?? grupo.grupoId,
          nombre: opcionPrincipal?.nombre ?? 'Producto no disponible',
          precio: null,
          disponible: false,
          grupoId: grupo.grupoId,
          cantidad: cantidadTotal,
        });
        sucursalData.productosFaltantes += 1;
      }
    }

    sucursalData.total = totalSucursal;
  }

  return Array.from(mapaSucursales.values())
    .filter((sucursal) => sucursal.productosDisponibles > 0)
    .sort((a, b) => {
      // Prioridad 1: Cobertura de productos
      const diferenciaCantidad = b.productosDisponibles - a.productosDisponibles;
      if (diferenciaCantidad !== 0) return diferenciaCantidad;

      // Prioridad 2: Ordenar según el criterio del usuario
      if (criterio === 'mas_cercana') {
        const distA = a.distancia ?? Infinity;
        const distB = b.distancia ?? Infinity;
        if (distA !== distB) return distA - distB;
      }

      // Fallback/Por defecto: Menor precio total
      return a.total - b.total;
    });
};

export const obtenerTopTresCadenasMasBaratas = (
  gruposLista: GrupoLista[],
  criterio: CriterioComparacion = 'mas_barata'
): SucursalCarritoComparada[] => {
  const mejoresSucursalesPorCadena = new Map<number, SucursalCarritoComparada>();

  for (const sucursal of calcularTotalesPorSucursal(gruposLista, criterio)) {
    const sucursalActual = mejoresSucursalesPorCadena.get(sucursal.id_bandera);

    if (!sucursalActual || sucursal.productosDisponibles > sucursalActual.productosDisponibles) {
      mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
    } else if (sucursal.productosDisponibles === sucursalActual.productosDisponibles) {
      if (criterio === 'mas_cercana') {
        const distNueva = sucursal.distancia ?? Infinity;
        const distActual = sucursalActual.distancia ?? Infinity;
        if (distNueva < distActual) {
          mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
        }
      } else if (sucursal.total < sucursalActual.total) {
        mejoresSucursalesPorCadena.set(sucursal.id_bandera, sucursal);
      }
    }
  }

  return Array.from(mejoresSucursalesPorCadena.values())
    .sort((a, b) => {
      const dispA = a.productosDisponibles || 0;
      const dispB = b.productosDisponibles || 0;

      if (dispB !== dispA) return dispB - dispA;

      if (criterio === 'mas_cercana') {
        const distA = a.distancia ?? Infinity;
        const distB = b.distancia ?? Infinity;
        if (distA !== distB) return distA - distB;
      }

      return a.total - b.total;
    })
    .slice(0, 3);
};