import type { UsuarioPublico } from '@/app/_types/usuarios';

export interface DbUsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  imagen: string | null;
}

export const mapearUsuarioPublico = (raw: DbUsuarioPublico): UsuarioPublico => ({
  id: raw.id,
  nombre: raw.nombre,
  email: raw.email,
  imagen: raw.imagen,
});