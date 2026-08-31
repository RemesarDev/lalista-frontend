'use client';

import Link from 'next/link';
import { useCategorias } from '@/app/_hooks/useCategorias';

// Accesos rapidos del home. Se eligen a mano y no por volumen de productos:
// ordenar por cantidad pondria Indumentaria y Bazar primero (6.014 y 5.245
// productos), que no es lo que alguien busca al abrir una app de canasta.
const DESTACADAS = [
  'almacen',
  'lacteos',
  'bebidas-sin-alcohol',
  'panaderia',
  'carniceria',
  'verduleria',
  'limpieza',
  'higiene-personal',
];

export default function CategoriaChips() {
  const { rubros, cargando } = useCategorias();

  if (cargando || rubros.length === 0) return null;

  // Aplanamos el arbol y nos quedamos con las destacadas, respetando el orden
  // de la constante y no el de la base.
  const todas = rubros.flatMap((rubro) => [rubro, ...rubro.categorias]);
  const chips = DESTACADAS.map((slug) => todas.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  if (chips.length === 0) return null;

  return (
    <div className="w-full max-w-sm">
      <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-slate-400">
        O explorá por categoría
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {chips.map((cat) => (
          <Link
            key={cat.slug}
            href={`/buscar?categoria=${encodeURIComponent(cat.slug)}`}
            className="rounded-full border border-accent-300 bg-white px-3 py-1.5 font-display text-xs font-bold text-slate-600 shadow-sm transition hover:border-primary-400 hover:text-primary-500 active:scale-95"
          >
            {cat.nombre}
          </Link>
        ))}
      </div>
    </div>
  );
}
