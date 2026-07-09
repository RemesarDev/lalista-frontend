import { z } from "zod";

const registroSchema = z
    .object({
        nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
        email: z.email({ message: "El formato del correo es inválido" }),
        password: z.string()
            .min(8, { message: "length" })
            .regex(/[A-Z]/, { message: "upper" })
            .regex(/[0-9]/, { message: "number" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
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
    if (fieldErrors.confirmPassword) erroresCampos.confirmPassword = fieldErrors.confirmPassword;

    return {
        exito: false,
        erroresCampos,
        reglasPassword,
    };
}