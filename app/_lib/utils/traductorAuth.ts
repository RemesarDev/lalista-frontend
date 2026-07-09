export function traducirErrorAuth(mensajeAPI: string | undefined): string {
    if (!mensajeAPI) return "Ocurrió un error inesperado. Por favor, intentá de nuevo.";

    const mensaje = mensajeAPI.toLowerCase();

    // Diccionario de errores de Better Auth
    if (mensaje.includes("already exists")) {
        return "Este correo ya está registrado. Probá iniciando sesión.";
    }
    if (mensaje.includes("invalid email")) {
        return "El formato del correo electrónico no es válido.";
    }
    if (mensaje.includes("password")) {
        return "La contraseña no es válida o no cumple los requisitos.";
    }
    if (mensaje.includes("invalid credentials")) {
        return "El correo o la contraseña son incorrectos.";
    }

    // Fallback por si Better Auth manda un error que no mapeamos
    return "Ocurrió un problema con la autenticación. Intentá de nuevo.";
}