import { useState } from "react";
import { usePrefetch } from "./usePrefetch";

export function useSignupForm() {
    // 1. Estados Locales de React
    const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmPassword: "" });
    const [erroresTexto, setErroresTexto] = useState<Record<string, string[]>>({});
    const [reglasPass, setReglasPass] = useState({ length: false, upper: false, number: false });

    // 2. Precarga de Zod en segundo plano
    const obtenerValidador = usePrefetch(() => import("@/app/_lib/utils/validarRegistro"));

    const limpiarCampo = (campo: string) => {
        setErroresTexto((prev) => {
            if (!prev[campo]) return prev;
            const copia = { ...prev };
            delete copia[campo];
            return copia;
        });
    };

    // 3. Manejador de Inputs (Asíncrono para evaluar reglas en tiempo real)
    const manejarInput = async (campo: keyof typeof form, valor: string) => {
        // Actualizamos el form derivando del valor actual
        const nuevoForm = { ...form, [campo]: valor };
        setForm(nuevoForm);
        limpiarCampo(campo);

        // Solo necesitamos evaluar Zod en tiempo real para las contraseñas
        if (campo === "password" || campo === "confirmPassword") {
            const modulo = await obtenerValidador();
            const resultado = modulo.validarFormulario(nuevoForm);
            setReglasPass(resultado.reglasPassword);
        }
    };

    // 4. Validador final para el Submit
    const validarSubmit = async () => {
        setErroresTexto({});
        const modulo = await obtenerValidador();
        const resultado = modulo.validarFormulario(form);

        if (!resultado.exito) {
            setErroresTexto(resultado.erroresCampos);
            setReglasPass(resultado.reglasPassword);
            return false; // Bloquea el envío
        }

        return true; // Da luz verde para enviar a la API (Zustand)
    };

    return {
        form,
        erroresTexto,
        reglasPass,
        manejarInput,
        validarSubmit,
    };
}