'use client';
import { useRef, useCallback, useEffect } from 'react';

interface SliderVerticalProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  isFocused: boolean;
}

export default function SliderVertical({ value, min, max, step, onChange, isFocused }: SliderVerticalProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const calcularValor = useCallback((clientY: number) => {
    if (!trackRef.current) return undefined;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = 1 - (clientY - rect.top) / rect.height;
    const clamped = Math.max(0, Math.min(1, ratio));
    const raw = min + clamped * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, parseFloat(snapped.toFixed(1))));
  }, [min, max, step]);

  // Registramos el listener con passive: false directamente en el DOM
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // ahora sí funciona
      const rect = track.getBoundingClientRect();
      const ratio = 1 - (e.touches[0].clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, ratio));
      const raw = min + clamped * (max - min);
      const snapped = Math.round(raw / step) * step;
      const val = Math.max(min, Math.min(max, parseFloat(snapped.toFixed(1))));
      onChangeRef.current(val);
    };

    track.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => track.removeEventListener('touchmove', handleTouchMove);
  }, [min, max, step]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const onMove = (ev: MouseEvent) => {
      const val = calcularValor(ev.clientY);
      if (val !== undefined) onChangeRef.current(val);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    const val = calcularValor(e.clientY);
    if (val !== undefined) onChangeRef.current(val);
  }, [calcularValor]);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      className={`absolute right-2 top-[32%] z-20 flex flex-col items-center gap-1 transition-all duration-300 select-none
        ${isFocused ? 'opacity-10 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
        {value.toFixed(1)} km
      </div>

      <div
        ref={trackRef}
        className="relative w-2 h-36 rounded-full bg-slate-300 cursor-pointer"
        onMouseDown={handleMouseDown}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full bg-slate-700"
          style={{ height: `${pct}%` }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-lg"
          style={{ bottom: `calc(${pct}% - 10px)`, touchAction: 'none' }}
        />
      </div>
    </div>
  );
}