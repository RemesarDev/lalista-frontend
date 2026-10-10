// Reglas de contraseña compartidas por el registro (validarRegistro.ts) y el
// reset (restablecer-contrasena). Sin Zod a propósito: el frontend no carga la
// librería (solo la usa el servidor, en app/api).
export type ReglasPassword = {
    length: boolean;
    upper: boolean;
    number: boolean;
};

export function evaluarReglasPassword(password: string): ReglasPassword {
    return {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
    };
}
