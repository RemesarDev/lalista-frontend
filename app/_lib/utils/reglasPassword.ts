// Reglas de contraseña compartidas por el registro (validarRegistro.ts) y el
// reset (restablecer-contrasena). Sin Zod a propósito: son tres chequeos y así
// el formulario de reset no carga la librería.
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
