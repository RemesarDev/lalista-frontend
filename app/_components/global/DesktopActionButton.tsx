'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface DesktopActionButtonProps {
  href: string;
  label: string;
  icon: ReactNode;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
}

export function DesktopActionButton({ href, label, icon, variant = 'solid', disabled = false }: DesktopActionButtonProps) {
  const baseClasses = 'hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all';
  const variantClasses =
    variant === 'outline'
      ? 'border border-primary-200 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-600'
      : 'bg-primary-400 text-white hover:bg-primary-500 shadow-sm';

  const disabledClasses = 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none';

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${baseClasses} ${disabledClasses}`}>
        <span className="text-base leading-none">{icon}</span>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses} active:scale-[0.98]`}>
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}