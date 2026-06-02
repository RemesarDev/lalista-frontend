export interface Producto {
  id: string; 
  nombre: string;
  precios: { 
    nombre: string; 
    precio: number 
  }[];
  precioMin: number;
  superMasBarato: string;
}