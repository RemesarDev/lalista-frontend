import { useState } from 'react';
import { Producto } from '../_types';

export const useBusqueda = () => {
  // Simulamos carga de datos inicial
  const [productos] = useState<Producto[]>([
    { id: 1, nombre: "Yerba Mate Playadito 1kg", precioMin: 3400, superMasBarato: "Carrefour" },
    { id: 2, nombre: "Leche Entera La Serenísima 1L", precioMin: 1200, superMasBarato: "Día%" },
    // ... resto de tus productos
  ]);

  const agregarAlCarrito = (id: number, nombre: string) => {
    console.log(`Producto agregado a LALIsta: ${nombre} (ID: ${id})`);
    // Aquí implementaremos la lógica de LocalStorage o State Global
  };

  return { productos, agregarAlCarrito };
};