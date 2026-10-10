import { evaluarReglasPassword } from "./reglasPassword";

// Validacion del formulario de registro, sin Zod: son tres chequeos y Zod
// pesaba ~87 KB comprimido en el navegador solo para esto. El email es un
// chequeo de forma basico; Better Auth lo vuelve a validar en el servidor.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarFormulario(datos: Record<string, string>) {
    const nombre = datos.nombre ?? "";
    const email = datos.email ?? "";
    const reglasPassword = evaluarReglasPassword(datos.password ?? "");

    const erroresCampos: Record<string, string[]> = {};
    if (nombre.length < 2) erroresCampos.nombre = ["El nombre debe tener al menos 2 caracteres"];
    if (!EMAIL_REGEX.test(email)) erroresCampos.email = ["El formato del correo es inválido"];

    const passwordValida = Object.values(reglasPassword).every(Boolean);

    return {
        exito: Object.keys(erroresCampos).length === 0 && passwordValida,
        erroresCampos,
        reglasPassword,
    };
}
