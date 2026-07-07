'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export type ButtonColor = 'lila' | 'naranja' | 'rojo' | 'verde';
export type ButtonVariant = 'solid' | 'outline';

interface DesktopActionButtonProps {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: ReactNode;
  color?: ButtonColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

const colorStyles: Record<ButtonColor, Record<ButtonVariant, string>> = {
  lila: {
    solid: 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm',
    outline: 'border border-primary-200 bg-white text-primary-600 hover:bg-primary-50',
  },
  naranja: {
    solid: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
    outline: 'border border-orange-200 bg-white text-orange-600 hover:bg-orange-50',
  },
  rojo: {
    solid: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    outline: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  },
  verde: {
    solid: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    outline: 'border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50',
  },
};

export function DesktopActionButton({
  href,
  onClick,
  label,
  icon,
  color = 'lila',
  variant = 'solid',
  disabled = false,
  className = '',
}: DesktopActionButtonProps) {
  const hasExplicitDisplayClass = /\b(hidden|inline-flex|flex|inline-block|block|grid)\b/.test(className);

  const baseClasses = `${hasExplicitDisplayClass ? '' : 'inline-flex'} h-9 items-center justify-center gap-2 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] shrink-0`;
  const variantClasses = colorStyles[color][variant];
  const disabledClasses = 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none opacity-60 active:scale-100';

  const finalClasses = `${baseClasses} ${disabled ? disabledClasses : variantClasses} ${className}`.trim();

  const renderContent = () => (
    <>
      <span className="text-sm sm:text-base leading-none flex items-center">{icon}</span>
      <span className="truncate">{label}</span>
    </>
  );

  if (disabled) {
    return <span aria-disabled="true" className={finalClasses}>{renderContent()}</span>;
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={finalClasses}>
        {renderContent()}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={finalClasses}>
        {renderContent()}
      </Link>
    );
  }

  return null;
}