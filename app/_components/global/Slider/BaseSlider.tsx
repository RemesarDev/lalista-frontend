'use client';
import { useRef, useCallback, useEffect } from 'react';

interface BaseSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  // Recibimos un render prop o children para que la variante defina cómo se ve
  children: (props: {
    trackRef: React.RefObject<HTMLDivElement | null>;
    handleMouseDown: (e: React.MouseEvent) => void;
    pct: number;
  }) => React.ReactNode;
}

export default function BaseSlider({ value, min, max, step, onChange, children }: BaseSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const calcularValor = useCallback((clientX: number, clientY: number) => {
    if (!trackRef.current) return undefined;
    const rect = trackRef.current.getBoundingClientRect();
    
    // Calculamos si es vertical u horizontal basado en el tamaño del rect
    const isHorizontal = rect.width > rect.height;
    const ratio = isHorizontal 
      ? (clientX - rect.left) / rect.width 
      : 1 - (clientY - rect.top) / rect.height;

    const clamped = Math.max(0, Math.min(1, ratio));
    const raw = min + clamped * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, parseFloat(snapped.toFixed(1))));
  }, [min, max, step]);

  // Manejador de eventos compartidos
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const onMove = (ev: MouseEvent) => {
      const val = calcularValor(ev.clientX, ev.clientY);
      if (val !== undefined) onChangeRef.current(val);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    
    const val = calcularValor(e.clientX, e.clientY);
    if (val !== undefined) onChangeRef.current(val);
  }, [calcularValor]);

  // Soporte táctil
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const val = calcularValor(e.touches[0].clientX, e.touches[0].clientY);
      if (val !== undefined) onChangeRef.current(val);
    };

    track.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => track.removeEventListener('touchmove', handleTouchMove);
  }, [calcularValor]);

  const pct = ((value - min) / (max - min)) * 100;

  return children({ trackRef, handleMouseDown, pct });
}