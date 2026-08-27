import type { ListaCompras, ItemLista, OpcionProducto } from '@/app/_types/listas';

// ==========================================
// INTERFACES DE DB
// ==========================================
export interface DbLista {
  id: string;
  nombre: string;
  owner_id: string;
  created_at: string;
  rol: 'owner' | 'editor' | 'viewer';
}

// Representación de una fila en la tabla 'lista_items'
export interface DbItemLista {
  item_id: string;        // UUID del grupo/contenedor de la canasta
  id_producto: string;    // ID del producto (SEPA/Supabase)
  descripcion: string;    // Nombre del producto
  imagen: string | null;  // URL de la imagen
  cantidad: number;       // Cantidad deseada para el grupo
  comprado: boolean;      // Estado de chequeo
  es_principal?: boolean; // Opción principal vs alternativa
  created_at?: string;    // Para ordenar alternativas si no existe es_principal
}

// ==========================================
// MAPPERS
// ==========================================
export const mapearLista = (raw: DbLista): ListaCompras => ({
  id: raw.id,
  nombre: raw.nombre,
  ownerId: raw.owner_id,
  createdAt: raw.created_at,
  rol: raw.rol,
});

/**
 * Mapea un grupo de filas de DB (que comparten el mismo item_id)
 * hacia una única estructura `ItemLista` con sus opciones disyuntivas.
 */
export const mapearGrupoItemsLista = (rawItems: DbItemLista[]): ItemLista => {
  if (!rawItems.length) {
    throw new Error("No se pueden mapear ítems vacíos");
  }

  const itemsOrdenados = [...rawItems].sort((a, b) => {
    if (a.es_principal) return -1;
    if (b.es_principal) return 1;
    return 0;
  });

  const base = itemsOrdenados[0];

  const opciones: OpcionProducto[] = itemsOrdenados.map((item, idx) => ({
    id: item.id_producto,
    nombre: item.descripcion,
    url_imagen: item.imagen,
    esPrincipal: item.es_principal ?? idx === 0,
  }));

  return {
    itemId: base.item_id,
    cantidad: base.cantidad,
    comprado: base.comprado,
    opciones,
  };
};

/**
 * Transforma un ItemLista (Frontend) a un arreglo de objetos listos
 * para persistir o hacer UPSERT en Supabase.
 */
export const mapearItemListaADb = (item: ItemLista): DbItemLista[] => {
  return item.opciones.map((opcion) => ({
    item_id: item.itemId,
    id_producto: opcion.id,
    descripcion: opcion.nombre,
    imagen: opcion.url_imagen ?? null,
    cantidad: item.cantidad,
    comprado: item.comprado,
    es_principal: opcion.esPrincipal ?? false,
  }));
};