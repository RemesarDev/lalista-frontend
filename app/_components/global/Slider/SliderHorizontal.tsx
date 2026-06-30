'use client';
import BaseSlider from './BaseSlider';

interface Props {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  isFocused?: boolean;
}

export default function SliderHorizontal({ value, min, max, step, onChange, isFocused }: Props) {
  return (
    <BaseSlider value={value} min={min} max={max} step={step} onChange={onChange}>
      {({ trackRef, handleMouseDown, pct }) => (
        <div className={`flex items-center gap-3 transition-opacity duration-300 ${isFocused ? 'opacity-30' : 'opacity-100'}`}>
          {/* El Track Horizontal */}
          <div
            ref={trackRef}
            className="relative w-32 h-2 rounded-full bg-slate-200 cursor-pointer touch-none"
            onMouseDown={handleMouseDown}
          >
            {/* Barra de progreso */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-slate-700"
              style={{ width: `${pct}%` }}
            />
            {/* El "thumb" o bolita */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-md"
              style={{ left: `calc(${pct}% - 8px)` }}
            />
          </div>

          {/* Etiqueta de valor */}
          <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[40px] text-center">
            {value.toFixed(0)} km
          </div>
        </div>
      )}
    </BaseSlider>
  );
}