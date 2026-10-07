// app/_store/slices/uiSlice.ts
import type { StateCreator } from 'zustand';

export interface UiSlice {
  modalLimite: {
    isOpen: boolean;
    mensaje: string;
    recurso?: string;
  };
  abrirModalLimite: (mensaje: string, recurso?: string) => void;
  cerrarModalLimite: () => void;
}

export const createUiSlice: StateCreator<UiSlice, [], []> = (set) => ({
  modalLimite: { isOpen: false, mensaje: '' },
  abrirModalLimite: (mensaje, recurso) => 
    set({ modalLimite: { isOpen: true, mensaje, recurso } }),
  cerrarModalLimite: () => 
    set({ modalLimite: { isOpen: false, mensaje: '' } }),
});