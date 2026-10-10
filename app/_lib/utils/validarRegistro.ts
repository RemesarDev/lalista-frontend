import { z } from "zod";
import { evaluarReglasPassword } from "./reglasPassword";

const registroSchema = z.object({
    nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
    email: z.email({ message: "El formato del correo es inválido" }),
    // Las reglas viven en reglasPassword.ts. Cada regla que falla se reporta con
    // su nombre como mensaje ("length", "upper", "number"), que es lo que lee
    // validarFormulario para armar el checklist.
    password: z.string().superRefine((password, ctx) => {
        for (const [regla, cumple] of Object.entries(evaluarReglasPassword(password))) {
            if (!cumple) ctx.addIssue({ code: "custom", message: regla });
        }
    }),
});

export type DatosRegistro = z.infer<typeof registroSchema>;

export function validarFormulario(datos: Record<string, string>) {
    const resultado = registroSchema.safeParse(datos);

    if (resultado.success) {
        return {
            exito: true,
            erroresCampos: {},
            reglasPassword: { length: true, upper: true, number: true },
        };
    }

    // 🚀 Extraemos los errores con el método estándar de Zod v3
    const fieldErrors = resultado.error.flatten().fieldErrors;

    // 1. Extraemos los errores de la contraseña principal para el checklist (Booleanos)
    const passErrors = fieldErrors.password || [];
    const passwordErrorsSet = new Set(passErrors);

    const reglasPassword = {
        length: !passwordErrorsSet.has("length"),
        upper: !passwordErrorsSet.has("upper"),
        number: !passwordErrorsSet.has("number"),
    };

    // 2. Construimos el diccionario de errores visuales (Textos Rojos)
    const erroresCampos: Record<string, string[]> = {};

    if (fieldErrors.nombre) erroresCampos.nombre = fieldErrors.nombre;
    if (fieldErrors.email) erroresCampos.email = fieldErrors.email;

    return {
        exito: false,
        erroresCampos,
        reglasPassword,
    };
}