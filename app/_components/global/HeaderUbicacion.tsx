'use client';

import { useListaStore } from '@/app/_store/store';
import Header from './Header';

export default function HeaderUbicacion() {
  const { ubicacion } = useListaStore();
  return <Header locationName={ubicacion.nombreLugar ?? undefined} />;
}