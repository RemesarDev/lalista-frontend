import { useState } from "react";
import { validarFormulario } from "@/app/_lib/utils/validarRegistro";

export function useSignupForm() {
    // 1. Estados Locales de React
    const [form, setForm] = useState({ nombre: "", email: "", password: "" });
    const [erroresTexto, setErroresTexto] = useState<Record<string, string[]>>({});
    const [reglasPass, setReglasPass] = useState({ length: false, upper: false, number: false });

    const limpiarCampo = (campo: string) => {
        setErroresTexto((prev) => {
            if (!prev[campo]) return prev;
            const copia = { ...prev };
            delete copia[campo];
            return copia;
        });
    };

    // 2. Manejador de Inputs (evalua las reglas de la contraseña en tiempo real)
    const manejarInput = (campo: keyof typeof form, valor: string) => {
        // Actualizamos el form derivando del valor actual
        const nuevoForm = { ...form, [campo]: valor };
        setForm(nuevoForm);
        limpiarCampo(campo);

        if (campo === "password") {
            setReglasPass(validarFormulario(nuevoForm).reglasPassword);
        }
    };

    // 3. Validador final para el Submit
    const validarSubmit = () => {
        setErroresTexto({});
        const resultado = validarFormulario(form);

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
