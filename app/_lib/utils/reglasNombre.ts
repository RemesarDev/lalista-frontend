// Reglas del nombre visible del usuario, compartidas por el registro (cliente)
// y por el hook de Better Auth (servidor, app/_lib/auth-hardening.ts). Sin Zod
// por el mismo motivo que reglasPassword.ts.
//
// Por que tan estricto: el nombre se interpola en los mails de verificacion y
// de reset ("Hola <nombre>,"). Si acepta URLs o numeros, cualquiera puede
// registrar el email de un tercero con un nombre como "Ganaste un premio,
// entra a premio.com" y LALIsta le manda ese texto desde nuestro remitente.
// Tambien se muestra a otros usuarios al compartir listas.

export const NOMBRE_MIN = 2;
export const NOMBRE_MAX = 50;

// Letras de cualquier idioma (con tildes y dieresis), espacios, apostrofe,
// guion y punto. Tiene que empezar con letra.
const NOMBRE_PERMITIDO = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
// Un punto pegado a una letra ("premio.com") es un dominio, no una inicial
// ("J. Perez" lleva espacio despues del punto).
const PARECE_DOMINIO = /\.[\p{L}\p{M}]/u;

export function normalizarNombre(nombre: string): string {
    return nombre.trim().replace(/\s+/g, " ");
}

/** Devuelve null si el nombre es valido, o el motivo si no lo es. */
export function motivoNombreInvalido(nombre: unknown): string | null {
    if (typeof nombre !== "string") return "El nombre es obligatorio";
    const limpio = normalizarNombre(nombre);
    if (limpio.length < NOMBRE_MIN) return `El nombre debe tener al menos ${NOMBRE_MIN} caracteres`;
    if (limpio.length > NOMBRE_MAX) return `El nombre no puede superar los ${NOMBRE_MAX} caracteres`;
    if (!NOMBRE_PERMITIDO.test(limpio) || PARECE_DOMINIO.test(limpio)) {
        return "El nombre solo puede tener letras, espacios, apóstrofes y guiones";
    }
    return null;
}
