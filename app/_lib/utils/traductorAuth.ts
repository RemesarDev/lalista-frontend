import type { AuthType } from "../auth";

type BetterAuthErrorCode = keyof AuthType["$ERROR_CODES"];

type ErrorAuthLike = {
    message?: string;
    status?: number;
    statusCode?: number;
    code?: BetterAuthErrorCode | string;
    body?: {
        message?: string;
        code?: BetterAuthErrorCode | string;
    };
};

const mensajesPorCodigo = {
    INVALID_EMAIL: "El formato del correo electrónico no es válido.",
    INVALID_PASSWORD: "La contraseña no es válida o no cumple los requisitos.",
    INVALID_EMAIL_OR_PASSWORD: "El correo o la contraseña son incorrectos.",
    USER_ALREADY_EXISTS: "Este correo ya está registrado. Probá iniciando sesión.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Este correo ya está registrado. Usá otro email.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "El correo o la contraseña son incorrectos.",
    USER_NOT_FOUND: "No encontramos una cuenta con ese correo.",
} satisfies Partial<Record<BetterAuthErrorCode, string>>;

function obtenerCodigoError(errorAuth: ErrorAuthLike): BetterAuthErrorCode | string | undefined {
    return errorAuth.body?.code ?? errorAuth.code;
}

function esCodigoTraducible(
    codigo: BetterAuthErrorCode | string | undefined,
): codigo is keyof typeof mensajesPorCodigo {
    return typeof codigo === "string" && codigo in mensajesPorCodigo;
}

export function traducirErrorAuth(errorAuth?: unknown): string {
    if (!errorAuth) return "Ocurrió un error inesperado. Por favor, intentá de nuevo.";

    const errorNormalizado = typeof errorAuth === "string"
        ? { message: errorAuth }
        : errorAuth as ErrorAuthLike;

    const codigoError = obtenerCodigoError(errorNormalizado);
    if (esCodigoTraducible(codigoError)) {
        return mensajesPorCodigo[codigoError];
    }

    const mensaje = `${errorNormalizado.message || ""} ${errorNormalizado.body?.message || ""} ${errorNormalizado.code || ""} ${errorNormalizado.body?.code || ""}`.toLowerCase();
    const status = errorNormalizado.status ?? errorNormalizado.statusCode;

    if (status === 401 || mensaje.includes("unauthorized") || mensaje.includes("invalid credentials")) {
        return "El correo o la contraseña son incorrectos.";
    }

    if (mensaje.includes("already exists") || mensaje.includes("user already exists")) {
        return "Este correo ya está registrado. Probá iniciando sesión.";
    }
    if (mensaje.includes("invalid email")) {
        return "El formato del correo electrónico no es válido.";
    }
    if (mensaje.includes("invalid password") || mensaje.includes("password too short") || mensaje.includes("password too long")) {
        return "La contraseña no es válida o no cumple los requisitos.";
    }

    // Fallback por si Better Auth manda un error que no mapeamos
    return "Ocurrió un problema con la autenticación. Intentá de nuevo.";
}