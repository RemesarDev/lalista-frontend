'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface DesktopActionButtonProps {
  href: string;
  label: string;
  icon: ReactNode;
  variant?: 'solid' | 'outline';
}

export function DesktopActionButton({ href, label, icon, variant = 'solid' }: DesktopActionButtonProps) {
  const baseClasses = 'hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]';
  const variantClasses =
    variant === 'outline'
      ? 'border border-primary-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-600'
      : 'bg-primary-400 text-white hover:bg-primary-500 shadow-sm';

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses}`}>
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}