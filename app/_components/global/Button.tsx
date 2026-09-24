'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

// Consolida los ~70 <button> con clases tipeadas a mano que había repartidos
// por login, signup, comparativa, mis-listas, etc. Los shapes (primary,
// secondary, destructive) eran ya el mismo botón con rounded-xl/2xl y
// py-2.5/py-3 mezclados sin querer. El radio xl se eligió porque ya lo usa
// DesktopActionButton.tsx, el único componente compartido que existía.

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success' | 'ghost';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  ghost: 'text-slate-400 hover:text-slate-600',
};

// Los 4 variants "sólidos" comparten forma (radio, padding). Ghost es más
// chico porque hoy se usa para íconos sueltos (cerrar modal, editar, etc.),
// no para acciones principales.
const solidShape = 'gap-2 rounded-xl px-4 py-2.5';
const ghostShape = 'gap-1 rounded-lg p-1.5';

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const shapeClasses = variant === 'ghost' ? ghostShape : solidShape;

  const finalClasses = [
    'inline-flex items-center justify-center text-sm font-semibold transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    shapeClasses,
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={finalClasses} {...rest}>
      {children}
    </button>
  );
}
