export interface ItemLista {
  itemId: string;
  idProducto: string;
  descripcion: string;
  imagen: string | null;
  cantidad: number;
  isChecked: boolean;
}

export interface ListaCompras {
  id: string;
  nombre: string;
  ownerId: string;
  createdAt: string;
  rol: 'owner' | 'editor' | 'viewer';
}