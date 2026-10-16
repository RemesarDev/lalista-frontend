// =============================================================================
// Redaccion de secretos antes de mandar algo a analiticas (hallazgo GK-02)
// =============================================================================
// AnalyticsTracker registraba cada page view con el query string completo. El
// link del mail de "olvide mi contraseña" aterriza en
// /restablecer-contrasena?token=<token de reset>, asi que el token quedaba
// guardado en analytics_events.metadata.path y se podia buscar desde
// /admin/metrics (filtro "path"). Con ese token, cualquiera que lea la tabla
// le cambia la clave al dueño mientras no lo haya usado (vence en 1 h).
//
// Se usa en los dos lados:
//   - cliente (AnalyticsTracker): el token no sale del navegador;
//   - servidor (POST /api/analytics): cubre clientes viejos, el JS cacheado
//     por el service worker y a quien le pegue directo al endpoint.
// =============================================================================

export const VALOR_REDACTADO = 'REDACTADO';

// Nombres de parametro que nunca se registran. Comparacion exacta y sin
// distinguir mayusculas: "q", "categoria" o "modo" siguen intactos.
const CLAVES_SENSIBLES = new Set([
    'token',
    'code',
    'otp',
    'password',
    'secret',
    'key',
    'signature',
    'sig',
    'access_token',
    'refresh_token',
    'id_token',
]);

const PATRON_PARAM = new RegExp(
    `([?&](?:${[...CLAVES_SENSIBLES].join('|')})=)[^&#\\s"'<>]*`,
    'gi',
);

// Better Auth tambien manda el token como segmento de ruta en el link del
// mail: /api/auth/reset-password/<token>?callbackURL=...
const PATRON_SEGMENTO = /(\/reset-password\/)[^/?#\s"'<>]+/gi;

/** Redacta tokens y claves dentro de cualquier texto (URLs en mensajes de error, etc.). */
export function redactarSecretosEnTexto(texto: string): string {
    return texto
        .replace(PATRON_PARAM, `$1${VALOR_REDACTADO}`)
        .replace(PATRON_SEGMENTO, `$1${VALOR_REDACTADO}`);
}

/** Version para rutas de page view: "/restablecer-contrasena?token=abc&x=1" -> "...?token=REDACTADO&x=1". */
export function limpiarRutaParaAnalitica(ruta: string): string {
    return redactarSecretosEnTexto(ruta);
}

/**
 * Recorre la metadata (objetos y arrays anidados) y redacta los strings.
 * Ademas, si una clave de la metadata se llama como un secreto ("token",
 * "password"...), su valor se reemplaza entero.
 */
export function redactarMetadata<T>(valor: T, profundidad = 0): T {
    if (profundidad > 5) return valor;
    if (typeof valor === 'string') return redactarSecretosEnTexto(valor) as T;
    if (Array.isArray(valor)) return valor.map((v) => redactarMetadata(v, profundidad + 1)) as T;
    if (valor && typeof valor === 'object') {
        const salida: Record<string, unknown> = {};
        for (const [clave, v] of Object.entries(valor as Record<string, unknown>)) {
            salida[clave] = CLAVES_SENSIBLES.has(clave.toLowerCase())
                ? VALOR_REDACTADO
                : redactarMetadata(v, profundidad + 1);
        }
        return salida as T;
    }
    return valor;
}
