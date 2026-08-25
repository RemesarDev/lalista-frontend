import type { ListaCompras, ItemLista } from '@/app/_types/listas';

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

export interface DbItemLista {
  item_id: string;
  id_producto: string;
  descripcion: string;
  imagen: string | null;
  cantidad: number;
  is_checked: boolean;
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

export const mapearItemLista = (raw: DbItemLista): ItemLista => ({
  itemId: raw.item_id,
  idProducto: raw.id_producto,
  descripcion: raw.descripcion,
  imagen: raw.imagen,
  cantidad: raw.cantidad,
  isChecked: raw.is_checked,
});