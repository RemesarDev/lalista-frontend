'use client';

interface ToggleSerieProps {
  label: string;
  color: string;
  activo: boolean;
  onToggle: () => void;
}

/** Botón "pill" para mostrar/ocultar una serie del gráfico. Ambos toggles son
 * independientes: se puede ver una sola línea, la otra, o las dos juntas. */
export function ToggleSerie({ label, color, activo, onToggle }: ToggleSerieProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={activo}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-[0.97] ${
        activo
          ? 'border-transparent text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
      }`}
      style={activo ? { backgroundColor: color } : undefined}
    >
      <span
        className={`h-2 w-2 rounded-full ${activo ? 'bg-white/80' : ''}`}
        style={!activo ? { backgroundColor: color, opacity: 0.5 } : undefined}
        aria-hidden
      />
      {label}
    </button>
  );
}
