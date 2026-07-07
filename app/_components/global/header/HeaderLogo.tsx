'use client';

import Link from 'next/link';
import NextImage from 'next/image';

export default function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-1 shrink-0">
      <NextImage 
        src="/img/lalista-logo.png" 
        alt="Logo de LaLista" 
        width={90} 
        height={90} 
        className="w-22 md:w-24 h-auto" 
        priority // Recomendado para logos en el header
      />
    </Link>
  );
}