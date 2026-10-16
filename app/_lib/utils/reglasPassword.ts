// Reglas de contraseña compartidas por el registro (validarRegistro.ts) y el
// reset (restablecer-contrasena). Sin Zod a propósito: el frontend no carga la
// librería (solo la usa el servidor, en app/api).
export type ReglasPassword = {
    length: boolean;
    upper: boolean;
    number: boolean;
};

export const PASSWORD_MIN = 8;
// Mismo tope que Better Auth (maxPasswordLength). Evita hashear payloads
// gigantes con scrypt.
export const PASSWORD_MAX = 128;

export function evaluarReglasPassword(password: string): ReglasPassword {
    return {
        length: password.length >= PASSWORD_MIN,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
    };
}

/**
 * Version para el servidor (hook de Better Auth). Antes estas reglas solo se
 * chequeaban en el formulario: un POST directo a /api/auth/sign-up/email o
 * /api/auth/reset-password con "aaaaaaaa" pasaba, porque Better Auth por si
 * solo valida nada mas que el largo. Devuelve null si la clave es valida.
 */
export function motivoPasswordInvalida(password: unknown): string | null {
    if (typeof password !== "string") return "La contraseña es obligatoria";
    if (password.length > PASSWORD_MAX) return `La contraseña no puede superar los ${PASSWORD_MAX} caracteres`;
    const reglas = evaluarReglasPassword(password);
    if (!reglas.length || !reglas.upper || !reglas.number) {
        return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres, una mayúscula y un número`;
    }
    return null;
}
