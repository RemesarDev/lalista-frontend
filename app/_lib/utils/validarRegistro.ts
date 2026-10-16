import { evaluarReglasPassword } from "./reglasPassword";
import { motivoNombreInvalido } from "./reglasNombre";

// Validacion del formulario de registro, sin Zod: son tres chequeos y Zod
// pesaba ~87 KB comprimido en el navegador solo para esto. El email es un
// chequeo de forma basico; Better Auth lo vuelve a validar en el servidor.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarFormulario(datos: Record<string, string>) {
    const nombre = datos.nombre ?? "";
    const email = datos.email ?? "";
    const reglasPassword = evaluarReglasPassword(datos.password ?? "");

    const erroresCampos: Record<string, string[]> = {};
    // Misma regla que aplica el servidor (auth-hardening.ts): si solo la
    // chequeara el servidor, el usuario veria un error generico al final.
    const motivoNombre = motivoNombreInvalido(nombre);
    if (motivoNombre) erroresCampos.nombre = [motivoNombre];
    if (!EMAIL_REGEX.test(email)) erroresCampos.email = ["El formato del correo es inválido"];

    const passwordValida = Object.values(reglasPassword).every(Boolean);

    return {
        exito: Object.keys(erroresCampos).length === 0 && passwordValida,
        erroresCampos,
        reglasPassword,
    };
}
