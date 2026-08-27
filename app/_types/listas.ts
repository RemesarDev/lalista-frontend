// Opción de producto dentro de un grupo (principal o alternativa)
export interface OpcionProducto {
  id: string;               // ID único del producto (del SEPA / Supabase)
  nombre: string;           // Nombre/descripción del producto
  url_imagen?: string | null;
  esPrincipal?: boolean;    // true para el producto base, false para alternativas
}

// Representación para persistencia/API (Supabase)
export interface ItemLista {
  grupoId: string;  // 👈 era itemId
  cantidad: number;
  comprado: boolean;
  opciones: OpcionProducto[];
}

export interface ListaCompras {
  id: string;
  nombre: string;
  ownerId: string;
  createdAt: string;
  rol: 'owner' | 'editor' | 'viewer';
}